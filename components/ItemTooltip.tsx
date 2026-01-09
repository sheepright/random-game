/**
 * ItemTooltip Component
 * 아이템에 마우스를 올렸을 때 상세 정보를 표시하는 툴팁
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { Item, ItemGrade } from "../types/game";
import { GRADE_NAMES, ITEM_TYPE_NAMES, STAT_NAMES } from "../constants/game";

interface ItemTooltipProps {
  item: Item;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right" | "auto";
  delay?: number;
}

export function ItemTooltip({
  item,
  children,
  position = "auto",
  delay = 500,
}: ItemTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [actualPosition, setActualPosition] = useState<string>("top");
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 등급별 색상 스타일
  const getGradeStyles = (grade: ItemGrade) => {
    switch (grade) {
      case ItemGrade.MYTHIC:
        return {
          bg: "bg-gradient-to-r from-red-600 to-red-800",
          text: "text-red-100",
          border: "border-red-400",
          glow: "shadow-red-400/50",
        };
      case ItemGrade.LEGENDARY:
        return {
          bg: "bg-gradient-to-r from-yellow-600 to-yellow-800",
          text: "text-yellow-100",
          border: "border-yellow-400",
          glow: "shadow-yellow-400/50",
        };
      case ItemGrade.EPIC:
        return {
          bg: "bg-gradient-to-r from-purple-600 to-purple-800",
          text: "text-purple-100",
          border: "border-purple-400",
          glow: "shadow-purple-400/50",
        };
      case ItemGrade.RARE:
        return {
          bg: "bg-gradient-to-r from-blue-600 to-blue-800",
          text: "text-blue-100",
          border: "border-blue-400",
          glow: "shadow-blue-400/50",
        };
      default:
        return {
          bg: "bg-gradient-to-r from-gray-600 to-gray-800",
          text: "text-gray-100",
          border: "border-gray-400",
          glow: "shadow-gray-400/50",
        };
    }
  };

  const calculatePosition = () => {
    if (!containerRef.current || !tooltipRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let x = 0;
    let y = 0;
    let finalPosition = position;

    if (position === "auto") {
      // 자동 위치 계산
      const spaceTop = containerRect.top;
      const spaceBottom = viewportHeight - containerRect.bottom;
      const spaceLeft = containerRect.left;
      const spaceRight = viewportWidth - containerRect.right;

      if (spaceTop >= tooltipRect.height + 10) {
        finalPosition = "top";
      } else if (spaceBottom >= tooltipRect.height + 10) {
        finalPosition = "bottom";
      } else if (spaceRight >= tooltipRect.width + 10) {
        finalPosition = "right";
      } else if (spaceLeft >= tooltipRect.width + 10) {
        finalPosition = "left";
      } else {
        finalPosition = "top"; // 기본값
      }
    }

    switch (finalPosition) {
      case "top":
        x =
          containerRect.left + containerRect.width / 2 - tooltipRect.width / 2;
        y = containerRect.top - tooltipRect.height - 10;
        break;
      case "bottom":
        x =
          containerRect.left + containerRect.width / 2 - tooltipRect.width / 2;
        y = containerRect.bottom + 10;
        break;
      case "left":
        x = containerRect.left - tooltipRect.width - 10;
        y =
          containerRect.top + containerRect.height / 2 - tooltipRect.height / 2;
        break;
      case "right":
        x = containerRect.right + 10;
        y =
          containerRect.top + containerRect.height / 2 - tooltipRect.height / 2;
        break;
    }

    // 화면 경계 조정
    x = Math.max(10, Math.min(x, viewportWidth - tooltipRect.width - 10));
    y = Math.max(10, Math.min(y, viewportHeight - tooltipRect.height - 10));

    setTooltipPosition({ x, y });
    setActualPosition(finalPosition);
  };

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    if (isVisible) {
      calculatePosition();
    }
  }, [isVisible]);

  useEffect(() => {
    const handleResize = () => {
      if (isVisible) {
        calculatePosition();
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isVisible]);

  const gradeStyles = getGradeStyles(item.grade);

  // 스탯 필터링 (0이 아닌 스탯만 표시)
  const nonZeroStats = Object.entries(item.enhancedStats).filter(
    ([_, value]) => value > 0
  );

  return (
    <>
      <div
        ref={containerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="inline-block"
      >
        {children}
      </div>

      {isVisible && (
        <div
          ref={tooltipRef}
          className="fixed z-50 pointer-events-none"
          style={{
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
          }}
        >
          <div
            className={`${gradeStyles.bg} ${gradeStyles.border} border-2 rounded-lg shadow-2xl ${gradeStyles.glow} w-72 max-w-[280px]`}
          >
            {/* 헤더 */}
            <div className="p-3 border-b border-white/20">
              <div
                className={`font-bold text-base ${gradeStyles.text} truncate`}
              >
                {ITEM_TYPE_NAMES[item.type]}
              </div>
              <div className={`text-sm ${gradeStyles.text} opacity-90`}>
                {GRADE_NAMES[item.grade]} 등급
              </div>
              {item.enhancementLevel > 0 && (
                <div className={`text-sm ${gradeStyles.text} opacity-90`}>
                  강화 +{item.enhancementLevel}
                </div>
              )}
            </div>

            {/* 스탯 정보 */}
            <div className="p-3">
              <div className={`text-sm font-semibold ${gradeStyles.text} mb-2`}>
                아이템 스탯
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {nonZeroStats.map(([statKey, value]) => {
                  const statName =
                    STAT_NAMES[statKey as keyof typeof STAT_NAMES];
                  let displayValue: string;

                  // 스탯 타입에 따른 표시 형식
                  if (
                    statKey === "additionalAttackChance" ||
                    statKey === "criticalChance"
                  ) {
                    displayValue = `${(value * 100).toFixed(1)}%`;
                  } else if (statKey === "criticalDamageMultiplier") {
                    displayValue = `${(value * 100).toFixed(1)}%`;
                  } else {
                    displayValue = `+${value}`;
                  }

                  return (
                    <div key={statKey} className="flex justify-between text-sm">
                      <span
                        className={`${gradeStyles.text} opacity-80 truncate flex-1 mr-2`}
                      >
                        {statName}:
                      </span>
                      <span
                        className={`${gradeStyles.text} font-medium flex-shrink-0`}
                      >
                        {displayValue}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* 아이템 레벨 */}
              <div className="mt-3 pt-2 border-t border-white/20">
                <div className="flex justify-between text-sm">
                  <span className={`${gradeStyles.text} opacity-80`}>
                    아이템 레벨:
                  </span>
                  <span className={`${gradeStyles.text} font-medium`}>
                    {item.level}
                  </span>
                </div>
              </div>

              {/* 도움말 */}
              <div className="mt-2 pt-2 border-t border-white/20">
                <div
                  className={`text-xs ${gradeStyles.text} opacity-60 text-center`}
                >
                  더블클릭으로 장비 해제
                </div>
              </div>
            </div>

            {/* 화살표 */}
            <div
              className={`absolute w-3 h-3 ${gradeStyles.bg} ${
                gradeStyles.border
              } border-2 transform rotate-45 ${
                actualPosition === "top"
                  ? "bottom-[-8px] left-1/2 -translate-x-1/2 border-t-0 border-l-0"
                  : actualPosition === "bottom"
                  ? "top-[-8px] left-1/2 -translate-x-1/2 border-b-0 border-r-0"
                  : actualPosition === "left"
                  ? "right-[-8px] top-1/2 -translate-y-1/2 border-l-0 border-b-0"
                  : "left-[-8px] top-1/2 -translate-y-1/2 border-r-0 border-t-0"
              }`}
            />
          </div>
        </div>
      )}
    </>
  );
}

export default ItemTooltip;
