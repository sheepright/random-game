"use client";

import { useGame } from "../contexts/GameContext";
import { Item, ItemType, ItemGrade } from "../types/game";
import { EquipmentSlotImage } from "./ResponsiveItemImage";

/**
 * EquipmentPanel 컴포넌트
 * 11개 장비 슬롯을 시각적으로 표시하고 장착/해제 인터페이스 제공
 * Requirements: 9.3
 */

// 슬롯 타입별 아이콘
const getSlotIcon = (slotType: ItemType): string => {
  const icons = {
    [ItemType.HELMET]: "🪖",
    [ItemType.ARMOR]: "🛡️",
    [ItemType.PANTS]: "👖",
    [ItemType.GLOVES]: "🧤",
    [ItemType.SHOES]: "👟",
    [ItemType.SHOULDER]: "🎽",
    [ItemType.EARRING]: "💎",
    [ItemType.RING]: "💍",
    [ItemType.NECKLACE]: "📿",
    [ItemType.MAIN_WEAPON]: "⚔️",
    [ItemType.SUB_WEAPON]: "🛡️",
  };
  return icons[slotType] || "❓";
};

interface EquipmentSlotProps {
  item: Item | null;
  slotType: ItemType;
  slotName: string;
  onUnequip: (itemType: ItemType) => void;
}

function EquipmentSlot({
  item,
  slotType,
  slotName,
  onUnequip,
}: EquipmentSlotProps) {
  return (
    <div className="flex flex-col items-center space-y-1">
      <div
        className="w-16 h-16 cursor-pointer transition-all hover:shadow-lg hover:scale-105 relative"
        onDoubleClick={() => {
          if (item) {
            onUnequip(slotType);
          }
        }}
        title={
          item
            ? `${item.grade} ${slotName} (레벨 ${item.level}) - 더블클릭으로 해제`
            : `빈 ${slotName} 슬롯`
        }
      >
        {item ? (
          <EquipmentSlotImage item={item} onClick={() => {}} />
        ) : (
          <div className="w-16 h-16 border-2 border-dashed border-gray-400 rounded-lg flex flex-col items-center justify-center bg-transparent">
            <div className="text-lg hero-text-muted mb-0.5">
              {getSlotIcon(slotType)}
            </div>
            <div className="text-xs hero-text-muted text-center">
              {slotName}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function EquipmentPanel() {
  const { gameState, actions } = useGame();

  const handleUnequipItem = (itemType: ItemType) => {
    actions.unequipItem(itemType);
  };

  return (
    <div className="hero-card p-4">
      <h2 className="text-lg font-bold hero-text-primary mb-4 text-center">
        ⚔️ 장비 관리
      </h2>

      {/* 장비 슬롯 그리드 - 컴팩트한 RPG 스타일 레이아웃 */}
      <div className="flex justify-center">
        <div className="grid grid-cols-5 grid-rows-4 gap-2 w-fit">
          {/* 1행: 헬멧 중앙 */}
          <div className="col-start-3 flex justify-center">
            <EquipmentSlot
              item={gameState.equippedItems.helmet}
              slotType={ItemType.HELMET}
              slotName="헬멧"
              onUnequip={handleUnequipItem}
            />
          </div>

          {/* 2행: 귀걸이 - 숄더 - 아머 - 글러브 - 목걸이 */}
          <div className="col-start-1 flex justify-center">
            <EquipmentSlot
              item={gameState.equippedItems.earring}
              slotType={ItemType.EARRING}
              slotName="귀걸이"
              onUnequip={handleUnequipItem}
            />
          </div>
          <div className="col-start-2 flex justify-center">
            <EquipmentSlot
              item={gameState.equippedItems.shoulder}
              slotType={ItemType.SHOULDER}
              slotName="숄더"
              onUnequip={handleUnequipItem}
            />
          </div>
          <div className="col-start-3 flex justify-center">
            <EquipmentSlot
              item={gameState.equippedItems.armor}
              slotType={ItemType.ARMOR}
              slotName="아머"
              onUnequip={handleUnequipItem}
            />
          </div>
          <div className="col-start-4 flex justify-center">
            <EquipmentSlot
              item={gameState.equippedItems.gloves}
              slotType={ItemType.GLOVES}
              slotName="글러브"
              onUnequip={handleUnequipItem}
            />
          </div>
          <div className="col-start-5 flex justify-center">
            <EquipmentSlot
              item={gameState.equippedItems.necklace}
              slotType={ItemType.NECKLACE}
              slotName="목걸이"
              onUnequip={handleUnequipItem}
            />
          </div>

          {/* 3행: 주무기 - 팬츠 - 보조무기 */}
          <div className="col-start-1 flex justify-center">
            <EquipmentSlot
              item={gameState.equippedItems.mainWeapon}
              slotType={ItemType.MAIN_WEAPON}
              slotName="주무기"
              onUnequip={handleUnequipItem}
            />
          </div>
          <div className="col-start-3 flex justify-center">
            <EquipmentSlot
              item={gameState.equippedItems.pants}
              slotType={ItemType.PANTS}
              slotName="팬츠"
              onUnequip={handleUnequipItem}
            />
          </div>
          <div className="col-start-5 flex justify-center">
            <EquipmentSlot
              item={gameState.equippedItems.subWeapon}
              slotType={ItemType.SUB_WEAPON}
              slotName="보조무기"
              onUnequip={handleUnequipItem}
            />
          </div>

          {/* 4행: 반지 - 슈즈 */}
          <div className="col-start-2 flex justify-center">
            <EquipmentSlot
              item={gameState.equippedItems.ring}
              slotType={ItemType.RING}
              slotName="반지"
              onUnequip={handleUnequipItem}
            />
          </div>
          <div className="col-start-3 flex justify-center">
            <EquipmentSlot
              item={gameState.equippedItems.shoes}
              slotType={ItemType.SHOES}
              slotName="슈즈"
              onUnequip={handleUnequipItem}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
