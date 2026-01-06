"use client";

import { useState, useEffect } from "react";
import { Item, ItemGrade, ItemType } from "../types/game";
import { ITEM_TYPE_NAMES } from "../constants/game";

/**
 * ItemDropNotification 컴포넌트
 * 잠수 중 아이템 드랍 시 우상단에 표시되는 토스트 알림
 * Requirements: 3.9, 9.4
 */

interface ItemDropNotificationProps {
  item: Item | null;
  isVisible: boolean;
  onClose: () => void;
  autoCloseDelay?: number; // 자동 닫기 지연 시간 (ms)
}

// 아이템 등급별 색상 스타일
const GRADE_STYLES = {
  [ItemGrade.COMMON]: {
    bg: "hero-card",
    border: "border-gray-300",
    text: "hero-text-secondary",
    accent: "bg-gray-400",
    glow: "shadow-gray-200",
  },
  [ItemGrade.RARE]: {
    bg: "hero-card-blue",
    border: "border-blue-300",
    text: "hero-text-blue",
    accent: "bg-blue-400",
    glow: "shadow-blue-200",
  },
  [ItemGrade.EPIC]: {
    bg: "hero-card-purple",
    border: "border-purple-300",
    text: "hero-text-purple",
    accent: "bg-purple-400",
    glow: "shadow-purple-200",
  },
  [ItemGrade.LEGENDARY]: {
    bg: "hero-card-accent",
    border: "border-yellow-300",
    text: "hero-text-accent",
    accent: "bg-yellow-400",
    glow: "hero-glow",
  },
  [ItemGrade.MYTHIC]: {
    bg: "hero-card-red",
    border: "border-red-300",
    text: "hero-text-red",
    accent: "bg-red-400",
    glow: "hero-glow-red",
  },
};

// 등급 한글 이름
const GRADE_NAMES = {
  [ItemGrade.COMMON]: "일반",
  [ItemGrade.RARE]: "희귀",
  [ItemGrade.EPIC]: "영웅",
  [ItemGrade.LEGENDARY]: "전설",
  [ItemGrade.MYTHIC]: "신화",
};

export function ItemDropNotification({
  item,
  isVisible,
  onClose,
  autoCloseDelay = 4000, // 기본 4초 후 자동 닫기
}: ItemDropNotificationProps) {
  const [showNotification, setShowNotification] = useState(false);
  const [progress, setProgress] = useState(100);

  // 알림 표시/숨김 애니메이션 처리
  useEffect(() => {
    if (isVisible && item) {
      setShowNotification(true);
      setProgress(100);
    } else {
      setShowNotification(false);
    }
  }, [isVisible, item]);

  // 자동 닫기 타이머 및 진행률 바 애니메이션
  useEffect(() => {
    if (showNotification && autoCloseDelay > 0) {
      const startTime = Date.now();

      // 진행률 바 애니메이션
      const progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, autoCloseDelay - elapsed);
        const progressPercent = (remaining / autoCloseDelay) * 100;

        setProgress(progressPercent);

        if (remaining <= 0) {
          clearInterval(progressInterval);
          handleClose();
        }
      }, 50); // 50ms마다 업데이트 (부드러운 애니메이션)

      return () => clearInterval(progressInterval);
    }
  }, [showNotification, autoCloseDelay]);

  const handleClose = () => {
    setShowNotification(false);
    setTimeout(() => {
      onClose();
    }, 300); // 애니메이션 완료 후 콜백 호출
  };

  if (!item || !isVisible) {
    return null;
  }

  const style = GRADE_STYLES[item.grade];

  return (
    <div className="fixed top-4 right-4 z-50 pointer-events-none">
      <div
        className={`
          pointer-events-auto transform transition-all duration-300 ease-out
          ${
            showNotification
              ? "translate-x-0 opacity-100 scale-100"
              : "translate-x-full opacity-0 scale-95"
          }
        `}
      >
        <div
          className={`
            relative overflow-hidden rounded-lg border-2 shadow-lg max-w-sm
            ${style.bg} ${style.border} ${style.glow}
          `}
        >
          {/* 진행률 바 */}
          <div className="absolute top-0 left-0 h-1 bg-gray-200 w-full">
            <div
              className={`h-full transition-all duration-75 ease-linear ${style.accent}`}
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* 알림 내용 */}
          <div className="p-4 pt-5">
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="text-lg">🎁</div>
                <h3 className="text-sm font-semibold hero-text-primary">
                  아이템 획득!
                </h3>
              </div>
              <button
                onClick={handleClose}
                className="hero-text-muted hover:hero-text-primary transition-colors text-lg leading-none"
                aria-label="알림 닫기"
              >
                ×
              </button>
            </div>

            {/* 아이템 정보 */}
            <div className="space-y-2">
              {/* 아이템 이름과 등급 */}
              <div className="flex items-center space-x-2">
                <span
                  className={`
                    px-2 py-1 rounded text-xs font-medium border
                    ${style.bg} ${style.border} ${style.text}
                  `}
                >
                  {GRADE_NAMES[item.grade]}
                </span>
                <span className="text-sm font-medium hero-text-primary">
                  {ITEM_TYPE_NAMES[item.type]}
                </span>
                <span className="text-xs hero-text-muted">Lv.{item.level}</span>
              </div>

              {/* 스탯 정보 */}
              <div className="text-xs hero-text-secondary space-y-1">
                <div className="hero-text-muted mb-1">잠수 중 드랍</div>
                <div className="flex flex-wrap gap-3">
                  {item.enhancedStats.attack > 0 && (
                    <span className="flex items-center space-x-1">
                      <span className="hero-text-red">⚔</span>
                      <span>+{item.enhancedStats.attack}</span>
                    </span>
                  )}
                  {item.enhancedStats.defense > 0 && (
                    <span className="flex items-center space-x-1">
                      <span className="hero-text-blue">🛡</span>
                      <span>+{item.enhancedStats.defense}</span>
                    </span>
                  )}
                  {item.enhancedStats.defensePenetration > 0 && (
                    <span className="flex items-center space-x-1">
                      <span className="hero-text-purple">💎</span>
                      <span>+{item.enhancedStats.defensePenetration}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 등급별 특수 효과 */}
          {item.grade === ItemGrade.LEGENDARY && (
            <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 rounded-lg opacity-30 animate-pulse -z-10" />
          )}
          {item.grade === ItemGrade.EPIC && (
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-400 to-purple-300 rounded-lg opacity-20 animate-pulse -z-10" />
          )}
        </div>
      </div>
    </div>
  );
}

export default ItemDropNotification;
