/**
 * Tests for inheritance system utilities - Enhancement Level Transfer System
 * Based on requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  calculateGradeDifference,
  getInheritanceSuccessRate,
  calculateEnhancementLevelReduction,
  calculateTargetEnhancementLevel,
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
  enhancementLevel: number = 0,
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
    enhancementLevel,
    imagePath: `/Items/${type}.png`,
  };
}

describe("Inheritance System - Enhancement Level Transfer", () => {
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

  describe("Inheritance Success Rate Calculation", () => {
    it("should return correct inheritance success rates", () => {
      expect(getInheritanceSuccessRate(1)).toBe(0.9); // 90%
      expect(getInheritanceSuccessRate(2)).toBe(0.7); // 70%
      expect(getInheritanceSuccessRate(3)).toBe(0.5); // 50%
      expect(getInheritanceSuccessRate(4)).toBe(0.3); // 30%
    });

    it("should return 0 for invalid grade differences", () => {
      expect(getInheritanceSuccessRate(0)).toBe(0);
      expect(getInheritanceSuccessRate(-1)).toBe(0);
      expect(getInheritanceSuccessRate(5)).toBe(0);
    });
  });

  describe("Enhancement Level Reduction Calculation", () => {
    it("should calculate correct level reduction", () => {
      expect(calculateEnhancementLevelReduction(1)).toBe(1); // -1 level
      expect(calculateEnhancementLevelReduction(2)).toBe(2); // -2 levels
      expect(calculateEnhancementLevelReduction(3)).toBe(3); // -3 levels
      expect(calculateEnhancementLevelReduction(4)).toBe(4); // -4 levels
    });

    it("should return 0 for invalid grade differences", () => {
      expect(calculateEnhancementLevelReduction(0)).toBe(0);
      expect(calculateEnhancementLevelReduction(-1)).toBe(0);
      expect(calculateEnhancementLevelReduction(5)).toBe(0);
    });
  });

  describe("Target Enhancement Level Calculation", () => {
    it("should calculate correct target enhancement level", () => {
      expect(calculateTargetEnhancementLevel(10, 1)).toBe(9); // 10 - 1 = 9
      expect(calculateTargetEnhancementLevel(10, 2)).toBe(8); // 10 - 2 = 8
      expect(calculateTargetEnhancementLevel(10, 3)).toBe(7); // 10 - 3 = 7
    });

    it("should not go below 0", () => {
      expect(calculateTargetEnhancementLevel(2, 3)).toBe(0); // max(0, 2-3) = 0
      expect(calculateTargetEnhancementLevel(1, 2)).toBe(0); // max(0, 1-2) = 0
    });
  });

  describe("Inheritance Validation", () => {
    it("should allow inheritance between same types and higher grades with enhancement", () => {
      const sourceItem = createTestItem(ItemType.HELMET, ItemGrade.COMMON, 5);
      const targetItem = createTestItem(ItemType.HELMET, ItemGrade.RARE, 0);

      const validation = validateInheritance(sourceItem, targetItem);
      expect(validation.valid).toBe(true);
    });

    it("should reject inheritance between different types", () => {
      const sourceItem = createTestItem(ItemType.HELMET, ItemGrade.COMMON, 5);
      const targetItem = createTestItem(ItemType.ARMOR, ItemGrade.RARE, 0);

      const validation = validateInheritance(sourceItem, targetItem);
      expect(validation.valid).toBe(false);
      expect(validation.error).toContain("같은 장비 타입");
    });

    it("should reject inheritance to same or lower grade", () => {
      const sourceItem = createTestItem(ItemType.HELMET, ItemGrade.RARE, 5);
      const targetItem = createTestItem(ItemType.HELMET, ItemGrade.COMMON, 0);

      const validation = validateInheritance(sourceItem, targetItem);
      expect(validation.valid).toBe(false);
      expect(validation.error).toContain("더 높은 등급");
    });

    it("should reject inheritance with 0 enhancement level", () => {
      const sourceItem = createTestItem(ItemType.HELMET, ItemGrade.COMMON, 0);
      const targetItem = createTestItem(ItemType.HELMET, ItemGrade.RARE, 0);

      const validation = validateInheritance(sourceItem, targetItem);
      expect(validation.valid).toBe(false);
      expect(validation.error).toContain("강화 등급이 0");
    });

    it("should allow inheritance with maximum grade difference", () => {
      const sourceItem = createTestItem(ItemType.HELMET, ItemGrade.COMMON, 10);
      const targetItem = createTestItem(ItemType.HELMET, ItemGrade.MYTHIC, 0);

      const validation = validateInheritance(sourceItem, targetItem);
      expect(validation.valid).toBe(true);
    });
  });

  describe("Inheritance Preview Generation", () => {
    it("should generate correct preview for valid inheritance", () => {
      const sourceItem = createTestItem(ItemType.HELMET, ItemGrade.COMMON, 10);
      const targetItem = createTestItem(ItemType.HELMET, ItemGrade.RARE, 0);

      const preview = generateInheritancePreview(sourceItem, targetItem);

      expect(preview.canInherit).toBe(true);
      expect(preview.successRate).toBe(0.9); // 90% for 1-grade difference
      expect(preview.sourceEnhancementLevel).toBe(10);
      expect(preview.targetEnhancementLevel).toBe(9); // 10 - 1 = 9
      expect(preview.levelReduction).toBe(1);
    });

    it("should generate error preview for invalid inheritance", () => {
      const sourceItem = createTestItem(ItemType.HELMET, ItemGrade.COMMON, 0);
      const targetItem = createTestItem(ItemType.HELMET, ItemGrade.RARE, 0);

      const preview = generateInheritancePreview(sourceItem, targetItem);

      expect(preview.canInherit).toBe(false);
      expect(preview.errorMessage).toContain("강화 등급이 0");
    });
  });

  describe("Inheritance Performance", () => {
    it("should successfully perform valid inheritance (mocked success)", () => {
      // Mock Math.random to always return 0 (success)
      const originalRandom = Math.random;
      Math.random = () => 0;

      const sourceItem = createTestItem(ItemType.HELMET, ItemGrade.COMMON, 10);
      const targetItem = createTestItem(ItemType.HELMET, ItemGrade.RARE, 0);

      const result = performInheritance(sourceItem, targetItem);

      expect(result.success).toBe(true);
      expect(result.inheritedItem).toBeDefined();
      expect(result.inheritedItem!.id).toBe(targetItem.id);
      expect(result.inheritedItem!.enhancementLevel).toBe(9); // 10 - 1 = 9

      // Restore original Math.random
      Math.random = originalRandom;
    });

    it("should fail inheritance due to random chance (mocked failure)", () => {
      // Mock Math.random to always return 1 (failure)
      const originalRandom = Math.random;
      Math.random = () => 1;

      const sourceItem = createTestItem(ItemType.HELMET, ItemGrade.COMMON, 10);
      const targetItem = createTestItem(ItemType.HELMET, ItemGrade.RARE, 0);

      const result = performInheritance(sourceItem, targetItem);

      expect(result.success).toBe(false);
      expect(result.error).toContain("계승에 실패했습니다");

      // Restore original Math.random
      Math.random = originalRandom;
    });

    it("should fail for invalid inheritance", () => {
      const sourceItem = createTestItem(ItemType.HELMET, ItemGrade.COMMON, 0);
      const targetItem = createTestItem(ItemType.HELMET, ItemGrade.RARE, 0);

      const result = performInheritance(sourceItem, targetItem);

      expect(result.success).toBe(false);
      expect(result.error).toContain("강화 등급이 0");
    });
  });

  /**
   * Property 21: Enhancement Level Transfer
   * For any inheritance operation, the target enhancement level should be
   * source enhancement level minus the grade difference reduction
   * Validates: Requirements 5.1, 5.2
   */
  describe("Property 21: Enhancement Level Transfer", () => {
    it("should transfer correct enhancement level", () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...Object.values(ItemType)),
          fc.constantFrom(
            ItemGrade.COMMON,
            ItemGrade.RARE,
            ItemGrade.EPIC,
            ItemGrade.LEGENDARY
          ),
          fc.constantFrom(
            ItemGrade.RARE,
            ItemGrade.EPIC,
            ItemGrade.LEGENDARY,
            ItemGrade.MYTHIC
          ),
          fc.integer({ min: 1, max: 25 }), // source enhancement level
          (itemType, sourceGrade, targetGrade, sourceEnhancementLevel) => {
            // Skip if target grade is not higher than source grade
            const gradeDiff = calculateGradeDifference(
              sourceGrade,
              targetGrade
            );
            if (gradeDiff <= 0) return true;

            const sourceItem = createTestItem(
              itemType,
              sourceGrade,
              sourceEnhancementLevel
            );
            const targetItem = createTestItem(itemType, targetGrade, 0);

            // Mock Math.random to always succeed
            const originalRandom = Math.random;
            Math.random = () => 0;

            const result = performInheritance(sourceItem, targetItem);

            // Restore original Math.random
            Math.random = originalRandom;

            if (result.success && result.inheritedItem) {
              const expectedTargetLevel = calculateTargetEnhancementLevel(
                sourceEnhancementLevel,
                gradeDiff
              );
              return (
                result.inheritedItem.enhancementLevel === expectedTargetLevel
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
   * are of the same equipment type and source has enhancement level > 0
   * Validates: Requirements 5.3
   */
  describe("Property 22: Inheritance Type Matching", () => {
    it("should only allow inheritance between same item types with enhancement", () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...Object.values(ItemType)),
          fc.constantFrom(...Object.values(ItemType)),
          fc.constantFrom(...Object.values(ItemGrade)),
          fc.constantFrom(...Object.values(ItemGrade)),
          fc.integer({ min: 0, max: 25 }),
          (
            sourceType,
            targetType,
            sourceGrade,
            targetGrade,
            enhancementLevel
          ) => {
            const sourceItem = createTestItem(
              sourceType,
              sourceGrade,
              enhancementLevel
            );
            const targetItem = createTestItem(targetType, targetGrade, 0);

            // Mock Math.random to always succeed
            const originalRandom = Math.random;
            Math.random = () => 0;

            const result = performInheritance(sourceItem, targetItem);

            // Restore original Math.random
            Math.random = originalRandom;

            if (sourceType === targetType) {
              // Same type: should succeed if target grade is higher and source has enhancement
              const gradeDiff = calculateGradeDifference(
                sourceGrade,
                targetGrade
              );
              if (gradeDiff > 0 && gradeDiff <= 4 && enhancementLevel > 0) {
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
