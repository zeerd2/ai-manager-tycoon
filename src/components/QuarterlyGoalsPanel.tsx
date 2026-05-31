import { memo } from 'react';
import { calculateRating, toRatingInput } from '../domain/rating';
import { getDefaultCheckpoints, getCheckpointsForQuarter, evaluateQuarterCheckpoints } from '../domain/financing';
import { getReputationLabel } from '../domain/reputation';
import type { GameState } from '../domain/gameState';

interface Props {
  gameState: GameState;
  selectedProjectId: string | null;
}

interface KpiInfo {
  title: string;
  description: string;
  targets: { label: string; current: number; target: number; passed: boolean }[];
}

function getQuarterKpiInfo(quarter: number, completedCount: number, funds: number, reputation: number, confidence: number): KpiInfo {
  if (quarter === 1) {
    return {
      title: 'Q1 季度目标',
      description: '公司初创，完成首个项目交付并保证基本资金储备。',
      targets: [
        { label: '项目完成', current: completedCount, target: 1, passed: completedCount >= 1 },
        { label: '储备资金', current: funds, target: 4000, passed: funds >= 4000 }
      ]
    };
  }
  if (quarter === 2) {
    return {
      title: 'Q2 季度目标',
      description: '扩大业务，提升公司声望与团队凝聚信心。',
      targets: [
        { label: '项目完成', current: completedCount, target: 3, passed: completedCount >= 3 },
        { label: '公司声望', current: reputation, target: 60, passed: reputation >= 60 },
        { label: '团队信心', current: confidence, target: 60, passed: confidence >= 60 }
      ]
    };
  }
  if (quarter === 3) {
    return {
      title: 'Q3 季度目标',
      description: '稳步扩张，建立行业中坚地位。',
      targets: [
        { label: '项目完成', current: completedCount, target: 5, passed: completedCount >= 5 },
        { label: '公司声望', current: reputation, target: 70, passed: reputation >= 70 },
        { label: '团队信心', current: confidence, target: 70, passed: confidence >= 70 }
      ]
    };
  }
  if (quarter === 4) {
    return {
      title: 'Q4 季度目标',
      description: '年度冲刺，实现高质量、高效率的大满贯。',
      targets: [
        { label: '项目完成', current: completedCount, target: 8, passed: completedCount >= 8 },
        { label: '公司声望', current: reputation, target: 80, passed: reputation >= 80 },
        { label: '团队信心', current: confidence, target: 80, passed: confidence >= 80 }
      ]
    };
  }
  return {
    title: `Q${quarter} 季度目标`,
    description: '无尽模式，追求极致！',
    targets: [
      { label: '项目完成', current: completedCount, target: 12, passed: completedCount >= 12 },
      { label: '公司声望', current: reputation, target: 90, passed: reputation >= 90 },
      { label: '团队信心', current: confidence, target: 90, passed: confidence >= 90 }
    ]
  };
}

export const QuarterlyGoalsPanel = memo(function QuarterlyGoalsPanel({ gameState, selectedProjectId }: Props) {
  const { funds, sprintCount, projects, completedProjectIds, reputation = 50, confidence = 50 } = gameState;

  const completedProjects = completedProjectIds.length;
  const ratingResult = calculateRating(toRatingInput(gameState));

  // Quarterly Target Panel math
  const currentSprint = sprintCount + 1;
  const quarter = Math.floor((currentSprint - 1) / 4) + 1;
  const sprintsRemainingInQuarter = 4 - ((currentSprint - 1) % 4);
  const kpi = getQuarterKpiInfo(quarter, completedProjects, funds, reputation, confidence);

  // Financing checkpoints
  const allCheckpoints = getDefaultCheckpoints();
  const quarterCheckpoints = getCheckpointsForQuarter(allCheckpoints, quarter);
  const checkpointResults = evaluateQuarterCheckpoints(quarterCheckpoints, gameState, gameState.reputationScore ?? 0, ratingResult.rating);

  // Next checkpoint countdown
  const nextCheckpoint = allCheckpoints.find(cp => cp.quarterNumber > quarter);
  const sprintsToNextCheckpoint = nextCheckpoint ? (nextCheckpoint.quarterNumber - quarter) * 4 + sprintsRemainingInQuarter : null;

  // Reputation/confidence indicators
  const reputationLabel = getReputationLabel(reputation);
  const confidenceLabel = confidence >= 80 ? '极高' : confidence >= 60 ? '高' : confidence >= 40 ? '中' : confidence >= 20 ? '低' : '极低';

  const selectedProject = selectedProjectId ? projects.find(p => p.id === selectedProjectId) : null;
  const projectRemainingSprints = selectedProject ? (selectedProject.deadline ?? 999) - sprintCount : 0;

  return (
    <div className="quarterly-goals-panel">
      {/* Quarter Info Section */}
      <div className="panel-section quarter-info">
        <h3>第 {quarter} 季度</h3>
        <p className="subtext">本季剩余: <strong className="highlight">{sprintsRemainingInQuarter}</strong> 回合</p>
        {sprintsToNextCheckpoint !== null && (
          <div className="checkpoint-countdown">
            <span className="countdown-label">下次融资检查:</span>
            <span className="countdown-value">{sprintsToNextCheckpoint} 回合后</span>
          </div>
        )}
      </div>

      {/* KPI Targets Section */}
      <div className="panel-section kpi-info">
        <h4>🎯 季度 KPI 目标</h4>
        <div className="kpi-targets-list">
          {kpi.targets.map((t, idx) => (
            <div key={idx} className="kpi-target-item">
              <span className="kpi-label">{t.label}:</span>
              <span className={`kpi-value ${t.passed ? 'passed' : 'pending'}`}>
                {t.current} / {t.target} {t.passed ? '✅' : '⏳'}
              </span>
            </div>
          ))}
        </div>
        <p className="kpi-desc">{kpi.description}</p>
      </div>

      {/* Reputation & Confidence Section */}
      <div className="panel-section reputation-confidence">
        <h4>📊 声望 & 信心</h4>
        <div className="indicators-grid">
          <div className="indicator-item">
            <span className="indicator-label">👑 声望:</span>
            <div className="indicator-bar">
              <div className="indicator-fill reputation" style={{ width: `${Math.max(0, Math.min(100, (reputation + 100) / 2))}%` }}></div>
              <span className="indicator-text">{reputation} ({reputationLabel})</span>
            </div>
          </div>
          <div className="indicator-item">
            <span className="indicator-label">🧠 信心:</span>
            <div className="indicator-bar">
              <div className="indicator-fill confidence" style={{ width: `${confidence}%` }}></div>
              <span className="indicator-text">{confidence} ({confidenceLabel})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Financing Checkpoints Section */}
      <div className="panel-section financing-checkpoints">
        <h4>💰 融资检查点</h4>
        {checkpointResults.length > 0 ? (
          <div className="checkpoints-list">
            {checkpointResults.map((result, idx) => (
              <div key={idx} className={`checkpoint-item ${result.triggered ? 'triggered' : 'pending'}`}>
                <span className="checkpoint-name">{result.checkpoint.description}</span>
                <span className="checkpoint-reward">
                  {result.triggered ? `+$${result.reward}` : `$${result.checkpoint.baseReward}`}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-checkpoints">本季度无融资检查点</div>
        )}
      </div>

      {/* Current Contract Section */}
      <div className="panel-section contract-info">
        <h4>📜 当前合同 Deadline</h4>
        {selectedProject ? (
          <div className="contract-detail">
            <span className="contract-name" title={selectedProject.name}>{selectedProject.name}</span>
            <div className="contract-deadline-row">
              <span>截止回合: <strong>#{selectedProject.deadline}</strong></span>
              {projectRemainingSprints > 0 ? (
                <span className="remaining-badge positive">剩余 {projectRemainingSprints} 回合</span>
              ) : (
                <span className="remaining-badge negative animate-flash">⚠️ 已逾期! (奖励减半, 扣声望/信心)</span>
              )}
            </div>
          </div>
        ) : (
          <div className="contract-empty">未选定项目，请在项目列表中选择。</div>
        )}
      </div>
    </div>
  );
});
