/**
 * 플레이어 예상 스탯 계산 스크립트 (수정된 버전)
 * 스테이지별 예상 장비 수준에 따른 플레이어 스탯을 계산
 */

// 등급별 기본 스탯
const GRADE_BASE_STATS = {
  common: {
    attack: 10,
    defense: 5,
    defensePenetration: 2,
    additionalAttackChance: 0.01,
    criticalDamageMultiplier: 0.2,
    criticalChance: 0.05,
  },
  rare: {
    attack: 30,
    defense: 15,
    defensePenetration: 6,
    additionalAttackChance: 0.03,
    criticalDamageMultiplier: 0.4,
    criticalChance: 0.1,
  },
  epic: {
    attack: 60,
    defense: 30,
    defensePenetration: 12,
    additionalAttackChance: 0.06,
    criticalDamageMultiplier: 0.8,
    criticalChance: 0.15,
  },
  legendary: {
    attack: 120,
    defense: 60,
    defensePenetration: 24,
    additionalAttackChance: 0.12,
    criticalDamageMultiplier: 1.5,
    criticalChance: 0.25,
  },
  mythic: {
    attack: 200,
    defense: 100,
    defensePenetration: 40,
    additionalAttackChance: 0.2,
    criticalDamageMultiplier: 2.5,
    criticalChance: 0.4,
  },
};

// 강화 스탯 증가량 계산
function calculateEnhancementBonus(grade, enhancementLevel, statType) {
  if (enhancementLevel === 0) return 0;

  const baseIncrease = {
    common: 3.0,
    rare: 5.0,
    epic: 8.0,
    legendary: 12.0,
    mythic: 18.0,
  };

  let levelMultiplier;
  if (enhancementLevel <= 5) {
    levelMultiplier = 1.2;
  } else if (enhancementLevel <= 10) {
    levelMultiplier = 1.5 + (enhancementLevel - 5) * 0.15;
  } else if (enhancementLevel <= 15) {
    levelMultiplier = 2.5 + (enhancementLevel - 10) * 0.25;
  } else if (enhancementLevel <= 19) {
    levelMultiplier = 4.0 + (enhancementLevel - 15) * 0.4;
  } else {
    const levelAbove20 = enhancementLevel - 19;
    levelMultiplier = 6.5 + levelAbove20 * 1.5;
  }

  const baseValue = baseIncrease[grade] * levelMultiplier;

  switch (statType) {
    case "attack":
    case "defense":
    case "defensePenetration":
      return Math.max(3, Math.floor(baseValue));
    case "additionalAttackChance":
      return Math.max(0.003, baseValue * 0.0015);
    case "criticalDamageMultiplier":
      return Math.max(0.01, baseValue * 0.01);
    case "criticalChance":
      return Math.max(0.005, baseValue * 0.005);
    default:
      return 0;
  }
}

// 스테이지별 예상 장비 수준 정의
function getExpectedGearLevel(stage) {
  if (stage <= 10) {
    return { grade: "common", enhancement: Math.min(5, Math.floor(stage / 2)) };
  } else if (stage <= 20) {
    return {
      grade: "rare",
      enhancement: Math.min(8, Math.floor((stage - 10) / 2) + 3),
    };
  } else if (stage <= 40) {
    return {
      grade: "epic",
      enhancement: Math.min(12, Math.floor((stage - 20) / 3) + 5),
    };
  } else if (stage <= 70) {
    return {
      grade: "legendary",
      enhancement: Math.min(18, Math.floor((stage - 40) / 4) + 8),
    };
  } else {
    return {
      grade: "mythic",
      enhancement: Math.min(25, Math.floor((stage - 70) / 5) + 12),
    };
  }
}

// 플레이어 총 스탯 계산 (올바른 방식)
function calculatePlayerStats(stage) {
  const gearLevel = getExpectedGearLevel(stage);
  const grade = gearLevel.grade;
  const enhancement = gearLevel.enhancement;

  const stats = {
    attack: 0,
    defense: 0,
    defensePenetration: 0,
    additionalAttackChance: 0,
    criticalDamageMultiplier: 0,
    criticalChance: 0,
  };

  // 각 장비 슬롯별 스탯 계산 (올바른 매핑)
  const equipmentSlots = [
    // 방어구 (방어력)
    { type: "helmet", primaryStat: "defense" },
    { type: "armor", primaryStat: "defense" },
    { type: "pants", primaryStat: "defense" },

    // 방어구 (추가타격)
    { type: "gloves", primaryStat: "additionalAttackChance" },
    { type: "shoes", primaryStat: "additionalAttackChance" },
    { type: "shoulder", primaryStat: "additionalAttackChance" },

    // 장신구 (방어력 무시)
    { type: "earring", primaryStat: "defensePenetration" },
    { type: "ring", primaryStat: "defensePenetration" },
    { type: "necklace", primaryStat: "defensePenetration" },

    // 무기 (공격력)
    { type: "mainWeapon", primaryStat: "attack" },
    { type: "subWeapon", primaryStat: "attack" },
    { type: "pet", primaryStat: "attack" },

    // 물약
    { type: "bossPotion", primaryStat: "criticalDamageMultiplier" },
    { type: "artisanPotion", primaryStat: "criticalChance" },
  ];

  equipmentSlots.forEach((slot) => {
    const baseStats = GRADE_BASE_STATS[grade];
    const primaryStat = slot.primaryStat;

    // 기본 스탯 + 랜덤 보너스 (평균 3)
    const baseValue = baseStats[primaryStat] + 3;

    // 강화 보너스 (해당 아이템의 주요 스탯에만 적용)
    const enhancementBonus = calculateEnhancementBonus(
      grade,
      enhancement,
      primaryStat
    );

    // 해당 스탯에 추가
    stats[primaryStat] += baseValue + enhancementBonus;
  });

  // 추가타격 확률 최대 50% 제한
  stats.additionalAttackChance = Math.min(0.5, stats.additionalAttackChance);

  return {
    stage,
    grade,
    enhancement,
    stats,
    // 실제 DPS 계산 (크리티컬 고려)
    effectiveDPS:
      stats.attack *
      (1 + stats.criticalChance * stats.criticalDamageMultiplier) *
      (1 + stats.additionalAttackChance),
  };
}

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

console.log("🎮 스테이지별 플레이어 예상 스탯 분석 (수정된 버전)\n");

// 주요 스테이지별 분석
const keyStages = [1, 5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100];

keyStages.forEach((stage) => {
  const playerStats = calculatePlayerStats(stage);
  const turnLimit = calculateTurnLimit(stage);

  console.log(`📊 스테이지 ${stage}:`);
  console.log(`  예상 장비: ${playerStats.grade} +${playerStats.enhancement}`);
  console.log(`  공격력: ${playerStats.stats.attack}`);
  console.log(`  방어력: ${playerStats.stats.defense}`);
  console.log(`  방어력 무시: ${playerStats.stats.defensePenetration}`);
  console.log(
    `  추가타격: ${(playerStats.stats.additionalAttackChance * 100).toFixed(
      1
    )}%`
  );
  console.log(
    `  크리티컬 확률: ${(playerStats.stats.criticalChance * 100).toFixed(1)}%`
  );
  console.log(
    `  크리티컬 데미지: ${(
      playerStats.stats.criticalDamageMultiplier * 100
    ).toFixed(1)}%`
  );
  console.log(`  실효 DPS: ${Math.floor(playerStats.effectiveDPS)}`);
  console.log(`  턴 제한: ${turnLimit}턴`);
  console.log("");
});

// 보스 스탯 권장사항 계산
console.log("🏆 권장 보스 스탯 (스테이지별):\n");

keyStages.forEach((stage) => {
  const playerStats = calculatePlayerStats(stage);
  const turnLimit = calculateTurnLimit(stage);

  // 보스 HP: 플레이어가 턴 제한의 70-80% 내에 처치할 수 있도록
  const targetTurns = Math.floor(turnLimit * 0.75);
  const recommendedBossHP = Math.floor(
    playerStats.effectiveDPS * targetTurns * 0.7
  ); // 크리티컬 운빨 고려

  // 보스 공격력: 플레이어 HP의 15-20% 정도 (5-7턴 생존)
  const playerHP = 100 + playerStats.stats.defense * 2;
  const recommendedBossAttack = Math.floor(playerHP * 0.18);

  // 보스 방어력: 플레이어 공격력의 20-30% 정도 감소시키도록
  const targetDamageReduction = 0.25;
  const recommendedBossDefense = Math.floor(
    (playerStats.stats.attack * targetDamageReduction) /
      (1 - targetDamageReduction)
  );

  console.log(`스테이지 ${stage}:`);
  console.log(`  권장 보스 HP: ${recommendedBossHP.toLocaleString()}`);
  console.log(`  권장 보스 공격력: ${recommendedBossAttack}`);
  console.log(`  권장 보스 방어력: ${recommendedBossDefense}`);

  // 실제 전투 시뮬레이션
  const actualDamage = calculateDamage(
    playerStats.stats.attack,
    recommendedBossDefense,
    playerStats.stats.defensePenetration
  );
  const turnsToKill = Math.ceil(recommendedBossHP / actualDamage);
  const playerDamagePerTurn = calculateDamage(
    recommendedBossAttack,
    playerStats.stats.defense
  );
  const playerSurvivalTurns = Math.ceil(playerHP / playerDamagePerTurn);

  console.log(`  실제 처치 턴: ${turnsToKill}턴 (제한: ${turnLimit}턴)`);
  console.log(`  플레이어 생존: ${playerSurvivalTurns}턴`);
  console.log(
    `  밸런스: ${
      turnsToKill <= turnLimit && playerSurvivalTurns >= turnsToKill
        ? "✅ 적절"
        : "❌ 조정 필요"
    }`
  );
  console.log("");
});
