import { useEffect, useRef } from 'react';
import type { GameState } from '../domain/gameState';
import type { AutosaveConfig, SaveMetadata } from '../domain/saveSystem';
import { AUTO_SLOT, getSaveSlotMetadata, getSlotDisplayName, saveToSlot } from '../domain/saveSystem';

export function resolveCurrentSlotName(slotId: string, savedSlots: SaveMetadata[]): string {
  const activeSlot = savedSlots.find((slot) => slot.id === slotId);
  return getSlotDisplayName(slotId, activeSlot?.name);
}

interface UseAutosaveOptions {
  currentSlotId: string | null;
  gameState: GameState;
  autosaveConfig: AutosaveConfig;
}

export function useAutosave({ currentSlotId, gameState, autosaveConfig }: UseAutosaveOptions): void {
  const latestGameState = useRef(gameState);

  useEffect(() => {
    latestGameState.current = gameState;
  }, [gameState]);

  useEffect(() => {
    if (currentSlotId) {
      try {
        const name = getSlotDisplayName(currentSlotId, getSaveSlotMetadata(currentSlotId)?.name);
        saveToSlot(currentSlotId, name, gameState);
      } catch (e) {
        console.error('Failed to auto-save to current slot', e);
      }
    }
  }, [gameState, currentSlotId]);

  useEffect(() => {
    if (!autosaveConfig.enabled || !currentSlotId || gameState.gameOver) {
      return;
    }

    const intervalMs = autosaveConfig.interval * 60 * 1000;
    const timer = setInterval(() => {
      const stateToSave = latestGameState.current;
      try {
        saveToSlot(AUTO_SLOT, getSlotDisplayName(AUTO_SLOT), stateToSave);
      } catch (e) {
        console.error('Autosave failed', e);
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [autosaveConfig.enabled, autosaveConfig.interval, currentSlotId, gameState.gameOver]);
}
