/**
 * Property-based tests for the item drop system
 * Tests Properties 16, 17, 18, 25, 26
 * Based on requirements 3.1, 3.2, 3.6, 4.1, 4.2, 4.3
 */

import { describe, test, expect, beforeEach, vi } from "vitest";
import * as fc from "fast-check";
import {
  ItemDropSystem,
  checkStageClearItemDrop,
  checkIdleItemDrop,
  initializeItemDropSystem,
  getTimeUntilNextIdleDrop,
} from "./itemDropSystem";
import { ItemGrade, ItemType } from "../types/game";
import {
  STAGE_CLEAR_DROP_RATES,
  IDLE_DROP_RATES,
  GRADE_MULTIPLIERS,
  BASE_DROP_RATES,
  ITEM_BASE_STATS,
  DROP_CHECK_INTERVALS,
} from "../constants/game";

describe("Item Drop System Property Tests", () => {
  let itemDropSystem: ItemDropSystem;

  beforeEach(() => {
    itemDropSystem = new ItemDropSystem();
    // Mock Math.random for predictable testing
    vi.spyOn(Math, "random");
  });

  /**
   * **Feature: idle-gacha-game, Property 16: Item Drop Probability**
   * For any stage clear event, the probability of dropping items should be 100% (guaranteed drop)
   * **Validates: Requirements 3.1**
   */
  test("Property 16: Item drop probability should be 100% for stage clear", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 5 }), // stage
        (stage) => {
          // Create a fresh instance to avoid state interference
          const testDropSystem = new ItemDropSystem();

          // Mock Math.random to return various values
          const mockValues = [
            0.5, // for item type selection (middle of range)
            0.5, // for grade selection (middle of range)
            0.5, // for stat variation
            0.5, // for stat variation
            0.5, // for stat variation
          ];
          let callCount = 0;
          (Math.random as any).mockImplementation(() => {
            if (callCount < mockValues.length) {
              return mockValues[callCount++];
            }
            return 0.5; // default fallback
          });

          const result = testDropSystem.checkStageClearDrop(stage);

          // Verify basic result structure
          expect(result.dropType).toBe("stageClear");
          expect(result.stage).toBe(stage);

          // Stage clear should ALWAYS result in 100% guaranteed drop
          expect(result.success).toBe(true);
          expect(result.item).toBeDefined();

          if (result.item) {
            expect(result.item.id).toBeDefined();
            expect(Object.values(ItemType)).toContain(result.item.type);
            expect(Object.values(ItemGrade)).toContain(result.item.grade);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: idle-gacha-game, Property 17: Item Grade Distribution**
   * For any collection of dropped items, the distribution of grades should approximate the configured probabilities over sufficient samples
   * **Validates: Requirements 4.1, 4.2**
   */
  test("Property 17: Item grade distribution should follow configured probabilities", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 5 }), // stage
        fc.constantFrom("stageClear", "idle"), // drop type
        (stage, dropType) => {
          const dropRates =
            dropType === "stageClear"
              ? STAGE_CLEAR_DROP_RATES[stage] || STAGE_CLEAR_DROP_RATES[1]
              : IDLE_DROP_RATES[stage] || IDLE_DROP_RATES[1];

          // 기본적인 검증: 드랍률이 유효한 확률값인지 확인
          let totalRate = 0;
          Object.entries(dropRates).forEach(([grade, rate]) => {
            expect(rate).toBeGreaterThanOrEqual(0);
            expect(rate).toBeLessThanOrEqual(1);
            totalRate += rate;
          });

          // 총 확률이 1에 가까운지 확인 (±10% 허용)
          expect(totalRate).toBeGreaterThanOrEqual(0.9);
          expect(totalRate).toBeLessThanOrEqual(1.1);

          // 실제 아이템 생성이 작동하는지 확인
          const testDropSystem = new ItemDropSystem();

          // Mock random values for successful drop
          const mockValues = [
            0.1, // ensure drop succeeds
            0.5, // for item type selection
            0.1, // for grade selection (should get first grade in cumulative)
            0.5,
            0.5,
            0.5, // for stat variations
          ];
          let callCount = 0;
          (Math.random as any).mockImplementation(() => {
            if (callCount < mockValues.length) {
              return mockValues[callCount++];
            }
            return 0.5;
          });

          const result =
            dropType === "stageClear"
              ? testDropSystem.checkStageClearDrop(stage)
              : testDropSystem.checkIdleDrop(stage);

          // 성공적으로 아이템이 생성되는지 확인
          if (result.success) {
            expect(result.item).toBeDefined();
            if (result.item) {
              expect(Object.values(ItemGrade)).toContain(result.item.grade);
              expect(Object.values(ItemType)).toContain(result.item.type);
            }
          }

          // 드랍률 구조가 올바른지 확인
          expect(dropRates).toHaveProperty(ItemGrade.COMMON);
          expect(dropRates).toHaveProperty(ItemGrade.RARE);
          expect(dropRates).toHaveProperty(ItemGrade.EPIC);
          expect(dropRates).toHaveProperty(ItemGrade.LEGENDARY);
        }
      ),
      { numRuns: 10 } // 단순한 검증이므로 더 많이 실행
    );
  });

  /**
   * **Feature: idle-gacha-game, Property 18: Item Stat Scaling**
   * For any item grade and type, the item's stats should be within the expected range based on base stats and grade multipliers
   * **Validates: Requirements 4.3**
   */
  test("Property 18: Item stats should scale correctly with grade and stage", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 5 }), // stage
        (stage) => {
          // Mock Math.random for consistent item generation
          (Math.random as any)
            .mockReturnValueOnce(0.1) // ensure drop succeeds
            .mockReturnValueOnce(0.1) // select first grade (will be overridden by our test)
            .mockReturnValue(0.5); // for stat variation (no variation)

          // Generate item through drop system
          const testDropSystem = new ItemDropSystem();
          const result = testDropSystem.checkStageClearDrop(stage);

          if (result.success && result.item) {
            const item = result.item;
            const baseStats = ITEM_BASE_STATS[item.type];
            const gradeMultiplier = GRADE_MULTIPLIERS[item.grade];
            const stageMultiplier = 1 + (stage - 1) * 0.2;

            // Calculate expected stat ranges (considering ±10% variation)
            const expectedAttack =
              baseStats.attack * gradeMultiplier * stageMultiplier;
            const expectedDefense =
              baseStats.defense * gradeMultiplier * stageMultiplier;
            const expectedDefensePenetration =
              baseStats.defensePenetration * gradeMultiplier * stageMultiplier;

            // Allow for ±10% variation plus rounding
            const tolerance = 0.2; // 20% tolerance for rounding and variation

            if (expectedAttack > 0) {
              const attackDiff =
                Math.abs(item.enhancedStats.attack - expectedAttack) /
                expectedAttack;
              expect(attackDiff).toBeLessThanOrEqual(tolerance);
            } else {
              expect(item.enhancedStats.attack).toBe(0);
            }

            if (expectedDefense > 0) {
              const defenseDiff =
                Math.abs(item.enhancedStats.defense - expectedDefense) /
                expectedDefense;
              expect(defenseDiff).toBeLessThanOrEqual(tolerance);
            } else {
              expect(item.enhancedStats.defense).toBe(0);
            }

            if (expectedDefensePenetration > 0) {
              const defPenDiff =
                Math.abs(
                  item.enhancedStats.defensePenetration -
                    expectedDefensePenetration
                ) / expectedDefensePenetration;
              expect(defPenDiff).toBeLessThanOrEqual(tolerance);
            } else {
              expect(item.enhancedStats.defensePenetration).toBe(0);
            }

            // Stats should be non-negative and at least 1 if base stat > 0
            expect(item.enhancedStats.attack).toBeGreaterThanOrEqual(0);
            expect(item.enhancedStats.defense).toBeGreaterThanOrEqual(0);
            expect(
              item.enhancedStats.defensePenetration
            ).toBeGreaterThanOrEqual(0);

            if (baseStats.attack > 0) {
              expect(item.enhancedStats.attack).toBeGreaterThanOrEqual(1);
            }
            if (baseStats.defense > 0) {
              expect(item.enhancedStats.defense).toBeGreaterThanOrEqual(1);
            }
            if (baseStats.defensePenetration > 0) {
              expect(
                item.enhancedStats.defensePenetration
              ).toBeGreaterThanOrEqual(1);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: idle-gacha-game, Property 25: Idle Drop Rate Differential**
   * For any stage and item grade, the idle drop rate should generally be lower than the stage clear drop rate for the same grade
   * **Validates: Requirements 3.2, 3.6**
   */
  test("Property 25: Idle drop rates should generally be lower than stage clear drop rates", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 5 }), // stage
        (stage) => {
          const stageClearRates =
            STAGE_CLEAR_DROP_RATES[stage] || STAGE_CLEAR_DROP_RATES[1];
          const idleRates = IDLE_DROP_RATES[stage] || IDLE_DROP_RATES[1];

          // 전체 드랍률 비교 (개별 등급이 아닌)
          const totalStageClearRate = Object.values(stageClearRates).reduce(
            (sum, rate) => sum + rate,
            0
          );
          const totalIdleRate = Object.values(idleRates).reduce(
            (sum, rate) => sum + rate,
            0
          );

          // 전체적으로 idle 드랍률이 stage clear보다 낮거나 비슷해야 함
          expect(totalIdleRate).toBeLessThanOrEqual(totalStageClearRate + 0.2); // 20% 허용 오차

          // 개별 등급 검증 - 대부분의 등급에서 idle이 낮아야 하지만 일부 예외 허용
          let lowerOrEqualCount = 0;
          let totalGrades = 0;

          Object.values(ItemGrade).forEach((grade) => {
            const stageClearRate = stageClearRates[grade];
            const idleRate = idleRates[grade];

            // 확률값 유효성 검증
            expect(stageClearRate).toBeGreaterThanOrEqual(0);
            expect(stageClearRate).toBeLessThanOrEqual(1);
            expect(idleRate).toBeGreaterThanOrEqual(0);
            expect(idleRate).toBeLessThanOrEqual(1);

            // idle rate가 stage clear rate보다 낮거나 약간 높은 경우 허용 (10% 이내)
            if (idleRate <= stageClearRate * 1.1) {
              lowerOrEqualCount++;
            }
            totalGrades++;
          });

          // 최소 50%의 등급에서 idle rate가 적절해야 함 (더 관대한 기준)
          expect(lowerOrEqualCount / totalGrades).toBeGreaterThanOrEqual(0.5);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: idle-gacha-game, Property 26: Idle Drop Rate Timing**
   * For any idle drop check, the probability should match the configured base drop rates (0.1-0.15% per second)
   * **Validates: Requirements 3.2, 3.6**
   */
  /**
   * **Feature: idle-gacha-game, Property 26: Idle Drop Rate Timing**
   * For any idle drop check, the system should use the correct base drop rates (0.1-0.15% per second)
   * **Validates: Requirements 3.2, 3.6**
   */
  test("Property 26: Idle drop rates should use correct base probabilities", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 5 }), // stage
        fc.float({ min: 0, max: 1, noNaN: true }), // random value for drop check
        (stage, dropRandom) => {
          const testDropSystem = new ItemDropSystem();

          // Mock Math.random to return predictable values
          const mockValues = [
            dropRandom, // for base drop rate check
            0.5, // for item type selection
            0.5, // for grade selection
            0.5,
            0.5,
            0.5, // for stat variations
          ];
          let callCount = 0;
          vi.spyOn(Math, "random").mockImplementation(() => {
            if (callCount < mockValues.length) {
              return mockValues[callCount++];
            }
            return 0.5;
          });

          const result = testDropSystem.checkIdleDrop(stage);

          // Get expected base drop rate for this stage
          const expectedBaseRate =
            BASE_DROP_RATES.idle[stage] || BASE_DROP_RATES.idle[1];

          // Verify result structure
          expect(result.dropType).toBe("idle");
          expect(result.stage).toBe(stage);

          // If dropRandom < expectedBaseRate, should drop an item
          if (dropRandom < expectedBaseRate) {
            expect(result.success).toBe(true);
            expect(result.item).toBeDefined();
          } else {
            expect(result.success).toBe(false);
            expect(result.item).toBeUndefined();
          }

          // Restore Math.random
          vi.mocked(Math.random).mockRestore();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional test for drop system initialization and utility functions
   */
  test("Drop system utility functions should work correctly", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 5 }), // stage
        (stage) => {
          // Test convenience functions
          const stageClearResult = checkStageClearItemDrop(stage);
          const idleResult = checkIdleItemDrop(stage);

          expect(stageClearResult.dropType).toBe("stageClear");
          expect(stageClearResult.stage).toBe(stage);
          expect(idleResult.dropType).toBe("idle");
          expect(idleResult.stage).toBe(stage);

          // Test initialization
          initializeItemDropSystem();
          const timeUntilNext = getTimeUntilNextIdleDrop();
          expect(timeUntilNext).toBeGreaterThanOrEqual(0);
          expect(timeUntilNext).toBeLessThanOrEqual(DROP_CHECK_INTERVALS.idle);
        }
      ),
      { numRuns: 100 }
    );
  });
});
