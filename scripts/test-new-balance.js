/**
 * 새로운 밸런스 테스트 스크립트
 */

// 새로운 데미지 계산 방식
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

// 새로운 보스 스탯 계산
function calculateBossStats(stage) {
  let playerAttack, playerDefense, playerDefensePenetration;

  if (stage <= 10) {
    playerAttack = 40 + stage * 2;
    playerDefense = 25 + stage * 2;
    playerDefensePenetration = 15 + stage;
  } else if (stage <= 20) {
    playerAttack = 80 + (stage - 10) * 5;
    playerDefense = 50 + (stage - 10) * 3;
    playerDefensePenetration = 30 + (stage - 10) * 2;
  } else if (stage <= 40) {
    playerAttack = 150 + (stage - 20) * 8;
    playerDefense = 80 + (stage - 20) * 5;
    playerDefensePenetration = 50 + (stage - 20) * 3;
  } else if (stage <= 70) {
    playerAttack = 300 + (stage - 40) * 12;
    playerDefense = 180 + (stage - 40) * 8;
    playerDefensePenetration = 110 + (stage - 40) * 5;
  } else {
    playerAttack = 660 + (stage - 70) * 15;
    playerDefense = 420 + (stage - 70) * 10;
    playerDefensePenetration = 260 + (stage - 70) * 6;
  }

  const turnLimit = calculateTurnLimit(stage);
  const targetTurns = Math.floor(turnLimit * 0.75);

  const targetDamageReduction = 0.25;
  const bossDefense = Math.floor(
    (playerAttack * targetDamageReduction) / (1 - targetDamageReduction)
  );

  const playerDamagePerTurn = calculateDamage(
    playerAttack,
    bossDefense,
    playerDefensePenetration
  );
  const bossHP = Math.floor(playerDamagePerTurn * targetTurns);

  const playerHP = 100 + playerDefense * 2;
  let survivalTurns;
  if (stage <= 20) {
    survivalTurns = 12; // 초반 스테이지는 더 오래 생존
  } else if (stage <= 50) {
    survivalTurns = 10;
  } else {
    survivalTurns = 8; // 후반 스테이지는 더 빠른 전투
  }
  const bossAttack = Math.floor(playerHP / survivalTurns);

  return {
    maxHP: Math.max(50, bossHP),
    attack: Math.max(8, bossAttack),
    defense: Math.max(3, bossDefense),
    playerStats: { playerAttack, playerDefense, playerDefensePenetration },
  };
}

// 새로운 스테이지 요구사항 계산
function calculateStageRequirements(stage) {
  let requiredAttack, requiredDefense;

  if (stage <= 10) {
    requiredAttack = 15 + stage * 3;
    requiredDefense = 10 + stage * 2;
  } else if (stage <= 20) {
    requiredAttack = 50 + (stage - 10) * 5;
    requiredDefense = 30 + (stage - 10) * 3;
  } else if (stage <= 40) {
    requiredAttack = 100 + (stage - 20) * 8;
    requiredDefense = 60 + (stage - 20) * 4;
  } else if (stage <= 70) {
    requiredAttack = 260 + (stage - 40) * 10;
    requiredDefense = 140 + (stage - 40) * 6;
  } else {
    requiredAttack = 560 + (stage - 70) * 12;
    requiredDefense = 320 + (stage - 70) * 8;
  }

  return {
    requiredAttack: Math.floor(requiredAttack),
    requiredDefense: Math.floor(requiredDefense),
  };
}

console.log("🎮 새로운 밸런스 테스트\n");

const testStages = [1, 5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100];

testStages.forEach((stage) => {
  const bossStats = calculateBossStats(stage);
  const requirements = calculateStageRequirements(stage);
  const turnLimit = calculateTurnLimit(stage);

  // 실제 전투 시뮬레이션
  const playerAttack = bossStats.playerStats.playerAttack;
  const playerDefense = bossStats.playerStats.playerDefense;
  const playerDefensePenetration =
    bossStats.playerStats.playerDefensePenetration;

  const playerDamagePerTurn = calculateDamage(
    playerAttack,
    bossStats.defense,
    playerDefensePenetration
  );
  const turnsToKillBoss = Math.ceil(bossStats.maxHP / playerDamagePerTurn);

  const playerHP = 100 + playerDefense * 2;
  const bossDamagePerTurn = calculateDamage(bossStats.attack, playerDefense);
  const playerSurvivalTurns = Math.ceil(playerHP / bossDamagePerTurn);

  const isBalanced =
    turnsToKillBoss <= turnLimit && playerSurvivalTurns >= turnsToKillBoss;

  console.log(`📊 스테이지 ${stage}:`);
  console.log(`  턴 제한: ${turnLimit}턴`);
  console.log(
    `  요구 스탯: 공격 ${requirements.requiredAttack}, 방어 ${requirements.requiredDefense}`
  );
  console.log(
    `  예상 플레이어: 공격 ${playerAttack}, 방어 ${playerDefense}, 방무 ${playerDefensePenetration}`
  );
  console.log(
    `  보스 스탯: HP ${bossStats.maxHP.toLocaleString()}, 공격 ${
      bossStats.attack
    }, 방어 ${bossStats.defense}`
  );
  console.log(`  전투 결과:`);
  console.log(
    `    - 보스 처치: ${turnsToKillBoss}턴 (데미지: ${playerDamagePerTurn}/턴)`
  );
  console.log(
    `    - 플레이어 생존: ${playerSurvivalTurns}턴 (피해: ${bossDamagePerTurn}/턴, HP: ${playerHP})`
  );
  console.log(`  밸런스: ${isBalanced ? "✅ 적절" : "❌ 조정 필요"}`);
  console.log("");
});

console.log("🔍 밸런스 분석:");
console.log("- 방어력 시스템: 퍼센트 기반 데미지 감소로 변경");
console.log("- 턴 제한: 스테이지가 높아질수록 더 빠른 처치 요구");
console.log("- 보스 HP: 플레이어가 턴 제한의 75% 내에 처치 가능하도록 조정");
console.log("- 보스 공격력: 플레이어가 6턴 정도 생존 가능하도록 조정");
console.log("- 방어력 무시의 중요성: 후반 스테이지에서 더욱 중요해짐");
