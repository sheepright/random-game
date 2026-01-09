"use client";

import { Item, ItemGrade } from "../types/game";
import { GRADE_NAMES, ITEM_TYPE_NAMES, STAT_NAMES } from "../constants/game";

interface ItemInfoPanelProps {
  item: Item;
  onClose: () => void;
}

export function ItemInfoPanel({ item, onClose }: ItemInfoPanelProps) {
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

  const gradeStyles = getGradeStyles(item.grade);

  // 스탯 필터링 (0이 아닌 스탯만 표시)
  const nonZeroStats = Object.entries(item.enhancedStats).filter(
    ([_, value]) => value > 0
  );

  return (
    <div className="bg-gray-800 rounded-lg p-4 h-full">
      {/* 헤더 */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-sm font-bold text-white truncate">
            {ITEM_TYPE_NAMES[item.type]}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`text-xs px-2 py-0.5 rounded ${gradeStyles.bg} ${gradeStyles.text}`}
            >
              {GRADE_NAMES[item.grade]}
            </span>
            {item.enhancementLevel > 0 && (
              <span className="text-xs text-green-400 font-medium">
                +{item.enhancementLevel}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white text-lg ml-2 shrink-0"
        >
          ×
        </button>
      </div>

      {/* 스탯 정보 */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-gray-300">아이템 스탯</h4>
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {nonZeroStats.map(([statKey, value]) => {
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
                <span className="text-gray-300 truncate flex-1 mr-2">
                  {statName}
                </span>
                <span className="text-white font-medium shrink-0">
                  {displayValue}
                </span>
              </div>
            );
          })}
        </div>

        {/* 아이템 레벨 */}
        <div className="pt-2 border-t border-gray-700">
          <div className="flex justify-between text-xs">
            <span className="text-gray-300">아이템 레벨</span>
            <span className="text-white font-medium">{item.level}</span>
          </div>
        </div>

        {/* 도움말 */}
        <div className="pt-2 border-t border-gray-700">
          <p className="text-xs text-gray-400 text-center">
            더블클릭으로 장비 해제
          </p>
        </div>
      </div>
    </div>
  );
}

export default ItemInfoPanel;
