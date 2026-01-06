/**
 * 인벤토리 관리 유틸리티
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
 */

import { Item, ItemType, ItemGrade } from "../types/game";

/**
 * 인벤토리 정렬 옵션
 */
export enum SortOption {
  NAME = "name",
  TYPE = "type",
  GRADE = "grade",
  LEVEL = "level",
  ATTACK = "attack",
  DEFENSE = "defense",
  DEFENSE_PENETRATION = "defensePenetration",
  ENHANCEMENT_LEVEL = "enhancementLevel",
}

/**
 * 정렬 방향
 */
export enum SortDirection {
  ASC = "asc",
  DESC = "desc",
}

/**
 * 인벤토리 필터 옵션
 */
export interface InventoryFilter {
  type?: ItemType;
  grade?: ItemGrade;
  minLevel?: number;
  maxLevel?: number;
  searchText?: string;
}

/**
 * 인벤토리 정렬 설정
 */
export interface InventorySort {
  option: SortOption;
  direction: SortDirection;
}

/**
 * 인벤토리 관리 결과
 */
export interface InventoryResult {
  success: boolean;
  items?: Item[];
  error?: string;
}

/**
 * 인벤토리 용량 설정
 */
export const INVENTORY_CONFIG = {
  DEFAULT_CAPACITY: 100,
  MAX_CAPACITY: 500,
  EXPANSION_COST_BASE: 1000,
  EXPANSION_COST_MULTIPLIER: 2,
};

/**
 * 아이템 등급별 우선순위 (정렬용)
 */
const GRADE_PRIORITY: Record<ItemGrade, number> = {
  [ItemGrade.MYTHIC]: 5,
  [ItemGrade.LEGENDARY]: 4,
  [ItemGrade.EPIC]: 3,
  [ItemGrade.RARE]: 2,
  [ItemGrade.COMMON]: 1,
};

/**
 * 아이템 타입별 우선순위 (정렬용)
 */
const TYPE_PRIORITY: Record<ItemType, number> = {
  [ItemType.MAIN_WEAPON]: 11,
  [ItemType.SUB_WEAPON]: 10,
  [ItemType.PET]: 9,
  [ItemType.HELMET]: 8,
  [ItemType.ARMOR]: 7,
  [ItemType.PANTS]: 6,
  [ItemType.GLOVES]: 5,
  [ItemType.SHOES]: 4,
  [ItemType.SHOULDER]: 3,
  [ItemType.NECKLACE]: 2,
  [ItemType.EARRING]: 1,
  [ItemType.RING]: 0,
};

/**
 * 인벤토리 아이템 필터링
 * Requirements: 6.4 - 아이템 필터링 및 검색 기능
 */
export function filterInventoryItems(
  items: Item[],
  filter: InventoryFilter
): Item[] {
  return items.filter((item) => {
    // 타입 필터
    if (filter.type && item.type !== filter.type) {
      return false;
    }

    // 등급 필터
    if (filter.grade && item.grade !== filter.grade) {
      return false;
    }

    // 레벨 범위 필터
    if (filter.minLevel !== undefined && item.level < filter.minLevel) {
      return false;
    }
    if (filter.maxLevel !== undefined && item.level > filter.maxLevel) {
      return false;
    }

    // 텍스트 검색 필터
    if (filter.searchText) {
      const searchLower = filter.searchText.toLowerCase();
      const itemName = getItemDisplayName(item).toLowerCase();
      const itemType = item.type.toLowerCase();
      const itemGrade = item.grade.toLowerCase();

      if (
        !itemName.includes(searchLower) &&
        !itemType.includes(searchLower) &&
        !itemGrade.includes(searchLower)
      ) {
        return false;
      }
    }

    return true;
  });
}

/**
 * 인벤토리 아이템 정렬
 * Requirements: 6.4 - 아이템 정렬 기능
 */
export function sortInventoryItems(items: Item[], sort: InventorySort): Item[] {
  const sortedItems = [...items];

  sortedItems.sort((a, b) => {
    let comparison = 0;

    switch (sort.option) {
      case SortOption.NAME:
        comparison = getItemDisplayName(a).localeCompare(getItemDisplayName(b));
        break;

      case SortOption.TYPE:
        comparison = TYPE_PRIORITY[a.type] - TYPE_PRIORITY[b.type];
        break;

      case SortOption.GRADE:
        comparison = GRADE_PRIORITY[a.grade] - GRADE_PRIORITY[b.grade];
        break;

      case SortOption.LEVEL:
        comparison = a.level - b.level;
        break;

      case SortOption.ATTACK:
        const aAttack = a.baseStats.attack + a.enhancedStats.attack;
        const bAttack = b.baseStats.attack + b.enhancedStats.attack;
        comparison = aAttack - bAttack;
        break;

      case SortOption.DEFENSE:
        const aDefense = a.baseStats.defense + a.enhancedStats.defense;
        const bDefense = b.baseStats.defense + b.enhancedStats.defense;
        comparison = aDefense - bDefense;
        break;

      case SortOption.DEFENSE_PENETRATION:
        const aPen =
          a.baseStats.defensePenetration + a.enhancedStats.defensePenetration;
        const bPen =
          b.baseStats.defensePenetration + b.enhancedStats.defensePenetration;
        comparison = aPen - bPen;
        break;

      case SortOption.ENHANCEMENT_LEVEL:
        comparison = a.enhancementLevel - b.enhancementLevel;
        break;

      default:
        comparison = 0;
    }

    // 정렬 방향 적용
    return sort.direction === SortDirection.DESC ? -comparison : comparison;
  });

  return sortedItems;
}

/**
 * 인벤토리 아이템 검색
 * Requirements: 6.4 - 아이템 검색 기능
 */
export function searchInventoryItems(
  items: Item[],
  searchText: string
): Item[] {
  if (!searchText.trim()) {
    return items;
  }

  return filterInventoryItems(items, { searchText: searchText.trim() });
}

/**
 * 인벤토리 용량 확인
 * Requirements: 6.3 - 인벤토리 용량 관리
 */
export function checkInventoryCapacity(
  currentItems: Item[],
  capacity: number = INVENTORY_CONFIG.DEFAULT_CAPACITY
): {
  isFull: boolean;
  currentCount: number;
  maxCapacity: number;
  remainingSlots: number;
} {
  const currentCount = currentItems.length;
  const remainingSlots = Math.max(0, capacity - currentCount);

  return {
    isFull: currentCount >= capacity,
    currentCount,
    maxCapacity: capacity,
    remainingSlots,
  };
}

/**
 * 인벤토리에 아이템 추가 가능 여부 확인
 * Requirements: 6.1, 6.3 - 아이템 보관 및 용량 관리
 */
export function canAddItemToInventory(
  currentItems: Item[],
  newItem: Item,
  capacity: number = INVENTORY_CONFIG.DEFAULT_CAPACITY
): boolean {
  const capacityCheck = checkInventoryCapacity(currentItems, capacity);
  return !capacityCheck.isFull;
}

/**
 * 인벤토리에서 아이템 제거
 * Requirements: 6.1 - 아이템 보관 관리
 */
export function removeItemFromInventory(
  items: Item[],
  itemId: string
): InventoryResult {
  const itemIndex = items.findIndex((item) => item.id === itemId);

  if (itemIndex === -1) {
    return {
      success: false,
      error: "아이템을 찾을 수 없습니다",
    };
  }

  const newItems = [...items];
  newItems.splice(itemIndex, 1);

  return {
    success: true,
    items: newItems,
  };
}

/**
 * 인벤토리에서 특정 조건의 아이템들 찾기
 * Requirements: 6.2, 6.4 - 아이템 표시 및 필터링
 */
export function findItemsInInventory(
  items: Item[],
  predicate: (item: Item) => boolean
): Item[] {
  return items.filter(predicate);
}

/**
 * 특정 타입의 아이템들만 가져오기
 * Requirements: 6.2, 6.4 - 아이템 타입별 필터링
 */
export function getItemsByType(items: Item[], itemType: ItemType): Item[] {
  return items.filter((item) => item.type === itemType);
}

/**
 * 특정 등급의 아이템들만 가져오기
 * Requirements: 6.2, 6.4 - 아이템 등급별 필터링
 */
export function getItemsByGrade(items: Item[], grade: ItemGrade): Item[] {
  return items.filter((item) => item.grade === grade);
}

/**
 * 아이템 표시 이름 생성
 * Requirements: 6.2 - 아이템 정보 표시
 */
export function getItemDisplayName(item: Item): string {
  const typeNames: Record<ItemType, string> = {
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

  const gradeNames: Record<ItemGrade, string> = {
    [ItemGrade.COMMON]: "일반",
    [ItemGrade.RARE]: "희귀",
    [ItemGrade.EPIC]: "영웅",
    [ItemGrade.LEGENDARY]: "전설",
    [ItemGrade.MYTHIC]: "신화",
  };

  const typeName = typeNames[item.type] || item.type;
  const gradeName = gradeNames[item.grade] || item.grade;

  return `${gradeName} ${typeName}`;
}

/**
 * 아이템 상세 정보 생성
 * Requirements: 6.2, 6.6 - 아이템 상세 정보 표시
 */
export function getItemDetailInfo(item: Item): {
  name: string;
  type: string;
  grade: string;
  level: number;
  totalStats: {
    attack: number;
    defense: number;
    defensePenetration: number;
  };
  baseStats: {
    attack: number;
    defense: number;
    defensePenetration: number;
  };
  enhancedStats: {
    attack: number;
    defense: number;
    defensePenetration: number;
  };
} {
  return {
    name: getItemDisplayName(item),
    type: item.type,
    grade: item.grade,
    level: item.level,
    totalStats: {
      attack: item.baseStats.attack + item.enhancedStats.attack,
      defense: item.baseStats.defense + item.enhancedStats.defense,
      defensePenetration:
        item.baseStats.defensePenetration +
        item.enhancedStats.defensePenetration,
    },
    baseStats: { ...item.baseStats },
    enhancedStats: { ...item.enhancedStats },
  };
}

/**
 * 아이템 비교 기능
 * Requirements: 6.6 - 아이템 비교 기능
 */
export function compareItems(
  item1: Item,
  item2: Item
): {
  item1: ReturnType<typeof getItemDetailInfo>;
  item2: ReturnType<typeof getItemDetailInfo>;
  comparison: {
    attack: number; // 양수면 item1이 더 높음, 음수면 item2가 더 높음
    defense: number;
    defensePenetration: number;
    overall: number; // 전체적인 스탯 합계 비교
  };
} {
  const item1Info = getItemDetailInfo(item1);
  const item2Info = getItemDetailInfo(item2);

  const attackDiff = item1Info.totalStats.attack - item2Info.totalStats.attack;
  const defenseDiff =
    item1Info.totalStats.defense - item2Info.totalStats.defense;
  const penDiff =
    item1Info.totalStats.defensePenetration -
    item2Info.totalStats.defensePenetration;

  // 전체 스탯 합계로 비교 (각 스탯에 동일한 가중치 적용)
  const item1Total =
    item1Info.totalStats.attack +
    item1Info.totalStats.defense +
    item1Info.totalStats.defensePenetration;
  const item2Total =
    item2Info.totalStats.attack +
    item2Info.totalStats.defense +
    item2Info.totalStats.defensePenetration;
  const overallDiff = item1Total - item2Total;

  return {
    item1: item1Info,
    item2: item2Info,
    comparison: {
      attack: attackDiff,
      defense: defenseDiff,
      defensePenetration: penDiff,
      overall: overallDiff,
    },
  };
}

/**
 * 인벤토리 용량 확장 비용 계산
 * Requirements: 6.3 - 인벤토리 용량 관리
 */
export function calculateInventoryExpansionCost(
  currentCapacity: number
): number {
  const expansionLevel = Math.floor(
    (currentCapacity - INVENTORY_CONFIG.DEFAULT_CAPACITY) / 10
  );

  return Math.floor(
    INVENTORY_CONFIG.EXPANSION_COST_BASE *
      Math.pow(INVENTORY_CONFIG.EXPANSION_COST_MULTIPLIER, expansionLevel)
  );
}

/**
 * 인벤토리 통계 정보 생성
 * Requirements: 6.2 - 인벤토리 현황 표시
 */
export function getInventoryStats(items: Item[]): {
  totalItems: number;
  itemsByType: Record<ItemType, number>;
  itemsByGrade: Record<ItemGrade, number>;
  averageLevel: number;
  totalValue: number; // 모든 아이템의 추정 가치 합계
} {
  const itemsByType = Object.values(ItemType).reduce((acc, type) => {
    acc[type] = 0;
    return acc;
  }, {} as Record<ItemType, number>);

  const itemsByGrade = Object.values(ItemGrade).reduce((acc, grade) => {
    acc[grade] = 0;
    return acc;
  }, {} as Record<ItemGrade, number>);

  let totalLevel = 0;
  let totalValue = 0;

  items.forEach((item) => {
    itemsByType[item.type]++;
    itemsByGrade[item.grade]++;
    totalLevel += item.level;

    // 아이템 가치 추정 (스탯 합계 * 등급 배수 * 레벨)
    const statSum =
      item.baseStats.attack +
      item.baseStats.defense +
      item.baseStats.defensePenetration;
    const gradeMultiplier = GRADE_PRIORITY[item.grade];
    totalValue += statSum * gradeMultiplier * (item.level + 1);
  });

  return {
    totalItems: items.length,
    itemsByType,
    itemsByGrade,
    averageLevel: items.length > 0 ? totalLevel / items.length : 0,
    totalValue,
  };
}
