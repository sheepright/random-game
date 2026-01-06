"use client";

import { useEffect, useCallback, useState } from "react";
import { useGame } from "../contexts/GameContext";
import {
  checkStageClearItemDrop,
  checkIdleItemDrop,
  initializeItemDropSystem,
  getTimeUntilNextIdleDrop,
  ItemDropResult,
} from "../utils/itemDropSystem";
import { ItemDropNotification } from "./ItemDropNotification";
import { ItemDropModal } from "./ItemDropModal";

/**
 * ItemDropSystem 컴포넌트
 * 스테이지 클리어 시와 잠수 중 아이템 드랍을 관리하는 시스템
 * Requirements: 3.1, 3.2, 3.5, 3.6, 3.9, 3.10
 */

interface ItemDropSystemProps {
  onItemDropped?: (dropResult: ItemDropResult) => void;
}

export function ItemDropSystem({ onItemDropped }: ItemDropSystemProps) {
  const { gameState, actions } = useGame();
  const [nextIdleDropTime, setNextIdleDropTime] = useState<number>(0);

  // 잠수 중 드랍 알림 상태
  const [idleDropNotification, setIdleDropNotification] = useState<{
    item: any;
    isVisible: boolean;
  }>({ item: null, isVisible: false });

  // 스테이지 클리어 드랍 모달 상태
  const [stageClearModal, setStageClearModal] = useState<{
    items: any[];
    isVisible: boolean;
    stageNumber: number;
    creditReward: number;
  }>({ items: [], isVisible: false, stageNumber: 1, creditReward: 0 });

  /**
   * 스테이지 클리어 시 아이템 드랍 처리
   * Requirements: 3.1 - 스테이지 클리어 시 100% 확정 드랍
   */
  const handleStageClearDrop = useCallback(
    (stage: number) => {
      const dropResult = checkStageClearItemDrop(stage);

      // 스테이지 클리어 시 100% 확정 드랍이므로 항상 성공해야 함
      if (dropResult.success && dropResult.item) {
        // 인벤토리에 아이템 추가
        actions.addItemToInventory(dropResult.item);

        console.log(
          "스테이지 클리어 아이템 드랍 (100% 확정):",
          dropResult.item
        );

        // 스테이지 클리어 모달 표시
        setStageClearModal({
          items: [dropResult.item],
          isVisible: true,
          stageNumber: stage,
          creditReward: 0, // 이 함수에서는 크레딧 보상 정보가 없으므로 0
        });

        // 드랍 결과 콜백 호출
        onItemDropped?.(dropResult);
      } else {
        // 100% 확정 드랍이므로 실패하면 로그 출력
        console.warn(
          "스테이지 클리어 드랍 실패 - 100% 확정 드랍이어야 함:",
          stage
        );
      }

      return dropResult;
    },
    [actions, onItemDropped]
  );

  /**
   * 잠수 중 아이템 드랍 처리
   * Requirements: 3.2 - 잠수 중 기존 낮은 확률 유지 (0.1-0.15% 매초)
   */
  const handleIdleDrop = useCallback(
    (stage: number) => {
      const dropResult = checkIdleItemDrop(stage);

      if (dropResult.success && dropResult.item) {
        // 인벤토리에 아이템 추가
        actions.addItemToInventory(dropResult.item);

        console.log("잠수 중 아이템 드랍 (낮은 확률):", dropResult.item);

        // 잠수 중 드랍 알림 표시
        setIdleDropNotification({
          item: dropResult.item,
          isVisible: true,
        });

        // 드랍 결과 콜백 호출
        onItemDropped?.(dropResult);
      }

      return dropResult;
    },
    [actions, onItemDropped]
  );

  /**
   * 다음 잠수 드랍까지 남은 시간 업데이트
   */
  const updateNextIdleDropTime = useCallback(() => {
    const timeRemaining = getTimeUntilNextIdleDrop();
    setNextIdleDropTime(timeRemaining);
  }, []);

  /**
   * 잠수 드랍 체크 타이머 설정 (매초 체크) - 성능 최적화됨
   * Requirements: 3.2 - 스테이지 클리어 후 잠수 모드에서 기존 낮은 확률 유지
   */
  useEffect(() => {
    // 매초 잠수 드랍 체크 (0.1-0.15% 확률)
    // 스테이지 클리어 후 자동으로 잠수 모드로 전환되어 이 로직이 실행됨
    const idleDropInterval = setInterval(() => {
      // 잠수 드랍 체크 (기존 낮은 확률 유지)
      handleIdleDrop(gameState.currentStage);

      // 다음 드랍까지 남은 시간 업데이트
      updateNextIdleDropTime();
    }, 1000);

    return () => clearInterval(idleDropInterval);
  }, [gameState.currentStage, handleIdleDrop, updateNextIdleDropTime]);

  /**
   * 컴포넌트 마운트 시 아이템 드랍 시스템 초기화
   */
  useEffect(() => {
    initializeItemDropSystem();
    updateNextIdleDropTime();
  }, [updateNextIdleDropTime]);

  /**
   * 스테이지 클리어 드랍 감지 및 모달 표시
   * GameContext에서 전투 승리 시 설정된 recentStageClearDrops를 감지하여 모달 표시
   * Requirements: 3.1, 3.10 - 스테이지 클리어 시 모달창 표시
   */
  useEffect(() => {
    if (gameState.recentStageClearDrops) {
      const { items, stageNumber, creditReward } =
        gameState.recentStageClearDrops;

      console.log(
        "스테이지 클리어 아이템 드랍 감지:",
        items,
        "스테이지:",
        stageNumber,
        "크레딧 보상:",
        creditReward
      );

      // 스테이지 클리어 모달 표시
      setStageClearModal({
        items,
        isVisible: true,
        stageNumber,
        creditReward,
      });

      // 드랍 결과 콜백 호출
      if (items.length > 0) {
        onItemDropped?.({
          success: true,
          item: items[0], // 첫 번째 아이템을 대표로 전달
          dropType: "stageClear",
          stage: stageNumber,
        });
      }
    }
  }, [gameState.recentStageClearDrops, onItemDropped]);

  // 잠수 드랍 알림 닫기 핸들러
  const handleCloseIdleNotification = () => {
    setIdleDropNotification({ item: null, isVisible: false });
  };

  // 스테이지 클리어 모달 닫기 핸들러
  const handleCloseStageClearModal = () => {
    setStageClearModal({
      items: [],
      isVisible: false,
      stageNumber: 1,
      creditReward: 0,
    });
    // recentStageClearDrops 클리어하여 중복 표시 방지
    actions.clearRecentStageClearDrops();
  };

  // 스테이지 클리어 모달 모든 아이템 수집 핸들러
  const handleCollectAllStageItems = () => {
    // 이미 인벤토리에 추가되었으므로 모달만 닫기
    handleCloseStageClearModal();
  };

  return (
    <>
      {/* 잠수 중 드랍 알림 (우상단 토스트) */}
      <ItemDropNotification
        item={idleDropNotification.item}
        isVisible={idleDropNotification.isVisible}
        onClose={handleCloseIdleNotification}
        autoCloseDelay={4000}
      />

      {/* 스테이지 클리어 드랍 모달 */}
      <ItemDropModal
        droppedItems={stageClearModal.items}
        isVisible={stageClearModal.isVisible}
        onClose={handleCloseStageClearModal}
        onCollectAll={handleCollectAllStageItems}
        dropSource="stage_clear"
        stageNumber={stageClearModal.stageNumber}
        creditReward={stageClearModal.creditReward}
      />
    </>
  );
}

/**
 * 잠수 드랍 타이머를 표시하는 컴포넌트
 */
interface IdleDropTimerProps {
  className?: string;
}

export function IdleDropTimer({ className = "" }: IdleDropTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  useEffect(() => {
    const updateTimer = () => {
      const remaining = getTimeUntilNextIdleDrop();
      setTimeRemaining(remaining);
    };

    // 초기 업데이트
    updateTimer();

    // 1초마다 업데이트
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (ms: number): string => {
    const seconds = Math.ceil(ms / 1000);
    return `${seconds}초`;
  };

  return (
    <div className={`text-xs text-gray-500 ${className}`}>
      다음 잠수 드랍: {formatTime(timeRemaining)}
    </div>
  );
}

export default ItemDropSystem;
