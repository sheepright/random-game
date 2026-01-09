/**
 * Item Drop System for Idle Gacha Game
 * Handles stage clear and idle item drops with probability-based generation
 * Requirements: 3.1, 3.2, 3.5, 3.6, 3.9
 */

import {
  Item,
  ItemType,
  ItemGrade,
  ItemStats,
  DropRateTable,
} from "../types/game";
import {
  ITEM_BASE_STATS,
  GRADE_MULTIPLIERS,
  GRADE_BASE_STATS,
  RANDOM_BONUS_RANGE,
  STAGE_CLEAR_DROP_RATES,
  IDLE_DROP_RATES,
  DROP_CHECK_INTERVALS,
  BASE_DROP_RATES,
  getItemImagePath,
} from "../constants/game";

/**
 * 아이템 드랍 결과 인터페이스
 */
export interface ItemDropResult {
  success: boolean;
  item?: Item;
  dropType: "stageClear" | "idle";
  stage: number;
}

/**
 * 아이템 드랍 시스템 클래스
 */
export class ItemDropSystem {
  /**
   * 스테이지 클리어 시 아이템 드랍 체크
   * Requirements: 3.1, 3.5
   * 2단계 확률 시스템: 기본 드랍률(30-50%) → 등급별 확률 분배
   */
  public checkStageClearDrop(stage: number): ItemDropResult {
    // 1단계: 기본 드랍률 체크
    const baseDropRate = this.getBaseDropRate(stage, "stageClear");
    const shouldDrop = this.rollForDrop(baseDropRate);

    if (!shouldDrop) {
      return {
        success: false,
        dropType: "stageClear",
        stage,
      };
    }

    // 2단계: 등급별 확률 분배
    const gradeDropRates = this.getDropRatesForStage(stage, "stageClear");
    const item = this.generateRandomItem(stage, gradeDropRates);

    return {
      success: true,
      item,
      dropType: "stageClear",
      stage,
    };
  }

  /**
   * 잠수 중 아이템 드랍 체크 (매초)
   * Requirements: 3.2, 3.6
   * 2단계 확률 시스템: 기본 드랍률(0.1-0.15%) → 등급별 확률 분배
   */
  public checkIdleDrop(stage: number): ItemDropResult {
    // 1단계: 기본 드랍률 체크 (매초 0.1-0.15%)
    const baseDropRate = this.getBaseDropRate(stage, "idle");
    const shouldDrop = this.rollForDrop(baseDropRate);

    if (!shouldDrop) {
      return {
        success: false,
        dropType: "idle",
        stage,
      };
    }

    // 2단계: 등급별 확률 분배
    const gradeDropRates = this.getDropRatesForStage(stage, "idle");
    const item = this.generateRandomItem(stage, gradeDropRates);

    return {
      success: true,
      item,
      dropType: "idle",
      stage,
    };
  }

  /**
   * 스테이지와 드랍 타입에 따른 기본 드랍률 반환
   */
  private getBaseDropRate(
    stage: number,
    dropType: "stageClear" | "idle"
  ): number {
    const rates = BASE_DROP_RATES[dropType];

    // 정의되지 않은 스테이지는 가장 높은 스테이지의 드랍률 사용
    const availableStages = Object.keys(rates)
      .map(Number)
      .sort((a, b) => b - a);
    const targetStage = availableStages.find((s) => s <= stage) || 1;

    return rates[targetStage as keyof typeof rates];
  }

  /**
   * 스테이지와 드랍 타입에 따른 드랍률 테이블 반환
   */
  private getDropRatesForStage(
    stage: number,
    dropType: "stageClear" | "idle"
  ): DropRateTable {
    const rates =
      dropType === "stageClear" ? STAGE_CLEAR_DROP_RATES : IDLE_DROP_RATES;

    // 정의되지 않은 스테이지는 가장 높은 스테이지의 드랍률 사용
    const availableStages = Object.keys(rates)
      .map(Number)
      .sort((a, b) => b - a);
    const targetStage = availableStages.find((s) => s <= stage) || 1;

    return rates[targetStage];
  }

  /**
   * 확률 기반 드랍 여부 결정
   */
  private rollForDrop(probability: number): boolean {
    return Math.random() < probability;
  }

  /**
   * 등급별 드랍률에 따른 아이템 등급 결정
   */
  private determineItemGrade(dropRates: DropRateTable): ItemGrade {
    const random = Math.random();
    let cumulativeProbability = 0;

    // 등급별 누적 확률 계산 (미식 등급 포함)
    const grades = [
      ItemGrade.MYTHIC,
      ItemGrade.LEGENDARY,
      ItemGrade.EPIC,
      ItemGrade.RARE,
      ItemGrade.COMMON,
    ];

    for (const grade of grades) {
      const gradeRate = dropRates[grade] || 0; // 정의되지 않은 등급은 0% 확률
      cumulativeProbability += gradeRate;
      if (random <= cumulativeProbability) {
        return grade;
      }
    }

    // 기본값으로 COMMON 반환
    return ItemGrade.COMMON;
  }

  /**
   * 랜덤 아이템 타입 선택
   */
  private getRandomItemType(): ItemType {
    const itemTypes = Object.values(ItemType);
    const randomIndex = Math.floor(Math.random() * itemTypes.length);
    return itemTypes[randomIndex];
  }

  /**
   * 아이템 스탯 랜덤 생성 (등급별 고정 기본값 + 랜덤 보너스)
   * Requirements: 3.9
   */
  private generateItemStats(
    itemType: ItemType,
    grade: ItemGrade,
    stage: number
  ): ItemStats {
    const baseStats = ITEM_BASE_STATS[itemType];
    const gradeBaseStats = GRADE_BASE_STATS[grade];
    const stageMultiplier = 1 + (stage - 1) * 0.1; // 스테이지당 10% 증가

    // 랜덤 보너스 (1~5)
    const getRandomBonus = () =>
      RANDOM_BONUS_RANGE.min +
      Math.floor(
        Math.random() * (RANDOM_BONUS_RANGE.max - RANDOM_BONUS_RANGE.min + 1)
      );

    // 아이템 타입별 스탯 적용 (해당 스탯만 적용)
    const enhancedStats: ItemStats = {
      attack:
        baseStats.attack > 0
          ? Math.floor(
              (gradeBaseStats.attack + getRandomBonus()) * stageMultiplier
            )
          : 0,
      defense:
        baseStats.defense > 0
          ? Math.floor(
              (gradeBaseStats.defense + getRandomBonus()) * stageMultiplier
            )
          : 0,
      defensePenetration:
        baseStats.defensePenetration > 0
          ? Math.floor(
              (gradeBaseStats.defensePenetration + getRandomBonus()) *
                stageMultiplier
            )
          : 0,
      additionalAttackChance:
        baseStats.additionalAttackChance > 0
          ? (gradeBaseStats.additionalAttackChance + getRandomBonus() * 0.001) *
            stageMultiplier
          : 0,
      creditPerSecondBonus:
        baseStats.creditPerSecondBonus > 0
          ? Math.floor(
              (gradeBaseStats.creditPerSecondBonus + getRandomBonus()) *
                stageMultiplier
            )
          : 0,
      criticalDamageMultiplier:
        baseStats.criticalDamageMultiplier > 0
          ? (gradeBaseStats.criticalDamageMultiplier +
              getRandomBonus() * 0.01) *
            stageMultiplier
          : 0,
      criticalChance:
        baseStats.criticalChance > 0
          ? (gradeBaseStats.criticalChance + getRandomBonus() * 0.01) *
            stageMultiplier
          : 0,
    };

    return enhancedStats;
  }

  /**
   * 랜덤 아이템 생성
   */
  private generateRandomItem(stage: number, dropRates: DropRateTable): Item {
    const itemType = this.getRandomItemType();
    const grade = this.determineItemGrade(dropRates);
    const baseStats = ITEM_BASE_STATS[itemType];
    const enhancedStats = this.generateItemStats(itemType, grade, stage);

    return {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: itemType,
      grade,
      baseStats: { ...baseStats },
      enhancedStats,
      level: 1,
      enhancementLevel: 0,
      imagePath: getItemImagePath(itemType),
    };
  }

  /**
   * 아이템 드랍 시스템 초기화 (더 이상 타이머 리셋 불필요)
   */
  public initialize(): void {
    // 매초 체크 방식으로 변경되어 별도 초기화 불필요
  }
}

// 싱글톤 인스턴스 생성
export const itemDropSystem = new ItemDropSystem();

/**
 * 편의 함수들
 */

/**
 * 스테이지 클리어 시 아이템 드랍 체크
 */
export function checkStageClearItemDrop(stage: number): ItemDropResult {
  return itemDropSystem.checkStageClearDrop(stage);
}

/**
 * 잠수 중 아이템 드랍 체크
 */
export function checkIdleItemDrop(stage: number): ItemDropResult {
  return itemDropSystem.checkIdleDrop(stage);
}

/**
 * 아이템 드랍 시스템 초기화
 */
export function initializeItemDropSystem(): void {
  itemDropSystem.initialize();
}

/**
 * 다음 잠수 드랍까지 남은 시간 조회 (매초 체크로 변경되어 항상 1초 미만)
 */
export function getTimeUntilNextIdleDrop(): number {
  // 매초 체크하므로 항상 1초 미만의 랜덤한 시간 반환
  return Math.random() * 1000;
}

/**
 * 아이템 드랍 생성 (StageManager에서 사용)
 * Requirements: 3.1, 3.2 - 스테이지 클리어 및 잠수 중 아이템 드랍
 */
export function generateItemDrop(
  stage: number,
  dropType: "stageClear" | "idle"
): Item | null {
  const dropResult =
    dropType === "stageClear"
      ? itemDropSystem.checkStageClearDrop(stage)
      : itemDropSystem.checkIdleDrop(stage);

  return dropResult.success ? dropResult.item! : null;
}

/**
 * 테스트용 랜덤 아이템 생성 함수
 * Requirements: 테스트 지원
 */
export function createRandomItem(
  itemType: ItemType,
  stage: number,
  grade: ItemGrade
): Item {
  const baseStats = ITEM_BASE_STATS[itemType];
  const gradeBaseStats = GRADE_BASE_STATS[grade];
  const stageMultiplier = 1 + (stage - 1) * 0.1; // 스테이지당 10% 증가

  // 랜덤 보너스 (1~5)
  const getRandomBonus = () =>
    RANDOM_BONUS_RANGE.min +
    Math.floor(
      Math.random() * (RANDOM_BONUS_RANGE.max - RANDOM_BONUS_RANGE.min + 1)
    );

  // 아이템 타입별 스탯 적용 (해당 스탯만 적용)
  const enhancedStats: ItemStats = {
    attack:
      baseStats.attack > 0
        ? Math.floor(
            (gradeBaseStats.attack + getRandomBonus()) * stageMultiplier
          )
        : 0,
    defense:
      baseStats.defense > 0
        ? Math.floor(
            (gradeBaseStats.defense + getRandomBonus()) * stageMultiplier
          )
        : 0,
    defensePenetration:
      baseStats.defensePenetration > 0
        ? Math.floor(
            (gradeBaseStats.defensePenetration + getRandomBonus()) *
              stageMultiplier
          )
        : 0,
    additionalAttackChance:
      baseStats.additionalAttackChance > 0
        ? (gradeBaseStats.additionalAttackChance + getRandomBonus() * 0.001) *
          stageMultiplier
        : 0,
    creditPerSecondBonus:
      baseStats.creditPerSecondBonus > 0
        ? Math.floor(
            (gradeBaseStats.creditPerSecondBonus + getRandomBonus()) *
              stageMultiplier
          )
        : 0,
    criticalDamageMultiplier:
      baseStats.criticalDamageMultiplier > 0
        ? (gradeBaseStats.criticalDamageMultiplier + getRandomBonus() * 0.01) *
          stageMultiplier
        : 0,
    criticalChance:
      baseStats.criticalChance > 0
        ? (gradeBaseStats.criticalChance + getRandomBonus() * 0.01) *
          stageMultiplier
        : 0,
  };

  return {
    id: `test-item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: itemType,
    grade,
    baseStats: { ...baseStats },
    enhancedStats,
    level: 1,
    enhancementLevel: 0,
    imagePath: getItemImagePath(itemType),
  };
}
