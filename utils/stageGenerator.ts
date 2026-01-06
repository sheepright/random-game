/**
 * Stage generation utilities for 100 stages
 * 100 스테이지 자동 생성 및 밸런스 계산
 */

import { StageInfo, BossInfo, DropRateTable, ItemGrade } from "../types/game";

/**
 * 스테이지별 요구 스탯 계산 (밸런스 조정됨)
 */
export function calculateStageRequirements(stage: number): {
  requiredAttack: number;
  requiredDefense: number;
} {
  // 플레이어 파워 진행도에 맞춘 새로운 성장률
  let requiredAttack: number;
  let requiredDefense: number;

  if (stage <= 10) {
    // 1-10: 초반 난이도 상향 (너무 쉬웠음)
    const baseAttack = 25;
    const baseDefense = 20;
    const attackGrowth = 1.08; // 8% 증가
    const defenseGrowth = 1.07; // 7% 증가

    requiredAttack = Math.floor(baseAttack * Math.pow(attackGrowth, stage - 1));
    requiredDefense = Math.floor(
      baseDefense * Math.pow(defenseGrowth, stage - 1)
    );
  } else if (stage <= 20) {
    // 11-20: 레어 장비 구간
    const stage10Attack = 54;
    const stage10Defense = 40;
    const attackGrowth = 1.08; // 8% 증가
    const defenseGrowth = 1.07; // 7% 증가

    requiredAttack = Math.floor(
      stage10Attack * Math.pow(attackGrowth, stage - 10)
    );
    requiredDefense = Math.floor(
      stage10Defense * Math.pow(defenseGrowth, stage - 10)
    );
  } else if (stage <= 35) {
    // 21-35: 에픽 장비 구간, 더 가파른 증가
    const stage20Attack = 117;
    const stage20Defense = 80;
    const attackGrowth = 1.09; // 9% 증가
    const defenseGrowth = 1.08; // 8% 증가

    requiredAttack = Math.floor(
      stage20Attack * Math.pow(attackGrowth, stage - 20)
    );
    requiredDefense = Math.floor(
      stage20Defense * Math.pow(defenseGrowth, stage - 20)
    );
  } else if (stage <= 60) {
    // 36-60: 레전드리 장비 구간, 강화 시스템 고려
    const stage35Attack = 320; // 370 → 320으로 감소
    const stage35Defense = 210; // 240 → 210으로 감소
    const attackGrowth = 1.065; // 7% → 6.5%로 감소
    const defenseGrowth = 1.055; // 6% → 5.5%로 감소

    requiredAttack = Math.floor(
      stage35Attack * Math.pow(attackGrowth, stage - 35)
    );
    requiredDefense = Math.floor(
      stage35Defense * Math.pow(defenseGrowth, stage - 35)
    );
  } else {
    // 61-100: 미식 장비 구간, 고강화 고려
    const stage60Attack = 900; // 1100 → 900으로 감소
    const stage60Defense = 600; // 700 → 600으로 감소
    const attackGrowth = 1.035; // 4% → 3.5%로 감소
    const defenseGrowth = 1.03; // 3.5% → 3%로 감소

    requiredAttack = Math.floor(
      stage60Attack * Math.pow(attackGrowth, stage - 60)
    );
    requiredDefense = Math.floor(
      stage60Defense * Math.pow(defenseGrowth, stage - 60)
    );
  }

  return {
    requiredAttack,
    requiredDefense,
  };
}

/**
 * 보스 스탯 계산 (밸런스 조정됨)
 */
export function calculateBossStats(stage: number): {
  maxHP: number;
  attack: number;
  defense: number;
} {
  // 스테이지 요구사항에 비례한 보스 스탯 계산
  const stageReq = calculateStageRequirements(stage);

  // 보스 HP는 플레이어 공격력의 8-12배 정도로 설정 (전투 시간 고려)
  const hpMultiplier = 8 + (stage % 10) * 0.4; // 8.0 ~ 11.6배
  const maxHP = Math.floor(stageReq.requiredAttack * hpMultiplier);

  // 보스 공격력은 플레이어 방어력의 70-90% 정도 (너무 강하지 않게)
  const attackMultiplier = 0.7 + (stage % 20) * 0.01; // 0.7 ~ 0.89배
  const attack = Math.floor(stageReq.requiredDefense * attackMultiplier);

  // 보스 방어력은 플레이어 공격력의 15-25% 정도 (방어 무시 고려)
  const defenseMultiplier = 0.15 + (stage % 30) * 0.003; // 0.15 ~ 0.237배
  const defense = Math.floor(stageReq.requiredAttack * defenseMultiplier);

  return {
    maxHP: Math.max(50, maxHP), // 최소 HP 보장
    attack: Math.max(5, attack), // 최소 공격력 보장
    defense: Math.max(1, defense), // 최소 방어력 보장
  };
}

/**
 * 크레딧 배율 계산 (기본값 기준으로 계산하여 기하급수적 증가 방지)
 */
export function calculateCreditMultiplier(stage: number): number {
  return 1 + (stage - 1) * 0.02; // 스테이지당 2% 증가 (기본값 기준)
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
