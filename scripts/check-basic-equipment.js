/**
 * 기본 장비 실제 스탯 확인 스크립트
 */

// 등급별 기본 스탯 (constants/game.ts에서 복사)
const GRADE_BASE_STATS = {
  common: {
    attack: 10,
    defense: 5,
    defensePenetration: 2,
    additionalAttackChance: 0.01,
    creditPerSecondBonus: 2,
    criticalDamageMultiplier: 0.2,
    criticalChance: 0.05,
  },
};

// 아이템 타입별 기본 스탯 (constants/game.ts에서 복사)
const ITEM_BASE_STATS = {
  helmet: {
    attack: 0,
    defense: 5,
    defensePenetration: 0,
    additionalAttackChance: 0,
    creditPerSecondBonus: 0,
    criticalDamageMultiplier: 0,
    criticalChance: 0,
  },
  armor: {
    attack: 0,
    defense: 8,
    defensePenetration: 0,
    additionalAttackChance: 0,
    creditPerSecondBonus: 0,
    criticalDamageMultiplier: 0,
    criticalChance: 0,
  },
  pants: {
    attack: 0,
    defense: 6,
    defensePenetration: 0,
    additionalAttackChance: 0,
    creditPerSecondBonus: 0,
    criticalDamageMultiplier: 0,
    criticalChance: 0,
  },
  mainWeapon: {
    attack: 10,
    defense: 0,
    defensePenetration: 0,
    additionalAttackChance: 0,
    creditPerSecondBonus: 0,
    criticalDamageMultiplier: 0,
    criticalChance: 0,
  },
};

// 기본 장비 생성 함수 (constants/game.ts에서 복사)
function createDefaultItem(type) {
  const baseStats = { ...ITEM_BASE_STATS[type] };
  const gradeBaseStats = GRADE_BASE_STATS.common;

  // 기본 아이템은 랜덤 보너스 없이 등급 기본값만 적용
  const finalStats = {
    attack: baseStats.attack > 0 ? gradeBaseStats.attack : 0,
    defense: baseStats.defense > 0 ? gradeBaseStats.defense : 0,
    defensePenetration:
      baseStats.defensePenetration > 0 ? gradeBaseStats.defensePenetration : 0,
    additionalAttackChance:
      baseStats.additionalAttackChance > 0
        ? gradeBaseStats.additionalAttackChance
        : 0,
    creditPerSecondBonus:
      baseStats.creditPerSecondBonus > 0
        ? gradeBaseStats.creditPerSecondBonus
        : 0,
    criticalDamageMultiplier:
      baseStats.criticalDamageMultiplier > 0
        ? gradeBaseStats.criticalDamageMultiplier
        : 0,
    criticalChance:
      baseStats.criticalChance > 0 ? gradeBaseStats.criticalChance : 0,
  };

  return {
    type,
    grade: "common",
    baseStats: finalStats,
    enhancedStats: { ...finalStats },
    level: 1,
    enhancementLevel: 0,
  };
}

console.log("🎮 기본 장비 실제 스탯 확인\n");

// 기본 장비 생성
const defaultEquipment = {
  helmet: createDefaultItem("helmet"),
  armor: createDefaultItem("armor"),
  pants: createDefaultItem("pants"),
  mainWeapon: createDefaultItem("mainWeapon"),
};

console.log("📋 기본 장비 개별 스탯:");
Object.entries(defaultEquipment).forEach(([slot, item]) => {
  console.log(`${slot}:`);
  console.log(`  공격력: ${item.baseStats.attack}`);
  console.log(`  방어력: ${item.baseStats.defense}`);
  console.log(`  방어력 무시: ${item.baseStats.defensePenetration}`);
  console.log(
    `  추가타격 확률: ${(item.baseStats.additionalAttackChance * 100).toFixed(
      1
    )}%`
  );
  console.log(
    `  크리티컬 확률: ${(item.baseStats.criticalChance * 100).toFixed(1)}%`
  );
  console.log(
    `  크리티컬 데미지: ${(
      item.baseStats.criticalDamageMultiplier * 100
    ).toFixed(1)}%`
  );
  console.log("");
});

// 총합 계산
const totalStats = {
  attack: 0,
  defense: 0,
  defensePenetration: 0,
  additionalAttackChance: 0,
  creditPerSecondBonus: 0,
  criticalDamageMultiplier: 0,
  criticalChance: 0,
};

Object.values(defaultEquipment).forEach((item) => {
  totalStats.attack += item.baseStats.attack;
  totalStats.defense += item.baseStats.defense;
  totalStats.defensePenetration += item.baseStats.defensePenetration;
  totalStats.additionalAttackChance += item.baseStats.additionalAttackChance;
  totalStats.creditPerSecondBonus += item.baseStats.creditPerSecondBonus;
  totalStats.criticalDamageMultiplier +=
    item.baseStats.criticalDamageMultiplier;
  totalStats.criticalChance += item.baseStats.criticalChance;
});

console.log("🏆 기본 장비 총합 스탯:");
console.log(`  총 공격력: ${totalStats.attack}`);
console.log(`  총 방어력: ${totalStats.defense}`);
console.log(`  총 방어력 무시: ${totalStats.defensePenetration}`);
console.log(
  `  총 추가타격 확률: ${(totalStats.additionalAttackChance * 100).toFixed(1)}%`
);
console.log(
  `  총 크리티컬 확률: ${(totalStats.criticalChance * 100).toFixed(1)}%`
);
console.log(
  `  총 크리티컬 데미지: ${(totalStats.criticalDamageMultiplier * 100).toFixed(
    1
  )}%`
);
console.log("");

// 플레이어 기본 스탯 추가 (100 HP + 방어력 * 2)
const playerHP = 100 + totalStats.defense * 2;
console.log(`💪 플레이어 기본 정보:`);
console.log(`  기본 HP: ${playerHP}`);
console.log(`  실제 공격력: ${totalStats.attack} (기본 장비만)`);
console.log(`  실제 방어력: ${totalStats.defense} (기본 장비만)`);
