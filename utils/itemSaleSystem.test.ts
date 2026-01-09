/**
 * Tests for Item Sale System
 * Validates requirements 6.7, 6.8, 6.9, 6.10
 */

import { describe, it, expect } from "vitest";
import {
  calculateItemSalePrice,
  calculateTotalSalePrice,
  canSellItem,
  processItemSale,
  getItemSaleStatus,
  getGradeSalePrices,
  validateItemSale,
  getSaleLimits,
  calculateSaleEfficiency,
  ITEM_BASE_SALE_PRICES,
  SALE_LIMITS,
} from "./itemSaleSystem";
import { Item, ItemGrade, ItemType, EquippedItems } from "../types/game";

// 테스트용 아이템 생성 헬퍼
function createTestItem(
  id: string,
  type: ItemType,
  grade: ItemGrade,
  enhancementLevel: number = 0
): Item {
  return {
    id,
    type,
    grade,
    baseStats: {
      attack: 10,
      defense: 10,
      defensePenetration: 5,
      additionalAttackChance: 0.01,
      creditPerSecondBonus: 0,
      criticalDamageMultiplier: 0,
      criticalChance: 0,
    },
    enhancedStats: {
      attack: 10,
      defense: 10,
      defensePenetration: 5,
      additionalAttackChance: 0.01,
      creditPerSecondBonus: 0,
      criticalDamageMultiplier: 0,
      criticalChance: 0,
    },
    level: 1,
    enhancementLevel,
    imagePath: "/Items/default.png",
  };
}

// 테스트용 장착 아이템 생성
function createTestEquippedItems(
  equippedItemIds: string[] = []
): EquippedItems {
  const equipped: EquippedItems = {
    helmet: null,
    armor: null,
    pants: null,
    gloves: null,
    shoes: null,
    shoulder: null,
    earring: null,
    ring: null,
    necklace: null,
    mainWeapon: null,
    subWeapon: null,
    pet: null,
    wealthPotion: null,
    bossPotion: null,
    artisanPotion: null,
  };

  // 테스트를 위해 특정 아이템들을 장착된 것으로 설정
  equippedItemIds.forEach((id, index) => {
    const types = Object.keys(equipped) as (keyof EquippedItems)[];
    if (index < types.length) {
      equipped[types[index]] = createTestItem(
        id,
        ItemType.HELMET,
        ItemGrade.COMMON
      );
    }
  });

  return equipped;
}

describe("Item Sale System", () => {
  describe("calculateItemSalePrice", () => {
    it("should calculate correct base price for each grade (balanced)", () => {
      const commonItem = createTestItem("1", ItemType.HELMET, ItemGrade.COMMON);
      const rareItem = createTestItem("2", ItemType.HELMET, ItemGrade.RARE);
      const epicItem = createTestItem("3", ItemType.HELMET, ItemGrade.EPIC);
      const legendaryItem = createTestItem(
        "4",
        ItemType.HELMET,
        ItemGrade.LEGENDARY
      );

      expect(calculateItemSalePrice(commonItem)).toBe(5); // 10 -> 5로 조정
      expect(calculateItemSalePrice(rareItem)).toBe(12); // 25 -> 12로 조정
      expect(calculateItemSalePrice(epicItem)).toBe(25); // 50 -> 25로 조정
      expect(calculateItemSalePrice(legendaryItem)).toBe(50); // 100 -> 50으로 조정

      const mythicItem = createTestItem("5", ItemType.HELMET, ItemGrade.MYTHIC);
      expect(calculateItemSalePrice(mythicItem)).toBe(100); // 새로 추가
    });

    it("should add enhancement bonus correctly (5% per level)", () => {
      const baseItem = createTestItem(
        "1",
        ItemType.HELMET,
        ItemGrade.COMMON,
        0
      );
      const enhanced5Item = createTestItem(
        "2",
        ItemType.HELMET,
        ItemGrade.COMMON,
        5
      );
      const enhanced10Item = createTestItem(
        "3",
        ItemType.HELMET,
        ItemGrade.RARE,
        10
      );

      expect(calculateItemSalePrice(baseItem)).toBe(5); // 5 + 0
      expect(calculateItemSalePrice(enhanced5Item)).toBe(6); // 5 + (5 * 0.05 * 5) = 5 + 1.25 -> 6
      expect(calculateItemSalePrice(enhanced10Item)).toBe(18); // 12 + (12 * 0.05 * 10) = 12 + 6 = 18
    });
  });

  describe("calculateTotalSalePrice", () => {
    it("should calculate total price for multiple items (balanced)", () => {
      const items = [
        createTestItem("1", ItemType.HELMET, ItemGrade.COMMON, 0), // 5
        createTestItem("2", ItemType.ARMOR, ItemGrade.RARE, 5), // 12 + (12 * 0.05 * 5) = 12 + 3 = 15
        createTestItem("3", ItemType.PANTS, ItemGrade.EPIC, 2), // 25 + (25 * 0.05 * 2) = 25 + 2.5 -> 27
      ];

      const total = calculateTotalSalePrice(items);
      expect(total).toBe(47); // 5 + 15 + 27
    });

    it("should return 0 for empty array", () => {
      expect(calculateTotalSalePrice([])).toBe(0);
    });
  });

  describe("canSellItem", () => {
    it("should allow selling unequipped items", () => {
      const item = createTestItem("1", ItemType.HELMET, ItemGrade.COMMON);
      const equippedItems = createTestEquippedItems([]);

      expect(canSellItem(item, equippedItems)).toBe(true);
    });

    it("should prevent selling equipped items", () => {
      const item = createTestItem(
        "equipped-1",
        ItemType.HELMET,
        ItemGrade.COMMON
      );
      const equippedItems = createTestEquippedItems(["equipped-1"]);

      expect(canSellItem(item, equippedItems)).toBe(false);
    });
  });

  describe("processItemSale", () => {
    it("should successfully sell unequipped items (balanced)", () => {
      const items = [
        createTestItem("1", ItemType.HELMET, ItemGrade.COMMON, 0), // 5
        createTestItem("2", ItemType.ARMOR, ItemGrade.RARE, 0), // 12
      ];
      const equippedItems = createTestEquippedItems([]);

      const result = processItemSale(items, equippedItems);

      expect(result.success).toBe(true);
      expect(result.credits).toBe(17); // 5 + 12
      expect(result.soldItems).toHaveLength(2);
      expect(result.failedItems).toHaveLength(0);
    });

    it("should separate equipped and unequipped items (balanced)", () => {
      const items = [
        createTestItem("equipped-1", ItemType.HELMET, ItemGrade.COMMON, 0), // equipped
        createTestItem("2", ItemType.ARMOR, ItemGrade.RARE, 0), // unequipped
      ];
      const equippedItems = createTestEquippedItems(["equipped-1"]);

      // 검증을 건너뛰고 판매 처리
      const result = processItemSale(items, equippedItems, true);

      expect(result.success).toBe(true);
      expect(result.credits).toBe(12); // only unequipped item (12)
      expect(result.soldItems).toHaveLength(1);
      expect(result.failedItems).toHaveLength(1);
      expect(result.soldItems[0].id).toBe("2");
      expect(result.failedItems[0].id).toBe("equipped-1");
    });

    it("should fail when no items can be sold", () => {
      const items = [
        createTestItem("equipped-1", ItemType.HELMET, ItemGrade.COMMON, 0),
      ];
      const equippedItems = createTestEquippedItems(["equipped-1"]);

      // 검증을 건너뛰고 판매 처리
      const result = processItemSale(items, equippedItems, true);

      expect(result.success).toBe(false);
      expect(result.credits).toBe(0);
      expect(result.soldItems).toHaveLength(0);
      expect(result.failedItems).toHaveLength(1);
    });

    it("should handle empty item array with validation", () => {
      const result = processItemSale([], createTestEquippedItems([]));

      expect(result.success).toBe(false);
      expect(result.error).toBe("판매할 아이템을 선택해주세요.");
    });
  });

  describe("getItemSaleStatus", () => {
    it("should return correct status for sellable item (balanced)", () => {
      const item = createTestItem("1", ItemType.HELMET, ItemGrade.COMMON, 5);
      const equippedItems = createTestEquippedItems([]);

      const status = getItemSaleStatus(item, equippedItems);

      expect(status.canSell).toBe(true);
      expect(status.reason).toBeUndefined();
      expect(status.salePrice).toBe(6); // 5 + (5 * 0.05 * 5) = 5 + 1.25 -> 6
    });

    it("should return correct status for equipped item (balanced)", () => {
      const item = createTestItem(
        "equipped-1",
        ItemType.HELMET,
        ItemGrade.COMMON,
        0
      );
      const equippedItems = createTestEquippedItems(["equipped-1"]);

      const status = getItemSaleStatus(item, equippedItems);

      expect(status.canSell).toBe(false);
      expect(status.reason).toBe("현재 장착 중인 아이템은 판매할 수 없습니다.");
      expect(status.salePrice).toBe(5); // 10 -> 5로 조정
    });
  });

  describe("getGradeSalePrices", () => {
    it("should return correct balanced base prices for all grades", () => {
      const prices = getGradeSalePrices();

      expect(prices[ItemGrade.COMMON]).toBe(5); // 10 -> 5로 조정
      expect(prices[ItemGrade.RARE]).toBe(12); // 25 -> 12로 조정
      expect(prices[ItemGrade.EPIC]).toBe(25); // 50 -> 25로 조정
      expect(prices[ItemGrade.LEGENDARY]).toBe(50); // 100 -> 50으로 조정
    });

    it("should return a copy of the original prices", () => {
      const prices = getGradeSalePrices();
      prices[ItemGrade.COMMON] = 999;

      // Original should not be modified
      expect(ITEM_BASE_SALE_PRICES[ItemGrade.COMMON]).toBe(5); // 10 -> 5로 조정
    });
  });

  describe("Sale Limits and Validation", () => {
    describe("validateItemSale", () => {
      it("should pass validation for normal sale", () => {
        const items = [
          createTestItem("1", ItemType.HELMET, ItemGrade.COMMON, 0),
          createTestItem("2", ItemType.ARMOR, ItemGrade.RARE, 0),
        ];
        const equippedItems = createTestEquippedItems([]);

        const validation = validateItemSale(items, equippedItems);

        expect(validation.isValid).toBe(true);
        expect(validation.errors).toHaveLength(0);
        expect(validation.warnings).toHaveLength(0);
      });

      it("should fail validation when exceeding item limit", () => {
        const items = Array.from({ length: 25 }, (_, i) =>
          createTestItem(`${i}`, ItemType.HELMET, ItemGrade.COMMON, 0)
        );
        const equippedItems = createTestEquippedItems([]);

        const validation = validateItemSale(items, equippedItems);

        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain(
          `한 번에 최대 ${SALE_LIMITS.MAX_ITEMS_PER_SALE}개까지만 판매할 수 있습니다. (선택된 아이템: 25개)`
        );
      });

      it("should allow exceeding item limit in select all mode", () => {
        const items = Array.from({ length: 25 }, (_, i) =>
          createTestItem(`${i}`, ItemType.HELMET, ItemGrade.COMMON, 0)
        );
        const equippedItems = createTestEquippedItems([]);

        const validation = validateItemSale(items, equippedItems, true); // isSelectAll = true

        expect(validation.isValid).toBe(true);
        expect(validation.errors).not.toContain(
          `한 번에 최대 ${SALE_LIMITS.MAX_ITEMS_PER_SALE}개까지만 판매할 수 있습니다. (선택된 아이템: 25개)`
        );
      });

      it("should fail validation for empty selection", () => {
        const validation = validateItemSale([], createTestEquippedItems([]));

        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain("판매할 아이템을 선택해주세요.");
      });

      it("should warn for high value items", () => {
        const items = [
          createTestItem("1", ItemType.HELMET, ItemGrade.LEGENDARY, 10), // 50 + (50 * 0.05 * 10) = 75
          createTestItem("2", ItemType.ARMOR, ItemGrade.LEGENDARY, 10), // 75
        ];
        const equippedItems = createTestEquippedItems([]);

        const validation = validateItemSale(items, equippedItems);

        expect(validation.isValid).toBe(true);
        expect(validation.warnings).toContain(
          `총 150 크레딧의 고가치 아이템을 판매하려고 합니다.`
        );
      });

      it("should warn for rare grade items", () => {
        const items = [
          createTestItem("1", ItemType.HELMET, ItemGrade.EPIC, 0),
          createTestItem("2", ItemType.ARMOR, ItemGrade.LEGENDARY, 0),
        ];
        const equippedItems = createTestEquippedItems([]);

        const validation = validateItemSale(items, equippedItems);

        expect(validation.isValid).toBe(true);
        expect(validation.warnings).toContain(
          `epic, legendary 등급의 희귀 아이템 2개가 포함되어 있습니다.`
        );
      });

      it("should fail validation for equipped items", () => {
        const items = [
          createTestItem("equipped-1", ItemType.HELMET, ItemGrade.COMMON, 0),
        ];
        const equippedItems = createTestEquippedItems(["equipped-1"]);

        const validation = validateItemSale(items, equippedItems);

        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain(
          "현재 장착 중인 아이템 1개는 판매할 수 없습니다."
        );
      });
    });

    describe("getSaleLimits", () => {
      it("should return correct sale limits", () => {
        const limits = getSaleLimits();

        expect(limits.MAX_ITEMS_PER_SALE).toBe(20);
        expect(limits.HIGH_VALUE_CONFIRMATION_THRESHOLD).toBe(100);
        expect(limits.RARE_GRADE_CONFIRMATION).toContain(ItemGrade.EPIC);
        expect(limits.RARE_GRADE_CONFIRMATION).toContain(ItemGrade.LEGENDARY);
      });
    });

    describe("calculateSaleEfficiency", () => {
      it("should calculate sale efficiency correctly", () => {
        const item = createTestItem("1", ItemType.HELMET, ItemGrade.COMMON, 5);

        const efficiency = calculateSaleEfficiency(item);

        expect(efficiency.salePrice).toBe(6); // 5 + (5 * 0.05 * 5)
        expect(efficiency.estimatedEnhancementCost).toBe(500); // 5 * 100 * 1.0
        expect(efficiency.efficiency).toBeCloseTo(0.012); // 6 / 500
      });

      it("should handle zero enhancement level", () => {
        const item = createTestItem("1", ItemType.HELMET, ItemGrade.COMMON, 0);

        const efficiency = calculateSaleEfficiency(item);

        expect(efficiency.salePrice).toBe(5);
        expect(efficiency.estimatedEnhancementCost).toBe(0);
        expect(efficiency.efficiency).toBe(0);
      });
    });

    describe("processItemSale with validation", () => {
      it("should enforce validation by default", () => {
        const items = Array.from({ length: 25 }, (_, i) =>
          createTestItem(`${i}`, ItemType.HELMET, ItemGrade.COMMON, 0)
        );
        const equippedItems = createTestEquippedItems([]);

        const result = processItemSale(items, equippedItems);

        expect(result.success).toBe(false);
        expect(result.error).toContain(
          "한 번에 최대 20개까지만 판매할 수 있습니다"
        );
      });

      it("should skip validation when requested", () => {
        const items = Array.from({ length: 25 }, (_, i) =>
          createTestItem(`${i}`, ItemType.HELMET, ItemGrade.COMMON, 0)
        );
        const equippedItems = createTestEquippedItems([]);

        const result = processItemSale(items, equippedItems, true);

        expect(result.success).toBe(true);
        expect(result.credits).toBe(125); // 25 * 5
      });
    });
  });
});
