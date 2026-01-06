/**
 * ResponsiveItemImage Component
 * 반응형 아이템 이미지 컴포넌트 - 다양한 화면 크기와 해상도에 최적화
 * Requirements: 반응형 디자인, 성능 최적화
 */

import Image from "next/image";
import { Item, ItemGrade } from "../types/game";
import { useState, useEffect } from "react";

interface ResponsiveItemImageProps {
  item: Item;
  size?: "small" | "medium" | "large" | "xlarge";
  showEnhancementLevel?: boolean;
  className?: string;
  onClick?: () => void;
  priority?: boolean;
  loading?: "lazy" | "eager";
}

// 등급별 테두리 색상
const GRADE_BORDER_COLORS = {
  [ItemGrade.COMMON]: "border-gray-400",
  [ItemGrade.RARE]: "border-blue-400",
  [ItemGrade.EPIC]: "border-purple-400",
  [ItemGrade.LEGENDARY]: "border-yellow-400",
  [ItemGrade.MYTHIC]: "border-red-400",
} as const;

// 등급별 배경 색상 (투명하게 변경)
const GRADE_BG_COLORS = {
  [ItemGrade.COMMON]: "bg-transparent",
  [ItemGrade.RARE]: "bg-transparent",
  [ItemGrade.EPIC]: "bg-transparent",
  [ItemGrade.LEGENDARY]: "bg-transparent",
  [ItemGrade.MYTHIC]: "bg-transparent",
} as const;

// 반응형 크기별 스타일 (모바일 우선 설계)
const RESPONSIVE_SIZE_STYLES = {
  small: {
    // 모바일: 6x6, 태블릿: 8x8, 데스크톱: 10x10
    container: "w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10",
    image: "w-5 h-5 sm:w-7 sm:h-7 md:w-9 md:h-9",
    enhancement: "text-xs",
    imageSize: { width: 24, height: 24 },
    sizes: "(max-width: 640px) 20px, (max-width: 768px) 28px, 36px",
  },
  medium: {
    // 모바일: 12x12, 태블릿: 14x14, 데스크톱: 16x16
    container: "w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16",
    image: "w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14",
    enhancement: "text-sm",
    imageSize: { width: 64, height: 64 },
    sizes: "(max-width: 640px) 40px, (max-width: 768px) 48px, 56px",
  },
  large: {
    // 모바일: 16x16, 태블릿: 18x18, 데스크톱: 20x20
    container: "w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20",
    image: "w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18",
    enhancement: "text-base",
    imageSize: { width: 80, height: 80 },
    sizes: "(max-width: 640px) 56px, (max-width: 768px) 64px, 72px",
  },
  xlarge: {
    // 모바일: 20x20, 태블릿: 24x24, 데스크톱: 28x28
    container: "w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28",
    image: "w-18 h-18 sm:w-22 sm:h-22 md:w-26 md:h-26",
    enhancement: "text-lg",
    imageSize: { width: 112, height: 112 },
    sizes: "(max-width: 640px) 72px, (max-width: 768px) 88px, 104px",
  },
} as const;

// 고해상도 디스플레이 감지 훅
function useHighDPI() {
  const [isHighDPI, setIsHighDPI] = useState(false);

  useEffect(() => {
    const checkDPI = () => {
      setIsHighDPI(window.devicePixelRatio > 1);
    };

    checkDPI();
    window.addEventListener("resize", checkDPI);

    return () => window.removeEventListener("resize", checkDPI);
  }, []);

  return isHighDPI;
}

export default function ResponsiveItemImage({
  item,
  size = "medium",
  showEnhancementLevel = true,
  className = "",
  onClick,
  priority = false,
  loading = "lazy",
}: ResponsiveItemImageProps) {
  const sizeStyle = RESPONSIVE_SIZE_STYLES[size];
  const borderColor = GRADE_BORDER_COLORS[item.grade];
  const bgColor = GRADE_BG_COLORS[item.grade];
  const isHighDPI = useHighDPI();

  // 고해상도 디스플레이용 이미지 크기 조정
  const imageSize = {
    width: isHighDPI
      ? sizeStyle.imageSize.width * 1.5
      : sizeStyle.imageSize.width,
    height: isHighDPI
      ? sizeStyle.imageSize.height * 1.5
      : sizeStyle.imageSize.height,
  };

  return (
    <div
      className={`
        relative flex items-center justify-center
        ${sizeStyle.container}
        ${bgColor}
        ${borderColor}
        border-2 rounded-lg
        transition-all duration-200 ease-in-out
        ${
          onClick
            ? "cursor-pointer hover:opacity-80 hover:scale-105 active:scale-95"
            : ""
        }
        ${className}
      `}
      onClick={onClick}
    >
      {/* 아이템 이미지 - 반응형 최적화 */}
      <div className="relative overflow-hidden rounded">
        <Image
          src={item.imagePath || "/Items/default.png"}
          alt={`${item.type} ${item.grade} 아이템`}
          width={imageSize.width}
          height={imageSize.height}
          className={`${sizeStyle.image} object-contain transition-transform duration-200`}
          priority={priority}
          loading={loading}
          quality={isHighDPI ? 90 : 85} // 고해상도에서 더 높은 품질
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
          sizes={sizeStyle.sizes}
          onError={(e) => {
            console.log(
              "이미지 로딩 실패:",
              item.imagePath,
              "아이템 타입:",
              item.type
            );
            const target = e.target as HTMLImageElement;
            if (target.src !== "/Items/default.png") {
              target.src = "/Items/default.png";
            }
          }}
          onLoad={() => {
            console.log("이미지 로딩 성공:", item.imagePath);
          }}
        />
      </div>

      {/* 강화 레벨 표시 - 반응형 */}
      {showEnhancementLevel && item.enhancementLevel > 0 && (
        <div
          className={`
            absolute -top-1 -right-1
            bg-linear-to-r from-green-500 to-green-600
            text-white shadow-lg
            ${sizeStyle.enhancement}
            font-bold
            px-1.5 py-0.5 sm:px-2 sm:py-1
            rounded-full
            min-w-6 sm:min-w-7
            text-center
            leading-none
            border-2 border-white
            transform transition-transform duration-200
            ${onClick ? "group-hover:scale-110" : ""}
          `}
        >
          +{item.enhancementLevel}
        </div>
      )}

      {/* 등급 표시 점 - 반응형 */}
      <div
        className={`
          absolute -bottom-1 -right-1
          w-3 h-3 sm:w-4 sm:h-4
          ${borderColor.replace("border-", "bg-")}
          rounded-full
          border-2 border-white
          shadow-sm
        `}
      />

      {/* 호버 효과용 오버레이 */}
      {onClick && (
        <div className="absolute inset-0 bg-white opacity-0 hover:opacity-10 transition-opacity duration-200 rounded-lg" />
      )}
    </div>
  );
}

// 그리드용 최적화된 아이템 이미지 (인벤토리 등에서 사용)
export function GridItemImage({
  item,
  onClick,
  isSelected = false,
}: {
  item: Item;
  onClick?: () => void;
  isSelected?: boolean;
}) {
  return (
    <ResponsiveItemImage
      item={item}
      size="medium"
      onClick={onClick}
      className={`
        ${isSelected ? "ring-2 ring-blue-500 ring-offset-2" : ""}
        ${onClick ? "hover:shadow-lg" : ""}
      `}
      loading="lazy"
    />
  );
}

// 장비 슬롯용 최적화된 아이템 이미지
export function EquipmentSlotImage({
  item,
  onClick,
  isEmpty = false,
}: {
  item?: Item | null;
  onClick?: () => void;
  isEmpty?: boolean;
}) {
  if (!item || isEmpty) {
    return (
      <div
        className={`
          w-16 h-16
          border-2 border-dashed border-gray-300
          rounded-lg
          flex items-center justify-center
          bg-transparent
          ${
            onClick
              ? "cursor-pointer hover:border-gray-400 hover:bg-gray-100"
              : ""
          }
          transition-colors duration-200
        `}
        onClick={onClick}
      >
        <div className="text-gray-400 text-xs font-medium">빈 슬롯</div>
      </div>
    );
  }

  return (
    <div className="w-16 h-16 flex items-center justify-center">
      <ResponsiveItemImage
        item={item}
        size="medium"
        onClick={onClick}
        priority={true}
        loading="eager"
        className="bg-transparent"
      />
    </div>
  );
}
