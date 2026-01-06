/**
 * ItemImage Component
 * 아이템 이미지 표시 전용 재사용 가능한 컴포넌트
 * Requirements: 9.11, 성능 최적화
 */

import Image from "next/image";
import { Item, ItemGrade } from "../types/game";

interface ItemImageProps {
  item: Item;
  size?: "small" | "medium" | "large";
  showEnhancementLevel?: boolean;
  className?: string;
  onClick?: () => void;
  priority?: boolean; // 우선 로딩 여부 (중요한 이미지용)
  loading?: "lazy" | "eager"; // 로딩 전략
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

// 크기별 스타일 및 이미지 크기 (반응형 지원)
const SIZE_STYLES = {
  small: {
    container: "w-8 h-8 sm:w-10 sm:h-10",
    image: "w-6 h-6 sm:w-8 sm:h-8",
    enhancement: "text-xs",
    imageSize: { width: 24, height: 24 }, // 기본 크기
    imageSizeMobile: { width: 20, height: 20 }, // 모바일 크기
  },
  medium: {
    container: "w-16 h-16 sm:w-14 sm:h-14",
    image: "w-12 h-12 sm:w-10 sm:h-10",
    enhancement: "text-sm",
    imageSize: { width: 48, height: 48 },
    imageSizeMobile: { width: 40, height: 40 },
  },
  large: {
    container: "w-20 h-20 sm:w-18 sm:h-18",
    image: "w-16 h-16 sm:w-14 sm:h-14",
    enhancement: "text-base",
    imageSize: { width: 64, height: 64 },
    imageSizeMobile: { width: 56, height: 56 },
  },
} as const;

export default function ItemImage({
  item,
  size = "medium",
  showEnhancementLevel = true,
  className = "",
  onClick,
  priority = false,
  loading = "lazy",
}: ItemImageProps) {
  const sizeStyle = SIZE_STYLES[size];
  const borderColor = GRADE_BORDER_COLORS[item.grade];
  const bgColor = GRADE_BG_COLORS[item.grade];

  return (
    <div
      className={`
        relative flex items-center justify-center
        ${sizeStyle.container}
        ${bgColor}
        ${borderColor}
        border-2 rounded-lg
        ${onClick ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}
        ${className}
      `}
      onClick={onClick}
    >
      {/* 아이템 이미지 - 최적화된 Next.js Image 컴포넌트 */}
      <div className="relative">
        <Image
          src={item.imagePath || "/Items/default.png"}
          alt={`${item.type} ${item.grade}`}
          width={sizeStyle.imageSize.width}
          height={sizeStyle.imageSize.height}
          className={`${sizeStyle.image} object-contain`}
          priority={priority} // 중요한 이미지는 우선 로딩
          loading={loading} // lazy loading 또는 eager loading
          quality={85} // 이미지 품질 최적화 (기본 75에서 85로)
          placeholder="blur" // 로딩 중 블러 효과
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
          sizes="(max-width: 640px) 40px, 64px" // 반응형 이미지 크기
          onError={(e) => {
            // 이미지 로딩 실패 시 기본 이미지로 대체
            console.log(
              "ItemImage 로딩 실패:",
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
            console.log("ItemImage 로딩 성공:", item.imagePath);
          }}
        />
      </div>

      {/* 강화 레벨 표시 */}
      {showEnhancementLevel && item.enhancementLevel > 0 && (
        <div
          className={`
            absolute -top-1 -right-1
            bg-green-500 text-white
            ${sizeStyle.enhancement}
            font-bold
            px-1 py-0.5
            rounded-full
            min-w-6
            text-center
            leading-none
          `}
        >
          +{item.enhancementLevel}
        </div>
      )}

      {/* 등급 표시 (작은 점) */}
      <div
        className={`
          absolute -bottom-1 -right-1
          w-3 h-3
          ${borderColor.replace("border-", "bg-")}
          rounded-full
          border border-white
        `}
      />
    </div>
  );
}

// 아이템 이미지만 표시하는 간단한 버전 (최적화됨)
export function SimpleItemImage({
  imagePath,
  grade,
  size = "medium",
  className = "",
  priority = false,
  loading = "lazy",
}: {
  imagePath: string;
  grade: ItemGrade;
  size?: "small" | "medium" | "large";
  className?: string;
  priority?: boolean;
  loading?: "lazy" | "eager";
}) {
  const sizeStyle = SIZE_STYLES[size];
  const borderColor = GRADE_BORDER_COLORS[grade];
  const bgColor = GRADE_BG_COLORS[grade];

  return (
    <div
      className={`
        flex items-center justify-center
        ${sizeStyle.container}
        ${bgColor}
        ${borderColor}
        border-2 rounded-lg
        ${className}
      `}
    >
      <Image
        src={imagePath || "/Items/default.png"}
        alt={`Item ${grade}`}
        width={sizeStyle.imageSize.width}
        height={sizeStyle.imageSize.height}
        className={`${sizeStyle.image} object-contain`}
        priority={priority}
        loading={loading}
        quality={85}
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
        sizes="(max-width: 640px) 40px, 64px"
        onError={(e) => {
          console.log("SimpleItemImage 로딩 실패:", imagePath);
          const target = e.target as HTMLImageElement;
          if (target.src !== "/Items/default.png") {
            target.src = "/Items/default.png";
          }
        }}
        onLoad={() => {
          console.log("SimpleItemImage 로딩 성공:", imagePath);
        }}
      />
    </div>
  );
}
