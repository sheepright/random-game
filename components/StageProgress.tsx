"use client";

import { useGame } from "../contexts/GameContext";
import { STAGE_REQUIREMENTS } from "../constants/game";
import { canStartBossBattle, getBattlePreview } from "../utils/stageManager";

/**
 * StageProgress 컴포넌트 - 용사키우기 스테이지 진행
 * 새로운 색상 시스템으로 가독성 개선
 */

interface StageProgressProps {
  onStartBattle?: () => void;
}

export function StageProgress({ onStartBattle }: StageProgressProps) {
  const { gameState, actions } = useGame();

  const currentStage = gameState.currentStage;
  const nextStage = currentStage + 1;
  const currentRequirements = STAGE_REQUIREMENTS[currentStage];
  const nextRequirements = STAGE_REQUIREMENTS[nextStage];

  // 현재 단계 보스 전투 가능 여부 확인
  const battleInfo = canStartBossBattle(gameState.playerStats, currentStage);
  const canStartBattle = battleInfo.canStart;
  const boss = battleInfo.boss;
  const battlePreview = battleInfo.battlePreview;

  // 보스 전투 시작 핸들러
  const handleStartBattle = () => {
    if (canStartBattle && boss) {
      if (onStartBattle) {
        onStartBattle();
      } else {
        actions.startBattle(boss);
      }
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold hero-text-primary mb-4 flex items-center justify-center">
        <span className="text-2xl mr-2 hero-pulse">🏆</span>
        스테이지 {currentStage}
      </h2>

      {/* 현재 스테이지 정보 */}
      <div className="mb-4">
        <div className="text-center mb-3">
          <div className="text-lg font-semibold hero-text-purple">
            크레딧 배율: {currentRequirements.creditMultiplier}x
          </div>
        </div>

        {/* 보스 전투 */}
        {canStartBattle && boss && (
          <div className="space-y-3">
            <div className="hero-card-red p-3 rounded-lg text-center">
              <div className="text-lg font-bold hero-text-red mb-1">
                👹 {boss.name}
              </div>
              <div className="text-sm hero-text-secondary">
                HP: {boss.maxHP.toLocaleString()} | 공격:{" "}
                {boss.attack.toLocaleString()} | 방어:{" "}
                {boss.defense.toLocaleString()}
              </div>
              {battlePreview && (
                <div
                  className={`text-sm font-medium mt-1 ${
                    battlePreview.canWin ? "hero-text-green" : "hero-text-red"
                  }`}
                >
                  승리 예상: {battlePreview.canWin ? "가능" : "어려움"}
                </div>
              )}
            </div>

            {!gameState.battleState ? (
              <button
                onClick={handleStartBattle}
                className={
                  battlePreview?.canWin
                    ? "hero-btn hero-btn-success w-full"
                    : "hero-btn hero-btn-danger w-full"
                }
              >
                ⚔️ 보스 전투 시작!
              </button>
            ) : (
              <div className="hero-card-accent p-3 rounded-lg text-center">
                <div className="hero-text-accent font-medium">
                  🔥 전투 진행 중...
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 다음 스테이지 목표 */}
      {nextRequirements && (
        <div className="hero-card-blue p-4 rounded-lg">
          <h3 className="text-center hero-text-accent font-semibold mb-3">
            🎯 다음 스테이지 {nextStage} 목표
          </h3>

          <div className="space-y-3">
            {/* 공격력 */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="hero-text-red">⚔️ 공격력</span>
                <span className="hero-text-secondary">
                  {gameState.playerStats.attack.toLocaleString()} /{" "}
                  {nextRequirements.requiredAttack.toLocaleString()}
                </span>
              </div>
              <div className="hero-progress">
                <div
                  className="hero-progress-bar hero-progress-red"
                  style={{
                    width: `${Math.min(
                      (gameState.playerStats.attack /
                        nextRequirements.requiredAttack) *
                        100,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>

            {/* 방어력 */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="hero-text-blue">🛡️ 방어력</span>
                <span className="hero-text-secondary">
                  {gameState.playerStats.defense.toLocaleString()} /{" "}
                  {nextRequirements.requiredDefense.toLocaleString()}
                </span>
              </div>
              <div className="hero-progress">
                <div
                  className="hero-progress-bar hero-progress-blue"
                  style={{
                    width: `${Math.min(
                      (gameState.playerStats.defense /
                        nextRequirements.requiredDefense) *
                        100,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="mt-3 text-center text-sm hero-text-green">
            🎁 보상: 크레딧 생성률 {nextRequirements.creditMultiplier}x
          </div>
        </div>
      )}

      {/* 최고 스테이지 달성 */}
      {!nextRequirements && (
        <div className="hero-card-accent p-4 rounded-lg text-center">
          <div className="text-2xl mb-2 hero-float">🎊</div>
          <div className="hero-text-accent font-bold text-lg mb-1">
            축하합니다!
          </div>
          <div className="text-sm hero-text-secondary">
            모든 스테이지를 클리어했습니다!
          </div>
        </div>
      )}
    </div>
  );
}
