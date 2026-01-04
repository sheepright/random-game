"use client";

import { useEffect, useState } from "react";
import { useGame } from "../contexts/GameContext";
import { getStorageInfo } from "../utils/gameStorage";

/**
 * SaveStatusIndicator 컴포넌트
 * 게임 저장 상태와 저장소 정보를 표시
 */
export function SaveStatusIndicator() {
  const { gameState } = useGame();
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  const [storageInfo, setStorageInfo] = useState<{
    used: number;
    available: boolean;
    storageStatus: Record<string, boolean>;
  }>({ used: 0, available: false, storageStatus: {} });

  // 마지막 저장 시간 업데이트
  useEffect(() => {
    if (gameState.lastSaveTime) {
      setLastSaveTime(new Date(gameState.lastSaveTime));
    }
  }, [gameState.lastSaveTime]);

  // 저장소 정보 업데이트
  useEffect(() => {
    const updateStorageInfo = () => {
      const info = getStorageInfo();
      setStorageInfo(info);
    };

    updateStorageInfo();

    // 10초마다 저장소 정보 업데이트
    const interval = setInterval(updateStorageInfo, 10000);

    return () => clearInterval(interval);
  }, []);

  // 시간 포맷팅
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // 파일 크기 포맷팅
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  // 저장소 상태 확인 (내부적으로만 사용)
  const getStorageStatusColor = (): string => {
    const statusCount = Object.values(storageInfo.storageStatus);
    const activeCount = statusCount.filter(Boolean).length;

    if (activeCount >= 1) return "text-green-400"; // 최소 하나라도 저장되면 정상
    return "text-red-400"; // 모든 저장소 실패
  };

  const getStorageStatusIcon = (): string => {
    const statusCount = Object.values(storageInfo.storageStatus);
    const activeCount = statusCount.filter(Boolean).length;

    if (activeCount >= 1) return "💾"; // 저장됨
    return "❌"; // 저장 실패
  };

  if (!storageInfo.available) {
    return (
      <div className="fixed bottom-4 right-4 hero-card-red p-3 rounded-lg border border-red-400/30 max-w-xs">
        <div className="flex items-center space-x-2">
          <span className="text-lg">❌</span>
          <div>
            <p className="hero-text-red font-medium text-sm">저장 불가</p>
            <p className="hero-text-secondary text-xs">
              localStorage 사용 불가
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 hero-card p-3 rounded-lg border border-white/20 max-w-xs">
      <div className="space-y-2">
        {/* 저장 상태 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-lg">{getStorageStatusIcon()}</span>
            <div>
              <p className={`font-medium text-sm ${getStorageStatusColor()}`}>
                자동 저장
              </p>
              {lastSaveTime && (
                <p className="hero-text-secondary text-xs">
                  {formatTime(lastSaveTime)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 저장소 사용량 */}
        <div className="flex items-center justify-between text-xs">
          <span className="hero-text-secondary">사용량:</span>
          <span className="hero-text-primary font-mono">
            {formatBytes(storageInfo.used)}
          </span>
        </div>
      </div>
    </div>
  );
}
