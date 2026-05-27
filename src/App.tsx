import { useCallback, Suspense } from 'react';
import { strategies } from './data/strategies';
import { achievements } from './data/achievements';
import { incidentTemplates } from './data/incidentTemplates';
import { runSprint } from './domain/simulation';
import { createRNG } from './domain/random';
import {
  processPostSprint,
  checkUnlocks
} from './domain/gameEngine';
import { getDifficultyReward } from './domain/project';
import { unlockSkill } from './domain/skillTreeLogic';
import { checkAchievement } from './domain/achievement';
import {
  generateQuarterTarget,
  evaluateQuarterTarget,
  getQuarterNumber,
  isQuarterEnd
} from './domain/quarterlyTarget';
import { calculateNewReputation } from './domain/reputation';
import {
  getDefaultCheckpoints,
  getCheckpointsForQuarter,
  evaluateQuarterCheckpoints
} from './domain/financing';
import { calculateRating } from './domain/rating';
import type { Achievement } from './domain/achievement';
import type { Agent } from './domain/agent';
import type { Project } from './domain/project';
import type { Strategy } from './domain/strategy';
import type { RNG } from './domain/random';

import { generateTeamEvent } from './domain/relations/events';
import type { TeamEventResult } from './domain/relations/events';
import { RelationsManager } from './domain/relations/manager';

// Context
import { useGameState, type MobileOverlayId } from './context/GameStateContext';

// Components
import { AgentCard } from './components/AgentCard';
import { ProjectCard } from './components/ProjectCard';
import { StrategySelector } from './components/StrategySelector';
import { CompanyDashboard } from './components/CompanyDashboard';
import { QuarterlyGoalsPanel } from './components/QuarterlyGoalsPanel';
import { AchievementToast } from './components/AchievementToast';
import { RelationsNetwork } from './components/RelationsNetwork';
import { MobileSectionNav } from './components/MobileSectionNav';
import { ErrorBoundary } from './components/ErrorBoundary';
import { lazyWithRetry } from './utils/lazyWithRetry';

const TeamEventDialog = lazyWithRetry(() => import('./components/TeamEventDialog').then(m => ({ default: m.TeamEventDialog })));
const SkillTreeModal = lazyWithRetry(() => import('./components/SkillTreeModal').then(m => ({ default: m.SkillTreeModal })));
const ResultReport = lazyWithRetry(() => import('./components/ResultReport').then(m => ({ default: m.ResultReport })));
const HistoryPanel = lazyWithRetry(() => import('./components/HistoryPanel').then(m => ({ default: m.HistoryPanel })));
const GameOverScreen = lazyWithRetry(() => import('./components/GameOverScreen').then(m => ({ default: m.GameOverScreen })));
const AchievementPanel = lazyWithRetry(() => import('./components/AchievementPanel').then(m => ({ default: m.AchievementPanel })));
const SaveManager = lazyWithRetry(() => import('./components/SaveManager').then(m => ({ default: m.SaveManager })));
const TutorialGuide = lazyWithRetry(() => import('./components/TutorialGuide').then(m => ({ default: m.TutorialGuide })));

import './App.css';

const MAIN_SECTIONS = [
  { id: 'team' as const, label: '团队' },
  { id: 'project' as const, label: '项目' },
  { id: 'strategy' as const, label: '策略' },
  { id: 'result' as const, label: '结果' },
  { id: 'history' as const, label: '记录' },
];

const MOBILE_TABS: Array<{ id: MobileOverlayId; label: string }> = [
  { id: 'team', label: '团队' },
  { id: 'project', label: '项目' },
  { id: 'strategy', label: '策略' },
  { id: 'achievements', label: '成就' },
  { id: 'history', label: '历史' },
];

export default function App() {
  const {
    gameState, setGameState,
    autosaveConfig, handleUpdateAutosaveConfig,
    isSaveManagerOpen, setIsSaveManagerOpen,
    isStartup,
    selectedAgentIds, setSelectedAgentIds,
    selectedProjectId, setSelectedProjectId,
    selectedStrategyId, setSelectedStrategyId,
    lastResult, setLastResult,
    pendingEvent, setPendingEvent,
    sprintContext, setSprintContext,
    toastQueue, setToastQueue,
    newlyUnlockedAgents, setNewlyUnlockedAgents,
    projectCompleted, setProjectCompleted,
    projectBonus, setProjectBonus,
    activeSkillTreeAgentId, setActiveSkillTreeAgentId,
    isTutorialOpen, setIsTutorialOpen,
    activeMainSection, setActiveMainSection,
    activeMobileOverlay, setActiveMobileOverlay,
    isOnline,
    handleLoadGame, handleNewGame, handleReset,
  } = useGameState();

  const toggleAgent = useCallback((id: string) => {
    const agent = gameState.agents.find(a => a.id === id);
    if (agent?.locked) return;

    setSelectedAgentIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, [gameState.agents, setSelectedAgentIds]);

  const handleSelectProject = useCallback((id: string) => {
    if (!gameState.completedProjectIds.includes(id)) {
      setSelectedProjectId(id);
    }
  }, [gameState.completedProjectIds, setSelectedProjectId]);

  function handleRunSprint() {
    if (selectedAgentIds.size === 0 || !selectedProjectId || !selectedStrategyId) return;

    const chosenAgents = gameState.agents.filter(a => selectedAgentIds.has(a.id));
    const project = gameState.projects.find(p => p.id === selectedProjectId)!;
    const strategy = strategies.find(s => s.id === selectedStrategyId)!;
    const rng = createRNG(Date.now());

    const event = generateTeamEvent(gameState.agents.filter(a => !a.locked), rng);

    if (event) {
      setPendingEvent(event);
      setSprintContext({ chosenAgents, project, strategy, rng });
      return;
    }

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
    const result = runSprint(gameState.sprintCount + 1, chosenAgents, project, strategy, incidentTemplates, rng);

    const relationsManager = new RelationsManager(gameState.relations || []);

    if (eventResult) {
      result.moraleDelta += eventResult.moraleDelta;
      result.project.progress = Math.min(result.project.maxProgress, result.project.progress + eventResult.progressDelta);
      result.project.bugs += Math.max(0, eventResult.bugsDelta);
      result.summary += ` | Event resolved: ${eventResult.message}`;
    }

    const collabMultiplier = relationsManager.getCollaborationMultiplier(chosenAgents.map(a => a.id));
    result.project.progress = Math.round(result.project.progress * collabMultiplier);

    const isProjCompletedNow = result.project.progress >= result.project.maxProgress &&
      !gameState.completedProjectIds.includes(project.id);
    const bonus = getDifficultyReward(project);

    const newState = processPostSprint(gameState, result, Array.from(selectedAgentIds));

    if (eventResult) {
      newState.funds += eventResult.fundsDelta;
    }

    newState.relations = relationsManager.getRelations();

    if (isProjCompletedNow) {
      for (let i = 0; i < chosenAgents.length; i++) {
        for (let j = i + 1; j < chosenAgents.length; j++) {
          relationsManager.updateRelation(chosenAgents[i].id, chosenAgents[j].id, 5);
        }
      }
      newState.relations = relationsManager.getRelations();
    }

    const currentReputation = gameState.reputationScore ?? 0;
    const newRep = calculateNewReputation(currentReputation, result, isProjCompletedNow);
    newState.reputationScore = newRep;
    newState.quarterlyEvaluations = gameState.quarterlyEvaluations || [];
    newState.triggeredCheckpoints = gameState.triggeredCheckpoints || [];

    if (isQuarterEnd(newState.sprintCount)) {
      const qNum = getQuarterNumber(newState.sprintCount);
      const target = generateQuarterTarget(qNum);
      const evalResult = evaluateQuarterTarget(target, newState);
      newState.quarterlyEvaluations = [
        ...newState.quarterlyEvaluations,
        {
          quarterNumber: qNum,
          target,
          achieved: evalResult.achieved,
          actualValue: evalResult.actualValue
        }
      ];

      const ratingInput = {
        completedProjects: newState.completedProjectIds.length,
        totalBugs: newState.projects.reduce((sum, p) => sum + p.bugs, 0),
        totalTechDebt: newState.projects.reduce((sum, p) => sum + p.techDebt, 0),
        totalSprintsCost: newState.history.reduce((sum, h) => sum + h.cost, 0),
        fundsRemaining: newState.funds,
        sprintCount: newState.sprintCount,
      };
      const companyRating = calculateRating(ratingInput).rating;

      const checkpoints = getCheckpointsForQuarter(getDefaultCheckpoints(), qNum);
      const finResults = evaluateQuarterCheckpoints(checkpoints, newState, newRep, companyRating);

      const triggeredIds = [...newState.triggeredCheckpoints];
      let totalReward = 0;
      for (const fr of finResults) {
        if (fr.triggered) {
          totalReward += fr.reward;
          triggeredIds.push(fr.checkpoint.id);
        }
      }
      if (totalReward > 0) {
        newState.funds += totalReward;
      }
      newState.triggeredCheckpoints = triggeredIds;
    }

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

    setProjectCompleted(isProjCompletedNow);
    setProjectBonus(isProjCompletedNow ? bonus : 0);
    setNewlyUnlockedAgents(unlockedAgentDetails);
    setLastResult(result);
    setGameState(newState);

    setSelectedAgentIds(new Set());
  }

  const handleUnlockSkill = useCallback((agentId: string, skillId: string) => {
    setGameState(prev => {
      const agentToUpgrade = prev.agents.find(a => a.id === agentId);
      if (!agentToUpgrade) return prev;

      const clonedAgent = {
        ...agentToUpgrade,
        skills: { ...agentToUpgrade.skills },
        unlockedSkills: [...(agentToUpgrade.unlockedSkills || [])]
      };

      const result = unlockSkill(clonedAgent, skillId, prev.funds);
      if (!result.success) {
        alert(result.message || "解锁失败");
        return prev;
      }

      return {
        ...prev,
        funds: prev.funds - result.cost,
        agents: prev.agents.map(a => a.id === agentId ? clonedAgent : a)
      };
    });
  }, [setGameState]);

  const canRun = selectedAgentIds.size > 0 && selectedProjectId && selectedStrategyId && !gameState.gameOver && !pendingEvent;

  const showTutorialHighlight = gameState.sprintCount < 3 && isTutorialOpen;
  const highlightTeam = showTutorialHighlight && selectedAgentIds.size === 0;
  const highlightProject = showTutorialHighlight && selectedAgentIds.size > 0 && !selectedProjectId;
  const highlightStrategy = showTutorialHighlight && selectedAgentIds.size > 0 && selectedProjectId && !selectedStrategyId;
  const highlightRun = showTutorialHighlight && selectedAgentIds.size > 0 && selectedProjectId && selectedStrategyId;
  const selectedAgents = gameState.agents.filter(agent => selectedAgentIds.has(agent.id));
  const selectedProject = gameState.projects.find(project => project.id === selectedProjectId);
  const selectedStrategy = strategies.find(strategy => strategy.id === selectedStrategyId);
  const activeMobileTab = activeMobileOverlay ? MOBILE_TABS.find(tab => tab.id === activeMobileOverlay) : null;

  function renderMobileOverlayContent() {
    switch (activeMobileOverlay) {
      case 'team':
        return (
          <section className="mobile-overlay-section">
            <h3>团队 <span className="count">(已选 {selectedAgentIds.size})</span></h3>
            <div className="card-grid">
              {gameState.agents.map(a => (
                <AgentCard
                  key={a.id}
                  agent={a}
                  selected={selectedAgentIds.has(a.id)}
                  onToggle={toggleAgent}
                  onOpenSkillTree={setActiveSkillTreeAgentId}
                />
              ))}
            </div>
            <RelationsNetwork agents={gameState.agents} relations={gameState.relations || []} />
          </section>
        );
      case 'project':
        return (
          <section className="mobile-overlay-section">
            <h3>项目</h3>
            <div className="card-grid">
              {gameState.projects.map(p => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  selected={selectedProjectId === p.id}
                  onSelect={handleSelectProject}
                />
              ))}
            </div>
          </section>
        );
      case 'strategy':
        return (
          <section className="mobile-overlay-section">
            <h3>策略</h3>
            <StrategySelector
              strategies={strategies}
              selectedId={selectedStrategyId}
              onSelect={setSelectedStrategyId}
            />
          </section>
        );
      case 'achievements':
        return (
          <ErrorBoundary local>
            <Suspense fallback={<div className="panel-loading">加载成就...</div>}>
              <AchievementPanel unlockedAchievementIds={gameState.unlockedAchievementIds} gameState={gameState} />
            </Suspense>
          </ErrorBoundary>
        );
      case 'history':
        return (
          <ErrorBoundary local>
            <Suspense fallback={<div className="panel-loading">加载历史记录...</div>}>
              <HistoryPanel history={gameState.history} />
            </Suspense>
          </ErrorBoundary>
        );
      default:
        return null;
    }
  }

  return (
    <div className="app">
      {!isOnline && (
        <div className="offline-banner" style={{
          backgroundColor: 'var(--accent-red, #ef4444)',
          color: 'white',
          textAlign: 'center',
          padding: '10px 20px',
          fontSize: '0.95rem',
          fontWeight: 'bold',
          position: 'sticky',
          top: 0,
          zIndex: 1100,
          boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>📶</span>
          <span>您的网络连接已断开，正处于离线模式。在此状态下，某些组件和数据可能会加载失败，建议恢复连接后继续。</span>
        </div>
      )}

      {pendingEvent && (
        <ErrorBoundary local>
          <Suspense fallback={null}>
            <TeamEventDialog
              event={pendingEvent}
              agents={gameState.agents}
              relationsManager={new RelationsManager(gameState.relations || [])}
              onResolve={handleEventResolve}
            />
          </Suspense>
        </ErrorBoundary>
      )}

      <header className="app-header">
        <h1>AI Manager Tycoon</h1>
        <p className="subtitle">管理你的 AI 工程团队。尽量别发布太多 Bug。</p>
      </header>

      <CompanyDashboard gameState={gameState} selectedProjectId={selectedProjectId} />

      <QuarterlyGoalsPanel gameState={gameState} selectedProjectId={selectedProjectId} />

      {toastQueue.length > 0 && (
        <AchievementToast
          key={toastQueue[0].id}
          achievement={toastQueue[0]}
          onClose={() => setToastQueue(q => q.slice(1))}
        />
      )}

      {gameState.gameOver && (
        <ErrorBoundary local>
          <Suspense fallback={null}>
            <GameOverScreen gameState={gameState} onReset={handleReset} />
          </Suspense>
        </ErrorBoundary>
      )}

      <main className="app-main">
        <section className="mobile-command-center" aria-label="移动端主控台">
          <div className="mobile-command-header">
            <span>移动端主控台</span>
            <button className="btn-reset" onClick={handleReset}>重置</button>
          </div>

          <div className="mobile-selection-card">
            <h2>当前选择</h2>
            <div className="mobile-selection-row">
              <span>已选员工</span>
              <strong>{selectedAgents.length} 人</strong>
              <div className="mobile-avatar-stack" aria-label="已选员工缩略头像">
                {selectedAgents.length > 0 ? selectedAgents.map(agent => (
                  <span key={agent.id}>{agent.avatar}</span>
                )) : <span>待选</span>}
              </div>
            </div>
            <div className="mobile-selection-row">
              <span>项目</span>
              <strong>{selectedProject?.name || '待选择'}</strong>
            </div>
            <div className="mobile-selection-row">
              <span>策略</span>
              <strong>{selectedStrategy?.name || '待选择'}</strong>
            </div>
          </div>

          <button
            className={`btn-run mobile-start-sprint ${highlightRun ? 'tutorial-highlight-btn' : ''}`}
            disabled={!canRun}
            onClick={handleRunSprint}
          >
            开始 Sprint
          </button>
        </section>

        <nav className="mobile-bottom-tabbar" aria-label="移动端底部功能导航">
          {MOBILE_TABS.map(tab => (
            <button
              key={tab.id}
              type="button"
              className="mobile-bottom-tab"
              aria-controls={`mobile-overlay-${tab.id}`}
              onClick={() => setActiveMobileOverlay(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="desktop-workspace">
          <div className="header-actions" style={{ justifyContent: 'flex-end', marginBottom: '16px', gap: '12px' }}>
            <button className="btn-saves-trigger" onClick={() => setIsSaveManagerOpen(true)}>
              📁 存档管理
            </button>
            <button className="btn-reset" onClick={handleReset}>重置游戏</button>
          </div>

          <ErrorBoundary local>
            <Suspense fallback={null}>
              <TutorialGuide
                sprintCount={gameState.sprintCount}
                selectedAgentCount={selectedAgentIds.size}
                selectedProjectId={selectedProjectId}
                selectedStrategyId={selectedStrategyId}
                isOpen={isTutorialOpen}
                onClose={() => setIsTutorialOpen(false)}
              />
            </Suspense>
          </ErrorBoundary>

          <MobileSectionNav
            sections={MAIN_SECTIONS}
            activeSection={activeMainSection}
            onSelect={setActiveMainSection}
          />

          <section
            id="main-section-team"
            className={`panel team-panel ${highlightTeam ? 'tutorial-highlight-panel' : ''} ${activeMainSection !== 'team' ? 'mobile-hidden' : ''}`}
          >
            <h2>团队 <span className="count">(已选 {selectedAgentIds.size})</span></h2>
            <div className="card-grid">
              {gameState.agents.map(a => (
                <AgentCard
                  key={a.id}
                  agent={a}
                  selected={selectedAgentIds.has(a.id)}
                  onToggle={toggleAgent}
                  onOpenSkillTree={setActiveSkillTreeAgentId}
                />
              ))}
            </div>
            <RelationsNetwork agents={gameState.agents} relations={gameState.relations || []} />
          </section>

          <section
            id="main-section-project"
            className={`panel project-panel ${highlightProject ? 'tutorial-highlight-panel' : ''} ${activeMainSection !== 'project' ? 'mobile-hidden' : ''}`}
          >
            <h2>项目</h2>
            <div className="card-grid">
              {gameState.projects.map(p => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  selected={selectedProjectId === p.id}
                  onSelect={handleSelectProject}
                />
              ))}
            </div>
          </section>

          <section
            id="main-section-strategy"
            className={`panel strategy-panel ${highlightStrategy ? 'tutorial-highlight-panel' : ''} ${activeMainSection !== 'strategy' ? 'mobile-hidden' : ''}`}
          >
            <h2>策略</h2>
            <StrategySelector
              strategies={strategies}
              selectedId={selectedStrategyId}
              onSelect={setSelectedStrategyId}
            />
          </section>

          <div className={`action-bar ${activeMainSection !== 'strategy' ? 'mobile-hidden' : ''}`}>
            <button
              className={`btn-run ${highlightRun ? 'tutorial-highlight-btn' : ''}`}
              disabled={!canRun}
              onClick={handleRunSprint}
            >
              执行 Sprint
            </button>
          </div>

          <section
            id="main-section-result"
            className={`panel result-panel ${!lastResult ? 'result-panel-empty' : ''} ${activeMainSection !== 'result' ? 'mobile-hidden' : ''}`}
          >
            {lastResult ? (
              <ErrorBoundary local>
                <Suspense fallback={<div className="panel-loading">生成报告中...</div>}>
                  <ResultReport
                    result={lastResult}
                    projectCompleted={projectCompleted}
                    projectBonus={projectBonus}
                    newlyUnlockedAgents={newlyUnlockedAgents}
                    gameState={gameState}
                    reputationScore={gameState.reputationScore ?? 0}
                  />
                </Suspense>
              </ErrorBoundary>
            ) : (
              <div className="mobile-result-empty">执行 Sprint 后，这里会显示本轮结果。</div>
            )}
          </section>

          <section
            id="main-section-history"
            className={`panel history-panel-wrapper ${activeMainSection !== 'history' ? 'mobile-hidden' : ''}`}
          >
            <ErrorBoundary local>
              <Suspense fallback={<div className="panel-loading">加载历史记录...</div>}>
                <HistoryPanel history={gameState.history} />
              </Suspense>
            </ErrorBoundary>
          </section>

          <div className={activeMainSection !== 'history' ? 'mobile-hidden' : ''}>
            <ErrorBoundary local>
              <Suspense fallback={<div className="panel-loading">加载成就...</div>}>
                <AchievementPanel unlockedAchievementIds={gameState.unlockedAchievementIds} gameState={gameState} />
              </Suspense>
            </ErrorBoundary>
          </div>
        </div>
      </main>

      {activeMobileOverlay && activeMobileTab && (
        <div
          id={`mobile-overlay-${activeMobileOverlay}`}
          className="mobile-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-overlay-title"
        >
          <div className="mobile-overlay-header">
            <h2 id="mobile-overlay-title">{activeMobileTab.label}</h2>
            <button
              type="button"
              className="mobile-overlay-close"
              onClick={() => setActiveMobileOverlay(null)}
            >
              关闭
            </button>
          </div>
          <div className="mobile-overlay-body">
            {renderMobileOverlayContent()}
          </div>
        </div>
      )}

      <ErrorBoundary local>
        <Suspense fallback={null}>
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
        </Suspense>
      </ErrorBoundary>

      {activeSkillTreeAgentId && (
        <ErrorBoundary local>
          <Suspense fallback={null}>
            <SkillTreeModal
              agent={gameState.agents.find(a => a.id === activeSkillTreeAgentId)!}
              companyMoney={gameState.funds}
              onClose={() => setActiveSkillTreeAgentId(null)}
              onUnlock={handleUnlockSkill}
            />
          </Suspense>
        </ErrorBoundary>
      )}
    </div>
  );
}
