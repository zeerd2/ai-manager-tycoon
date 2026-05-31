import { describe, expect, it } from 'vitest';
import { resolveCurrentSlotName } from '../src/hooks/useAutosave';
import type { SaveMetadata } from '../src/domain/saveSystem';

const slots: SaveMetadata[] = [
  { id: '1', name: '主存档', sprintCount: 1, funds: 5000, completedProjectsCount: 0, savedAt: 'now', version: 7 },
];

describe('useAutosave helpers', () => {
  it('resolves existing slot names before falling back', () => {
    expect(resolveCurrentSlotName('1', slots)).toBe('主存档');
    expect(resolveCurrentSlotName('2', slots)).toBe('存档位 2');
    expect(resolveCurrentSlotName('auto', slots)).toBe('自动存档');
  });
});
