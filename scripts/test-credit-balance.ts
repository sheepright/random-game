/**
 * 크레딧 밸런스 테스트 스크립트
 * 스테이지별 크레딧 생성률과 클리어 보상을 확인
 */

import { calculateCreditMultiplier } from "../utils/stageGenerator";
import {
  calculateNewCreditRate,
  calculateStageClearReward,
} from "../utils/stageManager";
import { BASE_CREDIT_PER_SECOND } from "../constants/game";

console.log("=== 크레딧 밸런스 테스트 ===\n");

console.log("스테이지 | 생성률(크/초) | 클리어보상 | 누적 생성률 비교");
console.log("--------|-------------|-----------|----------------");

let oldCumulativeRate = BASE_CREDIT_PER_SECOND; // 기존 누적 방식
let totalRewards = 0;

for (let stage = 1; stage <= 20; stage++) {
  // 새로운 방식: 기본값 기준 계산
  const newRate = calculateNewCreditRate(BASE_CREDIT_PER_SECOND, stage);

  // 기존 방식: 누적 곱셈 (비교용)
  if (stage > 1) {
    const multiplier = calculateCreditMultiplier(stage);
    oldCumulativeRate = oldCumulativeRate * multiplier;
  }

  // 클리어 보상
  const clearReward = calculateStageClearReward(stage);
  totalRewards += clearReward;

  console.log(
    `${stage.toString().padStart(7)} | ` +
      `${newRate.toFixed(2).padStart(11)} | ` +
      `${clearReward.toLocaleString().padStart(9)} | ` +
      `기존: ${oldCumulativeRate.toFixed(2)}`
  );
}

console.log("\n=== 밸런스 분석 ===");
console.log(
  `20스테이지까지 총 클리어 보상: ${totalRewards.toLocaleString()} 크레딧`
);
console.log(
  `20스테이지 생성률 (새로운 방식): ${calculateNewCreditRate(
    BASE_CREDIT_PER_SECOND,
    20
  ).toFixed(2)} 크/초`
);
console.log(
  `20스테이지 생성률 (기존 방식): ${oldCumulativeRate.toFixed(2)} 크/초`
);

// 시간당 크레딧 계산
const newHourlyRate = calculateNewCreditRate(BASE_CREDIT_PER_SECOND, 20) * 3600;
const oldHourlyRate = oldCumulativeRate * 3600;

console.log(`\n시간당 크레딧 (20스테이지):`);
console.log(`새로운 방식: ${newHourlyRate.toLocaleString()} 크레딧/시간`);
console.log(`기존 방식: ${oldHourlyRate.toLocaleString()} 크레딧/시간`);
console.log(
  `개선 효과: ${(
    ((oldHourlyRate - newHourlyRate) / oldHourlyRate) *
    100
  ).toFixed(1)}% 감소`
);
