"use client";

import { useEffect, useState } from "react";
import { useGame } from "../contexts/GameContext";
import { OfflineProgress } from "../types/game";

interface OfflineProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  offlineProgress: OfflineProgress;
}

/**
 * OfflineProgressModal 컴포넌트
 * 오프라인 진행 결과를 표시하는 모달
 * Requirements: 6.4
 */
export function OfflineProgressModal({
  isOpen,
  onClose,
  offlineProgress,
}: OfflineProgressModalProps) {
  const [showAnimation, setShowAnimation] = useState(false);
  const [showCredits, setShowCredits] = useState(false);

  // 모달이 열릴 때 애니메이션 효과
  useEffect(() => {
    if (isOpen) {
      setShowAnimation(true);
      // 크레딧 애니메이션을 지연시켜 더 드라마틱하게
      setTimeout(() => setShowCredits(true), 800);
    } else {
      setShowCredits(false);
    }
  }, [isOpen]);

  // 모달이 열려있지 않으면 렌더링하지 않음
  if (!isOpen) {
    return null;
  }

  // 시간 포맷팅 함수
  const formatTime = (hours: number): string => {
    if (hours < 1) {
      const minutes = Math.floor(hours * 60);
      return `${minutes}분`;
    } else if (hours < 24) {
      const wholeHours = Math.floor(hours);
      const minutes = Math.floor((hours - wholeHours) * 60);
      return minutes > 0
        ? `${wholeHours}시간 ${minutes}분`
        : `${wholeHours}시간`;
    } else {
      return "24시간";
    }
  };

  // 크레딧 포맷팅 함수
  const formatCredits = (credits: number): string => {
    if (credits >= 1000000000) {
      return `${(credits / 1000000000).toFixed(1)}B`;
    } else if (credits >= 1000000) {
      return `${(credits / 1000000).toFixed(1)}M`;
    } else if (credits >= 1000) {
      return `${(credits / 1000).toFixed(1)}K`;
    }
    return Math.floor(credits).toString();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 모달 컨텐츠 */}
      <div
        className={`
          relative hero-card-purple
          rounded-2xl p-4 sm:p-6 lg:p-8 mx-4 max-w-md w-full 
          border border-purple-400/30 shadow-2xl
          transform transition-all duration-700 ease-out
          ${
            showAnimation
              ? "scale-100 opacity-100 translate-y-0"
              : "scale-95 opacity-0 translate-y-4"
          }
        `}
      >
        {/* 배경 장식 */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-yellow-500/20 rounded-full blur-2xl hero-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-cyan-500/20 rounded-full blur-2xl hero-pulse delay-1000"></div>
        </div>

        {/* 헤더 */}
        <div className="relative z-10 text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 hero-card-accent rounded-full mb-4 hero-float">
            <span className="text-2xl sm:text-3xl">💰</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold hero-text-primary mb-2 hero-text-accent">
            오프라인 진행 완료!
          </h2>
          <p className="hero-text-secondary text-sm sm:text-base">
            게임을 하지 않는 동안에도 크레딧을 획득했습니다
          </p>
        </div>

        {/* 진행 결과 */}
        <div className="relative z-10 space-y-4 mb-6">
          {/* 경과 시간 */}
          <div className="hero-card rounded-xl p-4 border border-white/20 hover:border-white/30 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-xl sm:text-2xl hero-pulse">⏰</span>
                <div>
                  <p className="hero-text-primary font-medium text-sm sm:text-base">
                    경과 시간
                  </p>
                  <p className="hero-text-secondary text-xs sm:text-sm">
                    최대 {offlineProgress.maxOfflineHours}시간까지 적용
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg sm:text-xl font-bold hero-text-primary font-mono">
                  {formatTime(offlineProgress.elapsedTime)}
                </p>
              </div>
            </div>
          </div>

          {/* 획득 크레딧 */}
          <div className="hero-card-accent rounded-xl p-4 border border-yellow-400/30 relative overflow-hidden">
            {/* 반짝이는 효과 */}
            {showCredits && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-shimmer"></div>
            )}

            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-xl sm:text-2xl hero-float">💎</span>
                <div>
                  <p className="hero-text-primary font-medium text-sm sm:text-base">
                    획득 크레딧
                  </p>
                  <p className="hero-text-accent text-xs sm:text-sm">
                    자동으로 계정에 추가되었습니다
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p
                  className={`
                  text-xl sm:text-2xl font-bold hero-text-accent font-mono
                  transition-all duration-1000 ease-out
                  ${showCredits ? "scale-110 hero-pulse" : "scale-100"}
                `}
                >
                  +{formatCredits(offlineProgress.creditsEarned)}
                </p>
              </div>
            </div>
          </div>

          {/* 추가 정보 */}
          {offlineProgress.elapsedTime >= offlineProgress.maxOfflineHours && (
            <div className="hero-card-red rounded-xl p-4 border border-orange-400/30">
              <div className="flex items-center space-x-3">
                <span className="text-lg sm:text-xl">⚠️</span>
                <div>
                  <p className="hero-text-red font-medium text-sm sm:text-base">
                    최대 시간 도달
                  </p>
                  <p className="hero-text-secondary text-xs sm:text-sm">
                    오프라인 진행은 최대 24시간까지만 적용됩니다
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 확인 버튼 */}
        <div className="relative z-10">
          <button
            onClick={onClose}
            className="hero-btn hero-btn-primary w-full relative overflow-hidden"
          >
            <span className="relative z-10 flex items-center justify-center">
              <span className="mr-2">🎮</span>
              계속 플레이하기
            </span>
          </button>
        </div>

        {/* 닫기 버튼 (우상단) */}
        <button
          onClick={onClose}
          className="
            absolute top-3 right-3 sm:top-4 sm:right-4 hero-text-muted hover:hero-text-primary 
            transition-colors duration-200 focus:outline-none p-1
          "
        >
          <svg
            className="w-5 h-5 sm:w-6 sm:h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

/**
 * OfflineProgressModalManager 컴포넌트
 * 게임 컨텍스트와 연동하여 오프라인 진행 모달을 자동으로 관리
 */
export function OfflineProgressModalManager() {
  const { actions } = useGame();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [offlineProgress, setOfflineProgress] =
    useState<OfflineProgress | null>(null);

  useEffect(() => {
    // 컴포넌트 마운트 시 오프라인 진행 확인
    const lastProgress = actions.getLastOfflineProgress();
    if (lastProgress && lastProgress.creditsEarned > 0) {
      setOfflineProgress(lastProgress);
      setIsModalOpen(true);
    }
  }, [actions]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setOfflineProgress(null);
  };

  if (!offlineProgress) {
    return null;
  }

  return (
    <OfflineProgressModal
      isOpen={isModalOpen}
      onClose={handleCloseModal}
      offlineProgress={offlineProgress}
    />
  );
}
