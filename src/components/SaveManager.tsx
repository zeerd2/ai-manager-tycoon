import React, { useState, useEffect } from 'react';
import {
  MANUAL_SLOTS,
  AUTO_SLOT,
  SAVE_VERSION,
  getSaveSlotsMetadata,
  saveToSlot,
  loadFromSlot,
  deleteSlot,
  checkAndMigrateOldSave,
  isFallbackStorageActive,
  validateSlot
} from '../domain/saveSystem';
import type { SaveMetadata, AutosaveConfig, SaveValidationResult } from '../domain/saveSystem';
import type { GameState } from '../domain/gameState';
import type { QuarterEvaluation } from '../domain/quarterlyTarget';

interface SaveManagerProps {
  gameState: GameState;
  onLoadGame: (state: GameState, slotId: string) => void;
  onNewGame: (slotId: string) => void;
  isOpen: boolean;
  onClose: () => void;
  isStartup: boolean; // True if shown on game launch
  autosaveConfig: AutosaveConfig;
  onUpdateAutosaveConfig: (config: AutosaveConfig) => void;
}

export const SaveManager: React.FC<SaveManagerProps> = ({
  gameState,
  onLoadGame,
  onNewGame,
  isOpen,
  onClose,
  isStartup,
  autosaveConfig,
  onUpdateAutosaveConfig
}) => {
  const [slots, setSlots] = useState<SaveMetadata[]>([]);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'overwrite' | 'delete' | 'load';
    slotId: string;
    slotName: string;
  } | null>(null);
  const [saveNameInputs, setSaveNameInputs] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'load' | 'save' | 'settings'>(isStartup ? 'load' : 'save');
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'warning';
    message: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [validationResult, setValidationResult] = useState<SaveValidationResult | null>(null);

  useEffect(() => {
    if (notification && notification.type === 'success') {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const refreshSlots = () => {
    setSlots(getSaveSlotsMetadata());
  };

  // Load slot metadata on open
  useEffect(() => {
    if (isOpen || isStartup) {
      // Migrate old save first if applicable
      checkAndMigrateOldSave();
      const timer = setTimeout(() => {
        refreshSlots();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isStartup]);

  if (!isOpen && !isStartup) return null;

  const getSlotDetails = (slotId: string) => {
    return slots.find(s => s.id === slotId);
  };

  const handleCreateNewGame = (slotId: string) => {
    const existing = getSlotDetails(slotId);
    if (existing) {
      setConfirmAction({
        type: 'overwrite',
        slotId,
        slotName: existing.name
      });
    } else {
      onNewGame(slotId);
      if (!isStartup) onClose();
    }
  };

  const handleLoadSlot = (slotId: string) => {
    const existing = getSlotDetails(slotId);
    if (!existing) return;

    if (isStartup) {
      executeLoad(slotId);
    } else {
      setConfirmAction({
        type: 'load',
        slotId,
        slotName: existing.name
      });
    }
  };

  const executeLoad = (slotId: string) => {
    setIsLoading(true);
    setNotification(null);
    setValidationResult(null);
    setTimeout(() => {
      try {
        // Validate before loading
        const validation = validateSlot(slotId);
        if (!validation.valid) {
          setValidationResult(validation);
          setNotification({ type: 'error', message: '存档数据损坏，无法加载' });
          setIsLoading(false);
          return;
        }
        if (validation.warnings.length > 0) {
          setValidationResult(validation);
        }

        const saveData = loadFromSlot(slotId);
        if (saveData) {
          const loadedState: GameState = {
            ...saveData.gameState,
            reputationScore: saveData.reputationScore ?? 0,
            quarterlyEvaluations: (saveData.quarterlyEvaluations || []) as QuarterEvaluation[],
            triggeredCheckpoints: saveData.triggeredCheckpoints || [],
          };
          onLoadGame(loadedState, slotId);
          setConfirmAction(null);
          onClose();
        } else {
          setNotification({ type: 'error', message: '存档数据为空' });
        }
      } catch (e) {
        setNotification({
          type: 'error',
          message: `无法加载存档: ${e instanceof Error ? e.message : String(e)}`
        });
      } finally {
        setIsLoading(false);
      }
    }, 300);
  };

  const handleSaveSlot = (slotId: string) => {
    const existing = getSlotDetails(slotId);
    const customName = saveNameInputs[slotId]?.trim() || `存档位 ${slotId}`;

    if (existing) {
      setConfirmAction({
        type: 'overwrite',
        slotId,
        slotName: customName
      });
    } else {
      executeSave(slotId, customName);
    }
  };

  const executeSave = (slotId: string, name: string) => {
    setIsLoading(true);
    setNotification(null);
    setTimeout(() => {
      try {
        saveToSlot(slotId, name, gameState);
        refreshSlots();
        setSaveNameInputs(prev => ({ ...prev, [slotId]: '' }));
        setConfirmAction(null);
        if (isFallbackStorageActive()) {
          setNotification({
            type: 'warning',
            message: '保存成功到临时内存！(注意：本地浏览器存储不可用，刷新后将丢失)'
          });
        } else {
          setNotification({ type: 'success', message: '保存成功！' });
        }
      } catch (e) {
        setNotification({
          type: 'error',
          message: `保存失败: ${e instanceof Error ? e.message : String(e)}`
        });
      } finally {
        setIsLoading(false);
      }
    }, 300);
  };

  const handleDeleteSlot = (slotId: string) => {
    const existing = getSlotDetails(slotId);
    if (!existing) return;

    setConfirmAction({
      type: 'delete',
      slotId,
      slotName: existing.name
    });
  };

  const executeDelete = (slotId: string) => {
    deleteSlot(slotId);
    refreshSlots();
    setConfirmAction(null);
  };

  const handleConfirmAction = () => {
    if (!confirmAction) return;

    const { type, slotId, slotName } = confirmAction;
    if (type === 'delete') {
      executeDelete(slotId);
    } else if (type === 'overwrite') {
      if (isStartup) {
        // From startup, overwriting means starting a new game in this slot
        onNewGame(slotId);
        setConfirmAction(null);
        onClose();
      } else {
        // From in-game, overwriting means saving current game to this slot
        const customName = saveNameInputs[slotId]?.trim() || slotName;
        executeSave(slotId, customName);
      }
    } else if (type === 'load') {
      executeLoad(slotId);
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    } catch {
      return isoString;
    }
  };

  return (
    <div className={`save-manager-overlay ${isStartup ? 'startup' : ''}`}>
      <div className="save-manager-modal">
        {isLoading && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 100,
            backdropFilter: 'blur(2px)'
          }}>
            <div className="panel-loading" style={{ fontSize: '1.2rem', color: 'var(--accent)', textShadow: '0 0 8px rgba(0, 240, 255, 0.5)' }}>
              🔄 处理中，请稍候...
            </div>
          </div>
        )}

        <div className="save-manager-header">
          <h2>{isStartup ? '🚀 载入游戏 / 新建存档' : '💾 存档管理'}</h2>
          {!isStartup && (
            <button className="close-btn" onClick={onClose}>
              &times;
            </button>
          )}
        </div>

        {isFallbackStorageActive() && (
          <div style={{
            backgroundColor: 'rgba(255, 165, 0, 0.15)',
            borderLeft: '4px solid orange',
            padding: '12px 20px',
            margin: '12px 24px 0',
            fontSize: '0.9rem',
            color: 'orange',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            borderRadius: '4px'
          }}>
            <span>⚠️</span>
            <span>本地浏览器存储不可用或已满。游戏将使用临时内存存储，关闭或刷新页面后将丢失进度！</span>
          </div>
        )}

        {notification && (
          <div style={{
            backgroundColor: notification.type === 'success' ? 'rgba(0, 255, 0, 0.1)' : notification.type === 'warning' ? 'rgba(255, 165, 0, 0.15)' : 'rgba(255, 0, 0, 0.1)',
            borderLeft: `4px solid ${notification.type === 'success' ? 'var(--accent)' : notification.type === 'warning' ? 'orange' : 'var(--accent-red)'}`,
            padding: '12px 20px',
            margin: '12px 24px 0',
            fontSize: '0.9rem',
            color: notification.type === 'success' ? '#a3e635' : notification.type === 'warning' ? 'orange' : '#f87171',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderRadius: '4px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>{notification.type === 'success' ? '✅' : notification.type === 'warning' ? '⚠️' : '❌'}</span>
              <span>{notification.message}</span>
            </div>
            <button style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', fontSize: '1.2rem', cursor: 'pointer', padding: '0 4px', lineHeight: 1 }} onClick={() => setNotification(null)}>
              &times;
            </button>
          </div>
        )}

        {validationResult && validationResult.warnings.length > 0 && (
          <div style={{
            backgroundColor: 'rgba(255, 165, 0, 0.1)',
            borderLeft: '4px solid orange',
            padding: '12px 20px',
            margin: '12px 24px 0',
            fontSize: '0.85rem',
            color: 'orange',
            borderRadius: '4px'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>⚠️ 存档迁移提示</div>
            {validationResult.warnings.map((w, i) => (
              <div key={i} style={{ marginLeft: '8px' }}>• {w}</div>
            ))}
            <div style={{ marginTop: '4px', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
              存档将自动升级到 v{SAVE_VERSION} 格式
            </div>
          </div>
        )}

        {!isStartup && (
          <div className="save-manager-tabs">
            <button
              className={`tab-btn ${activeTab === 'save' ? 'active' : ''}`}
              onClick={() => setActiveTab('save')}
            >
              手动保存
            </button>
            <button
              className={`tab-btn ${activeTab === 'load' ? 'active' : ''}`}
              onClick={() => setActiveTab('load')}
            >
              载入存档
            </button>
            <button
              className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              自动保存设置
            </button>
          </div>
        )}

        <div className="save-manager-body">
          {activeTab === 'settings' && !isStartup ? (
            <div className="settings-panel">
              <div className="setting-row">
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    checked={autosaveConfig.enabled}
                    onChange={(e) =>
                      onUpdateAutosaveConfig({
                        ...autosaveConfig,
                        enabled: e.target.checked
                      })
                    }
                  />
                  <span className="checkmark"></span>
                  开启自动保存
                </label>
              </div>

              <div className="setting-row">
                <label>自动保存间隔：</label>
                <select
                  value={autosaveConfig.interval}
                  onChange={(e) =>
                    onUpdateAutosaveConfig({
                      ...autosaveConfig,
                      interval: Number(e.target.value)
                    })
                  }
                  disabled={!autosaveConfig.enabled}
                >
                  <option value={1}>1 分钟</option>
                  <option value={3}>3 分钟</option>
                  <option value={5}>5 分钟 (默认)</option>
                  <option value={10}>10 分钟</option>
                </select>
              </div>

              <p className="setting-tip">
                * 自动保存会使用独立的「自动存档」槽位，不会覆盖您手动保存的存档。
              </p>
            </div>
          ) : (
            <div className="slots-list">
              {/* Show Manual Slots */}
              {MANUAL_SLOTS.map((slotId) => {
                const metadata = getSlotDetails(slotId);
                const isSaveMode = activeTab === 'save' && !isStartup;

                return (
                  <div key={slotId} className={`slot-card ${metadata ? 'occupied' : 'empty'}`}>
                    <div className="slot-num">#{slotId}</div>

                    <div className="slot-info">
                      {metadata ? (
                        <>
                          <div className="slot-title">{metadata.name}</div>
                          <div className="slot-meta">
                            <span>Sprint: <strong>{metadata.sprintCount}</strong></span>
                            <span>资金: <strong>${metadata.funds}</strong></span>
                            <span>已完成项目: <strong>{metadata.completedProjectsCount}</strong></span>
                          </div>
                          <div className="slot-time">保存时间: {formatDate(metadata.savedAt)}</div>
                        </>
                      ) : (
                        <div className="slot-empty-text">空档位</div>
                      )}
                    </div>

                    <div className="slot-actions">
                      {isSaveMode ? (
                        <div className="save-action-form">
                          <input
                            type="text"
                            placeholder="输入存档备注名称..."
                            value={saveNameInputs[slotId] || ''}
                            onChange={(e) =>
                              setSaveNameInputs(prev => ({
                                ...prev,
                                [slotId]: e.target.value
                              }))
                            }
                            maxLength={20}
                          />
                          <button
                            className="btn-action btn-save"
                            onClick={() => handleSaveSlot(slotId)}
                          >
                            保存
                          </button>
                        </div>
                      ) : (
                        <>
                          {metadata ? (
                            <>
                              <button
                                className="btn-action btn-load"
                                onClick={() => handleLoadSlot(slotId)}
                              >
                                载入
                              </button>
                              <button
                                className="btn-action btn-delete"
                                onClick={() => handleDeleteSlot(slotId)}
                              >
                                删除
                              </button>
                            </>
                          ) : (
                            <button
                              className="btn-action btn-new"
                              onClick={() => handleCreateNewGame(slotId)}
                            >
                              {isStartup ? '新建游戏' : '新建存档'}
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Show Auto-save Slot if it exists or if in load mode */}
              {(activeTab === 'load' || isStartup) && (
                (() => {
                  const autoMetadata = getSlotDetails(AUTO_SLOT);
                  if (!autoMetadata && isStartup) return null;

                  return (
                    <div className={`slot-card auto-slot ${autoMetadata ? 'occupied' : 'empty'}`}>
                      <div className="slot-num">AUTO</div>
                      <div className="slot-info">
                        {autoMetadata ? (
                          <>
                            <div className="slot-title">自动保存存档</div>
                            <div className="slot-meta">
                              <span>Sprint: <strong>{autoMetadata.sprintCount}</strong></span>
                              <span>资金: <strong>${autoMetadata.funds}</strong></span>
                              <span>已完成项目: <strong>{autoMetadata.completedProjectsCount}</strong></span>
                            </div>
                            <div className="slot-time">保存时间: {formatDate(autoMetadata.savedAt)}</div>
                          </>
                        ) : (
                          <div className="slot-empty-text">无自动存档</div>
                        )}
                      </div>
                      <div className="slot-actions">
                        {autoMetadata && (
                          <button
                            className="btn-action btn-load"
                            onClick={() => handleLoadSlot(AUTO_SLOT)}
                          >
                            载入
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()
              )}
            </div>
          )}
        </div>

        {/* Confirmation Overlay */}
        {confirmAction && (
          <div className="confirm-modal-overlay">
            <div className="confirm-modal">
              <h3>确认操作</h3>
              <p>
                {confirmAction.type === 'delete' && `您确定要删除「${confirmAction.slotName}」吗？该操作不可逆！`}
                {confirmAction.type === 'overwrite' && `您确定要覆盖「${confirmAction.slotName}」吗？旧的存档数据将被清除！`}
                {confirmAction.type === 'load' && `确认载入「${confirmAction.slotName}」吗？当前未保存的进度将会丢失！`}
              </p>
              <div className="confirm-actions">
                <button className="confirm-btn confirm-yes" onClick={handleConfirmAction}>
                  确认
                </button>
                <button className="confirm-btn confirm-no" onClick={() => setConfirmAction(null)}>
                  取消
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
