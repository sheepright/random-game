"use client";

import { useState, useMemo, useEffect } from "react";
import { useGame } from "../contexts/GameContext";
import {
  Item,
  ItemStats,
  ItemType,
  EnhancementResult,
  EnhancementAttempt,
} from "../types/game";
import {
  getEnhancementInfo,
  canEnhanceItem,
  MAX_ENHANCEMENT_LEVEL,
  calculateTotalItemStats,
  ITEM_PRIMARY_STATS,
  SAFE_ENHANCEMENT_LEVELS,
  getMinimumSafeLevel,
  DESTRUCTION_PREVENTION_MIN_LEVEL,
  calculateDestructionPreventionCost,
} from "../utils/enhancementSystem";
import { ITEM_TYPE_NAMES, GRADE_NAMES, STAT_NAMES } from "../constants/game";
import ResponsiveItemImage from "./ResponsiveItemImage";
import ItemImage from "./ItemImage";

interface EnhancementModalProps {
  item: Item | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function EnhancementModal({
  item,
  isOpen,
  onClose,
}: EnhancementModalProps) {
  const { gameState, actions } = useGame();
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [lastEnhancementResult, setLastEnhancementResult] =
    useState<EnhancementAttempt | null>(null);
  const [useDestructionPrevention, setUseDestructionPrevention] =
    useState(false);

  // 모달이 열릴 때마다 이전 강화 결과 초기화
  useEffect(() => {
    if (isOpen) {
      setLastEnhancementResult(null);
      setUseDestructionPrevention(false);
      setIsEnhancing(false);
    }
  }, [isOpen, item?.id]); // item.id가 변경될 때도 초기화

  // 게임 상태에서 최신 아이템 정보를 가져옵니다 (항상 실행)
  const currentItem = useMemo(() => {
    if (!item) return null;

    // 장착된 아이템인지 확인
    const equippedItem = Object.values(gameState.equippedItems).find(
      (equippedItem) => equippedItem?.id === item.id
    );

    if (equippedItem) {
      // imagePath가 없으면 추가
      if (!equippedItem.imagePath) {
        const { getItemImagePath } = require("../constants/game");
        equippedItem.imagePath = getItemImagePath(equippedItem.type);
      }
      return equippedItem;
    }

    // 인벤토리에서 찾기
    const inventoryItem = gameState.inventory.find(
      (invItem) => invItem.id === item.id
    );

    if (inventoryItem) {
      // imagePath가 없으면 추가
      if (!inventoryItem.imagePath) {
        const { getItemImagePath } = require("../constants/game");
        inventoryItem.imagePath = getItemImagePath(inventoryItem.type);
      }
      return inventoryItem;
    }

    // 원본 아이템에 imagePath가 없으면 추가
    if (!item.imagePath) {
      const { getItemImagePath } = require("../constants/game");
      item.imagePath = getItemImagePath(item.type);
    }

    return item;
  }, [gameState.equippedItems, gameState.inventory, item]);

  // 조건부 렌더링은 Hooks 호출 후에
  if (!isOpen || !item || !currentItem) return null;

  // 디버깅을 위한 아이템 정보 출력
  console.log("강화 모달 아이템 정보:", {
    originalItem: item,
    currentItem: currentItem,
    imagePath: currentItem.imagePath,
    type: currentItem.type,
  });

  const isMaxLevel = currentItem.enhancementLevel >= MAX_ENHANCEMENT_LEVEL;
  const enhancementInfo = !isMaxLevel ? getEnhancementInfo(currentItem) : null;
  const totalStats = calculateTotalItemStats(currentItem);

  // 파괴된 아이템인지 확인 (추가 보안)
  const isItemDestroyed =
    lastEnhancementResult?.result === EnhancementResult.DESTRUCTION;

  // 안전 등급 정보
  const currentSafeLevel = getMinimumSafeLevel(currentItem.enhancementLevel);
  const nextSafeLevel = SAFE_ENHANCEMENT_LEVELS.find(
    (level) => level > currentItem.enhancementLevel
  );

  // 파괴방지 강화 정보
  const canUseDestructionPrevention =
    currentItem.enhancementLevel >= DESTRUCTION_PREVENTION_MIN_LEVEL;
  const destructionPreventionCost = canUseDestructionPrevention
    ? calculateDestructionPreventionCost(
        currentItem.enhancementLevel,
        currentItem.grade
      )
    : 0;
  const totalEnhancementCost = enhancementInfo
    ? enhancementInfo.cost +
      (useDestructionPrevention ? destructionPreventionCost : 0)
    : 0;

  const canEnhance =
    canEnhanceItem(currentItem, gameState.credits) &&
    (!useDestructionPrevention || gameState.credits >= totalEnhancementCost);

  // 아이템의 주요 스탯 정보
  const primaryStat = ITEM_PRIMARY_STATS[currentItem.type as ItemType];
  const primaryStatName = {
    attack: "공격력",
    defense: "방어력",
    defensePenetration: "방어율 무시",
    additionalAttackChance: "추가타격 확률",
    creditPerSecondBonus: "초당 크레딧 보너스",
    criticalDamageMultiplier: "크리티컬 데미지",
    criticalChance: "크리티컬 확률",
  }[primaryStat];

  // 효율성 계산 (비용 대비 스탯 증가량)
  const calculateEfficiency = () => {
    if (!enhancementInfo) return null;

    const statIncrease = enhancementInfo.statIncrease;
    const cost = enhancementInfo.cost;

    let primaryStatIncrease = 0;
    switch (primaryStat) {
      case "attack":
        primaryStatIncrease = statIncrease.attack;
        break;
      case "defense":
        primaryStatIncrease = statIncrease.defense;
        break;
      case "defensePenetration":
        primaryStatIncrease = statIncrease.defensePenetration;
        break;
      case "additionalAttackChance":
        primaryStatIncrease = statIncrease.additionalAttackChance * 100; // 퍼센트로 변환
        break;
      case "creditPerSecondBonus":
        primaryStatIncrease = statIncrease.creditPerSecondBonus;
        break;
      case "criticalDamageMultiplier":
        primaryStatIncrease = statIncrease.criticalDamageMultiplier * 100; // 퍼센트로 변환
        break;
      case "criticalChance":
        primaryStatIncrease = statIncrease.criticalChance * 100; // 퍼센트로 변환
        break;
    }

    return primaryStatIncrease > 0
      ? ((primaryStatIncrease / cost) * 1000).toFixed(2)
      : "0";
  };

  const efficiency = calculateEfficiency();

  // 레벨별 효율 정보
  const getEfficiencyLevel = (level: number) => {
    if (level <= 5) return { text: "매우 낮음", color: "hero-text-red" };
    if (level <= 11) return { text: "보통", color: "hero-text-accent" };
    return { text: "높음", color: "hero-text-green" };
  };

  const efficiencyLevel = enhancementInfo
    ? getEfficiencyLevel(enhancementInfo.newEnhancementLevel)
    : null;

  const handleEnhance = async () => {
    if (!canEnhance || isMaxLevel || !currentItem || isItemDestroyed) return;

    setIsEnhancing(true);
    setLastEnhancementResult(null);

    try {
      console.log("강화 시도:", currentItem);
      const result = actions.enhanceItem(currentItem, useDestructionPrevention);
      console.log("강화 결과:", result);
      setLastEnhancementResult(result);

      // 아이템이 파괴된 경우 즉시 모달 닫기
      if (result.result === EnhancementResult.DESTRUCTION) {
        onClose();
        return;
      }
    } catch (error) {
      console.error("Enhancement failed:", error);
      // 사용자에게 에러 메시지 표시
      alert(
        `강화에 실패했습니다: ${
          error instanceof Error ? error.message : "알 수 없는 오류"
        }`
      );
    } finally {
      setIsEnhancing(false);
    }
  };

  const getResultMessage = (result: EnhancementAttempt): string => {
    switch (result.result) {
      case EnhancementResult.SUCCESS:
        return `강화 성공! +${result.newLevel}강으로 업그레이드되었습니다.`;
      case EnhancementResult.FAILURE:
        // 안전 등급으로 인해 레벨이 유지된 경우 추가 메시지
        const safeLevel = getMinimumSafeLevel(result.previousLevel);
        if (result.previousLevel >= 11 && result.previousLevel > safeLevel) {
          return `강화 실패! 레벨은 유지됩니다. (안전 등급 +${safeLevel}강 보호)`;
        }
        return `강화 실패! 레벨은 유지됩니다.`;
      case EnhancementResult.DOWNGRADE:
        return `강화 실패! +${result.newLevel}강으로 하락했습니다.`;
      case EnhancementResult.DESTRUCTION:
        return `강화 실패! 아이템이 파괴되었습니다.`;
      default:
        return "알 수 없는 결과입니다.";
    }
  };

  const getResultColor = (result: EnhancementResult): string => {
    switch (result) {
      case EnhancementResult.SUCCESS:
        return "hero-text-green";
      case EnhancementResult.FAILURE:
        return "hero-text-accent";
      case EnhancementResult.DOWNGRADE:
        return "hero-text-red";
      case EnhancementResult.DESTRUCTION:
        return "hero-text-red";
      default:
        return "hero-text-secondary";
    }
  };

  const formatStatChange = (statChange: ItemStats): string => {
    const changes = [];

    // 주요 스탯만 표시
    switch (primaryStat) {
      case "attack":
        if (statChange.attack !== 0) {
          changes.push(
            `공격력 ${statChange.attack > 0 ? "+" : ""}${statChange.attack}`
          );
        }
        break;
      case "defense":
        if (statChange.defense !== 0) {
          changes.push(
            `방어력 ${statChange.defense > 0 ? "+" : ""}${statChange.defense}`
          );
        }
        break;
      case "defensePenetration":
        if (statChange.defensePenetration !== 0) {
          changes.push(
            `방어율 무시 ${statChange.defensePenetration > 0 ? "+" : ""}${
              statChange.defensePenetration
            }`
          );
        }
        break;
      case "additionalAttackChance":
        if (statChange.additionalAttackChance !== 0) {
          changes.push(
            `추가타격 확률 ${
              statChange.additionalAttackChance > 0 ? "+" : ""
            }${(statChange.additionalAttackChance * 100).toFixed(1)}%`
          );
        }
        break;
      case "creditPerSecondBonus":
        if (statChange.creditPerSecondBonus !== 0) {
          changes.push(
            `초당 크레딧 보너스 ${
              statChange.creditPerSecondBonus > 0 ? "+" : ""
            }${statChange.creditPerSecondBonus}`
          );
        }
        break;
      case "criticalDamageMultiplier":
        if (statChange.criticalDamageMultiplier !== 0) {
          changes.push(
            `크리티컬 데미지 ${
              statChange.criticalDamageMultiplier > 0 ? "+" : ""
            }${(statChange.criticalDamageMultiplier * 100).toFixed(1)}%`
          );
        }
        break;
      case "criticalChance":
        if (statChange.criticalChance !== 0) {
          changes.push(
            `크리티컬 확률 ${statChange.criticalChance > 0 ? "+" : ""}${(
              statChange.criticalChance * 100
            ).toFixed(1)}%`
          );
        }
        break;
    }

    return changes.length > 0 ? changes.join(", ") : "변화 없음";
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="hero-card rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold hero-text-primary">아이템 강화</h2>
          <button
            onClick={onClose}
            className="hero-text-muted hover:hero-text-primary text-xl"
          >
            ×
          </button>
        </div>

        {/* 아이템 정보 */}
        <div className="mb-6 hero-card-accent p-4 rounded-lg">
          <div className="flex items-center gap-4 mb-4">
            {/* 아이템 이미지 */}
            <div className="shrink-0">
              <div className="w-20 h-20 border-2 border-gray-300 rounded-lg flex items-center justify-center bg-transparent">
                {currentItem.imagePath ? (
                  <img
                    src={currentItem.imagePath}
                    alt={`${currentItem.type} 아이템`}
                    className="w-16 h-16 object-contain"
                    onError={(e) => {
                      console.error("강화 모달 이미지 로딩 실패:", {
                        imagePath: currentItem.imagePath,
                        type: currentItem.type,
                        id: currentItem.id,
                      });
                      const target = e.target as HTMLImageElement;
                      target.src = "/Items/default.png";
                    }}
                    onLoad={() => {
                      console.log(
                        "강화 모달 이미지 로딩 성공:",
                        currentItem.imagePath
                      );
                    }}
                  />
                ) : (
                  <div className="text-center">
                    <div className="text-xs text-red-500">이미지 없음</div>
                    <div className="text-xs text-gray-500">
                      {currentItem.type}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 아이템 기본 정보 */}
            <div className="flex-1">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold hero-text-primary">
                  {
                    ITEM_TYPE_NAMES[
                      currentItem.type as keyof typeof ITEM_TYPE_NAMES
                    ]
                  }{" "}
                  +{currentItem.enhancementLevel}
                </h3>
                <span
                  className={`px-2 py-1 rounded text-sm font-medium ${
                    currentItem.grade === "legendary"
                      ? "hero-card-accent hero-text-accent"
                      : currentItem.grade === "epic"
                      ? "hero-card-purple hero-text-purple"
                      : currentItem.grade === "rare"
                      ? "hero-card-blue hero-text-blue"
                      : "hero-card hero-text-secondary"
                  }`}
                >
                  {GRADE_NAMES[currentItem.grade as keyof typeof GRADE_NAMES]}
                </span>
              </div>

              {/* 강화 진행률 */}
              <div className="mb-2">
                <div className="flex justify-between text-sm hero-text-secondary mb-1">
                  <span>강화 레벨</span>
                  <span>
                    {currentItem.enhancementLevel} / {MAX_ENHANCEMENT_LEVEL}
                  </span>
                </div>
                <div className="w-full bg-gray-300 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${
                        (currentItem.enhancementLevel / MAX_ENHANCEMENT_LEVEL) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 현재 스탯 (주요 스탯만 표시) */}
          <div className="space-y-1 text-sm hero-text-secondary">
            <div className="text-xs hero-text-muted mb-2">
              주요 능력치: {primaryStatName}
            </div>
            {primaryStat === "attack" && (
              <div className="flex justify-between">
                <span>공격력:</span>
                <span className="hero-text-primary font-medium">
                  {totalStats.attack}
                </span>
              </div>
            )}
            {primaryStat === "defense" && (
              <div className="flex justify-between">
                <span>방어력:</span>
                <span className="hero-text-primary font-medium">
                  {totalStats.defense}
                </span>
              </div>
            )}
            {primaryStat === "defensePenetration" && (
              <div className="flex justify-between">
                <span>방어율 무시:</span>
                <span className="hero-text-primary font-medium">
                  {totalStats.defensePenetration}
                </span>
              </div>
            )}
            {primaryStat === "additionalAttackChance" && (
              <div className="flex justify-between">
                <span>추가타격 확률:</span>
                <span className="hero-text-primary font-medium">
                  {(totalStats.additionalAttackChance * 100).toFixed(1)}%
                </span>
              </div>
            )}
            {primaryStat === "creditPerSecondBonus" && (
              <div className="flex justify-between">
                <span>초당 크레딧 보너스:</span>
                <span className="hero-text-primary font-medium">
                  {totalStats.creditPerSecondBonus}
                </span>
              </div>
            )}
            {primaryStat === "criticalDamageMultiplier" && (
              <div className="flex justify-between">
                <span>크리티컬 데미지:</span>
                <span className="hero-text-primary font-medium">
                  {(totalStats.criticalDamageMultiplier * 100).toFixed(1)}%
                </span>
              </div>
            )}
            {primaryStat === "criticalChance" && (
              <div className="flex justify-between">
                <span>크리티컬 확률:</span>
                <span className="hero-text-primary font-medium">
                  {(totalStats.criticalChance * 100).toFixed(1)}%
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 강화 정보 */}
        {!isMaxLevel && enhancementInfo && (
          <div className="mb-6 hero-card-blue p-4 rounded-lg">
            <h4 className="font-semibold mb-2 hero-text-blue">강화 미리보기</h4>
            <div className="space-y-2 text-sm hero-text-secondary">
              <div className="flex justify-between">
                <span>강화 레벨:</span>
                <span className="hero-text-primary">
                  +{currentItem.enhancementLevel} → +
                  {enhancementInfo.newEnhancementLevel}
                </span>
              </div>
              <div className="flex justify-between">
                <span>비용:</span>
                <span className="font-medium hero-text-primary">
                  {useDestructionPrevention
                    ? `${totalEnhancementCost.toLocaleString()} 크레딧 (파괴방지 포함)`
                    : `${enhancementInfo.cost.toLocaleString()} 크레딧`}
                </span>
              </div>
              <div className="flex justify-between">
                <span>성공률:</span>
                <span
                  className={`font-medium ${
                    enhancementInfo.successRate >= 0.8
                      ? "hero-text-green"
                      : enhancementInfo.successRate >= 0.5
                      ? "hero-text-accent"
                      : "hero-text-red"
                  }`}
                >
                  {(enhancementInfo.successRate * 100).toFixed(1)}%
                </span>
              </div>

              {/* 파괴 확률 표시 (18강 이상) */}
              {enhancementInfo.destructionRate &&
                enhancementInfo.destructionRate > 0 && (
                  <div className="flex justify-between">
                    <span>파괴 확률:</span>
                    <span
                      className={`font-medium ${
                        useDestructionPrevention
                          ? "hero-text-green"
                          : "hero-text-red"
                      }`}
                    >
                      {useDestructionPrevention
                        ? "0% (파괴방지)"
                        : `${(enhancementInfo.destructionRate * 100).toFixed(
                            1
                          )}%`}
                    </span>
                  </div>
                )}

              {/* 안전 등급 정보 */}
              {currentSafeLevel > 0 && (
                <div className="flex justify-between">
                  <span>현재 안전 등급:</span>
                  <span className="font-medium hero-text-green">
                    +{currentSafeLevel}강 보장
                  </span>
                </div>
              )}
              {nextSafeLevel && (
                <div className="flex justify-between">
                  <span>다음 안전 등급:</span>
                  <span className="font-medium hero-text-blue">
                    +{nextSafeLevel}강 (
                    {nextSafeLevel - currentItem.enhancementLevel}단계 남음)
                  </span>
                </div>
              )}

              {/* 파괴방지 강화 옵션 */}
              {canUseDestructionPrevention && (
                <div className="pt-2 border-t border-gray-300">
                  <div className="hero-card-accent rounded p-3 mb-2">
                    <div className="flex items-center justify-between mb-2">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={useDestructionPrevention}
                          onChange={(e) =>
                            setUseDestructionPrevention(e.target.checked)
                          }
                          className="mr-2"
                        />
                        <span className="text-sm font-medium hero-text-accent">
                          파괴방지 강화 사용
                        </span>
                      </label>
                      <span className="text-xs hero-text-secondary">
                        (20강 이상 사용 가능)
                      </span>
                    </div>

                    {/* 파괴방지 정보 표시 */}
                    <div className="space-y-1 text-xs hero-text-secondary mb-2">
                      <div className="flex justify-between">
                        <span>기본 비용:</span>
                        <span className="font-medium hero-text-primary">
                          {enhancementInfo?.cost.toLocaleString() || 0} 크레딧
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>파괴방지 추가 비용:</span>
                        <span className="font-medium hero-text-red">
                          +{destructionPreventionCost.toLocaleString()} 크레딧
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-gray-200 pt-1">
                        <span className="font-medium">총 비용:</span>
                        <span className="font-bold hero-text-primary">
                          {totalEnhancementCost.toLocaleString()} 크레딧
                        </span>
                      </div>
                    </div>

                    {/* 파괴방지 효과 설명 */}
                    <div className="hero-card-blue rounded p-2 text-xs border border-blue-300">
                      <div className="hero-text-blue font-medium mb-1">
                        🛡️ 파괴방지 효과:
                      </div>
                      <div className="hero-text-secondary space-y-1">
                        <div>• 파괴 확률 0% (완전 보호)</div>
                        <div>• 성공/실패 확률은 동일</div>
                        <div>• 실패 시 레벨 하락은 여전히 발생</div>
                        {enhancementInfo?.destructionRate &&
                          enhancementInfo.destructionRate > 0 && (
                            <div className="hero-text-red">
                              • 원래 파괴 확률:{" "}
                              {(enhancementInfo.destructionRate * 100).toFixed(
                                1
                              )}
                              %
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 효율성 정보 */}
              {efficiency && efficiencyLevel && (
                <>
                  <div className="flex justify-between">
                    <span>강화 효율:</span>
                    <span className={`font-medium ${efficiencyLevel.color}`}>
                      {efficiencyLevel.text}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>비용 대비 효율:</span>
                    <span className="hero-text-primary text-xs">
                      {efficiency} {primaryStatName}/1000크레딧
                    </span>
                  </div>
                </>
              )}

              {/* 성공 시 스탯 증가 (고유 스탯만) */}
              <div className="pt-2 border-t border-gray-300">
                <div className="hero-text-green font-medium mb-1">
                  성공 시 {primaryStatName} 증가:
                </div>
                <div className="text-xs space-y-1 hero-text-secondary">
                  {primaryStat === "attack" &&
                    enhancementInfo.statIncrease.attack > 0 && (
                      <div className="hero-text-green font-medium">
                        공격력 +{enhancementInfo.statIncrease.attack}
                      </div>
                    )}
                  {primaryStat === "defense" &&
                    enhancementInfo.statIncrease.defense > 0 && (
                      <div className="hero-text-green font-medium">
                        방어력 +{enhancementInfo.statIncrease.defense}
                      </div>
                    )}
                  {primaryStat === "defensePenetration" &&
                    enhancementInfo.statIncrease.defensePenetration > 0 && (
                      <div className="hero-text-green font-medium">
                        방어율 무시 +
                        {enhancementInfo.statIncrease.defensePenetration}
                      </div>
                    )}
                  {primaryStat === "additionalAttackChance" &&
                    enhancementInfo.statIncrease.additionalAttackChance > 0 && (
                      <div className="hero-text-green font-medium">
                        추가타격 확률 +
                        {(
                          enhancementInfo.statIncrease.additionalAttackChance *
                          100
                        ).toFixed(1)}
                        %
                      </div>
                    )}
                  {primaryStat === "creditPerSecondBonus" &&
                    enhancementInfo.statIncrease.creditPerSecondBonus > 0 && (
                      <div className="hero-text-green font-medium">
                        초당 크레딧 보너스 +
                        {enhancementInfo.statIncrease.creditPerSecondBonus}
                      </div>
                    )}
                  {primaryStat === "criticalDamageMultiplier" &&
                    enhancementInfo.statIncrease.criticalDamageMultiplier >
                      0 && (
                      <div className="hero-text-green font-medium">
                        크리티컬 데미지 +
                        {(
                          enhancementInfo.statIncrease
                            .criticalDamageMultiplier * 100
                        ).toFixed(1)}
                        %
                      </div>
                    )}
                  {primaryStat === "criticalChance" &&
                    enhancementInfo.statIncrease.criticalChance > 0 && (
                      <div className="hero-text-green font-medium">
                        크리티컬 확률 +
                        {(
                          enhancementInfo.statIncrease.criticalChance * 100
                        ).toFixed(1)}
                        %
                      </div>
                    )}
                </div>
              </div>

              {/* 실패 시 경고 (11강 이상, 안전 등급 고려) */}
              {currentItem.enhancementLevel >= 11 && (
                <div className="pt-2 border-t border-gray-300">
                  <div className="hero-text-red font-medium text-xs">
                    ⚠️ 실패 시 강화 레벨이 1 감소합니다!
                    {currentSafeLevel > 0 && (
                      <div className="hero-text-green text-xs mt-1">
                        (단, +{currentSafeLevel}강 아래로는 하락하지 않음)
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 파괴 경고 (18강 이상) */}
              {enhancementInfo.destructionRate &&
                enhancementInfo.destructionRate > 0 && (
                  <div className="pt-2 border-t border-gray-300">
                    <div className="hero-text-red font-bold text-xs">
                      💀 파괴 시 아이템이 완전히 사라집니다!
                    </div>
                  </div>
                )}
            </div>
          </div>
        )}

        {/* 최대 레벨 메시지 */}
        {isMaxLevel && (
          <div className="mb-6 hero-card-accent p-4 rounded-lg">
            <div className="hero-text-accent font-medium">
              이미 최대 강화 레벨에 도달했습니다. (+{MAX_ENHANCEMENT_LEVEL})
            </div>
          </div>
        )}

        {/* 강화 결과 */}
        {lastEnhancementResult && (
          <div className="mb-6 hero-card p-4 rounded-lg">
            <h4 className="font-semibold mb-2 hero-text-primary">강화 결과</h4>
            <div
              className={`font-medium mb-2 ${getResultColor(
                lastEnhancementResult.result
              )}`}
            >
              {getResultMessage(lastEnhancementResult)}
            </div>
            <div className="text-sm space-y-1 hero-text-secondary">
              <div>
                비용: {lastEnhancementResult.costPaid.toLocaleString()} 크레딧
              </div>
              {lastEnhancementResult.result !==
                EnhancementResult.DESTRUCTION && (
                <div>
                  {primaryStatName} 변화:{" "}
                  {formatStatChange(lastEnhancementResult.statChange)}
                </div>
              )}
              {lastEnhancementResult.result ===
                EnhancementResult.DESTRUCTION && (
                <div className="hero-text-red font-medium">
                  아이템이 완전히 파괴되었습니다.
                </div>
              )}
            </div>
          </div>
        )}

        {/* 현재 크레딧 */}
        <div className="mb-6 text-center">
          <div className="text-sm hero-text-secondary">보유 크레딧</div>
          <div className="text-lg font-bold hero-text-primary">
            {gameState.credits.toLocaleString()}
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="hero-btn hero-btn-primary flex-1"
          >
            닫기
          </button>
          {!isMaxLevel && !isItemDestroyed && (
            <button
              onClick={handleEnhance}
              disabled={!canEnhance || isEnhancing}
              className={
                canEnhance && !isEnhancing
                  ? "hero-btn hero-btn-success flex-1"
                  : "hero-btn hero-btn-disabled flex-1"
              }
            >
              {isEnhancing
                ? "강화 중..."
                : useDestructionPrevention
                ? "파괴방지 강화하기"
                : "강화하기"}
            </button>
          )}
        </div>

        {/* 크레딧 부족 경고 */}
        {!isMaxLevel &&
          !isItemDestroyed &&
          enhancementInfo &&
          gameState.credits < totalEnhancementCost && (
            <div className="mt-3 text-center text-sm hero-text-red">
              크레딧이 부족합니다. ({totalEnhancementCost.toLocaleString()}{" "}
              필요)
              {useDestructionPrevention && (
                <div className="text-xs mt-1">
                  (파괴방지 비용 {destructionPreventionCost.toLocaleString()}{" "}
                  포함)
                </div>
              )}
            </div>
          )}

        {/* 아이템 파괴 메시지 */}
        {isItemDestroyed && (
          <div className="mt-3 text-center text-sm hero-text-red font-bold">
            아이템이 파괴되어 더 이상 강화할 수 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
