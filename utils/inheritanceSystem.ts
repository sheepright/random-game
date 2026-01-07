/**
 * Item inheritance system utilities - Enhancement Level Transfer System
 * Based on requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 *
 * 계승 시스템: 낮은 등급 아이템의 강화 등급을 높은 등급 아이템으로 전승
 * 예: 에픽 +10 → 레전드리 +8 (일정 확률로 레벨 감소)
 */

import { Item, ItemGrade, ItemStats, ItemType } from "../types/game";
import { INHERITANCE_RATES, GRADE_MULTIPLIERS } from "../constants/game";

// Grade hierarchy for inheritance calculations
const GRADE_HIERARCHY = {
  [ItemGrade.COMMON]: 0,
  [ItemGrade.RARE]: 1,
  [ItemGrade.EPIC]: 2,
  [ItemGrade.LEGENDARY]: 3,
  [ItemGrade.MYTHIC]: 4,
} as const;

// 등급 차이별 강화 등급 감소량
const ENHANCEMENT_LEVEL_REDUCTION = {
  1: 1, // 1등급 차이: -1 레벨
  2: 2, // 2등급 차이: -2 레벨
  3: 3, // 3등급 차이: -3 레벨
  4: 4, // 4등급 차이: -4 레벨
} as const;

// 등급 차이별 계승 성공률 (대폭 너프)
const INHERITANCE_SUCCESS_RATES = {
  1: 0.7, // 1등급 차이: 70% 성공률 (90% → 70%)
  2: 0.5, // 2등급 차이: 50% 성공률 (70% → 50%)
  3: 0.3, // 3등급 차이: 30% 성공률 (50% → 30%)
  4: 0.15, // 4등급 차이: 15% 성공률 (30% → 15%)
} as const;

export interface InheritancePreview {
  sourceItem: Item;
  targetItem: Item;
  successRate: number;
  sourceEnhancementLevel: number;
  targetEnhancementLevel: number;
  levelReduction: number;
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
 * Get inheritance success rate based on grade difference
 */
export function getInheritanceSuccessRate(gradeDifference: number): number {
  if (gradeDifference <= 0) {
    return 0; // Cannot inherit to same or lower grade
  }

  if (gradeDifference > 4) {
    return 0; // Maximum 4 grade difference
  }

  return (
    INHERITANCE_SUCCESS_RATES[
      gradeDifference as keyof typeof INHERITANCE_SUCCESS_RATES
    ] || 0
  );
}

/**
 * Calculate enhancement level reduction based on grade difference
 */
export function calculateEnhancementLevelReduction(
  gradeDifference: number
): number {
  if (gradeDifference <= 0 || gradeDifference > 4) {
    return 0;
  }

  return (
    ENHANCEMENT_LEVEL_REDUCTION[
      gradeDifference as keyof typeof ENHANCEMENT_LEVEL_REDUCTION
    ] || 0
  );
}

/**
 * Calculate target enhancement level after inheritance
 */
export function calculateTargetEnhancementLevel(
  sourceEnhancementLevel: number,
  gradeDifference: number
): number {
  const levelReduction = calculateEnhancementLevelReduction(gradeDifference);
  return Math.max(0, sourceEnhancementLevel - levelReduction);
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
  if (gradeDifference > 4) {
    return {
      valid: false,
      error: "등급 차이가 너무 큽니다. (최대 4등급 차이)",
    };
  }

  // Check if source item has enhancement level to transfer
  if (sourceItem.enhancementLevel <= 0) {
    return {
      valid: false,
      error:
        "소스 아이템의 강화 등급이 0입니다. 강화된 아이템만 계승할 수 있습니다.",
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
      successRate: 0,
      sourceEnhancementLevel: sourceItem.enhancementLevel,
      targetEnhancementLevel: 0,
      levelReduction: 0,
      canInherit: false,
      errorMessage: validation.error,
    };
  }

  const gradeDifference = calculateGradeDifference(
    sourceItem.grade,
    targetItem.grade
  );
  const successRate = getInheritanceSuccessRate(gradeDifference);
  const levelReduction = calculateEnhancementLevelReduction(gradeDifference);
  const targetEnhancementLevel = calculateTargetEnhancementLevel(
    sourceItem.enhancementLevel,
    gradeDifference
  );

  return {
    sourceItem,
    targetItem,
    successRate,
    sourceEnhancementLevel: sourceItem.enhancementLevel,
    targetEnhancementLevel,
    levelReduction,
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
  successRate?: number;
  targetEnhancementLevel?: number;
  error?: string;
} {
  const preview = generateInheritancePreview(sourceItem, targetItem);

  if (!preview.canInherit) {
    return {
      success: false,
      error: preview.errorMessage,
    };
  }

  // Create inherited item with transferred enhancement level
  const inheritedItem: Item = {
    ...preview.targetItem,
    enhancementLevel: preview.targetEnhancementLevel,
    // 강화 등급에 따른 스탯 재계산은 enhancementSystem에서 처리
  };

  return {
    success: true,
    inheritedItem,
    successRate: preview.successRate,
    targetEnhancementLevel: preview.targetEnhancementLevel,
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
 * Perform item inheritance with enhancement level transfer
 * 실패 시 소스 아이템(강화된 아이템)이 파괴됨
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

  // 계승 성공률 체크
  const isSuccess = Math.random() < preview.successRate;

  if (!isSuccess) {
    return {
      success: false,
      error: "계승에 실패했습니다. 소스 아이템이 파괴되었습니다.",
    };
  }

  // Create new item with inherited enhancement level
  const inheritedItem: Item = {
    ...targetItem,
    enhancementLevel: preview.targetEnhancementLevel,
    // 강화 등급에 따른 스탯은 enhancementSystem에서 재계산됨
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
    [ItemGrade.MYTHIC]: "신화",
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
    [ItemType.PET]: "펫",
  };

  return typeNames[type];
}

/**
 * Format enhancement level transfer for display
 */
export function formatEnhancementLevelTransfer(
  sourceLevel: number,
  targetLevel: number,
  levelReduction: number
): string {
  return `+${sourceLevel} → +${targetLevel} (${levelReduction}레벨 감소)`;
}
