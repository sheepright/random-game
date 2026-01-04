/**
 * Item inheritance system utilities
 * Based on requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 */

import { Item, ItemGrade, ItemStats, ItemType } from "../types/game";
import { INHERITANCE_RATES, GRADE_MULTIPLIERS } from "../constants/game";

// Grade hierarchy for inheritance calculations
const GRADE_HIERARCHY = {
  [ItemGrade.COMMON]: 0,
  [ItemGrade.RARE]: 1,
  [ItemGrade.EPIC]: 2,
  [ItemGrade.LEGENDARY]: 3,
} as const;

export interface InheritancePreview {
  sourceItem: Item;
  targetItem: Item;
  inheritanceRate: number;
  transferredStats: ItemStats;
  finalStats: ItemStats;
  canInherit: boolean;
  errorMessage?: string;
}

export interface InheritanceResult {
  success: boolean;
  inheritedItem?: Item;
  error?: string;
}

/**
 * Calculate the grade difference between two items
 */
export function calculateGradeDifference(
  sourceGrade: ItemGrade,
  targetGrade: ItemGrade
): number {
  const sourceLevel = GRADE_HIERARCHY[sourceGrade];
  const targetLevel = GRADE_HIERARCHY[targetGrade];
  return targetLevel - sourceLevel;
}

/**
 * Get inheritance rate based on grade difference
 */
export function getInheritanceRate(gradeDifference: number): number {
  if (gradeDifference <= 0) {
    return 0; // Cannot inherit to same or lower grade
  }

  if (gradeDifference > 3) {
    return 0; // Maximum 3 grade difference
  }

  return (
    INHERITANCE_RATES[gradeDifference as keyof typeof INHERITANCE_RATES] || 0
  );
}

/**
 * Calculate stats that will be transferred during inheritance
 */
export function calculateTransferredStats(
  sourceItem: Item,
  inheritanceRate: number
): ItemStats {
  const enhancedStats = sourceItem.enhancedStats;

  return {
    attack: Math.floor(enhancedStats.attack * inheritanceRate),
    defense: Math.floor(enhancedStats.defense * inheritanceRate),
    defensePenetration: Math.floor(
      enhancedStats.defensePenetration * inheritanceRate
    ),
    additionalAttackChance:
      enhancedStats.additionalAttackChance * inheritanceRate,
  };
}

/**
 * Calculate final stats after inheritance
 */
export function calculateFinalStats(
  targetItem: Item,
  transferredStats: ItemStats
): ItemStats {
  return {
    attack: targetItem.enhancedStats.attack + transferredStats.attack,
    defense: targetItem.enhancedStats.defense + transferredStats.defense,
    defensePenetration:
      targetItem.enhancedStats.defensePenetration +
      transferredStats.defensePenetration,
    additionalAttackChance:
      targetItem.enhancedStats.additionalAttackChance +
      transferredStats.additionalAttackChance,
  };
}

/**
 * Validate if inheritance is possible between two items
 */
export function validateInheritance(
  sourceItem: Item,
  targetItem: Item
): { valid: boolean; error?: string } {
  // Check if items are of the same type (Requirement 5.3)
  if (sourceItem.type !== targetItem.type) {
    return {
      valid: false,
      error: "계승은 같은 장비 타입끼리만 가능합니다.",
    };
  }

  // Check if target grade is higher than source grade (Requirement 5.1)
  const gradeDifference = calculateGradeDifference(
    sourceItem.grade,
    targetItem.grade
  );
  if (gradeDifference <= 0) {
    return {
      valid: false,
      error: "더 높은 등급의 아이템으로만 계승할 수 있습니다.",
    };
  }

  // Check if grade difference is within allowed range
  if (gradeDifference > 3) {
    return {
      valid: false,
      error: "등급 차이가 너무 큽니다. (최대 3등급 차이)",
    };
  }

  return { valid: true };
}

/**
 * Generate inheritance preview
 */
export function generateInheritancePreview(
  sourceItem: Item,
  targetItem: Item
): InheritancePreview {
  const validation = validateInheritance(sourceItem, targetItem);

  if (!validation.valid) {
    return {
      sourceItem,
      targetItem,
      inheritanceRate: 0,
      transferredStats: {
        attack: 0,
        defense: 0,
        defensePenetration: 0,
        additionalAttackChance: 0,
      },
      finalStats: targetItem.enhancedStats,
      canInherit: false,
      errorMessage: validation.error,
    };
  }

  const gradeDifference = calculateGradeDifference(
    sourceItem.grade,
    targetItem.grade
  );
  const inheritanceRate = getInheritanceRate(gradeDifference);
  const transferredStats = calculateTransferredStats(
    sourceItem,
    inheritanceRate
  );
  const finalStats = calculateFinalStats(targetItem, transferredStats);

  return {
    sourceItem,
    targetItem,
    inheritanceRate,
    transferredStats,
    finalStats,
    canInherit: true,
  };
}

/**
 * Calculate inheritance preview (alias for generateInheritancePreview)
 */
export function calculateInheritancePreview(
  sourceItem: Item,
  targetItem: Item
): {
  success: boolean;
  inheritedItem?: Item;
  inheritanceRate?: number;
  transferredStats?: ItemStats;
  error?: string;
} {
  const preview = generateInheritancePreview(sourceItem, targetItem);

  if (!preview.canInherit) {
    return {
      success: false,
      error: preview.errorMessage,
    };
  }

  // Create inherited item
  const inheritedItem: Item = {
    ...preview.targetItem,
    enhancedStats: preview.finalStats,
  };

  return {
    success: true,
    inheritedItem,
    inheritanceRate: preview.inheritanceRate,
    transferredStats: preview.transferredStats,
  };
}

/**
 * Check if inheritance can be performed
 */
export function canPerformInheritance(
  sourceItem: Item,
  targetItem: Item
): boolean {
  const validation = validateInheritance(sourceItem, targetItem);
  return validation.valid;
}

/**
 * Perform item inheritance
 */
export function performInheritance(
  sourceItem: Item,
  targetItem: Item
): InheritanceResult {
  const preview = generateInheritancePreview(sourceItem, targetItem);

  if (!preview.canInherit) {
    return {
      success: false,
      error: preview.errorMessage,
    };
  }

  // Create new item with inherited stats
  const inheritedItem: Item = {
    ...targetItem,
    enhancedStats: preview.finalStats,
    // Keep the same ID and other properties of target item
  };

  return {
    success: true,
    inheritedItem,
  };
}

/**
 * Get Korean name for item grade
 */
export function getGradeDisplayName(grade: ItemGrade): string {
  const gradeNames = {
    [ItemGrade.COMMON]: "일반",
    [ItemGrade.RARE]: "레어",
    [ItemGrade.EPIC]: "에픽",
    [ItemGrade.LEGENDARY]: "전설",
  };

  return gradeNames[grade];
}

/**
 * Get Korean name for item type
 */
export function getItemTypeDisplayName(type: ItemType): string {
  const typeNames = {
    [ItemType.HELMET]: "헬멧",
    [ItemType.ARMOR]: "아머",
    [ItemType.PANTS]: "팬츠",
    [ItemType.GLOVES]: "글러브",
    [ItemType.SHOES]: "슈즈",
    [ItemType.SHOULDER]: "숄더",
    [ItemType.EARRING]: "귀걸이",
    [ItemType.RING]: "반지",
    [ItemType.NECKLACE]: "목걸이",
    [ItemType.MAIN_WEAPON]: "주무기",
    [ItemType.SUB_WEAPON]: "보조무기",
  };

  return typeNames[type];
}

/**
 * Format stats for display
 */
export function formatStatsForDisplay(stats: ItemStats): string {
  const parts: string[] = [];

  if (stats.attack > 0) {
    parts.push(`공격력 +${stats.attack}`);
  }
  if (stats.defense > 0) {
    parts.push(`방어력 +${stats.defense}`);
  }
  if (stats.defensePenetration > 0) {
    parts.push(`방어율 무시 +${stats.defensePenetration}`);
  }

  return parts.join(", ");
}
