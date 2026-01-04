"use client";

import React, { useState, useCallback } from "react";
import { Item, ItemType } from "../types/game";
import { useGame } from "../contexts/GameContext";
import {
  generateInheritancePreview,
  performInheritance,
  getGradeDisplayName,
  getItemTypeDisplayName,
  formatStatsForDisplay,
  InheritancePreview,
} from "../utils/inheritanceSystem";

interface InheritanceSystemProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InheritanceSystem({ isOpen, onClose }: InheritanceSystemProps) {
  const { gameState, actions } = useGame();
  const [selectedSourceItem, setSelectedSourceItem] = useState<Item | null>(
    null
  );
  const [selectedTargetItem, setSelectedTargetItem] = useState<Item | null>(
    null
  );
  const [inheritancePreview, setInheritancePreview] =
    useState<InheritancePreview | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Get all items (equipped + inventory) for selection
  const getAllItems = useCallback((): Item[] => {
    const equippedItems = Object.values(gameState.equippedItems).filter(
      (item): item is Item => item !== null
    );
    return [...equippedItems, ...gameState.inventory];
  }, [gameState.equippedItems, gameState.inventory]);

  // Filter items by type for target selection
  const getItemsByType = useCallback(
    (type: ItemType): Item[] => {
      return getAllItems().filter((item) => item.type === type);
    },
    [getAllItems]
  );

  // Generate preview when both items are selected
  React.useEffect(() => {
    if (selectedSourceItem && selectedTargetItem) {
      const preview = generateInheritancePreview(
        selectedSourceItem,
        selectedTargetItem
      );
      setInheritancePreview(preview);
    } else {
      setInheritancePreview(null);
    }
  }, [selectedSourceItem, selectedTargetItem]);

  // Handle source item selection
  const handleSourceItemSelect = (item: Item) => {
    setSelectedSourceItem(item);
    // Reset target item if it's not compatible
    if (selectedTargetItem && selectedTargetItem.type !== item.type) {
      setSelectedTargetItem(null);
    }
  };

  // Handle target item selection
  const handleTargetItemSelect = (item: Item) => {
    setSelectedTargetItem(item);
  };

  // Perform inheritance
  const handleInheritance = async () => {
    if (
      !selectedSourceItem ||
      !selectedTargetItem ||
      !inheritancePreview?.canInherit
    ) {
      return;
    }

    setIsProcessing(true);

    try {
      const success = actions.inheritItem(
        selectedSourceItem,
        selectedTargetItem
      );

      if (success) {
        // Reset selection
        setSelectedSourceItem(null);
        setSelectedTargetItem(null);
        setInheritancePreview(null);

        // Show success message (could be replaced with toast notification)
        alert("계승이 완료되었습니다!");
      } else {
        alert("계승에 실패했습니다.");
      }
    } catch (error) {
      console.error("Inheritance error:", error);
      alert("계승 중 오류가 발생했습니다.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset selections
  const handleReset = () => {
    setSelectedSourceItem(null);
    setSelectedTargetItem(null);
    setInheritancePreview(null);
  };

  if (!isOpen) {
    return null;
  }

  const allItems = getAllItems();
  const targetItems = selectedSourceItem
    ? getItemsByType(selectedSourceItem.type)
    : [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">아이템 계승</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Source Item Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700">
              소스 아이템 선택 (계승될 아이템)
            </h3>
            <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
              {allItems.length === 0 ? (
                <p className="text-gray-500 text-center">아이템이 없습니다.</p>
              ) : (
                <div className="space-y-2">
                  {allItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleSourceItemSelect(item)}
                      className={`p-3 border rounded cursor-pointer transition-colors ${
                        selectedSourceItem?.id === item.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">
                            {getItemTypeDisplayName(item.type)} (
                            {getGradeDisplayName(item.grade)})
                          </div>
                          <div className="text-sm text-gray-600">
                            {formatStatsForDisplay(item.enhancedStats)}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          Lv.{item.level}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Target Item Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700">
              타겟 아이템 선택 (계승받을 아이템)
            </h3>
            <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
              {!selectedSourceItem ? (
                <p className="text-gray-500 text-center">
                  먼저 소스 아이템을 선택해주세요.
                </p>
              ) : targetItems.length === 0 ? (
                <p className="text-gray-500 text-center">
                  같은 타입의 아이템이 없습니다.
                </p>
              ) : (
                <div className="space-y-2">
                  {targetItems
                    .filter((item) => item.id !== selectedSourceItem.id) // Exclude source item
                    .map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleTargetItemSelect(item)}
                        className={`p-3 border rounded cursor-pointer transition-colors ${
                          selectedTargetItem?.id === item.id
                            ? "border-green-500 bg-green-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">
                              {getItemTypeDisplayName(item.type)} (
                              {getGradeDisplayName(item.grade)})
                            </div>
                            <div className="text-sm text-gray-600">
                              {formatStatsForDisplay(item.enhancedStats)}
                            </div>
                          </div>
                          <div className="text-xs text-gray-500">
                            Lv.{item.level}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Inheritance Preview */}
        {inheritancePreview && (
          <div className="mt-6 p-4 border rounded-lg bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">
              계승 미리보기
            </h3>

            {!inheritancePreview.canInherit ? (
              <div className="text-red-600 font-medium">
                {inheritancePreview.errorMessage}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Source Stats */}
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-600 mb-2">
                      소스 아이템
                    </div>
                    <div className="p-3 bg-blue-100 rounded">
                      <div className="font-medium">
                        {getItemTypeDisplayName(
                          inheritancePreview.sourceItem.type
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        {getGradeDisplayName(
                          inheritancePreview.sourceItem.grade
                        )}
                      </div>
                      <div className="text-sm mt-1">
                        {formatStatsForDisplay(
                          inheritancePreview.sourceItem.enhancedStats
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Transfer Arrow and Rate */}
                  <div className="text-center flex flex-col justify-center">
                    <div className="text-2xl">→</div>
                    <div className="text-sm font-medium text-gray-600">
                      계승률:{" "}
                      {Math.round(inheritancePreview.inheritanceRate * 100)}%
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      전승 스탯:{" "}
                      {formatStatsForDisplay(
                        inheritancePreview.transferredStats
                      )}
                    </div>
                  </div>

                  {/* Target Stats */}
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-600 mb-2">
                      타겟 아이템
                    </div>
                    <div className="p-3 bg-green-100 rounded">
                      <div className="font-medium">
                        {getItemTypeDisplayName(
                          inheritancePreview.targetItem.type
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        {getGradeDisplayName(
                          inheritancePreview.targetItem.grade
                        )}
                      </div>
                      <div className="text-sm mt-1">
                        현재:{" "}
                        {formatStatsForDisplay(
                          inheritancePreview.targetItem.enhancedStats
                        )}
                      </div>
                      <div className="text-sm mt-1 font-medium text-green-700">
                        계승 후:{" "}
                        {formatStatsForDisplay(inheritancePreview.finalStats)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-center space-x-4 mt-6">
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                  >
                    초기화
                  </button>
                  <button
                    onClick={handleInheritance}
                    disabled={isProcessing}
                    className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                  >
                    {isProcessing ? "계승 중..." : "계승 실행"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-medium text-yellow-800 mb-2">계승 시스템 안내</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>
              • 낮은 등급의 아이템 스탯을 높은 등급 아이템에 전승할 수 있습니다.
            </li>
            <li>• 같은 장비 타입끼리만 계승이 가능합니다.</li>
            <li>
              • 등급 차이에 따라 계승률이 달라집니다 (1등급: 80%, 2등급: 60%,
              3등급: 40%).
            </li>
            <li>• 계승 후 소스 아이템은 소멸됩니다.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
