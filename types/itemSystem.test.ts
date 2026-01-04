/**
 * Property-based tests for the new item system types
 * Tests Property 24: Starting Equipment Configuration
 * Based on requirements 2.8
 */

import { describe, test, expect } from "vitest";
import * as fc from "fast-check";
import { ItemType, ItemGrade } from "../types/game";
import { getDefaultEquippedItems, createDefaultItem } from "../constants/game";

describe("Property 24: Starting Equipment Configuration", () => {
  /**
   * **Feature: idle-gacha-game, Property 24: Starting Equipment Configuration**
   * For any new game initialization, only helmet, armor, pants, and main weapon should be equipped
   * **Validates: Requirements 2.8**
   */
  test("should have only helmet, armor, pants, and main weapon equipped at start", () => {
    fc.assert(
      fc.property(fc.constant(getDefaultEquippedItems()), (equippedItems) => {
        // Check that required starting items are equipped
        expect(equippedItems.helmet).not.toBeNull();
        expect(equippedItems.armor).not.toBeNull();
        expect(equippedItems.pants).not.toBeNull();
        expect(equippedItems.mainWeapon).not.toBeNull();

        // Check that optional items are not equipped
        expect(equippedItems.gloves).toBeNull();
        expect(equippedItems.shoes).toBeNull();
        expect(equippedItems.shoulder).toBeNull();
        expect(equippedItems.earring).toBeNull();
        expect(equippedItems.ring).toBeNull();
        expect(equippedItems.necklace).toBeNull();
        expect(equippedItems.subWeapon).toBeNull();

        // Verify equipped items have correct types
        expect(equippedItems.helmet?.type).toBe(ItemType.HELMET);
        expect(equippedItems.armor?.type).toBe(ItemType.ARMOR);
        expect(equippedItems.pants?.type).toBe(ItemType.PANTS);
        expect(equippedItems.mainWeapon?.type).toBe(ItemType.MAIN_WEAPON);

        // Verify equipped items are common grade
        expect(equippedItems.helmet?.grade).toBe(ItemGrade.COMMON);
        expect(equippedItems.armor?.grade).toBe(ItemGrade.COMMON);
        expect(equippedItems.pants?.grade).toBe(ItemGrade.COMMON);
        expect(equippedItems.mainWeapon?.grade).toBe(ItemGrade.COMMON);
      }),
      { numRuns: 100 }
    );
  });

  test("createDefaultItem should generate valid items", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...Object.values(ItemType)),
        fc.constantFrom(...Object.values(ItemGrade)),
        (itemType, itemGrade) => {
          const item = createDefaultItem(itemType, itemGrade);

          // Verify item structure
          expect(item.id).toBeDefined();
          expect(typeof item.id).toBe("string");
          expect(item.type).toBe(itemType);
          expect(item.grade).toBe(itemGrade);
          expect(item.level).toBe(1);

          // Verify stats are defined
          expect(typeof item.baseStats.attack).toBe("number");
          expect(typeof item.baseStats.defense).toBe("number");
          expect(typeof item.baseStats.defensePenetration).toBe("number");

          expect(typeof item.enhancedStats.attack).toBe("number");
          expect(typeof item.enhancedStats.defense).toBe("number");
          expect(typeof item.enhancedStats.defensePenetration).toBe("number");

          // Base stats and enhanced stats should be equal for new items
          expect(item.baseStats.attack).toBe(item.enhancedStats.attack);
          expect(item.baseStats.defense).toBe(item.enhancedStats.defense);
          expect(item.baseStats.defensePenetration).toBe(
            item.enhancedStats.defensePenetration
          );

          // Stats should be non-negative
          expect(item.baseStats.attack).toBeGreaterThanOrEqual(0);
          expect(item.baseStats.defense).toBeGreaterThanOrEqual(0);
          expect(item.baseStats.defensePenetration).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});
