"use client";

import { useGame } from "../contexts/GameContext";

/**
 * CreditDisplay 컴포넌트 - 용사키우기 크레딧 표시
 * 새로운 색상 시스템으로 가독성 개선
 */
export function CreditDisplay() {
  const { gameState } = useGame();

  // 크레딧을 천 단위로 포맷팅하는 함수
  const formatCredits = (credits: number): string => {
    if (credits >= 1000000000) {
      return `${(credits / 1000000000).toFixed(1)}B`;
    } else if (credits >= 1000000) {
      return `${(credits / 1000000).toFixed(1)}M`;
    } else if (credits >= 1000) {
      return `${(credits / 1000).toFixed(1)}K`;
    }
    return Math.floor(credits).toString();
  };

  return (
    <div className="text-center">
      <h2 className="text-xl font-bold hero-text-primary mb-4 flex items-center justify-center">
        <span className="text-2xl mr-2 hero-pulse">💰</span>
        크레딧
      </h2>

      {/* 현재 크레딧 */}
      <div className="mb-4">
        <div className="text-3xl lg:text-4xl font-bold hero-text-accent mb-1 font-mono">
          {formatCredits(gameState.credits)}
        </div>
        <div className="text-sm hero-text-muted">보유 크레딧</div>
      </div>

      {/* 크레딧 생성률 */}
      <div className="hero-card-green p-3 rounded-lg">
        <div className="flex items-center justify-center mb-1">
          <span className="text-lg mr-2">⚡</span>
          <div className="text-lg font-semibold hero-text-green">
            +
            {gameState.creditPerSecond +
              gameState.playerStats.creditPerSecondBonus}
            /초
          </div>
        </div>
        <div className="text-xs hero-text-muted">
          기본 {gameState.creditPerSecond}
          {gameState.playerStats.creditPerSecondBonus > 0 &&
            ` + 물약 ${gameState.playerStats.creditPerSecondBonus}`}
        </div>
      </div>
    </div>
  );
}
