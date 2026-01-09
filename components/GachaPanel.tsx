/**
 * GachaPanel Component
 * 가챠 카테고리 선택 인터페이스, 가챠 비용 및 확률 표시, 가챠 뽑기 버튼 및 상태 관리
 * Requirements: 11.6, 11.7
 */

"use client";

import { useState } from "react";
import { useGame } from "../contexts/GameContext";
import {
  GachaCategory,
  ItemGrade,
  GachaResult,
  MultiGachaResult,
} from "../types/game";
import {
  GACHA_COSTS,
  GACHA_RATES,
  GACHA_CATEGORY_NAMES,
  GRADE_NAMES,
} from "../constants/game";
import { canPerformGacha } from "../utils/gachaSystem";
import GachaResultModal from "./GachaResultModal";
import MultiGachaResultModal from "./MultiGachaResultModal";

interface GachaPanelProps {
  onGachaResult?: (result: GachaResult) => void;
}

export default function GachaPanel({ onGachaResult }: GachaPanelProps) {
  const { gameState, actions } = useGame();
  const [selectedCategory, setSelectedCategory] = useState<GachaCategory>(
    GachaCategory.ARMOR
  );
  const [isDrawing, setIsDrawing] = useState(false);

  // 모달 상태 관리
  const [singleGachaResult, setSingleGachaResult] =
    useState<GachaResult | null>(null);
  const [multiGachaResult, setMultiGachaResult] =
    useState<MultiGachaResult | null>(null);
  const [showSingleModal, setShowSingleModal] = useState(false);
  const [showMultiModal, setShowMultiModal] = useState(false);

  const handleSingleGachaDraw = async () => {
    if (isDrawing) return;

    try {
      setIsDrawing(true);

      // 가챠 뽑기 수행
      const result = actions.performGachaDraw(selectedCategory);

      // 결과 저장 및 모달 표시
      setSingleGachaResult(result);
      setShowSingleModal(true);

      // 결과 콜백 호출
      if (onGachaResult) {
        onGachaResult(result);
      }
    } catch (error) {
      console.error("가챠 뽑기 실패:", error);
    } finally {
      setIsDrawing(false);
    }
  };

  const handleMultiGachaDraw = async () => {
    if (isDrawing) return;

    try {
      setIsDrawing(true);

      // 10연뽑 수행 (개별적으로 10번 뽑기)
      const results: GachaResult[] = [];
      const cost = GACHA_COSTS[selectedCategory] * 10;

      if (gameState.credits < cost) {
        alert("크레딧이 부족합니다!");
        return;
      }

      for (let i = 0; i < 10; i++) {
        const result = actions.performGachaDraw(selectedCategory);
        if (result) {
          results.push(result);
        }
      }

      if (results.length > 0) {
        // 10연뽑 결과를 MultiGachaResult로 변환
        const multiResult: MultiGachaResult = {
          items: results.map((r) => r.item),
          category: selectedCategory,
          totalCost: cost,
          count: results.length,
        };

        // 결과 저장 및 모달 표시
        setMultiGachaResult(multiResult);
        setShowMultiModal(true);
      }
    } catch (error) {
      console.error("10연뽑 실패:", error);
    } finally {
      setIsDrawing(false);
    }
  };

  // 한번 더 뽑기 핸들러
  const handleDrawAgainSingle = () => {
    setShowSingleModal(false);
    setSingleGachaResult(null);
    setTimeout(() => {
      handleSingleGachaDraw();
    }, 100);
  };

  const handleDrawAgainMulti = () => {
    setShowMultiModal(false);
    setMultiGachaResult(null);
    setTimeout(() => {
      handleMultiGachaDraw();
    }, 100);
  };

  // 모달 닫기 핸들러
  const handleCloseSingleModal = () => {
    setShowSingleModal(false);
    setSingleGachaResult(null);
  };

  const handleCloseMultiModal = () => {
    setShowMultiModal(false);
    setMultiGachaResult(null);
  };

  const canDrawSingle = canPerformGacha(selectedCategory, gameState.credits);
  const canDrawMulti = gameState.credits >= GACHA_COSTS[selectedCategory] * 10;
  const singleCost = GACHA_COSTS[selectedCategory];
  const multiCost = GACHA_COSTS[selectedCategory] * 10;

  return (
    <>
      <div className="hero-card p-6">
        <h2 className="text-2xl font-bold hero-text-primary mb-6 text-center">
          🎲 가챠 뽑기
        </h2>

        {/* 카테고리 선택 */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold hero-text-primary mb-3">
            카테고리 선택
          </h3>
          <div className="grid grid-cols-2 gap-3">
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
          <div className="grid grid-cols-5 gap-2">
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
                <div className="text-xs font-medium">
                  {GRADE_NAMES[grade as ItemGrade]}
                </div>
                <div className="text-xs">
                  {rate >= 0.01
                    ? (rate * 100).toFixed(1)
                    : (rate * 100).toFixed(2)}
                  %
                </div>
              </div>
            ))}
          </div>

          {/* 추가 확률 정보 */}
          <div className="mt-3 text-xs hero-text-muted text-center space-y-1">
            <div>
              에픽 이상: <span className="hero-text-purple">3.00%</span>
            </div>
            <div>
              전설 이상: <span className="hero-text-accent">0.55%</span>
            </div>
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
          <div className="flex justify-between items-center mb-2">
            <span className="hero-text-secondary">1회 뽑기:</span>
            <span
              className={`font-bold ${
                canDrawSingle ? "hero-text-green" : "hero-text-red"
              }`}
            >
              {singleCost.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="hero-text-secondary">10연뽑:</span>
            <span
              className={`font-bold ${
                canDrawMulti ? "hero-text-green" : "hero-text-red"
              }`}
            >
              {multiCost.toLocaleString()}
            </span>
          </div>
        </div>

        {/* 가챠 뽑기 버튼들 */}
        <div className="space-y-3">
          {/* 1회 뽑기 버튼 */}
          <button
            onClick={handleSingleGachaDraw}
            disabled={!canDrawSingle || isDrawing}
            className={
              canDrawSingle && !isDrawing
                ? "hero-btn hero-btn-primary w-full text-lg py-4"
                : "hero-btn hero-btn-disabled w-full text-lg py-4"
            }
          >
            {isDrawing ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-current mr-2"></div>
                뽑는 중...
              </div>
            ) : canDrawSingle ? (
              `1회 뽑기 (${singleCost.toLocaleString()} 크레딧)`
            ) : (
              "크레딧 부족"
            )}
          </button>

          {/* 10연뽑 버튼 */}
          <button
            onClick={handleMultiGachaDraw}
            disabled={!canDrawMulti || isDrawing}
            className={
              canDrawMulti && !isDrawing
                ? "hero-btn hero-btn-accent w-full text-lg py-4"
                : "hero-btn hero-btn-disabled w-full text-lg py-4"
            }
          >
            {isDrawing ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-current mr-2"></div>
                뽑는 중...
              </div>
            ) : canDrawMulti ? (
              `10연뽑 (${multiCost.toLocaleString()} 크레딧)`
            ) : (
              "크레딧 부족"
            )}
          </button>
        </div>

        {/* 도움말 */}
        <div className="mt-4 text-xs hero-text-muted text-center">
          💡 가챠로 획득한 아이템은 자동으로 인벤토리에 추가됩니다
        </div>
      </div>

      {/* 1회 뽑기 결과 모달 */}
      <GachaResultModal
        result={singleGachaResult}
        isOpen={showSingleModal}
        onClose={handleCloseSingleModal}
        onDrawAgain={handleDrawAgainSingle}
        canDrawAgain={canDrawSingle}
      />

      {/* 10연뽑 결과 모달 */}
      <MultiGachaResultModal
        result={multiGachaResult}
        isOpen={showMultiModal}
        onClose={handleCloseMultiModal}
        onDrawAgain={handleDrawAgainMulti}
        canDrawAgain={canDrawMulti}
      />
    </>
  );
}
