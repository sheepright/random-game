"use client";

import { useEffect, useRef, useState } from "react";
import { useGame } from "../contexts/GameContext";

/**
 * CreditGenerator 컴포넌트
 * 백그라운드에서도 크레딧이 계속 증가하도록 개선된 버전
 * 탭이 비활성화되어도 크레딧 생성을 계속하고, 다시 활성화될 때 누적된 크레딧을 적용
 * Requirements: 1.1, 1.2
 */
export function CreditGenerator() {
  const { gameState, actions } = useGame();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateTimeRef = useRef<number>(Date.now());
  const [isActive, setIsActive] = useState(true);

  // 탭 활성화/비활성화 감지 및 백그라운드 크레딧 계산
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      const now = Date.now();

      if (!isVisible) {
        // 탭이 비활성화될 때 마지막 업데이트 시간 저장
        lastUpdateTimeRef.current = now;
        setIsActive(false);
      } else {
        // 탭이 다시 활성화될 때 누적된 크레딧 계산 및 적용
        if (!isActive) {
          const elapsedMs = now - lastUpdateTimeRef.current;
          const elapsedSeconds = elapsedMs / 1000;
          const creditsToAdd = Math.floor(
            elapsedSeconds * gameState.creditPerSecond
          );

          if (creditsToAdd > 0) {
            actions.addCredits(creditsToAdd);
          }
        }
        lastUpdateTimeRef.current = now;
        setIsActive(true);
      }
    };

    // 페이지 포커스/블러 이벤트 처리
    const handleFocus = () => {
      const now = Date.now();
      if (!isActive) {
        const elapsedMs = now - lastUpdateTimeRef.current;
        const elapsedSeconds = elapsedMs / 1000;
        const creditsToAdd = Math.floor(
          elapsedSeconds * gameState.creditPerSecond
        );

        if (creditsToAdd > 0) {
          actions.addCredits(creditsToAdd);
        }
      }
      lastUpdateTimeRef.current = now;
      setIsActive(true);
    };

    const handleBlur = () => {
      lastUpdateTimeRef.current = Date.now();
      setIsActive(false);
    };

    // 이벤트 리스너 등록
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
    };
  }, [isActive, gameState.creditPerSecond, actions]);

  // 크레딧 생성 로직 - 활성화 상태에서만 실시간 업데이트
  useEffect(() => {
    // 항상 interval을 실행하되, 활성화 상태에서만 실시간 크레딧 추가
    intervalRef.current = setInterval(() => {
      const now = Date.now();

      if (isActive) {
        // 활성화 상태에서는 실시간으로 크레딧 추가
        const creditsToAdd = gameState.creditPerSecond;
        actions.addCredits(creditsToAdd);
        lastUpdateTimeRef.current = now;
      }
      // 비활성화 상태에서는 시간만 업데이트 (실제 크레딧 추가는 활성화될 때)
    }, 1000); // 1초마다 실행

    // 컴포넌트 언마운트 시 interval 정리
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive, gameState.creditPerSecond, actions]);

  // 컴포넌트 마운트 시 초기 시간 설정
  useEffect(() => {
    lastUpdateTimeRef.current = Date.now();
  }, []);

  // 이 컴포넌트는 UI를 렌더링하지 않습니다 (로직만 담당)
  return null;
}
