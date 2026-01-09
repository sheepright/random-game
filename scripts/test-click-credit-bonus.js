/**
 * 클릭 크레딧 보너스 테스트 스크립트
 */

// 기본 크레딧 생성률
const BASE_CREDIT_PER_SECOND = 1;

// 물약별 크레딧 보너스 (등급별)
const WEALTH_POTION_BONUS = {
  common: 2,
  rare: 5,
  epic: 10,
  legendary: 20,
  mythic: 35,
};

// 시뮬레이션 함수
function simulateClickCredit(baseCredit, potionBonus) {
  const totalCreditPerSecond = baseCredit + potionBonus;
  return totalCreditPerSecond;
}

console.log("🎮 클릭 크레딧 보너스 테스트\n");

console.log("📋 기본 상황:");
console.log(`  기본 크레딧/초: ${BASE_CREDIT_PER_SECOND}`);
console.log(
  `  클릭 시 획득: ${simulateClickCredit(BASE_CREDIT_PER_SECOND, 0)} 크레딧`
);
console.log("");

console.log("🧪 재물 물약 착용 시:");
Object.entries(WEALTH_POTION_BONUS).forEach(([grade, bonus]) => {
  const totalCredit = simulateClickCredit(BASE_CREDIT_PER_SECOND, bonus);
  const improvement = (
    (totalCredit / BASE_CREDIT_PER_SECOND - 1) *
    100
  ).toFixed(0);

  console.log(
    `  ${grade} 재물 물약: +${bonus} 보너스 → 클릭 시 ${totalCredit} 크레딧 (${improvement}% 증가)`
  );
});

console.log("");
console.log("💡 개선사항:");
console.log("- 이제 클릭 시 기본 크레딧 + 물약 보너스를 모두 획득");
console.log("- 재물 물약의 효용성이 크게 증가");
console.log("- 클릭 던전이 더욱 매력적인 컨텐츠가 됨");

console.log("");
console.log("🎯 예시 시나리오:");
console.log("1. 신화 재물 물약 착용 시:");
console.log(
  `   - 자동 생성: ${BASE_CREDIT_PER_SECOND + WEALTH_POTION_BONUS.mythic}/초`
);
console.log(
  `   - 클릭 획득: ${simulateClickCredit(
    BASE_CREDIT_PER_SECOND,
    WEALTH_POTION_BONUS.mythic
  )} 크레딧/클릭`
);
console.log(
  `   - 10번 클릭 시: ${
    simulateClickCredit(BASE_CREDIT_PER_SECOND, WEALTH_POTION_BONUS.mythic) * 10
  } 크레딧 획득`
);
