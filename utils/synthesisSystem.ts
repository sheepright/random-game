/**
 * Item Synthesis System
 * 같은 등급 아이템 10개를 합성하여 상위 등급 아이템 1개를 생성
 */

import { Item, ItemGrade, ItemType, ItemStats } from "../types/game";
import {
  ITEM_BASE_STATS,
  GRADE_MULTIPLIERS,
  createItemWithImage,
} from "../constants/game";

// 등급 순서 정의
const GRADE_HIERARCHY = {
  [ItemGrade.COMMON]: 0,
  [ItemGrade.RARE]: 1,
  [ItemGrade.EPIC]: 2,
  [ItemGrade.LEGENDARY]: 3,
  [ItemGrade.MYTHIC]: 4,
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
  return grade !== ItemGrade.MYTHIC; // 신화 등급은 합성 불가 (최고 등급)
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
      error: "신화 등급은 합성할 수 없습니다.",
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

  // 등급에 따른 스탯 배율 적용
  const gradeMultiplier = GRADE_MULTIPLIERS[grade];
  const enhancedStats: ItemStats = {
    attack: Math.floor(baseStats.attack * gradeMultiplier),
    defense: Math.floor(baseStats.defense * gradeMultiplier),
    defensePenetration: Math.floor(
      baseStats.defensePenetration * gradeMultiplier
    ),
    additionalAttackChance: baseStats.additionalAttackChance * gradeMultiplier,
  };

  return createItemWithImage(itemType, grade, enhancedStats);
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
  };

  return gradeNames[grade];
}
