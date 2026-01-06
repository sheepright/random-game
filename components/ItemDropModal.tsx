"use client";

import { useState, useEffect } from "react";
import { Item, ItemGrade, ItemType } from "../types/game";
import { ITEM_TYPE_NAMES, GRADE_NAMES } from "../constants/game";
import ResponsiveItemImage from "./ResponsiveItemImage";

/**
 * ItemDropModal 컴포넌트
 * 드랍된 아이템을 시각적으로 표시하고 등급별 색상 구분 및 애니메이션 효과 제공
 * Requirements: 3.7, 9.4
 */

interface ItemDropModalProps {
  droppedItems: Item[];
  isVisible: boolean;
  onClose: () => void;
  onCollectAll: () => void;
  dropSource: "stage_clear"; // 스테이지 클리어 시에만 사용
  stageNumber?: number; // 클리어한 스테이지 번호
  creditReward?: number; // 스테이지 클리어 크레딧 보상
}

// 아이템 등급별 색상 및 스타일
const GRADE_STYLES = {
  [ItemGrade.COMMON]: {
    bg: "hero-card",
    border: "border-gray-400",
    text: "hero-text-secondary",
    glow: "shadow-gray-400/50",
    particle: "bg-gray-300",
  },
  [ItemGrade.RARE]: {
    bg: "hero-card-blue",
    border: "border-blue-400",
    text: "hero-text-blue",
    glow: "shadow-blue-400/50",
    particle: "bg-blue-300",
  },
  [ItemGrade.EPIC]: {
    bg: "hero-card-purple",
    border: "border-purple-400",
    text: "hero-text-purple",
    glow: "shadow-purple-400/50",
    particle: "bg-purple-300",
  },
  [ItemGrade.LEGENDARY]: {
    bg: "hero-card-accent",
    border: "border-yellow-400",
    text: "hero-text-accent",
    glow: "hero-glow",
    particle: "bg-yellow-300",
  },
  [ItemGrade.MYTHIC]: {
    bg: "hero-card-red",
    border: "border-red-400",
    text: "hero-text-red",
    glow: "hero-glow-red",
    particle: "bg-red-300",
  },
};

// 아이템 타입 한글 이름 (constants에서 가져옴)
// 등급 한글 이름 (constants에서 가져옴)

interface ItemCardProps {
  item: Item;
  index: number;
  onCollect: (item: Item) => void;
}

function ItemCard({ item, index, onCollect }: ItemCardProps) {
  const [isAnimating, setIsAnimating] = useState(true);
  const [showParticles, setShowParticles] = useState(false);
  const style = GRADE_STYLES[item.grade];

  useEffect(() => {
    // 아이템별로 지연된 애니메이션 시작
    const timer = setTimeout(() => {
      setIsAnimating(false);
      setShowParticles(true);
    }, index * 200);

    return () => clearTimeout(timer);
  }, [index]);

  useEffect(() => {
    // 파티클 효과 자동 종료
    if (showParticles) {
      const timer = setTimeout(() => {
        setShowParticles(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showParticles]);

  return (
    <div className="relative">
      {/* 파티클 효과 */}
      {showParticles && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className={`absolute w-2 h-2 rounded-full ${style.particle} animate-ping`}
              style={{
                left: `${20 + Math.random() * 60}%`,
                top: `${20 + Math.random() * 60}%`,
                animationDelay: `${Math.random() * 1000}ms`,
                animationDuration: `${1000 + Math.random() * 1000}ms`,
              }}
            />
          ))}
        </div>
      )}

      {/* 아이템 카드 */}
      <div
        className={`
          relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-500
          ${style.bg} ${style.border} ${style.glow}
          ${
            isAnimating
              ? "scale-0 rotate-180 opacity-0"
              : "scale-100 rotate-0 opacity-100"
          }
          hover:scale-105 hover:shadow-lg
        `}
        onClick={() => onCollect(item)}
      >
        {/* 등급 표시 */}
        <div className={`text-center mb-3 ${style.text}`}>
          <div className="text-xs font-bold uppercase tracking-wider">
            {GRADE_NAMES[item.grade]}
          </div>
        </div>

        {/* 아이템 이미지 */}
        <div className="flex justify-center mb-3">
          <ResponsiveItemImage
            item={item}
            size="xlarge"
            priority={true}
            loading="eager"
            className="drop-shadow-lg"
          />
        </div>

        {/* 아이템 정보 */}
        <div className="text-center space-y-1">
          <div className={`font-semibold hero-text-primary`}>
            {ITEM_TYPE_NAMES[item.type]}
          </div>
          <div className="text-sm hero-text-secondary">레벨 {item.level}</div>
        </div>

        {/* 스탯 정보 */}
        <div className="mt-3 space-y-1 text-xs hero-text-secondary">
          {item.enhancedStats.attack > 0 && (
            <div className="flex justify-between">
              <span>공격력:</span>
              <span className="font-semibold hero-text-primary">
                {item.enhancedStats.attack}
              </span>
            </div>
          )}
          {item.enhancedStats.defense > 0 && (
            <div className="flex justify-between">
              <span>방어력:</span>
              <span className="font-semibold hero-text-primary">
                {item.enhancedStats.defense}
              </span>
            </div>
          )}
          {item.enhancedStats.defensePenetration > 0 && (
            <div className="flex justify-between">
              <span>방어력 무시:</span>
              <span className="font-semibold hero-text-primary">
                {item.enhancedStats.defensePenetration}
              </span>
            </div>
          )}
          {item.enhancedStats.additionalAttackChance > 0 && (
            <div className="flex justify-between">
              <span>추가타격:</span>
              <span className="font-semibold hero-text-primary">
                {(item.enhancedStats.additionalAttackChance * 100).toFixed(1)}%
              </span>
            </div>
          )}
        </div>

        {/* 등급별 특수 효과 */}
        {item.grade === ItemGrade.LEGENDARY && (
          <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 rounded-lg opacity-75 animate-pulse -z-10" />
        )}
        {item.grade === ItemGrade.EPIC && (
          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-400 to-purple-300 rounded-lg opacity-50 animate-pulse -z-10" />
        )}
      </div>
    </div>
  );
}

export function ItemDropModal({
  droppedItems,
  isVisible,
  onClose,
  onCollectAll,
  dropSource,
  stageNumber = 1,
  creditReward = 0,
}: ItemDropModalProps) {
  const [collectedItems, setCollectedItems] = useState<Set<string>>(new Set());
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShowModal(true);
      setCollectedItems(new Set());
    }
  }, [isVisible]);

  const handleCollectItem = (item: Item) => {
    setCollectedItems((prev) => new Set([...prev, item.id]));
  };

  const handleCollectAll = () => {
    droppedItems.forEach((item) => {
      setCollectedItems((prev) => new Set([...prev, item.id]));
    });

    setTimeout(() => {
      onCollectAll();
      handleClose();
    }, 500);
  };

  const handleClose = () => {
    setShowModal(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const remainingItems = droppedItems.filter(
    (item) => !collectedItems.has(item.id)
  );

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className={`
          hero-card rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden
          transition-all duration-300 transform
          ${showModal ? "scale-100 opacity-100" : "scale-95 opacity-0"}
        `}
      >
        {/* 헤더 - 스테이지 클리어 보상 강조 */}
        <div className="hero-card-green p-6 relative overflow-hidden">
          {/* 배경 장식 효과 */}
          <div className="absolute inset-0 hero-card-accent opacity-20 hero-pulse" />
          <div className="absolute top-0 left-0 w-full h-1 hero-card-accent hero-pulse" />

          <div className="relative flex justify-between items-center">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="text-3xl hero-float">🏆</div>
                <h2 className="text-2xl font-bold hero-text-primary">
                  스테이지 클리어!
                </h2>
              </div>
              <p className="hero-text-green text-lg font-medium">
                스테이지 {stageNumber} 클리어 보상
              </p>
              <div className="flex items-center space-x-4 mt-2">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">🎁</span>
                  <span className="hero-text-secondary">
                    아이템 {droppedItems.length}개
                  </span>
                </div>
                {creditReward > 0 && (
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">💰</span>
                    <span className="hero-text-accent font-bold">
                      +{creditReward.toLocaleString()} 크레딧
                    </span>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={handleClose}
              className="hero-text-primary hover:hero-text-secondary text-3xl font-bold transition-colors hero-card rounded-full w-10 h-10 flex items-center justify-center"
            >
              ×
            </button>
          </div>

          {/* 승리 효과 */}
          <div className="absolute -top-2 -right-2 hero-text-accent text-6xl opacity-30 hero-float">
            ✨
          </div>
          <div className="absolute -bottom-2 -left-2 hero-text-accent text-4xl opacity-40 hero-float">
            🎉
          </div>
        </div>

        {/* 아이템 목록 */}
        <div className="p-6 overflow-y-auto max-h-96">
          {droppedItems.length === 0 ? (
            <div className="text-center hero-text-muted py-8">
              드랍된 아이템이 없습니다.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {droppedItems.map((item, index) => (
                <div
                  key={item.id}
                  className={`
                    transition-all duration-500
                    ${
                      collectedItems.has(item.id)
                        ? "opacity-50 scale-95 pointer-events-none"
                        : ""
                    }
                  `}
                >
                  <ItemCard
                    item={item}
                    index={index}
                    onCollect={handleCollectItem}
                  />
                  {collectedItems.has(item.id) && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="hero-card-green hero-text-green rounded-full p-2 hero-float">
                        ✓
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 하단 버튼 - 스테이지 클리어 보상 강조 */}
        <div className="hero-card-green px-6 py-4 flex justify-between items-center border-t-2 border-green-200">
          <div className="text-sm">
            {remainingItems.length > 0 ? (
              <div className="flex items-center space-x-2">
                <span className="hero-text-green font-medium">
                  🎁 남은 보상: {remainingItems.length}개
                </span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <span className="hero-text-green font-medium">
                  ✅ 모든 보상을 수집했습니다!
                </span>
              </div>
            )}
            <div className="text-xs hero-text-muted mt-1">
              스테이지 {stageNumber} 클리어 보상
            </div>
          </div>
          <div className="space-x-3">
            <button onClick={handleClose} className="hero-btn hero-btn-primary">
              나중에
            </button>
            {remainingItems.length > 0 && (
              <button
                onClick={handleCollectAll}
                className="hero-btn hero-btn-success hero-glow"
              >
                🎁 모든 보상 수집
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 배경 클릭으로 닫기 */}
      <div className="absolute inset-0 -z-10" onClick={handleClose} />
    </div>
  );
}

export default ItemDropModal;
