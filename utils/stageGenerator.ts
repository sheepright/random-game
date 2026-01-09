/**
 * Stage generation utilities for 100 stages
 * 100 스테이지 자동 생성 및 밸런스 계산
 */

import { StageInfo, BossInfo, DropRateTable, ItemGrade } from "../types/game";

/**
 * 스테이지별 요구 스탯 계산 (기본 장비로도 클리어 가능하도록 대폭 완화)
 */
export function calculateStageRequirements(stage: number): {
  requiredAttack: number;
  requiredDefense: number;
} {
  // 스테이지별 최소 요구 스탯 (기본 장비로도 충분히 클리어 가능하도록 설정)
  // 기본 장비 스탯: 공격력 10, 방어력 19 (헬멧5 + 아머8 + 팬츠6)
  let requiredAttack, requiredDefense;

  if (stage <= 10) {
    // 1-10: 기본 장비만으로도 충분히 클리어 가능
    requiredAttack = 8 + stage * 0.5; // 1스테이지: 8.5, 10스테이지: 13 (기본 공격력 10보다 낮음)
    requiredDefense = 15 + stage * 0.5; // 1스테이지: 15.5, 10스테이지: 20 (기본 방어력 19보다 낮음)
  } else if (stage <= 20) {
    // 11-20: Rare 장비 수준 (하지만 여전히 완화)
    requiredAttack = 25 + (stage - 10) * 3;
    requiredDefense = 25 + (stage - 10) * 2;
  } else if (stage <= 40) {
    // 21-40: Epic 장비 수준
    requiredAttack = 55 + (stage - 20) * 5;
    requiredDefense = 45 + (stage - 20) * 3;
  } else if (stage <= 70) {
    // 41-70: Legendary 장비 수준
    requiredAttack = 155 + (stage - 40) * 8;
    requiredDefense = 105 + (stage - 40) * 5;
  } else {
    // 71-100: Mythic 장비 수준
    requiredAttack = 395 + (stage - 70) * 10;
    requiredDefense = 255 + (stage - 70) * 7;
  }

  return {
    requiredAttack: Math.floor(requiredAttack),
    requiredDefense: Math.floor(requiredDefense),
  };
}

/**
 * 보스 스탯 계산 (11스테이지부터 난이도 대폭 상승)
 */
export function calculateBossStats(stage: number): {
  maxHP: number;
  attack: number;
  defense: number;
} {
  // 실제 기본 장비 스탯: 공격력 10, 방어력 15, HP 130
  let playerAttack, playerDefense, playerDefensePenetration;

  if (stage <= 10) {
    // 1-10: 기본 장비 기준으로 점진적 난이도 증가 (기존과 동일)
    playerAttack = 10; // 기본 장비 공격력 그대로
    playerDefense = 15; // 기본 장비 방어력 그대로
    playerDefensePenetration = 0; // 기본 장비는 방어 무시 없음
  } else if (stage <= 20) {
    // 11-20: Rare 장비 수준 (난이도 상승)
    playerAttack = 60 + (stage - 10) * 8; // 더 높은 공격력 요구
    playerDefense = 40 + (stage - 10) * 5; // 더 높은 방어력 요구
    playerDefensePenetration = 20 + (stage - 10) * 3;
  } else if (stage <= 40) {
    // 21-40: Epic 장비 수준 (더 높은 난이도)
    playerAttack = 140 + (stage - 20) * 12;
    playerDefense = 90 + (stage - 20) * 8;
    playerDefensePenetration = 50 + (stage - 20) * 4;
  } else if (stage <= 70) {
    // 41-70: Legendary 장비 수준 (고난이도)
    playerAttack = 380 + (stage - 40) * 18;
    playerDefense = 250 + (stage - 40) * 12;
    playerDefensePenetration = 130 + (stage - 40) * 7;
  } else {
    // 71-100: Mythic 장비 수준 (최고 난이도)
    playerAttack = 920 + (stage - 70) * 25;
    playerDefense = 610 + (stage - 70) * 15;
    playerDefensePenetration = 340 + (stage - 70) * 10;
  }

  // 턴 제한 계산
  const baseTurnLimit = 30;
  const turnLimitReduction = 0.1;
  const minTurnLimit = 10;
  const reduction = Math.floor((stage - 1) * turnLimitReduction);
  const turnLimit = Math.max(minTurnLimit, baseTurnLimit - reduction);

  // 목표: 초반 10스테이지는 기존과 동일, 11스테이지부터 난이도 상승
  let targetTurnsRatio;
  if (stage <= 3) {
    targetTurnsRatio = 0.1; // 1-3스테이지: 3턴 내외 (매우 쉽게)
  } else if (stage <= 6) {
    targetTurnsRatio = 0.15; // 4-6스테이지: 4-5턴 (쉽게)
  } else if (stage <= 10) {
    targetTurnsRatio = 0.2; // 7-10스테이지: 6턴 (적당히 쉽게)
  } else if (stage <= 20) {
    targetTurnsRatio = 0.6; // 11-20스테이지: 60% 턴 내에 처치 (난이도 상승)
  } else if (stage <= 40) {
    targetTurnsRatio = 0.75; // 21-40스테이지: 75% 턴 내에 처치
  } else {
    targetTurnsRatio = 0.85; // 41-100스테이지: 85% 턴 내에 처치 (고난이도)
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

  // 보스 방어력: 11스테이지부터 대폭 상승
  let bossDefense = 0;
  if (stage <= 10) {
    // 1-10스테이지: 기존과 동일 (약간의 방어력만)
    if (stage >= 4) {
      bossDefense = Math.floor((stage - 3) * 0.5); // 4스테이지부터 0.5씩 증가
    }
  } else {
    let targetDamageReduction;
    if (stage <= 20) {
      targetDamageReduction = 0.25; // 11-20스테이지: 25% 데미지 감소 (난이도 상승)
    } else if (stage <= 30) {
      targetDamageReduction = 0.35; // 21-30스테이지: 35% 데미지 감소
    } else if (stage <= 50) {
      targetDamageReduction = 0.45; // 31-50스테이지: 45% 데미지 감소
    } else {
      targetDamageReduction = 0.55; // 51-100스테이지: 55% 데미지 감소 (최고 난이도)
    }
    bossDefense = Math.floor(
      (playerAttack * targetDamageReduction) / (1 - targetDamageReduction)
    );
  }

  // 실제 플레이어 데미지 계산
  const playerDamagePerTurn = calculateDamage(
    playerAttack,
    bossDefense,
    playerDefensePenetration
  );

  // 보스 HP: 목표 턴 수 * 플레이어 데미지 (스테이지별 점진적 증가)
  let bossHP = Math.floor(playerDamagePerTurn * targetTurns);

  // 초반 스테이지 HP 추가 조정 (기존과 동일)
  if (stage <= 10) {
    const stageMultiplier = 0.8 + (stage - 1) * 0.05; // 0.8배에서 1.25배까지 점진적 증가
    bossHP = Math.floor(bossHP * stageMultiplier);
  } else {
    // 11스테이지부터는 더 높은 HP 배율 적용
    const stageMultiplier = 1.2 + (stage - 11) * 0.02; // 1.2배에서 시작해서 점진적 증가
    bossHP = Math.floor(bossHP * stageMultiplier);
  }

  // 보스 공격력: 11스테이지부터 대폭 상승
  const playerHP = 100 + playerDefense * 2;
  let survivalTurns;
  if (stage <= 3) {
    survivalTurns = 65; // 1-3 스테이지: 65턴 생존 (거의 죽지 않음)
  } else if (stage <= 6) {
    survivalTurns = 43; // 4-6 스테이지: 43턴 생존 (여전히 안전)
  } else if (stage <= 10) {
    survivalTurns = 26; // 7-10 스테이지: 26턴 생존 (적당한 위험)
  } else if (stage <= 20) {
    survivalTurns = 15; // 11-20 스테이지: 15턴 생존 (위험도 상승)
  } else if (stage <= 40) {
    survivalTurns = 10; // 21-40 스테이지: 10턴 생존 (높은 위험)
  } else if (stage <= 60) {
    survivalTurns = 8; // 41-60 스테이지: 8턴 생존 (매우 위험)
  } else {
    survivalTurns = 6; // 61-100 스테이지: 6턴 생존 (극한 위험)
  }
  const bossAttack = Math.floor(playerHP / survivalTurns);

  return {
    maxHP: Math.max(15, bossHP), // 최소 HP 15
    attack: Math.max(1, bossAttack), // 최소 공격력 1
    defense: Math.max(0, bossDefense), // 최소 방어력 0
  };
}

/**
 * 크레딧 배율 계산 (중간 구간 대폭 상향)
 */
export function calculateCreditMultiplier(stage: number): number {
  if (stage <= 10) {
    return 1 + (stage - 1) * 0.02; // 스테이지당 2% 증가 (1.00~1.18)
  } else if (stage <= 20) {
    // 11-20단계: 더 빠른 성장
    return 1.18 + (stage - 10) * 0.03; // 스테이지당 3% 증가 (1.18~1.48)
  } else if (stage <= 40) {
    // 21-40단계: 중간 구간 대폭 상향
    return 1.48 + (stage - 20) * 0.04; // 스테이지당 4% 증가 (1.48~2.28)
  } else if (stage <= 60) {
    // 41-60단계: 후반 구간
    return 2.28 + (stage - 40) * 0.03; // 스테이지당 3% 증가 (2.28~2.88)
  } else {
    // 61-100단계: 최종 구간
    return 2.88 + (stage - 60) * 0.02; // 스테이지당 2% 증가 (2.88~3.68)
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
    };
    idleRates = {
      [ItemGrade.COMMON]: 0.75,
      [ItemGrade.RARE]: 0.18,
      [ItemGrade.EPIC]: 0.05,
      [ItemGrade.LEGENDARY]: 0.015,
      [ItemGrade.MYTHIC]: 0.005,
    };
  } else if (stage <= 40) {
    // 21-40: 중급
    stageClearRates = {
      [ItemGrade.COMMON]: 0.55,
      [ItemGrade.RARE]: 0.25,
      [ItemGrade.EPIC]: 0.14,
      [ItemGrade.LEGENDARY]: 0.05,
      [ItemGrade.MYTHIC]: 0.01,
    };
    idleRates = {
      [ItemGrade.COMMON]: 0.7,
      [ItemGrade.RARE]: 0.2,
      [ItemGrade.EPIC]: 0.07,
      [ItemGrade.LEGENDARY]: 0.025,
      [ItemGrade.MYTHIC]: 0.005,
    };
  } else if (stage <= 60) {
    // 41-60: 고급
    stageClearRates = {
      [ItemGrade.COMMON]: 0.45,
      [ItemGrade.RARE]: 0.28,
      [ItemGrade.EPIC]: 0.17,
      [ItemGrade.LEGENDARY]: 0.08,
      [ItemGrade.MYTHIC]: 0.02,
    };
    idleRates = {
      [ItemGrade.COMMON]: 0.65,
      [ItemGrade.RARE]: 0.22,
      [ItemGrade.EPIC]: 0.09,
      [ItemGrade.LEGENDARY]: 0.035,
      [ItemGrade.MYTHIC]: 0.005,
    };
  } else if (stage <= 80) {
    // 61-80: 최고급
    stageClearRates = {
      [ItemGrade.COMMON]: 0.35,
      [ItemGrade.RARE]: 0.3,
      [ItemGrade.EPIC]: 0.2,
      [ItemGrade.LEGENDARY]: 0.12,
      [ItemGrade.MYTHIC]: 0.03,
    };
    idleRates = {
      [ItemGrade.COMMON]: 0.6,
      [ItemGrade.RARE]: 0.25,
      [ItemGrade.EPIC]: 0.1,
      [ItemGrade.LEGENDARY]: 0.04,
      [ItemGrade.MYTHIC]: 0.01,
    };
  } else {
    // 81-100: 전설급
    stageClearRates = {
      [ItemGrade.COMMON]: 0.25,
      [ItemGrade.RARE]: 0.3,
      [ItemGrade.EPIC]: 0.25,
      [ItemGrade.LEGENDARY]: 0.15,
      [ItemGrade.MYTHIC]: 0.05,
    };
    idleRates = {
      [ItemGrade.COMMON]: 0.55,
      [ItemGrade.RARE]: 0.27,
      [ItemGrade.EPIC]: 0.12,
      [ItemGrade.LEGENDARY]: 0.05,
      [ItemGrade.MYTHIC]: 0.01,
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
