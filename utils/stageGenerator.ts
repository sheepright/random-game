/**
 * Stage generation utilities for 100 stages
 * 100 스테이지 자동 생성 및 밸런스 계산
 */

import { StageInfo, BossInfo, DropRateTable, ItemGrade } from "../types/game";

/**
 * 스테이지별 요구 스탯 계산 (아이템 스텟과 강화를 고려한 대폭 상향 조절)
 */
export function calculateStageRequirements(stage: number): {
  requiredAttack: number;
  requiredDefense: number;
} {
  // 실제 아이템 스텟을 고려한 현실적인 요구 스탯
  // Common: 공격력 10, 방어력 5 (기본 장비)
  // Rare: 공격력 30, 방어력 15 (+ 랜덤 보너스 1~5)
  // Epic: 공격력 60, 방어력 30 (+ 랜덤 보너스 1~5)
  // Legendary: 공격력 120, 방어력 60 (+ 랜덤 보너스 1~5)
  // Mythic: 공격력 200, 방어력 100 (+ 랜덤 보너스 1~5)

  let requiredAttack, requiredDefense;

  if (stage <= 5) {
    // 1-5: 기본 Common 장비로 클리어 가능
    requiredAttack = 8 + stage * 2; // 1스테이지: 10, 5스테이지: 18
    requiredDefense = 20 + stage * 5; // 1스테이지: 25, 5스테이지: 45 (방어력 요구량 증가)
  } else if (stage <= 15) {
    // 6-15: Common 강화 또는 Rare 장비 필요
    requiredAttack = 18 + (stage - 5) * 4; // 6스테이지: 22, 15스테이지: 58
    requiredDefense = 45 + (stage - 5) * 8; // 6스테이지: 53, 15스테이지: 125 (방어력 요구량 증가)
  } else if (stage <= 30) {
    // 16-30: Rare 강화 또는 Epic 장비 필요
    requiredAttack = 58 + (stage - 15) * 8; // 16스테이지: 66, 30스테이지: 178
    requiredDefense = 125 + (stage - 15) * 15; // 16스테이지: 140, 30스테이지: 365 (방어력 요구량 증가)
  } else if (stage <= 50) {
    // 31-50: Epic 강화 또는 Legendary 장비 필요
    requiredAttack = 178 + (stage - 30) * 15; // 31스테이지: 193, 50스테이지: 478
    requiredDefense = 365 + (stage - 30) * 25; // 31스테이지: 390, 50스테이지: 865 (방어력 요구량 증가)
  } else if (stage <= 75) {
    // 51-75: Legendary 강화 또는 Mythic 장비 필요
    requiredAttack = 478 + (stage - 50) * 25; // 51스테이지: 503, 75스테이지: 1128
    requiredDefense = 865 + (stage - 50) * 40; // 51스테이지: 905, 75스테이지: 1865 (방어력 요구량 증가)
  } else {
    // 76-100: Mythic 강화 필수
    requiredAttack = 1128 + (stage - 75) * 40; // 76스테이지: 1168, 100스테이지: 2128
    requiredDefense = 1865 + (stage - 75) * 60; // 76스테이지: 1925, 100스테이지: 3365 (방어력 요구량 증가)
  }

  return {
    requiredAttack: Math.floor(requiredAttack),
    requiredDefense: Math.floor(requiredDefense),
  };
}

/**
 * 보스 스탯 계산 (아이템 스텟과 강화를 고려한 대폭 상향 조절)
 */
export function calculateBossStats(stage: number): {
  maxHP: number;
  attack: number;
  defense: number;
} {
  // 실제 아이템 스텟을 고려한 플레이어 예상 스탯
  let playerAttack, playerDefense, playerDefensePenetration;

  if (stage <= 5) {
    // 1-5: 기본 Common 장비 (강화 없음)
    playerAttack = 24; // 주무기10 + 보조무기6 + 펫8
    playerDefense = 25; // 헬멧5 + 아머8 + 팬츠6 + 약간의 강화 고려
    playerDefensePenetration = 9; // 귀걸이3 + 반지2 + 목걸이4
  } else if (stage <= 15) {
    // 6-15: Common 강화 또는 Rare 장비
    playerAttack = 50 + (stage - 5) * 8; // 6스테이지: 58, 15스테이지: 138
    playerDefense = 50 + (stage - 5) * 10; // 6스테이지: 60, 15스테이지: 150 (방어력 증가)
    playerDefensePenetration = 15 + (stage - 5) * 3; // 6스테이지: 18, 15스테이지: 45
  } else if (stage <= 30) {
    // 16-30: Rare 강화 또는 Epic 장비
    playerAttack = 138 + (stage - 15) * 12; // 16스테이지: 150, 30스테이지: 330
    playerDefense = 150 + (stage - 15) * 15; // 16스테이지: 165, 30스테이지: 375 (방어력 증가)
    playerDefensePenetration = 45 + (stage - 15) * 5; // 16스테이지: 50, 30스테이지: 120
  } else if (stage <= 50) {
    // 31-50: Epic 강화 또는 Legendary 장비
    playerAttack = 330 + (stage - 30) * 20; // 31스테이지: 350, 50스테이지: 730
    playerDefense = 375 + (stage - 30) * 25; // 31스테이지: 400, 50스테이지: 875 (방어력 증가)
    playerDefensePenetration = 120 + (stage - 30) * 8; // 31스테이지: 128, 50스테이지: 288
  } else if (stage <= 75) {
    // 51-75: Legendary 강화 또는 Mythic 장비
    playerAttack = 730 + (stage - 50) * 30; // 51스테이지: 760, 75스테이지: 1510
    playerDefense = 875 + (stage - 50) * 35; // 51스테이지: 910, 75스테이지: 1785 (방어력 증가)
    playerDefensePenetration = 288 + (stage - 50) * 12; // 51스테이지: 300, 75스테이지: 588
  } else {
    // 76-100: Mythic 강화 필수
    playerAttack = 1510 + (stage - 75) * 50; // 76스테이지: 1560, 100스테이지: 2810
    playerDefense = 1785 + (stage - 75) * 50; // 76스테이지: 1835, 100스테이지: 3035 (방어력 증가)
    playerDefensePenetration = 588 + (stage - 75) * 20; // 76스테이지: 608, 100스테이지: 1088
  }

  // 턴 제한 계산 (더 타이트하게)
  const baseTurnLimit = 25;
  const turnLimitReduction = 0.15;
  const minTurnLimit = 8;
  const reduction = Math.floor((stage - 1) * turnLimitReduction);
  const turnLimit = Math.max(minTurnLimit, baseTurnLimit - reduction);

  // 목표 턴 수 비율 (더 어렵게)
  let targetTurnsRatio;
  if (stage <= 3) {
    targetTurnsRatio = 0.2; // 1-3스테이지: 20% 턴 내에 처치
  } else if (stage <= 10) {
    targetTurnsRatio = 0.4; // 4-10스테이지: 40% 턴 내에 처치
  } else if (stage <= 25) {
    targetTurnsRatio = 0.6; // 11-25스테이지: 60% 턴 내에 처치
  } else if (stage <= 50) {
    targetTurnsRatio = 0.75; // 26-50스테이지: 75% 턴 내에 처치
  } else {
    targetTurnsRatio = 0.85; // 51-100스테이지: 85% 턴 내에 처치
  }
  const targetTurns = Math.max(1, Math.floor(turnLimit * targetTurnsRatio));

  // 새로운 데미지 계산 방식 적용
  function calculateDamage(
    attack: number,
    defense: number,
    defensePenetration: number = 0
  ): number {
    const effectiveDefense = Math.max(0, defense - defensePenetration);
    const damageReduction = effectiveDefense / (effectiveDefense + 100);
    return Math.max(
      Math.floor(attack * 0.1), // 최소 10% 데미지 보장
      Math.floor(attack * (1 - damageReduction))
    );
  }

  // 보스 방어력 (더 높게 설정)
  let bossDefense = 0;
  if (stage <= 5) {
    // 1-5스테이지: 낮은 방어력
    bossDefense = Math.floor(stage * 2); // 1스테이지: 2, 5스테이지: 10
  } else if (stage <= 15) {
    // 6-15스테이지: 점진적 증가
    bossDefense = 10 + (stage - 5) * 8; // 6스테이지: 18, 15스테이지: 90
  } else if (stage <= 30) {
    // 16-30스테이지: 중간 방어력
    bossDefense = 90 + (stage - 15) * 15; // 16스테이지: 105, 30스테이지: 315
  } else if (stage <= 50) {
    // 31-50스테이지: 높은 방어력
    bossDefense = 315 + (stage - 30) * 25; // 31스테이지: 340, 50스테이지: 815
  } else if (stage <= 75) {
    // 51-75스테이지: 매우 높은 방어력
    bossDefense = 815 + (stage - 50) * 35; // 51스테이지: 850, 75스테이지: 1725
  } else {
    // 76-100스테이지: 극한 방어력
    bossDefense = 1725 + (stage - 75) * 50; // 76스테이지: 1775, 100스테이지: 3025
  }

  // 실제 플레이어 데미지 계산
  const playerDamagePerTurn = calculateDamage(
    playerAttack,
    bossDefense,
    playerDefensePenetration
  );

  // 보스 HP: 목표 턴 수 * 플레이어 데미지 (더 높게)
  let bossHP = Math.floor(playerDamagePerTurn * targetTurns);

  // 스테이지별 HP 배율 (더 높게)
  if (stage <= 10) {
    const stageMultiplier = 1.2 + (stage - 1) * 0.1; // 1.2배에서 2.1배까지
    bossHP = Math.floor(bossHP * stageMultiplier);
  } else if (stage <= 30) {
    const stageMultiplier = 2.1 + (stage - 10) * 0.05; // 2.1배에서 3.1배까지
    bossHP = Math.floor(bossHP * stageMultiplier);
  } else if (stage <= 60) {
    const stageMultiplier = 3.1 + (stage - 30) * 0.03; // 3.1배에서 4.0배까지
    bossHP = Math.floor(bossHP * stageMultiplier);
  } else {
    const stageMultiplier = 4.0 + (stage - 60) * 0.02; // 4.0배에서 4.8배까지
    bossHP = Math.floor(bossHP * stageMultiplier);
  }

  // 보스 공격력 (방어구의 가치를 높이도록 대폭 상향)
  const playerHP = 100 + playerDefense * 2;
  let survivalTurns;
  if (stage <= 5) {
    survivalTurns = 15; // 1-5 스테이지: 15턴 생존 (25→15)
  } else if (stage <= 15) {
    survivalTurns = 12; // 6-15 스테이지: 12턴 생존 (18→12)
  } else if (stage <= 30) {
    survivalTurns = 8; // 16-30 스테이지: 8턴 생존 (12→8)
  } else if (stage <= 50) {
    survivalTurns = 6; // 31-50 스테이지: 6턴 생존 (8→6)
  } else if (stage <= 75) {
    survivalTurns = 4; // 51-75 스테이지: 4턴 생존 (6→4)
  } else {
    survivalTurns = 3; // 76-100 스테이지: 3턴 생존 (4→3, 매우 위험)
  }

  // 방어구 없이는 생존하기 어렵도록 공격력 추가 증가
  let attackMultiplier = 1.0;
  if (stage <= 10) {
    attackMultiplier = 1.3; // 30% 증가
  } else if (stage <= 25) {
    attackMultiplier = 1.5; // 50% 증가
  } else if (stage <= 50) {
    attackMultiplier = 1.8; // 80% 증가
  } else if (stage <= 75) {
    attackMultiplier = 2.2; // 120% 증가
  } else {
    attackMultiplier = 2.8; // 180% 증가
  }

  const baseBossAttack = Math.floor(playerHP / survivalTurns);
  const bossAttack = Math.floor(baseBossAttack * attackMultiplier);

  return {
    maxHP: Math.max(50, bossHP), // 최소 HP 50
    attack: Math.max(5, bossAttack), // 최소 공격력 5
    defense: Math.max(0, bossDefense), // 최소 방어력 0
  };
}

/**
 * 크레딧 배율 계산 (난이도 상승에 맞춰 보상도 증가)
 */
export function calculateCreditMultiplier(stage: number): number {
  if (stage <= 5) {
    return 1 + (stage - 1) * 0.05; // 스테이지당 5% 증가 (1.00~1.20)
  } else if (stage <= 15) {
    // 6-15단계: 더 빠른 성장
    return 1.2 + (stage - 5) * 0.08; // 스테이지당 8% 증가 (1.20~2.00)
  } else if (stage <= 30) {
    // 16-30단계: 중간 구간 대폭 상향
    return 2.0 + (stage - 15) * 0.12; // 스테이지당 12% 증가 (2.00~3.80)
  } else if (stage <= 50) {
    // 31-50단계: 후반 구간
    return 3.8 + (stage - 30) * 0.15; // 스테이지당 15% 증가 (3.80~6.80)
  } else if (stage <= 75) {
    // 51-75단계: 고난이도 구간
    return 6.8 + (stage - 50) * 0.2; // 스테이지당 20% 증가 (6.80~11.80)
  } else {
    // 76-100단계: 최종 구간
    return 11.8 + (stage - 75) * 0.25; // 스테이지당 25% 증가 (11.80~18.05)
  }
}

/**
 * 스테이지별 드랍률 계산
 */
export function calculateDropRates(stage: number): {
  stageClearDropRates: DropRateTable;
  idleDropRates: DropRateTable;
} {
  let stageClearRates: DropRateTable;
  let idleRates: DropRateTable;

  if (stage <= 20) {
    // 1-20: 초급
    stageClearRates = {
      [ItemGrade.COMMON]: 0.65,
      [ItemGrade.RARE]: 0.22,
      [ItemGrade.EPIC]: 0.1,
      [ItemGrade.LEGENDARY]: 0.025,
      [ItemGrade.MYTHIC]: 0.005,
      [ItemGrade.DIVINE]: 0, // 제우스 검은 드랍되지 않음
    };
    idleRates = {
      [ItemGrade.COMMON]: 0.75,
      [ItemGrade.RARE]: 0.18,
      [ItemGrade.EPIC]: 0.05,
      [ItemGrade.LEGENDARY]: 0.015,
      [ItemGrade.MYTHIC]: 0.005,
      [ItemGrade.DIVINE]: 0, // 제우스 검은 드랍되지 않음
    };
  } else if (stage <= 40) {
    // 21-40: 중급
    stageClearRates = {
      [ItemGrade.COMMON]: 0.55,
      [ItemGrade.RARE]: 0.25,
      [ItemGrade.EPIC]: 0.14,
      [ItemGrade.LEGENDARY]: 0.05,
      [ItemGrade.MYTHIC]: 0.01,
      [ItemGrade.DIVINE]: 0, // 제우스 검은 드랍되지 않음
    };
    idleRates = {
      [ItemGrade.COMMON]: 0.7,
      [ItemGrade.RARE]: 0.2,
      [ItemGrade.EPIC]: 0.07,
      [ItemGrade.LEGENDARY]: 0.025,
      [ItemGrade.MYTHIC]: 0.005,
      [ItemGrade.DIVINE]: 0, // 제우스 검은 드랍되지 않음
    };
  } else if (stage <= 60) {
    // 41-60: 고급
    stageClearRates = {
      [ItemGrade.COMMON]: 0.45,
      [ItemGrade.RARE]: 0.28,
      [ItemGrade.EPIC]: 0.17,
      [ItemGrade.LEGENDARY]: 0.08,
      [ItemGrade.MYTHIC]: 0.02,
      [ItemGrade.DIVINE]: 0, // 제우스 검은 드랍되지 않음
    };
    idleRates = {
      [ItemGrade.COMMON]: 0.65,
      [ItemGrade.RARE]: 0.22,
      [ItemGrade.EPIC]: 0.09,
      [ItemGrade.LEGENDARY]: 0.035,
      [ItemGrade.MYTHIC]: 0.005,
      [ItemGrade.DIVINE]: 0, // 제우스 검은 드랍되지 않음
    };
  } else if (stage <= 80) {
    // 61-80: 최고급
    stageClearRates = {
      [ItemGrade.COMMON]: 0.35,
      [ItemGrade.RARE]: 0.3,
      [ItemGrade.EPIC]: 0.2,
      [ItemGrade.LEGENDARY]: 0.12,
      [ItemGrade.MYTHIC]: 0.03,
      [ItemGrade.DIVINE]: 0, // 제우스 검은 드랍되지 않음
    };
    idleRates = {
      [ItemGrade.COMMON]: 0.6,
      [ItemGrade.RARE]: 0.25,
      [ItemGrade.EPIC]: 0.1,
      [ItemGrade.LEGENDARY]: 0.04,
      [ItemGrade.MYTHIC]: 0.01,
      [ItemGrade.DIVINE]: 0, // 제우스 검은 드랍되지 않음
    };
  } else {
    // 81-100: 전설급
    stageClearRates = {
      [ItemGrade.COMMON]: 0.25,
      [ItemGrade.RARE]: 0.3,
      [ItemGrade.EPIC]: 0.25,
      [ItemGrade.LEGENDARY]: 0.15,
      [ItemGrade.MYTHIC]: 0.05,
      [ItemGrade.DIVINE]: 0, // 제우스 검은 드랍되지 않음
    };
    idleRates = {
      [ItemGrade.COMMON]: 0.55,
      [ItemGrade.RARE]: 0.27,
      [ItemGrade.EPIC]: 0.12,
      [ItemGrade.LEGENDARY]: 0.05,
      [ItemGrade.MYTHIC]: 0.01,
      [ItemGrade.DIVINE]: 0, // 제우스 검은 드랍되지 않음
    };
  }

  return { stageClearDropRates: stageClearRates, idleDropRates: idleRates };
}

/**
 * 보스 이름 생성
 */
export function generateBossName(stage: number): string {
  const bossNames = [
    // 1-10: 숲의 몬스터들
    "슬라임 킹",
    "고블린 족장",
    "오크 워로드",
    "늑대 우두머리",
    "거대 거미",
    "트롤 킹",
    "엔트 고대목",
    "베어 로드",
    "와이번",
    "숲의 수호자",

    // 11-20: 동굴의 야수들
    "동굴 박쥐 왕",
    "석화 골렘",
    "지하 드래곤",
    "크리스탈 스파이더",
    "암흑 트롤",
    "용암 슬라임",
    "미노타우로스",
    "가고일 로드",
    "언더그라운드 킹",
    "동굴의 지배자",

    // 21-30: 사막의 위험들
    "사막 스콜피온",
    "미라 파라오",
    "사막 용",
    "모래 골렘",
    "오아시스 가디언",
    "스핑크스",
    "사막 나가",
    "선인장 몬스터",
    "사막 폭풍의 주인",
    "태양신의 화신",

    // 31-40: 바다의 괴물들
    "크라켄",
    "심해 머맨",
    "리바이어던",
    "바다뱀",
    "해적선 유령",
    "포세이돈의 사자",
    "거대 상어",
    "바다 마녀",
    "해왕성 가디언",
    "바다의 폭군",

    // 41-50: 화산의 악마들
    "파이어 엘리멘탈",
    "용암 골렘",
    "발록",
    "화염 드래곤",
    "마그마 슬라임",
    "화산 데몬",
    "불사조",
    "화염의 군주",
    "용암 타이탄",
    "화산신",

    // 51-60: 얼음 왕국
    "아이스 골렘",
    "프로스트 자이언트",
    "얼음 드래곤",
    "눈보라 늑대",
    "빙하 거인",
    "얼음 마녀",
    "크리스탈 비스트",
    "북극곰 왕",
    "얼음 타이탄",
    "빙설의 여왕",

    // 61-70: 하늘의 수호자들
    "그리폰",
    "페가수스",
    "천사 전사",
    "하늘 드래곤",
    "구름 자이언트",
    "천둥새",
    "바람의 정령",
    "하늘 요새 수호자",
    "천공의 기사",
    "하늘의 왕",

    // 71-80: 지하 세계
    "스켈레톤 킹",
    "리치",
    "데스 나이트",
    "좀비 로드",
    "밴시",
    "네크로맨서",
    "언데드 드래곤",
    "그림 리퍼",
    "지옥의 사자",
    "죽음의 군주",

    // 81-90: 고대 신전
    "고대 골렘",
    "신전 가디언",
    "파라오의 저주",
    "아누비스",
    "호루스의 화신",
    "미라 로드",
    "고대 스핑크스",
    "신전의 수호자",
    "파라오 킹",
    "고대신의 사도",

    // 91-100: 최종 보스들
    "고대 드래곤",
    "데몬 로드",
    "타락한 천사",
    "혼돈의 군주",
    "파멸의 사자",
    "절망의 왕",
    "종말의 기사",
    "창조신의 그림자",
    "우주의 파괴자",
    "절대자",
  ];

  return bossNames[stage - 1] || `보스 ${stage}`;
}

/**
 * 전체 스테이지 정보 생성
 */
export function generateAllStages(): Record<number, StageInfo> {
  const stages: Record<number, StageInfo> = {};

  for (let stage = 1; stage <= 100; stage++) {
    const requirements = calculateStageRequirements(stage);
    const bossStats = calculateBossStats(stage);
    const dropRates = calculateDropRates(stage);
    const creditMultiplier = calculateCreditMultiplier(stage);
    const bossName = generateBossName(stage);

    const bossInfo: BossInfo = {
      name: bossName,
      maxHP: bossStats.maxHP,
      attack: bossStats.attack,
      defense: bossStats.defense,
      image: `/bosses/stage-${stage}.png`, // 이미지는 나중에 추가
    };

    stages[stage] = {
      requiredAttack: requirements.requiredAttack,
      requiredDefense: requirements.requiredDefense,
      creditMultiplier,
      stageClearDropRates: dropRates.stageClearDropRates,
      idleDropRates: dropRates.idleDropRates,
      boss: bossInfo,
    };
  }

  return stages;
}

/**
 * 잠수 드랍률 기본 확률 계산 (스테이지별)
 */
export function calculateIdleDropBaseRate(stage: number): number {
  const baseRate = 0.001; // 0.1%
  const maxRate = 0.002; // 0.2%
  const growth = (maxRate - baseRate) / 99; // 99 스테이지에 걸쳐 증가

  return baseRate + growth * (stage - 1);
}

/**
 * 스테이지별 테마 정보
 */
export function getStageTheme(stage: number): {
  theme: string;
  description: string;
  color: string;
} {
  if (stage <= 10) {
    return {
      theme: "숲의 몬스터들",
      description: "평화로운 숲에 서식하는 몬스터들과의 첫 번째 모험",
      color: "green",
    };
  } else if (stage <= 20) {
    return {
      theme: "동굴의 야수들",
      description: "어둠 속에 숨어있는 위험한 동굴의 괴물들",
      color: "gray",
    };
  } else if (stage <= 30) {
    return {
      theme: "사막의 위험들",
      description: "뜨거운 사막에서 만나는 고대의 수호자들",
      color: "yellow",
    };
  } else if (stage <= 40) {
    return {
      theme: "바다의 괴물들",
      description: "깊은 바다 속에서 올라온 전설의 해양 괴물들",
      color: "blue",
    };
  } else if (stage <= 50) {
    return {
      theme: "화산의 악마들",
      description: "타오르는 화산에서 나타난 불의 정령들",
      color: "red",
    };
  } else if (stage <= 60) {
    return {
      theme: "얼음 왕국",
      description: "영원한 겨울이 지배하는 얼음 왕국의 수호자들",
      color: "cyan",
    };
  } else if (stage <= 70) {
    return {
      theme: "하늘의 수호자들",
      description: "구름 위에서 내려온 천상계의 전사들",
      color: "sky",
    };
  } else if (stage <= 80) {
    return {
      theme: "지하 세계",
      description: "죽음의 땅에서 되살아난 언데드 군단",
      color: "purple",
    };
  } else if (stage <= 90) {
    return {
      theme: "고대 신전",
      description: "잊혀진 문명의 신전을 지키는 고대의 수호자들",
      color: "amber",
    };
  } else {
    return {
      theme: "최종 보스들",
      description: "세계의 운명을 결정할 최후의 결전",
      color: "black",
    };
  }
}
