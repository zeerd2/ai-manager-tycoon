import { memo } from 'react';
import { calculateRating } from '../domain/rating';
import { achievements } from '../data/achievements';
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

export function getQuarterKpiInfo(quarter: number, completedCount: number, funds: number, reputation: number, confidence: number): KpiInfo {
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

export const CompanyDashboard = memo(function CompanyDashboard({ gameState, selectedProjectId }: Props) {
  const { funds, sprintCount, projects, completedProjectIds, unlockedAchievementIds, history, reputation = 50, confidence = 50 } = gameState;

  // Calculate rating input
  const completedProjects = completedProjectIds.length;
  const totalBugs = projects.reduce((sum, p) => sum + p.bugs, 0);
  const totalTechDebt = projects.reduce((sum, p) => sum + p.techDebt, 0);
  const totalSprintsCost = history.reduce((sum, h) => sum + h.cost, 0);

  const ratingResult = calculateRating({
    completedProjects,
    totalBugs,
    totalTechDebt,
    totalSprintsCost,
    fundsRemaining: funds,
    sprintCount,
  });

  const totalAchievements = achievements.length;
  const unlockedAchievementsCount = unlockedAchievementIds.length;

  const maxFundsLimit = 10000;
  const fundsPercent = Math.min(100, Math.max(0, (funds / maxFundsLimit) * 100));
  const isLowFunds = funds < 1000;

  // Quarterly Target Panel math
  const currentSprint = sprintCount + 1;
  const quarter = Math.floor((currentSprint - 1) / 4) + 1;
  const sprintsRemainingInQuarter = 4 - ((currentSprint - 1) % 4);
  const kpi = getQuarterKpiInfo(quarter, completedProjects, funds, reputation, confidence);

  const selectedProject = selectedProjectId ? projects.find(p => p.id === selectedProjectId) : null;
  const projectRemainingSprints = selectedProject ? (selectedProject.deadline ?? 999) - sprintCount : 0;

  return (
    <div className="company-dashboard-wrapper">
      <div className="company-dashboard">
        <div className="dashboard-item funds-container" title="当前公司持有的运营资金。每回合结束时扣除工程师薪资并计算开销，若资金归零或为负，公司将面临破产（游戏结束）！">
          <span className="label">💰 资金:</span>
          <div className={`funds-bar ${isLowFunds ? 'danger-flash' : ''}`}>
            <div className="funds-bar-fill" style={{ width: `${fundsPercent}%` }}></div>
            <span className="funds-text">${funds}</span>
          </div>
        </div>

        <div className="dashboard-item" title="基于已完成项目数、累计 Bugs、技术债、历史总支出和剩余资金对你进行的综合管理评级评估。">
          <span className="label">📊 评级:</span>
          <span className={`rating-badge rating-${ratingResult.rating}`}>
            {ratingResult.rating} ({ratingResult.title})
          </span>
        </div>

        <div className="dashboard-item" title="当前公司的行业声望（0-100）。完成合同会增加声望，逾期交付或出现 Bug 会降低声望。">
          <span className="label">👑 声望:</span>
          <span className="value highlight">{reputation}</span>
        </div>

        <div className="dashboard-item" title="团队对公司的信心指数（0-100）。士气高昂会增加信心，信心不足会影响团队表现。">
          <span className="label">🧠 信心:</span>
          <span className="value highlight">{confidence}</span>
        </div>

        <div className="dashboard-item" title="当前已解锁的游戏成就数。尝试解锁更多成就以达成完美通关！">
          <span className="label">🏆 成就:</span>
          <span className="value">{unlockedAchievementsCount} / {totalAchievements}</span>
        </div>

        <div className="dashboard-item" title="当前所处的回合数（Sprint数）。随着回合数的推进，候选人池会自动解锁更强大的 AI 工程师。">
          <span className="label">回合 #</span>
          <span className="value highlight">{sprintCount}</span>
        </div>
      </div>

      <div className="quarterly-target-panel">
        <div className="panel-section quarter-info">
          <h3>第 {quarter} 季度</h3>
          <p className="subtext">本季剩余: <strong className="highlight">{sprintsRemainingInQuarter}</strong> 回合</p>
        </div>

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
    </div>
  );
});
