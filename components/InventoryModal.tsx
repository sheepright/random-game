"use client";

import { useState } from "react";
import { useGame } from "../contexts/GameContext";
import { Item, ItemType, ItemGrade } from "../types/game";
import { ITEM_TYPE_NAMES, GRADE_NAMES } from "../constants/game";
import {
  calculateItemSalePrice,
  calculateTotalSalePrice,
  canSellItem,
  validateItemSale,
} from "../utils/itemSaleSystem";

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// 아이템 등급별 색상
const GRADE_COLORS = {
  [ItemGrade.COMMON]: "hero-card border-gray-500",
  [ItemGrade.RARE]: "hero-card-blue border-blue-400",
  [ItemGrade.EPIC]: "hero-card-purple border-purple-400",
  [ItemGrade.LEGENDARY]: "hero-card-accent border-yellow-400",
};

export function InventoryModal({ isOpen, onClose }: InventoryModalProps) {
  const { gameState, actions } = useGame();
  const [selectedFilter, setSelectedFilter] = useState<ItemType | "ALL">("ALL");
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<"level" | "grade" | "type">("grade");

  // 판매 모드 상태
  const [showSaleMode, setShowSaleMode] = useState(false);
  const [selectedItemsForSale, setSelectedItemsForSale] = useState<Set<string>>(
    new Set()
  );
  const [showSaleConfirmDialog, setShowSaleConfirmDialog] = useState(false);
  const [saleSuccessMessage, setSaleSuccessMessage] = useState<string | null>(
    null
  );
  const [saleErrorMessage, setSaleErrorMessage] = useState<string | null>(null);
  const [saleWarnings, setSaleWarnings] = useState<string[]>([]);
  const [isProcessingSale, setIsProcessingSale] = useState(false);

  if (!isOpen) return null;

  // 현재 장착된 아이템들
  const equippedItems = gameState.equippedItems;

  // 아이템이 업그레이드 가능한지 확인하는 함수
  const isUpgradeCandidate = (item: Item): boolean => {
    const equippedItem = equippedItems[item.type as keyof typeof equippedItems];

    const gradeOrder = { common: 0, rare: 1, epic: 2, legendary: 3 };

    // 장착된 아이템이 없으면 -1로 취급하여 모든 등급이 업그레이드로 표시
    const equippedGrade = equippedItem ? gradeOrder[equippedItem.grade] : -1;
    const itemGrade = gradeOrder[item.grade];

    return itemGrade > equippedGrade;
  };

  // 필터링된 아이템
  const filteredItems = gameState.inventory.filter(
    (item) => selectedFilter === "ALL" || item.type === selectedFilter
  );

  // 정렬된 아이템 (업그레이드 후보를 먼저 표시)
  const sortedItems = [...filteredItems].sort((a, b) => {
    // 1순위: 업그레이드 후보 우선
    const aIsUpgrade = isUpgradeCandidate(a);
    const bIsUpgrade = isUpgradeCandidate(b);

    if (aIsUpgrade && !bIsUpgrade) return -1;
    if (!aIsUpgrade && bIsUpgrade) return 1;

    // 2순위: 기존 정렬 기준
    switch (sortBy) {
      case "level":
        return b.level - a.level;
      case "grade":
        const gradeOrder = { common: 0, rare: 1, epic: 2, legendary: 3 };
        return gradeOrder[b.grade] - gradeOrder[a.grade];
      case "type":
        return a.type.localeCompare(b.type);
      default:
        return 0;
    }
  });

  // 아이템 장착
  const handleEquipItem = (item: Item) => {
    const success = actions.equipItem(item);
    if (success) {
      // 성공 피드백
    }
  };

  // 아이템 삭제
  const handleDeleteItems = () => {
    if (selectedItems.size === 0) return;

    if (confirm(`선택한 ${selectedItems.size}개 아이템을 삭제하시겠습니까?`)) {
      selectedItems.forEach((itemId) => {
        actions.removeItemFromInventory(itemId);
      });
      setSelectedItems(new Set());
    }
  };

  // 아이템 선택 토글
  const toggleItemSelection = (itemId: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId);
    } else {
      newSelection.add(itemId);
    }
    setSelectedItems(newSelection);
  };

  // 판매용 아이템 선택 토글
  const toggleItemForSale = (itemId: string) => {
    const item = gameState.inventory.find((i) => i.id === itemId);
    if (!item || !canSellItem(item, gameState.equippedItems)) {
      return; // 판매 불가능한 아이템은 선택 불가
    }

    const newSelection = new Set(selectedItemsForSale);
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId);
    } else {
      newSelection.add(itemId);
    }
    setSelectedItemsForSale(newSelection);
  };

  // 아이템 판매 실행
  const handleSellItems = () => {
    if (selectedItemsForSale.size === 0) {
      setSaleErrorMessage("판매할 아이템을 선택해주세요.");
      return;
    }

    const itemsToSell = gameState.inventory.filter((item) =>
      selectedItemsForSale.has(item.id)
    );

    // 판매 전 검증
    const validation = validateItemSale(itemsToSell, gameState.equippedItems);

    if (!validation.isValid) {
      setSaleErrorMessage(validation.errors.join(" "));
      return;
    }

    // 경고사항이 있으면 확인 다이얼로그 표시
    if (validation.warnings.length > 0) {
      setSaleWarnings(validation.warnings);
      setShowSaleConfirmDialog(true);
      return;
    }

    // 경고사항이 없으면 바로 판매 실행
    executeSale(itemsToSell);
  };

  // 실제 판매 실행
  const executeSale = (itemsToSell: Item[]) => {
    setIsProcessingSale(true);
    setSaleErrorMessage(null);
    setSaleSuccessMessage(null);

    try {
      const saleResult = actions.sellMultipleItems(itemsToSell);

      if (saleResult.success) {
        setSaleSuccessMessage(
          `${
            saleResult.soldItems.length
          }개 아이템을 ${saleResult.credits.toLocaleString()} 크레딧에 판매했습니다!`
        );
        setSelectedItemsForSale(new Set());

        // 성공 메시지를 3초 후 자동으로 숨김
        setTimeout(() => {
          setSaleSuccessMessage(null);
        }, 3000);
      } else {
        setSaleErrorMessage(saleResult.error || "판매에 실패했습니다.");
      }
    } catch (error) {
      setSaleErrorMessage("판매 처리 중 오류가 발생했습니다.");
      console.error("판매 오류:", error);
    } finally {
      setIsProcessingSale(false);
      setShowSaleConfirmDialog(false);
    }
  };

  // 판매 확인 다이얼로그에서 확인 버튼 클릭
  const handleConfirmSale = () => {
    const itemsToSell = gameState.inventory.filter((item) =>
      selectedItemsForSale.has(item.id)
    );
    executeSale(itemsToSell);
  };

  // 필터 옵션
  const filterOptions = [
    { value: "ALL" as const, label: "전체", icon: "📦" },
    { value: ItemType.HELMET, label: "헬멧", icon: "⛑️" },
    { value: ItemType.ARMOR, label: "아머", icon: "🛡️" },
    { value: ItemType.PANTS, label: "팬츠", icon: "👖" },
    { value: ItemType.GLOVES, label: "글러브", icon: "🧤" },
    { value: ItemType.SHOES, label: "슈즈", icon: "👟" },
    { value: ItemType.SHOULDER, label: "숄더", icon: "🎽" },
    { value: ItemType.EARRING, label: "귀걸이", icon: "👂" },
    { value: ItemType.RING, label: "반지", icon: "💍" },
    { value: ItemType.NECKLACE, label: "목걸이", icon: "📿" },
    { value: ItemType.MAIN_WEAPON, label: "주무기", icon: "⚔️" },
    { value: ItemType.SUB_WEAPON, label: "보조무기", icon: "🗡️" },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="hero-card rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="hero-card-blue p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold hero-text-primary">
                📦 인벤토리
              </h2>
              <p className="hero-text-secondary mt-1">
                보유한 아이템: {gameState.inventory.length}개 | 더블클릭으로
                장착
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSaleMode(!showSaleMode)}
                className={`hero-btn ${
                  showSaleMode ? "hero-btn-danger" : "hero-btn-success"
                }`}
              >
                {showSaleMode ? "판매 모드 종료" : "💰 아이템 판매"}
              </button>
              <button
                onClick={onClose}
                className="hero-text-primary hover:hero-text-secondary text-3xl font-bold transition-colors"
              >
                ×
              </button>
            </div>
          </div>
        </div>

        {/* 필터 및 정렬 */}
        <div className="p-4 border-b border-gray-300">
          {/* 판매 모드 정보 패널 */}
          {showSaleMode && (
            <div className="mb-4 p-4 hero-card-accent rounded-lg">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold hero-text-primary">
                  💰 아이템 판매 모드
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (selectedItemsForSale.size === 0) {
                        // 전체 선택 (판매 가능한 아이템만)
                        const sellableItemIds = sortedItems
                          .filter((item) =>
                            canSellItem(item, gameState.equippedItems)
                          )
                          .map((item) => item.id);
                        setSelectedItemsForSale(new Set(sellableItemIds));
                      } else {
                        // 전체 해제
                        setSelectedItemsForSale(new Set());
                      }
                    }}
                    className="hero-btn hero-btn-primary text-sm"
                  >
                    {selectedItemsForSale.size === 0
                      ? "전체 선택"
                      : "전체 해제"}
                  </button>
                  <button
                    onClick={handleSellItems}
                    disabled={
                      selectedItemsForSale.size === 0 || isProcessingSale
                    }
                    className={`hero-btn text-sm ${
                      selectedItemsForSale.size === 0 || isProcessingSale
                        ? "hero-btn-disabled"
                        : "hero-btn-success"
                    }`}
                  >
                    {isProcessingSale ? "판매 중..." : "선택 아이템 판매"}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="hero-text-secondary">선택된 아이템:</span>
                  <span className="ml-2 font-semibold hero-text-primary">
                    {selectedItemsForSale.size}개
                  </span>
                </div>
                <div>
                  <span className="hero-text-secondary">판매 가능:</span>
                  <span className="ml-2 font-semibold text-green-400">
                    {
                      Array.from(selectedItemsForSale).filter((itemId) => {
                        const item = gameState.inventory.find(
                          (i) => i.id === itemId
                        );
                        return (
                          item && canSellItem(item, gameState.equippedItems)
                        );
                      }).length
                    }
                    개
                  </span>
                </div>
                <div>
                  <span className="hero-text-secondary">총 판매가:</span>
                  <span className="ml-2 font-semibold text-yellow-400">
                    {calculateTotalSalePrice(
                      gameState.inventory.filter(
                        (item) =>
                          selectedItemsForSale.has(item.id) &&
                          canSellItem(item, gameState.equippedItems)
                      )
                    ).toLocaleString()}{" "}
                    크레딧
                  </span>
                </div>
                <div className="text-xs hero-text-muted">
                  장착된 아이템은 판매할 수 없습니다
                </div>
              </div>

              {/* 판매 메시지 */}
              {(saleSuccessMessage || saleErrorMessage) && (
                <div className="mt-3">
                  {saleSuccessMessage && (
                    <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                      ✅ {saleSuccessMessage}
                    </div>
                  )}
                  {saleErrorMessage && (
                    <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                      ❌ {saleErrorMessage}
                      <button
                        onClick={() => setSaleErrorMessage(null)}
                        className="ml-2 text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4 mb-4">
            {/* 필터 */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium hero-text-secondary">
                필터:
              </span>
              <select
                value={selectedFilter}
                onChange={(e) =>
                  setSelectedFilter(e.target.value as ItemType | "ALL")
                }
                className="hero-input text-sm"
              >
                {filterOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.icon} {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 정렬 */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium hero-text-secondary">
                정렬:
              </span>
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as "level" | "grade" | "type")
                }
                className="hero-input text-sm"
              >
                <option value="grade">등급순</option>
                <option value="level">레벨순</option>
                <option value="type">타입순</option>
              </select>
            </div>

            {/* 선택된 아이템 수 (일반 모드) */}
            {!showSaleMode && selectedItems.size > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm hero-text-accent font-medium">
                  {selectedItems.size}개 선택됨
                </span>
                <button
                  onClick={handleDeleteItems}
                  className="hero-btn hero-btn-danger text-xs"
                >
                  선택 삭제
                </button>
                <button
                  onClick={() => setSelectedItems(new Set())}
                  className="hero-btn hero-btn-primary text-xs"
                >
                  선택 해제
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 아이템 목록 */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-300px)]">
          {sortedItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📦</div>
              <div className="hero-text-muted text-lg">
                {selectedFilter === "ALL"
                  ? "인벤토리가 비어있습니다"
                  : "해당 타입의 아이템이 없습니다"}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {sortedItems.map((item) => {
                const isUpgrade = isUpgradeCandidate(item);

                return (
                  <div
                    key={item.id}
                    className={`relative border-2 rounded-lg p-3 cursor-pointer transition-all hover:shadow-lg hover:scale-105 ${
                      GRADE_COLORS[item.grade]
                    } ${
                      showSaleMode
                        ? selectedItemsForSale.has(item.id)
                          ? "ring-2 ring-yellow-400"
                          : canSellItem(item, gameState.equippedItems)
                          ? "hover:ring-2 hover:ring-yellow-200"
                          : "opacity-50 cursor-not-allowed"
                        : selectedItems.has(item.id)
                        ? "ring-2 ring-blue-400"
                        : ""
                    } ${
                      isUpgrade ? "ring-2 ring-green-400 animate-pulse" : ""
                    }`}
                    onClick={() => {
                      if (showSaleMode) {
                        toggleItemForSale(item.id);
                      } else {
                        toggleItemSelection(item.id);
                      }
                    }}
                    onDoubleClick={() => {
                      if (!showSaleMode) {
                        handleEquipItem(item);
                      }
                    }}
                    title={
                      showSaleMode
                        ? canSellItem(item, gameState.equippedItems)
                          ? `판매가: ${calculateItemSalePrice(item)} 크레딧`
                          : "장착된 아이템은 판매할 수 없습니다"
                        : isUpgrade
                        ? "업그레이드 가능! 더블클릭으로 장착"
                        : "더블클릭으로 장착"
                    }
                  >
                    {/* 업그레이드 후보 표시 */}
                    {isUpgrade && (
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
                        <span className="text-white text-xs font-bold">↑</span>
                      </div>
                    )}

                    {/* 선택 체크박스 */}
                    <div className="absolute top-1 right-1">
                      {showSaleMode ? (
                        <div className="flex flex-col items-center">
                          <input
                            type="checkbox"
                            checked={selectedItemsForSale.has(item.id)}
                            disabled={
                              !canSellItem(item, gameState.equippedItems)
                            }
                            onChange={() => toggleItemForSale(item.id)}
                            className="w-4 h-4"
                          />
                          {canSellItem(item, gameState.equippedItems) && (
                            <span className="text-xs text-yellow-400 font-bold mt-1">
                              {calculateItemSalePrice(item)}
                            </span>
                          )}
                        </div>
                      ) : (
                        <input
                          type="checkbox"
                          checked={selectedItems.has(item.id)}
                          onChange={() => toggleItemSelection(item.id)}
                          className="w-4 h-4"
                        />
                      )}
                    </div>

                    <div className="text-center">
                      {/* 아이템 이미지 */}
                      <div
                        className={`w-12 h-12 rounded-lg flex items-center justify-center mb-2 mx-auto ${
                          isUpgrade ? "ring-2 ring-green-400" : ""
                        }`}
                      >
                        <img
                          src={item.imagePath || "/Items/default.png"}
                          alt={`${item.type} 아이템`}
                          className="w-10 h-10 object-contain"
                          onError={(e) => {
                            console.log(
                              "인벤토리 모달 이미지 로딩 실패:",
                              item.imagePath
                            );
                            const target = e.target as HTMLImageElement;
                            target.src = "/Items/default.png";
                          }}
                          onLoad={() => {
                            console.log(
                              "인벤토리 모달 이미지 로딩 성공:",
                              item.imagePath
                            );
                          }}
                        />
                      </div>

                      {/* 아이템 정보 */}
                      <div className="text-xs font-bold hero-text-primary mb-1">
                        {ITEM_TYPE_NAMES[item.type]}
                        {isUpgrade && (
                          <span className="text-green-500 ml-1 font-bold">
                            ★
                          </span>
                        )}
                      </div>
                      <div className="text-xs hero-text-secondary mb-1">
                        Lv.{item.level}
                        {item.enhancementLevel > 0 && (
                          <span className="hero-text-purple ml-1">
                            +{item.enhancementLevel}
                          </span>
                        )}
                      </div>
                      <div
                        className={`text-xs font-medium mb-2 ${
                          item.grade === ItemGrade.COMMON
                            ? "hero-text-muted"
                            : item.grade === ItemGrade.RARE
                            ? "hero-text-blue"
                            : item.grade === ItemGrade.EPIC
                            ? "hero-text-purple"
                            : "hero-text-accent"
                        }`}
                      >
                        {GRADE_NAMES[item.grade]}
                      </div>

                      {/* 스탯 정보 */}
                      <div className="text-xs hero-text-secondary space-y-1">
                        {item.enhancedStats.attack > 0 && (
                          <div>공격: {item.enhancedStats.attack}</div>
                        )}
                        {item.enhancedStats.defense > 0 && (
                          <div>방어: {item.enhancedStats.defense}</div>
                        )}
                        {item.enhancedStats.defensePenetration > 0 && (
                          <div>
                            방무: {item.enhancedStats.defensePenetration}
                          </div>
                        )}
                        {item.enhancedStats.additionalAttackChance > 0 && (
                          <div>
                            추가타격:{" "}
                            {(
                              item.enhancedStats.additionalAttackChance * 100
                            ).toFixed(1)}
                            %
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 하단 정보 */}
        <div className="hero-card-accent px-6 py-4 flex justify-between items-center">
          <div className="text-sm hero-text-secondary">
            총 {gameState.inventory.length}개 아이템 | 표시 중:{" "}
            {sortedItems.length}개
            {sortedItems.filter(isUpgradeCandidate).length > 0 && (
              <span className="ml-2 text-green-500 font-bold">
                (업그레이드 가능:{" "}
                {sortedItems.filter(isUpgradeCandidate).length}개)
              </span>
            )}
          </div>
          <button onClick={onClose} className="hero-btn hero-btn-primary">
            닫기
          </button>
        </div>
      </div>

      {/* 배경 클릭으로 닫기 */}
      <div className="absolute inset-0 -z-10" onClick={onClose} />

      {/* 판매 확인 다이얼로그 */}
      {showSaleConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-60">
          <div className="hero-card rounded-xl shadow-2xl max-w-md w-full mx-4">
            <div className="hero-card-accent p-6">
              <h3 className="text-xl font-bold hero-text-primary mb-4">
                ⚠️ 판매 확인
              </h3>

              <div className="space-y-3 mb-6">
                <p className="hero-text-secondary">
                  다음 아이템들을 판매하시겠습니까?
                </p>

                {saleWarnings.map((warning, index) => (
                  <div
                    key={index}
                    className="p-3 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded-lg text-sm"
                  >
                    ⚠️ {warning}
                  </div>
                ))}

                <div className="p-3 hero-card-blue rounded-lg">
                  <div className="text-sm hero-text-secondary">총 판매가:</div>
                  <div className="text-lg font-bold text-yellow-400">
                    {calculateTotalSalePrice(
                      gameState.inventory.filter(
                        (item) =>
                          selectedItemsForSale.has(item.id) &&
                          canSellItem(item, gameState.equippedItems)
                      )
                    ).toLocaleString()}{" "}
                    크레딧
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowSaleConfirmDialog(false);
                    setSaleWarnings([]);
                  }}
                  className="hero-btn hero-btn-primary flex-1"
                >
                  취소
                </button>
                <button
                  onClick={handleConfirmSale}
                  disabled={isProcessingSale}
                  className="hero-btn hero-btn-danger flex-1"
                >
                  {isProcessingSale ? "판매 중..." : "판매 확인"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InventoryModal;
