import { useState, useEffect } from 'react';
import { sampleAgents } from './data/sampleAgents';
import { sampleProjects } from './data/sampleProjects';
import { incidentTemplates } from './data/incidentTemplates';
import { strategies } from './data/strategies';
import { achievements } from './data/achievements';
import { runSprint } from './domain/simulation';
import { createRNG } from './domain/random';
import {
  createInitialGameState,
  processPostSprint,
  checkUnlocks
} from './domain/gameEngine';
import { checkAchievement } from './domain/achievement';
import {
  saveToSlot,
  deleteSlot,
  getAutosaveConfig,
  getSaveSlotsMetadata,
  setAutosaveConfig
} from './domain/saveSystem';
import type { AutosaveConfig } from './domain/saveSystem';
import type { GameState } from './domain/gameState';
import type { Achievement } from './domain/achievement';
import type { SprintResult } from './domain/simulation';
import type { Agent } from './domain/agent';
import type { Project } from './domain/project';
import type { Strategy } from './domain/strategy';
import type { RNG } from './domain/random';

import { generateTeamEvent } from './domain/relations/events';
import type { PendingTeamEvent, TeamEventResult } from './domain/relations/events';
import { RelationsManager } from './domain/relations/manager';
import { TeamEventDialog } from './components/TeamEventDialog';

// Components
import { AgentCard } from './components/AgentCard';
import { ProjectCard } from './components/ProjectCard';
import { StrategySelector } from './components/StrategySelector';
import { ResultReport } from './components/ResultReport';
import { HistoryPanel } from './components/HistoryPanel';
import { CompanyDashboard } from './components/CompanyDashboard';
import { GameOverScreen } from './components/GameOverScreen';
import { AchievementToast } from './components/AchievementToast';
import { AchievementPanel } from './components/AchievementPanel';
import { RelationsNetwork } from './components/RelationsNetwork';
import { SaveManager } from './components/SaveManager';

import './App.css';

export default function App() {
  const [currentSlotId, setCurrentSlotId] = useState<string | null>(null);
  const [isSaveManagerOpen, setIsSaveManagerOpen] = useState(false);
  const [isStartup, setIsStartup] = useState(true);
  const [autosaveConfig, setAutosaveConfigState] = useState(() => getAutosaveConfig());

  const [gameState, setGameState] = useState<GameState>(() => {
    return createInitialGameState(sampleAgents, sampleProjects);
  });

  const [selectedAgentIds, setSelectedAgentIds] = useState<Set<string>>(new Set());
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedStrategyId, setSelectedStrategyId] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<SprintResult | null>(null);

  // States for notifications and celebration
  const [toastQueue, setToastQueue] = useState<Achievement[]>([]);
  const [newlyUnlockedAgents, setNewlyUnlockedAgents] = useState<Array<{ name: string; avatar: string }>>([]);
  const [projectCompleted, setProjectCompleted] = useState(false);
  const [projectBonus, setProjectBonus] = useState(0);

  // Event system state
  const [pendingEvent, setPendingEvent] = useState<PendingTeamEvent | null>(null);
  const [sprintContext, setSprintContext] = useState<{
    chosenAgents: Agent[];
    project: Project;
    strategy: Strategy;
    rng: RNG;
  } | null>(null);

  // Automatically save game whenever gameState changes and a slot is active
  useEffect(() => {
    if (currentSlotId) {
      try {
        // Query current name if exists
        const savedSlots = getSaveSlotsMetadata();
        const activeSlot = savedSlots.find(s => s.id === currentSlotId);
        const name = activeSlot?.name || (currentSlotId === 'auto' ? '自动存档' : `存档位 ${currentSlotId}`);
        saveToSlot(currentSlotId, name, gameState);
      } catch (e) {
        console.error('Failed to auto-save to current slot', e);
      }
    }
  }, [gameState, currentSlotId]);

  // Periodic autosave loop using separate auto slot
  useEffect(() => {
    if (!autosaveConfig.enabled || !currentSlotId || gameState.gameOver) {
      return;
    }

    const intervalMs = autosaveConfig.interval * 60 * 1000;
    const timer = setInterval(() => {
      try {
        saveToSlot('auto', '自动存档', gameState);
      } catch (e) {
        console.error('Autosave failed', e);
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [autosaveConfig.enabled, autosaveConfig.interval, currentSlotId, gameState]);

  function toggleAgent(id: string) {
    const agent = gameState.agents.find(a => a.id === id);
    if (agent?.locked) return; // Locked agents cannot be selected

    setSelectedAgentIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleRunSprint() {
    if (selectedAgentIds.size === 0 || !selectedProjectId || !selectedStrategyId) return;

    const chosenAgents = gameState.agents.filter(a => selectedAgentIds.has(a.id));
    const project = gameState.projects.find(p => p.id === selectedProjectId)!;
    const strategy = strategies.find(s => s.id === selectedStrategyId)!;
    // eslint-disable-next-line react-hooks/purity
    const rng = createRNG(Date.now());

    // Check for random team event BEFORE sprint starts
    const event = generateTeamEvent(gameState.agents.filter(a => !a.locked), rng);

    if (event) {
      setPendingEvent(event);
      setSprintContext({ chosenAgents, project, strategy, rng });
      return; // Pause sprint execution until event is resolved
    }

    // No event, proceed normally
    executeSprint(chosenAgents, project, strategy, rng, null);
  }

  function handleEventResolve(eventResult: TeamEventResult) {
    setPendingEvent(null);
    if (sprintContext) {
      const { chosenAgents, project, strategy, rng } = sprintContext;
      executeSprint(chosenAgents, project, strategy, rng, eventResult);
      setSprintContext(null);
    }
  }

  function executeSprint(
    chosenAgents: Agent[],
    project: Project,
    strategy: Strategy,
    rng: RNG,
    eventResult: TeamEventResult | null
  ) {
    // 1. Run simulation
    const result = runSprint(gameState.sprintCount + 1, chosenAgents, project, strategy, incidentTemplates, rng);

    const relationsManager = new RelationsManager(gameState.relations || []);

    // Apply event results to sprint outcome if there was one
    if (eventResult) {
      result.moraleDelta += eventResult.moraleDelta;
      result.project.progress = Math.min(result.project.maxProgress, result.project.progress + eventResult.progressDelta);
      result.project.bugs += Math.max(0, eventResult.bugsDelta);
      result.summary += ` | Event resolved: ${eventResult.message}`;
    }

    // Apply relations multiplier
    const collabMultiplier = relationsManager.getCollaborationMultiplier(chosenAgents.map(a => a.id));
    result.project.progress = Math.round(result.project.progress * collabMultiplier);

    // 2. Determine if project was completed in this sprint
    const isProjCompletedNow = result.project.progress >= result.project.maxProgress &&
      !gameState.completedProjectIds.includes(project.id);
    const bonus = project.difficulty * 20;

    // 3. Process new state
    const newState = processPostSprint(gameState, result, Array.from(selectedAgentIds));

    if (eventResult) {
       newState.funds += eventResult.fundsDelta;
    }

    // Save relations back to state
    newState.relations = relationsManager.getRelations();

    // After a successful project, increase relations among participants
    if (isProjCompletedNow) {
       for (let i = 0; i < chosenAgents.length; i++) {
         for (let j = i + 1; j < chosenAgents.length; j++) {
            relationsManager.updateRelation(chosenAgents[i].id, chosenAgents[j].id, 5);
         }
       }
       newState.relations = relationsManager.getRelations();
    }

    // 4. Check for newly unlocked agents
    const newlyUnlockedIds = checkUnlocks(newState);
    const unlockedAgentDetails: Array<{ name: string; avatar: string }> = [];

    if (newlyUnlockedIds.length > 0) {
      newState.agents = newState.agents.map(a => {
        if (newlyUnlockedIds.includes(a.id)) {
          unlockedAgentDetails.push({ name: a.name, avatar: a.avatar });
          return { ...a, locked: false };
        }
        return a;
      });
    }

    // 5. Check achievements
    const cheapestAgentOnly = isProjCompletedNow && chosenAgents.every(a => a.salary <= 80);
    const achievementContext = {
      completedProjectIds: newState.completedProjectIds,
      currentSprintBugs: result.bugsDelta,
      fundsRemaining: newState.funds,
      totalFundsSpent: newState.history.reduce((sum, h) => sum + h.cost, 0),
      agents: newState.agents.map(a => ({
        morale: a.morale,
        locked: a.locked,
        salary: a.salary,
        consecutiveSprints: a.consecutiveSprints,
        skills: a.skills,
      })),
      sprintCount: newState.sprintCount,
      projectsInOneGame: newState.completedProjectIds.length,
      history: newState.history.map(h => ({
        bugsDelta: h.bugsDelta,
        progressDelta: h.progressDelta,
      })),
      cheapestAgentOnly,
    };

    const newAchievementsUnlocked: Achievement[] = [];
    const newUnlockedIds = [...newState.unlockedAchievementIds];

    for (const ach of achievements) {
      if (!newState.unlockedAchievementIds.includes(ach.id)) {
        if (checkAchievement(ach, achievementContext)) {
          newAchievementsUnlocked.push(ach);
          newUnlockedIds.push(ach.id);
        }
      }
    }

    if (newAchievementsUnlocked.length > 0) {
      newState.unlockedAchievementIds = newUnlockedIds;
      setToastQueue(prev => [...prev, ...newAchievementsUnlocked]);
    }

    // 6. Update local states
    setProjectCompleted(isProjCompletedNow);
    setProjectBonus(isProjCompletedNow ? bonus : 0);
    setNewlyUnlockedAgents(unlockedAgentDetails);
    setLastResult(result);
    setGameState(newState);

    // Clear agent selection (non-locked agents can still be selected next turn)
    setSelectedAgentIds(new Set());
  }

  function handleLoadGame(loadedState: GameState, slotId: string) {
    setGameState(loadedState);
    setCurrentSlotId(slotId);
    setIsStartup(false);
    setIsSaveManagerOpen(false);

    setSelectedAgentIds(new Set());
    setSelectedProjectId(null);
    setSelectedStrategyId(null);
    setLastResult(null);
  }

  function handleNewGame(slotId: string) {
    const initialState = createInitialGameState(sampleAgents, sampleProjects);
    saveToSlot(slotId, `存档位 ${slotId}`, initialState);
    setGameState(initialState);
    setCurrentSlotId(slotId);
    setIsStartup(false);
    setIsSaveManagerOpen(false);

    setSelectedAgentIds(new Set());
    setSelectedProjectId(null);
    setSelectedStrategyId(null);
    setLastResult(null);
  }

  const handleUpdateAutosaveConfig = (newConfig: AutosaveConfig) => {
    setAutosaveConfigState(newConfig);
    setAutosaveConfig(newConfig);
  };

  function handleReset() {
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
  }

  const canRun = selectedAgentIds.size > 0 && selectedProjectId && selectedStrategyId && !gameState.gameOver && !pendingEvent;

  return (
    <div className="app">
      {pendingEvent && (
        <TeamEventDialog
          event={pendingEvent}
          agents={gameState.agents}
          relationsManager={new RelationsManager(gameState.relations || [])}
          onResolve={handleEventResolve}
        />
      )}

      <header className="app-header">
        <h1>AI Manager Tycoon</h1>
        <p className="subtitle">Manage your AI engineering team. Try not to ship too many bugs.</p>
      </header>

      {/* 2. Company Dashboard */}
      <CompanyDashboard gameState={gameState} />

      {/* 4. Achievement Toast System */}
      {toastQueue.length > 0 && (
        <AchievementToast
          key={toastQueue[0].id}
          achievement={toastQueue[0]}
          onClose={() => setToastQueue(q => q.slice(1))}
        />
      )}

      {/* 3. Game Over Screen Overlay */}
      {gameState.gameOver && (
        <GameOverScreen gameState={gameState} onReset={handleReset} />
      )}

      <main className="app-main">
        <div className="header-actions" style={{ justifyContent: 'flex-end', marginBottom: '16px', gap: '12px' }}>
          <button className="btn-saves-trigger" onClick={() => setIsSaveManagerOpen(true)}>
            📁 存档管理
          </button>
          <button className="btn-reset" onClick={handleReset}>Reset Game</button>
        </div>

        <section className="panel team-panel">
          <h2>Team <span className="count">({selectedAgentIds.size} selected)</span></h2>
          <div className="card-grid">
            {gameState.agents.map(a => (
              <AgentCard
                key={a.id}
                agent={a}
                selected={selectedAgentIds.has(a.id)}
                onToggle={toggleAgent}
              />
            ))}
          </div>
          <RelationsNetwork agents={gameState.agents} relations={gameState.relations || []} />
        </section>

        <section className="panel project-panel">
          <h2>Projects</h2>
          <div className="card-grid">
            {gameState.projects.map(p => {
              const isCompleted = gameState.completedProjectIds.includes(p.id);
              return (
                <ProjectCard
                  key={p.id}
                  project={p}
                  selected={selectedProjectId === p.id}
                  onSelect={isCompleted ? () => {} : setSelectedProjectId}
                />
              );
            })}
          </div>
        </section>

        <section className="panel strategy-panel">
          <h2>Strategy</h2>
          <StrategySelector
            strategies={strategies}
            selectedId={selectedStrategyId}
            onSelect={setSelectedStrategyId}
          />
        </section>

        <div className="action-bar">
          <button
            className="btn-run"
            disabled={!canRun}
            onClick={handleRunSprint}
          >
            Run Sprint
          </button>
        </div>

        {lastResult && (
          <section className="panel result-panel">
            <ResultReport
              result={lastResult}
              projectCompleted={projectCompleted}
              projectBonus={projectBonus}
              newlyUnlockedAgents={newlyUnlockedAgents}
            />
          </section>
        )}

        <section className="panel history-panel-wrapper">
          <HistoryPanel history={gameState.history} />
        </section>

        {/* 5. Achievement Panel */}
        <AchievementPanel unlockedAchievementIds={gameState.unlockedAchievementIds} gameState={gameState} />
      </main>

      <SaveManager
        gameState={gameState}
        onLoadGame={handleLoadGame}
        onNewGame={handleNewGame}
        isOpen={isSaveManagerOpen}
        onClose={() => setIsSaveManagerOpen(false)}
        isStartup={isStartup}
        autosaveConfig={autosaveConfig}
        onUpdateAutosaveConfig={handleUpdateAutosaveConfig}
      />
    </div>
  );
}
