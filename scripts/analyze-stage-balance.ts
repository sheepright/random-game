/**
 * 스테이지 밸런스 분석 스크립트
 * 현재 시스템에서 플레이어 파워 진행도와 스테이지 요구사항을 비교
 */

import { ItemGrade, ItemType } from "../types/game";
import { ITEM_BASE_STATS, GRADE_MULTIPLIERS } from "../constants/game";
import {
  calculateStageRequirements,
  calculateBossStats,
} from "../utils/stageGenerator";
import { getEnhancementStatIncrease } from "../utils/enhancementSystem";

// 플레이어 파워 계산 함수
function calculatePlayerPower(stage: number) {
  // 스테이지별 예상 장비 등급 분포 (드랍률 기반)
  let expectedGrade: ItemGrade;
  let expectedEnhancementLevel: number;

  if (stage <= 10) {
    expectedGrade = ItemGrade.COMMON;
    expectedEnhancementLevel = Math.min(stage, 5);
  } else if (stage <= 20) {
    expectedGrade = ItemGrade.RARE;
    expectedEnhancementLevel = Math.min(stage - 5, 8);
  } else if (stage <= 35) {
    expectedGrade = ItemGrade.EPIC;
    expectedEnhancementLevel = Math.min(stage - 15, 12);
  } else if (stage <= 60) {
    expectedGrade = ItemGrade.LEGENDARY;
    expectedEnhancementLevel = Math.min(stage - 30, 15);
  } else {
    expectedGrade = ItemGrade.MYTHIC;
    expectedEnhancementLevel = Math.min(stage - 50, 20);
  }

  // 기본 장비 스탯 계산 (주요 장비만)
  const mainWeaponStats = ITEM_BASE_STATS[ItemType.MAIN_WEAPON];
  const subWeaponStats = ITEM_BASE_STATS[ItemType.SUB_WEAPON];
  const petStats = ITEM_BASE_STATS[ItemType.PET];
  const armorStats = ITEM_BASE_STATS[ItemType.ARMOR];
  const helmetStats = ITEM_BASE_STATS[ItemType.HELMET];
  const pantsStats = ITEM_BASE_STATS[ItemType.PANTS];

  // 등급 배율 적용
  const gradeMultiplier = GRADE_MULTIPLIERS[expectedGrade];

  let totalAttack =
    (mainWeaponStats.attack + subWeaponStats.attack + petStats.attack) *
    gradeMultiplier;
  let totalDefense =
    (armorStats.defense + helmetStats.defense + pantsStats.defense) *
    gradeMultiplier;

  // 강화 스탯 추가
  for (let level = 1; level <= expectedEnhancementLevel; level++) {
    const weaponEnhancement = getEnhancementStatIncrease(
      level,
      expectedGrade,
      ItemType.MAIN_WEAPON
    );
    const subWeaponEnhancement = getEnhancementStatIncrease(
      level,
      expectedGrade,
      ItemType.SUB_WEAPON
    );
    const petEnhancement = getEnhancementStatIncrease(
      level,
      expectedGrade,
      ItemType.PET
    );
    const armorEnhancement = getEnhancementStatIncrease(
      level,
      expectedGrade,
      ItemType.ARMOR
    );
    const helmetEnhancement = getEnhancementStatIncrease(
      level,
      expectedGrade,
      ItemType.HELMET
    );
    const pantsEnhancement = getEnhancementStatIncrease(
      level,
      expectedGrade,
      ItemType.PANTS
    );

    totalAttack +=
      weaponEnhancement.attack +
      subWeaponEnhancement.attack +
      petEnhancement.attack;
    totalDefense +=
      armorEnhancement.defense +
      helmetEnhancement.defense +
      pantsEnhancement.defense;
  }

  return {
    attack: Math.floor(totalAttack),
    defense: Math.floor(totalDefense),
    expectedGrade,
    expectedEnhancementLevel,
  };
}

// 스테이지별 밸런스 분석
function analyzeStageBalance() {
  console.log("=== 스테이지 밸런스 분석 ===\n");

  const analysisPoints = [
    1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100,
  ];

  for (const stage of analysisPoints) {
    const playerPower = calculatePlayerPower(stage);
    const stageRequirements = calculateStageRequirements(stage);
    const bossStats = calculateBossStats(stage);

    const attackRatio = playerPower.attack / stageRequirements.requiredAttack;
    const defenseRatio =
      playerPower.defense / stageRequirements.requiredDefense;

    console.log(`스테이지 ${stage}:`);
    console.log(
      `  플레이어 파워: 공격 ${playerPower.attack}, 방어 ${playerPower.defense}`
    );
    console.log(
      `  스테이지 요구: 공격 ${stageRequirements.requiredAttack}, 방어 ${stageRequirements.requiredDefense}`
    );
    console.log(
      `  보스 스탯: HP ${bossStats.maxHP}, 공격 ${bossStats.attack}, 방어 ${bossStats.defense}`
    );
    console.log(
      `  파워 비율: 공격 ${attackRatio.toFixed(
        2
      )}x, 방어 ${defenseRatio.toFixed(2)}x`
    );
    console.log(
      `  예상 장비: ${playerPower.expectedGrade} +${playerPower.expectedEnhancementLevel}`
    );

    // 밸런스 평가
    let balance = "적정";
    if (attackRatio < 0.8 || defenseRatio < 0.8) {
      balance = "너무 어려움";
    } else if (attackRatio > 2.0 || defenseRatio > 2.0) {
      balance = "너무 쉬움";
    } else if (attackRatio < 1.0 || defenseRatio < 1.0) {
      balance = "약간 어려움";
    } else if (attackRatio > 1.5 || defenseRatio > 1.5) {
      balance = "약간 쉬움";
    }

    console.log(`  밸런스 평가: ${balance}\n`);
  }
}

// 권장 조정사항 계산
function calculateRecommendedAdjustments() {
  console.log("=== 권장 조정사항 ===\n");

  const stages = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

  for (const stage of stages) {
    const playerPower = calculatePlayerPower(stage);
    const currentRequirements = calculateStageRequirements(stage);

    // 목표: 플레이어 파워의 80-120% 범위로 조정
    const targetAttack = Math.floor(playerPower.attack * 0.9);
    const targetDefense = Math.floor(playerPower.defense * 0.9);

    const attackAdjustment =
      (targetAttack / currentRequirements.requiredAttack - 1) * 100;
    const defenseAdjustment =
      (targetDefense / currentRequirements.requiredDefense - 1) * 100;

    console.log(`스테이지 ${stage} 권장 조정:`);
    console.log(
      `  공격력 요구사항: ${
        attackAdjustment > 0 ? "+" : ""
      }${attackAdjustment.toFixed(1)}%`
    );
    console.log(
      `  방어력 요구사항: ${
        defenseAdjustment > 0 ? "+" : ""
      }${defenseAdjustment.toFixed(1)}%`
    );
  }
}

// 실행
analyzeStageBalance();
calculateRecommendedAdjustments();
