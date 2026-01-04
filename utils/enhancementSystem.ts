/**
 * Enhancement System for Idle Gacha Game
 * Implements credit-based item enhancement with success rates and stat scaling
 * Based on requirements 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.11
 */

import {
  Item,
  ItemGrade,
  ItemStats,
  ItemType,
  EnhancementResult,
  EnhancementInfo,
  EnhancementAttempt,
} from "../types/game";

// Maximum enhancement level
export const MAX_ENHANCEMENT_LEVEL = 25;

// 아이템 타입별 주요 스탯 정의 (Requirements 10.2, 10.12)
export const ITEM_PRIMARY_STATS: Record<ItemType, keyof ItemStats> = {
  // 방어구 (방어력)
  [ItemType.HELMET]: "defense",
  [ItemType.ARMOR]: "defense",
  [ItemType.PANTS]: "defense",

  // 방어구 (추가타격 확률)
  [ItemType.GLOVES]: "additionalAttackChance",
  [ItemType.SHOES]: "additionalAttackChance",
  [ItemType.SHOULDER]: "additionalAttackChance",

  // 장신구 (방어력 무시)
  [ItemType.EARRING]: "defensePenetration",
  [ItemType.RING]: "defensePenetration",
  [ItemType.NECKLACE]: "defensePenetration",

  // 무기 (공격력)
  [ItemType.MAIN_WEAPON]: "attack",
  [ItemType.SUB_WEAPON]: "attack",
};

// Enhancement cost calculation (밸런스 조정됨 - Requirements 10.12)
export function calculateEnhancementCost(
  enhancementLevel: number,
  grade: ItemGrade
): number {
  const gradeMultiplier = {
    [ItemGrade.COMMON]: 1.0,
    [ItemGrade.RARE]: 1.3,
    [ItemGrade.EPIC]: 1.7,
    [ItemGrade.LEGENDARY]: 2.2,
  };

  let baseCost: number;

  if (enhancementLevel <= 5) {
    // 1~5강: 높은 비용으로 낮은 효율 구현
    baseCost = 100 + enhancementLevel * 100; // 높은 기본 비용
  } else if (enhancementLevel <= 11) {
    // 6~11강: 중간 비용
    baseCost = 400 + (enhancementLevel - 5) * 50; // 점진적 증가
  } else {
    // 12~25강: 비용은 증가하지만 스탯 증가량이 훨씬 크므로 효율적
    const baseHighCost = 800; // 12강 기본 비용
    const levelAbove12 = enhancementLevel - 11;
    baseCost = baseHighCost * Math.pow(1.4, levelAbove12 - 1); // 증가율 낮춤
  }

  return Math.floor(baseCost * gradeMultiplier[grade]);
}

// Enhancement success rate (100% until level 12, then decreasing)
export function getEnhancementSuccessRate(enhancementLevel: number): number {
  if (enhancementLevel <= 11) {
    return 1.0; // 100% 성공
  }

  // 12강부터 성공률 감소
  const successRates: Record<number, number> = {
    12: 0.9, // 90%
    13: 0.85, // 85%
    14: 0.8, // 80%
    15: 0.75, // 75%
    16: 0.7, // 70%
    17: 0.65, // 65%
    18: 0.6, // 60%
    19: 0.55, // 55%
    20: 0.5, // 50%
    21: 0.45, // 45%
    22: 0.4, // 40%
    23: 0.35, // 35%
    24: 0.3, // 30%
    25: 0.25, // 25%
  };

  return successRates[enhancementLevel] || 0.25;
}

// Enhancement stat increase calculation (아이템 고유 스탯만 증가, 밸런스 조정됨)
export function getEnhancementStatIncrease(
  enhancementLevel: number,
  grade: ItemGrade,
  itemType: ItemType
): ItemStats {
  // 등급별 기본 증가량 (최소 1 보장)
  const baseIncrease = {
    [ItemGrade.COMMON]: 1.0,
    [ItemGrade.RARE]: 1.5,
    [ItemGrade.EPIC]: 2.2,
    [ItemGrade.LEGENDARY]: 3.0,
  };

  // 레벨별 효율 증가 (Requirements 10.12) - 높은 레벨일수록 더 많은 스탯 증가
  let levelMultiplier: number;
  if (enhancementLevel <= 5) {
    levelMultiplier = 0.6; // 1~5강: 낮은 효율
  } else if (enhancementLevel <= 11) {
    levelMultiplier = 0.8 + (enhancementLevel - 5) * 0.05; // 6~11강: 점진적 효율 증가 (0.8 ~ 1.1)
  } else {
    // 12~25강: 높은 효율 - 스탯이 크게 증가하여 비용 대비 효율적
    const levelAbove12 = enhancementLevel - 11;
    levelMultiplier = 1.5 + levelAbove12 * 0.5; // 1.5 ~ 8.5 (매우 큰 증가)
  }

  const primaryStat = ITEM_PRIMARY_STATS[itemType];
  const baseValue = baseIncrease[grade] * levelMultiplier;

  // 초기화된 스탯 객체 (모든 스탯 0으로 시작)
  const statIncrease: ItemStats = {
    attack: 0,
    defense: 0,
    defensePenetration: 0,
    additionalAttackChance: 0,
  };

  // 해당 아이템의 주요 스탯만 증가 (Requirements 10.2)
  switch (primaryStat) {
    case "attack":
      statIncrease.attack = Math.max(1, Math.floor(baseValue)); // 최소 1 보장
      break;
    case "defense":
      statIncrease.defense = Math.max(1, Math.floor(baseValue)); // 최소 1 보장
      break;
    case "defensePenetration":
      statIncrease.defensePenetration = Math.max(1, Math.floor(baseValue)); // 최소 1 보장
      break;
    case "additionalAttackChance":
      statIncrease.additionalAttackChance = Math.max(0.001, baseValue * 0.001); // 최소 0.1% 보장
      break;
  }

  return statIncrease;
}

// Get enhancement preview information
export function getEnhancementInfo(item: Item): EnhancementInfo {
  if (!item) {
    throw new Error("Item is null or undefined");
  }

  if (typeof item.enhancementLevel !== "number") {
    throw new Error("Item enhancement level is not a number");
  }

  if (!item.grade || !Object.values(ItemGrade).includes(item.grade)) {
    throw new Error("Item has invalid grade");
  }

  if (!item.type || !Object.values(ItemType).includes(item.type)) {
    throw new Error("Item has invalid type");
  }

  const nextLevel = item.enhancementLevel + 1;

  if (nextLevel > MAX_ENHANCEMENT_LEVEL) {
    throw new Error("Item is already at maximum enhancement level");
  }

  const cost = calculateEnhancementCost(nextLevel, item.grade);
  const successRate = getEnhancementSuccessRate(nextLevel);
  const statIncrease = getEnhancementStatIncrease(
    nextLevel,
    item.grade,
    item.type
  );

  return {
    cost,
    statIncrease,
    newEnhancementLevel: nextLevel,
    successRate,
    itemType: item.type,
  };
}

// Check if item can be enhanced
export function canEnhanceItem(item: Item, availableCredits: number): boolean {
  if (!item) {
    console.error("canEnhanceItem: item is null or undefined");
    return false;
  }

  if (typeof item.enhancementLevel !== "number") {
    console.error(
      "canEnhanceItem: item.enhancementLevel is not a number",
      item
    );
    return false;
  }

  if (item.enhancementLevel >= MAX_ENHANCEMENT_LEVEL) {
    return false;
  }

  try {
    const enhancementInfo = getEnhancementInfo(item);
    return availableCredits >= enhancementInfo.cost;
  } catch (error) {
    console.error("canEnhanceItem: error getting enhancement info", error);
    return false;
  }
}

// Perform enhancement attempt
export function performEnhancement(
  item: Item,
  availableCredits: number
): EnhancementAttempt {
  if (!item) {
    throw new Error("Item is null or undefined");
  }

  if (!canEnhanceItem(item, availableCredits)) {
    throw new Error(
      "Cannot enhance item: insufficient credits or max level reached"
    );
  }

  const enhancementInfo = getEnhancementInfo(item);
  const previousLevel = item.enhancementLevel;
  const isSuccess = Math.random() < enhancementInfo.successRate;

  let result: EnhancementResult;
  let newLevel: number;
  let statChange: ItemStats;

  if (isSuccess) {
    // 성공: 레벨 증가 및 스탯 증가
    result = EnhancementResult.SUCCESS;
    newLevel = enhancementInfo.newEnhancementLevel;
    statChange = enhancementInfo.statIncrease;
  } else {
    // 실패
    if (previousLevel >= 12) {
      // 12강 이상에서 실패 시 레벨 1 감소
      result = EnhancementResult.DOWNGRADE;
      newLevel = Math.max(0, previousLevel - 1);

      // 감소된 레벨의 스탯 증가량을 음수로 적용
      const lostStatIncrease = getEnhancementStatIncrease(
        previousLevel,
        item.grade,
        item.type
      );
      statChange = {
        attack: -lostStatIncrease.attack,
        defense: -lostStatIncrease.defense,
        defensePenetration: -lostStatIncrease.defensePenetration,
        additionalAttackChance: -lostStatIncrease.additionalAttackChance,
      };
    } else {
      // 11강 이하에서는 실패해도 레벨 유지 (이론적으로 발생하지 않음)
      result = EnhancementResult.FAILURE;
      newLevel = previousLevel;
      statChange = {
        attack: 0,
        defense: 0,
        defensePenetration: 0,
        additionalAttackChance: 0,
      };
    }
  }

  return {
    result,
    previousLevel,
    newLevel,
    costPaid: enhancementInfo.cost,
    statChange,
  };
}

// Apply enhancement result to item
export function applyEnhancementResult(
  item: Item,
  enhancementAttempt: EnhancementAttempt
): Item {
  const newEnhancedStats: ItemStats = {
    attack: item.enhancedStats.attack + enhancementAttempt.statChange.attack,
    defense: item.enhancedStats.defense + enhancementAttempt.statChange.defense,
    defensePenetration:
      item.enhancedStats.defensePenetration +
      enhancementAttempt.statChange.defensePenetration,
    additionalAttackChance:
      item.enhancedStats.additionalAttackChance +
      enhancementAttempt.statChange.additionalAttackChance,
  };

  return {
    ...item,
    enhancementLevel: enhancementAttempt.newLevel,
    enhancedStats: newEnhancedStats,
  };
}

// Calculate total item stats (base + enhanced)
export function calculateTotalItemStats(item: Item): ItemStats {
  return {
    attack: item.baseStats.attack + item.enhancedStats.attack,
    defense: item.baseStats.defense + item.enhancedStats.defense,
    defensePenetration:
      item.baseStats.defensePenetration + item.enhancedStats.defensePenetration,
    additionalAttackChance:
      item.baseStats.additionalAttackChance +
      item.enhancedStats.additionalAttackChance,
  };
}
