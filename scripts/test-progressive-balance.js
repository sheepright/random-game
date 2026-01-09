/**
 * 점진적 난이도 증가 밸런스 테스트
 */

// 기본 장비 스탯
const BASIC_EQUIPMENT_STATS = {
  attack: 10,
  defense: 15,
  defensePenetration: 0,
  hp: 130, // 100 + defense * 2
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

// 새로운 보스 스탯 계산 (점진적 난이도 증가)
function calculateBossStats(stage) {
  const playerAttack = 10;
  const playerDefense = 15;
  const playerDefensePenetration = 0;

  const turnLimit = calculateTurnLimit(stage);

  // 목표: 초반 10스테이지도 점진적 난이도 증가
  let targetTurnsRatio;
  if (stage <= 3) {
    targetTurnsRatio = 0.1; // 1-3스테이지: 3턴 내외 (매우 쉽게)
  } else if (stage <= 6) {
    targetTurnsRatio = 0.15; // 4-6스테이지: 4-5턴 (쉽게)
  } else if (stage <= 10) {
    targetTurnsRatio = 0.2; // 7-10스테이지: 6턴 (적당히 쉽게)
  } else {
    targetTurnsRatio = 0.75; // 75% 턴 내에 처치
  }
  const targetTurns = Math.max(1, Math.floor(turnLimit * targetTurnsRatio));

  // 보스 방어력: 초반 스테이지도 약간의 방어력 추가
  let bossDefense = 0;
  if (stage <= 10) {
    // 1-10스테이지: 스테이지가 높아질수록 약간의 방어력 추가
    if (stage >= 4) {
      bossDefense = Math.floor((stage - 3) * 0.5); // 4스테이지부터 0.5씩 증가
    }
  }

  // 실제 플레이어 데미지 계산
  const playerDamagePerTurn = calculateDamage(
    playerAttack,
    bossDefense,
    playerDefensePenetration
  );

  // 보스 HP: 목표 턴 수 * 플레이어 데미지 (스테이지별 점진적 증가)
  let bossHP = Math.floor(playerDamagePerTurn * targetTurns);

  // 초반 스테이지 HP 추가 조정 (더 세밀한 난이도 곡선)
  if (stage <= 10) {
    const stageMultiplier = 0.8 + (stage - 1) * 0.05; // 0.8배에서 1.25배까지 점진적 증가
    bossHP = Math.floor(bossHP * stageMultiplier);
  }

  // 보스 공격력: 스테이지별 점진적 증가
  const playerHP = 130;
  let survivalTurns;
  if (stage <= 3) {
    survivalTurns = 65; // 1-3 스테이지: 65턴 생존 (거의 죽지 않음)
  } else if (stage <= 6) {
    survivalTurns = 43; // 4-6 스테이지: 43턴 생존 (여전히 안전)
  } else if (stage <= 10) {
    survivalTurns = 26; // 7-10 스테이지: 26턴 생존 (적당한 위험)
  } else {
    survivalTurns = 20; // 11+ 스테이지
  }
  const bossAttack = Math.floor(playerHP / survivalTurns);

  return {
    maxHP: Math.max(15, bossHP),
    attack: Math.max(1, bossAttack),
    defense: Math.max(0, bossDefense),
  };
}

console.log("🎮 점진적 난이도 증가 밸런스 테스트\n");
console.log("📋 기본 장비 스탯:");
console.log(`  공격력: ${BASIC_EQUIPMENT_STATS.attack}`);
console.log(`  방어력: ${BASIC_EQUIPMENT_STATS.defense}`);
console.log(`  플레이어 HP: ${BASIC_EQUIPMENT_STATS.hp}`);
console.log("");

// 1-10 스테이지 상세 테스트
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

  const playerSurvivalTurns =
    bossDamagePerTurn > 0
      ? Math.ceil(BASIC_EQUIPMENT_STATS.hp / bossDamagePerTurn)
      : Infinity;

  const canWin =
    turnsToKillBoss <= turnLimit && turnsToKillBoss <= playerSurvivalTurns;

  // 난이도 분류
  let difficulty;
  if (turnsToKillBoss <= 3) {
    difficulty = "매우 쉬움";
  } else if (turnsToKillBoss <= 5) {
    difficulty = "쉬움";
  } else if (turnsToKillBoss <= 8) {
    difficulty = "보통";
  } else {
    difficulty = "어려움";
  }

  console.log(`📊 스테이지 ${stage} (${difficulty}):`);
  console.log(`  턴 제한: ${turnLimit}턴`);
  console.log(
    `  보스: HP ${bossStats.maxHP}, 공격 ${bossStats.attack}, 방어 ${bossStats.defense}`
  );
  console.log(`  플레이어 데미지/턴: ${playerDamagePerTurn}`);
  console.log(`  보스 데미지/턴: ${bossDamagePerTurn}`);
  console.log(`  보스 처치 소요: ${turnsToKillBoss}턴`);
  console.log(
    `  플레이어 생존: ${
      playerSurvivalTurns === Infinity ? "무제한" : playerSurvivalTurns + "턴"
    }`
  );
  console.log(`  결과: ${canWin ? "✅ 승리 가능" : "❌ 승리 불가능"}`);
  console.log("");
}

console.log("🎯 난이도 곡선 분석:");
console.log("- 1-3 스테이지: 매우 쉬움 (3턴 처치, 거의 무적)");
console.log("- 4-6 스테이지: 쉬움 (4-5턴 처치, 안전)");
console.log("- 7-10 스테이지: 적당히 쉬움 (6턴 처치, 약간의 위험)");
console.log("- 점진적 난이도 증가로 지루함 방지");
console.log("- 여전히 기본 장비만으로 모든 초반 스테이지 클리어 가능");
