/**
 * 최종 스테이지 밸런스 테스트
 */

import { ItemGrade, ItemType } from "../types/game";
import { ITEM_BASE_STATS, GRADE_MULTIPLIERS } from "../constants/game";
import {
  calculateStageRequirements,
  calculateBossStats,
} from "../utils/stageGenerator";
import { getEnhancementStatIncrease } from "../utils/enhancementSystem";

// 더 정확한 플레이어 파워 계산
function calculatePlayerPower(stage: number) {
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
    expectedEnhancementLevel = Math.min(stage - 30, 18); // 더 높은 강화
  } else {
    expectedGrade = ItemGrade.MYTHIC;
    expectedEnhancementLevel = Math.min(stage - 50, 25); // 최대 강화
  }

  // 기본 장비 스탯
  const gradeMultiplier = GRADE_MULTIPLIERS[expectedGrade];

  let totalAttack = (10 + 6 + 8) * gradeMultiplier; // 주무기 + 보조무기 + 펫
  let totalDefense = (8 + 5 + 6) * gradeMultiplier; // 아머 + 헬멧 + 팬츠

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

// 주요 스테이지 밸런스 체크
const testStages = [1, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

console.log("=== 최종 스테이지 밸런스 테스트 ===\n");

for (const stage of testStages) {
  const playerPower = calculatePlayerPower(stage);
  const stageReq = calculateStageRequirements(stage);
  const bossStats = calculateBossStats(stage);

  const attackRatio = playerPower.attack / stageReq.requiredAttack;
  const defenseRatio = playerPower.defense / stageReq.requiredDefense;

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

  console.log(`스테이지 ${stage}: ${balance}`);
  console.log(
    `  플레이어: 공격 ${playerPower.attack}, 방어 ${playerPower.defense} (${playerPower.expectedGrade} +${playerPower.expectedEnhancementLevel})`
  );
  console.log(
    `  요구사항: 공격 ${stageReq.requiredAttack}, 방어 ${stageReq.requiredDefense}`
  );
  console.log(
    `  파워비율: 공격 ${attackRatio.toFixed(2)}x, 방어 ${defenseRatio.toFixed(
      2
    )}x`
  );
  console.log(
    `  보스: HP ${bossStats.maxHP}, 공격 ${bossStats.attack}, 방어 ${bossStats.defense}\n`
  );
}
