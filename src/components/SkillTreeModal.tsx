import React from 'react';
import { Agent } from '../domain/agent';
import { agentSkillTrees } from '../data/skillTrees';
import { unlockSkill, canUnlockSkill } from '../domain/skillTreeLogic';

interface SkillTreeModalProps {
  agent: Agent;
  companyMoney: number;
  onClose: () => void;
  onUnlock: (agentId: string, skillId: string, cost: number) => void;
}

export const SkillTreeModal: React.FC<SkillTreeModalProps> = ({ agent, companyMoney, onClose, onUnlock }) => {
  const tree = agentSkillTrees[agent.role];

  if (!tree) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full border border-gray-200">
           <h3 className="text-xl font-bold mb-4">{agent.name}'s Skill Tree</h3>
           <p>No skill tree available for {agent.role}.</p>
           <button onClick={onClose} className="mt-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Close</button>
        </div>
      </div>
    );
  }

  const handleUnlock = (skillId: string, cost: number) => {
    onUnlock(agent.id, skillId, cost);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full border border-gray-200 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">{agent.name}'s Skills ({agent.role})</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tree.map(skill => {
            const isUnlocked = agent.unlockedSkills?.includes(skill.id);
            const canUnlock = canUnlockSkill(agent, skill.id, companyMoney);
            
            return (
              <div key={skill.id} className={`p-4 rounded border ${isUnlocked ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                <h4 className="font-bold flex justify-between">
                  {skill.name}
                  {isUnlocked && <span className="text-green-600 text-sm">✓ Unlocked</span>}
                </h4>
                <p className="text-sm text-gray-600 mt-1">{skill.description}</p>
                <div className="mt-2 text-sm text-gray-500">
                  Cost: ${skill.cost}
                  {skill.prerequisites.length > 0 && (
                    <span className="ml-2">
                      Requires: {skill.prerequisites.map(p => tree.find(s => s.id === p)?.name).join(', ')}
                    </span>
                  )}
                </div>
                {!isUnlocked && (
                  <button
                    onClick={() => handleUnlock(skill.id, skill.cost)}
                    disabled={!canUnlock}
                    className={`mt-3 w-full py-1.5 rounded text-sm font-medium ${
                      canUnlock
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Unlock Skill
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
