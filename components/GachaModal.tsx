"use client";

import { useState } from "react";
import { useGame } from "../contexts/GameContext";
import {
  GachaCategory,
  GachaResult,
  MultiGachaResult,
  ItemGrade,
} from "../types/game";
import {
  GACHA_COSTS,
  GACHA_CATEGORY_NAMES,
  GACHA_RATES,
  GRADE_NAMES,
} from "../constants/game";

interface GachaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGachaResult: (result: GachaResult) => void;
  onMultiGachaResult: (result: MultiGachaResult) => void;
}

export function GachaModal({
  isOpen,
  onClose,
  onGachaResult,
  onMultiGachaResult,
}: GachaModalProps) {
  const { gameState, actions } = useGame();
  const [selectedCategory, setSelectedCategory] = useState<GachaCategory>(
    GachaCategory.ARMOR
  );
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleGacha = async (category: GachaCategory, count: number = 1) => {
    const cost = GACHA_COSTS[category] * count;

    if (gameState.credits < cost) {
      alert("크레딧이 부족합니다!");
      return;
    }

    setIsProcessing(true);

    try {
      if (count === 1) {
        // 단일 뽑기
        const result = actions.performGachaDraw(category);
        if (result) {
          onGachaResult(result);
          onClose();
        }
      } else {
        // 10연뽑
        const results: GachaResult[] = [];
        for (let i = 0; i < count; i++) {
          const result = actions.performGachaDraw(category);
          if (result) {
            results.push(result);
          }
        }

        if (results.length > 0) {
          // 10연뽑 결과를 MultiGachaResult로 변환
          const multiResult: MultiGachaResult = {
            items: results.map((r) => r.item),
            category,
            totalCost: cost,
            count: results.length,
          };
          onMultiGachaResult(multiResult);
          onClose();
        }
      }
    } catch (error) {
      console.error("가챠 실행 중 오류:", error);
      alert("가챠 실행 중 오류가 발생했습니다.");
    } finally {
      setIsProcessing(false);
    }
  };

  const gachaCategories = [
    {
      category: GachaCategory.ARMOR,
      name: "방어구",
      icon: "🛡️",
      description: "헬멧, 아머, 팬츠, 글러브, 슈즈",
    },
    {
      category: GachaCategory.ACCESSORIES,
      name: "장신구",
      icon: "💍",
      description: "귀걸이, 목걸이, 반지, 숄더",
    },
    {
      category: GachaCategory.WEAPONS,
      name: "무기",
      icon: "⚔️",
      description: "주무기, 보조무기, 펫",
    },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="hero-card rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="hero-card-green p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold hero-text-primary">
                🎲 가챠 뽑기
              </h2>
              <p className="hero-text-secondary mt-1">
                크레딧으로 새로운 장비를 획득하세요
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="hero-text-primary hover:hero-text-secondary text-3xl font-bold transition-colors disabled:opacity-50"
            >
              ×
            </button>
          </div>
        </div>

        {/* 메인 콘텐츠 */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* 현재 크레딧 */}
          <div className="hero-card-accent p-4 rounded-lg mb-6 text-center">
            <div className="text-sm hero-text-muted mb-1">보유 크레딧</div>
            <div className="text-2xl font-bold hero-text-accent font-mono">
              {gameState.credits.toLocaleString()}
            </div>
          </div>

          {/* 가챠 카테고리 */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold hero-text-primary mb-4">
              가챠 종류 선택
            </h3>

            {gachaCategories.map(({ category, name, icon, description }) => {
              const cost = GACHA_COSTS[category];
              const cost10 = cost * 10;
              const canAfford = gameState.credits >= cost;
              const canAfford10 = gameState.credits >= cost10;

              return (
                <div
                  key={category}
                  className={`hero-card p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-lg ${
                    selectedCategory === category
                      ? "border-blue-400 hero-card-blue"
                      : "border-gray-500"
                  }`}
                  onClick={() => setSelectedCategory(category)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-3xl">{icon}</div>
                      <div>
                        <div className="font-bold hero-text-primary text-lg">
                          {name} 가챠
                        </div>
                        <div className="text-sm hero-text-secondary">
                          {description}
                        </div>
                        <div className="text-sm hero-text-muted mt-1">
                          1회: {cost.toLocaleString()} 크레딧
                        </div>
                        <div className="text-sm hero-text-muted">
                          10회: {cost10.toLocaleString()} 크레딧
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col space-y-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGacha(category, 1);
                        }}
                        disabled={!canAfford || isProcessing}
                        className={
                          canAfford && !isProcessing
                            ? "hero-btn hero-btn-success"
                            : "hero-btn hero-btn-disabled"
                        }
                      >
                        {isProcessing ? "뽑는 중..." : "1회 뽑기"}
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGacha(category, 10);
                        }}
                        disabled={!canAfford10 || isProcessing}
                        className={
                          canAfford10 && !isProcessing
                            ? "hero-btn hero-btn-primary"
                            : "hero-btn hero-btn-disabled"
                        }
                      >
                        {isProcessing ? "뽑는 중..." : "10연뽑"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 가챠 확률 정보 */}
          <div className="mt-6 hero-card p-4 rounded-lg">
            <h4 className="font-bold hero-text-primary mb-3">📊 등급별 확률</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {Object.entries(GACHA_RATES).map(([grade, rate]) => {
                const gradeKey = grade as keyof typeof GRADE_NAMES;
                const colorClass =
                  grade === "mythic"
                    ? "hero-text-red"
                    : grade === "legendary"
                    ? "hero-text-accent"
                    : grade === "epic"
                    ? "hero-text-purple"
                    : grade === "rare"
                    ? "hero-text-blue"
                    : "hero-text-muted";

                return (
                  <div key={grade} className="flex justify-between">
                    <span className={colorClass}>{GRADE_NAMES[gradeKey]}:</span>
                    <span className="hero-text-primary">
                      {(rate * 100).toFixed(1)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="hero-card-accent px-6 py-4 flex justify-between items-center">
          <div className="text-sm hero-text-secondary">
            {selectedCategory
              ? `${GACHA_CATEGORY_NAMES[selectedCategory]} 가챠 선택됨`
              : "가챠 종류를 선택하세요"}
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="hero-btn hero-btn-primary disabled:hero-btn-disabled"
          >
            닫기
          </button>
        </div>
      </div>

      {/* 배경 클릭으로 닫기 */}
      <div className="absolute inset-0 -z-10" onClick={onClose} />
    </div>
  );
}

export default GachaModal;
