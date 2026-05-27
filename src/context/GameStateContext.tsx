/**
 * 集中游戏状态管理 Context
 * 将 App.tsx 中分散的 useState 统一到单一 Context，方便子组件按需消费
 */

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { GameState } from '../domain/gameState';
import type { Achievement } from '../domain/achievement';
import type { SprintResult } from '../domain/simulation';
import type { Agent } from '../domain/agent';
import type { Project } from '../domain/project';
import type { Strategy } from '../domain/strategy';
import type { RNG } from '../domain/random';
import type { AutosaveConfig } from '../domain/saveSystem';
import type { PendingTeamEvent } from '../domain/relations/events';
import type { MainSectionId } from '../components/MobileSectionNav';

import { sampleAgents } from '../data/sampleAgents';
import { sampleProjects } from '../data/sampleProjects';
import { createInitialGameState } from '../domain/gameEngine';
import {
  saveToSlot,
  deleteSlot,
  getAutosaveConfig as loadAutosaveConfig,
  getSaveSlotsMetadata,
  setAutosaveConfig as persistAutosaveConfig,
} from '../domain/saveSystem';

// ====== Context 值类型 ======

export type MobileOverlayId = 'team' | 'project' | 'strategy' | 'achievements' | 'history';

export interface GameStateContextValue {
  // 核心游戏状态
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;

  // 存档相关
  currentSlotId: string | null;
  setCurrentSlotId: (id: string | null) => void;
  autosaveConfig: AutosaveConfig;
  handleUpdateAutosaveConfig: (config: AutosaveConfig) => void;
  isSaveManagerOpen: boolean;
  setIsSaveManagerOpen: (open: boolean) => void;
  isStartup: boolean;
  setIsStartup: (v: boolean) => void;

  // 选择状态
  selectedAgentIds: Set<string>;
  setSelectedAgentIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;
  selectedStrategyId: string | null;
  setSelectedStrategyId: (id: string | null) => void;

  // Sprint 结果
  lastResult: SprintResult | null;
  setLastResult: (r: SprintResult | null) => void;

  // 事件系统
  pendingEvent: PendingTeamEvent | null;
  setPendingEvent: (e: PendingTeamEvent | null) => void;
  sprintContext: SprintContext | null;
  setSprintContext: (ctx: SprintContext | null) => void;

  // 通知 / 成就
  toastQueue: Achievement[];
  setToastQueue: React.Dispatch<React.SetStateAction<Achievement[]>>;
  newlyUnlockedAgents: Array<{ name: string; avatar: string }>;
  setNewlyUnlockedAgents: React.Dispatch<React.SetStateAction<Array<{ name: string; avatar: string }>>>;
  projectCompleted: boolean;
  setProjectCompleted: (v: boolean) => void;
  projectBonus: number;
  setProjectBonus: (v: number) => void;

  // UI 状态
  activeSkillTreeAgentId: string | null;
  setActiveSkillTreeAgentId: (id: string | null) => void;
  isTutorialOpen: boolean;
  setIsTutorialOpen: (v: boolean) => void;
  activeMainSection: MainSectionId;
  setActiveMainSection: (s: MainSectionId) => void;
  activeMobileOverlay: MobileOverlayId | null;
  setActiveMobileOverlay: (id: MobileOverlayId | null) => void;
  isOnline: boolean;

  // 复合操作
  handleLoadGame: (state: GameState, slotId: string) => void;
  handleNewGame: (slotId: string) => void;
  handleReset: () => void;
}

export interface SprintContext {
  chosenAgents: Agent[];
  project: Project;
  strategy: Strategy;
  rng: RNG;
}

// ====== Context 创建 ======

const GameStateContext = createContext<GameStateContextValue | null>(null);

// ====== Provider ======

interface GameStateProviderProps {
  children: ReactNode;
}

export function GameStateProvider({ children }: GameStateProviderProps) {
  // 核心游戏状态
  const [gameState, setGameState] = useState<GameState>(() =>
    createInitialGameState(sampleAgents, sampleProjects)
  );

  // 存档相关
  const [currentSlotId, setCurrentSlotId] = useState<string | null>(null);
  const [isSaveManagerOpen, setIsSaveManagerOpen] = useState(false);
  const [isStartup, setIsStartup] = useState(true);
  const [autosaveConfig, setAutosaveConfigState] = useState<AutosaveConfig>(() => loadAutosaveConfig());

  // 选择状态
  const [selectedAgentIds, setSelectedAgentIds] = useState<Set<string>>(new Set());
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedStrategyId, setSelectedStrategyId] = useState<string | null>(null);

  // Sprint 结果
  const [lastResult, setLastResult] = useState<SprintResult | null>(null);

  // 事件系统
  const [pendingEvent, setPendingEvent] = useState<PendingTeamEvent | null>(null);
  const [sprintContext, setSprintContext] = useState<SprintContext | null>(null);

  // 通知 / 成就
  const [toastQueue, setToastQueue] = useState<Achievement[]>([]);
  const [newlyUnlockedAgents, setNewlyUnlockedAgents] = useState<Array<{ name: string; avatar: string }>>([]);
  const [projectCompleted, setProjectCompleted] = useState(false);
  const [projectBonus, setProjectBonus] = useState(0);

  // UI 状态
  const [activeSkillTreeAgentId, setActiveSkillTreeAgentId] = useState<string | null>(null);
  const [isTutorialOpen, setIsTutorialOpen] = useState(true);
  const [activeMainSection, setActiveMainSection] = useState<MainSectionId>('team');
  const [activeMobileOverlay, setActiveMobileOverlay] = useState<MobileOverlayId | null>(null);
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // 网络状态监听
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 自动保存：每当 gameState 变化且有活跃存档位时自动保存
  useEffect(() => {
    if (currentSlotId) {
      try {
        const savedSlots = getSaveSlotsMetadata();
        const activeSlot = savedSlots.find(s => s.id === currentSlotId);
        const name = activeSlot?.name || (currentSlotId === 'auto' ? '自动存档' : `存档位 ${currentSlotId}`);
        saveToSlot(currentSlotId, name, gameState, {
          reputationScore: gameState.reputationScore,
          quarterlyEvaluations: gameState.quarterlyEvaluations,
          triggeredCheckpoints: gameState.triggeredCheckpoints,
        });
      } catch (e) {
        console.error('Failed to auto-save to current slot', e);
      }
    }
  }, [gameState, currentSlotId]);

  // 定期自动存档
  useEffect(() => {
    if (!autosaveConfig.enabled || !currentSlotId || gameState.gameOver) return;

    const intervalMs = autosaveConfig.interval * 60 * 1000;
    const timer = setInterval(() => {
      try {
        saveToSlot('auto', '自动存档', gameState, {
          reputationScore: gameState.reputationScore,
          quarterlyEvaluations: gameState.quarterlyEvaluations,
          triggeredCheckpoints: gameState.triggeredCheckpoints,
        });
      } catch (e) {
        console.error('Autosave failed', e);
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [autosaveConfig.enabled, autosaveConfig.interval, currentSlotId, gameState]);

  // 复合操作
  const handleUpdateAutosaveConfig = useCallback((newConfig: AutosaveConfig) => {
    setAutosaveConfigState(newConfig);
    persistAutosaveConfig(newConfig);
  }, []);

  const handleLoadGame = useCallback((loadedState: GameState, slotId: string) => {
    setGameState(loadedState);
    setCurrentSlotId(slotId);
    setIsStartup(false);
    setIsSaveManagerOpen(false);
    setSelectedAgentIds(new Set());
    setSelectedProjectId(null);
    setSelectedStrategyId(null);
    setLastResult(null);
  }, []);

  const handleNewGame = useCallback((slotId: string) => {
    const initialState = createInitialGameState(sampleAgents, sampleProjects);
    initialState.reputationScore = 0;
    initialState.quarterlyEvaluations = [];
    initialState.triggeredCheckpoints = [];
    saveToSlot(slotId, `存档位 ${slotId}`, initialState, {
      reputationScore: 0,
      quarterlyEvaluations: [],
      triggeredCheckpoints: [],
    });
    setGameState(initialState);
    setCurrentSlotId(slotId);
    setIsStartup(false);
    setIsSaveManagerOpen(false);
    setSelectedAgentIds(new Set());
    setSelectedProjectId(null);
    setSelectedStrategyId(null);
    setLastResult(null);
  }, []);

  const handleReset = useCallback(() => {
    if (currentSlotId) {
      deleteSlot(currentSlotId);
    }
    setCurrentSlotId(null);
    setIsStartup(true);
    setIsSaveManagerOpen(false);
    setGameState(createInitialGameState(sampleAgents, sampleProjects));
    setSelectedAgentIds(new Set());
    setSelectedProjectId(null);
    setSelectedStrategyId(null);
    setLastResult(null);
    setToastQueue([]);
    setNewlyUnlockedAgents([]);
    setProjectCompleted(false);
    setProjectBonus(0);
    setPendingEvent(null);
  }, [currentSlotId]);

  const value: GameStateContextValue = {
    gameState,
    setGameState,
    currentSlotId,
    setCurrentSlotId,
    autosaveConfig,
    handleUpdateAutosaveConfig,
    isSaveManagerOpen,
    setIsSaveManagerOpen,
    isStartup,
    setIsStartup,
    selectedAgentIds,
    setSelectedAgentIds,
    selectedProjectId,
    setSelectedProjectId,
    selectedStrategyId,
    setSelectedStrategyId,
    lastResult,
    setLastResult,
    pendingEvent,
    setPendingEvent,
    sprintContext,
    setSprintContext,
    toastQueue,
    setToastQueue,
    newlyUnlockedAgents,
    setNewlyUnlockedAgents,
    projectCompleted,
    setProjectCompleted,
    projectBonus,
    setProjectBonus,
    activeSkillTreeAgentId,
    setActiveSkillTreeAgentId,
    isTutorialOpen,
    setIsTutorialOpen,
    activeMainSection,
    setActiveMainSection,
    activeMobileOverlay,
    setActiveMobileOverlay,
    isOnline,
    handleLoadGame,
    handleNewGame,
    handleReset,
  };

  return (
    <GameStateContext.Provider value={value}>
      {children}
    </GameStateContext.Provider>
  );
}

// ====== Hook ======

export function useGameState(): GameStateContextValue {
  const ctx = useContext(GameStateContext);
  if (!ctx) {
    throw new Error('useGameState must be used within a GameStateProvider');
  }
  return ctx;
}
