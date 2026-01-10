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
import {
  getSynthesizableGrades,
  getGradeDisplayName,
} from "../utils/synthesisSystem";

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
  const [synthesisResult, setSynthesisResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

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

  const handleSynthesis = async (grade: ItemGrade) => {
    setIsProcessing(true);
    setSynthesisResult(null);

    try {
      const result = actions.performSynthesis(grade);

      if (result.success) {
        const nextGradeName = getGradeDisplayName(
          result.synthesizedItem!.grade
        );
        setSynthesisResult({
          success: true,
          message: `합성 성공! ${nextGradeName} 등급 아이템을 획득했습니다.`,
        });

        // 3초 후 메시지 자동 제거
        setTimeout(() => {
          setSynthesisResult(null);
        }, 3000);
      } else {
        setSynthesisResult({
          success: false,
          message: result.error || "합성에 실패했습니다.",
        });

        // 5초 후 메시지 자동 제거
        setTimeout(() => {
          setSynthesisResult(null);
        }, 5000);
      }
    } catch (error) {
      console.error("합성 실행 중 오류:", error);
      setSynthesisResult({
        success: false,
        message: "합성 실행 중 오류가 발생했습니다.",
      });

      setTimeout(() => {
        setSynthesisResult(null);
      }, 5000);
    } finally {
      setIsProcessing(false);
    }
  };

  // 합성 가능한 등급 정보 가져오기
  const synthesizableGrades = getSynthesizableGrades([...gameState.inventory]);

  const gachaCategories = [
    {
      category: GachaCategory.ARMOR,
      name: "방어구",
      icon: "🛡️",
      description: "헬멧, 아머, 팬츠, 글러브, 슈즈, 숄더",
    },
    {
      category: GachaCategory.ACCESSORIES,
      name: "장신구",
      icon: "💍",
      description: "귀걸이, 목걸이, 반지",
    },
    {
      category: GachaCategory.WEAPONS,
      name: "무기",
      icon: "⚔️",
      description: "주무기, 보조무기, 펫",
    },
    {
      category: GachaCategory.POTIONS,
      name: "물약",
      icon: "🧪",
      description: "재물 물약, 보스 물약, 장인 물약",
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
                            ? "px-4 py-2 rounded-lg font-bold text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 border border-green-400"
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
                            ? "px-4 py-2 rounded-lg font-bold text-white bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 hover:from-purple-600 hover:via-pink-600 hover:to-red-600 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 border border-pink-400 animate-pulse"
                            : "hero-btn hero-btn-disabled"
                        }
                      >
                        {isProcessing ? "뽑는 중..." : "✨ 10연뽑 ✨"}
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
                  grade === "divine"
                    ? "text-gradient bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent font-bold"
                    : grade === "mythic"
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
                      {rate >= 0.01
                        ? (rate * 100).toFixed(1)
                        : rate >= 0.0001
                        ? (rate * 100).toFixed(3)
                        : (rate * 100).toFixed(4)}
                      %
                    </span>
                  </div>
                );
              })}
            </div>

            {/* 추가 확률 정보 */}
            <div className="mt-4 pt-3 border-t border-gray-600">
              <div className="text-xs hero-text-muted space-y-1">
                <div className="flex justify-between">
                  <span>에픽 이상:</span>
                  <span className="hero-text-purple">3.00%</span>
                </div>
                <div className="flex justify-between">
                  <span>전설 이상:</span>
                  <span className="hero-text-accent">0.55%</span>
                </div>
                <div className="flex justify-between">
                  <span>신화 이상:</span>
                  <span className="hero-text-red">0.050%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gradient bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent font-bold">
                    신급 (제우스 검):
                  </span>
                  <span className="text-gradient bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent font-bold">
                    0.001%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 합성 가챠 섹션 */}
          <div className="mt-6 hero-card-purple p-4 rounded-lg">
            <h4 className="font-bold hero-text-primary mb-3">🔮 합성 가챠</h4>
            <p className="text-sm hero-text-secondary mb-4">
              같은 등급 아이템 10개를 합성하여 상위 등급 아이템 1개를 획득하세요
            </p>

            {/* 합성 결과 메시지 */}
            {synthesisResult && (
              <div
                className={`mb-4 p-3 rounded-lg ${
                  synthesisResult.success
                    ? "hero-card-green border border-green-400"
                    : "hero-card-red border border-red-400"
                }`}
              >
                <div
                  className={`text-sm font-medium ${
                    synthesisResult.success
                      ? "hero-text-green"
                      : "hero-text-red"
                  }`}
                >
                  {synthesisResult.success ? "✅" : "❌"}{" "}
                  {synthesisResult.message}
                </div>
              </div>
            )}

            <div className="space-y-3">
              {synthesizableGrades.map(
                ({ grade, count, canSynthesize, nextGrade }) => {
                  if (!nextGrade) return null; // 신화 등급은 표시하지 않음

                  const gradeColorClass =
                    grade === ItemGrade.LEGENDARY
                      ? "hero-text-accent"
                      : grade === ItemGrade.EPIC
                      ? "hero-text-purple"
                      : grade === ItemGrade.RARE
                      ? "hero-text-blue"
                      : "hero-text-muted";

                  const nextGradeColorClass =
                    nextGrade === ItemGrade.MYTHIC
                      ? "hero-text-red"
                      : nextGrade === ItemGrade.LEGENDARY
                      ? "hero-text-accent"
                      : nextGrade === ItemGrade.EPIC
                      ? "hero-text-purple"
                      : "hero-text-blue";

                  return (
                    <div key={grade} className="hero-card p-3 rounded border">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`font-medium ${gradeColorClass}`}>
                              {getGradeDisplayName(grade)}
                            </span>
                            <span className="text-2xl">→</span>
                            <span
                              className={`font-medium ${nextGradeColorClass}`}
                            >
                              {getGradeDisplayName(nextGrade)}
                            </span>
                          </div>
                          <div className="text-sm hero-text-secondary">
                            보유: {count}개 / 필요: 10개
                          </div>
                          {!canSynthesize && count > 0 && (
                            <div className="text-xs hero-text-red mt-1">
                              {10 - count}개 더 필요합니다
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleSynthesis(grade)}
                          disabled={!canSynthesize || isProcessing}
                          className={
                            canSynthesize && !isProcessing
                              ? "px-4 py-2 rounded-lg font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 border border-purple-400"
                              : "hero-btn hero-btn-disabled"
                          }
                        >
                          {isProcessing ? "합성 중..." : "🔮 합성"}
                        </button>
                      </div>
                    </div>
                  );
                }
              )}
            </div>

            {synthesizableGrades.every((g) => !g.canSynthesize) && (
              <div className="text-center py-4 hero-text-muted">
                합성 가능한 아이템이 없습니다.
                <br />
                같은 등급 아이템을 10개 이상 모아보세요!
              </div>
            )}
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
            className="px-6 py-2 rounded-lg font-bold text-white bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
