/**
 * Game constants and configuration values
 * Based on requirements 2.1, 2.2, 2.3, 4.1, 4.2, and 6.1
 */

import {
  GameState,
  StageInfo,
  Item,
  ItemType,
  ItemGrade,
  ItemStats,
  EquippedItems,
  DropRateTable,
  BossInfo,
  GachaCategory,
} from "../types/game";
import { generateAllStages } from "../utils/stageGenerator";

// Storage configuration
export const STORAGE_KEY = "idle-gacha-game-state";

// Game timing constants
export const CREDIT_GENERATION_INTERVAL = 1000; // 1 second in milliseconds
export const BASE_CREDIT_PER_SECOND = 1;
export const MAX_OFFLINE_HOURS = 24;

// Item grade multipliers for stat scaling
export const GRADE_MULTIPLIERS = {
  [ItemGrade.COMMON]: 1.0,
  [ItemGrade.RARE]: 1.5,
  [ItemGrade.EPIC]: 2.0,
  [ItemGrade.LEGENDARY]: 3.0,
} as const;

// Item type base stats configuration
export const ITEM_BASE_STATS: Record<ItemType, ItemStats> = {
  // 방어구 (방어력)
  [ItemType.HELMET]: {
    attack: 0,
    defense: 5,
    defensePenetration: 0,
    additionalAttackChance: 0,
  },
  [ItemType.ARMOR]: {
    attack: 0,
    defense: 8,
    defensePenetration: 0,
    additionalAttackChance: 0,
  },
  [ItemType.PANTS]: {
    attack: 0,
    defense: 6,
    defensePenetration: 0,
    additionalAttackChance: 0,
  },

  // 방어구 (추가타격 확률)
  [ItemType.GLOVES]: {
    attack: 0,
    defense: 0,
    defensePenetration: 0,
    additionalAttackChance: 0.02,
  }, // 2%
  [ItemType.SHOES]: {
    attack: 0,
    defense: 0,
    defensePenetration: 0,
    additionalAttackChance: 0.015,
  }, // 1.5%
  [ItemType.SHOULDER]: {
    attack: 0,
    defense: 0,
    defensePenetration: 0,
    additionalAttackChance: 0.025,
  }, // 2.5%

  // 장신구 (방어력 무시)
  [ItemType.EARRING]: {
    attack: 0,
    defense: 0,
    defensePenetration: 3,
    additionalAttackChance: 0,
  },
  [ItemType.RING]: {
    attack: 0,
    defense: 0,
    defensePenetration: 2,
    additionalAttackChance: 0,
  },
  [ItemType.NECKLACE]: {
    attack: 0,
    defense: 0,
    defensePenetration: 4,
    additionalAttackChance: 0,
  },

  // 무기 (공격력)
  [ItemType.MAIN_WEAPON]: {
    attack: 10,
    defense: 0,
    defensePenetration: 0,
    additionalAttackChance: 0,
  },
  [ItemType.SUB_WEAPON]: {
    attack: 6,
    defense: 0,
    defensePenetration: 0,
    additionalAttackChance: 0,
  },
} as const;

// Generate all 100 stages using the stage generator
const ALL_STAGES = generateAllStages();

// Extract drop rates and boss info from generated stages
export const STAGE_CLEAR_DROP_RATES: Record<number, DropRateTable> = {};
export const IDLE_DROP_RATES: Record<number, DropRateTable> = {};
export const BOSS_INFO: Record<number, BossInfo> = {};

// Populate the extracted data
for (let stage = 1; stage <= 100; stage++) {
  const stageInfo = ALL_STAGES[stage];
  if (stageInfo) {
    STAGE_CLEAR_DROP_RATES[stage] = stageInfo.stageClearDropRates;
    IDLE_DROP_RATES[stage] = stageInfo.idleDropRates;
    BOSS_INFO[stage] = stageInfo.boss;
  }
}

// Inheritance rates based on grade difference
export const INHERITANCE_RATES = {
  1: 0.8, // 1등급 차이: 80% 계승
  2: 0.6, // 2등급 차이: 60% 계승
  3: 0.4, // 3등급 차이: 40% 계승
} as const;

// Drop check intervals
export const DROP_CHECK_INTERVALS = {
  stageClear: 1, // 스테이지 클리어 시 즉시
  idle: 1000, // 잠수 중 1초마다 체크 (ms)
} as const;

// Base drop rates (before grade distribution) - now dynamically calculated
export const BASE_DROP_RATES = {
  stageClear: (() => {
    const rates: Record<number, number> = {};
    for (let stage = 1; stage <= 100; stage++) {
      rates[stage] = 1.0; // 100% 확정 드랍
    }
    return rates;
  })(),
  idle: (() => {
    const rates: Record<number, number> = {};
    for (let stage = 1; stage <= 100; stage++) {
      const baseRate = 0.001; // 0.1%
      const maxRate = 0.002; // 0.2%
      const growth = (maxRate - baseRate) / 99;
      rates[stage] = baseRate + growth * (stage - 1);
    }
    return rates;
  })(),
} as const;

// Boss information for each stage - now removed (generated dynamically above)

// Default starting equipment (helmet, armor, pants, main weapon only)
export const createDefaultItem = (type: ItemType, grade: ItemGrade): Item => ({
  id: `default-${type}-${Date.now()}-${Math.random()}`,
  type,
  grade,
  baseStats: { ...ITEM_BASE_STATS[type] },
  enhancedStats: { ...ITEM_BASE_STATS[type] },
  level: 1,
  enhancementLevel: 0,
  imagePath: getItemImagePath(type),
});

// Default equipped items configuration (lazy initialization to avoid circular dependency)
export const getDefaultEquippedItems = (): EquippedItems => ({
  helmet: createDefaultItem(ItemType.HELMET, ItemGrade.COMMON),
  armor: createDefaultItem(ItemType.ARMOR, ItemGrade.COMMON),
  pants: createDefaultItem(ItemType.PANTS, ItemGrade.COMMON),
  gloves: null,
  shoes: null,
  shoulder: null,
  earring: null,
  ring: null,
  necklace: null,
  mainWeapon: createDefaultItem(ItemType.MAIN_WEAPON, ItemGrade.COMMON),
  subWeapon: null,
});

// Default game state with new item system (lazy initialization)
export const getDefaultGameState = (): GameState => ({
  credits: 0,
  creditPerSecond: BASE_CREDIT_PER_SECOND,
  currentStage: 1,
  lastSaveTime: Date.now(),
  equippedItems: getDefaultEquippedItems(),
  inventory: [],
  playerStats: {
    attack: 10,
    defense: 10,
    defensePenetration: 0,
    additionalAttackChance: 0,
  },
  battleState: null,
  recentStageClearDrops: null,
});

// Stage requirements and rewards with new structure - now using generated data
export const STAGE_REQUIREMENTS: Record<number, StageInfo> = ALL_STAGES;

// Game limits and constraints
export const GAME_LIMITS = {
  MAX_CREDITS: Number.MAX_SAFE_INTEGER,
  MAX_EQUIPMENT_LEVEL: 1000,
  MAX_STAGE: 100, // 100 스테이지로 확장
  MIN_STAGE: 1,
  MAX_INVENTORY_SIZE: 100,
} as const;

// Item type names for UI (Korean)
export const ITEM_TYPE_NAMES = {
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
} as const;

// Item grade names for UI (Korean)
export const GRADE_NAMES = {
  [ItemGrade.COMMON]: "일반",
  [ItemGrade.RARE]: "레어",
  [ItemGrade.EPIC]: "에픽",
  [ItemGrade.LEGENDARY]: "전설",
} as const;

// Player stat names for UI (Korean)
export const STAT_NAMES = {
  attack: "공격력",
  defense: "방어력",
  defensePenetration: "방어율 무시",
  additionalAttackChance: "추가타격 확률",
} as const;

// Battle system constants
export const BATTLE_SETTINGS = {
  playerFirst: true, // 플레이어가 먼저 공격
  maxBattleRounds: 100, // 무한 루프 방지
  autoAttackDelay: 1000, // 자동 공격 간격 (ms)
  maxAdditionalAttackChance: 0.5, // 최대 추가타격 확률 50%
} as const;

// Gacha system constants (균형 조정됨)
export const GACHA_COSTS = {
  [GachaCategory.ARMOR]: 800, // 방어구 가챠 (1000 -> 800으로 감소)
  [GachaCategory.ACCESSORIES]: 1200, // 장신구 가챠 (1500 -> 1200으로 감소)
  [GachaCategory.WEAPONS]: 1600, // 무기 가챠 (2000 -> 1600으로 감소)
} as const;

// Gacha rates (모든 카테고리 동일)
export const GACHA_RATES: DropRateTable = {
  [ItemGrade.COMMON]: 0.8, // 80%
  [ItemGrade.RARE]: 0.18, // 18%
  [ItemGrade.EPIC]: 0.025, // 2.5%
  [ItemGrade.LEGENDARY]: 0.005, // 0.5%
} as const;

// Gacha category item types
export const GACHA_ITEM_TYPES = {
  [GachaCategory.ARMOR]: [
    ItemType.HELMET,
    ItemType.ARMOR,
    ItemType.PANTS,
    ItemType.GLOVES,
    ItemType.SHOES,
    ItemType.SHOULDER,
  ],
  [GachaCategory.ACCESSORIES]: [
    ItemType.EARRING,
    ItemType.RING,
    ItemType.NECKLACE,
  ],
  [GachaCategory.WEAPONS]: [ItemType.MAIN_WEAPON, ItemType.SUB_WEAPON],
} as const;

// Gacha category names for UI (Korean)
export const GACHA_CATEGORY_NAMES = {
  [GachaCategory.ARMOR]: "방어구",
  [GachaCategory.ACCESSORIES]: "장신구",
  [GachaCategory.WEAPONS]: "무기",
} as const;

// Item type image paths mapping
export const ITEM_IMAGE_PATHS = {
  [ItemType.HELMET]: "/Items/Helmets.png",
  [ItemType.ARMOR]: "/Items/Armor.png",
  [ItemType.PANTS]: "/Items/Pants.png",
  [ItemType.GLOVES]: "/Items/Gloves.png",
  [ItemType.SHOES]: "/Items/Shoes.png",
  [ItemType.SHOULDER]: "/Items/Shoulder.png",
  [ItemType.EARRING]: "/Items/Earrings.png",
  [ItemType.RING]: "/Items/Ring.png",
  [ItemType.NECKLACE]: "/Items/Necklace.png",
  [ItemType.MAIN_WEAPON]: "/Items/Weapon.png",
  [ItemType.SUB_WEAPON]: "/Items/SubWeapon.png",
} as const;

// Get item image path by item type
export const getItemImagePath = (itemType: ItemType): string => {
  return ITEM_IMAGE_PATHS[itemType] || "/Items/default.png";
};

// Create item with image path automatically set
export const createItemWithImage = (
  type: ItemType,
  grade: ItemGrade,
  baseStats: ItemStats
): Item => {
  return {
    id: `item-${type}-${Date.now()}-${Math.random()}`,
    type,
    grade,
    baseStats: { ...baseStats },
    enhancedStats: { ...baseStats },
    level: 1,
    enhancementLevel: 0,
    imagePath: getItemImagePath(type),
  };
};
