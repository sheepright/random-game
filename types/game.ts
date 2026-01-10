/**
 * Core game type definitions for the Idle Gacha Game
 * Based on requirements 2.1, 2.2, 2.3, 4.1, 4.2, and 6.1
 */

export interface GameState {
  credits: number;
  creditPerSecond: number;
  currentStage: number;
  lastSaveTime: number;
  equippedItems: EquippedItems;
  inventory: Item[];
  playerStats: PlayerStats;
  battleState: BattleState | null;
  recentStageClearDrops: {
    items: Item[];
    stageNumber: number;
    creditReward: number;
    timestamp: number;
  } | null;
  isGameComplete?: boolean; // 게임 완료 상태 추가
}

export interface BattleState {
  boss: Boss;
  playerHP: number;
  bossHP: number;
  isPlayerTurn: boolean;
  battleLog: BattleLogEntry[];
  battleResult: "ongoing" | "victory" | "defeat" | "timeout" | null;
  // 턴 제한 시스템
  currentTurn: number;
  maxTurns: number;
}

export interface Boss {
  id: string;
  name: string;
  stage: number;
  maxHP: number;
  currentHP: number;
  attack: number;
  defense: number;
  image?: string;
}

export interface BattleLogEntry {
  id: string;
  timestamp: number;
  type: "player_attack" | "boss_attack" | "battle_start" | "battle_end";
  damage?: number;
  message: string;
}

export interface EquippedItems {
  helmet: Item | null;
  armor: Item | null;
  pants: Item | null;
  gloves: Item | null;
  shoes: Item | null;
  shoulder: Item | null;
  earring: Item | null;
  ring: Item | null;
  necklace: Item | null;
  mainWeapon: Item | null;
  subWeapon: Item | null;
  pet: Item | null;
  // 물약 슬롯들
  wealthPotion: Item | null; // 재물 물약
  bossPotion: Item | null; // 보스 물약
  artisanPotion: Item | null; // 장인 물약
}

export interface Item {
  id: string;
  type: ItemType;
  grade: ItemGrade;
  baseStats: ItemStats;
  enhancedStats: ItemStats;
  level: number;
  enhancementLevel: number;
  imagePath: string;
}

export enum ItemType {
  HELMET = "helmet",
  ARMOR = "armor",
  PANTS = "pants",
  GLOVES = "gloves",
  SHOES = "shoes",
  SHOULDER = "shoulder",
  EARRING = "earring",
  RING = "ring",
  NECKLACE = "necklace",
  MAIN_WEAPON = "mainWeapon",
  SUB_WEAPON = "subWeapon",
  PET = "pet",
  // 물약 아이템들
  WEALTH_POTION = "wealthPotion", // 재물 물약 (초당 크레딧 증가)
  BOSS_POTION = "bossPotion", // 보스 물약 (크리티컬 데미지 증가)
  ARTISAN_POTION = "artisanPotion", // 장인 물약 (크리티컬 확률 증가)
  // 특별 아이템
  ZEUS_SWORD = "zeusSword", // 제우스 검 (특별 아이템)
}

export enum ItemGrade {
  COMMON = "common",
  RARE = "rare",
  EPIC = "epic",
  LEGENDARY = "legendary",
  MYTHIC = "mythic",
  DIVINE = "divine", // 제우스 검 전용 등급
}

export interface ItemStats {
  attack: number;
  defense: number;
  defensePenetration: number;
  additionalAttackChance: number;
  // 새로운 물약 스탯들
  creditPerSecondBonus: number; // 재물 물약: 초당 크레딧 보너스
  criticalDamageMultiplier: number; // 보스 물약: 크리티컬 데미지 배수
  criticalChance: number; // 장인 물약: 크리티컬 확률
}

export interface PlayerStats {
  attack: number;
  defense: number;
  defensePenetration: number;
  additionalAttackChance: number;
  // 새로운 물약 스탯들
  creditPerSecondBonus: number; // 재물 물약: 초당 크레딧 보너스
  criticalDamageMultiplier: number; // 보스 물약: 크리티컬 데미지 배수
  criticalChance: number; // 장인 물약: 크리티컬 확률
}

export interface StageInfo {
  requiredAttack: number;
  requiredDefense: number;
  creditMultiplier: number;
  stageClearDropRates: DropRateTable;
  idleDropRates: DropRateTable;
  boss: BossInfo;
}

export interface BossInfo {
  name: string;
  maxHP: number;
  attack: number;
  defense: number;
  image?: string;
}

export interface DropRateTable {
  [ItemGrade.COMMON]: number;
  [ItemGrade.RARE]: number;
  [ItemGrade.EPIC]: number;
  [ItemGrade.LEGENDARY]: number;
  [ItemGrade.MYTHIC]: number;
  [ItemGrade.DIVINE]: number;
}

export interface OfflineProgress {
  elapsedTime: number;
  creditsEarned: number;
  maxOfflineHours: number;
}

export interface GameActions {
  addCredits: (amount: number) => void;
  enableCrackMode: () => void;
  addTestCredits: (amount: number) => void;
  saveGame: () => void;
  loadGame: () => GameState | null;
  calculateOfflineProgress: () => OfflineProgress;
  getLastOfflineProgress: () => OfflineProgress | null;
  addItemToInventory: (item: Item) => void;
  removeItemFromInventory: (itemId: string) => void;
  equipItem: (item: Item) => boolean;
  unequipItem: (itemType: ItemType) => Item | null;
  updatePlayerStats: () => void;
  inheritItem: (sourceItem: Item, targetItem: Item) => boolean;
  enhanceItem: (
    item: Item,
    useDestructionPrevention?: boolean
  ) => EnhancementAttempt;
  performGachaDraw: (category: GachaCategory) => GachaResult;
  performSynthesis: (grade: ItemGrade) => {
    success: boolean;
    synthesizedItem?: Item;
    error?: string;
  };
  sellMultipleItems: (items: Item[]) => ItemSaleResult;
  startBattle: (boss: Boss) => void;
  updateBattleState: (battleState: BattleState) => void;
  endBattle: (result: "victory" | "defeat") => void;
  loadBossForCurrentStage: () => Boss | null;
  clearRecentStageClearDrops: () => void;
}

export enum EnhancementResult {
  SUCCESS = "success",
  FAILURE = "failure",
  DOWNGRADE = "downgrade",
  DESTRUCTION = "destruction",
}

export interface EnhancementInfo {
  cost: number;
  statIncrease: ItemStats;
  newEnhancementLevel: number;
  successRate: number;
  destructionRate?: number;
  itemType: ItemType;
}

export interface EnhancementAttempt {
  result: EnhancementResult;
  previousLevel: number;
  newLevel: number;
  costPaid: number;
  statChange: ItemStats;
}

export enum GachaCategory {
  ARMOR = "armor",
  ACCESSORIES = "accessories",
  WEAPONS = "weapons",
  POTIONS = "potions", // 물약 카테고리 추가
}

export interface GachaResult {
  item: Item;
  category: GachaCategory;
  cost: number;
}

export interface MultiGachaResult {
  items: Item[];
  category: GachaCategory;
  totalCost: number;
  count: number;
}

export interface ItemSaleResult {
  success: boolean;
  credits: number;
  soldItems: Item[];
  failedItems: Item[];
  error?: string;
}
