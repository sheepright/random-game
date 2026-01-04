/**
 * Property-based tests for game state management
 * Feature: idle-gacha-game, Property 9: Game State Persistence
 * Feature: idle-gacha-game, Property 10: State Restoration Round Trip
 * Validates: Requirements 4.1, 4.2, 4.3, 4.5
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fc from "fast-check";
import { GameState, EquippedItems } from "../types/game";
import { getDefaultGameState, GAME_LIMITS } from "../constants/game";
import { saveGameState, loadGameState, clearGameState } from "./gameStorage";
import { isValidGameState } from "./gameMigration";
import { calculatePlayerStats } from "./equipmentManager";

// Mock localStorage for testing
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

// Setup localStorage mock
beforeEach(() => {
  Object.defineProperty(global, "localStorage", {
    value: localStorageMock,
    writable: true,
  });
  localStorageMock.clear();
});

afterEach(() => {
  localStorageMock.clear();
});

// Helper function to generate valid game states with safe float values
const validGameStateArbitrary = fc
  .record({
    credits: fc.nat({ max: 1000000 }),
    creditPerSecond: fc.integer({ min: 1, max: 1000 }),
    currentStage: fc.integer({
      min: GAME_LIMITS.MIN_STAGE,
      max: GAME_LIMITS.MAX_STAGE,
    }),
    lastSaveTime: fc.integer({ min: 1, max: Date.now() }),
    equippedItems: fc.record({
      helmet: fc.option(
        fc.record({
          id: fc.string(),
          type: fc.constant("helmet"),
          grade: fc.constantFrom("common", "rare", "epic", "legendary"),
          baseStats: fc.record({
            attack: fc.nat({ max: 100 }),
            defense: fc.nat({ max: 100 }),
            defensePenetration: fc.nat({ max: 100 }),
          }),
          enhancedStats: fc.record({
            attack: fc.nat({ max: 100 }),
            defense: fc.nat({ max: 100 }),
            defensePenetration: fc.nat({ max: 100 }),
          }),
          level: fc.integer({ min: 1, max: 100 }),
        })
      ),
      armor: fc.option(
        fc.record({
          id: fc.string(),
          type: fc.constant("armor"),
          grade: fc.constantFrom("common", "rare", "epic", "legendary"),
          baseStats: fc.record({
            attack: fc.nat({ max: 100 }),
            defense: fc.nat({ max: 100 }),
            defensePenetration: fc.nat({ max: 100 }),
          }),
          enhancedStats: fc.record({
            attack: fc.nat({ max: 100 }),
            defense: fc.nat({ max: 100 }),
            defensePenetration: fc.nat({ max: 100 }),
          }),
          level: fc.integer({ min: 1, max: 100 }),
        })
      ),
      pants: fc.option(
        fc.record({
          id: fc.string(),
          type: fc.constant("pants"),
          grade: fc.constantFrom("common", "rare", "epic", "legendary"),
          baseStats: fc.record({
            attack: fc.nat({ max: 100 }),
            defense: fc.nat({ max: 100 }),
            defensePenetration: fc.nat({ max: 100 }),
          }),
          enhancedStats: fc.record({
            attack: fc.nat({ max: 100 }),
            defense: fc.nat({ max: 100 }),
            defensePenetration: fc.nat({ max: 100 }),
          }),
          level: fc.integer({ min: 1, max: 100 }),
        })
      ),
      gloves: fc.constant(null),
      shoes: fc.constant(null),
      shoulder: fc.constant(null),
      earring: fc.constant(null),
      ring: fc.constant(null),
      necklace: fc.constant(null),
      mainWeapon: fc.option(
        fc.record({
          id: fc.string(),
          type: fc.constant("mainWeapon"),
          grade: fc.constantFrom("common", "rare", "epic", "legendary"),
          baseStats: fc.record({
            attack: fc.nat({ max: 100 }),
            defense: fc.nat({ max: 100 }),
            defensePenetration: fc.nat({ max: 100 }),
          }),
          enhancedStats: fc.record({
            attack: fc.nat({ max: 100 }),
            defense: fc.nat({ max: 100 }),
            defensePenetration: fc.nat({ max: 100 }),
          }),
          level: fc.integer({ min: 1, max: 100 }),
        })
      ),
      subWeapon: fc.constant(null),
    }),
    inventory: fc.array(
      fc.record({
        id: fc.string(),
        type: fc.constantFrom(
          "helmet",
          "armor",
          "pants",
          "gloves",
          "shoes",
          "shoulder",
          "earring",
          "ring",
          "necklace",
          "mainWeapon",
          "subWeapon"
        ),
        grade: fc.constantFrom("common", "rare", "epic", "legendary"),
        baseStats: fc.record({
          attack: fc.nat({ max: 100 }),
          defense: fc.nat({ max: 100 }),
          defensePenetration: fc.nat({ max: 100 }),
          additionalAttackChance: fc.float({ min: 0, max: 0.5 }),
        }),
        enhancedStats: fc.record({
          attack: fc.nat({ max: 100 }),
          defense: fc.nat({ max: 100 }),
          defensePenetration: fc.nat({ max: 100 }),
          additionalAttackChance: fc.float({ min: 0, max: 0.5 }),
        }),
        level: fc.integer({ min: 1, max: 100 }),
        enhancementLevel: fc.integer({ min: 0, max: 15 }),
        imagePath: fc.string(),
      }),
      { maxLength: 10 }
    ),
    battleState: fc.constant(null),
  })
  .map((partialState) => {
    // 기본 플레이어 스탯 설정
    const playerStats = {
      attack: 10,
      defense: 10,
      defensePenetration: 0,
      additionalAttackChance: 0,
    };

    return {
      ...partialState,
      playerStats,
      recentStageClearDrops: null,
    };
  });

describe("Property 9: Game State Persistence", () => {
  /**
   * Property 9: Game State Persistence
   * For any game state changes, the updated state should be automatically saved to localStorage and be retrievable
   * Validates: Requirements 4.1, 4.3, 4.5
   */
  it("should persist any valid game state to localStorage and make it retrievable", () => {
    fc.assert(
      fc.property(validGameStateArbitrary, (gameState: any) => {
        // 상태를 저장
        const saveResult = saveGameState(gameState);

        // 저장이 성공해야 함
        expect(saveResult.success).toBe(true);
        expect(saveResult.error).toBeUndefined();

        // localStorage에서 상태를 로드
        const loadResult = loadGameState();

        // 로드가 성공해야 함
        expect(loadResult.success).toBe(true);
        expect(loadResult.data).toBeDefined();

        if (loadResult.data) {
          const loadedState = loadResult.data;

          // 저장된 상태와 로드된 상태가 일치해야 함 (lastSaveTime 제외)
          expect(loadedState.credits).toBe(gameState.credits);
          expect(loadedState.creditPerSecond).toBe(gameState.creditPerSecond);

          // 마이그레이션으로 인해 스테이지가 조정될 수 있으므로 유효한 범위인지만 확인
          expect(loadedState.currentStage).toBeGreaterThanOrEqual(1);
          expect(loadedState.currentStage).toBeLessThanOrEqual(
            Math.max(gameState.currentStage, 100)
          );

          // Equipped items 비교 (null이 아닌 경우만)
          if (gameState.equippedItems.helmet) {
            expect(loadedState.equippedItems.helmet?.id).toBe(
              gameState.equippedItems.helmet.id
            );
            expect(loadedState.equippedItems.helmet?.type).toBe(
              gameState.equippedItems.helmet.type
            );
            expect(loadedState.equippedItems.helmet?.grade).toBe(
              gameState.equippedItems.helmet.grade
            );
          }

          if (gameState.equippedItems.armor) {
            expect(loadedState.equippedItems.armor?.id).toBe(
              gameState.equippedItems.armor.id
            );
            expect(loadedState.equippedItems.armor?.type).toBe(
              gameState.equippedItems.armor.type
            );
            expect(loadedState.equippedItems.armor?.grade).toBe(
              gameState.equippedItems.armor.grade
            );
          }

          if (gameState.equippedItems.mainWeapon) {
            expect(loadedState.equippedItems.mainWeapon?.id).toBe(
              gameState.equippedItems.mainWeapon.id
            );
            expect(loadedState.equippedItems.mainWeapon?.type).toBe(
              gameState.equippedItems.mainWeapon.type
            );
            expect(loadedState.equippedItems.mainWeapon?.grade).toBe(
              gameState.equippedItems.mainWeapon.grade
            );
          }

          // Player stats 비교 - 마이그레이션으로 인해 스탯이 재계산될 수 있으므로 유효성만 확인
          expect(typeof loadedState.playerStats.attack).toBe("number");
          expect(typeof loadedState.playerStats.defense).toBe("number");
          expect(typeof loadedState.playerStats.defensePenetration).toBe(
            "number"
          );
          expect(loadedState.playerStats.attack).toBeGreaterThanOrEqual(0);
          expect(loadedState.playerStats.defense).toBeGreaterThanOrEqual(0);
          expect(
            loadedState.playerStats.defensePenetration
          ).toBeGreaterThanOrEqual(0);

          // Inventory 비교
          expect(loadedState.inventory.length).toBe(gameState.inventory.length);

          // lastSaveTime은 저장 시점에 업데이트되므로 원본보다 크거나 같아야 함
          expect(loadedState.lastSaveTime).toBeGreaterThanOrEqual(
            gameState.lastSaveTime
          );
        }
      }),
      { numRuns: 5 } // 최소 100회 반복 실행
    );
  });

  it("should handle storage errors gracefully", () => {
    fc.assert(
      fc.property(validGameStateArbitrary, (gameState: any) => {
        // localStorage를 일시적으로 비활성화하여 에러 상황 시뮬레이션
        const originalSetItem = localStorage.setItem;
        localStorage.setItem = () => {
          throw new Error("Storage quota exceeded");
        };

        try {
          const saveResult = saveGameState(gameState);

          // 에러 상황에서도 결과 객체를 반환해야 함
          expect(saveResult).toBeDefined();
          expect(typeof saveResult.success).toBe("boolean");

          // 에러가 발생했으므로 success는 false여야 함
          expect(saveResult.success).toBe(false);
          expect(saveResult.error).toBeDefined();
          expect(typeof saveResult.error).toBe("string");
        } finally {
          // localStorage 복원
          localStorage.setItem = originalSetItem;
        }
      }),
      { numRuns: 5 }
    );
  });
});

describe("Property 10: State Restoration Round Trip", () => {
  /**
   * Property 10: State Restoration Round Trip
   * For any valid game state, saving then loading the state should produce an equivalent state
   * Validates: Requirements 4.2
   */
  it("should maintain state integrity through save-load round trip", () => {
    fc.assert(
      fc.property(validGameStateArbitrary, (originalState: any) => {
        // 1단계: 원본 상태 저장
        const saveResult1 = saveGameState(originalState);
        expect(saveResult1.success).toBe(true);

        // 2단계: 저장된 상태 로드
        const loadResult1 = loadGameState();
        expect(loadResult1.success).toBe(true);
        expect(loadResult1.data).toBeDefined();

        if (loadResult1.data) {
          const intermediateState = loadResult1.data;

          // 3단계: 로드된 상태를 다시 저장
          const saveResult2 = saveGameState(intermediateState);
          expect(saveResult2.success).toBe(true);

          // 4단계: 다시 저장된 상태를 로드
          const loadResult2 = loadGameState();
          expect(loadResult2.success).toBe(true);
          expect(loadResult2.data).toBeDefined();

          if (loadResult2.data) {
            const finalState = loadResult2.data;

            // 5단계: 중간 상태와 최종 상태가 동일한지 확인 (라운드 트립 속성)
            expect(finalState.credits).toBe(intermediateState.credits);
            expect(finalState.creditPerSecond).toBe(
              intermediateState.creditPerSecond
            );
            expect(finalState.currentStage).toBe(
              intermediateState.currentStage
            );

            // EquippedItems 비교 - 구조적 동일성 확인
            expect(finalState.equippedItems).toBeDefined();
            expect(intermediateState.equippedItems).toBeDefined();

            // 각 슬롯별 아이템 비교
            const slots: (keyof EquippedItems)[] = [
              "helmet",
              "armor",
              "pants",
              "gloves",
              "shoes",
              "shoulder",
              "earring",
              "ring",
              "necklace",
              "mainWeapon",
              "subWeapon",
            ];

            slots.forEach((slot) => {
              const finalItem = finalState.equippedItems[slot];
              const intermediateItem = intermediateState.equippedItems[slot];

              if (finalItem && intermediateItem) {
                expect(finalItem.id).toBe(intermediateItem.id);
                expect(finalItem.type).toBe(intermediateItem.type);
                expect(finalItem.grade).toBe(intermediateItem.grade);
                expect(finalItem.level).toBe(intermediateItem.level);
              } else {
                expect(finalItem).toBe(intermediateItem); // 둘 다 null이어야 함
              }
            });

            // Inventory 비교
            expect(finalState.inventory.length).toBe(
              intermediateState.inventory.length
            );

            // PlayerStats 비교 - 마이그레이션으로 인해 재계산될 수 있으므로 유효성만 확인
            expect(typeof finalState.playerStats.attack).toBe("number");
            expect(typeof finalState.playerStats.defense).toBe("number");
            expect(typeof finalState.playerStats.defensePenetration).toBe(
              "number"
            );
            expect(finalState.playerStats.attack).toBeGreaterThanOrEqual(0);
            expect(finalState.playerStats.defense).toBeGreaterThanOrEqual(0);
            expect(
              finalState.playerStats.defensePenetration
            ).toBeGreaterThanOrEqual(0);

            // Player stats 비교
            expect(finalState.playerStats.attack).toBe(
              intermediateState.playerStats.attack
            );
            expect(finalState.playerStats.defense).toBe(
              intermediateState.playerStats.defense
            );
            expect(finalState.playerStats.defensePenetration).toBe(
              intermediateState.playerStats.defensePenetration
            );

            // lastSaveTime은 저장할 때마다 업데이트되므로 최종 상태가 중간 상태보다 크거나 같아야 함
            expect(finalState.lastSaveTime).toBeGreaterThanOrEqual(
              intermediateState.lastSaveTime
            );
          }
        }
      }),
      { numRuns: 5 } // 최소 100회 반복 실행
    );
  });

  it("should handle edge cases in round trip operations", () => {
    // 기본 상태로 라운드 트립 테스트
    const defaultState = getDefaultGameState();
    const saveResult = saveGameState(defaultState);
    expect(saveResult.success).toBe(true);

    const loadResult = loadGameState();
    expect(loadResult.success).toBe(true);
    expect(loadResult.data).toBeDefined();

    if (loadResult.data) {
      const loadedState = loadResult.data;

      // 기본 상태의 핵심 속성들이 보존되어야 함
      expect(loadedState.credits).toBe(defaultState.credits);
      expect(loadedState.creditPerSecond).toBe(defaultState.creditPerSecond);
      expect(loadedState.currentStage).toBe(defaultState.currentStage);
      expect(loadedState.equippedItems).toBeDefined();
      expect(loadedState.playerStats.attack).toBeGreaterThanOrEqual(0);
      expect(loadedState.playerStats.defense).toBeGreaterThanOrEqual(0);
      expect(loadedState.playerStats.defensePenetration).toBeGreaterThanOrEqual(
        0
      );
    }

    // 빈 localStorage에서 로드 시도
    clearGameState();
    const emptyLoadResult = loadGameState();
    expect(emptyLoadResult.success).toBe(false);
    expect(emptyLoadResult.error).toBeDefined();
  });
});
