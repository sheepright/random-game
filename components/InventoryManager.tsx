"use client";

import React, { useState, useEffect } from "react";
import { Item, ItemType, ItemGrade } from "../types/game";
import { useGame } from "../contexts/GameContext";
import InventoryPanel from "./InventoryPanel";
import {
  checkInventoryCapacity,
  canAddItemToInventory,
  removeItemFromInventory,
  getInventoryStats,
  calculateInventoryExpansionCost,
  INVENTORY_CONFIG,
} from "../utils/inventoryManager";

/**
 * 인벤토리 관리자 메인 컴포넌트
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6 - 전체 인벤토리 시스템 관리
 */
export default function InventoryManager() {
  const { gameState, actions } = useGame();
  const [inventoryCapacity, setInventoryCapacity] = useState(
    INVENTORY_CONFIG.DEFAULT_CAPACITY
  );
  const [showInventory, setShowInventory] = useState(false);
  const [autoSellEnabled, setAutoSellEnabled] = useState(false);
  const [autoSellGrade, setAutoSellGrade] = useState<ItemGrade>(
    ItemGrade.COMMON
  );

  // 인벤토리 용량 정보
  const capacityInfo = checkInventoryCapacity(
    gameState.inventory,
    inventoryCapacity
  );
  const inventoryStats = getInventoryStats(gameState.inventory);
  const expansionCost = calculateInventoryExpansionCost(inventoryCapacity);

  // 인벤토리 용량 확장
  const handleExpandInventory = () => {
    if (gameState.credits >= expansionCost) {
      actions.addCredits(-expansionCost);
      setInventoryCapacity((prev) => prev + 10);
    }
  };

  // 아이템 자동 판매 (인벤토리가 가득 찰 때)
  const handleAutoSell = () => {
    if (!autoSellEnabled) return;

    const itemsToSell = gameState.inventory.filter((item) => {
      // 설정된 등급 이하의 아이템들을 자동 판매
      const gradeOrder = [
        ItemGrade.COMMON,
        ItemGrade.RARE,
        ItemGrade.EPIC,
        ItemGrade.LEGENDARY,
      ];
      const currentGradeIndex = gradeOrder.indexOf(item.grade);
      const autoSellGradeIndex = gradeOrder.indexOf(autoSellGrade);
      return currentGradeIndex <= autoSellGradeIndex;
    });

    // 가장 낮은 등급부터 판매
    itemsToSell.sort((a, b) => {
      const gradeOrder = [
        ItemGrade.COMMON,
        ItemGrade.RARE,
        ItemGrade.EPIC,
        ItemGrade.LEGENDARY,
      ];
      return gradeOrder.indexOf(a.grade) - gradeOrder.indexOf(b.grade);
    });

    // 인벤토리 여유 공간이 생길 때까지 판매
    let soldCount = 0;
    const targetSellCount = Math.min(
      itemsToSell.length,
      capacityInfo.currentCount - inventoryCapacity + 5
    );

    for (let i = 0; i < targetSellCount && i < itemsToSell.length; i++) {
      const item = itemsToSell[i];
      const sellPrice = calculateItemSellPrice(item);
      actions.removeItemFromInventory(item.id);
      actions.addCredits(sellPrice);
      soldCount++;
    }

    if (soldCount > 0) {
      console.log(`자동 판매: ${soldCount}개 아이템 판매됨`);
    }
  };

  // 아이템 판매 가격 계산
  const calculateItemSellPrice = (item: Item): number => {
    const gradeMultipliers = {
      [ItemGrade.COMMON]: 10,
      [ItemGrade.RARE]: 25,
      [ItemGrade.EPIC]: 50,
      [ItemGrade.LEGENDARY]: 100,
      [ItemGrade.MYTHIC]: 200,
    };

    const basePrice = gradeMultipliers[item.grade];
    const statSum =
      item.baseStats.attack +
      item.baseStats.defense +
      item.baseStats.defensePenetration;
    const enhancedStatSum =
      item.enhancedStats.attack +
      item.enhancedStats.defense +
      item.enhancedStats.defensePenetration;

    return Math.floor(
      basePrice *
        (1 + item.level * 0.1) *
        (1 + (statSum + enhancedStatSum) * 0.01)
    );
  };

  // 선택된 아이템들 일괄 판매
  const handleBulkSell = (items: Item[]) => {
    let totalPrice = 0;

    items.forEach((item) => {
      const sellPrice = calculateItemSellPrice(item);
      actions.removeItemFromInventory(item.id);
      totalPrice += sellPrice;
    });

    actions.addCredits(totalPrice);
  };

  // 특정 등급 이하 아이템 모두 판매
  const handleSellByGrade = (maxGrade: ItemGrade) => {
    const gradeOrder = [
      ItemGrade.COMMON,
      ItemGrade.RARE,
      ItemGrade.EPIC,
      ItemGrade.LEGENDARY,
    ];
    const maxGradeIndex = gradeOrder.indexOf(maxGrade);

    const itemsToSell = gameState.inventory.filter((item) => {
      const itemGradeIndex = gradeOrder.indexOf(item.grade);
      return itemGradeIndex <= maxGradeIndex;
    });

    handleBulkSell(itemsToSell);
  };

  // 인벤토리가 가득 찰 때 자동 처리
  useEffect(() => {
    if (capacityInfo.isFull && autoSellEnabled) {
      handleAutoSell();
    }
  }, [capacityInfo.isFull, autoSellEnabled, autoSellGrade]);

  return (
    <div className="space-y-4">
      {/* 인벤토리 요약 정보 */}
      <div className="hero-card p-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-bold hero-text-primary">
            📦 인벤토리 관리
          </h2>
          <button
            onClick={() => setShowInventory(!showInventory)}
            className="hero-btn hero-btn-primary"
          >
            {showInventory ? "인벤토리 닫기" : "인벤토리 열기"}
          </button>
        </div>

        {/* 용량 정보 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold hero-text-blue">
              {capacityInfo.currentCount}
            </div>
            <div className="text-sm hero-text-muted">보유 아이템</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold hero-text-green">
              {capacityInfo.maxCapacity}
            </div>
            <div className="text-sm hero-text-muted">최대 용량</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold hero-text-accent">
              {inventoryStats.itemsByGrade[ItemGrade.LEGENDARY]}
            </div>
            <div className="text-sm hero-text-muted">전설 아이템</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold hero-text-purple">
              {inventoryStats.itemsByGrade[ItemGrade.EPIC]}
            </div>
            <div className="text-sm hero-text-muted">영웅 아이템</div>
          </div>
        </div>

        {/* 용량 게이지 */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span>인벤토리 사용량</span>
            <span>
              {Math.round(
                (capacityInfo.currentCount / capacityInfo.maxCapacity) * 100
              )}
              %
            </span>
          </div>
          <div className="w-full hero-progress">
            <div
              className={`hero-progress-bar ${
                capacityInfo.isFull
                  ? "hero-progress-red"
                  : capacityInfo.currentCount / capacityInfo.maxCapacity > 0.8
                  ? "bg-yellow-500"
                  : "hero-progress-green"
              }`}
              style={{
                width: `${Math.min(
                  (capacityInfo.currentCount / capacityInfo.maxCapacity) * 100,
                  100
                )}%`,
              }}
            />
          </div>
        </div>

        {/* 관리 옵션 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 용량 확장 */}
          <div className="space-y-2">
            <h3 className="font-semibold">용량 확장</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExpandInventory}
                disabled={gameState.credits < expansionCost}
                className={
                  gameState.credits >= expansionCost
                    ? "hero-btn hero-btn-success flex-1"
                    : "hero-btn hero-btn-disabled flex-1"
                }
              >
                +10 슬롯 ({expansionCost.toLocaleString()} 크레딧)
              </button>
            </div>
          </div>

          {/* 자동 판매 설정 */}
          <div className="space-y-2">
            <h3 className="font-semibold">자동 판매</h3>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="autoSell"
                checked={autoSellEnabled}
                onChange={(e) => setAutoSellEnabled(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="autoSell" className="text-sm hero-text-secondary">
                인벤토리 가득 시 자동 판매
              </label>
            </div>
            {autoSellEnabled && (
              <select
                value={autoSellGrade}
                onChange={(e) => setAutoSellGrade(e.target.value as ItemGrade)}
                className="hero-input w-full text-sm"
              >
                <option value={ItemGrade.COMMON}>일반 등급까지</option>
                <option value={ItemGrade.RARE}>희귀 등급까지</option>
                <option value={ItemGrade.EPIC}>영웅 등급까지</option>
              </select>
            )}
          </div>
        </div>

        {/* 일괄 판매 버튼들 */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => handleSellByGrade(ItemGrade.COMMON)}
            className="hero-btn hero-btn-primary text-sm"
            disabled={inventoryStats.itemsByGrade[ItemGrade.COMMON] === 0}
          >
            일반 아이템 모두 판매 (
            {inventoryStats.itemsByGrade[ItemGrade.COMMON]}개)
          </button>
          <button
            onClick={() => handleSellByGrade(ItemGrade.RARE)}
            className="hero-btn hero-btn-primary text-sm"
            disabled={
              inventoryStats.itemsByGrade[ItemGrade.COMMON] +
                inventoryStats.itemsByGrade[ItemGrade.RARE] ===
              0
            }
          >
            희귀 이하 모두 판매
          </button>
        </div>

        {/* 경고 메시지 */}
        {capacityInfo.isFull && (
          <div className="mt-4 p-3 hero-card-red rounded">
            <p className="hero-text-red text-sm">
              ⚠️ 인벤토리가 가득 찼습니다! 새로운 아이템을 획득할 수 없습니다.
            </p>
          </div>
        )}
      </div>

      {/* 인벤토리 패널 */}
      {showInventory && <InventoryPanel />}
    </div>
  );
}
