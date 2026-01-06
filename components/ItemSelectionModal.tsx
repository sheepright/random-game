"use client";

import { useGame } from "../contexts/GameContext";
import { Item, ItemType, ItemGrade } from "../types/game";
import { ITEM_TYPE_NAMES, GRADE_NAMES } from "../constants/game";
import ItemImage from "./ItemImage";

interface ItemSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectItem: (item: Item) => void;
  title: string;
  description: string;
  filterFunction?: (item: Item) => boolean;
}

// 아이템 등급별 색상
const GRADE_COLORS = {
  [ItemGrade.COMMON]: "hero-card border-gray-500",
  [ItemGrade.RARE]: "hero-card-blue border-blue-400",
  [ItemGrade.EPIC]: "hero-card-purple border-purple-400",
  [ItemGrade.LEGENDARY]: "hero-card-accent border-yellow-400",
  [ItemGrade.MYTHIC]: "hero-card-red border-red-400",
};

export function ItemSelectionModal({
  isOpen,
  onClose,
  onSelectItem,
  title,
  description,
  filterFunction,
}: ItemSelectionModalProps) {
  const { gameState } = useGame();

  if (!isOpen) return null;

  // 장착된 아이템들을 배열로 변환하고 imagePath 확인
  const equippedItems = Object.values(gameState.equippedItems)
    .filter((item): item is Item => item !== null)
    .map((item) => {
      // imagePath가 없으면 추가
      if (!item.imagePath) {
        const { getItemImagePath } = require("../constants/game");
        item.imagePath = getItemImagePath(item.type);
      }
      return item;
    });

  // 필터링된 인벤토리 아이템 (imagePath 확인)
  const inventoryItemsWithPath = gameState.inventory.map((item) => {
    // imagePath가 없으면 추가
    if (!item.imagePath) {
      const { getItemImagePath } = require("../constants/game");
      item.imagePath = getItemImagePath(item.type);
    }
    return item;
  });

  const inventoryItems = filterFunction
    ? inventoryItemsWithPath.filter(filterFunction)
    : inventoryItemsWithPath;

  // 필터링된 장착 아이템
  const filteredEquippedItems = filterFunction
    ? equippedItems.filter(filterFunction)
    : equippedItems;

  // 등급순으로 정렬하는 함수
  const sortByGrade = (items: Item[]) => {
    return [...items].sort((a, b) => {
      const gradeOrder = {
        common: 0,
        rare: 1,
        epic: 2,
        legendary: 3,
        mythic: 4,
      };
      return gradeOrder[b.grade] - gradeOrder[a.grade];
    });
  };

  const sortedEquippedItems = sortByGrade(filteredEquippedItems);
  const sortedInventoryItems = sortByGrade(inventoryItems);

  const handleSelectItem = (item: Item) => {
    onSelectItem(item);
    onClose();
  };

  const renderItemGrid = (items: Item[], emptyMessage: string) => {
    if (items.length === 0) {
      return (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">📦</div>
          <div className="hero-text-muted text-sm">{emptyMessage}</div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {items.map((item) => (
          <div
            key={item.id}
            className={`border-2 rounded-lg p-3 cursor-pointer transition-all hover:shadow-lg hover:scale-105 ${
              GRADE_COLORS[item.grade]
            }`}
            onClick={() => handleSelectItem(item)}
            title="클릭하여 선택"
          >
            <div className="text-center">
              {/* 아이템 이미지 */}
              <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-2 mx-auto">
                <img
                  src={item.imagePath || "/Items/default.png"}
                  alt={`${item.type} 아이템`}
                  className="w-10 h-10 object-contain"
                  onError={(e) => {
                    console.log(
                      "아이템 선택 모달 이미지 로딩 실패:",
                      item.imagePath
                    );
                    const target = e.target as HTMLImageElement;
                    if (target.src !== "/Items/default.png") {
                      target.src = "/Items/default.png";
                    }
                  }}
                  onLoad={() => {
                    console.log(
                      "아이템 선택 모달 이미지 로딩 성공:",
                      item.imagePath
                    );
                  }}
                />
              </div>

              {/* 아이템 정보 */}
              <div className="text-xs font-bold hero-text-primary mb-1">
                {ITEM_TYPE_NAMES[item.type]}
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
                  <div>방무: {item.enhancedStats.defensePenetration}</div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="hero-card rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="hero-card-purple p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold hero-text-primary">{title}</h2>
              <p className="hero-text-secondary mt-1">{description}</p>
            </div>
            <button
              onClick={onClose}
              className="hero-text-primary hover:hero-text-secondary text-3xl font-bold transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        {/* 아이템 목록 */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {sortedEquippedItems.length === 0 &&
          sortedInventoryItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📦</div>
              <div className="hero-text-muted text-lg">
                선택 가능한 아이템이 없습니다
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* 장착된 아이템 섹션 */}
              {sortedEquippedItems.length > 0 && (
                <div>
                  <div className="flex items-center mb-4">
                    <div className="w-8 h-8 hero-card-blue rounded-lg flex items-center justify-center mr-3">
                      <span className="text-sm font-bold hero-text-primary">
                        ⚔️
                      </span>
                    </div>
                    <h3 className="text-lg font-bold hero-text-primary">
                      장착된 아이템 ({sortedEquippedItems.length}개)
                    </h3>
                  </div>
                  {renderItemGrid(
                    sortedEquippedItems,
                    "장착된 아이템이 없습니다"
                  )}
                </div>
              )}

              {/* 인벤토리 아이템 섹션 */}
              {sortedInventoryItems.length > 0 && (
                <div>
                  <div className="flex items-center mb-4">
                    <div className="w-8 h-8 hero-card-accent rounded-lg flex items-center justify-center mr-3">
                      <span className="text-sm font-bold hero-text-primary">
                        📦
                      </span>
                    </div>
                    <h3 className="text-lg font-bold hero-text-primary">
                      인벤토리 아이템 ({sortedInventoryItems.length}개)
                    </h3>
                  </div>
                  {renderItemGrid(
                    sortedInventoryItems,
                    "인벤토리가 비어있습니다"
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 하단 정보 */}
        <div className="hero-card-accent px-6 py-4 flex justify-between items-center">
          <div className="text-sm hero-text-secondary">
            총 선택 가능한 아이템:{" "}
            {sortedEquippedItems.length + sortedInventoryItems.length}개
            {sortedEquippedItems.length > 0 && (
              <span className="ml-2">
                (장착: {sortedEquippedItems.length}개, 인벤토리:{" "}
                {sortedInventoryItems.length}개)
              </span>
            )}
          </div>
          <button onClick={onClose} className="hero-btn hero-btn-primary">
            취소
          </button>
        </div>
      </div>

      {/* 배경 클릭으로 닫기 */}
      <div className="absolute inset-0 -z-10" onClick={onClose} />
    </div>
  );
}

export default ItemSelectionModal;
