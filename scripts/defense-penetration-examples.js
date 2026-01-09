/**
 * 방어력 무시 계산 예시
 */

// 방어력 무시 계산 함수
function calculateDamage(attack, defense, defensePenetration = 0) {
  // 1단계: 유효 방어력 계산
  const effectiveDefense = Math.max(0, defense - defensePenetration);

  // 2단계: 데미지 감소율 계산
  const damageReduction = effectiveDefense / (effectiveDefense + 100);

  // 3단계: 최종 데미지 계산
  const finalDamage = Math.max(
    Math.floor(attack * 0.1), // 최소 10% 데미지 보장
    Math.floor(attack * (1 - damageReduction))
  );

  return {
    effectiveDefense,
    damageReduction: (damageReduction * 100).toFixed(1) + "%",
    finalDamage,
  };
}

console.log("🛡️ 방어력 무시 계산 예시\n");

// 기본 설정
const playerAttack = 100;
const enemyDefense = 50;

console.log(
  `📊 기본 상황: 플레이어 공격력 ${playerAttack}, 적 방어력 ${enemyDefense}\n`
);

// 방어력 무시별 데미지 계산
const penetrationValues = [0, 10, 25, 50, 75, 100];

penetrationValues.forEach((penetration) => {
  const result = calculateDamage(playerAttack, enemyDefense, penetration);

  console.log(`🗡️ 방어력 무시 ${penetration}:`);
  console.log(`   유효 방어력: ${result.effectiveDefense}`);
  console.log(`   데미지 감소: ${result.damageReduction}`);
  console.log(`   최종 데미지: ${result.finalDamage}`);
  console.log("");
});

console.log("🎯 방어력 무시의 효과:");
console.log("- 방어력 무시 0: 67 데미지 (33% 감소)");
console.log("- 방어력 무시 25: 80 데미지 (20% 감소)");
console.log("- 방어력 무시 50: 100 데미지 (0% 감소)");
console.log("- 방어력 무시 75+: 100 데미지 (최대 효과)");

console.log("\n💡 중요 포인트:");
console.log("1. 방어력 무시는 적 방어력에서 직접 차감");
console.log("2. 방어력 무시가 적 방어력보다 높으면 완전 무시");
console.log("3. 최소 10% 데미지는 항상 보장");
console.log("4. 방어력이 높은 적일수록 방어력 무시의 효과가 큼");

console.log("\n🏆 실전 활용:");
console.log("- 초반: 방어력 무시 효과 적음");
console.log("- 중반: 보스 방어력 증가로 방어력 무시 중요해짐");
console.log("- 후반: 방어력 무시 없이는 데미지 거의 안 들어감");
