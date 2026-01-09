// 물약 등급별 기본 스텟 표시
console.log("=== 물약 등급별 기본 스텟 ===\n");

const ItemGrade = {
  COMMON: "common",
  RARE: "rare",
  EPIC: "epic",
  LEGENDARY: "legendary",
  MYTHIC: "mythic",
};

const ItemType = {
  WEALTH_POTION: "wealthPotion",
  BOSS_POTION: "bossPotion",
  ARTISAN_POTION: "artisanPotion",
};

// 등급별 기본 스텟
const GRADE_BASE_STATS = {
  [ItemGrade.COMMON]: {
    creditPerSecondBonus: 2,
    criticalDamageMultiplier: 0.2, // 20%
    criticalChance: 0.05, // 5%
  },
  [ItemGrade.RARE]: {
    creditPerSecondBonus: 5,
    criticalDamageMultiplier: 0.4, // 40%
    criticalChance: 0.1, // 10%
  },
  [ItemGrade.EPIC]: {
    creditPerSecondBonus: 10,
    criticalDamageMultiplier: 0.8, // 80%
    criticalChance: 0.15, // 15%
  },
  [ItemGrade.LEGENDARY]: {
    creditPerSecondBonus: 20,
    criticalDamageMultiplier: 1.5, // 150%
    criticalChance: 0.25, // 25%
  },
  [ItemGrade.MYTHIC]: {
    creditPerSecondBonus: 35,
    criticalDamageMultiplier: 2.5, // 250%
    criticalChance: 0.4, // 40%
  },
};

// 물약별 기본 스텟 (어떤 스탯이 적용되는지)
const ITEM_BASE_STATS = {
  [ItemType.WEALTH_POTION]: {
    creditPerSecondBonus: 5, // 이 스탯만 적용됨
    criticalDamageMultiplier: 0,
    criticalChance: 0,
  },
  [ItemType.BOSS_POTION]: {
    creditPerSecondBonus: 0,
    criticalDamageMultiplier: 0.5, // 이 스탯만 적용됨
    criticalChance: 0,
  },
  [ItemType.ARTISAN_POTION]: {
    creditPerSecondBonus: 0,
    criticalDamageMultiplier: 0,
    criticalChance: 0.1, // 이 스탯만 적용됨
  },
};

const gradeNames = {
  [ItemGrade.COMMON]: "일반",
  [ItemGrade.RARE]: "레어",
  [ItemGrade.EPIC]: "에픽",
  [ItemGrade.LEGENDARY]: "전설",
  [ItemGrade.MYTHIC]: "신화",
};

const potionNames = {
  [ItemType.WEALTH_POTION]: "재물 물약",
  [ItemType.BOSS_POTION]: "보스 물약",
  [ItemType.ARTISAN_POTION]: "장인 물약",
};

// 각 물약별로 등급별 스탯 표시
Object.entries(potionNames).forEach(([type, name]) => {
  console.log(`📋 ${name} (${type})`);
  console.log("등급 | 기본값 | +랜덤(1~5) | 최종 범위");
  console.log("----|-------|-----------|----------");

  Object.entries(gradeNames).forEach(([grade, gradeName]) => {
    const baseStats = ITEM_BASE_STATS[type];
    const gradeStats = GRADE_BASE_STATS[grade];

    let statValue = 0;
    let statName = "";
    let unit = "";

    if (baseStats.creditPerSecondBonus > 0) {
      statValue = gradeStats.creditPerSecondBonus;
      statName = "크레딧/초";
      unit = "";
    } else if (baseStats.criticalDamageMultiplier > 0) {
      statValue = gradeStats.criticalDamageMultiplier;
      statName = "크리데미지";
      unit = "%";
      statValue = statValue * 100; // 퍼센트로 변환
    } else if (baseStats.criticalChance > 0) {
      statValue = gradeStats.criticalChance;
      statName = "크리확률";
      unit = "%";
      statValue = statValue * 100; // 퍼센트로 변환
    }

    const minValue = statValue + (unit === "%" ? 1 : 1); // 랜덤 최소값 (1% 또는 1)
    const maxValue = statValue + (unit === "%" ? 5 : 5); // 랜덤 최대값 (5% 또는 5)

    console.log(
      `${gradeName.padEnd(4)} | ${statValue.toString().padStart(5)}${unit} | +${
        unit === "%" ? "1~5" : "1~5"
      }${unit.padEnd(2)} | ${minValue}~${maxValue}${unit}`
    );
  });
  console.log("");
});

console.log("💡 참고사항:");
console.log("- 각 물약은 해당하는 스탯만 적용됩니다");
console.log("- 랜덤 보너스는 가챠/드랍 시 1~5 추가됩니다");
console.log(
  "- 크리티컬 관련 스탯은 퍼센트 단위로 표시됩니다 (1~5% 랜덤 보너스)"
);
console.log("- 스테이지가 높을수록 추가 배율이 적용됩니다");
