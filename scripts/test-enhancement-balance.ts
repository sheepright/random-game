/**
 * Enhancement System Balance Test Script
 * 강화 시스템의 밸런스를 검증하는 스크립트
 */

import {
  calculateEnhancementCost,
  getEnhancementSuccessRate,
  getEnhancementStatIncrease,
  ITEM_PRIMARY_STATS,
} from "../utils/enhancementSystem";
import { ItemGrade, ItemType } from "../types/game";

console.log("=== 강화 시스템 밸런스 검증 ===\n");

// 1. 강화 비용 진행 곡선 검증
console.log("1. 강화 비용 진행 곡선:");
console.log("레벨\tCommon\tRare\tEpic\tLegendary");
for (let level = 1; level <= 25; level++) {
  const costs = {
    common: calculateEnhancementCost(level, ItemGrade.COMMON),
    rare: calculateEnhancementCost(level, ItemGrade.RARE),
    epic: calculateEnhancementCost(level, ItemGrade.EPIC),
    legendary: calculateEnhancementCost(level, ItemGrade.LEGENDARY),
  };

  console.log(
    `${level}\t${costs.common}\t${costs.rare}\t${costs.epic}\t${costs.legendary}`
  );
}

// 2. 성공률 진행 곡선 검증
console.log("\n2. 강화 성공률:");
console.log("레벨\t성공률");
for (let level = 1; level <= 25; level++) {
  const successRate = getEnhancementSuccessRate(level);
  console.log(`${level}\t${(successRate * 100).toFixed(1)}%`);
}

// 3. 아이템별 주요 스탯 확인
console.log("\n3. 아이템별 주요 스탯 확인:");
Object.entries(ITEM_PRIMARY_STATS).forEach(([itemType, primaryStat]) => {
  console.log(`${itemType}: ${primaryStat}`);
});

// 4. 레벨별 효율성 분석 (주무기 기준)
console.log("\n4. 레벨별 효율성 분석 (주무기/공격력 기준):");
console.log("레벨\t비용\t스탯증가\t효율성(비용/스탯)");

for (let level = 1; level <= 25; level++) {
  const cost = calculateEnhancementCost(level, ItemGrade.COMMON);
  const statIncrease = getEnhancementStatIncrease(
    level,
    ItemGrade.COMMON,
    ItemType.MAIN_WEAPON
  );
  const efficiency =
    statIncrease.attack > 0 ? (cost / statIncrease.attack).toFixed(2) : "N/A";

  console.log(`${level}\t${cost}\t${statIncrease.attack}\t${efficiency}`);
}

// 5. 등급별 15강 비교
console.log("\n5. 등급별 15강 비교:");
const level15 = 15;
Object.values(ItemGrade).forEach((grade) => {
  const cost = calculateEnhancementCost(level15, grade);
  const statIncrease = getEnhancementStatIncrease(
    level15,
    grade,
    ItemType.MAIN_WEAPON
  );

  console.log(`${grade}: 비용=${cost}, 스탯증가=${statIncrease.attack}`);
});

console.log("\n6. 밸런스 분석 결과:");

// 초기 레벨 (1-5강) 효율성 체크
const earlyLevelEfficiency = [];
for (let level = 1; level <= 5; level++) {
  const cost = calculateEnhancementCost(level, ItemGrade.COMMON);
  const statIncrease = getEnhancementStatIncrease(
    level,
    ItemGrade.COMMON,
    ItemType.MAIN_WEAPON
  );
  if (statIncrease.attack > 0) {
    earlyLevelEfficiency.push(cost / statIncrease.attack);
  }
}

// 중간 레벨 (6-11강) 효율성 체크
const midLevelEfficiency = [];
for (let level = 6; level <= 11; level++) {
  const cost = calculateEnhancementCost(level, ItemGrade.COMMON);
  const statIncrease = getEnhancementStatIncrease(
    level,
    ItemGrade.COMMON,
    ItemType.MAIN_WEAPON
  );
  if (statIncrease.attack > 0) {
    midLevelEfficiency.push(cost / statIncrease.attack);
  }
}

// 고급 레벨 (12-25강) 효율성
const highLevelEfficiency = [];
for (let level = 12; level <= 25; level++) {
  const cost = calculateEnhancementCost(level, ItemGrade.COMMON);
  const statIncrease = getEnhancementStatIncrease(
    level,
    ItemGrade.COMMON,
    ItemType.MAIN_WEAPON
  );
  if (statIncrease.attack > 0) {
    highLevelEfficiency.push(cost / statIncrease.attack);
  }
}

const avgEarlyEfficiency =
  earlyLevelEfficiency.reduce((a, b) => a + b, 0) / earlyLevelEfficiency.length;
const avgMidEfficiency =
  midLevelEfficiency.reduce((a, b) => a + b, 0) / midLevelEfficiency.length;
const avgHighEfficiency =
  highLevelEfficiency.reduce((a, b) => a + b, 0) / highLevelEfficiency.length;

console.log(`초기 레벨 (1-5강) 평균 효율성: ${avgEarlyEfficiency.toFixed(2)}`);
console.log(`중간 레벨 (6-11강) 평균 효율성: ${avgMidEfficiency.toFixed(2)}`);
console.log(`고급 레벨 (12-25강) 평균 효율성: ${avgHighEfficiency.toFixed(2)}`);

// 밸런스 검증 - 효율이 좋다는 것은 크레딧/스탯 비율이 낮다는 의미
console.log("\n밸런스 검증:");
console.log("- 초기 레벨은 높은 비용/스탯 비율 (낮은 효율)");
console.log("- 중간 레벨은 점진적 효율 개선");
console.log("- 고급 레벨은 낮은 비용/스탯 비율 (높은 효율)");

// 추가 분석: 레벨 구간별 효율 개선 정도
const earlyToMidImprovement = (
  ((avgEarlyEfficiency - avgMidEfficiency) / avgEarlyEfficiency) *
  100
).toFixed(1);
const midToHighImprovement = (
  ((avgMidEfficiency - avgHighEfficiency) / avgMidEfficiency) *
  100
).toFixed(1);

console.log(`\n효율 개선 정도:`);
console.log(`초기 → 중간: ${earlyToMidImprovement}% 개선`);
console.log(`중간 → 고급: ${midToHighImprovement}% 개선`);

// 실패 확률을 고려한 예상 비용 분석 (15강, 20강 기준)
console.log(`\n실패 확률 고려 예상 비용 (주무기 기준):`);

const level15Cost = calculateEnhancementCost(15, ItemGrade.COMMON);
const level15StatIncrease = getEnhancementStatIncrease(
  15,
  ItemGrade.COMMON,
  ItemType.MAIN_WEAPON
);
const level15SuccessRate = getEnhancementSuccessRate(15);
const level15ExpectedCost = level15Cost / level15SuccessRate; // 예상 비용
const level15RealEfficiency = level15ExpectedCost / level15StatIncrease.attack;
console.log(
  `15강: 예상 비용=${level15ExpectedCost.toFixed(
    0
  )}, 실제 효율성=${level15RealEfficiency.toFixed(2)}`
);

const level20Cost = calculateEnhancementCost(20, ItemGrade.COMMON);
const level20StatIncrease = getEnhancementStatIncrease(
  20,
  ItemGrade.COMMON,
  ItemType.MAIN_WEAPON
);
const level20SuccessRate = getEnhancementSuccessRate(20);
const level20ExpectedCost = level20Cost / level20SuccessRate;
const level20RealEfficiency = level20ExpectedCost / level20StatIncrease.attack;
console.log(
  `20강: 예상 비용=${level20ExpectedCost.toFixed(
    0
  )}, 실제 효율성=${level20RealEfficiency.toFixed(2)}`
);

// 추가타격 확률 아이템 분석
console.log("\n추가타격 확률 아이템 분석:");
const additionalAttackItems = [
  ItemType.GLOVES,
  ItemType.SHOES,
  ItemType.SHOULDER,
];
additionalAttackItems.forEach((itemType) => {
  const statIncrease = getEnhancementStatIncrease(
    10,
    ItemGrade.COMMON,
    itemType
  );
  console.log(
    `${itemType}: 10강 시 추가타격 확률 증가 = ${(
      statIncrease.additionalAttackChance * 100
    ).toFixed(2)}%`
  );
});

console.log("\n=== 검증 완료 ===");
