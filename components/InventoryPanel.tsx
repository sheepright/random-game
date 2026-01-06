"use client";

import React, { useState, useMemo } from "react";
import { Item, ItemType, ItemGrade } from "../types/game";
import { useGame } from "../contexts/GameContext";
import { ITEM_TYPE_NAMES } from "../constants/game";
import EnhancementModal from "./EnhancementModal";
import { GridItemImage } from "./ResponsiveItemImage";
import {
  filterInventoryItems,
  sortInventoryItems,
  searchInventoryItems,
  checkInventoryCapacity,
  getItemDisplayName,
  getItemDetailInfo,
  compareItems,
  getInventoryStats,
  SortOption,
  SortDirection,
  InventoryFilter,
  InventorySort,
  INVENTORY_CONFIG,
} from "../utils/inventoryManager";
import { canEnhanceItem } from "../utils/enhancementSystem";
import {
  calculateItemSalePrice,
  calculateTotalSalePrice,
  canSellItem,
  processItemSale,
  validateItemSale,
  getSaleLimits,
  ItemSaleResult,
} from "../utils/itemSaleSystem";

/**
 * 인벤토리 패널 컴포넌트
 * Requirements: 6.2, 6.4, 6.6 - 인벤토리 아이템 표시, 정렬/필터링, 아이템 비교
 */
export default function InventoryPanel() {
  const { gameState, actions } = useGame();
  const [searchText, setSearchText] = useState("");
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [compareItem, setCompareItem] = useState<Item | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [enhancementItem, setEnhancementItem] = useState<Item | null>(null);
  const [showEnhancementModal, setShowEnhancementModal] = useState(false);

  // 판매용 다중 선택 상태
  const [selectedItemsForSale, setSelectedItemsForSale] = useState<Set<string>>(
    new Set()
  );
  const [showSaleInterface, setShowSaleInterface] = useState(false);
  const [isSelectAllMode, setIsSelectAllMode] = useState(false); // 전체 선택 모드 추적

  // 필터 상태
  const [filter, setFilter] = useState<InventoryFilter>({});

  // 정렬 상태
  const [sort, setSort] = useState<InventorySort>({
    option: SortOption.GRADE,
    direction: SortDirection.DESC,
  });

  // 인벤토리 처리된 아이템들
  const processedItems = useMemo(() => {
    let items = gameState.inventory;

    // 검색 적용
    if (searchText.trim()) {
      items = searchInventoryItems(items, searchText);
    }

    // 필터 적용
    items = filterInventoryItems(items, filter);

    // 정렬 적용
    items = sortInventoryItems(items, sort);

    return items;
  }, [gameState.inventory, searchText, filter, sort]);

  // 인벤토리 용량 정보
  const capacityInfo = useMemo(() => {
    return checkInventoryCapacity(
      gameState.inventory,
      INVENTORY_CONFIG.DEFAULT_CAPACITY
    );
  }, [gameState.inventory]);

  // 인벤토리 통계
  const inventoryStats = useMemo(() => {
    return getInventoryStats(gameState.inventory);
  }, [gameState.inventory]);

  // 선택된 아이템들과 총 판매가 계산
  const selectedItemsData = useMemo(() => {
    const selectedItems = gameState.inventory.filter((item) =>
      selectedItemsForSale.has(item.id)
    );
    const totalSalePrice = calculateTotalSalePrice(selectedItems);
    const sellableItems = selectedItems.filter((item) =>
      canSellItem(item, gameState.equippedItems)
    );

    return {
      selectedItems,
      sellableItems,
      totalSalePrice,
      hasUnsellableItems: selectedItems.length > sellableItems.length,
    };
  }, [selectedItemsForSale, gameState.inventory, gameState.equippedItems]);

  // 아이템 장착 처리
  const handleEquipItem = (item: Item) => {
    const success = actions.equipItem(item);
    if (success) {
      setSelectedItem(null);
    }
  };

  // 아이템 강화 처리
  const handleEnhanceItem = (item: Item) => {
    setEnhancementItem(item);
    setShowEnhancementModal(true);
  };

  // 강화 모달 닫기
  const handleCloseEnhancementModal = () => {
    setEnhancementItem(null);
    setShowEnhancementModal(false);
  };

  // 아이템 비교 시작
  const handleCompareItem = (item: Item) => {
    if (!compareItem) {
      setCompareItem(item);
    } else if (compareItem.id === item.id) {
      setCompareItem(null);
      setShowComparison(false);
    } else {
      setShowComparison(true);
    }
  };

  // 비교 모드 종료
  const handleEndComparison = () => {
    setCompareItem(null);
    setShowComparison(false);
  };

  // 정렬 옵션 변경
  const handleSortChange = (option: SortOption) => {
    if (sort.option === option) {
      // 같은 옵션이면 방향 토글
      setSort({
        option,
        direction:
          sort.direction === SortDirection.ASC
            ? SortDirection.DESC
            : SortDirection.ASC,
      });
    } else {
      // 다른 옵션이면 내림차순으로 설정
      setSort({
        option,
        direction: SortDirection.DESC,
      });
    }
  };

  // 필터 초기화
  const handleResetFilter = () => {
    setFilter({});
    setSearchText("");
  };

  // 아이템 판매 선택 토글
  const handleToggleItemForSale = (itemId: string) => {
    const newSelected = new Set(selectedItemsForSale);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItemsForSale(newSelected);
    setIsSelectAllMode(false); // 개별 선택 시 전체 선택 모드 해제
  };

  // 전체 선택/해제
  const handleToggleSelectAll = () => {
    if (selectedItemsForSale.size === 0) {
      // 전체 선택 (판매 가능한 아이템만)
      const sellableItemIds = processedItems
        .filter((item) => canSellItem(item, gameState.equippedItems))
        .map((item) => item.id);
      setSelectedItemsForSale(new Set(sellableItemIds));
      setIsSelectAllMode(true); // 전체 선택 모드 활성화
    } else {
      // 전체 해제
      setSelectedItemsForSale(new Set());
      setIsSelectAllMode(false); // 전체 선택 모드 비활성화
    }
  };

  // 판매 모드 토글
  const handleToggleSaleMode = () => {
    const newSaleMode = !showSaleInterface;
    setShowSaleInterface(newSaleMode);

    if (!newSaleMode) {
      // 판매 모드 종료 시 모든 상태 초기화
      setSelectedItemsForSale(new Set());
      setIsSelectAllMode(false); // 전체 선택 모드도 초기화
      setSaleSuccessMessage(null);
      setSaleErrorMessage(null);
      setSaleWarnings([]);
      setShowSaleConfirmDialog(false);
    }
  };

  // 판매 확인 다이얼로그 상태
  const [showSaleConfirmDialog, setShowSaleConfirmDialog] = useState(false);
  const [saleSuccessMessage, setSaleSuccessMessage] = useState<string | null>(
    null
  );
  const [saleErrorMessage, setSaleErrorMessage] = useState<string | null>(null);
  const [saleWarnings, setSaleWarnings] = useState<string[]>([]);
  const [isProcessingSale, setIsProcessingSale] = useState(false);

  // 아이템 판매 실행 (제한사항 검증 포함)
  const handleSellItems = () => {
    if (selectedItemsData.sellableItems.length === 0) {
      return;
    }

    // 판매 전 검증 수행 (전체 선택 모드 전달)
    const validation = validateItemSale(
      selectedItemsData.selectedItems,
      gameState.equippedItems,
      isSelectAllMode
    );

    if (!validation.isValid) {
      setSaleErrorMessage(validation.errors.join(" "));
      setTimeout(() => setSaleErrorMessage(null), 5000);
      return;
    }

    // 경고사항이 있으면 확인 다이얼로그에 표시
    if (validation.warnings.length > 0) {
      setSaleWarnings(validation.warnings);
    }

    setShowSaleConfirmDialog(true);
  };

  // 판매 확인
  const handleConfirmSale = async () => {
    setIsProcessingSale(true);

    try {
      const saleResult = processItemSale(
        selectedItemsData.selectedItems,
        gameState.equippedItems
      );

      if (saleResult.success) {
        // 크레딧 추가 (애니메이션 효과를 위해)
        actions.addCredits(saleResult.credits);

        // 판매된 아이템들을 인벤토리에서 제거
        saleResult.soldItems.forEach((item) => {
          actions.removeItemFromInventory(item.id);
        });

        // 성공 메시지 표시
        setSaleSuccessMessage(
          `${
            saleResult.soldItems.length
          }개 아이템을 ${saleResult.credits.toLocaleString()} 크레딧에 판매했습니다!`
        );

        // 실패한 아이템이 있으면 경고 메시지 표시
        if (saleResult.failedItems.length > 0) {
          setSaleErrorMessage(
            `${saleResult.failedItems.length}개 아이템은 장착 중이어서 판매할 수 없습니다.`
          );
        }

        // 선택 상태 초기화
        setSelectedItemsForSale(new Set());
        setShowSaleConfirmDialog(false);
        setSaleWarnings([]);

        // 3초 후 메시지 자동 제거
        setTimeout(() => {
          setSaleSuccessMessage(null);
          setSaleErrorMessage(null);
        }, 3000);
      } else {
        setSaleErrorMessage(saleResult.error || "판매 중 오류가 발생했습니다.");
        setTimeout(() => setSaleErrorMessage(null), 3000);
      }
    } catch (error) {
      setSaleErrorMessage("판매 처리 중 오류가 발생했습니다.");
      setTimeout(() => setSaleErrorMessage(null), 3000);
    } finally {
      setIsProcessingSale(false);
    }
  };

  // 판매 취소
  const handleCancelSale = () => {
    setShowSaleConfirmDialog(false);
    setSaleWarnings([]);
  };

  // 아이템 타입 한글 이름
  const getTypeDisplayName = (type: ItemType): string => {
    return ITEM_TYPE_NAMES[type] || type;
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 text-white">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">인벤토리</h2>
        <div className="flex items-center gap-4">
          <button
            onClick={handleToggleSaleMode}
            className={`px-4 py-2 rounded transition-colors ${
              showSaleInterface
                ? "bg-red-600 hover:bg-red-500"
                : "bg-green-600 hover:bg-green-500"
            }`}
          >
            {showSaleInterface ? "판매 모드 종료" : "아이템 판매"}
          </button>
          <div className="text-sm text-gray-300">
            {capacityInfo.currentCount} / {capacityInfo.maxCapacity}
            {capacityInfo.isFull && (
              <span className="text-red-400 ml-2">(가득함)</span>
            )}
          </div>
        </div>
      </div>

      {/* 판매 모드 정보 패널 */}
      {showSaleInterface && (
        <div className="mb-4 p-4 bg-blue-900 rounded-lg">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold">아이템 판매 모드</h3>
            <button
              onClick={handleToggleSelectAll}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded text-sm"
            >
              {selectedItemsForSale.size === 0 ? "전체 선택" : "전체 해제"}
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-300">선택된 아이템:</span>
              <span className="ml-2 font-semibold">
                {selectedItemsData.selectedItems.length}개
              </span>
            </div>
            <div>
              <span className="text-gray-300">판매 가능:</span>
              <span className="ml-2 font-semibold text-green-400">
                {selectedItemsData.sellableItems.length}개
              </span>
            </div>
            <div>
              <span className="text-gray-300">총 판매가:</span>
              <span className="ml-2 font-semibold text-yellow-400">
                {selectedItemsData.totalSalePrice.toLocaleString()} 크레딧
              </span>
            </div>
            {selectedItemsData.hasUnsellableItems && (
              <div className="text-red-400 text-xs">
                장착된 아이템은 판매할 수 없습니다
              </div>
            )}
          </div>
        </div>
      )}

      {/* 판매 성공/오류 메시지 */}
      {(saleSuccessMessage || saleErrorMessage) && (
        <div className="fixed top-4 right-4 z-50 max-w-sm">
          {saleSuccessMessage && (
            <div className="bg-green-600 text-white p-4 rounded-lg shadow-lg mb-2 animate-slide-in-right">
              <div className="flex items-center">
                <span className="text-xl mr-2">✅</span>
                <span>{saleSuccessMessage}</span>
              </div>
            </div>
          )}
          {saleErrorMessage && (
            <div className="bg-red-600 text-white p-4 rounded-lg shadow-lg animate-slide-in-right">
              <div className="flex items-center">
                <span className="text-xl mr-2">⚠️</span>
                <span>{saleErrorMessage}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 검색 및 필터 영역 */}
      <div className="mb-4 space-y-3">
        {/* 검색바 */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="아이템 검색..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400"
          />
          <button
            onClick={handleResetFilter}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded transition-colors"
          >
            초기화
          </button>
        </div>

        {/* 필터 옵션 */}
        <div className="flex flex-wrap gap-2">
          {/* 타입 필터 */}
          <select
            value={filter.type || ""}
            onChange={(e) =>
              setFilter({
                ...filter,
                type: (e.target.value as ItemType) || undefined,
              })
            }
            className="px-3 py-1 bg-gray-700 border border-gray-600 rounded text-sm"
          >
            <option value="">모든 타입</option>
            {Object.values(ItemType).map((type) => (
              <option key={type} value={type}>
                {getTypeDisplayName(type)}
              </option>
            ))}
          </select>

          {/* 등급 필터 */}
          <select
            value={filter.grade || ""}
            onChange={(e) =>
              setFilter({
                ...filter,
                grade: (e.target.value as ItemGrade) || undefined,
              })
            }
            className="px-3 py-1 bg-gray-700 border border-gray-600 rounded text-sm"
          >
            <option value="">모든 등급</option>
            <option value={ItemGrade.MYTHIC}>신화</option>
            <option value={ItemGrade.LEGENDARY}>전설</option>
            <option value={ItemGrade.EPIC}>에픽</option>
            <option value={ItemGrade.RARE}>레어</option>
            <option value={ItemGrade.COMMON}>일반</option>
          </select>
        </div>

        {/* 정렬 옵션 */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-gray-400 self-center">정렬:</span>
          {[
            { option: SortOption.GRADE, label: "등급" },
            { option: SortOption.TYPE, label: "타입" },
            { option: SortOption.LEVEL, label: "레벨" },
            { option: SortOption.ATTACK, label: "공격력" },
            { option: SortOption.DEFENSE, label: "방어력" },
            { option: SortOption.ENHANCEMENT_LEVEL, label: "강화" },
          ].map(({ option, label }) => (
            <button
              key={option}
              onClick={() => handleSortChange(option)}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                sort.option === option
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 hover:bg-gray-600 text-gray-300"
              }`}
            >
              {label}
              {sort.option === option && (
                <span className="ml-1">
                  {sort.direction === SortDirection.ASC ? "↑" : "↓"}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 인벤토리 통계 */}
      <div className="mb-4 p-3 bg-gray-700 rounded">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
          <div>총 아이템: {inventoryStats.totalItems}개</div>
          <div>평균 레벨: {inventoryStats.averageLevel.toFixed(1)}</div>
          <div>신화: {inventoryStats.itemsByGrade[ItemGrade.MYTHIC]}개</div>
          <div>전설: {inventoryStats.itemsByGrade[ItemGrade.LEGENDARY]}개</div>
          <div>에픽: {inventoryStats.itemsByGrade[ItemGrade.EPIC]}개</div>
        </div>
      </div>

      {/* 비교 모드 안내 */}
      {compareItem && !showComparison && (
        <div className="mb-4 p-3 bg-blue-900 rounded">
          <p className="text-sm">
            비교할 아이템을 선택하세요. 현재 선택:{" "}
            {getItemDisplayName(compareItem)}
          </p>
          <button
            onClick={handleEndComparison}
            className="mt-2 px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded text-sm"
          >
            비교 취소
          </button>
        </div>
      )}

      {/* 아이템 목록 - 이미지 그리드 */}
      <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3 max-h-96 overflow-y-auto">
        {processedItems.length === 0 ? (
          <div className="col-span-full text-center text-gray-400 py-8">
            {gameState.inventory.length === 0
              ? "인벤토리가 비어있습니다"
              : "검색 결과가 없습니다"}
          </div>
        ) : (
          processedItems.map((item) => {
            const itemInfo = getItemDetailInfo(item);
            const isSelected = selectedItem?.id === item.id;
            const isCompareSelected = compareItem?.id === item.id;
            const isSelectedForSale = selectedItemsForSale.has(item.id);
            const canSell = canSellItem(item, gameState.equippedItems);

            return (
              <div
                key={item.id}
                className={`relative group cursor-pointer transition-all ${
                  isSelected
                    ? "ring-2 ring-blue-400"
                    : isCompareSelected
                    ? "ring-2 ring-yellow-400"
                    : isSelectedForSale && showSaleInterface
                    ? "ring-2 ring-green-400"
                    : "hover:ring-1 hover:ring-gray-400"
                }`}
                onClick={() => {
                  if (showSaleInterface) {
                    handleToggleItemForSale(item.id);
                  } else {
                    setSelectedItem(isSelected ? null : item);
                  }
                }}
              >
                {/* 판매 모드 체크박스 */}
                {showSaleInterface && (
                  <div className="absolute top-1 left-1 z-10">
                    <input
                      type="checkbox"
                      checked={isSelectedForSale}
                      disabled={!canSell}
                      onChange={() => handleToggleItemForSale(item.id)}
                      onClick={(e) => e.stopPropagation()}
                      className={`w-4 h-4 rounded ${
                        !canSell
                          ? "opacity-50 cursor-not-allowed"
                          : "cursor-pointer"
                      }`}
                    />
                  </div>
                )}

                {/* 장착된 아이템 표시 */}
                {!canSell && showSaleInterface && (
                  <div className="absolute top-1 right-1 z-10">
                    <span className="bg-red-600 text-white text-xs px-1 rounded">
                      장착중
                    </span>
                  </div>
                )}

                {/* 아이템 이미지 */}
                <GridItemImage
                  item={item}
                  onClick={() => {
                    if (!showSaleInterface) {
                      setSelectedItem(isSelected ? null : item);
                    }
                  }}
                  isSelected={isSelected}
                />

                {/* 호버 시 상세 정보 툴팁 */}
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-90 text-white text-xs p-2 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <div className="font-semibold">{itemInfo.name}</div>
                  <div className="text-gray-300">Lv.{item.level}</div>
                  {showSaleInterface && (
                    <div className="text-yellow-400">
                      판매가: {calculateItemSalePrice(item).toLocaleString()}{" "}
                      크레딧
                    </div>
                  )}
                  {itemInfo.totalStats.attack > 0 && (
                    <div>공격: {itemInfo.totalStats.attack}</div>
                  )}
                  {itemInfo.totalStats.defense > 0 && (
                    <div>방어: {itemInfo.totalStats.defense}</div>
                  )}
                  {itemInfo.totalStats.defensePenetration > 0 && (
                    <div>방무: {itemInfo.totalStats.defensePenetration}</div>
                  )}
                </div>

                {/* 선택된 아이템 액션 버튼 (판매 모드가 아닐 때만) */}
                {isSelected && !showSaleInterface && (
                  <div className="absolute -bottom-12 left-0 right-0 bg-gray-800 rounded-lg p-2 shadow-lg z-20">
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEquipItem(item);
                        }}
                        className="flex-1 px-2 py-1 bg-green-600 hover:bg-green-500 rounded text-xs"
                      >
                        장착
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEnhanceItem(item);
                        }}
                        disabled={!canEnhanceItem(item, gameState.credits)}
                        className={`flex-1 px-2 py-1 rounded text-xs font-semibold transition-colors ${
                          canEnhanceItem(item, gameState.credits)
                            ? "bg-purple-600 hover:bg-purple-500 text-white"
                            : "bg-gray-500 cursor-not-allowed text-gray-300"
                        }`}
                        title={
                          !canEnhanceItem(item, gameState.credits)
                            ? item.enhancementLevel >= 25
                              ? "최대 강화 레벨에 도달했습니다"
                              : "크레딧이 부족합니다"
                            : `+${item.enhancementLevel + 1}로 강화`
                        }
                      >
                        {item.enhancementLevel >= 25 ? "최대" : "강화"}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCompareItem(item);
                        }}
                        className="flex-1 px-2 py-1 bg-blue-600 hover:bg-blue-500 rounded text-xs"
                      >
                        비교
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 판매 인터페이스 (판매 모드일 때만 표시) */}
      {showSaleInterface && (
        <div className="mt-4 p-4 bg-gray-700 rounded-lg border-t border-gray-600">
          {/* 판매 제한사항 안내 */}
          <div className="mb-3 p-3 bg-gray-600 rounded-lg">
            <div className="text-sm text-gray-300 mb-2">
              <span className="font-semibold text-yellow-400">
                판매 제한사항:
              </span>
            </div>
            <div className="text-xs text-gray-400 space-y-1">
              <div>
                • 개별 선택 시 최대 {getSaleLimits().MAX_ITEMS_PER_SALE}개까지
                판매 가능 (전체 선택 시 제한 없음)
              </div>
              <div>• Epic, Legendary 등급 아이템 판매 시 추가 확인</div>
              <div>
                • {getSaleLimits().HIGH_VALUE_CONFIRMATION_THRESHOLD} 크레딧
                이상 고가치 판매 시 추가 확인
              </div>
              <div>• 현재 장착 중인 아이템은 판매 불가</div>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex-1">
              <div className="text-sm text-gray-300 mb-1">
                선택된 아이템: {selectedItemsData.selectedItems.length}개
                {!isSelectAllMode &&
                  selectedItemsData.selectedItems.length >
                    getSaleLimits().MAX_ITEMS_PER_SALE && (
                    <span className="text-red-400 ml-2">
                      (제한 초과: 최대 {getSaleLimits().MAX_ITEMS_PER_SALE}개)
                    </span>
                  )}
                {isSelectAllMode &&
                  selectedItemsData.selectedItems.length >
                    getSaleLimits().MAX_ITEMS_PER_SALE && (
                    <span className="text-green-400 ml-2">
                      (전체 선택 모드: 제한 없음)
                    </span>
                  )}
                {selectedItemsData.hasUnsellableItems && (
                  <span className="text-red-400 ml-2">
                    (장착된 아이템{" "}
                    {selectedItemsData.selectedItems.length -
                      selectedItemsData.sellableItems.length}
                    개 제외)
                  </span>
                )}
              </div>
              <div className="text-lg font-semibold text-yellow-400">
                총 판매가: {selectedItemsData.totalSalePrice.toLocaleString()}{" "}
                크레딧
              </div>
            </div>
            <button
              onClick={handleSellItems}
              disabled={
                selectedItemsData.sellableItems.length === 0 || isProcessingSale
              }
              className={`px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
                selectedItemsData.sellableItems.length > 0 && !isProcessingSale
                  ? "bg-green-600 hover:bg-green-500 text-white"
                  : "bg-gray-500 cursor-not-allowed text-gray-300"
              }`}
            >
              {isProcessingSale && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              )}
              {isProcessingSale ? "판매 중..." : "선택된 아이템 판매"}
            </button>
          </div>
        </div>
      )}

      {/* 판매 확인 다이얼로그 */}
      {showSaleConfirmDialog && (
        <SaleConfirmationDialog
          selectedItems={selectedItemsData.sellableItems}
          totalPrice={selectedItemsData.totalSalePrice}
          warnings={saleWarnings}
          onConfirm={handleConfirmSale}
          onCancel={handleCancelSale}
        />
      )}

      {/* 아이템 비교 모달 */}
      {showComparison && compareItem && selectedItem && (
        <ItemComparisonModal
          item1={compareItem}
          item2={selectedItem}
          onClose={handleEndComparison}
        />
      )}

      {/* 아이템 강화 모달 */}
      <EnhancementModal
        item={enhancementItem}
        isOpen={showEnhancementModal}
        onClose={handleCloseEnhancementModal}
      />
    </div>
  );
}

/**
 * 아이템 비교 모달 컴포넌트
 * Requirements: 6.6 - 아이템 비교 기능
 */
interface ItemComparisonModalProps {
  item1: Item;
  item2: Item;
  onClose: () => void;
}

function ItemComparisonModal({
  item1,
  item2,
  onClose,
}: ItemComparisonModalProps) {
  const comparison = compareItems(item1, item2);

  const getComparisonColor = (diff: number): string => {
    if (diff > 0) return "text-green-400";
    if (diff < 0) return "text-red-400";
    return "text-gray-400";
  };

  const getComparisonIcon = (diff: number): string => {
    if (diff > 0) return "↑";
    if (diff < 0) return "↓";
    return "=";
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">아이템 비교</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* 첫 번째 아이템 */}
          <div className="space-y-3">
            <h4 className="font-semibold text-white">
              {comparison.item1.name}
            </h4>
            <div className="space-y-1 text-sm">
              <div>레벨: {comparison.item1.level}</div>
              <div>공격력: {comparison.item1.totalStats.attack}</div>
              <div>방어력: {comparison.item1.totalStats.defense}</div>
              <div>방무: {comparison.item1.totalStats.defensePenetration}</div>
            </div>
          </div>

          {/* 두 번째 아이템 */}
          <div className="space-y-3">
            <h4 className="font-semibold text-white">
              {comparison.item2.name}
            </h4>
            <div className="space-y-1 text-sm">
              <div>레벨: {comparison.item2.level}</div>
              <div>공격력: {comparison.item2.totalStats.attack}</div>
              <div>방어력: {comparison.item2.totalStats.defense}</div>
              <div>방무: {comparison.item2.totalStats.defensePenetration}</div>
            </div>
          </div>
        </div>

        {/* 비교 결과 */}
        <div className="mt-6 p-4 bg-gray-700 rounded">
          <h5 className="font-semibold text-white mb-3">비교 결과</h5>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>공격력 차이:</span>
              <span
                className={getComparisonColor(comparison.comparison.attack)}
              >
                {getComparisonIcon(comparison.comparison.attack)}{" "}
                {Math.abs(comparison.comparison.attack)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>방어력 차이:</span>
              <span
                className={getComparisonColor(comparison.comparison.defense)}
              >
                {getComparisonIcon(comparison.comparison.defense)}{" "}
                {Math.abs(comparison.comparison.defense)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>방무 차이:</span>
              <span
                className={getComparisonColor(
                  comparison.comparison.defensePenetration
                )}
              >
                {getComparisonIcon(comparison.comparison.defensePenetration)}{" "}
                {Math.abs(comparison.comparison.defensePenetration)}
              </span>
            </div>
            <div className="flex justify-between font-semibold border-t border-gray-600 pt-2">
              <span>전체 성능:</span>
              <span
                className={getComparisonColor(comparison.comparison.overall)}
              >
                {comparison.comparison.overall > 0
                  ? "첫 번째 아이템이 우수"
                  : comparison.comparison.overall < 0
                  ? "두 번째 아이템이 우수"
                  : "동일한 성능"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
/**
 * 판매 확인 다이얼로그 컴포넌트
 * Requirements: 6.8, 6.9, 6.11 - 판매 확인 및 되돌릴 수 없음 경고
 */
interface SaleConfirmationDialogProps {
  selectedItems: Item[];
  totalPrice: number;
  warnings?: string[];
  onConfirm: () => void;
  onCancel: () => void;
}

function SaleConfirmationDialog({
  selectedItems,
  totalPrice,
  warnings = [],
  onConfirm,
  onCancel,
}: SaleConfirmationDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirm = async () => {
    setIsProcessing(true);
    await onConfirm();
    setIsProcessing(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">아이템 판매 확인</h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        <div className="mb-6">
          <div className="text-yellow-400 font-semibold mb-2">
            ⚠️ 주의: 판매한 아이템은 되돌릴 수 없습니다!
          </div>

          {/* 경고 메시지 표시 */}
          {warnings.length > 0 && (
            <div className="mb-4 p-3 bg-yellow-900 border border-yellow-600 rounded-lg">
              <div className="text-yellow-300 font-semibold mb-2">
                추가 확인 사항:
              </div>
              <ul className="text-sm text-yellow-200 space-y-1">
                {warnings.map((warning, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-yellow-400 mr-2">•</span>
                    <span>{warning}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-2 text-sm text-gray-300">
            <div>
              판매할 아이템 수:{" "}
              <span className="text-white font-semibold">
                {selectedItems.length}개
              </span>
            </div>
            <div>
              획득할 크레딧:{" "}
              <span className="text-yellow-400 font-semibold">
                {totalPrice.toLocaleString()} 크레딧
              </span>
            </div>
          </div>

          {selectedItems.length > 0 && (
            <div className="mt-4 max-h-32 overflow-y-auto">
              <div className="text-sm text-gray-400 mb-2">
                판매할 아이템 목록:
              </div>
              <div className="space-y-1">
                {selectedItems.slice(0, 5).map((item) => {
                  const itemInfo = getItemDetailInfo(item);
                  const salePrice = calculateItemSalePrice(item);
                  return (
                    <div key={item.id} className="flex justify-between text-xs">
                      <span className="text-gray-300">{itemInfo.name}</span>
                      <span className="text-yellow-400">
                        {salePrice.toLocaleString()} 크레딧
                      </span>
                    </div>
                  );
                })}
                {selectedItems.length > 5 && (
                  <div className="text-xs text-gray-400">
                    ... 외 {selectedItems.length - 5}개 아이템
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isProcessing}
            className={`flex-1 px-4 py-2 rounded transition-colors ${
              isProcessing
                ? "bg-gray-500 cursor-not-allowed text-gray-400"
                : "bg-gray-600 hover:bg-gray-500"
            }`}
          >
            취소
          </button>
          <button
            onClick={handleConfirm}
            disabled={isProcessing}
            className={`flex-1 px-4 py-2 rounded transition-colors font-semibold flex items-center justify-center gap-2 ${
              isProcessing
                ? "bg-gray-500 cursor-not-allowed text-gray-400"
                : "bg-red-600 hover:bg-red-500"
            }`}
          >
            {isProcessing && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            {isProcessing ? "처리 중..." : "판매 확인"}
          </button>
        </div>
      </div>
    </div>
  );
}
