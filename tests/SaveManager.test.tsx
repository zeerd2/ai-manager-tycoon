import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SaveManager } from '../src/components/SaveManager';
import type { GameState } from '../src/domain/gameState';
import type { AutosaveConfig } from '../src/domain/saveSystem';

const minimalGameState: GameState = {
  funds: 5000,
  sprintCount: 3,
  agents: [],
  projects: [],
  completedProjectIds: [],
  unlockedAchievementIds: [],
  history: [],
  relations: [],
  gameOver: false,
  reputation: 50,
  confidence: 50,
};

const defaultAutosaveConfig: AutosaveConfig = {
  enabled: true,
  interval: 5,
};

describe('SaveManager', () => {
  it('renders nothing when isOpen is false and isStartup is false', () => {
    const { container } = render(
      <SaveManager
        gameState={minimalGameState}
        onLoadGame={vi.fn()}
        onNewGame={vi.fn()}
        isOpen={false}
        onClose={vi.fn()}
        isStartup={false}
        autosaveConfig={defaultAutosaveConfig}
        onUpdateAutosaveConfig={vi.fn()}
      />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders save slots with correct layout', () => {
    render(
      <SaveManager
        gameState={minimalGameState}
        onLoadGame={vi.fn()}
        onNewGame={vi.fn()}
        isOpen={true}
        onClose={vi.fn()}
        isStartup={false}
        autosaveConfig={defaultAutosaveConfig}
        onUpdateAutosaveConfig={vi.fn()}
      />
    );

    expect(screen.getByText('💾 存档管理')).toBeInTheDocument();
    // Should have slots #1, #2, #3
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('#2')).toBeInTheDocument();
    expect(screen.getByText('#3')).toBeInTheDocument();
  });

  it('shows tabs for save, load, and settings when not isStartup', () => {
    render(
      <SaveManager
        gameState={minimalGameState}
        onLoadGame={vi.fn()}
        onNewGame={vi.fn()}
        isOpen={true}
        onClose={vi.fn()}
        isStartup={false}
        autosaveConfig={defaultAutosaveConfig}
        onUpdateAutosaveConfig={vi.fn()}
      />
    );

    expect(screen.getByText('手动保存')).toBeInTheDocument();
    expect(screen.getByText('载入存档')).toBeInTheDocument();
    expect(screen.getByText('自动保存设置')).toBeInTheDocument();
  });

  it('shows autosave settings panel when settings tab is clicked', () => {
    render(
      <SaveManager
        gameState={minimalGameState}
        onLoadGame={vi.fn()}
        onNewGame={vi.fn()}
        isOpen={true}
        onClose={vi.fn()}
        isStartup={false}
        autosaveConfig={defaultAutosaveConfig}
        onUpdateAutosaveConfig={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText('自动保存设置'));
    expect(screen.getByText('开启自动保存')).toBeInTheDocument();
    expect(screen.getByText('自动保存间隔：')).toBeInTheDocument();
  });

  it('renders close button when not isStartup', () => {
    render(
      <SaveManager
        gameState={minimalGameState}
        onLoadGame={vi.fn()}
        onNewGame={vi.fn()}
        isOpen={true}
        onClose={vi.fn()}
        isStartup={false}
        autosaveConfig={defaultAutosaveConfig}
        onUpdateAutosaveConfig={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /×/ })).toBeInTheDocument();
  });
});
