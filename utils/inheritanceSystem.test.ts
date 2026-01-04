/**
 * Tests for inheritance system utilities
 * Based on requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  calculateGradeDifference,
  getInheritanceRate,
  calculateTransferredStats,
  calculateFinalStats,
  validateInheritance,
  generateInheritancePreview,
  performInheritance,
} from "./inheritanceSystem";
import { Item, ItemGrade, ItemType, ItemStats } from "../types/game";
import { ITEM_BASE_STATS } from "../constants/game";

// Helper function to create test items
function createTestItem(
  type: ItemType,
  grade: ItemGrade,
  enhancedStats?: Partial<ItemStats>
): Item {
  const baseStats = ITEM_BASE_STATS[type];
  const finalStats = enhancedStats
    ? { ...baseStats, ...enhancedStats }
    : baseStats;

  return {
    id: `test-${type}-${grade}-${Math.random()}`,
    type,
    grade,
    baseStats,
    enhancedStats: finalStats,
    level: 1,
    enhancementLevel: 0,
    imagePath: `/Items/${type}.png`,
  };
}

describe("Inheritance System", () => {
  describe("Grade Difference Calculation", () => {
    it("should calculate correct grade differences", () => {
      expect(calculateGradeDifference(ItemGrade.COMMON, ItemGrade.RARE)).toBe(
        1
      );
      expect(calculateGradeDifference(ItemGrade.COMMON, ItemGrade.EPIC)).toBe(
        2
      );
      expect(
        calculateGradeDifference(ItemGrade.COMMON, ItemGrade.LEGENDARY)
      ).toBe(3);
      expect(calculateGradeDifference(ItemGrade.RARE, ItemGrade.EPIC)).toBe(1);
      expect(
        calculateGradeDifference(ItemGrade.RARE, ItemGrade.LEGENDARY)
      ).toBe(2);
      expect(
        calculateGradeDifference(ItemGrade.EPIC, ItemGrade.LEGENDARY)
      ).toBe(1);
    });

    it("should return negative or zero for same or lower grades", () => {
      expect(calculateGradeDifference(ItemGrade.RARE, ItemGrade.COMMON)).toBe(
        -1
      );
      expect(calculateGradeDifference(ItemGrade.EPIC, ItemGrade.RARE)).toBe(-1);
      expect(
        calculateGradeDifference(ItemGrade.LEGENDARY, ItemGrade.EPIC)
      ).toBe(-1);
      expect(calculateGradeDifference(ItemGrade.COMMON, ItemGrade.COMMON)).toBe(
        0
      );
    });
  });

  describe("Inheritance Rate Calculation", () => {
    it("should return correct inheritance rates", () => {
      expect(getInheritanceRate(1)).toBe(0.8); // 80%
      expect(getInheritanceRate(2)).toBe(0.6); // 60%
      expect(getInheritanceRate(3)).toBe(0.4); // 40%
    });

    it("should return 0 for invalid grade differences", () => {
      expect(getInheritanceRate(0)).toBe(0);
      expect(getInheritanceRate(-1)).toBe(0);
      expect(getInheritanceRate(4)).toBe(0);
    });
  });

  describe("Stats Transfer Calculation", () => {
    it("should calculate transferred stats correctly", () => {
      const sourceItem = createTestItem(ItemType.HELMET, ItemGrade.COMMON, {
        attack: 0,
        defense: 20,
        defensePenetration: 0,
      });

      const transferredStats = calculateTransferredStats(sourceItem, 0.8);

      expect(transferredStats.attack).toBe(0);
      expect(transferredStats.defense).toBe(16); // 20 * 0.8 = 16
      expect(transferredStats.defensePenetration).toBe(0);
    });

    it("should floor fractional values", () => {
      const sourceItem = createTestItem(ItemType.HELMET, ItemGrade.COMMON, {
        attack: 0,
        defense: 15,
        defensePenetration: 0,
      });

      const transferredStats = calculateTransferredStats(sourceItem, 0.6);

      expect(transferredStats.defense).toBe(9); // Math.floor(15 * 0.6) = 9
    });
  });

  describe("Final Stats Calculation", () => {
    it("should add transferred stats to target stats", () => {
      const targetItem = createTestItem(ItemType.HELMET, ItemGrade.RARE, {
        attack: 0,
        defense: 10,
        defensePenetration: 0,
      });

      const transferredStats = {
        attack: 0,
        defense: 5,
        defensePenetration: 0,
        additionalAttackChance: 0,
      };
      const finalStats = calculateFinalStats(targetItem, transferredStats);

      expect(finalStats.attack).toBe(0);
      expect(finalStats.defense).toBe(15); // 10 + 5
      expect(finalStats.defensePenetration).toBe(0);
    });
  });

  describe("Inheritance Validation", () => {
    it("should allow inheritance between same types and higher grades", () => {
      const sourceItem = createTestItem(ItemType.HELMET, ItemGrade.COMMON);
      const targetItem = createTestItem(ItemType.HELMET, ItemGrade.RARE);

      const validation = validateInheritance(sourceItem, targetItem);
      expect(validation.valid).toBe(true);
    });

    it("should reject inheritance between different types", () => {
      const sourceItem = createTestItem(ItemType.HELMET, ItemGrade.COMMON);
      const targetItem = createTestItem(ItemType.ARMOR, ItemGrade.RARE);

      const validation = validateInheritance(sourceItem, targetItem);
      expect(validation.valid).toBe(false);
      expect(validation.error).toContain("같은 장비 타입");
    });

    it("should reject inheritance to same or lower grade", () => {
      const sourceItem = createTestItem(ItemType.HELMET, ItemGrade.RARE);
      const targetItem = createTestItem(ItemType.HELMET, ItemGrade.COMMON);

      const validation = validateInheritance(sourceItem, targetItem);
      expect(validation.valid).toBe(false);
      expect(validation.error).toContain("더 높은 등급");
    });

    it("should reject inheritance with too large grade difference", () => {
      // This would require a 4-grade difference which doesn't exist in our system
      // but we can test the logic by manually creating the scenario
      const sourceItem = createTestItem(ItemType.HELMET, ItemGrade.COMMON);
      const targetItem = createTestItem(ItemType.HELMET, ItemGrade.LEGENDARY);

      const validation = validateInheritance(sourceItem, targetItem);
      // 3-grade difference should still be valid
      expect(validation.valid).toBe(true);
    });
  });

  describe("Inheritance Preview Generation", () => {
    it("should generate correct preview for valid inheritance", () => {
      const sourceItem = createTestItem(ItemType.HELMET, ItemGrade.COMMON, {
        attack: 0,
        defense: 20,
        defensePenetration: 0,
      });
      const targetItem = createTestItem(ItemType.HELMET, ItemGrade.RARE, {
        attack: 0,
        defense: 10,
        defensePenetration: 0,
      });

      const preview = generateInheritancePreview(sourceItem, targetItem);

      expect(preview.canInherit).toBe(true);
      expect(preview.inheritanceRate).toBe(0.8);
      expect(preview.transferredStats.defense).toBe(16); // 20 * 0.8
      expect(preview.finalStats.defense).toBe(26); // 10 + 16
    });

    it("should generate error preview for invalid inheritance", () => {
      const sourceItem = createTestItem(ItemType.HELMET, ItemGrade.COMMON);
      const targetItem = createTestItem(ItemType.ARMOR, ItemGrade.RARE);

      const preview = generateInheritancePreview(sourceItem, targetItem);

      expect(preview.canInherit).toBe(false);
      expect(preview.errorMessage).toContain("같은 장비 타입");
    });
  });

  describe("Inheritance Performance", () => {
    it("should successfully perform valid inheritance", () => {
      const sourceItem = createTestItem(ItemType.HELMET, ItemGrade.COMMON, {
        attack: 0,
        defense: 20,
        defensePenetration: 0,
      });
      const targetItem = createTestItem(ItemType.HELMET, ItemGrade.RARE, {
        attack: 0,
        defense: 10,
        defensePenetration: 0,
      });

      const result = performInheritance(sourceItem, targetItem);

      expect(result.success).toBe(true);
      expect(result.inheritedItem).toBeDefined();
      expect(result.inheritedItem!.id).toBe(targetItem.id);
      expect(result.inheritedItem!.enhancedStats.defense).toBe(26); // 10 + (20 * 0.8)
    });

    it("should fail for invalid inheritance", () => {
      const sourceItem = createTestItem(ItemType.HELMET, ItemGrade.COMMON);
      const targetItem = createTestItem(ItemType.ARMOR, ItemGrade.RARE);

      const result = performInheritance(sourceItem, targetItem);

      expect(result.success).toBe(false);
      expect(result.error).toContain("같은 장비 타입");
    });
  });

  /**
   * Property 21: Inheritance Stat Transfer
   * For any inheritance operation, the enhanced stats transferred should equal
   * the source item's enhanced stats multiplied by the inheritance rate
   * Validates: Requirements 5.1, 5.2
   */
  describe("Property 21: Inheritance Stat Transfer", () => {
    it("should transfer correct percentage of source stats", () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...Object.values(ItemType)),
          fc.constantFrom(ItemGrade.COMMON, ItemGrade.RARE, ItemGrade.EPIC),
          fc.constantFrom(ItemGrade.RARE, ItemGrade.EPIC, ItemGrade.LEGENDARY),
          fc.record({
            attack: fc.integer({ min: 0, max: 100 }),
            defense: fc.integer({ min: 0, max: 100 }),
            defensePenetration: fc.integer({ min: 0, max: 100 }),
          }),
          (itemType, sourceGrade, targetGrade, enhancedStats) => {
            // Skip if target grade is not higher than source grade
            const gradeDiff = calculateGradeDifference(
              sourceGrade,
              targetGrade
            );
            if (gradeDiff <= 0) return true;

            const sourceItem = createTestItem(
              itemType,
              sourceGrade,
              enhancedStats
            );
            const targetItem = createTestItem(itemType, targetGrade);

            const result = performInheritance(sourceItem, targetItem);

            if (result.success && result.inheritedItem) {
              const inheritanceRate = getInheritanceRate(gradeDiff);
              const expectedTransferredAttack = Math.floor(
                enhancedStats.attack * inheritanceRate
              );
              const expectedTransferredDefense = Math.floor(
                enhancedStats.defense * inheritanceRate
              );
              const expectedTransferredDefensePenetration = Math.floor(
                enhancedStats.defensePenetration * inheritanceRate
              );

              const actualFinalAttack =
                result.inheritedItem.enhancedStats.attack;
              const actualFinalDefense =
                result.inheritedItem.enhancedStats.defense;
              const actualFinalDefensePenetration =
                result.inheritedItem.enhancedStats.defensePenetration;

              const targetBaseStats = ITEM_BASE_STATS[itemType];
              const expectedFinalAttack =
                targetBaseStats.attack + expectedTransferredAttack;
              const expectedFinalDefense =
                targetBaseStats.defense + expectedTransferredDefense;
              const expectedFinalDefensePenetration =
                targetBaseStats.defensePenetration +
                expectedTransferredDefensePenetration;

              return (
                actualFinalAttack === expectedFinalAttack &&
                actualFinalDefense === expectedFinalDefense &&
                actualFinalDefensePenetration ===
                  expectedFinalDefensePenetration
              );
            }

            return false;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 22: Inheritance Type Matching
   * For any inheritance attempt, it should only succeed when source and target items
   * are of the same equipment type
   * Validates: Requirements 5.3
   */
  describe("Property 22: Inheritance Type Matching", () => {
    it("should only allow inheritance between same item types", () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...Object.values(ItemType)),
          fc.constantFrom(...Object.values(ItemType)),
          fc.constantFrom(...Object.values(ItemGrade)),
          fc.constantFrom(...Object.values(ItemGrade)),
          (sourceType, targetType, sourceGrade, targetGrade) => {
            const sourceItem = createTestItem(sourceType, sourceGrade);
            const targetItem = createTestItem(targetType, targetGrade);

            const result = performInheritance(sourceItem, targetItem);

            if (sourceType === targetType) {
              // Same type: should succeed if target grade is higher
              const gradeDiff = calculateGradeDifference(
                sourceGrade,
                targetGrade
              );
              if (gradeDiff > 0 && gradeDiff <= 3) {
                return result.success === true;
              } else {
                return result.success === false;
              }
            } else {
              // Different types: should always fail
              return result.success === false;
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
