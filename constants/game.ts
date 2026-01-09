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

// Item grade multipliers for stat scaling (기존 방식 - 호환성 유지)
export const GRADE_MULTIPLIERS = {
  [ItemGrade.COMMON]: 1.0,
  [ItemGrade.RARE]: 1.5,
  [ItemGrade.EPIC]: 2.0,
  [ItemGrade.LEGENDARY]: 3.0,
  [ItemGrade.MYTHIC]: 4.5,
} as const;

// 등급별 고정 기본 스텟 (크리티컬과 추가타격 100% 목표로 조정)
export const GRADE_BASE_STATS = {
  [ItemGrade.COMMON]: {
    attack: 10,
    defense: 5,
    defensePenetration: 2,
    additionalAttackChance: 0.005, // 0.5% (0.01 → 0.005)
    creditPerSecondBonus: 1,
    criticalDamageMultiplier: 0.1,
    criticalChance: 0.01, // 1% (0.02 → 0.01)
  },
  [ItemGrade.RARE]: {
    attack: 30,
    defense: 15,
    defensePenetration: 6,
    additionalAttackChance: 0.015, // 1.5% (0.03 → 0.015)
    creditPerSecondBonus: 2,
    criticalDamageMultiplier: 0.2,
    criticalChance: 0.02, // 2% (0.04 → 0.02)
  },
  [ItemGrade.EPIC]: {
    attack: 60,
    defense: 30,
    defensePenetration: 12,
    additionalAttackChance: 0.03, // 3% (0.06 → 0.03)
    creditPerSecondBonus: 4,
    criticalDamageMultiplier: 0.4,
    criticalChance: 0.04, // 4% (0.06 → 0.04)
  },
  [ItemGrade.LEGENDARY]: {
    attack: 120,
    defense: 60,
    defensePenetration: 24,
    additionalAttackChance: 0.06, // 6% (0.12 → 0.06)
    creditPerSecondBonus: 8,
    criticalDamageMultiplier: 0.8,
    criticalChance: 0.08, // 8% (0.1 → 0.08)
  },
  [ItemGrade.MYTHIC]: {
    attack: 200,
    defense: 100,
    defensePenetration: 40,
    additionalAttackChance: 0.1, // 10% (0.2 → 0.1)
    creditPerSecondBonus: 15,
    criticalDamageMultiplier: 1.5,
    criticalChance: 0.16, // 16% (0.15 → 0.16)
  },
} as const;

// 랜덤 보너스 범위 (1~5 추가)
export const RANDOM_BONUS_RANGE = {
  min: 1,
  max: 5,
} as const;

// Item type base stats configuration
export const ITEM_BASE_STATS: Record<ItemType, ItemStats> = {
  // 방어구 (방어력)
  [ItemType.HELMET]: {
    attack: 0,
    defense: 5,
    defensePenetration: 0,
    additionalAttackChance: 0,
    creditPerSecondBonus: 0,
    criticalDamageMultiplier: 0,
    criticalChance: 0,
  },
  [ItemType.ARMOR]: {
    attack: 0,
    defense: 8,
    defensePenetration: 0,
    additionalAttackChance: 0,
    creditPerSecondBonus: 0,
    criticalDamageMultiplier: 0,
    criticalChance: 0,
  },
  [ItemType.PANTS]: {
    attack: 0,
    defense: 6,
    defensePenetration: 0,
    additionalAttackChance: 0,
    creditPerSecondBonus: 0,
    criticalDamageMultiplier: 0,
    criticalChance: 0,
  },

  // 방어구 (추가타격 확률) - 3부위 신화 25강 기준 100% 목표
  [ItemType.GLOVES]: {
    attack: 0,
    defense: 0,
    defensePenetration: 0,
    additionalAttackChance: 0.01, // 1% (0.02 → 0.01)
    creditPerSecondBonus: 0,
    criticalDamageMultiplier: 0,
    criticalChance: 0,
  },
  [ItemType.SHOES]: {
    attack: 0,
    defense: 0,
    defensePenetration: 0,
    additionalAttackChance: 0.008, // 0.8% (0.015 → 0.008)
    creditPerSecondBonus: 0,
    criticalDamageMultiplier: 0,
    criticalChance: 0,
  },
  [ItemType.SHOULDER]: {
    attack: 0,
    defense: 0,
    defensePenetration: 0,
    additionalAttackChance: 0.012, // 1.2% (0.025 → 0.012)
    creditPerSecondBonus: 0,
    criticalDamageMultiplier: 0,
    criticalChance: 0,
  },

  // 장신구 (방어력 무시)
  [ItemType.EARRING]: {
    attack: 0,
    defense: 0,
    defensePenetration: 3,
    additionalAttackChance: 0,
    creditPerSecondBonus: 0,
    criticalDamageMultiplier: 0,
    criticalChance: 0,
  },
  [ItemType.RING]: {
    attack: 0,
    defense: 0,
    defensePenetration: 2,
    additionalAttackChance: 0,
    creditPerSecondBonus: 0,
    criticalDamageMultiplier: 0,
    criticalChance: 0,
  },
  [ItemType.NECKLACE]: {
    attack: 0,
    defense: 0,
    defensePenetration: 4,
    additionalAttackChance: 0,
    creditPerSecondBonus: 0,
    criticalDamageMultiplier: 0,
    criticalChance: 0,
  },

  // 무기 (공격력)
  [ItemType.MAIN_WEAPON]: {
    attack: 10,
    defense: 0,
    defensePenetration: 0,
    additionalAttackChance: 0,
    creditPerSecondBonus: 0,
    criticalDamageMultiplier: 0,
    criticalChance: 0,
  },
  [ItemType.SUB_WEAPON]: {
    attack: 6,
    defense: 0,
    defensePenetration: 0,
    additionalAttackChance: 0,
    creditPerSecondBonus: 0,
    criticalDamageMultiplier: 0,
    criticalChance: 0,
  },

  // 펫 (공격력)
  [ItemType.PET]: {
    attack: 8,
    defense: 0,
    defensePenetration: 0,
    additionalAttackChance: 0,
    creditPerSecondBonus: 0,
    criticalDamageMultiplier: 0,
    criticalChance: 0,
  },

  // 물약들 (신화 25강 기준 100% 목표로 조정)
  [ItemType.WEALTH_POTION]: {
    attack: 0,
    defense: 0,
    defensePenetration: 0,
    additionalAttackChance: 0,
    creditPerSecondBonus: 2,
    criticalDamageMultiplier: 0,
    criticalChance: 0,
  },
  [ItemType.BOSS_POTION]: {
    attack: 0,
    defense: 0,
    defensePenetration: 0,
    additionalAttackChance: 0,
    creditPerSecondBonus: 0,
    criticalDamageMultiplier: 0.2,
    criticalChance: 0,
  },
  [ItemType.ARTISAN_POTION]: {
    attack: 0,
    defense: 0,
    defensePenetration: 0,
    additionalAttackChance: 0,
    creditPerSecondBonus: 0,
    criticalDamageMultiplier: 0,
    criticalChance: 0.016, // 1.6% (신화 25강 기준 100% 목표)
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

// Inheritance rates based on grade difference (강화 등급 전승용)
export const INHERITANCE_RATES = {
  1: 0.9, // 1등급 차이: 90% 성공률
  2: 0.7, // 2등급 차이: 70% 성공률
  3: 0.5, // 3등급 차이: 50% 성공률
  4: 0.3, // 4등급 차이: 30% 성공률
} as const;

// Enhancement level reduction for inheritance (등급 차이별 강화 등급 감소량)
export const ENHANCEMENT_LEVEL_REDUCTION = {
  1: 1, // 1등급 차이: -1 레벨
  2: 2, // 2등급 차이: -2 레벨
  3: 3, // 3등급 차이: -3 레벨
  4: 4, // 4등급 차이: -4 레벨
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
export const createDefaultItem = (type: ItemType, grade: ItemGrade): Item => {
  const baseStats = { ...ITEM_BASE_STATS[type] };
  const gradeBaseStats = GRADE_BASE_STATS[grade];

  // 기본 아이템은 랜덤 보너스 없이 등급 기본값만 적용
  const finalStats = {
    attack: baseStats.attack > 0 ? gradeBaseStats.attack : 0,
    defense: baseStats.defense > 0 ? gradeBaseStats.defense : 0,
    defensePenetration:
      baseStats.defensePenetration > 0 ? gradeBaseStats.defensePenetration : 0,
    additionalAttackChance:
      baseStats.additionalAttackChance > 0
        ? gradeBaseStats.additionalAttackChance
        : 0,
    creditPerSecondBonus:
      baseStats.creditPerSecondBonus > 0
        ? gradeBaseStats.creditPerSecondBonus
        : 0,
    criticalDamageMultiplier:
      baseStats.criticalDamageMultiplier > 0
        ? gradeBaseStats.criticalDamageMultiplier
        : 0,
    criticalChance:
      baseStats.criticalChance > 0 ? gradeBaseStats.criticalChance : 0,
  };

  return {
    id: `default-${type}-${Date.now()}-${Math.random()}`,
    type,
    grade,
    baseStats: finalStats, // 가챠 시스템과 동일하게 변경
    enhancedStats: { ...finalStats }, // 가챠 시스템과 동일하게 변경
    level: 1,
    enhancementLevel: 0,
    imagePath: getItemImagePath(type),
  };
};

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
  pet: null,
  // 물약 슬롯들은 기본적으로 비어있음
  wealthPotion: null,
  bossPotion: null,
  artisanPotion: null,
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
    creditPerSecondBonus: 0,
    criticalDamageMultiplier: 0,
    criticalChance: 0,
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
export const ITEM_TYPE_NAMES: Record<ItemType, string> = {
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
  [ItemType.PET]: "펫",
  [ItemType.WEALTH_POTION]: "재물 물약",
  [ItemType.BOSS_POTION]: "보스 물약",
  [ItemType.ARTISAN_POTION]: "장인 물약",
};

// Item grade names for UI (Korean)
export const GRADE_NAMES = {
  [ItemGrade.COMMON]: "일반",
  [ItemGrade.RARE]: "레어",
  [ItemGrade.EPIC]: "에픽",
  [ItemGrade.LEGENDARY]: "전설",
  [ItemGrade.MYTHIC]: "신화",
} as const;

// Player stat names for UI (Korean)
export const STAT_NAMES = {
  attack: "공격력",
  defense: "방어력",
  defensePenetration: "방어율 무시",
  additionalAttackChance: "추가타격 확률",
  creditPerSecondBonus: "초당 크레딧 보너스",
  criticalDamageMultiplier: "크리티컬 데미지",
  criticalChance: "크리티컬 확률",
} as const;

// Battle system constants
export const BATTLE_SETTINGS = {
  playerFirst: true, // 플레이어가 먼저 공격
  maxBattleRounds: 100, // 무한 루프 방지 (시뮬레이션용)
  autoAttackDelay: 1000, // 자동 공격 간격 (ms)
  maxAdditionalAttackChance: 1.0, // 최대 추가타격 확률 100% (0.5 → 1.0)
  // 스테이지별 턴 제한 (실제 전투용)
  baseTurnLimit: 30, // 기본 턴 제한
  turnLimitReduction: 0.1, // 스테이지당 턴 제한 감소율 (10%)
  minTurnLimit: 10, // 최소 턴 제한
} as const;

// Gacha system constants (균형 조정됨)
export const GACHA_COSTS = {
  [GachaCategory.ARMOR]: 800, // 방어구 가챠 (1000 -> 800으로 감소)
  [GachaCategory.ACCESSORIES]: 1200, // 장신구 가챠 (1500 -> 1200으로 감소)
  [GachaCategory.WEAPONS]: 1600, // 무기 가챠 (2000 -> 1600으로 감소)
  [GachaCategory.POTIONS]: 1000, // 물약 가챠 (새로 추가)
} as const;

// Gacha rates (모든 카테고리 동일) - 확률 조정 (합계 100%)
export const GACHA_RATES: DropRateTable = {
  [ItemGrade.COMMON]: 0.72, // 72%
  [ItemGrade.RARE]: 0.25, // 25%
  [ItemGrade.EPIC]: 0.0245, // 2.45%
  [ItemGrade.LEGENDARY]: 0.005, // 0.5%
  [ItemGrade.MYTHIC]: 0.0005, // 0.05%
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
  [GachaCategory.WEAPONS]: [
    ItemType.MAIN_WEAPON,
    ItemType.SUB_WEAPON,
    ItemType.PET,
  ],
  [GachaCategory.POTIONS]: [
    ItemType.WEALTH_POTION,
    ItemType.BOSS_POTION,
    ItemType.ARTISAN_POTION,
  ],
} as const;

// Gacha category names for UI (Korean)
export const GACHA_CATEGORY_NAMES = {
  [GachaCategory.ARMOR]: "방어구",
  [GachaCategory.ACCESSORIES]: "장신구",
  [GachaCategory.WEAPONS]: "무기",
  [GachaCategory.POTIONS]: "물약",
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
  [ItemType.PET]: "/Items/Pet.png",
  [ItemType.WEALTH_POTION]: "/Items/WealthPotion.png",
  [ItemType.BOSS_POTION]: "/Items/BossPotion.png",
  [ItemType.ARTISAN_POTION]: "/Items/ArtisanPotion.png",
} as const;

// Get item image path by item type
export const getItemImagePath = (itemType: ItemType): string => {
  return ITEM_IMAGE_PATHS[itemType] || "/Items/default.png";
};

// Create item with image path automatically set
export const createItemWithImage = (
  type: ItemType,
  grade: ItemGrade,
  baseStats?: ItemStats
): Item => {
  const itemBaseStats = baseStats || { ...ITEM_BASE_STATS[type] };
  const gradeBaseStats = GRADE_BASE_STATS[grade];

  // baseStats가 제공되지 않은 경우 등급별 기본값 사용
  const finalStats = baseStats || {
    attack: itemBaseStats.attack > 0 ? gradeBaseStats.attack : 0,
    defense: itemBaseStats.defense > 0 ? gradeBaseStats.defense : 0,
    defensePenetration:
      itemBaseStats.defensePenetration > 0
        ? gradeBaseStats.defensePenetration
        : 0,
    additionalAttackChance:
      itemBaseStats.additionalAttackChance > 0
        ? gradeBaseStats.additionalAttackChance
        : 0,
    creditPerSecondBonus:
      itemBaseStats.creditPerSecondBonus > 0
        ? gradeBaseStats.creditPerSecondBonus
        : 0,
    criticalDamageMultiplier:
      itemBaseStats.criticalDamageMultiplier > 0
        ? gradeBaseStats.criticalDamageMultiplier
        : 0,
    criticalChance:
      itemBaseStats.criticalChance > 0 ? gradeBaseStats.criticalChance : 0,
  };

  return {
    id: `item-${type}-${Date.now()}-${Math.random()}`,
    type,
    grade,
    baseStats: { ...finalStats }, // 가챠 시스템과 동일하게 변경
    enhancedStats: { ...finalStats }, // 가챠 시스템과 동일하게 변경
    level: 1,
    enhancementLevel: 0,
    imagePath: getItemImagePath(type),
  };
};
