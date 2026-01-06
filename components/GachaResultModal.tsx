/**
 * GachaResultModal Component
 * 가챠 결과 시각적 표시, 등급별 색상 및 애니메이션 효과, 획득 아이템 정보 표시
 * Requirements: 11.5, 11.6
 */

"use client";

import { useEffect, useState } from "react";
import { GachaResult, ItemGrade } from "../types/game";
import {
  GRADE_NAMES,
  ITEM_TYPE_NAMES,
  GACHA_CATEGORY_NAMES,
  STAT_NAMES,
} from "../constants/game";
import ResponsiveItemImage from "./ResponsiveItemImage";

interface GachaResultModalProps {
  result: GachaResult | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function GachaResultModal({
  result,
  isOpen,
  onClose,
}: GachaResultModalProps) {
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    if (isOpen && result) {
      // 모달이 열릴 때 애니메이션 시작
      setShowAnimation(true);
    } else {
      setShowAnimation(false);
    }
  }, [isOpen, result]);

  if (!isOpen || !result) return null;

  const { item, category, cost } = result;

  // 등급별 색상 및 스타일
  const getGradeStyles = (grade: ItemGrade) => {
    switch (grade) {
      case ItemGrade.MYTHIC:
        return {
          bg: "hero-card-red",
          text: "hero-text-red",
          border: "border-red-400",
          glow: "hero-glow-red",
          particle: "bg-red-300",
        };
      case ItemGrade.LEGENDARY:
        return {
          bg: "hero-card-accent",
          text: "hero-text-accent",
          border: "border-yellow-400",
          glow: "hero-glow",
          particle: "bg-yellow-300",
        };
      case ItemGrade.EPIC:
        return {
          bg: "hero-card-purple",
          text: "hero-text-purple",
          border: "border-purple-400",
          glow: "shadow-purple-400/50",
          particle: "bg-purple-300",
        };
      case ItemGrade.RARE:
        return {
          bg: "hero-card-blue",
          text: "hero-text-blue",
          border: "border-blue-400",
          glow: "shadow-blue-400/50",
          particle: "bg-blue-300",
        };
      default:
        return {
          bg: "hero-card",
          text: "hero-text-secondary",
          border: "border-gray-400",
          glow: "shadow-gray-400/50",
          particle: "bg-gray-300",
        };
    }
  };

  const gradeStyles = getGradeStyles(item.grade);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="hero-card rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* 헤더 */}
        <div
          className={`${gradeStyles.bg} p-6 text-center relative overflow-hidden`}
        >
          {/* 애니메이션 파티클 효과 */}
          {showAnimation && (
            <>
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className={`absolute w-2 h-2 ${gradeStyles.particle} rounded-full animate-ping`}
                  style={{
                    left: `${20 + i * 10}%`,
                    top: `${30 + (i % 3) * 20}%`,
                    animationDelay: `${i * 0.2}s`,
                    animationDuration: "1.5s",
                  }}
                />
              ))}
            </>
          )}

          <div className="relative z-10">
            <h2 className={`text-2xl font-bold ${gradeStyles.text} mb-2`}>
              🎉 가챠 결과
            </h2>
            <div className={`text-lg ${gradeStyles.text} opacity-90`}>
              {GACHA_CATEGORY_NAMES[category]} 가챠
            </div>
          </div>
        </div>
        {/* 아이템 정보 */}
        <div className="p-6">
          {/* 아이템 등급 및 이름 */}
          <div className="text-center mb-6">
            <div
              className={`inline-block px-4 py-2 rounded-full border-2 ${gradeStyles.border} ${gradeStyles.bg} ${gradeStyles.text} font-bold text-lg mb-3 shadow-lg ${gradeStyles.glow}`}
            >
              {GRADE_NAMES[item.grade]} {ITEM_TYPE_NAMES[item.type]}
            </div>

            {/* 등급별 특별 효과 */}
            {item.grade === ItemGrade.LEGENDARY && (
              <div className="hero-text-accent text-sm font-medium hero-pulse">
                ✨ 전설 등급 아이템! ✨
              </div>
            )}
            {item.grade === ItemGrade.EPIC && (
              <div className="hero-text-purple text-sm font-medium">
                💎 에픽 등급 아이템!
              </div>
            )}
          </div>

          {/* 아이템 이미지 */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <ResponsiveItemImage
                item={item}
                size="xlarge"
                priority={true}
                loading="eager"
                className="drop-shadow-2xl"
              />
              {/* 반짝이는 애니메이션 효과 */}
              {showAnimation && (
                <>
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className={`absolute w-3 h-3 ${gradeStyles.particle} rounded-full animate-ping`}
                      style={{
                        left: `${10 + i * 15}%`,
                        top: `${20 + (i % 3) * 25}%`,
                        animationDelay: `${i * 0.3}s`,
                        animationDuration: "2s",
                      }}
                    />
                  ))}
                </>
              )}
            </div>
          </div>

          {/* 아이템 스탯 */}
          <div className="hero-card rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold hero-text-primary mb-3 text-center">
              아이템 스탯
            </h3>
            <div className="space-y-2">
              {Object.entries(item.baseStats).map(([stat, value]) => (
                <div key={stat} className="flex justify-between items-center">
                  <span className="hero-text-secondary">
                    {STAT_NAMES[stat as keyof typeof STAT_NAMES]}:
                  </span>
                  <span className="font-bold hero-text-primary">
                    {stat === "additionalAttackChance"
                      ? `${(value * 100).toFixed(1)}%`
                      : value > 0
                      ? `+${value}`
                      : value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 비용 정보 */}
          <div className="text-center mb-6">
            <div className="text-sm hero-text-secondary">
              소모된 크레딧:{" "}
              <span className="font-bold hero-text-primary">
                {cost.toLocaleString()}
              </span>
            </div>
          </div>

          {/* 확인 버튼 */}
          <button
            onClick={onClose}
            className={`w-full py-3 px-6 rounded-lg font-bold text-white transition-all ${gradeStyles.bg} hover:opacity-90 shadow-lg hover:shadow-xl hero-btn`}
          >
            확인
          </button>

          {/* 도움말 */}
          <div className="mt-4 text-xs hero-text-muted text-center">
            💡 아이템이 인벤토리에 추가되었습니다
          </div>
        </div>
      </div>
    </div>
  );
}
