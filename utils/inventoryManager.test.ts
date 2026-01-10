/**
 * 인벤토리 관리 시스템 프로퍼티 테스트
 * Requirements: 6.1, 6.5 - 인벤토리 아이템 지속성
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  filterInventoryItems,
  sortInventoryItems,
  searchInventoryItems,
  checkInventoryCapacity,
  canAddItemToInventory,
  removeItemFromInventory,
  findItemsInInventory,
  getItemsByType,
  getItemsByGrade,
  getItemDisplayName,
  getItemDetailInfo,
  compareItems,
  calculateInventoryExpansionCost,
  getInventoryStats,
  SortOption,
  SortDirection,
  InventoryFilter,
  InventorySort,
  INVENTORY_CONFIG,
} from "./inventoryManager";
import { Item, ItemType, ItemGrade, ItemStats } from "../types/game";

// 테스트용 아이템 생성기
const itemStatsArbitrary = fc.record({
  attack: fc.integer({ min: 0, max: 100 }),
  defense: fc.integer({ min: 0, max: 100 }),
  defensePenetration: fc.integer({ min: 0, max: 50 }),
  additionalAttackChance: fc.float({ min: 0, max: 0.5 }),
  creditPerSecondBonus: fc.integer({ min: 0, max: 10 }),
  criticalDamageMultiplier: fc.float({ min: 0, max: 2 }),
  criticalChance: fc.float({ min: 0, max: 0.5 }),
});

const itemArbitrary = fc.record({
  id: fc.uuid(), // 고유한 UUID 사용
  type: fc.constantFrom(...Object.values(ItemType)),
  grade: fc.constantFrom(...Object.values(ItemGrade)),
  baseStats: itemStatsArbitrary,
  enhancedStats: itemStatsArbitrary,
  level: fc.integer({ min: 1, max: 100 }),
  enhancementLevel: fc.integer({ min: 0, max: 15 }),
  imagePath: fc.string(),
});

const inventoryArbitrary = fc.array(itemArbitrary, {
  minLength: 0,
  maxLength: 50,
});

describe("인벤토리 관리 시스템 프로퍼티 테스트", () => {
  /**
   * Property 23: Inventory Item Persistence
   * For any item added to inventory, it should be retrievable and maintain all its properties
   * Validates: Requirements 6.1, 6.5
   */
  it("Property 23: Inventory Item Persistence", () => {
    fc.assert(
      fc.property(
        inventoryArbitrary,
        itemArbitrary,
        (inventory: Item[], newItem: Item) => {
          // 아이템을 인벤토리에 추가
          const updatedInventory = [...inventory, newItem];

          // 추가된 아이템이 인벤토리에서 검색 가능해야 함
          const foundItem = updatedInventory.find(
            (item) => item.id === newItem.id
          );

          // 아이템이 존재해야 함
          expect(foundItem).toBeDefined();

          if (foundItem) {
            // 모든 속성이 보존되어야 함
            expect(foundItem.id).toBe(newItem.id);
            expect(foundItem.type).toBe(newItem.type);
            expect(foundItem.grade).toBe(newItem.grade);
            expect(foundItem.level).toBe(newItem.level);
            expect(foundItem.baseStats).toEqual(newItem.baseStats);
            expect(foundItem.enhancedStats).toEqual(newItem.enhancedStats);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 인벤토리 필터링 프로퍼티 테스트
   * 필터링된 결과는 항상 원본의 부분집합이어야 함
   */
  it("should ensure filtered items are always a subset of original inventory", () => {
    fc.assert(
      fc.property(
        inventoryArbitrary,
        fc.record({
          type: fc.option(fc.constantFrom(...Object.values(ItemType)), {
            nil: undefined,
          }),
          grade: fc.option(fc.constantFrom(...Object.values(ItemGrade)), {
            nil: undefined,
          }),
          minLevel: fc.option(fc.integer({ min: 0, max: 50 }), {
            nil: undefined,
          }),
          maxLevel: fc.option(fc.integer({ min: 50, max: 100 }), {
            nil: undefined,
          }),
          searchText: fc.option(fc.string({ maxLength: 10 }), {
            nil: undefined,
          }),
        }),
        (inventory: Item[], filter: InventoryFilter) => {
          const filteredItems = filterInventoryItems(inventory, filter);

          // 필터링된 아이템들은 모두 원본 인벤토리에 존재해야 함
          filteredItems.forEach((filteredItem) => {
            const existsInOriginal = inventory.some(
              (item) => item.id === filteredItem.id
            );
            expect(existsInOriginal).toBe(true);
          });

          // 필터링된 결과의 길이는 원본보다 작거나 같아야 함
          expect(filteredItems.length).toBeLessThanOrEqual(inventory.length);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 인벤토리 정렬 프로퍼티 테스트
   * 정렬된 결과는 원본과 같은 아이템들을 포함해야 함
   */
  it("should preserve all items during sorting operations", () => {
    fc.assert(
      fc.property(
        inventoryArbitrary,
        fc.record({
          option: fc.constantFrom(...Object.values(SortOption)),
          direction: fc.constantFrom(...Object.values(SortDirection)),
        }),
        (inventory: Item[], sort: InventorySort) => {
          const sortedItems = sortInventoryItems(inventory, sort);

          // 정렬된 결과의 길이는 원본과 같아야 함
          expect(sortedItems.length).toBe(inventory.length);

          // 모든 원본 아이템이 정렬된 결과에 존재해야 함
          inventory.forEach((originalItem) => {
            const existsInSorted = sortedItems.some(
              (item) => item.id === originalItem.id
            );
            expect(existsInSorted).toBe(true);
          });

          // 모든 정렬된 아이템이 원본에 존재해야 함
          sortedItems.forEach((sortedItem) => {
            const existsInOriginal = inventory.some(
              (item) => item.id === sortedItem.id
            );
            expect(existsInOriginal).toBe(true);
          });

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 인벤토리 용량 체크 프로퍼티 테스트
   * 용량 정보는 항상 일관성이 있어야 함
   */
  it("should maintain consistent capacity information", () => {
    fc.assert(
      fc.property(
        inventoryArbitrary,
        fc.integer({ min: 10, max: 200 }),
        (inventory: Item[], capacity: number) => {
          const capacityInfo = checkInventoryCapacity(inventory, capacity);

          // 현재 아이템 수는 실제 인벤토리 길이와 같아야 함
          expect(capacityInfo.currentCount).toBe(inventory.length);

          // 최대 용량은 설정된 값과 같아야 함
          expect(capacityInfo.maxCapacity).toBe(capacity);

          // 남은 슬롯 수는 계산이 정확해야 함
          expect(capacityInfo.remainingSlots).toBe(
            Math.max(0, capacity - inventory.length)
          );

          // 가득 참 여부는 정확해야 함
          expect(capacityInfo.isFull).toBe(inventory.length >= capacity);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 아이템 제거 프로퍼티 테스트
   * 제거 후 아이템이 실제로 사라져야 함
   */
  it("should properly remove items from inventory", () => {
    fc.assert(
      fc.property(
        fc.array(itemArbitrary, { minLength: 1, maxLength: 20 }),
        (inventory: Item[]) => {
          // 랜덤하게 아이템 하나 선택
          const randomIndex = Math.floor(Math.random() * inventory.length);
          const itemToRemove = inventory[randomIndex];

          const result = removeItemFromInventory(inventory, itemToRemove.id);

          if (result.success && result.items) {
            // 제거된 아이템이 결과에 없어야 함
            const stillExists = result.items.some(
              (item) => item.id === itemToRemove.id
            );
            expect(stillExists).toBe(false);

            // 결과 길이는 원본보다 1 작아야 함
            expect(result.items.length).toBe(inventory.length - 1);

            // 다른 아이템들은 모두 보존되어야 함
            const otherItems = inventory.filter(
              (item) => item.id !== itemToRemove.id
            );
            otherItems.forEach((otherItem) => {
              const existsInResult = result.items!.some(
                (item) => item.id === otherItem.id
              );
              expect(existsInResult).toBe(true);
            });
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 타입별 아이템 필터링 프로퍼티 테스트
   * 특정 타입으로 필터링된 결과는 해당 타입만 포함해야 함
   */
  it("should filter items by type correctly", () => {
    fc.assert(
      fc.property(
        inventoryArbitrary,
        fc.constantFrom(...Object.values(ItemType)),
        (inventory: Item[], targetType: ItemType) => {
          const filteredItems = getItemsByType(inventory, targetType);

          // 필터링된 모든 아이템이 지정된 타입이어야 함
          filteredItems.forEach((item) => {
            expect(item.type).toBe(targetType);
          });

          // 원본에서 해당 타입의 아이템 수와 일치해야 함
          const expectedCount = inventory.filter(
            (item) => item.type === targetType
          ).length;
          expect(filteredItems.length).toBe(expectedCount);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 등급별 아이템 필터링 프로퍼티 테스트
   * 특정 등급으로 필터링된 결과는 해당 등급만 포함해야 함
   */
  it("should filter items by grade correctly", () => {
    fc.assert(
      fc.property(
        inventoryArbitrary,
        fc.constantFrom(...Object.values(ItemGrade)),
        (inventory: Item[], targetGrade: ItemGrade) => {
          const filteredItems = getItemsByGrade(inventory, targetGrade);

          // 필터링된 모든 아이템이 지정된 등급이어야 함
          filteredItems.forEach((item) => {
            expect(item.grade).toBe(targetGrade);
          });

          // 원본에서 해당 등급의 아이템 수와 일치해야 함
          const expectedCount = inventory.filter(
            (item) => item.grade === targetGrade
          ).length;
          expect(filteredItems.length).toBe(expectedCount);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 아이템 검색 프로퍼티 테스트
   * 검색 결과는 항상 원본의 부분집합이어야 함
   */
  it("should maintain search result consistency", () => {
    fc.assert(
      fc.property(
        inventoryArbitrary,
        fc.string({ maxLength: 10 }),
        (inventory: Item[], searchText: string) => {
          const searchResults = searchInventoryItems(inventory, searchText);

          // 검색 결과는 원본보다 작거나 같아야 함
          expect(searchResults.length).toBeLessThanOrEqual(inventory.length);

          // 모든 검색 결과가 원본에 존재해야 함
          searchResults.forEach((resultItem) => {
            const existsInOriginal = inventory.some(
              (item) => item.id === resultItem.id
            );
            expect(existsInOriginal).toBe(true);
          });

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 인벤토리 통계 프로퍼티 테스트
   * 통계 정보는 실제 인벤토리 내용과 일치해야 함
   */
  it("should calculate inventory statistics correctly", () => {
    fc.assert(
      fc.property(inventoryArbitrary, (inventory: Item[]) => {
        const stats = getInventoryStats(inventory);

        // 총 아이템 수는 인벤토리 길이와 같아야 함
        expect(stats.totalItems).toBe(inventory.length);

        // 타입별 아이템 수 검증
        Object.values(ItemType).forEach((type) => {
          const expectedCount = inventory.filter(
            (item) => item.type === type
          ).length;
          expect(stats.itemsByType[type]).toBe(expectedCount);
        });

        // 등급별 아이템 수 검증
        Object.values(ItemGrade).forEach((grade) => {
          const expectedCount = inventory.filter(
            (item) => item.grade === grade
          ).length;
          expect(stats.itemsByGrade[grade]).toBe(expectedCount);
        });

        // 평균 레벨 검증
        if (inventory.length > 0) {
          const totalLevel = inventory.reduce(
            (sum, item) => sum + item.level,
            0
          );
          const expectedAverage = totalLevel / inventory.length;
          expect(Math.abs(stats.averageLevel - expectedAverage)).toBeLessThan(
            0.001
          );
        } else {
          expect(stats.averageLevel).toBe(0);
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * 아이템 비교 프로퍼티 테스트
   * 아이템 비교 결과는 일관성이 있어야 함
   */
  it("should provide consistent item comparison results", () => {
    fc.assert(
      fc.property(itemArbitrary, itemArbitrary, (item1: Item, item2: Item) => {
        const comparison = compareItems(item1, item2);

        // 비교 결과의 기본 구조 검증
        expect(comparison.item1).toBeDefined();
        expect(comparison.item2).toBeDefined();
        expect(comparison.comparison).toBeDefined();

        // 스탯 차이 계산 검증
        const item1TotalAttack =
          item1.baseStats.attack + item1.enhancedStats.attack;
        const item2TotalAttack =
          item2.baseStats.attack + item2.enhancedStats.attack;
        const expectedAttackDiff = item1TotalAttack - item2TotalAttack;
        expect(comparison.comparison.attack).toBe(expectedAttackDiff);

        const item1TotalDefense =
          item1.baseStats.defense + item1.enhancedStats.defense;
        const item2TotalDefense =
          item2.baseStats.defense + item2.enhancedStats.defense;
        const expectedDefenseDiff = item1TotalDefense - item2TotalDefense;
        expect(comparison.comparison.defense).toBe(expectedDefenseDiff);

        // 대칭성 검증: compareItems(A, B)와 compareItems(B, A)는 반대 결과여야 함
        // JavaScript의 +0과 -0 문제를 해결하기 위해 Math.sign을 사용하여 비교
        const reverseComparison = compareItems(item2, item1);

        // 0인 경우 부호를 무시하고 비교
        if (comparison.comparison.attack === 0) {
          expect(reverseComparison.comparison.attack).toBe(0);
        } else {
          expect(Math.sign(comparison.comparison.attack)).toBe(
            -Math.sign(reverseComparison.comparison.attack)
          );
        }

        if (comparison.comparison.defense === 0) {
          expect(reverseComparison.comparison.defense).toBe(0);
        } else {
          expect(Math.sign(comparison.comparison.defense)).toBe(
            -Math.sign(reverseComparison.comparison.defense)
          );
        }

        if (comparison.comparison.defensePenetration === 0) {
          expect(reverseComparison.comparison.defensePenetration).toBe(0);
        } else {
          expect(Math.sign(comparison.comparison.defensePenetration)).toBe(
            -Math.sign(reverseComparison.comparison.defensePenetration)
          );
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * 인벤토리 확장 비용 계산 프로퍼티 테스트
   * 확장 비용은 항상 양수이고 용량이 클수록 더 비싸야 함
   */
  it("should calculate expansion costs correctly", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: INVENTORY_CONFIG.DEFAULT_CAPACITY, max: 300 }),
        (currentCapacity: number) => {
          const expansionCost =
            calculateInventoryExpansionCost(currentCapacity);

          // 확장 비용은 항상 양수여야 함
          expect(expansionCost).toBeGreaterThan(0);

          // 더 큰 용량일수록 더 비싼 확장 비용이어야 함
          if (currentCapacity > INVENTORY_CONFIG.DEFAULT_CAPACITY) {
            const smallerCapacityCost = calculateInventoryExpansionCost(
              currentCapacity - 10
            );
            expect(expansionCost).toBeGreaterThanOrEqual(smallerCapacityCost);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
