/**
 * Game calculation utilities
 * Based on requirements 2.1 and 4.3
 */

import { PlayerStats, EquippedItems } from "../types/game";

/**
 * Calculate offline credits earned based on elapsed time and generation rate
 */
export function calculateOfflineCredits(
  elapsedTimeMs: number,
  creditPerSecond: number,
  maxOfflineHours: number = 24
): number {
  // 음수 시간은 0으로 처리
  const validElapsedTimeMs = Math.max(0, elapsedTimeMs);
  const elapsedSeconds = Math.floor(validElapsedTimeMs / 1000);
  const maxOfflineSeconds = maxOfflineHours * 60 * 60;
  const cappedElapsedSeconds = Math.min(elapsedSeconds, maxOfflineSeconds);

  return Math.floor(cappedElapsedSeconds * creditPerSecond);
}

/**
 * Check if player stats meet stage requirements
 */
export function canClearStage(
  playerStats: PlayerStats,
  requiredAttack: number,
  requiredDefense: number
): boolean {
  return (
    playerStats.attack >= requiredAttack &&
    playerStats.defense >= requiredDefense
  );
}

/**
 * Validate game state for corruption detection
 */
export function isValidGameState(state: any): boolean {
  if (!state || typeof state !== "object") return false;

  // Check required properties exist and have correct types
  const requiredProps = [
    "credits",
    "creditPerSecond",
    "currentStage",
    "lastSaveTime",
    "equippedItems",
    "inventory",
    "playerStats",
  ];

  for (const prop of requiredProps) {
    if (!(prop in state)) return false;
  }

  // Check numeric properties are valid numbers
  if (typeof state.credits !== "number" || state.credits < 0) return false;
  if (typeof state.creditPerSecond !== "number" || state.creditPerSecond <= 0)
    return false;
  if (typeof state.currentStage !== "number" || state.currentStage < 1)
    return false;
  if (typeof state.lastSaveTime !== "number" || state.lastSaveTime <= 0)
    return false;

  // Check equipped items structure
  if (!state.equippedItems || typeof state.equippedItems !== "object")
    return false;

  // Check inventory is array
  if (!Array.isArray(state.inventory)) return false;

  // Check player stats structure
  if (!state.playerStats || typeof state.playerStats !== "object") return false;
  const statTypes = ["attack", "defense", "defensePenetration"];
  for (const stat of statTypes) {
    if (
      typeof state.playerStats[stat] !== "number" ||
      state.playerStats[stat] < 0
    )
      return false;
  }

  return true;
}

/**
 * Calculate total stats from equipped items
 */
export function calculateTotalStats(equippedItems: EquippedItems): PlayerStats {
  const stats: PlayerStats = {
    attack: 0,
    defense: 0,
    defensePenetration: 0,
    additionalAttackChance: 0,
  };

  // Sum stats from all equipped items
  Object.values(equippedItems).forEach((item) => {
    if (item) {
      stats.attack += item.enhancedStats.attack;
      stats.defense += item.enhancedStats.defense;
      stats.defensePenetration += item.enhancedStats.defensePenetration;
      stats.additionalAttackChance += item.enhancedStats.additionalAttackChance;
    }
  });

  return stats;
}

/**
 * Format time duration for display
 */
export function formatDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}일 ${hours % 24}시간`;
  } else if (hours > 0) {
    return `${hours}시간 ${minutes % 60}분`;
  } else if (minutes > 0) {
    return `${minutes}분 ${seconds % 60}초`;
  } else {
    return `${seconds}초`;
  }
}

/**
 * Format large numbers for display
 */
export function formatNumber(num: number): string {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + "B";
  } else if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  } else {
    return num.toString();
  }
}
