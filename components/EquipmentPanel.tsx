"use client";

import { useGame } from "../contexts/GameContext";
import { Item, ItemType } from "../types/game";
import { EquipmentSlotImage } from "./ResponsiveItemImage";
import ItemTooltip from "./ItemTooltip";

/**
 * EquipmentPanel 컴포넌트
 * 12개 장비 슬롯을 시각적으로 표시하고 장착/해제 인터페이스 제공
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
    [ItemType.PET]: "🐾",
    // 물약 아이콘들
    [ItemType.WEALTH_POTION]: "💰",
    [ItemType.BOSS_POTION]: "⚡",
    [ItemType.ARTISAN_POTION]: "🔨",
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
  const slotContent = (
    <div className="flex flex-col items-center space-y-1 min-w-[80px]">
      <div
        className="w-16 h-16 cursor-pointer transition-all hover:shadow-lg hover:scale-105 relative"
        onDoubleClick={() => {
          if (item) {
            onUnequip(slotType);
          }
        }}
        // title 속성 제거하여 중복 툴팁 방지
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

  // 아이템이 있으면 툴팁으로 감싸고, 없으면 그대로 반환
  return item ? (
    <ItemTooltip item={item} position="auto" delay={300}>
      {slotContent}
    </ItemTooltip>
  ) : (
    slotContent
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

      {/* 장비 슬롯 레이아웃 - 컴팩트한 배치 */}
      <div className="flex justify-center">
        <div className="flex flex-col items-center space-y-3">
          {/* 1행: 귀걸이 - 헬멧 - 목걸이 */}
          <div className="flex justify-center items-center space-x-6">
            <EquipmentSlot
              item={gameState.equippedItems.earring}
              slotType={ItemType.EARRING}
              slotName="귀걸이"
              onUnequip={handleUnequipItem}
            />
            <EquipmentSlot
              item={gameState.equippedItems.helmet}
              slotType={ItemType.HELMET}
              slotName="헬멧"
              onUnequip={handleUnequipItem}
            />
            <EquipmentSlot
              item={gameState.equippedItems.necklace}
              slotType={ItemType.NECKLACE}
              slotName="목걸이"
              onUnequip={handleUnequipItem}
            />
          </div>

          {/* 2행: 숄더 - 아머 - 글러브 */}
          <div className="flex justify-center items-center space-x-6">
            <EquipmentSlot
              item={gameState.equippedItems.shoulder}
              slotType={ItemType.SHOULDER}
              slotName="숄더"
              onUnequip={handleUnequipItem}
            />
            <EquipmentSlot
              item={gameState.equippedItems.armor}
              slotType={ItemType.ARMOR}
              slotName="아머"
              onUnequip={handleUnequipItem}
            />
            <EquipmentSlot
              item={gameState.equippedItems.gloves}
              slotType={ItemType.GLOVES}
              slotName="글러브"
              onUnequip={handleUnequipItem}
            />
          </div>

          {/* 3행: 주무기 - 팬츠 - 보조무기 */}
          <div className="flex justify-center items-center space-x-6">
            <EquipmentSlot
              item={gameState.equippedItems.mainWeapon}
              slotType={ItemType.MAIN_WEAPON}
              slotName="주무기"
              onUnequip={handleUnequipItem}
            />
            <EquipmentSlot
              item={gameState.equippedItems.pants}
              slotType={ItemType.PANTS}
              slotName="팬츠"
              onUnequip={handleUnequipItem}
            />
            <EquipmentSlot
              item={gameState.equippedItems.subWeapon}
              slotType={ItemType.SUB_WEAPON}
              slotName="보조무기"
              onUnequip={handleUnequipItem}
            />
          </div>

          {/* 4행: 반지 - 슈즈 - 펫 */}
          <div className="flex justify-center items-center space-x-6">
            <EquipmentSlot
              item={gameState.equippedItems.ring}
              slotType={ItemType.RING}
              slotName="반지"
              onUnequip={handleUnequipItem}
            />
            <EquipmentSlot
              item={gameState.equippedItems.shoes}
              slotType={ItemType.SHOES}
              slotName="슈즈"
              onUnequip={handleUnequipItem}
            />
            <EquipmentSlot
              item={gameState.equippedItems.pet}
              slotType={ItemType.PET}
              slotName="펫"
              onUnequip={handleUnequipItem}
            />
          </div>

          {/* 5행: 물약 슬롯들 */}
          <div className="flex justify-center items-center space-x-6">
            <EquipmentSlot
              item={gameState.equippedItems.wealthPotion}
              slotType={ItemType.WEALTH_POTION}
              slotName="재물 물약"
              onUnequip={handleUnequipItem}
            />
            <EquipmentSlot
              item={gameState.equippedItems.bossPotion}
              slotType={ItemType.BOSS_POTION}
              slotName="보스 물약"
              onUnequip={handleUnequipItem}
            />
            <EquipmentSlot
              item={gameState.equippedItems.artisanPotion}
              slotType={ItemType.ARTISAN_POTION}
              slotName="장인 물약"
              onUnequip={handleUnequipItem}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
