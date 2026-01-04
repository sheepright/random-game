"use client";

import { useGame } from "../contexts/GameContext";
import { STAT_NAMES } from "../constants/game";

/**
 * PlayerStatsDisplay 컴포넌트 - 용사키우기 플레이어 스탯
 * 새로운 색상 시스템으로 가독성 개선
 */
export function PlayerStatsDisplay() {
  const { gameState } = useGame();

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

  return (
    <div>
      <h2 className="text-lg font-bold hero-text-primary mb-2 flex items-center justify-center">
        <span className="text-lg mr-2 hero-pulse">📊</span>
        용사 스탯
      </h2>

      <div className="grid grid-cols-5 gap-2">
        {/* 공격력 */}
        <div className="hero-card-red p-2 rounded-lg text-center">
          <div className="text-sm">⚔️</div>
          <div className="text-xs hero-text-secondary">공격력</div>
          <div className="text-sm font-bold hero-text-red font-mono">
            {formatStat(gameState.playerStats.attack)}
          </div>
        </div>

        {/* 방어력 */}
        <div className="hero-card-blue p-2 rounded-lg text-center">
          <div className="text-sm">🛡️</div>
          <div className="text-xs hero-text-secondary">방어력</div>
          <div className="text-sm font-bold hero-text-blue font-mono">
            {formatStat(gameState.playerStats.defense)}
          </div>
        </div>

        {/* 방어율 무시 */}
        <div className="hero-card-purple p-2 rounded-lg text-center">
          <div className="text-sm">💥</div>
          <div className="text-xs hero-text-secondary">방무</div>
          <div className="text-sm font-bold hero-text-purple font-mono">
            {formatStat(gameState.playerStats.defensePenetration)}
          </div>
        </div>

        {/* 추가타격 확률 */}
        <div className="hero-card-green p-2 rounded-lg text-center">
          <div className="text-sm">⚡</div>
          <div className="text-xs hero-text-secondary">추가타격</div>
          <div className="text-sm font-bold hero-text-green font-mono">
            {formatPercentage(gameState.playerStats.additionalAttackChance)}
          </div>
        </div>

        {/* 총 전투력 */}
        <div className="hero-card-accent p-2 rounded-lg text-center">
          <div className="text-sm">⭐</div>
          <div className="text-xs hero-text-muted">전투력</div>
          <div className="text-sm font-bold hero-text-accent font-mono">
            {formatStat(totalPower)}
          </div>
        </div>
      </div>
    </div>
  );
}
