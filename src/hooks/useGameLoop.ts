import { useCallback } from 'react';
import type { GameState } from '../domain/gameState';
import type { Agent } from '../domain/agent';
import type { Project } from '../domain/project';
import type { Strategy } from '../domain/strategy';
import type { SprintResult } from '../domain/simulation';
import type { QuarterSettlementResult } from '../domain/quarterSettlement';
import type { Achievement } from '../domain/achievement';
import type { PendingTeamEvent, TeamEventResult } from '../domain/relations/events';
import { generateTeamEvent } from '../domain/relations/events';
import type { IncidentTemplate } from '../domain/incident';

import { createRNG } from '../domain/random';
import type { RNG } from '../domain/random';
import { runSprint } from '../domain/simulation';
import { processPostSprint, checkUnlocks } from '../domain/gameEngine';
import { checkAchievement } from '../domain/achievement';
import { isQuarterEnd } from '../domain/quarterlyTarget';
import { processQuarterSettlement } from '../domain/quarterSettlement';
import { getDifficultyReward } from '../domain/project';
import { RelationsManager } from '../domain/relations/manager';

// TODO: Import actual types for team events if they are defined elsewhere

interface UseGameLoopProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;

  selectedAgentIds: Set<string>;
  selectedProjectId: string | null;
  selectedStrategyId: string | null;
  setSelectedAgentIds: React.Dispatch<React.SetStateAction<Set<string>>>;

  pendingEvent: PendingTeamEvent | null;
  setPendingEvent: React.Dispatch<React.SetStateAction<PendingTeamEvent | null>>;

  sprintContext: {
    chosenAgents: Agent[];
    project: Project;
    strategy: Strategy;
    rng: RNG;
  } | null;
  setSprintContext: React.Dispatch<React.SetStateAction<{
    chosenAgents: Agent[];
    project: Project;
    strategy: Strategy;
    rng: RNG;
  } | null>>;

  setLastResult: React.Dispatch<React.SetStateAction<SprintResult | null>>;
  setLastQuarterSettlement: React.Dispatch<React.SetStateAction<QuarterSettlementResult | null>>;

  setToastQueue: React.Dispatch<React.SetStateAction<Achievement[]>>;
  setNewlyUnlockedAgents: React.Dispatch<React.SetStateAction<Array<{ name: string; avatar: string }>>>;
  setProjectCompleted: React.Dispatch<React.SetStateAction<boolean>>;
  setProjectBonus: React.Dispatch<React.SetStateAction<number>>;

  // Static data passed in
  strategies: Strategy[];
  achievements: Achievement[];
  incidentTemplates: IncidentTemplate[];
}

export function useGameLoop(props: UseGameLoopProps) {
  const {
    gameState,
    setGameState,
    selectedAgentIds,
    selectedProjectId,
    selectedStrategyId,
    setSelectedAgentIds,
    pendingEvent: _pendingEvent,
    setPendingEvent,
    sprintContext,
    setSprintContext,
    setLastResult,
    setLastQuarterSettlement,
    setToastQueue,
    setNewlyUnlockedAgents,
    setProjectCompleted,
    setProjectBonus,
    strategies,
    achievements,
    incidentTemplates,
  } = props;

  // Core execution function - will be populated with the full logic
  const executeSprint = useCallback(
    (
      chosenAgents: Agent[],
      project: Project,
      strategy: Strategy,
      rng: RNG,
      eventResult: TeamEventResult | null
    ) => {
      // 1. Run simulation
      const result = runSprint(gameState.sprintCount + 1, chosenAgents, project, strategy, incidentTemplates, rng);

      const relationsManager = new RelationsManager(gameState.relations || []);

      // Apply event results
      if (eventResult) {
        result.moraleDelta += eventResult.moraleDelta;
        result.project.progress = Math.min(result.project.maxProgress, result.project.progress + eventResult.progressDelta);
        result.project.bugs += Math.max(0, eventResult.bugsDelta);
        result.summary += ` | Event resolved: ${eventResult.message}`;
      }

      // Apply relations multiplier
      const collabMultiplier = relationsManager.getCollaborationMultiplier(chosenAgents.map(a => a.id));
      result.project.progress = Math.round(result.project.progress * collabMultiplier);

      // 2. Determine if project was completed
      const isProjCompletedNow = result.project.progress >= result.project.maxProgress &&
        !gameState.completedProjectIds.includes(project.id);
      const bonus = getDifficultyReward(project);

      // 3. Process new state
      const newState = processPostSprint(gameState, result, Array.from(selectedAgentIds), rng);

      if (eventResult) {
        newState.funds += eventResult.fundsDelta;
      }

      // Save relations back to state
      newState.relations = relationsManager.getRelations();

      // After successful project, increase relations among participants
      if (isProjCompletedNow) {
        for (let i = 0; i < chosenAgents.length; i++) {
          for (let j = i + 1; j < chosenAgents.length; j++) {
            relationsManager.updateRelation(chosenAgents[i].id, chosenAgents[j].id, 5);
          }
        }
        newState.relations = relationsManager.getRelations();
      }

      const newReputationScore = newState.reputationScore ?? newState.reputation - 50;
      newState.quarterlyEvaluations = gameState.quarterlyEvaluations || [];
      newState.triggeredCheckpoints = gameState.triggeredCheckpoints || [];

      let quarterSettlement: QuarterSettlementResult | null = null;
      if (isQuarterEnd(newState.sprintCount)) {
        quarterSettlement = processQuarterSettlement(newState, newReputationScore);
        newState.quarterlyEvaluations = [
          ...newState.quarterlyEvaluations,
          quarterSettlement.targetEvaluation,
        ];
        newState.funds += quarterSettlement.totalFinancingReward;
        newState.triggeredCheckpoints = quarterSettlement.triggeredCheckpointIds;
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
          cost: h.cost,
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

      // 6. Update local states (via setters passed in)
      setProjectCompleted(isProjCompletedNow);
      setProjectBonus(isProjCompletedNow ? bonus : 0);
      setNewlyUnlockedAgents(unlockedAgentDetails);
      setLastResult(newState.history[newState.history.length - 1]);
      setLastQuarterSettlement(quarterSettlement);
      setGameState(newState);

      // Clear agent selection
      setSelectedAgentIds(new Set());
    },
    [gameState, selectedAgentIds, setGameState, setSelectedAgentIds, setLastResult, setLastQuarterSettlement, setToastQueue, setNewlyUnlockedAgents, setProjectCompleted, setProjectBonus, achievements, incidentTemplates]
  );

  const handleRunSprint = useCallback(() => {
    void _pendingEvent; // ensure closure usage for linter
    if (selectedAgentIds.size === 0 || !selectedProjectId || !selectedStrategyId) return;

    const chosenAgents = gameState.agents.filter(a => selectedAgentIds.has(a.id));
    const project = gameState.projects.find(p => p.id === selectedProjectId)!;
    const strategy = strategies.find(s => s.id === selectedStrategyId)!;
    const rng = createRNG(Date.now()); // Note: createRNG needs to be imported

    // Check for random team event BEFORE sprint starts
    const event = generateTeamEvent(gameState.agents.filter(a => !a.locked), rng);

    if (event) {
      setPendingEvent(event);
      setSprintContext({ chosenAgents, project, strategy, rng });
      return;
    }

    executeSprint(chosenAgents, project, strategy, rng, null);
  }, [
    selectedAgentIds,
    selectedProjectId,
    selectedStrategyId,
    gameState,
    strategies,
    setPendingEvent,
    setSprintContext,
    executeSprint,
    _pendingEvent,
  ]);

  const handleEventResolve = useCallback((eventResult: TeamEventResult) => {
    setPendingEvent(null);
    if (sprintContext) {
      const { chosenAgents, project, strategy, rng } = sprintContext;
      executeSprint(chosenAgents, project, strategy, rng, eventResult);
      setSprintContext(null);
    }
  }, [sprintContext, executeSprint, setPendingEvent, setSprintContext]);

  return {
    handleRunSprint,
    handleEventResolve,
    // We can expose executeSprint if needed for internal use, but for now keep it internal
  };
}