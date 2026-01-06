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

  // 펫 (공격력)
  [ItemType.PET]: "attack",
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
    [ItemGrade.MYTHIC]: 3.0,
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

// Enhancement success rate (낮춰진 성공률과 파괴 확률 추가)
export function getEnhancementSuccessRate(enhancementLevel: number): number {
  if (enhancementLevel <= 5) {
    return 1.0; // 1~5강: 100% 성공
  } else if (enhancementLevel <= 10) {
    return 0.95; // 6~10강: 95% 성공
  } else if (enhancementLevel <= 15) {
    return 0.8; // 11~15강: 80% 성공
  } else if (enhancementLevel <= 19) {
    return 0.6; // 16~19강: 60% 성공
  } else {
    // 20강 이상: 낮은 성공률
    const successRates: Record<number, number> = {
      20: 0.4, // 40%
      21: 0.35, // 35%
      22: 0.3, // 30%
      23: 0.25, // 25%
      24: 0.2, // 20%
      25: 0.15, // 15%
    };
    return successRates[enhancementLevel] || 0.1;
  }
}

// Enhancement destruction rate (20강 이상에서 파괴 확률)
export function getEnhancementDestructionRate(
  enhancementLevel: number
): number {
  if (enhancementLevel < 20) {
    return 0; // 19강 이하는 파괴되지 않음
  }

  // 20강 이상에서 파괴 확률
  const destructionRates: Record<number, number> = {
    20: 0.1, // 10%
    21: 0.15, // 15%
    22: 0.2, // 20%
    23: 0.25, // 25%
    24: 0.3, // 30%
    25: 0.35, // 35%
  };

  return destructionRates[enhancementLevel] || 0.4;
}

// Enhancement stat increase calculation (높은 스탯 증가량으로 보상)
export function getEnhancementStatIncrease(
  enhancementLevel: number,
  grade: ItemGrade,
  itemType: ItemType
): ItemStats {
  // 등급별 기본 증가량 (대폭 증가)
  const baseIncrease = {
    [ItemGrade.COMMON]: 2.0, // 1.0 → 2.0
    [ItemGrade.RARE]: 3.5, // 1.5 → 3.5
    [ItemGrade.EPIC]: 5.5, // 2.2 → 5.5
    [ItemGrade.LEGENDARY]: 8.0, // 3.0 → 8.0
    [ItemGrade.MYTHIC]: 12.0, // 새로 추가
  };

  // 레벨별 효율 증가 (더 높은 보상)
  let levelMultiplier: number;
  if (enhancementLevel <= 5) {
    levelMultiplier = 1.0; // 1~5강: 기본 효율
  } else if (enhancementLevel <= 10) {
    levelMultiplier = 1.2 + (enhancementLevel - 5) * 0.1; // 6~10강: 1.2 ~ 1.7
  } else if (enhancementLevel <= 15) {
    levelMultiplier = 1.8 + (enhancementLevel - 10) * 0.2; // 11~15강: 1.8 ~ 2.8
  } else if (enhancementLevel <= 19) {
    levelMultiplier = 3.0 + (enhancementLevel - 15) * 0.3; // 16~19강: 3.0 ~ 4.2
  } else {
    // 20~25강: 매우 높은 효율 (위험 대비 높은 보상)
    const levelAbove20 = enhancementLevel - 19;
    levelMultiplier = 5.0 + levelAbove20 * 1.0; // 5.0 ~ 11.0
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
      statIncrease.attack = Math.max(2, Math.floor(baseValue)); // 최소 2 보장
      break;
    case "defense":
      statIncrease.defense = Math.max(2, Math.floor(baseValue)); // 최소 2 보장
      break;
    case "defensePenetration":
      statIncrease.defensePenetration = Math.max(2, Math.floor(baseValue)); // 최소 2 보장
      break;
    case "additionalAttackChance":
      statIncrease.additionalAttackChance = Math.max(0.002, baseValue * 0.001); // 최소 0.2% 보장
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
  const destructionRate = getEnhancementDestructionRate(nextLevel);
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
    destructionRate,
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

// Perform enhancement attempt (파괴 확률 추가)
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
  const successRate = enhancementInfo.successRate;
  const destructionRate = enhancementInfo.destructionRate || 0;

  const randomValue = Math.random();

  let result: EnhancementResult;
  let newLevel: number;
  let statChange: ItemStats;

  if (randomValue < successRate) {
    // 성공: 레벨 증가 및 스탯 증가
    result = EnhancementResult.SUCCESS;
    newLevel = enhancementInfo.newEnhancementLevel;
    statChange = enhancementInfo.statIncrease;
  } else if (randomValue < successRate + destructionRate) {
    // 파괴: 아이템이 파괴되어 강화 등급이 0으로 초기화
    result = EnhancementResult.DESTRUCTION;
    newLevel = 0;

    // 모든 강화 스탯을 잃음
    statChange = {
      attack: -item.enhancedStats.attack,
      defense: -item.enhancedStats.defense,
      defensePenetration: -item.enhancedStats.defensePenetration,
      additionalAttackChance: -item.enhancedStats.additionalAttackChance,
    };
  } else {
    // 실패: 레벨 감소 (11강 이상에서만)
    if (previousLevel >= 11) {
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
      // 10강 이하에서는 실패해도 레벨 유지
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

// Apply enhancement result to item (강화 등급에 따른 스탯 재계산 포함)
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

// Recalculate enhanced stats based on enhancement level (계승 시스템용)
export function recalculateEnhancedStats(item: Item): Item {
  // 기본 스탯부터 시작
  let enhancedStats: ItemStats = { ...item.baseStats };

  // 각 강화 레벨별로 스탯 증가량을 누적 계산
  for (let level = 1; level <= item.enhancementLevel; level++) {
    const statIncrease = getEnhancementStatIncrease(
      level,
      item.grade,
      item.type
    );
    enhancedStats.attack += statIncrease.attack;
    enhancedStats.defense += statIncrease.defense;
    enhancedStats.defensePenetration += statIncrease.defensePenetration;
    enhancedStats.additionalAttackChance += statIncrease.additionalAttackChance;
  }

  return {
    ...item,
    enhancedStats,
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
