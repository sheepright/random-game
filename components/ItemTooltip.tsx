"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Item, ItemGrade } from "../types/game";
import { GRADE_NAMES, ITEM_TYPE_NAMES, STAT_NAMES } from "../constants/game";

interface ItemTooltipProps {
  item: Item;
  children: React.ReactNode;
  delay?: number;
}

export function ItemTooltip({ item, children, delay = 300 }: ItemTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 등급별 색상 스타일
  const getGradeStyles = (grade: ItemGrade) => {
    switch (grade) {
      case ItemGrade.MYTHIC:
        return {
          bg: "bg-gradient-to-r from-red-600 to-red-800",
          text: "text-red-100",
          border: "border-red-400",
        };
      case ItemGrade.LEGENDARY:
        return {
          bg: "bg-gradient-to-r from-yellow-600 to-yellow-800",
          text: "text-yellow-100",
          border: "border-yellow-400",
        };
      case ItemGrade.EPIC:
        return {
          bg: "bg-gradient-to-r from-purple-600 to-purple-800",
          text: "text-purple-100",
          border: "border-purple-400",
        };
      case ItemGrade.RARE:
        return {
          bg: "bg-gradient-to-r from-blue-600 to-blue-800",
          text: "text-blue-100",
          border: "border-blue-400",
        };
      default:
        return {
          bg: "bg-gradient-to-r from-gray-600 to-gray-800",
          text: "text-gray-100",
          border: "border-gray-400",
        };
    }
  };

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setPosition({
          x: rect.right + 8, // 요소 오른쪽에 8px 간격
          y: rect.top,
        });
      }
      setIsVisible(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  const gradeStyles = getGradeStyles(item.grade);

  // 스탯 필터링 (0이 아닌 스탯만 표시)
  const nonZeroStats = Object.entries(item.enhancedStats).filter(
    ([_, value]) => value > 0
  );

  // 툴팁 컴포넌트
  const tooltipContent = isVisible && (
    <div
      className="fixed z-[99999] pointer-events-none"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      <div
        className={`${gradeStyles.bg} ${gradeStyles.border} border-2 rounded-lg shadow-lg w-56 max-w-[220px]`}
      >
        {/* 간단한 헤더 */}
        <div className="p-2">
          <div className={`font-bold text-sm ${gradeStyles.text} truncate`}>
            {ITEM_TYPE_NAMES[item.type]}
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className={`text-xs ${gradeStyles.text} opacity-90`}>
              {GRADE_NAMES[item.grade]}
            </span>
            {item.enhancementLevel > 0 && (
              <span className={`text-xs ${gradeStyles.text} font-medium`}>
                +{item.enhancementLevel}
              </span>
            )}
          </div>
        </div>

        {/* 주요 스탯만 간단히 표시 */}
        {nonZeroStats.length > 0 && (
          <div className="px-2 pb-2">
            <div className="space-y-0.5">
              {nonZeroStats.slice(0, 3).map(([statKey, value]) => {
                const statName = STAT_NAMES[statKey as keyof typeof STAT_NAMES];
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
                  <div key={statKey} className="flex justify-between text-xs">
                    <span
                      className={`${gradeStyles.text} opacity-80 truncate flex-1 mr-1`}
                    >
                      {statName}
                    </span>
                    <span
                      className={`${gradeStyles.text} font-medium shrink-0`}
                    >
                      {displayValue}
                    </span>
                  </div>
                );
              })}
              {nonZeroStats.length > 3 && (
                <div
                  className={`text-xs ${gradeStyles.text} opacity-60 text-center mt-1`}
                >
                  +{nonZeroStats.length - 3}개 스탯 더보기
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
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

      {/* Portal을 사용해서 body에 툴팁 렌더링 */}
      {mounted &&
        typeof document !== "undefined" &&
        tooltipContent &&
        createPortal(tooltipContent, document.body)}
    </>
  );
}

export default ItemTooltip;
