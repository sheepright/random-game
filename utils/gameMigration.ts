/**
 * Game state migration utilities
 * Handles migration from legacy equipment system to new item system
 * Based on requirements 8.1, 8.2, 8.3, 8.4
 */

import {
  GameState,
  Item,
  ItemType,
  PlayerStats,
  EquippedItems,
  ItemStats,
} from "../types/game";
import { getItemImagePath, getDefaultGameState } from "../constants/game";

// Migration version tracking
export const CURRENT_MIGRATION_VERSION = 4; // imagePath 추가를 위해 버전 증가
export const MIGRATION_VERSION_KEY = "__migration_version__";

/**
 * 아이템에 imagePath 필드 추가
 */
export function addImagePathToItem(item: Item): Item {
  // 이미 imagePath가 있으면 그대로 반환
  if (item.imagePath) {
    return item;
  }

  // imagePath 추가
  return {
    ...item,
    imagePath: getItemImagePath(item.type),
  };
}

/**
 * 글러브, 슈즈, 숄더 아이템의 공격력을 추가타격 확률로 변환
 * 변환 공식: 공격력 1당 0.5% 추가타격 확률
 */
export function convertAttackToAdditionalAttackChance(item: Item): Item {
  // 글러브, 슈즈, 숄더 아이템만 변환
  const targetTypes = [ItemType.GLOVES, ItemType.SHOES, ItemType.SHOULDER];

  if (!targetTypes.includes(item.type)) {
    return item;
  }

  // 기존 공격력이 있고 추가타격 확률이 0인 경우에만 변환
  if (
    item.baseStats.attack > 0 &&
    item.baseStats.additionalAttackChance === 0
  ) {
    const convertedItem = { ...item };

    // 기본 스탯 변환 (공격력 1당 0.5% 추가타격 확률)
    const baseAttackToConvert = convertedItem.baseStats.attack;
    convertedItem.baseStats.additionalAttackChance =
      baseAttackToConvert * 0.005; // 0.5%
    convertedItem.baseStats.attack = 0;

    // 강화된 스탯도 변환
    const enhancedAttackToConvert = convertedItem.enhancedStats.attack;
    convertedItem.enhancedStats.additionalAttackChance =
      enhancedAttackToConvert * 0.005; // 0.5%
    convertedItem.enhancedStats.attack = 0;

    console.log(
      `아이템 변환: ${
        item.type
      } - 공격력 ${baseAttackToConvert} → 추가타격 확률 ${
        convertedItem.baseStats.additionalAttackChance * 100
      }%`
    );

    return convertedItem;
  }

  return item;
}

/**
 * 기존 강화된 아이템의 스탯을 새로운 시스템에 맞게 재계산
 * 모든 스탯이 증가했던 것을 고유 스탯만 증가하도록 변환
 */
export function recalculateEnhancedItemStats(item: Item): Item {
  // 강화 레벨이 0이면 변환할 필요 없음
  if (item.enhancementLevel === 0) {
    return item;
  }

  // 아이템 타입별 주요 스탯 정의 (enhancementSystem.ts와 동일)
  const ITEM_PRIMARY_STATS: Record<ItemType, keyof ItemStats> = {
    // 방어구 (방어력)
    [ItemType.HELMET]: "defense",
    [ItemType.ARMOR]: "defense",
    [ItemType.PANTS]: "defense",

    // 방어구 (추가타격 확률)
    [ItemType.GLOVES]: "additionalAttackChance",
    [ItemType.SHOES]: "additionalAttackChance",
    [ItemType.SHOULDER]: "additionalAttackChance",

    // 장신구 (방어력 무시)
    [ItemType.EARRING]: "defensePenetration",
    [ItemType.RING]: "defensePenetration",
    [ItemType.NECKLACE]: "defensePenetration",

    // 무기 (공격력)
    [ItemType.MAIN_WEAPON]: "attack",
    [ItemType.SUB_WEAPON]: "attack",

    // 펫 (공격력)
    [ItemType.PET]: "attack",
  };

  const primaryStat = ITEM_PRIMARY_STATS[item.type];

  // 현재 강화된 스탯에서 기본 스탯을 뺀 값 (순수 강화 보너스)
  const currentEnhancementBonus = {
    attack: item.enhancedStats.attack - item.baseStats.attack,
    defense: item.enhancedStats.defense - item.baseStats.defense,
    defensePenetration:
      item.enhancedStats.defensePenetration - item.baseStats.defensePenetration,
    additionalAttackChance:
      item.enhancedStats.additionalAttackChance -
      item.baseStats.additionalAttackChance,
  };

  // 모든 강화 보너스의 합계 계산 (추가타격 확률은 1000배로 계산하여 정수로 변환)
  const totalEnhancementValue =
    currentEnhancementBonus.attack +
    currentEnhancementBonus.defense +
    currentEnhancementBonus.defensePenetration +
    currentEnhancementBonus.additionalAttackChance * 1000;

  // 새로운 강화 스탯 초기화 (기본 스탯만 유지)
  const newEnhancedStats: ItemStats = { ...item.baseStats };

  // 총 강화 보너스를 해당 아이템의 주요 스탯에만 집중
  if (totalEnhancementValue > 0) {
    switch (primaryStat) {
      case "attack":
        newEnhancedStats.attack = item.baseStats.attack + totalEnhancementValue;
        break;
      case "defense":
        newEnhancedStats.defense =
          item.baseStats.defense + totalEnhancementValue;
        break;
      case "defensePenetration":
        newEnhancedStats.defensePenetration =
          item.baseStats.defensePenetration + totalEnhancementValue;
        break;
      case "additionalAttackChance":
        // 추가타격 확률은 1000으로 나누어 원래 비율로 복원
        newEnhancedStats.additionalAttackChance =
          item.baseStats.additionalAttackChance + totalEnhancementValue / 1000;
        break;
    }

    console.log(
      `아이템 스탯 재계산: ${item.type} (강화 +${item.enhancementLevel}) - 총 보너스 ${totalEnhancementValue}를 ${primaryStat}에 집중`
    );
  }

  return {
    ...item,
    enhancedStats: newEnhancedStats,
  };
}

/**
 * 게임 상태의 모든 아이템에 대해 스탯 변환 및 imagePath 추가 적용
 */
export function migrateItemStats(gameState: GameState): GameState {
  const migratedState = { ...gameState };

  // 장착된 아이템 변환
  const equippedItems = { ...migratedState.equippedItems };
  Object.keys(equippedItems).forEach((key) => {
    const item = equippedItems[key as keyof typeof equippedItems];
    if (item) {
      let migratedItem = convertAttackToAdditionalAttackChance(item);
      migratedItem = recalculateEnhancedItemStats(migratedItem);
      migratedItem = addImagePathToItem(migratedItem);
      equippedItems[key as keyof typeof equippedItems] = migratedItem;
    }
  });
  migratedState.equippedItems = equippedItems;

  // 인벤토리 아이템 변환
  migratedState.inventory = migratedState.inventory.map((item) => {
    let migratedItem = convertAttackToAdditionalAttackChance(item);
    migratedItem = recalculateEnhancedItemStats(migratedItem);
    migratedItem = addImagePathToItem(migratedItem);
    return migratedItem;
  });

  // 플레이어 스탯 재계산 (Requirements: 게임 밸런스 유지)
  migratedState.playerStats = recalculatePlayerStats(
    migratedState.equippedItems
  );

  // 전투력 변화에 따른 스테이지 진행 상황 조정 (Requirements: 게임 밸런스 유지)
  migratedState.currentStage = adjustStageProgression(
    migratedState.currentStage,
    migratedState.playerStats
  );

  return migratedState;
}

/**
 * 전투력 변화에 따른 스테이지 진행 상황 조정
 * 마이그레이션 후 플레이어 스탯이 현재 스테이지에 적합한지 확인하고 조정
 */
export function adjustStageProgression(
  currentStage: number,
  playerStats: PlayerStats
): number {
  // 스테이지 요구사항 계산 (stageGenerator.ts와 동일한 공식 사용)
  const calculateStageRequirements = (stage: number) => {
    const baseAttack = 10;
    const baseDefense = 10;
    const attackGrowthRate = 1.15; // 15% 증가
    const defenseGrowthRate = 1.12; // 12% 증가

    return {
      requiredAttack: Math.floor(
        baseAttack * Math.pow(attackGrowthRate, stage - 1)
      ),
      requiredDefense: Math.floor(
        baseDefense * Math.pow(defenseGrowthRate, stage - 1)
      ),
    };
  };

  // 현재 스테이지 요구사항 확인
  const currentRequirements = calculateStageRequirements(currentStage);

  // 플레이어가 현재 스테이지 요구사항을 충족하는지 확인
  const canClearCurrentStage =
    playerStats.attack >= currentRequirements.requiredAttack &&
    playerStats.defense >= currentRequirements.requiredDefense;

  if (!canClearCurrentStage) {
    // 현재 스테이지를 클리어할 수 없다면, 클리어 가능한 최고 스테이지를 찾음
    // 하지만 기존 테스트에 영향을 주지 않도록 보수적으로 처리
    let adjustedStage = 1; // 최소 1스테이지로 설정

    for (let stage = currentStage - 1; stage >= 1; stage--) {
      const requirements = calculateStageRequirements(stage);
      if (
        playerStats.attack >= requirements.requiredAttack &&
        playerStats.defense >= requirements.requiredDefense
      ) {
        adjustedStage = stage;
        break;
      }
    }

    // 스테이지가 실제로 변경되는 경우에만 로그 출력
    if (adjustedStage !== currentStage) {
      console.log(
        `스테이지 하향 조정: ${currentStage} → ${adjustedStage} (플레이어 스탯 부족)`
      );
      return adjustedStage;
    }
  }

  // 상향 조정은 하지 않음 (기존 진행 상황 보존)
  return currentStage;
}

/**
 * 장착된 아이템을 기반으로 플레이어 스탯 재계산
 * 마이그레이션 후 변경된 아이템 스탯에 따른 플레이어 총 스탯 재계산
 */
export function recalculatePlayerStats(
  equippedItems: EquippedItems
): PlayerStats {
  const stats: PlayerStats = {
    attack: 0,
    defense: 0,
    defensePenetration: 0,
    additionalAttackChance: 0,
  };

  // 모든 장착된 아이템의 스탯을 합산
  Object.values(equippedItems).forEach((item) => {
    if (item) {
      // enhancedStats를 사용하여 강화된 스탯까지 포함
      stats.attack += item.enhancedStats.attack || 0;
      stats.defense += item.enhancedStats.defense || 0;
      stats.defensePenetration += item.enhancedStats.defensePenetration || 0;
      stats.additionalAttackChance +=
        item.enhancedStats.additionalAttackChance || 0;
    }
  });

  // 추가타격 확률은 최대 50%로 제한
  stats.additionalAttackChance = Math.min(0.5, stats.additionalAttackChance);

  console.log("플레이어 스탯 재계산 완료:", stats);

  return stats;
}

/**
 * 게임 상태가 유효한지 검증
 */
export function isValidGameState(data: any): data is GameState {
  if (!data || typeof data !== "object") {
    return false;
  }

  // 필수 필드 검증
  const requiredFields = [
    "credits",
    "creditPerSecond",
    "currentStage",
    "lastSaveTime",
    "equippedItems",
    "inventory",
    "playerStats",
  ];

  return requiredFields.every((field) => field in data);
}

/**
 * 게임 상태 버전 감지
 */
export function detectGameStateVersion(data: any): number {
  if (!data || typeof data !== "object") {
    return 0; // 유효하지 않은 데이터
  }

  // 현재 버전 확인 (localStorage에서 별도 확인)
  const storedVersion = localStorage.getItem(MIGRATION_VERSION_KEY);
  if (storedVersion && parseInt(storedVersion) === CURRENT_MIGRATION_VERSION) {
    return CURRENT_MIGRATION_VERSION;
  }

  // 레거시 버전 (equipment 필드가 있으면 v1)
  if (data.equipment && !data.equippedItems) {
    return 1;
  }

  // equippedItems가 있으면 v2
  if (data.equippedItems) {
    return 2;
  }

  // 기본적으로 현재 버전으로 간주
  return CURRENT_MIGRATION_VERSION;
}

/**
 * 게임 상태 마이그레이션
 */
export function migrateGameState(data: any): GameState {
  const version = detectGameStateVersion(data);

  // 이미 최신 버전이면 그대로 반환
  if (version === CURRENT_MIGRATION_VERSION && isValidGameState(data)) {
    return data;
  }

  let migratedState: GameState;

  // 버전 3에서 4로 마이그레이션 (imagePath 추가 + 강화 스탯 재계산)
  if (version === 3 && isValidGameState(data)) {
    console.log(
      "버전 3에서 4로 마이그레이션: imagePath 추가 + 강화 스탯 재계산"
    );
    migratedState = migrateItemStats(data);
    // 마이그레이션 버전을 별도로 저장
    localStorage.setItem(
      MIGRATION_VERSION_KEY,
      CURRENT_MIGRATION_VERSION.toString()
    );
    return migratedState;
  }

  // 버전 2에서 4로 마이그레이션 (아이템 스탯 변환 + 강화 스탯 재계산 + imagePath 추가)
  if (version === 2 && isValidGameState(data)) {
    console.log(
      "버전 2에서 4로 마이그레이션: 아이템 스탯 변환 + 강화 스탯 재계산 + imagePath 추가"
    );
    migratedState = migrateItemStats(data);
    // 마이그레이션 버전을 별도로 저장
    localStorage.setItem(
      MIGRATION_VERSION_KEY,
      CURRENT_MIGRATION_VERSION.toString()
    );
    return migratedState;
  }

  // 레거시 데이터나 유효하지 않은 데이터는 기본값으로 초기화
  console.warn("레거시 또는 유효하지 않은 게임 데이터 감지, 기본값으로 초기화");

  migratedState = {
    ...getDefaultGameState(),
    // 가능한 경우 일부 데이터 보존
    credits: typeof data?.credits === "number" ? Math.max(0, data.credits) : 0,
    creditPerSecond:
      typeof data?.creditPerSecond === "number"
        ? Math.max(1, data.creditPerSecond)
        : 1,
    currentStage:
      typeof data?.currentStage === "number"
        ? Math.max(1, data.currentStage)
        : 1,
    lastSaveTime:
      typeof data?.lastSaveTime === "number" ? data.lastSaveTime : Date.now(),
  };

  // 마이그레이션 버전을 별도로 저장
  localStorage.setItem(
    MIGRATION_VERSION_KEY,
    CURRENT_MIGRATION_VERSION.toString()
  );

  return migratedState;
}

/**
 * 안전한 마이그레이션 (백업 포함)
 */
export function performSafeMigration(data: any): GameState {
  try {
    // 백업 생성
    const backupKey = `migration_backup_${Date.now()}`;
    localStorage.setItem(backupKey, JSON.stringify(data));

    // 마이그레이션 수행
    return migrateGameState(data);
  } catch (error) {
    console.error("마이그레이션 실패:", error);
    return getDefaultGameState();
  }
}
