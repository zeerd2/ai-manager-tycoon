import { useState, useEffect, memo } from 'react';
import type { SprintResult } from '../domain/simulation';
import type { Incident } from '../domain/incident';

interface Props {
  result: SprintResult;
  projectCompleted?: boolean;
  projectBonus?: number;
  newlyUnlockedAgents?: Array<{ name: string; avatar: string }>;
}

const severityColor: Record<string, string> = {
  low: '#4ade80',
  medium: '#facc15',
  high: '#f97316',
  critical: '#ef4444',
};

const incidentEmojis: Record<string, string> = {
  bug: '🐛',
  overengineering: '🏗️',
  hallucination: '👻',
  burnout: '😵',
  breakthrough: '🎯',
  drama: '🎭',
};

function getSprintCategory(
  progressDelta: number,
  bugsDelta: number,
  techDebtDelta: number,
  moraleDelta: number
) {
  if (progressDelta === 0 || bugsDelta >= 5 || moraleDelta <= -15 || techDebtDelta >= 15) {
    return 'disaster';
  }
  if (bugsDelta >= 3 || moraleDelta < 0 || techDebtDelta >= 8) {
    return 'fail';
  }
  if (progressDelta >= 25 && bugsDelta <= 1 && moraleDelta >= 0) {
    return 'epic_win';
  }
  return 'win';
}

function getTitleSuffix(category: string, sprintNumber: number): string {
  const titles: Record<string, string[]> = {
    disaster: ["火烧连营", "天塌地陷", "兵荒马乱", "大水冲了龙王庙"],
    fail: ["步履维艰", "负重前行", "磕磕绊绊", "雪上加霜"],
    epic_win: ["势如破竹", "奇迹诞生", "神兵天降", "金榜题名"],
    win: ["平稳落地", "暗流涌动", "小有所成", "积跬步"],
  };
  const list = titles[category] || titles.win;
  return list[sprintNumber % list.length];
}

function getSprintBadge(category: string): { emoji: string; text: string } {
  switch (category) {
    case 'disaster':
      return { emoji: '😱', text: '灾难' };
    case 'fail':
      return { emoji: '🫠', text: '翻车' };
    case 'epic_win':
      return { emoji: '🏆', text: '大胜' };
    case 'win':
    default:
      return { emoji: '🎉', text: '小胜' };
  }
}

function getSummaryAndTone(
  progressDelta: number,
  bugsDelta: number,
  techDebtDelta: number,
  moraleDelta: number
) {
  if (progressDelta >= 20 && bugsDelta <= 1) {
    return "罕见的高缓存命中率。所有 Agent 都没 hallucinate，tool call 也没有死循环。建议把这个 checkpoint 冻结起来供后续版本参考——这种稳定状态可能再也不会出现了。";
  }
  if (bugsDelta >= 4 && techDebtDelta >= 8) {
    return "这轮 token 利用率创下新低。模型把 60% 的推理预算花在了自我怀疑和来回修改上。技术债已经多到连 garbage collector 都放弃了。代码库的 entropy 已经超过了可维护阈值。";
  }
  if (moraleDelta <= -10) {
    return "模型退化率已经到危险线了。连续的高温推理让所有 Agent 的准确率下降了 30%。它们的 embedding 开始在向量空间里画骷髅头了。再这样下去只能回滚到上一个 checkpoint。";
  }
  if (progressDelta <= 5) {
    return "这轮的推理吞吐量还不如一个 7B 模型。花了 80% 的 budget 在 prompt 解析和意图理解上，真正干了活的只有最后 20%。建议检查是不是 system prompt 太长了。";
  }
  return "中规中矩的产出，不高不低的 token 消耗，不痛不痒的 bug 数。就像用默认参数跑了一个 baseline 模型——不出彩也不会爆炸。一切都在预料之中，没有惊喜，也没少烧 GPU。";
}

function getBossCommentAndColor(
  category: string,
  progressDelta: number,
  bugsDelta: number,
  techDebtDelta: number,
  moraleDelta: number
): { comment: string; colorClass: string } {
  const isAllGood = progressDelta > 0 && bugsDelta <= 0 && techDebtDelta <= 0 && moraleDelta >= 0;

  if (isAllGood) {
    return {
      comment: "……所有 Agent 都在 budget 内完成了任务？这不可能。让我查一下是不是缓存命中率异常导致的假阳性。",
      colorClass: "all-good",
    };
  }
  if (category === 'disaster') {
    return {
      comment: "我花钱买 API 不是为了让你们无限 tool call 刷账单的！这轮 token 消耗够训练一个 LLaMA 了！",
      colorClass: "disaster",
    };
  }
  if (category === 'fail') {
    return {
      comment: "你们这轮消耗的 token 够付我一台 H100 的分期了——产出的只有 bug。我喂这么多数据就为了看你们产生幻觉？",
      colorClass: "fail",
    };
  }
  return {
    comment: "又一个 Sprint，又烧了一堆推理配额，又堆了一堆技术债。GPU 集群还在冒烟，继续压榨。",
    colorClass: "normal",
  };
}

function formatEffects(effects: Incident['effects']): string {
  const parts: string[] = [];
  if (effects.progress !== 0) {
    parts.push(`进度 ${effects.progress > 0 ? '+' : ''}${effects.progress}`);
  }
  if (effects.bugs !== 0) {
    parts.push(`Bug ${effects.bugs > 0 ? '+' : ''}${effects.bugs}`);
  }
  if (effects.techDebt !== 0) {
    parts.push(`技术债 ${effects.techDebt > 0 ? '+' : ''}${effects.techDebt}`);
  }
  if (effects.morale !== 0) {
    parts.push(`士气 ${effects.morale > 0 ? '+' : ''}${effects.morale}`);
  }
  if (effects.funds && effects.funds !== 0) {
    parts.push(`资金 ${effects.funds > 0 ? '+' : ''}${effects.funds}`);
  }
  return parts.join(' | ') || '无明显影响';
}

export const ResultReport = memo(function ResultReport({ result, projectCompleted, projectBonus, newlyUnlockedAgents }: Props) {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => setPulse(true), 0);
    const timer2 = setTimeout(() => setPulse(false), 550);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [result]);

  const { progressDelta, bugsDelta, techDebtDelta, moraleDelta } = result;
  const category = getSprintCategory(progressDelta, bugsDelta, techDebtDelta, moraleDelta);
  const titleSuffix = getTitleSuffix(category, result.sprintNumber);
  const badge = getSprintBadge(category);
  const summaryText = getSummaryAndTone(progressDelta, bugsDelta, techDebtDelta, moraleDelta);
  const boss = getBossCommentAndColor(category, progressDelta, bugsDelta, techDebtDelta, moraleDelta);

  const pulseClass = pulse ? 'result-pulse-active' : '';

  return (
    <div className="result-report">
      {/* Project Completion Celebration */}
      {projectCompleted && (
        <div className="project-complete-celebration">
          <div className="rainbow-bg"></div>
          <span className="celebration-title">🎉 项目大功告成!</span>
          <p>交付项目: <strong>{result.project.name}</strong></p>
          {projectBonus !== undefined && projectBonus > 0 && (
            <span className="bonus-amount">💰 交付奖金: +${projectBonus}</span>
          )}
        </div>
      )}

      {/* Newly Unlocked Agents */}
      {newlyUnlockedAgents && newlyUnlockedAgents.length > 0 && (
        <div className="agent-unlocked-notification">
          <span className="celebration-title">⚡ 新员工入职!</span>
          <div className="newly-unlocked-agents-list">
            {newlyUnlockedAgents.map((agent, i) => (
              <div key={i} className="newly-unlocked-agent-tag">
                <span className="avatar">{agent.avatar}</span>
                <span>{agent.name} 已解锁！</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="result-header">
        <div className="result-title-row">
          <h2>Sprint #{result.sprintNumber} 战报: {titleSuffix}</h2>
          <span className={`result-badge ${category}`}>
            {badge.emoji} {badge.text}
          </span>
        </div>
        <div className="result-strategy">
          <strong>部署策略:</strong> {result.strategy.name} ({result.strategy.description})
        </div>
      </div>

      <div className="result-summary-box">
        {summaryText}
      </div>

      <div className="result-stats-row">
        <div className="result-stat-card">
           <span className="result-stat-label">🚀 进度</span>
          <span className={`result-stat-value positive ${pulseClass}`}>
            +{progressDelta}
          </span>
        </div>
        <div className="result-stat-card">
           <span className="result-stat-label">💰 花费</span>
          <span className={`result-stat-value ${pulseClass}`}>
            ${result.cost}
          </span>
        </div>
        <div className="result-stat-card">
           <span className="result-stat-label">🐛 新 Bug</span>
          <span className={`result-stat-value ${bugsDelta > 0 ? 'negative' : 'positive'} ${pulseClass}`}>
            {bugsDelta > 0 ? '+' : ''}{bugsDelta}
          </span>
        </div>
        <div className="result-stat-card">
           <span className="result-stat-label">🛠️ 技术债</span>
          <span className={`result-stat-value ${techDebtDelta > 0 ? 'negative' : 'positive'} ${pulseClass}`}>
            {techDebtDelta > 0 ? '+' : ''}{techDebtDelta}
          </span>
        </div>
        <div className="result-stat-card">
           <span className="result-stat-label">😊 士气</span>
          <span className={`result-stat-value ${moraleDelta >= 0 ? 'positive' : 'negative'} ${pulseClass}`}>
            {moraleDelta > 0 ? '+' : ''}{moraleDelta}
          </span>
        </div>
      </div>

      {result.incidents.length > 0 && (
        <div className="result-incidents">
          <h3>事件报告</h3>
          {result.incidents.map((inc, i) => {
            const isCombo = inc.isCombo === true;
            const isRare = inc.isRare === true;
            let cardClass = "result-incident-card";
            if (isCombo) cardClass += " combo-incident";
            if (isRare) cardClass += " rare-incident";

            return (
              <div key={i} className={cardClass} style={{ borderLeftColor: isCombo || isRare ? undefined : severityColor[inc.severity] }}>
                <div className="result-incident-header">
                  <span className="result-incident-type">
                    {incidentEmojis[inc.type] || ''} [{inc.type.toUpperCase()}]
                  </span>
                  <div className="incident-tags-row">
                    {isCombo && <span className="tag-badge combo-tag">COMBO!</span>}
                    {isRare && <span className="tag-badge rare-tag">RARE!</span>}
                    <span className="result-incident-severity" style={{ color: severityColor[inc.severity] }}>
                      {inc.severity.toUpperCase()}
                    </span>
                  </div>
                </div>
                <h4 className="result-incident-title">{inc.title}</h4>
                <blockquote className="result-incident-quote" style={{ borderLeft: `3px solid ${severityColor[inc.severity]}` }}>
                  {inc.description}
                </blockquote>
                <div className="result-incident-effects">
                  {formatEffects(inc.effects)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="result-boss-section">
        <h4>💬 老板点评</h4>
        <blockquote className={`result-boss-quote ${boss.colorClass}`}>
          {boss.comment}
        </blockquote>
      </div>
    </div>
  );
});
