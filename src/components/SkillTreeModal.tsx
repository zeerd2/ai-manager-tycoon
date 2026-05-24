import React from 'react';
import type { Agent } from '../domain/agent';
import { agentSkillTrees } from '../data/skillTrees';
import { canUnlockSkill } from '../domain/skillTreeLogic';

interface SkillTreeModalProps {
  agent: Agent;
  companyMoney: number;
  onClose: () => void;
  onUnlock: (agentId: string, skillId: string) => void;
}

export const SkillTreeModal: React.FC<SkillTreeModalProps> = ({ agent, companyMoney, onClose, onUnlock }) => {
  const tree = agentSkillTrees[agent.role];

  if (!tree) {
    return (
      <div className="save-manager-overlay" style={{ zIndex: 1100 }}>
        <div className="save-manager-modal" style={{ maxWidth: '400px', padding: '24px' }}>
          <div className="save-manager-header" style={{ padding: '0 0 16px 0', marginBottom: '16px' }}>
            <h2>{agent.name} 的技能树</h2>
            <button onClick={onClose} className="close-btn">✕</button>
          </div>
          <p style={{ color: 'var(--text-dim)', marginBottom: '20px' }}>{agent.role} 没有可用的技能树。</p>
          <button onClick={onClose} className="btn-reset" style={{ width: '100%' }}>关闭</button>
        </div>
      </div>
    );
  }

  const handleUnlock = (skillId: string) => {
    onUnlock(agent.id, skillId);
  };

  return (
    <div className="save-manager-overlay" style={{ zIndex: 1100 }}>
      <div className="save-manager-modal" style={{ maxWidth: '750px' }}>
        <div className="save-manager-header">
          <div>
            <h2>{agent.name} 的技能树</h2>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginTop: '4px', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
              <span>角色: <strong style={{ color: 'var(--accent)' }}>{agent.role}</strong></span>
              <span style={{ color: 'var(--border)' }}>|</span>
              <span style={{ color: 'var(--positive)', fontWeight: 'bold' }}>资金: ${companyMoney}</span>
            </div>
          </div>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>

        <div className="save-manager-body" style={{ padding: '24px', overflowY: 'auto' }}>
          <div className="skill-tree-grid">
            {tree.map(skill => {
              const isUnlocked = agent.unlockedSkills?.includes(skill.id);
              const canUnlock = canUnlockSkill(agent, skill.id, companyMoney);

              // Find names of prerequisites
              const reqNames = skill.prerequisites
                .map(p => tree.find(s => s.id === p)?.name)
                .filter(Boolean)
                .join(', ');

              return (
                <div
                  key={skill.id}
                  className={`skill-card ${isUnlocked ? 'unlocked' : canUnlock ? 'can-unlock' : 'locked'}`}
                >
                  <div className="skill-card-header">
                    <h4 className="skill-name">{skill.name}</h4>
                    {isUnlocked ? (
                      <span className="skill-status unlocked">✓ 已解锁</span>
                    ) : (
                      <span className="skill-status cost">${skill.cost}</span>
                    )}
                  </div>

                  <p className="skill-description">{skill.description}</p>

                  {skill.prerequisites.length > 0 && (
                    <div className="skill-requirements">
                      <span>前置: </span>
                      <span className={skill.prerequisites.every(p => agent.unlockedSkills?.includes(p)) ? 'met' : 'unmet'}>
                        {reqNames}
                      </span>
                    </div>
                  )}

                  {!isUnlocked && (
                    <button
                      onClick={() => handleUnlock(skill.id)}
                      disabled={!canUnlock}
                      className="skill-unlock-btn"
                    >
                      {companyMoney >= skill.cost ? '解锁技能' : '资金不足'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
