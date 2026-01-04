/**
 * Item Sale System for the Idle Gacha Game
 * Handles selling items from inventory for credits
 * Based on requirements 6.7, 6.8, 6.9, 6.10
 */

import { Item, ItemGrade, EquippedItems } from "../types/game";

// 등급별 기본 판매가 설정 (Requirements 6.7)
// 밸런스 조정: 가챠 비용 대비 적절한 수준으로 조정
export const ITEM_BASE_SALE_PRICES: Record<ItemGrade, number> = {
  [ItemGrade.COMMON]: 5, // 10 -> 5로 감소 (가챠 비용의 0.6-1.0% 수준)
  [ItemGrade.RARE]: 12, // 25 -> 12로 감소 (가챠 비용의 1.0-1.5% 수준)
  [ItemGrade.EPIC]: 25, // 50 -> 25로 감소 (가챠 비용의 1.6-3.1% 수준)
  [ItemGrade.LEGENDARY]: 50, // 100 -> 50으로 감소 (가챠 비용의 3.1-6.3% 수준)
};

/**
 * 아이템의 판매가를 계산합니다
 * 기본가 + 강화 레벨에 따른 보너스 (강화 레벨당 기본가의 5% 추가)
 * 밸런스 조정: 강화 보너스를 10%에서 5%로 감소하여 과도한 수익 방지
 * @param item 판매할 아이템
 * @returns 판매가 (크레딧)
 */
export function calculateItemSalePrice(item: Item): number {
  const basePrice = ITEM_BASE_SALE_PRICES[item.grade];

  // 강화 레벨에 따른 보너스 (강화 레벨당 기본가의 5% 추가)
  const enhancementBonus = Math.floor(basePrice * 0.05 * item.enhancementLevel);

  return basePrice + enhancementBonus;
}

/**
 * 다중 선택된 아이템들의 총 판매가를 계산합니다
 * @param items 판매할 아이템 배열
 * @returns 총 판매가 (크레딧)
 */
export function calculateTotalSalePrice(items: Item[]): number {
  return items.reduce((total, item) => total + calculateItemSalePrice(item), 0);
}

/**
 * 아이템이 판매 가능한지 확인합니다 (장착된 아이템은 판매 불가)
 * @param item 확인할 아이템
 * @param equippedItems 현재 장착된 아이템들
 * @returns 판매 가능 여부
 */
export function canSellItem(item: Item, equippedItems: EquippedItems): boolean {
  // 현재 장착된 아이템인지 확인
  const equippedItemIds = Object.values(equippedItems)
    .filter((equippedItem) => equippedItem !== null)
    .map((equippedItem) => equippedItem!.id);

  return !equippedItemIds.includes(item.id);
}

/**
 * 다중 아이템 판매 결과 인터페이스
 */
export interface ItemSaleResult {
  success: boolean;
  credits: number;
  soldItems: Item[];
  failedItems: Item[];
  error?: string;
}

/**
 * 판매 시스템 제한사항 상수
 */
export const SALE_LIMITS = {
  MAX_ITEMS_PER_SALE: 20, // 한 번에 최대 20개까지 판매 가능
  HIGH_VALUE_CONFIRMATION_THRESHOLD: 100, // 100 크레딧 이상 시 추가 확인
  RARE_GRADE_CONFIRMATION: [ItemGrade.EPIC, ItemGrade.LEGENDARY], // Epic, Legendary 등급 판매 시 추가 확인
} as const;

/**
 * 판매 전 검증을 수행합니다
 * @param items 판매할 아이템들
 * @param equippedItems 현재 장착된 아이템들
 * @returns 검증 결과
 */
export function validateItemSale(
  items: Item[],
  equippedItems: EquippedItems
): {
  isValid: boolean;
  warnings: string[];
  errors: string[];
} {
  const warnings: string[] = [];
  const errors: string[] = [];

  // 아이템 수 제한 검증
  if (items.length > SALE_LIMITS.MAX_ITEMS_PER_SALE) {
    errors.push(
      `한 번에 최대 ${SALE_LIMITS.MAX_ITEMS_PER_SALE}개까지만 판매할 수 있습니다. (선택된 아이템: ${items.length}개)`
    );
  }

  // 빈 선택 검증
  if (items.length === 0) {
    errors.push("판매할 아이템을 선택해주세요.");
  }

  // 고가치 아이템 경고
  const totalValue = calculateTotalSalePrice(items);
  if (totalValue >= SALE_LIMITS.HIGH_VALUE_CONFIRMATION_THRESHOLD) {
    warnings.push(
      `총 ${totalValue.toLocaleString()} 크레딧의 고가치 아이템을 판매하려고 합니다.`
    );
  }

  // 희귀 등급 아이템 경고
  const rareItems = items.filter((item) =>
    (SALE_LIMITS.RARE_GRADE_CONFIRMATION as readonly ItemGrade[]).includes(
      item.grade
    )
  );
  if (rareItems.length > 0) {
    const rareGrades = [...new Set(rareItems.map((item) => item.grade))];
    warnings.push(
      `${rareGrades.join(", ")} 등급의 희귀 아이템 ${
        rareItems.length
      }개가 포함되어 있습니다.`
    );
  }

  // 장착된 아이템 검증
  const equippedItems_toSell = items.filter(
    (item) => !canSellItem(item, equippedItems)
  );
  if (equippedItems_toSell.length > 0) {
    errors.push(
      `현재 장착 중인 아이템 ${equippedItems_toSell.length}개는 판매할 수 없습니다.`
    );
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
  };
}

/**
 * 다중 아이템 판매를 처리합니다 (제한사항 포함)
 * @param items 판매할 아이템들
 * @param equippedItems 현재 장착된 아이템들
 * @param skipValidation 검증 건너뛰기 (확인 후 재시도 시 사용)
 * @returns 판매 결과
 */
export function processItemSale(
  items: Item[],
  equippedItems: EquippedItems,
  skipValidation: boolean = false
): ItemSaleResult {
  // 기본 검증
  if (!skipValidation) {
    const validation = validateItemSale(items, equippedItems);
    if (!validation.isValid) {
      return {
        success: false,
        credits: 0,
        soldItems: [],
        failedItems: items,
        error: validation.errors.join(" "),
      };
    }
  }

  const soldItems: Item[] = [];
  const failedItems: Item[] = [];
  let totalCredits = 0;

  items.forEach((item) => {
    if (canSellItem(item, equippedItems)) {
      soldItems.push(item);
      totalCredits += calculateItemSalePrice(item);
    } else {
      failedItems.push(item);
    }
  });

  return {
    success: soldItems.length > 0,
    credits: totalCredits,
    soldItems,
    failedItems,
  };
}

/**
 * 아이템 판매 가능 여부와 이유를 상세히 확인합니다
 * @param item 확인할 아이템
 * @param equippedItems 현재 장착된 아이템들
 * @returns 판매 가능 여부와 이유
 */
export function getItemSaleStatus(
  item: Item,
  equippedItems: EquippedItems
): {
  canSell: boolean;
  reason?: string;
  salePrice: number;
} {
  const salePrice = calculateItemSalePrice(item);

  if (!canSellItem(item, equippedItems)) {
    return {
      canSell: false,
      reason: "현재 장착 중인 아이템은 판매할 수 없습니다.",
      salePrice,
    };
  }

  return {
    canSell: true,
    salePrice,
  };
}

/**
 * 아이템 등급별 판매가 정보를 반환합니다
 * @returns 등급별 기본 판매가 정보
 */
export function getGradeSalePrices(): Record<ItemGrade, number> {
  return { ...ITEM_BASE_SALE_PRICES };
}

/**
 * 판매 시스템 제한사항 정보를 반환합니다
 * @returns 판매 제한사항 정보
 */
export function getSaleLimits() {
  return { ...SALE_LIMITS };
}

/**
 * 아이템 판매 시 예상 수익을 계산합니다 (강화 비용 대비)
 * @param item 아이템
 * @returns 수익률 정보
 */
export function calculateSaleEfficiency(item: Item): {
  salePrice: number;
  estimatedEnhancementCost: number;
  efficiency: number; // 판매가 / 예상 강화 비용
} {
  const salePrice = calculateItemSalePrice(item);

  // 간단한 강화 비용 추정 (실제 강화 시스템과 연동 가능)
  const baseEnhancementCost = item.enhancementLevel * 100; // 대략적인 추정
  const gradeMultiplier = {
    [ItemGrade.COMMON]: 1.0,
    [ItemGrade.RARE]: 1.3,
    [ItemGrade.EPIC]: 1.7,
    [ItemGrade.LEGENDARY]: 2.2,
  };

  const estimatedEnhancementCost =
    baseEnhancementCost * gradeMultiplier[item.grade];
  const efficiency =
    estimatedEnhancementCost > 0 ? salePrice / estimatedEnhancementCost : 0;

  return {
    salePrice,
    estimatedEnhancementCost,
    efficiency,
  };
}
