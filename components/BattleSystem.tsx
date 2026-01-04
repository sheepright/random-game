"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useGame } from "../contexts/GameContext";
import { BattleState, Boss, PlayerStats } from "../types/game";
import {
  initializeBattle,
  processBattleTurn,
  checkVictoryCondition,
  checkDefeatCondition,
  restartBattle,
  simulateBattle,
  getBossForStage,
  calculateBattleStats,
} from "../utils/battleSystem";
import { BATTLE_SETTINGS } from "../constants/game";

/**
 * BattleSystem 컴포넌트
 * 턴 기반 전투 로직 구현, 데미지 계산 시스템, 전투 로그 및 결과 처리, 승리/패배 조건 확인
 * Requirements: 7.2, 7.3, 7.4, 7.5, 7.6, 7.8
 */

interface BattleSystemProps {
  boss: Boss;
  onBattleEnd: (result: "victory" | "defeat", battleState: BattleState) => void;
  onBattleUpdate?: (battleState: BattleState) => void;
  autoPlay?: boolean;
  battleSpeed?: number;
}

interface BattleSystemHook {
  battleState: BattleState | null;
  isActive: boolean;
  isAutoPlay: boolean;
  battleSpeed: number;
  startBattle: () => void;
  performPlayerAttack: () => void;
  toggleAutoPlay: () => void;
  setBattleSpeed: (speed: number) => void;
  restartCurrentBattle: () => void;
  getBattleStats: () => ReturnType<typeof calculateBattleStats> | null;
  canPlayerWin: () => boolean;
}

/**
 * 전투 시스템 훅
 * 전투 상태와 로직을 관리하는 커스텀 훅
 */
export function useBattleSystem(
  boss: Boss,
  onBattleEnd: (result: "victory" | "defeat", battleState: BattleState) => void,
  onBattleUpdate?: (battleState: BattleState) => void
): BattleSystemHook {
  const { gameState } = useGame();
  const [battleState, setBattleState] = useState<BattleState | null>(null);
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [battleSpeed, setBattleSpeedState] = useState<number>(
    BATTLE_SETTINGS.autoAttackDelay
  );
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);
  const bossAttackTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 전투 시작
  const startBattle = useCallback(() => {
    const newBattleState = initializeBattle(boss, gameState.playerStats);
    setBattleState(newBattleState);
    onBattleUpdate?.(newBattleState);
  }, [boss, gameState.playerStats, onBattleUpdate]);

  // 플레이어 공격 수행
  const performPlayerAttack = useCallback(() => {
    if (!battleState || battleState.battleResult !== "ongoing") {
      return;
    }

    if (!battleState.isPlayerTurn) {
      console.warn("플레이어 턴이 아닙니다");
      return;
    }

    const newBattleState = processBattleTurn(
      battleState,
      gameState.playerStats,
      true
    );

    setBattleState(newBattleState);
    onBattleUpdate?.(newBattleState);

    // 전투 결과 확인
    if (checkVictoryCondition(newBattleState)) {
      onBattleEnd("victory", newBattleState);
      return;
    }

    // 보스가 살아있으면 보스 턴으로 전환하고 자동 공격 예약
    if (
      newBattleState.battleResult === "ongoing" &&
      !newBattleState.isPlayerTurn
    ) {
      bossAttackTimeoutRef.current = setTimeout(() => {
        performBossAttack(newBattleState);
      }, 1000); // 1초 후 보스 공격
    }
  }, [battleState, gameState.playerStats, onBattleUpdate, onBattleEnd]);

  // 보스 공격 수행
  const performBossAttack = useCallback(
    (currentBattleState: BattleState) => {
      if (
        currentBattleState.battleResult !== "ongoing" ||
        currentBattleState.isPlayerTurn
      ) {
        return;
      }

      const newBattleState = processBattleTurn(
        currentBattleState,
        gameState.playerStats,
        false
      );

      setBattleState(newBattleState);
      onBattleUpdate?.(newBattleState);

      // 전투 결과 확인
      if (checkDefeatCondition(newBattleState)) {
        onBattleEnd("defeat", newBattleState);
        return;
      }

      // 플레이어가 살아있으면 플레이어 턴으로 전환
      if (
        newBattleState.battleResult === "ongoing" &&
        newBattleState.isPlayerTurn
      ) {
        // 자동 플레이 모드라면 자동으로 플레이어 공격 수행
        if (isAutoPlay) {
          setTimeout(() => {
            const updatedState = processBattleTurn(
              newBattleState,
              gameState.playerStats,
              true
            );
            setBattleState(updatedState);
            onBattleUpdate?.(updatedState);

            if (checkVictoryCondition(updatedState)) {
              onBattleEnd("victory", updatedState);
            } else if (
              updatedState.battleResult === "ongoing" &&
              !updatedState.isPlayerTurn
            ) {
              // 다시 보스 턴
              setTimeout(() => performBossAttack(updatedState), 1000);
            }
          }, battleSpeed);
        }
      }
    },
    [
      gameState.playerStats,
      onBattleUpdate,
      onBattleEnd,
      isAutoPlay,
      battleSpeed,
    ]
  );

  // 자동 플레이 토글
  const toggleAutoPlay = useCallback(() => {
    setIsAutoPlay((prev) => !prev);
  }, []);

  // 전투 속도 설정
  const setBattleSpeed = useCallback((speed: number) => {
    setBattleSpeedState(speed);
  }, []);

  // 전투 재시작
  const restartCurrentBattle = useCallback(() => {
    // 기존 타이머들 정리
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
      autoPlayRef.current = null;
    }
    if (bossAttackTimeoutRef.current) {
      clearTimeout(bossAttackTimeoutRef.current);
      bossAttackTimeoutRef.current = null;
    }

    const newBattleState = restartBattle(boss, gameState.playerStats);
    setBattleState(newBattleState);
    onBattleUpdate?.(newBattleState);
  }, [boss, gameState.playerStats, onBattleUpdate]);

  // 전투 통계 가져오기
  const getBattleStats = useCallback(() => {
    if (!battleState) return null;
    return calculateBattleStats(battleState);
  }, [battleState]);

  // 플레이어 승리 가능성 확인
  const canPlayerWin = useCallback(() => {
    const simulation = simulateBattle(boss, gameState.playerStats);
    return simulation.canWin;
  }, [boss, gameState.playerStats]);

  // 자동 플레이 효과
  useEffect(() => {
    if (
      isAutoPlay &&
      battleState?.battleResult === "ongoing" &&
      battleState.isPlayerTurn
    ) {
      autoPlayRef.current = setInterval(() => {
        performPlayerAttack();
      }, battleSpeed);
    } else {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
        autoPlayRef.current = null;
      }
    }

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [
    isAutoPlay,
    battleState?.battleResult,
    battleState?.isPlayerTurn,
    battleSpeed,
    performPlayerAttack,
  ]);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
      if (bossAttackTimeoutRef.current) {
        clearTimeout(bossAttackTimeoutRef.current);
      }
    };
  }, []);

  return {
    battleState,
    isActive: battleState !== null,
    isAutoPlay,
    battleSpeed,
    startBattle,
    performPlayerAttack,
    toggleAutoPlay,
    setBattleSpeed,
    restartCurrentBattle,
    getBattleStats,
    canPlayerWin,
  };
}

/**
 * BattleSystem 컴포넌트
 * 전투 로직을 관리하는 메인 컴포넌트
 */
export function BattleSystem({
  boss,
  onBattleEnd,
  onBattleUpdate,
  autoPlay = false,
  battleSpeed = BATTLE_SETTINGS.autoAttackDelay,
}: BattleSystemProps) {
  const battleSystem = useBattleSystem(boss, onBattleEnd, onBattleUpdate);

  // 초기 설정
  useEffect(() => {
    if (autoPlay !== battleSystem.isAutoPlay) {
      battleSystem.toggleAutoPlay();
    }
  }, [autoPlay]);

  useEffect(() => {
    if (battleSpeed !== battleSystem.battleSpeed) {
      battleSystem.setBattleSpeed(battleSpeed);
    }
  }, [battleSpeed]);

  // 자동으로 전투 시작
  useEffect(() => {
    if (!battleSystem.isActive) {
      battleSystem.startBattle();
    }
  }, []);

  // 이 컴포넌트는 로직만 담당하므로 UI를 렌더링하지 않음
  return null;
}

/**
 * 스테이지별 보스 전투 시스템
 * 특정 스테이지의 보스와 전투하는 컴포넌트
 */
interface StageBattleSystemProps {
  stage: number;
  onBattleEnd: (result: "victory" | "defeat", battleState: BattleState) => void;
  onBattleUpdate?: (battleState: BattleState) => void;
  autoPlay?: boolean;
  battleSpeed?: number;
}

export function StageBattleSystem({
  stage,
  onBattleEnd,
  onBattleUpdate,
  autoPlay = false,
  battleSpeed = BATTLE_SETTINGS.autoAttackDelay,
}: StageBattleSystemProps) {
  const boss = getBossForStage(stage);

  if (!boss) {
    console.error(`스테이지 ${stage}의 보스를 찾을 수 없습니다`);
    return null;
  }

  return (
    <BattleSystem
      boss={boss}
      onBattleEnd={onBattleEnd}
      onBattleUpdate={onBattleUpdate}
      autoPlay={autoPlay}
      battleSpeed={battleSpeed}
    />
  );
}

export default BattleSystem;
