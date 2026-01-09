/**
 * MultiGachaResultModal Component
 * 10연뽑 결과를 모두 표시하고 선택해서 판매할 수 있는 모달
 */

"use client";

import { useState, useEffect } from "react";
import { MultiGachaResult, Item, ItemGrade } from "../types/game";
import {
  GRADE_NAMES,
  ITEM_TYPE_NAMES,
  GACHA_CATEGORY_NAMES,
} from "../constants/game";
import { useGame } from "../contexts/GameContext";
import ResponsiveItemImage from "./ResponsiveItemImage";
import { calculateItemSalePrice } from "../utils/itemSaleSystem";

interface MultiGachaResultModalProps {
  result: MultiGachaResult | null;
  isOpen: boolean;
  onClose: () => void;
  onDrawAgain?: () => void;
  canDrawAgain?: boolean;
}

export default function MultiGachaResultModal({
  result,
  isOpen,
  onClose,
  onDrawAgain,
  canDrawAgain = false,
}: MultiGachaResultModalProps) {
  const { gameState, actions } = useGame();
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    if (isOpen && result) {
      setShowAnimation(true);
      setSelectedItems(new Set());
    } else {
      setShowAnimation(false);
    }
  }, [isOpen, result]);

  if (!isOpen || !result) return null;

  const { items, category, totalCost, count } = result;

  // 등급 우선순위 (숫자가 높을수록 좋은 등급)
  const getGradePriority = (grade: ItemGrade): number => {
    switch (grade) {
      case ItemGrade.LEGENDARY:
        return 4;
      case ItemGrade.EPIC:
        return 3;
      case ItemGrade.RARE:
        return 2;
      case ItemGrade.COMMON:
        return 1;
      default:
        return 0;
    }
  };

  // 현재 착용 중인 아이템보다 등급이 높은지 확인
  const isUpgrade = (item: Item): boolean => {
    const equippedItem =
      gameState.equippedItems[
        item.type as keyof typeof gameState.equippedItems
      ];
    if (!equippedItem) return true; // 착용 중인 아이템이 없으면 업그레이드

    const currentGradePriority = getGradePriority(equippedItem.grade);
    const newGradePriority = getGradePriority(item.grade);

    return newGradePriority > currentGradePriority;
  };

  // 등급별 색상 스타일
  const getGradeStyles = (grade: ItemGrade) => {
    switch (grade) {
      case ItemGrade.MYTHIC:
        return {
          bg: "bg-gradient-to-r from-red-400 to-red-600",
          text: "text-red-100",
          border: "border-red-400",
          glow: "shadow-red-400/50",
        };
      case ItemGrade.LEGENDARY:
        return {
          bg: "bg-gradient-to-r from-yellow-400 to-yellow-600",
          text: "text-yellow-100",
          border: "border-yellow-400",
          glow: "shadow-yellow-400/50",
        };
      case ItemGrade.EPIC:
        return {
          bg: "bg-gradient-to-r from-purple-400 to-purple-600",
          text: "text-purple-100",
          border: "border-purple-400",
          glow: "shadow-purple-400/50",
        };
      case ItemGrade.RARE:
        return {
          bg: "bg-gradient-to-r from-blue-400 to-blue-600",
          text: "text-blue-100",
          border: "border-blue-400",
          glow: "shadow-blue-400/50",
        };
      default:
        return {
          bg: "bg-gradient-to-r from-gray-400 to-gray-600",
          text: "text-gray-100",
          border: "border-gray-400",
          glow: "shadow-gray-400/50",
        };
    }
  };

  // 아이템 선택/해제
  const toggleItemSelection = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  // 전체 선택/해제
  const toggleSelectAll = () => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(items.map((item) => item.id)));
    }
  };

  // 선택된 아이템들의 총 판매가 계산
  const selectedItemsForSale = items.filter((item) =>
    selectedItems.has(item.id)
  );
  const totalSalePrice = selectedItemsForSale.reduce((total, item) => {
    return total + calculateItemSalePrice(item);
  }, 0);

  // 선택된 아이템 판매
  const handleSellSelectedItems = () => {
    if (selectedItems.size === 0) {
      alert("판매할 아이템을 선택해주세요.");
      return;
    }

    const confirmMessage = `선택한 ${
      selectedItems.size
    }개 아이템을 ${totalSalePrice.toLocaleString()} 크레딧에 판매하시겠습니까?`;

    if (confirm(confirmMessage)) {
      const result = actions.sellMultipleItems(selectedItemsForSale);
      if (result.success) {
        alert(`${result.credits.toLocaleString()} 크레딧을 획득했습니다!`);
        setSelectedItems(new Set());
      } else {
        alert(`판매 실패: ${result.error}`);
      }
    }
  };

  // 등급별 아이템 개수 계산
  const gradeCount = items.reduce((acc, item) => {
    acc[item.grade] = (acc[item.grade] || 0) + 1;
    return acc;
  }, {} as Record<ItemGrade, number>);

  // 업그레이드 아이템 개수 계산
  const upgradeCount = items.filter((item) => isUpgrade(item)).length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="hero-card rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="hero-card-green p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold hero-text-primary">
                🎉 {count}연뽑 결과
              </h2>
              <p className="hero-text-secondary mt-1">
                {GACHA_CATEGORY_NAMES[category]} 가챠 - 총{" "}
                {totalCost.toLocaleString()} 크레딧 소모
              </p>
            </div>
            <button
              onClick={onClose}
              className="hero-text-primary hover:hero-text-secondary text-3xl font-bold transition-colors"
            >
              ×
            </button>
          </div>

          {/* 등급별 요약 */}
          <div className="mt-4 flex flex-wrap gap-2 items-center">
            {Object.entries(gradeCount).map(([grade, count]) => {
              const styles = getGradeStyles(grade as ItemGrade);
              return (
                <div
                  key={grade}
                  className={`px-3 py-1 rounded-full text-sm font-bold ${styles.bg} ${styles.text}`}
                >
                  {GRADE_NAMES[grade as ItemGrade]}: {count}개
                </div>
              );
            })}

            {/* 업그레이드 아이템 표시 */}
            {upgradeCount > 0 && (
              <div className="px-3 py-1 rounded-full text-sm font-bold bg-green-500 text-white animate-pulse">
                ⬆️ 업그레이드: {upgradeCount}개
              </div>
            )}
          </div>
        </div>

        {/* 메인 콘텐츠 */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-300px)]">
          {/* 선택 도구 */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleSelectAll}
                className="hero-btn hero-btn-primary"
              >
                {selectedItems.size === items.length
                  ? "전체 해제"
                  : "전체 선택"}
              </button>
              <span className="hero-text-secondary">
                {selectedItems.size}/{items.length}개 선택됨
              </span>
            </div>

            {selectedItems.size > 0 && (
              <div className="flex items-center space-x-4">
                <span className="hero-text-primary font-bold">
                  판매가: {totalSalePrice.toLocaleString()} 크레딧
                </span>
                <button
                  onClick={handleSellSelectedItems}
                  className="hero-btn hero-btn-warning"
                >
                  선택 아이템 판매
                </button>
              </div>
            )}
          </div>

          {/* 아이템 그리드 */}
          <div className="grid grid-cols-5 gap-4">
            {items.map((item, index) => {
              const styles = getGradeStyles(item.grade);
              const isSelected = selectedItems.has(item.id);
              const salePrice = calculateItemSalePrice(item);
              const isItemUpgrade = isUpgrade(item);

              return (
                <div
                  key={item.id}
                  className={`relative hero-card rounded-lg p-3 cursor-pointer transition-all hover:shadow-lg ${
                    isSelected
                      ? `border-2 ${styles.border} ${styles.glow}`
                      : "border-2 border-transparent"
                  }`}
                  onClick={() => toggleItemSelection(item.id)}
                >
                  {/* 선택 체크박스 */}
                  <div className="absolute top-2 left-2 z-10">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleItemSelection(item.id)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </div>

                  {/* 순서 번호 */}
                  <div className="absolute top-2 right-2 z-10">
                    <span className="bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                      #{index + 1}
                    </span>
                  </div>

                  {/* 업그레이드 표시 */}
                  {isItemUpgrade && (
                    <div className="absolute top-8 right-2 z-10">
                      <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold animate-pulse">
                        ⬆️ UP
                      </div>
                    </div>
                  )}

                  {/* 등급 배지 */}
                  <div
                    className={`text-center mb-2 px-2 py-1 rounded text-xs font-bold ${styles.bg} ${styles.text}`}
                  >
                    {GRADE_NAMES[item.grade]}
                  </div>

                  {/* 아이템 이미지 */}
                  <div className="flex justify-center mb-2">
                    <ResponsiveItemImage
                      item={item}
                      size="medium"
                      className="drop-shadow-lg"
                    />
                  </div>

                  {/* 아이템 정보 */}
                  <div className="text-center">
                    <div className="font-bold hero-text-primary text-sm mb-1">
                      {ITEM_TYPE_NAMES[item.type]}
                    </div>

                    {/* 주요 스탯 표시 */}
                    <div className="text-xs hero-text-secondary space-y-1">
                      {item.baseStats.attack > 0 && (
                        <div>공격력: +{item.baseStats.attack}</div>
                      )}
                      {item.baseStats.defense > 0 && (
                        <div>방어력: +{item.baseStats.defense}</div>
                      )}
                      {item.baseStats.defensePenetration > 0 && (
                        <div>방무: +{item.baseStats.defensePenetration}</div>
                      )}
                      {item.baseStats.additionalAttackChance > 0 && (
                        <div>
                          추타:{" "}
                          {(
                            item.baseStats.additionalAttackChance * 100
                          ).toFixed(1)}
                          %
                        </div>
                      )}
                    </div>

                    {/* 현재 착용 아이템과 비교 */}
                    {isItemUpgrade && (
                      <div className="mt-1 text-xs text-green-600 font-bold">
                        현재 장비보다 좋음!
                      </div>
                    )}

                    {/* 판매가 */}
                    <div className="mt-2 text-xs hero-text-accent font-bold">
                      💰 {salePrice.toLocaleString()}
                    </div>
                  </div>

                  {/* 애니메이션 효과 */}
                  {showAnimation && (
                    <div
                      className={`absolute inset-0 ${styles.bg} opacity-20 rounded-lg animate-pulse`}
                      style={{
                        animationDelay: `${index * 0.1}s`,
                        animationDuration: "1s",
                      }}
                    />
                  )}

                  {/* 업그레이드 아이템 특별 효과 */}
                  {isItemUpgrade && showAnimation && (
                    <div
                      className="absolute inset-0 bg-green-400 opacity-10 rounded-lg animate-ping"
                      style={{
                        animationDelay: `${index * 0.1 + 0.5}s`,
                        animationDuration: "2s",
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="hero-card-accent px-6 py-4 flex justify-between items-center">
          <div className="text-sm hero-text-secondary">
            💡 아이템을 선택하여 바로 판매하거나, 모두 인벤토리에 보관할 수
            있습니다
          </div>
          <div className="flex gap-3">
            {/* 한번 더 뽑기 버튼 */}
            {onDrawAgain && (
              <button
                onClick={onDrawAgain}
                disabled={!canDrawAgain}
                className={`hero-btn ${
                  canDrawAgain
                    ? "hero-btn-accent hover:opacity-90"
                    : "bg-gray-500 cursor-not-allowed opacity-50"
                }`}
              >
                {count}연뽑 다시하기
              </button>
            )}

            <button onClick={onClose} className="hero-btn hero-btn-primary">
              닫기
            </button>
          </div>
        </div>
      </div>

      {/* 배경 클릭으로 닫기 */}
      <div className="absolute inset-0 -z-10" onClick={onClose} />
    </div>
  );
}
