"use client";

import { useGame } from "../contexts/GameContext";
import { STAGE_REQUIREMENTS } from "../constants/game";
import {
  canStartBossBattle,
  getBattlePreview,
  calculateStageClearReward,
} from "../utils/stageManager";

/**
 * StageProgress 컴포넌트 - 용사키우기 스테이지 진행
 * 새로운 색상 시스템으로 가독성 개선
 */

interface StageProgressProps {
  onStartBattle?: () => void;
}

export function StageProgress({ onStartBattle }: StageProgressProps) {
  const { gameState, actions } = useGame();

  // 스탯 값을 포맷팅하는 함수
  const formatStat = (value: number): string => {
    if (value >= 1000000000) {
      return `${(value / 1000000000).toFixed(1)}B`;
    } else if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return Math.floor(value).toString();
  };

  // 추가타격 확률을 퍼센트로 포맷팅하는 함수
  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(1)}%`;
  };

  // 총 전투력 계산
  const totalPower =
    gameState.playerStats.attack +
    gameState.playerStats.defense +
    gameState.playerStats.defensePenetration;

  const currentStage = gameState.currentStage;
  const currentRequirements = STAGE_REQUIREMENTS[currentStage];

  // 현재 단계 보스 전투 가능 여부 확인
  const battleInfo = canStartBossBattle(gameState.playerStats, currentStage);
  const canStartBattle = battleInfo.canStart;
  const boss = battleInfo.boss;
  const battlePreview = battleInfo.battlePreview;

  // 스테이지 클리어 보상 계산
  const stageClearReward = calculateStageClearReward(currentStage);

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

  // 크레딧 클릭 획득 핸들러 - 물약 보너스 포함
  const handleClickCredit = () => {
    // 기본 크레딧 + 물약으로 추가된 크레딧 보너스
    const totalCreditPerSecond =
      gameState.creditPerSecond + gameState.playerStats.creditPerSecondBonus;
    actions.addCredits(totalCreditPerSecond);
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
          <div className="text-sm hero-text-green mt-1">
            💰 클리어 보상: {stageClearReward.toLocaleString()} 크레딧
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

      {/* 클릭 던전 섹션 - 독립적인 영역 */}
      <div className="mt-6 mb-4">
        <div className="hero-card hero-card-accent p-4 rounded-xl border-2 border-yellow-400/30 shadow-lg">
          <div className="text-center mb-3">
            <h3 className="text-base font-bold hero-text-accent mb-1 flex items-center justify-center">
              <span className="text-lg mr-1">⛏️</span>
              클릭 던전
              <span className="text-lg ml-1">⛏️</span>
            </h3>
            <p className="text-xs hero-text-secondary">
              던전을 탐험하여 크레딧을 발견하세요!
            </p>
          </div>

          <div className="relative">
            {/* 던전 배경 효과 */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 to-orange-900/20 rounded-lg"></div>

            <button
              onClick={handleClickCredit}
              className="relative w-full py-6 px-4 bg-gradient-to-br from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 
                         text-white font-bold text-xl rounded-lg shadow-xl transform transition-all duration-150 
                         hover:scale-105 active:scale-95 border-2 border-amber-400/50 hover:border-amber-300
                         hero-glow"
              style={{
                textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
                boxShadow:
                  "0 8px 25px rgba(245, 158, 11, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)",
              }}
            >
              <div className="flex flex-col items-center">
                <div className="text-3xl mb-2 animate-bounce">💎</div>
                <div className="text-lg font-bold">던전 탐험!</div>
                <div className="text-sm font-normal mt-1 opacity-90">
                  +
                  {(
                    gameState.creditPerSecond +
                    gameState.playerStats.creditPerSecondBonus
                  ).toLocaleString()}{" "}
                  크레딧 발견
                </div>
              </div>

              {/* 클릭 효과를 위한 반짝이는 효과 */}
              <div className="absolute top-2 right-2 text-yellow-300 animate-pulse">
                ✨
              </div>
              <div
                className="absolute bottom-2 left-2 text-yellow-300 animate-pulse"
                style={{ animationDelay: "0.5s" }}
              >
                ✨
              </div>
            </button>
          </div>

          <div className="mt-3 text-center text-xs hero-text-muted">
            💡 팁: 클릭할 때마다 초당 크레딧 + 물약 보너스만큼 즉시 획득!
          </div>

          {/* 용사 스탯 */}
          <div className="mt-4 pt-4 border-t border-amber-400/20">
            <div className="grid grid-cols-4 gap-1.5 mb-2">
              {/* 공격력 */}
              <div className="hero-card-red p-1.5 rounded-lg text-center">
                <div className="text-xs hero-text-secondary">공격력</div>
                <div className="text-sm font-bold hero-text-red font-mono">
                  {formatStat(gameState.playerStats.attack)}
                </div>
              </div>

              {/* 방어력 */}
              <div className="hero-card-blue p-1.5 rounded-lg text-center">
                <div className="text-xs hero-text-secondary">방어력</div>
                <div className="text-sm font-bold hero-text-blue font-mono">
                  {formatStat(gameState.playerStats.defense)}
                </div>
              </div>

              {/* 방어율 무시 */}
              <div className="hero-card-purple p-1.5 rounded-lg text-center">
                <div className="text-xs hero-text-secondary">방무</div>
                <div className="text-sm font-bold hero-text-purple font-mono">
                  {formatStat(gameState.playerStats.defensePenetration)}
                </div>
              </div>

              {/* 추가타격 확률 */}
              <div className="hero-card-green p-1.5 rounded-lg text-center">
                <div className="text-xs hero-text-secondary">추가타격</div>
                <div className="text-sm font-bold hero-text-green font-mono">
                  {formatPercentage(
                    gameState.playerStats.additionalAttackChance
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {/* 크레딧 보너스 */}
              <div className="hero-card-accent p-1.5 rounded-lg text-center">
                <div className="text-xs hero-text-secondary">크레딧/초</div>
                <div className="text-sm font-bold hero-text-accent font-mono">
                  +{formatStat(gameState.playerStats.creditPerSecondBonus)}
                </div>
              </div>

              {/* 크리티컬 확률 */}
              <div className="hero-card-green p-1.5 rounded-lg text-center">
                <div className="text-xs hero-text-secondary">크리확률</div>
                <div className="text-sm font-bold hero-text-green font-mono">
                  {formatPercentage(gameState.playerStats.criticalChance)}
                </div>
              </div>

              {/* 크리티컬 데미지 */}
              <div className="hero-card-red p-1.5 rounded-lg text-center">
                <div className="text-xs hero-text-secondary">크리데미지</div>
                <div className="text-sm font-bold hero-text-red font-mono">
                  +
                  {formatPercentage(
                    gameState.playerStats.criticalDamageMultiplier
                  )}
                </div>
              </div>

              {/* 총 전투력 */}
              <div className="hero-card-accent p-1.5 rounded-lg text-center">
                <div className="text-xs hero-text-muted">전투력</div>
                <div className="text-sm font-bold hero-text-accent font-mono">
                  {formatStat(totalPower)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 최고 스테이지 달성 */}
      {currentStage >= 100 && (
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
