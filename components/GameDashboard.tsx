"use client";

import { useState } from "react";
import { CreditGenerator } from "./CreditGenerator";
import { CreditDisplay } from "./CreditDisplay";
import { EquipmentPanel } from "./EquipmentPanel";
import { StageProgress } from "./StageProgress";
import { PlayerStatsDisplay } from "./PlayerStatsDisplay";
import { OfflineProgressModalManager } from "./OfflineProgressModal";
import { ItemDropSystem } from "./ItemDropSystem";
import { BattleModal } from "./BattleModal";
import { InheritanceModal } from "./InheritanceModal";
import { SaveStatusIndicator } from "./SaveStatusIndicator";
import EnhancementModal from "./EnhancementModal";
import GachaResultModal from "./GachaResultModal";
import GachaModal from "./GachaModal";
import InventoryModal from "./InventoryModal";
import ItemSelectionModal from "./ItemSelectionModal";
import ClientOnly from "./ClientOnly";
import { useGame } from "../contexts/GameContext";
import { Item, Boss, GachaResult } from "../types/game";
import { ItemDropResult } from "../utils/itemDropSystem";

/**
 * GameDashboard 컴포넌트 - 용사키우기 메인 UI
 * 세련된 다크모드 디자인으로 색상 대비 문제 해결
 */
export function GameDashboard() {
  const { gameState, actions } = useGame();

  // 모달 상태 관리
  const [showBattleModal, setShowBattleModal] = useState(false);
  const [showInheritanceModal, setShowInheritanceModal] = useState(false);
  const [showGachaModal, setShowGachaModal] = useState(false);
  const [showGachaResultModal, setShowGachaResultModal] = useState(false);
  const [showEnhancementModal, setShowEnhancementModal] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showItemSelectionModal, setShowItemSelectionModal] = useState(false);
  const [currentBoss, setCurrentBoss] = useState<Boss | null>(null);
  const [currentGachaResult, setCurrentGachaResult] =
    useState<GachaResult | null>(null);
  const [enhancementItem, setEnhancementItem] = useState<Item | null>(null);

  // 보스 전투 시작
  const handleStartBattle = () => {
    const boss = actions.loadBossForCurrentStage();
    if (boss) {
      setCurrentBoss(boss);
      actions.startBattle(boss);
      setShowBattleModal(true);
    }
  };

  // 전투 모달 닫기 처리 (포기 시)
  const handleBattleClose = () => {
    // 진행 중인 전투가 있다면 패배로 처리
    if (
      gameState.battleState &&
      gameState.battleState.battleResult === "ongoing"
    ) {
      actions.endBattle("defeat");
    }
    setShowBattleModal(false);
    setCurrentBoss(null);
  };

  // 전투 승리 처리
  const handleBattleVictory = () => {
    if (gameState.battleState) {
      actions.endBattle("victory");
    }
    setShowBattleModal(false);
    setCurrentBoss(null);
  };

  // 전투 패배 처리
  const handleBattleDefeat = () => {
    if (gameState.battleState) {
      actions.endBattle("defeat");
    }
    setShowBattleModal(false);
    setCurrentBoss(null);
  };

  // 아이템 드랍 처리
  const handleItemDropped = (dropResult: ItemDropResult) => {
    console.log("아이템 드랍됨:", dropResult);
  };

  // 가챠 결과 처리
  const handleGachaResult = (result: GachaResult) => {
    setCurrentGachaResult(result);
    setShowGachaResultModal(true);
  };

  // 강화할 아이템 선택 처리
  const handleSelectEnhancementItem = (item: Item) => {
    setEnhancementItem(item);
    setShowEnhancementModal(true);
  };

  // 강화 가능한 아이템이 있는지 확인
  const hasEnhanceableItems = () => {
    const equippedItems = Object.values(gameState.equippedItems).filter(
      (item): item is Item => item !== null
    );
    return gameState.inventory.length > 0 || equippedItems.length > 0;
  };

  return (
    <div
      className="h-screen overflow-hidden flex items-center justify-center"
      style={{
        background:
          "linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 50%, var(--bg-primary) 100%)",
      }}
    >
      {/* 배경 시스템 */}
      <CreditGenerator />
      <ItemDropSystem onItemDropped={handleItemDropped} />
      <OfflineProgressModalManager />
      <SaveStatusIndicator />

      <div className="flex flex-col p-4 max-w-7xl w-full max-h-[90vh] overflow-y-auto">
        {/* 메인 게임 영역 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* 좌측: 크레딧 & 장비 */}
          <div className="space-y-4 flex flex-col">
            {/* 크레딧 */}
            <div className="hero-card hero-card-accent hero-glow">
              <div className="p-4">
                <CreditDisplay />
              </div>
            </div>

            {/* 장비 관리 */}
            <div className="hero-card">
              <div className="p-4">
                <EquipmentPanel />
              </div>
            </div>
          </div>

          {/* 중앙: 스테이지 & 스탯 */}
          <div className="space-y-4">
            {/* 스테이지 진행 */}
            <div className="hero-card hero-card-purple">
              <div className="p-4">
                <StageProgress onStartBattle={handleStartBattle} />
              </div>
            </div>

            {/* 플레이어 스탯 */}
            <div className="hero-card hero-card-blue">
              <div className="p-4">
                <PlayerStatsDisplay />
              </div>
            </div>
          </div>

          {/* 우측: 액션 버튼들 */}
          <div className="space-y-4">
            {/* 가챠 버튼 */}
            <div className="hero-card hero-card-green">
              <div className="p-6 text-center">
                <h3 className="text-xl font-bold hero-text-primary mb-4">
                  🎲 가챠
                </h3>
                <p className="hero-text-secondary mb-4 text-sm">
                  크레딧으로 새로운 장비를 획득하세요
                </p>
                <button
                  onClick={() => setShowGachaModal(true)}
                  className="hero-btn hero-btn-success w-full"
                >
                  가챠 뽑기
                </button>
              </div>
            </div>

            {/* 강화 버튼 */}
            <div className="hero-card hero-card-purple">
              <div className="p-6 text-center">
                <h3 className="text-xl font-bold hero-text-primary mb-4">
                  ⚡ 강화
                </h3>
                <p className="hero-text-secondary mb-4 text-sm">
                  아이템을 강화하여 스탯을 증가시키세요
                </p>
                <button
                  onClick={() => setShowItemSelectionModal(true)}
                  disabled={!hasEnhanceableItems()}
                  className={
                    hasEnhanceableItems()
                      ? "hero-btn hero-btn-primary w-full mb-2"
                      : "hero-btn hero-btn-disabled w-full mb-2"
                  }
                >
                  아이템 강화
                </button>
                <button
                  onClick={() => setShowInheritanceModal(true)}
                  className="hero-btn hero-btn-warning w-full"
                >
                  아이템 계승
                </button>
              </div>
            </div>

            {/* 인벤토리 버튼 */}
            <div className="hero-card hero-card-blue">
              <div className="p-6 text-center">
                <h3 className="text-xl font-bold hero-text-primary mb-4">
                  📦 인벤토리
                </h3>
                <p className="hero-text-secondary mb-4 text-sm">
                  보유한 아이템을 관리하세요
                </p>
                <div className="flex items-center justify-center mb-2">
                  <span className="hero-text-accent font-bold text-lg">
                    {gameState.inventory.length}
                  </span>
                  <span className="hero-text-secondary ml-1">개 아이템</span>
                </div>
                <button
                  onClick={() => setShowInventoryModal(true)}
                  className="hero-btn hero-btn-primary w-full"
                >
                  인벤토리 열기
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 모달들 */}
      {showBattleModal && currentBoss && (
        <BattleModal
          isVisible={showBattleModal}
          boss={currentBoss}
          onClose={handleBattleClose}
          onVictory={handleBattleVictory}
          onDefeat={handleBattleDefeat}
        />
      )}

      {showGachaModal && (
        <GachaModal
          isOpen={showGachaModal}
          onClose={() => setShowGachaModal(false)}
          onGachaResult={handleGachaResult}
        />
      )}

      {showInventoryModal && (
        <InventoryModal
          isOpen={showInventoryModal}
          onClose={() => setShowInventoryModal(false)}
        />
      )}

      {showItemSelectionModal && (
        <ItemSelectionModal
          isOpen={showItemSelectionModal}
          onClose={() => setShowItemSelectionModal(false)}
          onSelectItem={handleSelectEnhancementItem}
          title="⚡ 강화할 아이템 선택"
          description="강화할 아이템을 선택하세요"
        />
      )}

      <InheritanceModal
        isVisible={showInheritanceModal}
        onClose={() => setShowInheritanceModal(false)}
      />

      <GachaResultModal
        result={currentGachaResult}
        isOpen={showGachaResultModal}
        onClose={() => {
          setShowGachaResultModal(false);
          setCurrentGachaResult(null);
        }}
      />

      <ClientOnly>
        <EnhancementModal
          item={enhancementItem}
          isOpen={showEnhancementModal}
          onClose={() => {
            setShowEnhancementModal(false);
            setEnhancementItem(null);
          }}
        />
      </ClientOnly>
    </div>
  );
}
