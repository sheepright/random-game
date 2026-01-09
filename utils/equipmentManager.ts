/**
 * Equipment management utilities
 * 새로운 11개 슬롯 장비 시스템 구현
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.9
 */

import { PlayerStats, Item, ItemType, EquippedItems } from "../types/game";

/**
 * 아이템 장착 결과 인터페이스
 */
export interface EquipResult {
  success: boolean;
  previousItem?: Item | null;
  error?: string;
}

/**
 * 아이템 해제 결과 인터페이스
 */
export interface UnequipResult {
  success: boolean;
  unequippedItem?: Item;
  error?: string;
}

/**
 * 아이템을 장비 슬롯에 장착
 * Requirements: 2.1, 2.2, 2.3 - 아이템 장착 시스템
 */
export function equipItem(
  item: Item,
  currentEquippedItems: EquippedItems
): EquipResult {
  try {
    const slotKey = item.type as keyof EquippedItems;
    const previousItem = currentEquippedItems[slotKey];

    return {
      success: true,
      previousItem,
    };
  } catch (error) {
    return {
      success: false,
      error: `아이템 장착 실패: ${error}`,
    };
  }
}

/**
 * 장비 슬롯에서 아이템 해제
 * Requirements: 2.1, 2.2, 2.3 - 아이템 해제 시스템
 */
export function unequipItem(
  itemType: ItemType,
  currentEquippedItems: EquippedItems
): UnequipResult {
  try {
    const slotKey = itemType as keyof EquippedItems;
    const unequippedItem = currentEquippedItems[slotKey];

    if (!unequippedItem) {
      return {
        success: false,
        error: "해제할 아이템이 없습니다",
      };
    }

    return {
      success: true,
      unequippedItem,
    };
  } catch (error) {
    return {
      success: false,
      error: `아이템 해제 실패: ${error}`,
    };
  }
}

/**
 * 장착된 아이템들을 기반으로 플레이어 스탯 계산
 * Requirements: 2.4, 2.5, 2.6, 2.7 - 장착된 아이템 기반 스탯 계산
 */
export function calculatePlayerStatsFromEquipment(
  equippedItems: EquippedItems
): PlayerStats {
  if (!equippedItems) {
    return {
      attack: 0,
      defense: 0,
      defensePenetration: 0,
      additionalAttackChance: 0,
      creditPerSecondBonus: 0,
      criticalDamageMultiplier: 0,
      criticalChance: 0,
    };
  }

  const stats: PlayerStats = {
    attack: 0,
    defense: 0,
    defensePenetration: 0,
    additionalAttackChance: 0,
    creditPerSecondBonus: 0,
    criticalDamageMultiplier: 0,
    criticalChance: 0,
  };

  // 모든 장착된 아이템의 스탯을 합산
  Object.values(equippedItems).forEach((item) => {
    if (item) {
      stats.attack += item.enhancedStats.attack;
      stats.defense += item.enhancedStats.defense;
      stats.defensePenetration += item.enhancedStats.defensePenetration;
      stats.additionalAttackChance += item.enhancedStats.additionalAttackChance;
      stats.creditPerSecondBonus += item.enhancedStats.creditPerSecondBonus;
      stats.criticalDamageMultiplier +=
        item.enhancedStats.criticalDamageMultiplier;
      stats.criticalChance += item.enhancedStats.criticalChance;
    }
  });

  return stats;
}

/**
 * 플레이어 스탯 계산 (별칭)
 * Requirements: 2.4, 2.5, 2.6, 2.7 - 장착된 아이템 기반 스탯 계산
 */
export const calculatePlayerStats = calculatePlayerStatsFromEquipment;
