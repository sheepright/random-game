/**
 * 모든 아이템의 기본 스텟 표시 스크립트
 */

// 등급별 기본 스탯 (constants/game.ts에서 복사)
const GRADE_BASE_STATS = {
  common: {
    attack: 10,
    defense: 5,
    defensePenetration: 2,
    additionalAttackChance: 0.01, // 1%
    creditPerSecondBonus: 2,
    criticalDamageMultiplier: 0.2, // 20%
    criticalChance: 0.05, // 5%
  },
  rare: {
    attack: 30,
    defense: 15,
    defensePenetration: 6,
    additionalAttackChance: 0.03, // 3%
    creditPerSecondBonus: 5,
    criticalDamageMultiplier: 0.4, // 40%
    criticalChance: 0.1, // 10%
  },
  epic: {
    attack: 60,
    defense: 30,
    defensePenetration: 12,
    additionalAttackChance: 0.06, // 6%
    creditPerSecondBonus: 10,
    criticalDamageMultiplier: 0.8, // 80%
    criticalChance: 0.15, // 15%
  },
  legendary: {
    attack: 120,
    defense: 60,
    defensePenetration: 24,
    additionalAttackChance: 0.12, // 12%
    creditPerSecondBonus: 20,
    criticalDamageMultiplier: 1.5, // 150%
    criticalChance: 0.25, // 25%
  },
  mythic: {
    attack: 200,
    defense: 100,
    defensePenetration: 40,
    additionalAttackChance: 0.2, // 20%
    creditPerSecondBonus: 35,
    criticalDamageMultiplier: 2.5, // 250%
    criticalChance: 0.4, // 40%
  },
};

// 아이템 타입별 기본 스탯 (constants/game.ts에서 복사)
const ITEM_BASE_STATS = {
  // 방어구 (방어력)
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

  // 방어구 (추가타격 확률)
  gloves: {
    attack: 0,
    defense: 0,
    defensePenetration: 0,
    additionalAttackChance: 0.02, // 2%
    creditPerSecondBonus: 0,
    criticalDamageMultiplier: 0,
    criticalChance: 0,
  },
  shoes: {
    attack: 0,
    defense: 0,
    defensePenetration: 0,
    additionalAttackChance: 0.015, // 1.5%
    creditPerSecondBonus: 0,
    criticalDamageMultiplier: 0,
    criticalChance: 0,
  },
  shoulder: {
    attack: 0,
    defense: 0,
    defensePenetration: 0,
    additionalAttackChance: 0.025, // 2.5%
    creditPerSecondBonus: 0,
    criticalDamageMultiplier: 0,
    criticalChance: 0,
  },

  // 장신구 (방어력 무시)
  earring: {
    attack: 0,
    defense: 0,
    defensePenetration: 3,
    additionalAttackChance: 0,
    creditPerSecondBonus: 0,
    criticalDamageMultiplier: 0,
    criticalChance: 0,
  },
  ring: {
    attack: 0,
    defense: 0,
    defensePenetration: 2,
    additionalAttackChance: 0,
    creditPerSecondBonus: 0,
    criticalDamageMultiplier: 0,
    criticalChance: 0,
  },
  necklace: {
    attack: 0,
    defense: 0,
    defensePenetration: 4,
    additionalAttackChance: 0,
    creditPerSecondBonus: 0,
    criticalDamageMultiplier: 0,
    criticalChance: 0,
  },

  // 무기 (공격력)
  mainWeapon: {
    attack: 10,
    defense: 0,
    defensePenetration: 0,
    additionalAttackChance: 0,
    creditPerSecondBonus: 0,
    criticalDamageMultiplier: 0,
    criticalChance: 0,
  },
  subWeapon: {
    attack: 6,
    defense: 0,
    defensePenetration: 0,
    additionalAttackChance: 0,
    creditPerSecondBonus: 0,
    criticalDamageMultiplier: 0,
    criticalChance: 0,
  },

  // 펫 (공격력)
  pet: {
    attack: 8,
    defense: 0,
    defensePenetration: 0,
    additionalAttackChance: 0,
    creditPerSecondBonus: 0,
    criticalDamageMultiplier: 0,
    criticalChance: 0,
  },

  // 물약들
  wealthPotion: {
    attack: 0,
    defense: 0,
    defensePenetration: 0,
    additionalAttackChance: 0,
    creditPerSecondBonus: 5, // 초당 5 크레딧 보너스
    criticalDamageMultiplier: 0,
    criticalChance: 0,
  },
  bossPotion: {
    attack: 0,
    defense: 0,
    defensePenetration: 0,
    additionalAttackChance: 0,
    creditPerSecondBonus: 0,
    criticalDamageMultiplier: 0.5, // 50% 크리티컬 데미지 증가
    criticalChance: 0,
  },
  artisanPotion: {
    attack: 0,
    defense: 0,
    defensePenetration: 0,
    additionalAttackChance: 0,
    creditPerSecondBonus: 0,
    criticalDamageMultiplier: 0,
    criticalChance: 0.1, // 10% 크리티컬 확률
  },
};

// 아이템 타입 한글 이름
const ITEM_TYPE_NAMES = {
  helmet: "헬멧",
  armor: "아머",
  pants: "팬츠",
  gloves: "글러브",
  shoes: "슈즈",
  shoulder: "숄더",
  earring: "귀걸이",
  ring: "반지",
  necklace: "목걸이",
  mainWeapon: "주무기",
  subWeapon: "보조무기",
  pet: "펫",
  wealthPotion: "재물 물약",
  bossPotion: "보스 물약",
  artisanPotion: "장인 물약",
};

// 등급 한글 이름
const GRADE_NAMES = {
  common: "일반",
  rare: "레어",
  epic: "에픽",
  legendary: "전설",
  mythic: "신화",
};

// 아이템 생성 함수
function createItem(type, grade) {
  const baseStats = { ...ITEM_BASE_STATS[type] };
  const gradeBaseStats = GRADE_BASE_STATS[grade];

  // 해당 아이템 타입의 주요 스탯만 등급 기본값 적용
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
    grade,
    baseStats: finalStats,
  };
}

// 스탯 포맷팅 함수
function formatStat(statName, value) {
  if (value === 0) return "";

  switch (statName) {
    case "additionalAttackChance":
    case "criticalChance":
      return `${(value * 100).toFixed(1)}%`;
    case "criticalDamageMultiplier":
      return `${(value * 100).toFixed(0)}%`;
    default:
      return value.toString();
  }
}

console.log("🎮 모든 아이템의 기본 스텟\n");

// 아이템 타입별로 표시
const itemCategories = {
  "🛡️ 방어구 (방어력)": ["helmet", "armor", "pants"],
  "🥊 방어구 (추가타격)": ["gloves", "shoes", "shoulder"],
  "💍 장신구 (방어무시)": ["earring", "ring", "necklace"],
  "⚔️ 무기 (공격력)": ["mainWeapon", "subWeapon", "pet"],
  "🧪 물약": ["wealthPotion", "bossPotion", "artisanPotion"],
};

Object.entries(itemCategories).forEach(([categoryName, itemTypes]) => {
  console.log(`${categoryName}:`);
  console.log("=".repeat(50));

  itemTypes.forEach((itemType) => {
    console.log(`\n📋 ${ITEM_TYPE_NAMES[itemType]}:`);

    // 각 등급별로 표시
    Object.keys(GRADE_NAMES).forEach((grade) => {
      const item = createItem(itemType, grade);
      const stats = item.baseStats;

      // 0이 아닌 스탯만 표시
      const nonZeroStats = [];
      Object.entries(stats).forEach(([statName, value]) => {
        const formatted = formatStat(statName, value);
        if (formatted) {
          let statDisplayName;
          switch (statName) {
            case "attack":
              statDisplayName = "공격력";
              break;
            case "defense":
              statDisplayName = "방어력";
              break;
            case "defensePenetration":
              statDisplayName = "방어무시";
              break;
            case "additionalAttackChance":
              statDisplayName = "추가타격";
              break;
            case "creditPerSecondBonus":
              statDisplayName = "크레딧/초";
              break;
            case "criticalDamageMultiplier":
              statDisplayName = "크리데미지";
              break;
            case "criticalChance":
              statDisplayName = "크리확률";
              break;
            default:
              statDisplayName = statName;
          }
          nonZeroStats.push(`${statDisplayName} ${formatted}`);
        }
      });

      console.log(`  ${GRADE_NAMES[grade]}: ${nonZeroStats.join(", ")}`);
    });
  });

  console.log("\n");
});

console.log("📝 참고사항:");
console.log(
  "- 위 수치는 기본 스탯이며, 실제 드랍/가챠 시 1~5의 랜덤 보너스가 추가됩니다"
);
console.log("- 강화를 통해 스탯을 더욱 증가시킬 수 있습니다");
console.log("- 각 아이템은 해당하는 주요 스탯만 가지며, 나머지 스탯은 0입니다");
