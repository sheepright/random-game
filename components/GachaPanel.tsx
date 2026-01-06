/**
 * GachaPanel Component
 * 가챠 카테고리 선택 인터페이스, 가챠 비용 및 확률 표시, 가챠 뽑기 버튼 및 상태 관리
 * Requirements: 11.6, 11.7
 */

"use client";

import { useState } from "react";
import { useGame } from "../contexts/GameContext";
import { GachaCategory, ItemGrade, GachaResult } from "../types/game";
import {
  GACHA_COSTS,
  GACHA_RATES,
  GACHA_CATEGORY_NAMES,
  GRADE_NAMES,
} from "../constants/game";
import { canPerformGacha } from "../utils/gachaSystem";

interface GachaPanelProps {
  onGachaResult?: (result: GachaResult) => void;
}

export default function GachaPanel({ onGachaResult }: GachaPanelProps) {
  const { gameState, actions } = useGame();
  const [selectedCategory, setSelectedCategory] = useState<GachaCategory>(
    GachaCategory.ARMOR
  );
  const [isDrawing, setIsDrawing] = useState(false);

  const handleGachaDraw = async () => {
    if (isDrawing) return;

    try {
      setIsDrawing(true);

      // 가챠 뽑기 수행
      const result = actions.performGachaDraw(selectedCategory);

      // 결과 콜백 호출
      if (onGachaResult) {
        onGachaResult(result);
      }
    } catch (error) {
      console.error("가챠 뽑기 실패:", error);
      // 에러 처리 (토스트 알림 등)
    } finally {
      setIsDrawing(false);
    }
  };

  const canDraw = canPerformGacha(selectedCategory, gameState.credits);
  const cost = GACHA_COSTS[selectedCategory];

  return (
    <div className="hero-card p-6">
      <h2 className="text-2xl font-bold hero-text-primary mb-6 text-center">
        🎲 가챠 뽑기
      </h2>

      {/* 카테고리 선택 */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold hero-text-primary mb-3">
          카테고리 선택
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {Object.values(GachaCategory).map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`p-3 rounded-lg border-2 transition-all ${
                selectedCategory === category
                  ? "hero-card-blue border-blue-400 hero-text-blue"
                  : "hero-card border-gray-500 hero-text-secondary hover:border-gray-400"
              }`}
            >
              <div className="text-sm font-medium">
                {GACHA_CATEGORY_NAMES[category]}
              </div>
              <div className="text-xs hero-text-muted mt-1">
                {GACHA_COSTS[category].toLocaleString()} 크레딧
              </div>
            </button>
          ))}
        </div>
      </div>
      {/* 확률 정보 */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold hero-text-primary mb-3">
          드랍 확률
        </h3>
        <div className="space-y-2">
          {Object.entries(GACHA_RATES).map(([grade, rate]) => (
            <div
              key={grade}
              className={`p-2 rounded border text-center ${
                grade === ItemGrade.MYTHIC
                  ? "hero-card-red hero-text-red"
                  : grade === ItemGrade.LEGENDARY
                  ? "hero-card-accent hero-text-accent"
                  : grade === ItemGrade.EPIC
                  ? "hero-card-purple hero-text-purple"
                  : grade === ItemGrade.RARE
                  ? "hero-card-blue hero-text-blue"
                  : "hero-card hero-text-secondary"
              }`}
            >
              <div className="text-sm font-medium">
                {GRADE_NAMES[grade as ItemGrade]}
              </div>
              <div className="text-xs">{(rate * 100).toFixed(1)}%</div>
            </div>
          ))}
        </div>
      </div>

      {/* 현재 크레딧 및 비용 */}
      <div className="mb-6 p-4 hero-card rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <span className="hero-text-secondary">보유 크레딧:</span>
          <span className="font-bold text-lg hero-text-primary">
            {gameState.credits.toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="hero-text-secondary">필요 크레딧:</span>
          <span
            className={`font-bold ${
              canDraw ? "hero-text-green" : "hero-text-red"
            }`}
          >
            {cost.toLocaleString()}
          </span>
        </div>
      </div>

      {/* 가챠 뽑기 버튼 */}
      <button
        onClick={handleGachaDraw}
        disabled={!canDraw || isDrawing}
        className={
          canDraw && !isDrawing
            ? "hero-btn hero-btn-primary w-full text-lg py-4"
            : "hero-btn hero-btn-disabled w-full text-lg py-4"
        }
      >
        {isDrawing ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-current mr-2"></div>
            뽑는 중...
          </div>
        ) : canDraw ? (
          `${GACHA_CATEGORY_NAMES[selectedCategory]} 가챠 뽑기`
        ) : (
          "크레딧 부족"
        )}
      </button>

      {/* 도움말 */}
      <div className="mt-4 text-xs hero-text-muted text-center">
        💡 가챠로 획득한 아이템은 자동으로 인벤토리에 추가됩니다
      </div>
    </div>
  );
}
