/**
 * Gacha System Implementation
 * 크레딧 기반 가챠 시스템 - 방어구, 장신구, 무기 카테고리별 가챠
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.7, 11.8
 */

import {
  Item,
  ItemType,
  ItemGrade,
  GachaCategory,
  GachaResult,
} from "../types/game";
import {
  GACHA_COSTS,
  GACHA_RATES,
  GACHA_ITEM_TYPES,
  ITEM_BASE_STATS,
  GRADE_MULTIPLIERS,
  GRADE_BASE_STATS,
  RANDOM_BONUS_RANGE,
  getItemImagePath,
} from "../constants/game";

/**
 * 가챠 뽑기 수행
 * Requirements: 11.1, 11.2, 11.3, 11.4
 */
export function performGachaDraw(
  category: GachaCategory,
  currentCredits: number
): {
  success: boolean;
  result?: GachaResult;
  error?: string;
} {
  const cost = GACHA_COSTS[category];

  // 크레딧 부족 검증
  if (currentCredits < cost) {
    return {
      success: false,
      error: `크레딧이 부족합니다. 필요: ${cost}, 보유: ${currentCredits}`,
    };
  }

  // 아이템 등급 결정 (DIVINE 포함)
  const grade = selectItemGrade();

  // 신급(DIVINE) 등급이면 무조건 제우스 검
  if (grade === ItemGrade.DIVINE) {
    const zeusSword = generateZeusSword();
    const result: GachaResult = {
      item: zeusSword,
      category,
      cost,
    };
    return {
      success: true,
      result,
    };
  }

  // 일반 아이템 생성
  const availableTypes = GACHA_ITEM_TYPES[category];
  const itemType =
    availableTypes[Math.floor(Math.random() * availableTypes.length)];

  const item = generateGachaItem(itemType, grade);

  const result: GachaResult = {
    item,
    category,
    cost,
  };

  return {
    success: true,
    result,
  };
}

/**
 * 가챠 확률에 따른 아이템 등급 선택
 * Requirements: 11.3 - 모든 등급 포함 (DIVINE 0.001% 포함)
 */
function selectItemGrade(): ItemGrade {
  const random = Math.random();
  let cumulativeProbability = 0;

  // 모든 등급을 확률 순서대로 체크 (DIVINE 포함)
  const grades = [
    ItemGrade.COMMON,
    ItemGrade.RARE,
    ItemGrade.EPIC,
    ItemGrade.LEGENDARY,
    ItemGrade.MYTHIC,
    ItemGrade.DIVINE, // 신급 추가
  ];

  for (const grade of grades) {
    const gradeRate = GACHA_RATES[grade as keyof typeof GACHA_RATES];
    cumulativeProbability += gradeRate;
    if (random <= cumulativeProbability) {
      return grade;
    }
  }

  // 안전장치: 확률 계산 오류 시 Common 반환
  return ItemGrade.COMMON;
}

/**
 * 제우스 검 생성 (특별 아이템)
 * 강화 불가, 최강 스탯
 */
function generateZeusSword(): Item {
  const zeusSwordStats = ITEM_BASE_STATS[ItemType.ZEUS_SWORD];

  return {
    id: `zeus-sword-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: ItemType.ZEUS_SWORD,
    grade: ItemGrade.DIVINE, // 신급 등급으로 변경
    baseStats: { ...zeusSwordStats },
    enhancedStats: { ...zeusSwordStats },
    level: 1,
    enhancementLevel: 0, // 강화 불가
    imagePath: getItemImagePath(ItemType.ZEUS_SWORD),
  };
}

/**
 * 가챠 아이템 생성
 * Requirements: 11.4 - 카테고리에 맞는 아이템만 생성
 */
function generateGachaItem(type: ItemType, grade: ItemGrade): Item {
  const baseStats = { ...ITEM_BASE_STATS[type] };
  const gradeBaseStats = GRADE_BASE_STATS[grade];

  // 랜덤 보너스 (1~5)
  const getRandomBonus = () =>
    RANDOM_BONUS_RANGE.min +
    Math.floor(
      Math.random() * (RANDOM_BONUS_RANGE.max - RANDOM_BONUS_RANGE.min + 1)
    );

  // 재물 물약 전용 랜덤 보너스 (등급별 차등 적용)
  const getCreditRandomBonus = (grade: ItemGrade) => {
    switch (grade) {
      case ItemGrade.COMMON:
        return 0; // 1+0=1 (레어 기본값 2 미만)
      case ItemGrade.RARE:
        return Math.floor(Math.random() * 2); // 0~1 → 2~3 (에픽 기본값 4 미만)
      case ItemGrade.EPIC:
        return Math.floor(Math.random() * 4); // 0~3 → 4~7 (전설 기본값 8 미만)
      case ItemGrade.LEGENDARY:
      case ItemGrade.MYTHIC:
        return getRandomBonus(); // 기존 1~5 유지 (문제없음)
      default:
        return 0;
    }
  };

  // 아이템 타입별 스탯 적용 (해당 스탯만 적용)
  const finalStats = {
    attack: baseStats.attack > 0 ? gradeBaseStats.attack + getRandomBonus() : 0,
    defense:
      baseStats.defense > 0 ? gradeBaseStats.defense + getRandomBonus() : 0,
    defensePenetration:
      baseStats.defensePenetration > 0
        ? gradeBaseStats.defensePenetration + getRandomBonus()
        : 0,
    additionalAttackChance:
      baseStats.additionalAttackChance > 0
        ? gradeBaseStats.additionalAttackChance + getRandomBonus() * 0.001
        : 0,
    creditPerSecondBonus:
      baseStats.creditPerSecondBonus > 0
        ? gradeBaseStats.creditPerSecondBonus + getCreditRandomBonus(grade)
        : 0,
    criticalDamageMultiplier:
      baseStats.criticalDamageMultiplier > 0
        ? gradeBaseStats.criticalDamageMultiplier + getRandomBonus() * 0.01
        : 0,
    criticalChance:
      baseStats.criticalChance > 0
        ? gradeBaseStats.criticalChance + getRandomBonus() * 0.01
        : 0,
  };

  return {
    id: `gacha-${type}-${grade}-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`,
    type,
    grade,
    baseStats: finalStats,
    enhancedStats: { ...finalStats },
    level: 1,
    enhancementLevel: 0,
    imagePath: getItemImagePath(type),
  };
}

/**
 * 가챠 비용 확인
 * Requirements: 11.7, 11.8
 */
export function getGachaCost(category: GachaCategory): number {
  return GACHA_COSTS[category];
}

/**
 * 가챠 가능 여부 확인
 * Requirements: 11.7
 */
export function canPerformGacha(
  category: GachaCategory,
  currentCredits: number
): boolean {
  return currentCredits >= GACHA_COSTS[category];
}

/**
 * 가챠 확률 정보 반환
 * Requirements: 11.6
 */
export function getGachaRates(): Partial<Record<ItemGrade, number>> {
  return { ...GACHA_RATES };
}

/**
 * 카테고리별 아이템 타입 목록 반환
 * Requirements: 11.4
 */
export function getCategoryItemTypes(category: GachaCategory): ItemType[] {
  return [...GACHA_ITEM_TYPES[category]];
}
