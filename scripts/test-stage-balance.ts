/**
 * 100 스테이지 밸런스 테스트 스크립트
 * 생성된 스테이지 데이터의 밸런스를 검증합니다.
 */

import { STAGE_REQUIREMENTS, BOSS_INFO } from "../constants/game";
import { getStageTheme } from "../utils/stageGenerator";

console.log("=== 100 스테이지 밸런스 테스트 ===\n");

// 주요 스테이지들의 밸런스 확인
const testStages = [1, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

console.log("주요 스테이지 밸런스:");
console.log(
  "스테이지 | 요구공격력 | 요구방어력 | 보스HP | 보스공격 | 보스방어 | 크레딧배율 | 보스이름"
);
console.log(
  "--------|-----------|-----------|--------|----------|----------|-----------|----------"
);

testStages.forEach((stage) => {
  const stageInfo = STAGE_REQUIREMENTS[stage];
  const boss = BOSS_INFO[stage];

  if (stageInfo && boss) {
    console.log(
      `${stage.toString().padStart(7)} | ` +
        `${stageInfo.requiredAttack.toLocaleString().padStart(9)} | ` +
        `${stageInfo.requiredDefense.toLocaleString().padStart(9)} | ` +
        `${boss.maxHP.toLocaleString().padStart(6)} | ` +
        `${boss.attack.toLocaleString().padStart(8)} | ` +
        `${boss.defense.toLocaleString().padStart(8)} | ` +
        `${stageInfo.creditMultiplier.toFixed(2).padStart(9)} | ` +
        `${boss.name}`
    );
  }
});

console.log("\n=== 스테이지 테마별 구간 ===\n");

// 테마별 구간 확인
for (let section = 1; section <= 10; section++) {
  const startStage = (section - 1) * 10 + 1;
  const endStage = section * 10;
  const theme = getStageTheme(startStage);

  console.log(`${startStage}-${endStage}: ${theme.theme}`);
  console.log(`  설명: ${theme.description}`);
  console.log(`  색상: ${theme.color}`);

  // 각 구간의 첫 번째와 마지막 보스 이름 표시
  const firstBoss = BOSS_INFO[startStage];
  const lastBoss = BOSS_INFO[endStage];

  if (firstBoss && lastBoss) {
    console.log(`  보스: ${firstBoss.name} ~ ${lastBoss.name}`);
  }
  console.log("");
}

console.log("=== 성장률 분석 ===\n");

// 성장률 계산
const stage1 = STAGE_REQUIREMENTS[1];
const stage50 = STAGE_REQUIREMENTS[50];
const stage100 = STAGE_REQUIREMENTS[100];

if (stage1 && stage50 && stage100) {
  const attackGrowth50 = stage50.requiredAttack / stage1.requiredAttack;
  const attackGrowth100 = stage100.requiredAttack / stage1.requiredAttack;

  const defenseGrowth50 = stage50.requiredDefense / stage1.requiredDefense;
  const defenseGrowth100 = stage100.requiredDefense / stage1.requiredDefense;

  console.log(
    `스테이지 1 → 50: 공격력 ${attackGrowth50.toFixed(
      1
    )}배, 방어력 ${defenseGrowth50.toFixed(1)}배`
  );
  console.log(
    `스테이지 1 → 100: 공격력 ${attackGrowth100.toFixed(
      1
    )}배, 방어력 ${defenseGrowth100.toFixed(1)}배`
  );
}

console.log("\n=== 드랍률 분석 ===\n");

// 드랍률 변화 확인
const checkDropRates = [1, 25, 50, 75, 100];
console.log("스테이지 | Common | Rare | Epic | Legendary");
console.log("--------|--------|------|------|----------");

checkDropRates.forEach((stage) => {
  const stageInfo = STAGE_REQUIREMENTS[stage];
  if (stageInfo) {
    const rates = stageInfo.stageClearDropRates;
    console.log(
      `${stage.toString().padStart(7)} | ` +
        `${(rates.common * 100).toFixed(1).padStart(6)}% | ` +
        `${(rates.rare * 100).toFixed(1).padStart(4)}% | ` +
        `${(rates.epic * 100).toFixed(1).padStart(4)}% | ` +
        `${(rates.legendary * 100).toFixed(1).padStart(9)}%`
    );
  }
});

console.log("\n=== 테스트 완료 ===");
console.log(
  `총 ${Object.keys(STAGE_REQUIREMENTS).length}개 스테이지가 생성되었습니다.`
);
