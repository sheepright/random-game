/**
 * 기본 장비 기준 밸런스 테스트
 */

// 실제 기본 장비 스탯
const BASIC_EQUIPMENT_STATS = {
  attack: 10,
  defense: 15,
  defensePenetration: 0,
  additionalAttackChance: 0,
  criticalChance: 0,
  criticalDamageMultiplier: 0,
};

// 새로운 데미지 계산 (퍼센트 기반 방어력)
function calculateDamage(attack, defense, defensePenetration = 0) {
  const effectiveDefense = Math.max(0, defense - defensePenetration);
  const damageReduction = effectiveDefense / (effectiveDefense + 100);
  return Math.max(
    Math.floor(attack * 0.1), // 최소 10% 데미지 보장
    Math.floor(attack * (1 - damageReduction))
  );
}

// 턴 제한 계산
function calculateTurnLimit(stage) {
  const baseTurnLimit = 30;
  const turnLimitReduction = 0.1;
  const minTurnLimit = 10;
  const reduction = Math.floor((stage - 1) * turnLimitReduction);
  return Math.max(minTurnLimit, baseTurnLimit - reduction);
}

// 보스 스탯 계산 (새로운 로직)
function calculateBossStats(stage) {
  const playerAttack = 10; // 기본 장비 공격력
  const playerDefense = 15; // 기본 장비 방어력
  const playerDefensePenetration = 0; // 기본 장비는 방어 무시 없음

  const turnLimit = calculateTurnLimit(stage);

  // 목표: 초반 10스테이지는 매우 쉽게 클리어 가능
  let targetTurnsRatio;
  if (stage <= 10) {
    targetTurnsRatio = 0.1; // 10% 턴 내에 처치 (3턴 내외로 매우 쉽게)
  } else {
    targetTurnsRatio = 0.75; // 75% 턴 내에 처치
  }
  const targetTurns = Math.max(1, Math.floor(turnLimit * targetTurnsRatio));

  // 보스 방어력: 초반 10스테이지는 방어력 완전히 없음
  let bossDefense = 0;

  // 실제 플레이어 데미지 계산
  const playerDamagePerTurn = calculateDamage(
    playerAttack,
    bossDefense,
    playerDefensePenetration
  );

  // 보스 HP: 목표 턴 수 * 플레이어 데미지
  const bossHP = Math.floor(playerDamagePerTurn * targetTurns);

  // 보스 공격력: 플레이어가 매우 오래 생존 가능하도록
  const playerHP = 100 + playerDefense * 2; // 130 HP
  let survivalTurns;
  if (stage <= 10) {
    survivalTurns = 100; // 1-10 스테이지는 100턴 생존 (거의 죽지 않음)
  } else {
    survivalTurns = 8; // 후반 스테이지는 8턴 생존
  }
  const bossAttack = Math.floor(playerHP / survivalTurns);

  return {
    maxHP: Math.max(10, bossHP),
    attack: Math.max(1, bossAttack),
    defense: Math.max(0, bossDefense),
  };
}

console.log("🎮 기본 장비 기준 밸런스 테스트\n");
console.log("📋 기본 장비 스탯:");
console.log(`  공격력: ${BASIC_EQUIPMENT_STATS.attack}`);
console.log(`  방어력: ${BASIC_EQUIPMENT_STATS.defense}`);
console.log(`  플레이어 HP: ${100 + BASIC_EQUIPMENT_STATS.defense * 2}`);
console.log("");

// 1-10 스테이지 테스트
for (let stage = 1; stage <= 10; stage++) {
  const turnLimit = calculateTurnLimit(stage);
  const bossStats = calculateBossStats(stage);

  // 전투 시뮬레이션
  const playerDamagePerTurn = calculateDamage(
    BASIC_EQUIPMENT_STATS.attack,
    bossStats.defense,
    BASIC_EQUIPMENT_STATS.defensePenetration
  );

  const turnsToKillBoss = Math.ceil(bossStats.maxHP / playerDamagePerTurn);

  const bossDamagePerTurn = calculateDamage(
    bossStats.attack,
    BASIC_EQUIPMENT_STATS.defense
  );

  const playerHP = 100 + BASIC_EQUIPMENT_STATS.defense * 2;
  const playerSurvivalTurns = Math.ceil(playerHP / bossDamagePerTurn);

  const canWin =
    turnsToKillBoss <= turnLimit && turnsToKillBoss <= playerSurvivalTurns;

  console.log(`📊 스테이지 ${stage}:`);
  console.log(`  턴 제한: ${turnLimit}턴`);
  console.log(
    `  보스 HP: ${bossStats.maxHP}, 공격: ${bossStats.attack}, 방어: ${bossStats.defense}`
  );
  console.log(`  플레이어 데미지/턴: ${playerDamagePerTurn}`);
  console.log(`  보스 데미지/턴: ${bossDamagePerTurn}`);
  console.log(`  보스 처치 소요: ${turnsToKillBoss}턴`);
  console.log(`  플레이어 생존: ${playerSurvivalTurns}턴`);
  console.log(`  결과: ${canWin ? "✅ 승리 가능" : "❌ 승리 불가능"}`);
  console.log("");
}

console.log("🎯 목표 달성 여부:");
console.log("- 1-10 스테이지를 기본 장비만으로 클리어 가능한가?");

let allStagesClearable = true;
for (let stage = 1; stage <= 10; stage++) {
  const turnLimit = calculateTurnLimit(stage);
  const bossStats = calculateBossStats(stage);

  const playerDamagePerTurn = calculateDamage(
    BASIC_EQUIPMENT_STATS.attack,
    bossStats.defense,
    BASIC_EQUIPMENT_STATS.defensePenetration
  );

  const turnsToKillBoss = Math.ceil(bossStats.maxHP / playerDamagePerTurn);

  const bossDamagePerTurn = calculateDamage(
    bossStats.attack,
    BASIC_EQUIPMENT_STATS.defense
  );

  const playerHP = 100 + BASIC_EQUIPMENT_STATS.defense * 2;
  const playerSurvivalTurns = Math.ceil(playerHP / bossDamagePerTurn);

  const canWin =
    turnsToKillBoss <= turnLimit && turnsToKillBoss <= playerSurvivalTurns;

  if (!canWin) {
    allStagesClearable = false;
    break;
  }
}

console.log(
  `${
    allStagesClearable
      ? "✅ 모든 초반 스테이지 클리어 가능!"
      : "❌ 일부 스테이지 클리어 불가능"
  }`
);
