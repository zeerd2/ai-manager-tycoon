/**
 * Save metadata extraction — pure functions, no storage dependency.
 *
 * This module contains the SaveMetadata interface and a pure extraction
 * helper that parses raw JSON into metadata. It does NOT import
 * saveSystem.ts, avoiding circular dependencies.
 */

export interface SaveMetadata {
  id: string; // '1', '2', '3', 'auto'
  name: string;
  sprintCount: number;
  funds: number;
  completedProjectsCount: number;
  savedAt: string;
  version: number;
}

interface SaveDataShape {
  name?: string;
  gameState?: {
    sprintCount?: number;
    funds?: number;
    completedProjectIds?: string[];
  };
  savedAt?: string;
  version?: number;
}

/**
 * Pure metadata extraction from raw JSON string.
 * Returns null if parsing fails or no data present.
 *
 * @param slotId - The slot identifier ('1', '2', '3', 'auto')
 * @param rawJson - Raw JSON string from localStorage (may be null)
 * @param getSlotDisplayName - Display name resolver (injected to avoid circular dep)
 */
export function extractSaveMetadata(
  slotId: string,
  rawJson: string | null,
  getSlotDisplayName: (slotId: string, name?: string) => string
): SaveMetadata | null {
  if (!rawJson) return null;

  try {
    const data = JSON.parse(rawJson) as SaveDataShape;
    return {
      id: slotId,
      name: getSlotDisplayName(slotId, data.name),
      sprintCount: data.gameState?.sprintCount || 0,
      funds: data.gameState?.funds || 0,
      completedProjectsCount: data.gameState?.completedProjectIds?.length || 0,
      savedAt: data.savedAt || new Date().toISOString(),
      version: data.version || 2,
    };
  } catch (e) {
    console.error(`Failed to parse metadata for slot ${slotId}`, e);
    return null;
  }
}
