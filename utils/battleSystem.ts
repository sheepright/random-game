/**
 * Battle System utilities
 * 보스 전투 시스템 관리 유틸리티
 * Requirements: 7.2, 7.3, 7.4, 7.5, 7.6, 7.8
 */

import {
  BattleState,
  BattleLogEntry,
  Boss,
  PlayerStats,
  BossInfo,
} from "../types/game";
import { BATTLE_SETTINGS, BOSS_INFO } from "../constants/game";

/**
 * 추가타격 확률 계산 (최대 50% 제한)
 * Requirements: 7.6 - 추가타격 확률 기반 추가 데미지
 */
export function calculateAdditionalAttackChance(
  playerStats: PlayerStats
): number {
  return Math.min(
    BATTLE_SETTINGS.maxAdditionalAttackChance,
    playerStats.additionalAttackChance
  );
}

/**
 * 데미지 계산 함수 (크리티컬 시스템 포함, 개선된 방어력 시스템)
 * Requirements: 7.4, 7.5 - 데미지 계산 시스템 (공격력 vs 방어력)
 *
 * 변경사항:
 * - 방어력을 퍼센트 기반 데미지 감소로 변경
 * - 방어력 무시의 효과 강화
 * - 최소 데미지 보장을 통한 밸런스 개선
 */
export function calculateDamage(
  attackerAttack: number,
  defenderDefense: number,
  defensePenetration: number = 0,
  criticalChance: number = 0,
  criticalDamageMultiplier: number = 0
): { damage: number; isCritical: boolean } {
  // 방어력 무시 적용 (방어력 무시가 더 의미있게)
  const effectiveDefense = Math.max(0, defenderDefense - defensePenetration);

  // 방어력을 퍼센트 기반 데미지 감소로 계산
  // 공식: 데미지 감소율 = 방어력 / (방어력 + 100)
  // 이렇게 하면 방어력이 높아져도 100% 데미지 감소는 불가능
  const damageReduction = effectiveDefense / (effectiveDefense + 100);
  const baseDamage = Math.max(
    Math.floor(attackerAttack * 0.1), // 최소 공격력의 10% 데미지는 보장
    Math.floor(attackerAttack * (1 - damageReduction))
  );

  // 크리티컬 확률 체크
  const isCritical = Math.random() < criticalChance;

  if (isCritical) {
    // 크리티컬 히트: 기본 데미지 + (기본 데미지 × 크리티컬 데미지 배수)
    const criticalDamage = baseDamage + baseDamage * criticalDamageMultiplier;
    return { damage: Math.floor(criticalDamage), isCritical: true };
  }

  return { damage: baseDamage, isCritical: false };
}

/**
 * 플레이어 최대 HP 계산
 * 방어력 기반으로 HP 계산
 */
export function calculatePlayerMaxHP(playerStats: PlayerStats): number {
  return 100 + playerStats.defense * 2;
}

/**
 * 보스 정보로부터 Boss 객체 생성
 */
export function createBossFromInfo(bossInfo: BossInfo, stage: number): Boss {
  return {
    id: `boss_${stage}_${Date.now()}`,
    name: bossInfo.name,
    stage,
    maxHP: bossInfo.maxHP,
    currentHP: bossInfo.maxHP,
    attack: bossInfo.attack,
    defense: bossInfo.defense,
    image: bossInfo.image,
  };
}

/**
 * 전투 로그 엔트리 생성
 */
export function createBattleLogEntry(
  type: BattleLogEntry["type"],
  message: string,
  damage?: number
): BattleLogEntry {
  return {
    id: `log_${Date.now()}_${Math.random()}`,
    timestamp: Date.now(),
    type,
    message,
    damage,
  };
}

/**
 * 스테이지별 턴 제한 계산
 */
export function calculateTurnLimit(stage: number): number {
  const { baseTurnLimit, turnLimitReduction, minTurnLimit } = BATTLE_SETTINGS;
  const reduction = Math.floor((stage - 1) * turnLimitReduction);
  return Math.max(minTurnLimit, baseTurnLimit - reduction);
}

/**
 * 전투 초기화 (턴 제한 시스템 포함)
 * Requirements: 7.2 - 턴 기반 전투 로직 구현
 */
export function initializeBattle(
  boss: Boss,
  playerStats: PlayerStats
): BattleState {
  const playerMaxHP = calculatePlayerMaxHP(playerStats);
  const maxTurns = calculateTurnLimit(boss.stage);

  return {
    boss: { ...boss, currentHP: boss.maxHP },
    playerHP: playerMaxHP,
    bossHP: boss.maxHP,
    isPlayerTurn: BATTLE_SETTINGS.playerFirst,
    battleLog: [
      createBattleLogEntry(
        "battle_start",
        `${boss.name}과의 전투가 시작되었습니다! (제한 시간: ${maxTurns}턴)`
      ),
    ],
    battleResult: "ongoing",
    currentTurn: 0,
    maxTurns,
  };
}

/**
 * 플레이어 공격 처리 (추가타격 및 크리티컬 포함, 턴 제한 시스템)
 * Requirements: 7.4, 7.5, 7.6 - 데미지 계산, 전투 로그 처리, 추가타격 시스템
 */
export function processPlayerAttack(
  battleState: BattleState,
  playerStats: PlayerStats
): BattleState {
  if (battleState.battleResult !== "ongoing" || !battleState.isPlayerTurn) {
    return battleState;
  }

  // 턴 증가 (플레이어 턴에서만)
  const newTurn = battleState.currentTurn + 1;

  // 기본 공격 데미지 계산 (크리티컬 포함)
  const baseDamageResult = calculateDamage(
    playerStats.attack,
    battleState.boss.defense,
    playerStats.defensePenetration,
    playerStats.criticalChance,
    playerStats.criticalDamageMultiplier
  );

  let totalDamage = baseDamageResult.damage;
  let attackCount = 1;
  let newBattleLog = [...battleState.battleLog];

  // 기본 공격 로그 (크리티컬 표시 포함)
  const baseAttackMessage = baseDamageResult.isCritical
    ? `플레이어가 ${battleState.boss.name}에게 크리티컬 공격했습니다! 💥`
    : `플레이어가 ${battleState.boss.name}에게 공격했습니다`;

  const baseAttackLog = createBattleLogEntry(
    "player_attack",
    baseAttackMessage,
    baseDamageResult.damage
  );
  newBattleLog.push(baseAttackLog);

  // 추가타격 확률 체크
  const additionalChance = calculateAdditionalAttackChance(playerStats);
  if (additionalChance > 0 && Math.random() < additionalChance) {
    const additionalDamageResult = calculateDamage(
      playerStats.attack,
      battleState.boss.defense,
      playerStats.defensePenetration,
      playerStats.criticalChance,
      playerStats.criticalDamageMultiplier
    );

    totalDamage += additionalDamageResult.damage;
    attackCount = 2;

    // 추가타격 로그 (크리티컬 표시 포함)
    const additionalAttackMessage = additionalDamageResult.isCritical
      ? `추가타격 발동! ${battleState.boss.name}에게 크리티컬 추가 공격했습니다! 💥`
      : `추가타격 발동! ${battleState.boss.name}에게 추가 공격했습니다`;

    const additionalAttackLog = createBattleLogEntry(
      "player_attack",
      additionalAttackMessage,
      additionalDamageResult.damage
    );
    newBattleLog.push(additionalAttackLog);
  }

  const newBossHP = Math.max(0, battleState.bossHP - totalDamage);
  const isVictory = newBossHP <= 0;

  // 턴 제한 체크
  const isTimeout = newTurn >= battleState.maxTurns && !isVictory;

  let battleResult: BattleState["battleResult"] = "ongoing";

  if (isVictory) {
    const victoryLog = createBattleLogEntry(
      "battle_end",
      `${battleState.boss.name}을 물리쳤습니다! 승리!`
    );
    newBattleLog.push(victoryLog);
    battleResult = "victory";
  } else if (isTimeout) {
    const timeoutLog = createBattleLogEntry(
      "battle_end",
      `제한 시간이 초과되었습니다! 패배...`
    );
    newBattleLog.push(timeoutLog);
    battleResult = "timeout";
  }

  return {
    ...battleState,
    bossHP: newBossHP,
    boss: { ...battleState.boss, currentHP: newBossHP },
    battleLog: newBattleLog,
    battleResult,
    isPlayerTurn: isVictory || isTimeout ? true : false, // 승리/시간초과하면 턴 유지, 아니면 보스 턴
    currentTurn: newTurn,
  };
}

/**
 * 보스 공격 처리 (턴 제한 시스템 포함)
 * Requirements: 7.4, 7.5 - 데미지 계산 및 전투 로그 처리
 */
export function processBossAttack(
  battleState: BattleState,
  playerStats: PlayerStats
): BattleState {
  if (battleState.battleResult !== "ongoing" || battleState.isPlayerTurn) {
    return battleState;
  }

  const damageResult = calculateDamage(
    battleState.boss.attack,
    playerStats.defense
  );
  const damage = damageResult.damage; // 보스는 크리티컬 없음

  const newPlayerHP = Math.max(0, battleState.playerHP - damage);
  const isDefeat = newPlayerHP <= 0;

  const attackLog = createBattleLogEntry(
    "boss_attack",
    `${battleState.boss.name}이 플레이어를 공격했습니다`,
    damage
  );

  let newBattleLog = [...battleState.battleLog, attackLog];
  let battleResult: BattleState["battleResult"] = "ongoing";

  if (isDefeat) {
    const defeatLog = createBattleLogEntry(
      "battle_end",
      `플레이어가 패배했습니다...`
    );
    newBattleLog.push(defeatLog);
    battleResult = "defeat";
  }

  return {
    ...battleState,
    playerHP: newPlayerHP,
    battleLog: newBattleLog,
    battleResult,
    isPlayerTurn: isDefeat ? false : true, // 패배하면 턴 종료, 아니면 플레이어 턴
  };
}

/**
 * 전투 턴 처리 (플레이어 또는 보스)
 * Requirements: 7.2, 7.3 - 턴 기반 전투 로직 및 결과 처리
 */
export function processBattleTurn(
  battleState: BattleState,
  playerStats: PlayerStats,
  isPlayerAction: boolean = true
): BattleState {
  if (battleState.battleResult !== "ongoing") {
    return battleState;
  }

  if (isPlayerAction && battleState.isPlayerTurn) {
    return processPlayerAttack(battleState, playerStats);
  } else if (!isPlayerAction && !battleState.isPlayerTurn) {
    return processBossAttack(battleState, playerStats);
  }

  return battleState;
}

/**
 * 전투 승리 조건 확인
 * Requirements: 7.6 - 승리/패배 조건 확인
 */
export function checkVictoryCondition(battleState: BattleState): boolean {
  return battleState.bossHP <= 0 && battleState.battleResult === "victory";
}

/**
 * 전투 패배 조건 확인
 * Requirements: 7.6 - 승리/패배 조건 확인
 */
export function checkDefeatCondition(battleState: BattleState): boolean {
  return battleState.playerHP <= 0 && battleState.battleResult === "defeat";
}

/**
 * 전투 재시작 (패배 시 재도전, 턴 제한 시스템 포함)
 * Requirements: 7.8 - 패배 시 재시도 허용
 */
export function restartBattle(
  boss: Boss,
  playerStats: PlayerStats
): BattleState {
  return initializeBattle(boss, playerStats);
}

/**
 * 전투 시뮬레이션 (자동 전투용, 추가타격 및 크리티컬 포함, 턴 제한 시스템)
 * 전투 결과를 미리 계산하여 승리 가능성 확인
 */
export function simulateBattle(
  boss: Boss,
  playerStats: PlayerStats,
  maxRounds: number = BATTLE_SETTINGS.maxBattleRounds
): {
  canWin: boolean;
  estimatedRounds: number;
  playerSurvivalRate: number;
  turnLimitExceeded: boolean;
} {
  let playerHP = calculatePlayerMaxHP(playerStats);
  let bossHP = boss.maxHP;
  let rounds = 0;
  const turnLimit = calculateTurnLimit(boss.stage);

  const additionalChance = calculateAdditionalAttackChance(playerStats);

  while (
    playerHP > 0 &&
    bossHP > 0 &&
    rounds < Math.min(maxRounds, turnLimit)
  ) {
    // 플레이어 공격
    if (BATTLE_SETTINGS.playerFirst || rounds % 2 === 0) {
      // 기본 공격 (크리티컬 포함)
      const playerDamageResult = calculateDamage(
        playerStats.attack,
        boss.defense,
        playerStats.defensePenetration,
        playerStats.criticalChance,
        playerStats.criticalDamageMultiplier
      );
      let totalPlayerDamage = playerDamageResult.damage;

      // 추가타격 확률 적용
      if (additionalChance > 0 && Math.random() < additionalChance) {
        const additionalDamageResult = calculateDamage(
          playerStats.attack,
          boss.defense,
          playerStats.defensePenetration,
          playerStats.criticalChance,
          playerStats.criticalDamageMultiplier
        );
        totalPlayerDamage += additionalDamageResult.damage;
      }

      bossHP = Math.max(0, bossHP - totalPlayerDamage);

      if (bossHP <= 0) break;
    }

    // 보스 공격 (크리티컬 없음)
    const bossDamageResult = calculateDamage(boss.attack, playerStats.defense);
    const bossDamage = bossDamageResult.damage;
    playerHP = Math.max(0, playerHP - bossDamage);

    rounds++;
  }

  const canWin = bossHP <= 0 && playerHP > 0;
  const turnLimitExceeded = rounds >= turnLimit && bossHP > 0;
  const playerMaxHPTotal = calculatePlayerMaxHP(playerStats);
  const playerSurvivalRate = playerHP / playerMaxHPTotal;

  return {
    canWin,
    estimatedRounds: rounds,
    playerSurvivalRate,
    turnLimitExceeded,
  };
}

/**
 * 스테이지별 보스 정보 가져오기
 */
export function getBossForStage(stage: number): Boss | null {
  const bossInfo = BOSS_INFO[stage];
  if (!bossInfo) {
    return null;
  }

  return createBossFromInfo(bossInfo, stage);
}

/**
 * 전투 통계 계산
 */
export function calculateBattleStats(battleState: BattleState): {
  totalDamageDealt: number;
  totalDamageTaken: number;
  playerAttacks: number;
  bossAttacks: number;
  battleDuration: number;
} {
  const playerAttackLogs = battleState.battleLog.filter(
    (log) => log.type === "player_attack"
  );
  const bossAttackLogs = battleState.battleLog.filter(
    (log) => log.type === "boss_attack"
  );

  const totalDamageDealt = playerAttackLogs.reduce(
    (sum, log) => sum + (log.damage || 0),
    0
  );
  const totalDamageTaken = bossAttackLogs.reduce(
    (sum, log) => sum + (log.damage || 0),
    0
  );

  const battleStart = battleState.battleLog.find(
    (log) => log.type === "battle_start"
  );
  const battleEnd = battleState.battleLog.find(
    (log) => log.type === "battle_end"
  );

  const battleDuration =
    battleEnd && battleStart ? battleEnd.timestamp - battleStart.timestamp : 0;

  return {
    totalDamageDealt,
    totalDamageTaken,
    playerAttacks: playerAttackLogs.length,
    bossAttacks: bossAttackLogs.length,
    battleDuration,
  };
}
