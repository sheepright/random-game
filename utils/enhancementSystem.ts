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

// Safe enhancement levels (안전 등급 - 이 레벨 아래로는 하락하지 않음)
export const SAFE_ENHANCEMENT_LEVELS = [15, 20];

// Destruction prevention enhancement (파괴방지 강화 - 20강부터 사용 가능)
export const DESTRUCTION_PREVENTION_MIN_LEVEL = 20;

// Calculate destruction prevention cost (파괴방지 강화 비용 계산)
export function calculateDestructionPreventionCost(
  enhancementLevel: number,
  grade: ItemGrade
): number {
  if (enhancementLevel < DESTRUCTION_PREVENTION_MIN_LEVEL) {
    return 0; // 20강 미만에서는 사용 불가
  }

  // 적정 수준의 파괴방지 비용 (50만 ~ 150만)
  let baseCost: number;

  switch (enhancementLevel) {
    case 20:
      baseCost = 500000; // 50만
      break;
    case 21:
      baseCost = 650000; // 65만
      break;
    case 22:
      baseCost = 800000; // 80만
      break;
    case 23:
      baseCost = 1000000; // 100만
      break;
    case 24:
      baseCost = 1250000; // 125만
      break;
    case 25:
      baseCost = 1500000; // 150만 (최대)
      break;
    default:
      // 25강 이상은 150만으로 고정
      baseCost = 1500000;
      break;
  }

  return baseCost;
}

// Get the minimum safe level for the current enhancement level
export function getMinimumSafeLevel(currentLevel: number): number {
  // 현재 레벨에서 도달한 가장 높은 안전 등급을 찾음
  let minSafeLevel = 0;
  for (const safeLevel of SAFE_ENHANCEMENT_LEVELS) {
    if (currentLevel >= safeLevel) {
      minSafeLevel = safeLevel;
    }
  }
  return minSafeLevel;
}

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

  // 물약들
  [ItemType.WEALTH_POTION]: "creditPerSecondBonus",
  [ItemType.BOSS_POTION]: "criticalDamageMultiplier",
  [ItemType.ARTISAN_POTION]: "criticalChance",
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

// Enhancement success rate (전체적으로 상향 조정)
export function getEnhancementSuccessRate(enhancementLevel: number): number {
  // 단계별 차등 확률 (전체적으로 상향 조정)
  const successRates: Record<number, number> = {
    1: 0.98, // 98% (95% → 98%)
    2: 0.95, // 95% (90% → 95%)
    3: 0.92, // 92% (85% → 92%)
    4: 0.88, // 88% (80% → 88%)
    5: 0.85, // 85% (75% → 85%)
    6: 0.8, // 80% (70% → 80%)
    7: 0.75, // 75% (65% → 75%)
    8: 0.7, // 70% (60% → 70%)
    9: 0.65, // 65% (55% → 65%)
    10: 0.65, // 65% (55% → 65%)
    11: 0.6, // 60% (50% → 60%)
    12: 0.55, // 55% (45% → 55%)
    13: 0.52, // 52% (42% → 52%)
    14: 0.48, // 48% (38% → 48%)
    15: 0.45, // 45% (35% → 45%)
    16: 0.42, // 42% (32% → 42%)
    17: 0.38, // 38% (28% → 38%)
    18: 0.35, // 35% (25% → 35%)
    19: 0.32, // 32% (22% → 32%)
    20: 0.3, // 30% (18% → 30%) - 기준점
    21: 0.26, // 26% (10% → 26%)
    22: 0.23, // 23% (8% → 23%)
    23: 0.2, // 20% (6% → 20%)
    24: 0.17, // 17% (4% → 17%)
    25: 0.15, // 15% (2% → 15%) - 기준점
  };

  return successRates[enhancementLevel] || 0.01; // 기본 1%
}

// Enhancement destruction rate (18강부터 파괴 확률 시작)
export function getEnhancementDestructionRate(
  enhancementLevel: number
): number {
  if (enhancementLevel < 18) {
    return 0; // 17강 이하는 파괴되지 않음
  }

  // 18강 이상에서 파괴 확률 (낮은 확률로 시작)
  const destructionRates: Record<number, number> = {
    18: 0.02, // 2% (파괴 확률 시작)
    19: 0.03, // 3%
    20: 0.05, // 5%
    21: 0.07, // 7%
    22: 0.1, // 10%
    23: 0.13, // 13%
    24: 0.16, // 16%
    25: 0.2, // 20%
  };

  return destructionRates[enhancementLevel] || 0.25;
}

// Enhancement stat increase calculation (매우 높은 스탯 증가량으로 보상 대폭 상향)
export function getEnhancementStatIncrease(
  enhancementLevel: number,
  grade: ItemGrade,
  itemType: ItemType
): ItemStats {
  // 등급별 기본 증가량 (대폭 증가)
  const baseIncrease = {
    [ItemGrade.COMMON]: 3.0, // 2.0 → 3.0
    [ItemGrade.RARE]: 5.0, // 3.5 → 5.0
    [ItemGrade.EPIC]: 8.0, // 5.5 → 8.0
    [ItemGrade.LEGENDARY]: 12.0, // 8.0 → 12.0
    [ItemGrade.MYTHIC]: 18.0, // 12.0 → 18.0
  };

  // 레벨별 효율 증가 (훨씬 더 높은 보상)
  let levelMultiplier: number;
  if (enhancementLevel <= 5) {
    levelMultiplier = 1.2; // 1.0 → 1.2 (초반부터 더 높은 효율)
  } else if (enhancementLevel <= 10) {
    levelMultiplier = 1.5 + (enhancementLevel - 5) * 0.15; // 6~10강: 1.5 ~ 2.25
  } else if (enhancementLevel <= 15) {
    levelMultiplier = 2.5 + (enhancementLevel - 10) * 0.25; // 11~15강: 2.5 ~ 3.75
  } else if (enhancementLevel <= 19) {
    levelMultiplier = 4.0 + (enhancementLevel - 15) * 0.4; // 16~19강: 4.0 ~ 5.6
  } else {
    // 20~25강: 극도로 높은 효율 (위험 대비 매우 높은 보상)
    const levelAbove20 = enhancementLevel - 19;
    levelMultiplier = 6.5 + levelAbove20 * 1.5; // 6.5 ~ 15.5
  }

  const primaryStat = ITEM_PRIMARY_STATS[itemType];
  const baseValue = baseIncrease[grade] * levelMultiplier;

  // 초기화된 스탯 객체 (모든 스탯 0으로 시작)
  const statIncrease: ItemStats = {
    attack: 0,
    defense: 0,
    defensePenetration: 0,
    additionalAttackChance: 0,
    creditPerSecondBonus: 0,
    criticalDamageMultiplier: 0,
    criticalChance: 0,
  };

  // 해당 아이템의 주요 스탯만 증가 (Requirements 10.2)
  switch (primaryStat) {
    case "attack":
      statIncrease.attack = Math.max(3, Math.floor(baseValue)); // 최소 3 보장 (2 → 3)
      break;
    case "defense":
      statIncrease.defense = Math.max(3, Math.floor(baseValue)); // 최소 3 보장 (2 → 3)
      break;
    case "defensePenetration":
      statIncrease.defensePenetration = Math.max(3, Math.floor(baseValue)); // 최소 3 보장 (2 → 3)
      break;
    case "additionalAttackChance":
      // 추가타격: 3부위 신화 25강 기준 100% 목표 (글러브1% + 슈즈0.8% + 숄더1.2% = 3% 기본)
      // 신화 25강에서 각각 약 32% 증가 필요 → 총 97% 달성
      statIncrease.additionalAttackChance = Math.max(
        0.0005,
        baseValue * 0.00012
      ); // 배율 더 하향 (0.00015 → 0.00012)
      break;
    case "creditPerSecondBonus":
      // 재물 물약: 신화 25강 기준 약 50-100 크레딧/초 목표
      statIncrease.creditPerSecondBonus = Math.max(
        0.2,
        Math.floor(baseValue * 0.05)
      ); // 배율 대폭 하향 (0.3 → 0.05)
      break;
    case "criticalDamageMultiplier":
      // 보스 물약: 신화 25강 기준 약 400% 목표 (기본 20% + 신화 150% + 강화로 230% = 400%)
      statIncrease.criticalDamageMultiplier = Math.max(
        0.002,
        baseValue * 0.0015
      ); // 배율 대폭 하향 (0.006 → 0.0015)
      break;
    case "criticalChance":
      // 장인 물약: 신화 25강 기준 100% 목표 (기본 1.6% + 신화 16% + 강화로 82.4% = 100%)
      statIncrease.criticalChance = Math.max(0.001, baseValue * 0.0004); // 배율 조정 (0.0006 → 0.0004)
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
  availableCredits: number,
  useDestructionPrevention: boolean = false
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
  let destructionRate = enhancementInfo.destructionRate || 0;
  let totalCost = enhancementInfo.cost;

  // 파괴방지 강화 사용 시
  if (useDestructionPrevention) {
    if (previousLevel < DESTRUCTION_PREVENTION_MIN_LEVEL) {
      throw new Error("파괴방지 강화는 20강부터 사용 가능합니다.");
    }

    const preventionCost = calculateDestructionPreventionCost(
      previousLevel,
      item.grade
    );
    totalCost += preventionCost;

    if (availableCredits < totalCost) {
      throw new Error(
        `파괴방지 강화에 필요한 크레딧이 부족합니다. 필요: ${totalCost}, 보유: ${availableCredits}`
      );
    }

    destructionRate = 0; // 파괴 확률 제거
  }

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
    // 파괴: 아이템이 완전히 파괴됨
    result = EnhancementResult.DESTRUCTION;
    newLevel = 0; // 레벨은 0으로 설정 (실제로는 아이템이 제거됨)

    // 파괴 시에는 스탯 변화를 0으로 설정 (아이템 자체가 사라지므로)
    statChange = {
      attack: 0,
      defense: 0,
      defensePenetration: 0,
      additionalAttackChance: 0,
      creditPerSecondBonus: 0,
      criticalDamageMultiplier: 0,
      criticalChance: 0,
    };
  } else {
    // 실패: 레벨 감소 (11강 이상에서만, 단 안전 등급 적용)
    if (previousLevel >= 11) {
      result = EnhancementResult.DOWNGRADE;

      // 안전 등급 시스템 적용
      const minSafeLevel = getMinimumSafeLevel(previousLevel);
      const targetLevel = previousLevel - 1;
      newLevel = Math.max(minSafeLevel, targetLevel);

      // 실제로 레벨이 감소한 경우에만 스탯 감소 적용
      if (newLevel < previousLevel) {
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
          creditPerSecondBonus: -lostStatIncrease.creditPerSecondBonus,
          criticalDamageMultiplier: -lostStatIncrease.criticalDamageMultiplier,
          criticalChance: -lostStatIncrease.criticalChance,
        };
      } else {
        // 안전 등급으로 인해 레벨이 유지된 경우
        result = EnhancementResult.FAILURE;
        statChange = {
          attack: 0,
          defense: 0,
          defensePenetration: 0,
          additionalAttackChance: 0,
          creditPerSecondBonus: 0,
          criticalDamageMultiplier: 0,
          criticalChance: 0,
        };
      }
    } else {
      // 10강 이하에서는 실패해도 레벨 유지
      result = EnhancementResult.FAILURE;
      newLevel = previousLevel;
      statChange = {
        attack: 0,
        defense: 0,
        defensePenetration: 0,
        additionalAttackChance: 0,
        creditPerSecondBonus: 0,
        criticalDamageMultiplier: 0,
        criticalChance: 0,
      };
    }
  }

  return {
    result,
    previousLevel,
    newLevel,
    costPaid: totalCost, // 파괴방지 비용 포함
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
    creditPerSecondBonus:
      item.enhancedStats.creditPerSecondBonus +
      enhancementAttempt.statChange.creditPerSecondBonus,
    criticalDamageMultiplier:
      item.enhancedStats.criticalDamageMultiplier +
      enhancementAttempt.statChange.criticalDamageMultiplier,
    criticalChance:
      item.enhancedStats.criticalChance +
      enhancementAttempt.statChange.criticalChance,
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
    enhancedStats.creditPerSecondBonus += statIncrease.creditPerSecondBonus;
    enhancedStats.criticalDamageMultiplier +=
      statIncrease.criticalDamageMultiplier;
    enhancedStats.criticalChance += statIncrease.criticalChance;
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
    creditPerSecondBonus:
      item.baseStats.creditPerSecondBonus +
      item.enhancedStats.creditPerSecondBonus,
    criticalDamageMultiplier:
      item.baseStats.criticalDamageMultiplier +
      item.enhancedStats.criticalDamageMultiplier,
    criticalChance:
      item.baseStats.criticalChance + item.enhancedStats.criticalChance,
  };
}
