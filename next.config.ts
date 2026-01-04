import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // 이미지 최적화 설정
    formats: ["image/webp", "image/avif"], // 최신 이미지 포맷 지원
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840], // 반응형 이미지 크기
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384], // 아이콘 크기
    qualities: [75, 85, 90], // 이미지 품질 옵션 추가
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1년 캐시 (아이템 이미지는 변경되지 않음)
    dangerouslyAllowSVG: false, // SVG 보안상 비활성화
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // 정적 파일 캐싱 최적화
  async headers() {
    return [
      {
        source: "/Items/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable", // 1년 캐시
          },
        ],
      },
    ];
  },
};

export default nextConfig;
