"use client";

import { useState, useMemo } from "react";
import { useGame } from "../contexts/GameContext";
import { Item, ItemType, ItemGrade, ItemStats } from "../types/game";
import {
  calculateInheritancePreview,
  canPerformInheritance,
  calculateGradeDifference,
} from "../utils/inheritanceSystem";
import { ITEM_TYPE_NAMES, GRADE_NAMES } from "../constants/game";
import ResponsiveItemImage from "./ResponsiveItemImage";

/**
 * InheritanceModal 컴포넌트
 * 계승 소스/타겟 아이템 선택 UI, 계승 결과 미리보기, 계승 확인/취소 인터페이스 제공
 * Requirements: 5.5, 9.7
 */

interface InheritanceModalProps {
  isVisible: boolean;
  onClose: () => void;
  preselectedSourceItem?: Item | null;
  preselectedTargetItem?: Item | null;
}

// 아이템 등급별 색상
const GRADE_COLORS = {
  [ItemGrade.COMMON]: "hero-card border-gray-400 hero-text-secondary",
  [ItemGrade.RARE]: "hero-card-blue border-blue-400 hero-text-blue",
  [ItemGrade.EPIC]: "hero-card-purple border-purple-400 hero-text-purple",
  [ItemGrade.LEGENDARY]: "hero-card-accent border-yellow-400 hero-text-accent",
  [ItemGrade.MYTHIC]: "hero-card-red border-red-400 hero-text-red",
};

// 등급 순서 (계승 방향 확인용)
const GRADE_ORDER = {
  [ItemGrade.COMMON]: 1,
  [ItemGrade.RARE]: 2,
  [ItemGrade.EPIC]: 3,
  [ItemGrade.LEGENDARY]: 4,
  [ItemGrade.MYTHIC]: 5,
};

interface ItemSelectorProps {
  title: string;
  selectedItem: Item | null;
  availableItems: Item[];
  onSelectItem: (item: Item | null) => void;
  disabled?: boolean;
}

function ItemSelector({
  title,
  selectedItem,
  availableItems,
  onSelectItem,
  disabled,
}: ItemSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold hero-text-primary">{title}</h3>

      {/* 선택된 아이템 표시 */}
      <div
        className={`
          border-2 rounded-lg p-4 min-h-32 cursor-pointer transition-all
          ${
            selectedItem
              ? `${GRADE_COLORS[selectedItem.grade]} hover:shadow-md`
              : "hero-card border-gray-300 hover:hero-card"
          }
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        `}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        {selectedItem ? (
          <div className="flex items-center gap-3">
            {/* 아이템 이미지 */}
            <div className="shrink-0">
              <ResponsiveItemImage item={selectedItem} size="medium" />
            </div>

            {/* 아이템 정보 */}
            <div className="flex-1">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-semibold hero-text-primary">
                    {ITEM_TYPE_NAMES[selectedItem.type]}
                  </div>
                  <div className="text-sm hero-text-secondary">
                    {GRADE_NAMES[selectedItem.grade]} • 레벨{" "}
                    {selectedItem.level}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!disabled) onSelectItem(null);
                  }}
                  className="hero-text-red hover:hero-text-red text-xl"
                >
                  ×
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm hero-text-secondary">
                <div>공격: {selectedItem.enhancedStats.attack}</div>
                <div>방어: {selectedItem.enhancedStats.defense}</div>
                <div>방무: {selectedItem.enhancedStats.defensePenetration}</div>
                <div>
                  추가타격:{" "}
                  {(
                    selectedItem.enhancedStats.additionalAttackChance * 100
                  ).toFixed(1)}
                  %
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-8 hero-text-muted">
            {disabled ? "아이템을 선택할 수 없습니다" : "아이템을 선택하세요"}
          </div>
        )}
      </div>

      {/* 아이템 목록 */}
      {isOpen && !disabled && (
        <div className="hero-card border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {availableItems.length === 0 ? (
            <div className="p-4 text-center hero-text-muted">
              선택 가능한 아이템이 없습니다
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {availableItems.map((item) => (
                <div
                  key={item.id}
                  className={`
                    p-3 rounded cursor-pointer transition-all hover:shadow-sm flex items-center gap-3
                    ${GRADE_COLORS[item.grade]}
                  `}
                  onClick={() => {
                    onSelectItem(item);
                    setIsOpen(false);
                  }}
                >
                  {/* 아이템 이미지 */}
                  <div className="shrink-0">
                    <ResponsiveItemImage item={item} size="small" />
                  </div>

                  {/* 아이템 정보 */}
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium hero-text-primary">
                          {ITEM_TYPE_NAMES[item.type]}
                        </div>
                        <div className="text-sm hero-text-secondary">
                          {GRADE_NAMES[item.grade]} • 레벨 {item.level}
                        </div>
                      </div>
                      <div className="text-right text-sm hero-text-secondary">
                        <div>공격: {item.enhancedStats.attack}</div>
                        <div>방어: {item.enhancedStats.defense}</div>
                        <div>방무: {item.enhancedStats.defensePenetration}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface InheritancePreviewProps {
  sourceItem: Item;
  targetItem: Item;
  previewResult: {
    success: boolean;
    inheritedItem?: Item;
    successRate?: number;
    targetEnhancementLevel?: number;
    error?: string;
  };
}

function InheritancePreview({
  sourceItem,
  targetItem,
  previewResult,
}: InheritancePreviewProps) {
  if (!previewResult.success) {
    return (
      <div className="hero-card-red p-4">
        <h3 className="text-lg font-semibold hero-text-red mb-2">계승 불가</h3>
        <p className="hero-text-secondary">{previewResult.error}</p>
      </div>
    );
  }

  const { inheritedItem, successRate, targetEnhancementLevel } = previewResult;
  if (!inheritedItem || targetEnhancementLevel === undefined) return null;

  const gradeDifference = calculateGradeDifference(
    sourceItem.grade,
    targetItem.grade
  );
  const levelReduction = sourceItem.enhancementLevel - targetEnhancementLevel;

  return (
    <div className="hero-card-green p-4 space-y-4">
      <h3 className="text-lg font-semibold hero-text-green">
        강화 등급 계승 미리보기
      </h3>

      {/* 계승 성공률 표시 */}
      <div className="hero-card rounded p-3">
        <div className="text-sm hero-text-secondary mb-1">계승 성공률</div>
        <div className="text-xl font-bold hero-text-green">
          {(successRate! * 100).toFixed(1)}%
        </div>
      </div>

      {/* 강화 등급 변화 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 소스 아이템 */}
        <div className="hero-card rounded p-3">
          <div className="text-sm font-semibold hero-text-secondary mb-2">
            소스 아이템
          </div>
          <div className="flex flex-col items-center gap-2 mb-3">
            <ResponsiveItemImage item={sourceItem} size="medium" />
            <div className="text-center">
              <div className="font-medium hero-text-primary text-sm">
                {ITEM_TYPE_NAMES[sourceItem.type]}
              </div>
              <div className="text-xs hero-text-secondary">
                {GRADE_NAMES[sourceItem.grade]}
              </div>
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold hero-text-blue">
              +{sourceItem.enhancementLevel}
            </div>
            <div className="text-xs hero-text-secondary">강화 등급</div>
          </div>
        </div>

        {/* 전승되는 강화 등급 */}
        <div className="hero-card-blue rounded p-3">
          <div className="text-sm font-semibold hero-text-blue mb-2">
            강화 등급 전승
          </div>
          <div className="flex items-center justify-center mb-3">
            <div className="text-3xl hero-text-blue">→</div>
          </div>
          <div className="text-center space-y-2">
            <div className="text-lg font-bold hero-text-blue">
              +{sourceItem.enhancementLevel} → +{targetEnhancementLevel}
            </div>
            <div className="text-sm hero-text-blue">
              {levelReduction}레벨 감소
            </div>
            <div className="text-xs hero-text-secondary">
              등급 차이: {gradeDifference}단계
            </div>
          </div>
        </div>

        {/* 결과 아이템 */}
        <div className="hero-card-green rounded p-3">
          <div className="text-sm font-semibold hero-text-green mb-2">
            결과 아이템
          </div>
          <div className="flex flex-col items-center gap-2 mb-3">
            <ResponsiveItemImage item={targetItem} size="medium" />
            <div className="text-center">
              <div className="font-medium hero-text-primary text-sm">
                {ITEM_TYPE_NAMES[targetItem.type]}
              </div>
              <div className="text-xs hero-text-secondary">
                {GRADE_NAMES[targetItem.grade]}
              </div>
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold hero-text-green">
              +{targetEnhancementLevel}
            </div>
            <div className="text-xs hero-text-secondary">최종 강화 등급</div>
          </div>
        </div>
      </div>

      {/* 주의사항 */}
      <div className="hero-card-red rounded p-3">
        <div className="text-sm font-semibold hero-text-red mb-1">
          ⚠️ 중요한 주의사항
        </div>
        <div className="text-sm hero-text-secondary space-y-1">
          <div className="hero-text-red font-medium">
            • 계승 성공률: {(successRate! * 100).toFixed(1)}% (등급이 높을수록
            낮아짐)
          </div>
          <div className="hero-text-red font-medium">
            • 계승 실패 시 소스 아이템({ITEM_TYPE_NAMES[sourceItem.type]} +
            {sourceItem.enhancementLevel})이 완전히 파괴됩니다!
          </div>
          <div>• 계승 성공 시에도 소스 아이템은 소멸됩니다</div>
          <div>• 계승은 되돌릴 수 없습니다</div>
          <div>• 강화 등급에 따른 스탯은 자동으로 재계산됩니다</div>
        </div>
      </div>
    </div>
  );
}

export function InheritanceModal({
  isVisible,
  onClose,
  preselectedSourceItem = null,
  preselectedTargetItem = null,
}: InheritanceModalProps) {
  const { gameState, actions } = useGame();
  const [sourceItem, setSourceItem] = useState<Item | null>(
    preselectedSourceItem
  );
  const [targetItem, setTargetItem] = useState<Item | null>(
    preselectedTargetItem
  );
  const [isProcessing, setIsProcessing] = useState(false);

  // 모든 아이템 (장착된 아이템 + 인벤토리)
  const allItems = useMemo(() => {
    const equippedItems = Object.values(gameState.equippedItems).filter(
      Boolean
    ) as Item[];
    return [...equippedItems, ...gameState.inventory];
  }, [gameState.equippedItems, gameState.inventory]);

  // 소스 아이템으로 선택 가능한 아이템들 (낮은 등급)
  const availableSourceItems = useMemo(() => {
    if (!targetItem) return allItems;

    return allItems.filter(
      (item) =>
        item.type === targetItem.type &&
        GRADE_ORDER[item.grade] < GRADE_ORDER[targetItem.grade] &&
        item.id !== targetItem.id
    );
  }, [allItems, targetItem]);

  // 타겟 아이템으로 선택 가능한 아이템들 (높은 등급)
  const availableTargetItems = useMemo(() => {
    if (!sourceItem) return allItems;

    return allItems.filter(
      (item) =>
        item.type === sourceItem.type &&
        GRADE_ORDER[item.grade] > GRADE_ORDER[sourceItem.grade] &&
        item.id !== sourceItem.id
    );
  }, [allItems, sourceItem]);

  // 계승 미리보기 계산
  const inheritancePreview = useMemo(() => {
    if (!sourceItem || !targetItem) {
      return {
        success: false,
        error: "소스 아이템과 타겟 아이템을 모두 선택해주세요.",
      };
    }

    return calculateInheritancePreview(sourceItem, targetItem);
  }, [sourceItem, targetItem]);

  // 계승 실행 가능 여부
  const canInherit = useMemo(() => {
    if (!sourceItem || !targetItem) return false;
    return canPerformInheritance(sourceItem, targetItem);
  }, [sourceItem, targetItem]);

  const handleInheritance = async () => {
    if (!sourceItem || !targetItem || !canInherit) return;

    setIsProcessing(true);

    try {
      const success = actions.inheritItem(sourceItem, targetItem);

      if (success) {
        // 성공 시 모달 닫기
        alert(
          `계승 성공! ${targetItem.type} 아이템의 강화 등급이 증가했습니다.`
        );
        setTimeout(() => {
          onClose();
          setSourceItem(null);
          setTargetItem(null);
        }, 1000);
      } else {
        // 실패 시 소스 아이템이 이미 제거되었으므로 상태 초기화
        alert(
          `계승 실패! ${sourceItem.type} +${sourceItem.enhancementLevel} 아이템이 파괴되었습니다.`
        );
        setSourceItem(null);
        setTargetItem(null);
      }
    } catch (error) {
      console.error("계승 중 오류 발생:", error);
      alert("계승 중 오류가 발생했습니다.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (isProcessing) return;
    setSourceItem(null);
    setTargetItem(null);
    onClose();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="hero-card rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="hero-card-purple p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold hero-text-primary">
                아이템 계승 (강화 등급 전승)
              </h2>
              <p className="hero-text-secondary mt-1">
                낮은 등급 아이템의 강화 등급을 높은 등급 아이템으로 전승합니다
              </p>
            </div>
            <button
              onClick={handleClose}
              disabled={isProcessing}
              className="hero-text-primary hover:hero-text-secondary text-3xl font-bold transition-colors disabled:opacity-50"
            >
              ×
            </button>
          </div>
        </div>

        {/* 메인 콘텐츠 */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* 소스 아이템 선택 */}
            <ItemSelector
              title="소스 아이템 (강화 등급을 전승할 아이템)"
              selectedItem={sourceItem}
              availableItems={availableSourceItems}
              onSelectItem={setSourceItem}
              disabled={isProcessing}
            />

            {/* 타겟 아이템 선택 */}
            <ItemSelector
              title="타겟 아이템 (강화 등급을 전승받을 아이템)"
              selectedItem={targetItem}
              availableItems={availableTargetItems}
              onSelectItem={setTargetItem}
              disabled={isProcessing}
            />
          </div>

          {/* 계승 미리보기 */}
          {sourceItem && targetItem && (
            <InheritancePreview
              sourceItem={sourceItem}
              targetItem={targetItem}
              previewResult={inheritancePreview}
            />
          )}
        </div>

        {/* 하단 버튼 */}
        <div className="hero-card-accent px-6 py-4 flex justify-between items-center">
          <div className="text-sm hero-text-secondary">
            {!sourceItem || !targetItem
              ? "아이템을 선택해주세요"
              : !canInherit
              ? "계승 조건을 만족하지 않습니다"
              : "계승 준비 완료"}
          </div>
          <div className="space-x-3">
            <button
              onClick={handleClose}
              disabled={isProcessing}
              className="hero-btn hero-btn-primary disabled:hero-btn-disabled"
            >
              취소
            </button>
            <button
              onClick={handleInheritance}
              disabled={!canInherit || isProcessing}
              className={
                canInherit && !isProcessing
                  ? "hero-btn hero-btn-success"
                  : "hero-btn hero-btn-disabled"
              }
            >
              {isProcessing ? "계승 중..." : "계승 실행"}
            </button>
          </div>
        </div>
      </div>

      {/* 배경 클릭으로 닫기 */}
      <div className="absolute inset-0 -z-10" onClick={handleClose} />
    </div>
  );
}

export default InheritanceModal;
