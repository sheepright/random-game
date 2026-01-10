/**
 * Item Synthesis System
 * 같은 등급 아이템 10개를 합성하여 상위 등급 아이템 1개를 생성
 */

import { Item, ItemGrade, ItemType } from "../types/game";
import {
  ITEM_BASE_STATS,
  GRADE_BASE_STATS,
  RANDOM_BONUS_RANGE,
  createItemWithImage,
} from "../constants/game";

// 등급 순서 정의
const GRADE_HIERARCHY = {
  [ItemGrade.COMMON]: 0,
  [ItemGrade.RARE]: 1,
  [ItemGrade.EPIC]: 2,
  [ItemGrade.LEGENDARY]: 3,
  [ItemGrade.MYTHIC]: 4,
  [ItemGrade.DIVINE]: 5,
} as const;

// 다음 등급 매핑
const NEXT_GRADE_MAP = {
  [ItemGrade.COMMON]: ItemGrade.RARE,
  [ItemGrade.RARE]: ItemGrade.EPIC,
  [ItemGrade.EPIC]: ItemGrade.LEGENDARY,
  [ItemGrade.LEGENDARY]: ItemGrade.MYTHIC,
} as const;

// 합성 가능한 아이템 타입들
const SYNTHESIZABLE_ITEM_TYPES = [
  ItemType.HELMET,
  ItemType.ARMOR,
  ItemType.PANTS,
  ItemType.GLOVES,
  ItemType.SHOES,
  ItemType.SHOULDER,
  ItemType.EARRING,
  ItemType.RING,
  ItemType.NECKLACE,
  ItemType.MAIN_WEAPON,
  ItemType.SUB_WEAPON,
  ItemType.PET,
];

export interface SynthesisResult {
  success: boolean;
  synthesizedItem?: Item;
  usedItems?: Item[];
  error?: string;
}

export interface SynthesisPreview {
  canSynthesize: boolean;
  sourceGrade: ItemGrade;
  targetGrade: ItemGrade;
  availableItems: Item[];
  requiredCount: number;
  error?: string;
}

/**
 * 합성 가능한 등급인지 확인
 */
export function canSynthesizeGrade(grade: ItemGrade): boolean {
  return grade !== ItemGrade.MYTHIC && grade !== ItemGrade.DIVINE; // 신화, 신성 등급은 합성 불가 (최고 등급)
}

/**
 * 다음 등급 가져오기
 */
export function getNextGrade(grade: ItemGrade): ItemGrade | null {
  return NEXT_GRADE_MAP[grade as keyof typeof NEXT_GRADE_MAP] || null;
}

/**
 * 등급별 아이템 개수 계산
 */
export function getItemCountByGrade(items: Item[], grade: ItemGrade): number {
  return items.filter((item) => item.grade === grade).length;
}

/**
 * 등급별 아이템 그룹화
 */
export function groupItemsByGrade(items: Item[]): Record<ItemGrade, Item[]> {
  const groups = {
    [ItemGrade.COMMON]: [],
    [ItemGrade.RARE]: [],
    [ItemGrade.EPIC]: [],
    [ItemGrade.LEGENDARY]: [],
    [ItemGrade.MYTHIC]: [],
    [ItemGrade.DIVINE]: [],
  } as Record<ItemGrade, Item[]>;

  items.forEach((item) => {
    groups[item.grade].push(item);
  });

  return groups;
}

/**
 * 합성 미리보기 생성
 */
export function generateSynthesisPreview(
  items: Item[],
  grade: ItemGrade
): SynthesisPreview {
  if (!canSynthesizeGrade(grade)) {
    return {
      canSynthesize: false,
      sourceGrade: grade,
      targetGrade: grade,
      availableItems: [],
      requiredCount: 10,
      error: "신화, 신성 등급은 합성할 수 없습니다.",
    };
  }

  const targetGrade = getNextGrade(grade);
  if (!targetGrade) {
    return {
      canSynthesize: false,
      sourceGrade: grade,
      targetGrade: grade,
      availableItems: [],
      requiredCount: 10,
      error: "상위 등급이 존재하지 않습니다.",
    };
  }

  const availableItems = items.filter((item) => item.grade === grade);
  const requiredCount = 10;
  const canSynthesize = availableItems.length >= requiredCount;

  return {
    canSynthesize,
    sourceGrade: grade,
    targetGrade,
    availableItems,
    requiredCount,
    error: canSynthesize
      ? undefined
      : `${requiredCount}개의 ${grade} 등급 아이템이 필요합니다.`,
  };
}

/**
 * 랜덤 아이템 타입 선택
 */
function getRandomItemType(): ItemType {
  const randomIndex = Math.floor(
    Math.random() * SYNTHESIZABLE_ITEM_TYPES.length
  );
  return SYNTHESIZABLE_ITEM_TYPES[randomIndex];
}

/**
 * 새로운 아이템 생성 (합성 결과)
 */
function createSynthesizedItem(grade: ItemGrade): Item {
  const itemType = getRandomItemType();
  const baseStats = { ...ITEM_BASE_STATS[itemType] };
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

  // 가챠 시스템과 동일한 방식으로 스탯 생성
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

  // 가챠 시스템과 동일한 방식으로 아이템 생성
  return createItemWithImage(itemType, grade, finalStats);
}

/**
 * 합성 실행
 */
export function performSynthesis(
  items: Item[],
  grade: ItemGrade
): SynthesisResult {
  const preview = generateSynthesisPreview(items, grade);

  if (!preview.canSynthesize) {
    return {
      success: false,
      error: preview.error,
    };
  }

  // 사용할 아이템 10개 선택 (랜덤)
  const availableItems = [...preview.availableItems];
  const usedItems: Item[] = [];

  for (let i = 0; i < 10 && availableItems.length > 0; i++) {
    const randomIndex = Math.floor(Math.random() * availableItems.length);
    const selectedItem = availableItems.splice(randomIndex, 1)[0];
    usedItems.push(selectedItem);
  }

  if (usedItems.length < 10) {
    return {
      success: false,
      error: "충분한 아이템이 없습니다.",
    };
  }

  // 새로운 아이템 생성
  const synthesizedItem = createSynthesizedItem(preview.targetGrade);

  return {
    success: true,
    synthesizedItem,
    usedItems,
  };
}

/**
 * 합성 가능한 등급 목록 가져오기
 */
export function getSynthesizableGrades(items: Item[]): Array<{
  grade: ItemGrade;
  count: number;
  canSynthesize: boolean;
  nextGrade: ItemGrade | null;
}> {
  const grades = [
    ItemGrade.COMMON,
    ItemGrade.RARE,
    ItemGrade.EPIC,
    ItemGrade.LEGENDARY,
  ];

  return grades.map((grade) => {
    const count = getItemCountByGrade(items, grade);
    const canSynthesize = count >= 10 && canSynthesizeGrade(grade);
    const nextGrade = getNextGrade(grade);

    return {
      grade,
      count,
      canSynthesize,
      nextGrade,
    };
  });
}

/**
 * 등급 이름 가져오기 (한국어)
 */
export function getGradeDisplayName(grade: ItemGrade): string {
  const gradeNames = {
    [ItemGrade.COMMON]: "일반",
    [ItemGrade.RARE]: "레어",
    [ItemGrade.EPIC]: "에픽",
    [ItemGrade.LEGENDARY]: "전설",
    [ItemGrade.MYTHIC]: "신화",
    [ItemGrade.DIVINE]: "신성",
  };

  return gradeNames[grade];
}
