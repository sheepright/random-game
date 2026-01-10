/**
 * Stage management utilities
 * 단계 진행 시스템 관리 유틸리티
 * Requirements: 3.1, 3.2, 1.3, 3.5, 7.1, 7.7, 7.9, 7.10
 */

import { PlayerStats, StageInfo, Boss, Item } from "../types/game";
import { STAGE_REQUIREMENTS, GAME_LIMITS } from "../constants/game";
import { getBossForStage, simulateBattle } from "./battleSystem";
import { generateItemDrop } from "./itemDropSystem";

/**
 * 플레이어가 특정 단계의 보스를 이길 수 있는지 시뮬레이션으로 확인
 * Requirements: 7.1, 7.4, 7.5, 7.6 - 보스 전투 시스템
 */
export function canWinBossBattle(
  playerStats: PlayerStats,
  stage: number
): boolean {
  const boss = getBossForStage(stage);

  if (!boss) {
    return false;
  }

  const battleSimulation = simulateBattle(boss, playerStats);
  return battleSimulation.canWin;
}

/**
 * 보스 전투 승리 가능성과 상세 정보 반환
 * Requirements: 7.1, 7.4, 7.5, 7.6 - 보스 전투 시스템
 */
export function getBattlePreview(
  playerStats: PlayerStats,
  stage: number
): {
  canWin: boolean;
  estimatedRounds: number;
  playerSurvivalRate: number;
  boss: Boss | null;
} {
  const boss = getBossForStage(stage);

  if (!boss) {
    return {
      canWin: false,
      estimatedRounds: 0,
      playerSurvivalRate: 0,
      boss: null,
    };
  }

  const battleSimulation = simulateBattle(boss, playerStats);

  return {
    ...battleSimulation,
    boss,
  };
}

/**
 * 특정 단계에 접근할 수 있는지 확인 (이전 단계를 클리어했는지)
 * Requirements: 3.5 - 해금되지 않은 단계 접근 방지
 */
export function canAccessStage(
  targetStage: number,
  currentStage: number
): boolean {
  // 현재 단계이거나 이전에 클리어한 단계만 접근 가능
  return targetStage <= currentStage && targetStage >= GAME_LIMITS.MIN_STAGE;
}

/**
 * 다음 단계로 진행할 수 있는지 확인 (보스 전투 기반)
 * Requirements: 3.1, 3.2, 7.1, 7.6 - 단계 클리어 조건 확인 및 다음 단계 해금
 */
export function canProgressToNextStage(
  playerStats: PlayerStats,
  currentStage: number
): boolean {
  const nextStage = currentStage + 1;

  // 최대 단계를 넘어서면 진행 불가
  if (nextStage > GAME_LIMITS.MAX_STAGE) {
    return false;
  }

  // 현재 단계의 보스를 이길 수 있는지 확인
  return canWinBossBattle(playerStats, currentStage);
}

/**
 * 단계 클리어 시 새로운 크레딧 생성률 계산 (기본값 기준으로 계산)
 * Requirements: 1.3, 3.2 - 단계 클리어 시 크레딧 생성률 증가
 */
export function calculateNewCreditRate(
  baseCreditRate: number,
  newStage: number
): number {
  const stageInfo = STAGE_REQUIREMENTS[newStage];

  if (!stageInfo) {
    return baseCreditRate;
  }

  // 기본값에 배율을 곱해서 기하급수적 증가 방지
  return baseCreditRate * stageInfo.creditMultiplier;
}

/**
 * 단계 정보 가져오기
 */
export function getStageInfo(stage: number): StageInfo | null {
  return STAGE_REQUIREMENTS[stage] || null;
}

/**
 * 다음 단계 정보 가져오기
 */
export function getNextStageInfo(currentStage: number): StageInfo | null {
  const nextStage = currentStage + 1;
  return getStageInfo(nextStage);
}

/**
 * 현재 단계에서 다음 단계로 진행하기 위해 필요한 스탯 부족분 계산
 */
export function getRequiredStatsGap(
  playerStats: PlayerStats,
  currentStage: number
): { attack: number; defense: number } | null {
  const stageInfo = getStageInfo(currentStage);

  if (!stageInfo) {
    return null;
  }

  const attackGap = Math.max(0, stageInfo.requiredAttack - playerStats.attack);
  const defenseGap = Math.max(
    0,
    stageInfo.requiredDefense - playerStats.defense
  );

  return {
    attack: attackGap,
    defense: defenseGap,
  };
}

/**
 * 보스 전투 시작을 위한 보스 정보 로드
 * Requirements: 7.1, 7.9 - 보스 정보 로드 및 전투 시작 로직
 */
export function loadBossForStage(stage: number): Boss | null {
  return getBossForStage(stage);
}

/**
 * 스테이지 클리어 시 즉시 크레딧 보상 계산 (최대 50만 크레딧)
 * Requirements: 13.2 - 스테이지 클리어 보상 추가
 */
export function calculateStageClearReward(stage: number): number {
  // 스테이지별 보상 (100단계 최대 50만 크레딧으로 조정)
  if (stage <= 10) {
    const baseReward = 100; // 초반 구간 기본 보상 크레딧
    return Math.floor(baseReward * Math.pow(1.3, stage - 1)); // 100~1,378 크레딧
  } else if (stage <= 20) {
    // 11-20단계: 1,791에서 시작
    return Math.floor(1791 * Math.pow(1.2, stage - 10)); // 1,791~11,160 크레딧
  } else if (stage <= 40) {
    // 21-40단계: 13,392에서 시작
    return Math.floor(13392 * Math.pow(1.12, stage - 20)); // 13,392~129,000 크레딧
  } else if (stage <= 60) {
    // 41-60단계: 144,480에서 시작, 성장률 낮춤
    return Math.floor(144480 * Math.pow(1.06, stage - 40)); // 144,480~350,000 크레딧
  } else {
    // 61-100단계: 371,000에서 시작, 성장률 더 낮춤
    return Math.floor(371000 * Math.pow(1.008, stage - 60)); // 371,000~500,000 크레딧
  }
}

/**
 * 전투 승리 시 아이템 드랍 처리
 * Requirements: 7.7, 3.1 - 전투 승리 시 아이템 드랍 연동
 */
export function processBattleVictoryRewards(stage: number): Item[] {
  const stageInfo = getStageInfo(stage);

  if (!stageInfo) {
    return [];
  }

  // 스테이지 클리어 시 100% 확정 아이템 드랍 (Requirements: 3.1)
  const droppedItems: Item[] = [];

  // 스테이지 클리어 시 100% 확률로 아이템 드랍 (확정 드랍)
  const droppedItem = generateItemDrop(stage, "stageClear");
  if (droppedItem) {
    droppedItems.push(droppedItem);
  }

  // 높은 스테이지일수록 추가 아이템 드랍 가능성 (보너스 드랍)
  if (stage >= 3 && Math.random() < 0.3) {
    // 30% 확률로 추가 아이템
    const bonusItem = generateItemDrop(stage, "stageClear");
    if (bonusItem) {
      droppedItems.push(bonusItem);
    }
  }

  return droppedItems;
}

/**
 * 전투 승리 시 다음 스테이지 해금 및 보상 처리
 * Requirements: 7.7, 7.10 - 다음 스테이지 해금 로직, 13.2 - 크레딧 보상 추가
 */
export function processBattleVictory(
  currentStage: number,
  baseCreditRate: number
): {
  newStage: number;
  newCreditRate: number;
  stageInfo: StageInfo | null;
  droppedItems: Item[];
  creditReward: number;
  isGameComplete?: boolean;
} {
  // 100스테이지 클리어 시 게임 완료
  if (currentStage >= GAME_LIMITS.MAX_STAGE) {
    return {
      newStage: currentStage, // 스테이지 증가하지 않음
      newCreditRate: baseCreditRate,
      stageInfo: null,
      droppedItems: processBattleVictoryRewards(currentStage),
      creditReward: calculateStageClearReward(currentStage),
      isGameComplete: true,
    };
  }

  const newStage = currentStage + 1;
  const newCreditRate = calculateNewCreditRate(baseCreditRate, newStage);
  const stageInfo = getStageInfo(newStage);
  const droppedItems = processBattleVictoryRewards(currentStage);
  const creditReward = calculateStageClearReward(currentStage);

  return {
    newStage,
    newCreditRate,
    stageInfo,
    droppedItems,
    creditReward,
    isGameComplete: false,
  };
}

/**
 * 보스 전투 기반 단계 진행 가능 여부 확인
 * Requirements: 7.1, 7.6 - 보스 전투 시스템 기반 진행 확인
 */
export function canStartBossBattle(
  playerStats: PlayerStats,
  stage: number
): {
  canStart: boolean;
  boss: Boss | null;
  battlePreview: {
    canWin: boolean;
    estimatedRounds: number;
    playerSurvivalRate: number;
  } | null;
} {
  const boss = getBossForStage(stage);

  if (!boss) {
    return {
      canStart: false,
      boss: null,
      battlePreview: null,
    };
  }

  const battlePreview = simulateBattle(boss, playerStats);

  return {
    canStart: true,
    boss,
    battlePreview,
  };
}

/**
 * 모든 단계 목록 가져오기 (UI에서 사용)
 */
export function getAllStages(): Array<{ stage: number; info: StageInfo }> {
  return Object.entries(STAGE_REQUIREMENTS).map(([stage, info]) => ({
    stage: parseInt(stage, 10),
    info,
  }));
}

/**
 * 단계 진행률 계산 (현재 스탯 대비 다음 단계 요구사항)
 */
export function calculateStageProgress(
  playerStats: PlayerStats,
  currentStage: number
): {
  attackProgress: number;
  defenseProgress: number;
  overallProgress: number;
} {
  const stageInfo = getStageInfo(currentStage);

  if (!stageInfo) {
    return { attackProgress: 0, defenseProgress: 0, overallProgress: 0 };
  }

  const attackProgress = Math.min(
    1,
    playerStats.attack / stageInfo.requiredAttack
  );
  const defenseProgress = Math.min(
    1,
    playerStats.defense / stageInfo.requiredDefense
  );
  const overallProgress = Math.min(attackProgress, defenseProgress);

  return {
    attackProgress,
    defenseProgress,
    overallProgress,
  };
}
