"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useGame } from "../contexts/GameContext";
import { BattleState, BattleLogEntry, Boss, PlayerStats } from "../types/game";
import {
  calculateAdditionalAttackChance,
  initializeBattle,
  processPlayerAttack,
  processBossAttack,
} from "../utils/battleSystem";

/**
 * BattleModal 컴포넌트
 * 보스 전투 인터페이스, 전투 진행 상황 표시, 전투 로그 및 결과 화면 제공
 * Requirements: 7.9, 9.5
 */

interface BattleModalProps {
  isVisible: boolean;
  boss: Boss;
  onClose: () => void;
  onVictory: () => void;
  onDefeat: () => void;
}

interface HealthBarProps {
  current: number;
  max: number;
  color: "red" | "green";
  label: string;
}

function HealthBar({ current, max, color, label }: HealthBarProps) {
  const percentage = Math.max(0, (current / max) * 100);
  const barColor =
    color === "red" ? "hero-progress-red" : "hero-progress-green";
  const bgColor = "hero-progress";

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-semibold hero-text-primary">{label}</span>
        <span className="text-sm hero-text-secondary">
          {current} / {max}
        </span>
      </div>
      <div className={`w-full h-4 ${bgColor} rounded-full overflow-hidden`}>
        <div
          className={`h-full ${barColor} transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

interface BattleLogProps {
  logs: BattleLogEntry[];
}

function BattleLog({ logs }: BattleLogProps) {
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const getLogColor = (type: BattleLogEntry["type"]) => {
    switch (type) {
      case "player_attack":
        return "hero-text-blue";
      case "boss_attack":
        return "hero-text-red";
      case "battle_start":
        return "hero-text-green";
      case "battle_end":
        return "hero-text-purple";
      default:
        return "hero-text-secondary";
    }
  };

  return (
    <div className="hero-card p-3 h-32 overflow-y-auto">
      <h3 className="text-sm font-semibold mb-2 hero-text-primary">
        전투 로그
      </h3>
      <div className="space-y-1">
        {logs.length === 0 ? (
          <div className="hero-text-muted text-center py-2 text-xs">
            전투가 시작되지 않았습니다
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className={`text-xs ${getLogColor(
                log.type
              )} hero-card rounded px-2 py-1`}
            >
              <span className="text-gray-400 text-xs mr-1">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
              {log.message}
              {log.damage && (
                <span className="font-bold ml-1">({log.damage} 데미지)</span>
              )}
            </div>
          ))
        )}
        <div ref={logEndRef} />
      </div>
    </div>
  );
}

interface BattleStatsProps {
  playerStats: PlayerStats;
  boss: Boss;
}

function BattleStats({ playerStats, boss }: BattleStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* 플레이어 스탯 */}
      <div className="hero-card-blue p-3 rounded-lg">
        <h3 className="text-sm font-semibold hero-text-blue mb-2">플레이어</h3>
        <div className="space-y-1 text-xs hero-text-secondary">
          <div className="flex justify-between">
            <span>공격력:</span>
            <span className="font-semibold hero-text-primary">
              {playerStats.attack}
            </span>
          </div>
          <div className="flex justify-between">
            <span>방어력:</span>
            <span className="font-semibold hero-text-primary">
              {playerStats.defense}
            </span>
          </div>
          <div className="flex justify-between">
            <span>방어력 무시:</span>
            <span className="font-semibold hero-text-primary">
              {playerStats.defensePenetration}
            </span>
          </div>
          <div className="flex justify-between">
            <span>추가타격:</span>
            <span className="font-semibold hero-text-primary">
              {(playerStats.additionalAttackChance * 100).toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span>크리확률:</span>
            <span className="font-semibold hero-text-primary">
              {(playerStats.criticalChance * 100).toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span>크리데미지:</span>
            <span className="font-semibold hero-text-primary">
              +{(playerStats.criticalDamageMultiplier * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* 보스 스탯 */}
      <div className="hero-card-red p-3 rounded-lg">
        <h3 className="text-sm font-semibold hero-text-red mb-2">
          {boss.name}
        </h3>
        <div className="space-y-1 text-xs hero-text-secondary">
          <div className="flex justify-between">
            <span>공격력:</span>
            <span className="font-semibold">{boss.attack}</span>
          </div>
          <div className="flex justify-between">
            <span>방어력:</span>
            <span className="font-semibold">{boss.defense}</span>
          </div>
          <div className="flex justify-between">
            <span>최대 HP:</span>
            <span className="font-semibold">{boss.maxHP}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function BattleModal({
  isVisible,
  boss,
  onClose,
  onVictory,
  onDefeat,
}: BattleModalProps) {
  const { gameState } = useGame();
  const [battleState, setBattleState] = useState<BattleState | null>(null);
  const [isAutoAttack, setIsAutoAttack] = useState(false);
  const [battleSpeed, setBattleSpeed] = useState(1000); // ms
  const autoAttackRef = useRef<NodeJS.Timeout | null>(null);

  // 전투 초기화
  useEffect(() => {
    if (isVisible && !battleState) {
      initializeBattleState();
    }
  }, [isVisible]);

  const performBossAttack = useCallback(() => {
    setBattleState((prev) => {
      if (!prev || prev.battleResult !== "ongoing") return prev;

      return processBossAttack(prev, gameState.playerStats);
    });
  }, [gameState.playerStats]);

  const performPlayerAttack = useCallback(() => {
    setBattleState((prev) => {
      if (!prev || prev.battleResult !== "ongoing") return prev;

      const newState = processPlayerAttack(prev, gameState.playerStats);

      // 보스가 살아있고 플레이어 턴이 끝났으면 보스 공격 예약
      if (newState.battleResult === "ongoing" && !newState.isPlayerTurn) {
        setTimeout(() => performBossAttack(), 1000);
      }

      return newState;
    });
  }, [gameState.playerStats, performBossAttack]);

  // 자동 공격 처리
  useEffect(() => {
    if (
      isAutoAttack &&
      battleState?.battleResult === "ongoing" &&
      battleState?.isPlayerTurn
    ) {
      autoAttackRef.current = setInterval(() => {
        performPlayerAttack();
      }, battleSpeed);
    } else {
      if (autoAttackRef.current) {
        clearInterval(autoAttackRef.current);
        autoAttackRef.current = null;
      }
    }

    return () => {
      if (autoAttackRef.current) {
        clearInterval(autoAttackRef.current);
      }
    };
  }, [
    isAutoAttack,
    battleState?.battleResult,
    battleState?.isPlayerTurn,
    battleSpeed,
    performPlayerAttack,
  ]);

  // 전투 결과 처리
  useEffect(() => {
    if (battleState?.battleResult === "victory") {
      setTimeout(() => onVictory(), 2000);
    } else if (
      battleState?.battleResult === "defeat" ||
      battleState?.battleResult === "timeout"
    ) {
      setTimeout(() => onDefeat(), 2000);
    }
  }, [battleState?.battleResult]);

  const initializeBattleState = () => {
    const newBattleState = initializeBattle(boss, gameState.playerStats);
    setBattleState(newBattleState);
  };

  const handleManualAttack = () => {
    if (battleState?.isPlayerTurn && battleState.battleResult === "ongoing") {
      performPlayerAttack();
    }
  };

  const toggleAutoAttack = () => {
    setIsAutoAttack(!isAutoAttack);
  };

  const handleClose = () => {
    setIsAutoAttack(false);
    setBattleState(null);
    onClose();
  };

  // 턴 제한 계산
  const calculateTurnLimit = (stage: number): number => {
    const baseTurnLimit = 30;
    const turnLimitReduction = 0.1;
    const minTurnLimit = 10;
    const reduction = Math.floor((stage - 1) * turnLimitReduction);
    return Math.max(minTurnLimit, baseTurnLimit - reduction);
  };

  const currentStage = gameState.currentStage;
  const turnLimit = calculateTurnLimit(currentStage);
  const remainingTurns = battleState
    ? turnLimit - battleState.currentTurn
    : turnLimit;

  if (!isVisible) return null;

  const playerMaxHP = 100 + gameState.playerStats.defense * 2;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="hero-card max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* 헤더 - 간소화 */}
        <div className="hero-card-red p-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold hero-text-primary">
                보스 전투 - {boss.name}
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="hero-text-primary hover:hero-text-secondary text-2xl font-bold transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        {/* 메인 콘텐츠 - 고정 높이, 스크롤 없음 */}
        <div className="flex-1 p-4 space-y-4 min-h-0">
          {/* HP 바 및 턴 정보 */}
          {battleState && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <HealthBar
                  current={battleState.playerHP}
                  max={playerMaxHP}
                  color="green"
                  label="플레이어 HP"
                />
                <HealthBar
                  current={battleState.bossHP}
                  max={boss.maxHP}
                  color="red"
                  label={`${boss.name} HP`}
                />
              </div>

              {/* 간단한 턴 정보 */}
              <div className="text-center">
                <span className="text-sm hero-text-secondary">턴: </span>
                <span className="text-sm font-semibold hero-text-primary">
                  {battleState.currentTurn}
                </span>
                <span className="text-sm hero-text-secondary"> / </span>
                <span className="text-sm font-semibold hero-text-muted">
                  {turnLimit}
                </span>
                <span
                  className={`text-sm font-semibold ml-2 ${
                    remainingTurns <= 5
                      ? "hero-text-red"
                      : remainingTurns <= 10
                      ? "text-yellow-400"
                      : "hero-text-green"
                  }`}
                >
                  (남은 턴: {remainingTurns})
                </span>
              </div>
            </div>
          )}

          {/* 전투 스탯 */}
          <BattleStats playerStats={gameState.playerStats} boss={boss} />

          {/* 전투 컨트롤 */}
          {battleState && battleState.battleResult === "ongoing" && (
            <div className="hero-card p-3 rounded-lg">
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <button
                  onClick={handleManualAttack}
                  disabled={!battleState.isPlayerTurn}
                  className={
                    battleState.isPlayerTurn
                      ? "hero-btn hero-btn-primary text-sm px-3 py-1"
                      : "hero-btn hero-btn-disabled text-sm px-3 py-1"
                  }
                >
                  공격
                </button>

                <button
                  onClick={toggleAutoAttack}
                  className={`hero-btn text-sm px-3 py-1 ${
                    isAutoAttack ? "hero-btn-danger" : "hero-btn-success"
                  }`}
                >
                  {isAutoAttack ? "자동 중지" : "자동 공격"}
                </button>

                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium hero-text-secondary">
                    속도:
                  </label>
                  <select
                    value={battleSpeed}
                    onChange={(e) => setBattleSpeed(Number(e.target.value))}
                    className="hero-input text-xs px-2 py-1"
                  >
                    <option value={2000}>느림</option>
                    <option value={1000}>보통</option>
                    <option value={500}>빠름</option>
                  </select>
                </div>

                {battleState.isPlayerTurn ? (
                  <span className="hero-text-green font-semibold text-xs">
                    플레이어 턴
                  </span>
                ) : (
                  <span className="hero-text-red font-semibold text-xs">
                    보스 턴
                  </span>
                )}
              </div>
            </div>
          )}

          {/* 전투 결과 */}
          {battleState?.battleResult !== "ongoing" && (
            <div
              className={`text-center p-4 rounded-lg ${
                battleState?.battleResult === "victory"
                  ? "hero-card-green"
                  : battleState?.battleResult === "timeout"
                  ? "hero-card-accent"
                  : "hero-card-red"
              }`}
            >
              <h3 className="text-xl font-bold mb-2 hero-text-primary">
                {battleState?.battleResult === "victory"
                  ? "승리!"
                  : battleState?.battleResult === "timeout"
                  ? "시간 초과!"
                  : "패배..."}
              </h3>
              <p className="text-sm hero-text-secondary">
                {battleState?.battleResult === "victory"
                  ? "다음 스테이지가 해금되었습니다!"
                  : battleState?.battleResult === "timeout"
                  ? "턴 제한에 도달했습니다. 더 강한 장비가 필요합니다!"
                  : "다시 도전해보세요!"}
              </p>
            </div>
          )}

          {/* 전투 로그 - 고정 높이 */}
          {battleState && <BattleLog logs={battleState.battleLog} />}
        </div>

        {/* 하단 버튼 - 간소화 */}
        <div className="hero-card-accent px-4 py-3 flex justify-end">
          <button
            onClick={handleClose}
            className="hero-btn hero-btn-primary text-sm"
          >
            {battleState?.battleResult === "ongoing" ? "전투 포기" : "닫기"}
          </button>
        </div>
      </div>

      {/* 배경 클릭으로 닫기 */}
      <div className="absolute inset-0 -z-10" onClick={handleClose} />
    </div>
  );
}

export default BattleModal;
