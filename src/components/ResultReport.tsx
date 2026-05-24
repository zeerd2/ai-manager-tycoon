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
    return "难得地，团队今天没搞砸。记住这个日子。也许是太阳打西边出来了，或者大家都喝了双倍浓缩咖啡。我很欣慰，希望下个 Sprint 你们还能保持这种清醒状态。";
  }
  if (bugsDelta >= 4 && techDebtDelta >= 8) {
    return "本轮 Sprint 的唯一成就是证明了墨菲定律的正确性。如果写 Bug 也能算进绩效，我们现在已经可以敲钟上市了。代码库现在看起来像一栋用胶带和祈祷支撑起来的危楼。";
  }
  if (moraleDelta <= -10) {
    return "团队士气已跌至'考虑转行'级别。每个人看前台仙人掌的眼神都比看代码深情。再这样下去只能去开咖啡馆了。整个办公室弥漫着一股想去送外卖或者回家继承家产的消极气息。";
  }
  if (progressDelta <= 5) {
    return "今天的进度慢得像在用 2G 网络下载 4K 电影。我怀疑大家一整天都在讨论中午吃什么，顺便写了半行代码。这进度，连蜗牛看了都想给你们加油打气。";
  }
  return "又一天，又一个 Sprint，又一堆技术债。继续。一切都在预料之中，没有惊喜，当然，也没少写 Bug。团队继续用他们独特的方式磨洋工，好消息是至少项目还没彻底垮掉。";
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
      comment: "……等等，今天没人搞砸？我需要确认一下服务器是不是挂了。",
      colorClass: "all-good",
    };
  }
  if (category === 'disaster') {
    return {
      comment: "我花钱雇的是工程师还是bug制造机？",
      colorClass: "disaster",
    };
  }
  if (category === 'fail') {
    return {
      comment: "你们写代码的速度要是能赶上写 Bug 的一半，我们早就是行业独角兽了。",
      colorClass: "fail",
    };
  }
  return {
    comment: "又一天，又一个Sprint，又一堆技术债。继续。",
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
