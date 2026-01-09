"use client";

import { useEffect } from "react";
import { useGame } from "../contexts/GameContext";
import { ItemGrade, ItemType } from "../types/game";

// 개발자 콘솔용 전역 함수들을 정의
declare global {
  interface Window {
    crackMode?: () => void;
    addCredits?: (amount: number) => void;
    showCommands?: () => void;
    addMythicItem?: (type?: string) => void;
    resetGame?: () => void;
  }
}

export default function DevConsole() {
  const { actions } = useGame();

  useEffect(() => {
    // 전역 함수들을 window 객체에 추가
    window.crackMode = () => {
      actions.enableCrackMode();
    };

    window.addCredits = (amount: number) => {
      if (typeof amount !== "number" || amount <= 0) {
        console.error("❌ 올바른 숫자를 입력하세요. 예: addCredits(1000000)");
        return;
      }
      actions.addTestCredits(amount);
    };

    window.addMythicItem = (type?: string) => {
      // 간단한 신화 아이템 생성
      const itemTypes = Object.values(ItemType);
      let selectedType: ItemType;

      if (type) {
        const upperType = type.toUpperCase();
        selectedType =
          itemTypes.find((t) => t.toUpperCase() === upperType) ||
          ItemType.MAIN_WEAPON;
      } else {
        selectedType = itemTypes[Math.floor(Math.random() * itemTypes.length)];
      }

      // 간단한 신화 아이템 생성
      const mythicItem = {
        id: `mythic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: selectedType,
        grade: ItemGrade.MYTHIC,
        baseStats: {
          attack: 100,
          defense: 100,
          defensePenetration: 50,
          additionalAttackChance: 0.1,
          creditPerSecondBonus: 10,
          criticalDamageMultiplier: 0.5,
          criticalChance: 0.1,
        },
        enhancedStats: {
          attack: 0,
          defense: 0,
          defensePenetration: 0,
          additionalAttackChance: 0,
          creditPerSecondBonus: 0,
          criticalDamageMultiplier: 0,
          criticalChance: 0,
        },
        level: 1,
        enhancementLevel: 0,
        imagePath: `/Items/${selectedType}.png`,
      };

      actions.addItemToInventory(mythicItem);
      console.log(
        `🌟 신화 등급 ${selectedType} 아이템이 인벤토리에 추가되었습니다!`
      );
    };

    window.resetGame = () => {
      if (
        confirm(
          "⚠️ 정말로 게임을 초기화하시겠습니까? 모든 진행상황이 삭제됩니다!"
        )
      ) {
        localStorage.clear();
        window.location.reload();
        console.log("🔄 게임이 초기화되었습니다.");
      }
    };

    window.showCommands = () => {
      console.log(`
🎮 개발자 콘솔 명령어 목록:

💰 크레딧 관련:
• crackMode()                    - 크랙모드 활성화 (크레딧 999,999,999 지급)
• addCredits(숫자)               - 원하는 만큼 크레딧 추가

🎁 아이템 관련:
• addMythicItem()                - 랜덤 신화 아이템 추가
• addMythicItem("helmet")        - 특정 타입 신화 아이템 추가

🎯 게임 관리:
• resetGame()                    - 게임 완전 초기화

📋 기타:
• showCommands()                 - 이 도움말 표시

💡 사용 예시:
• crackMode()                    - 즉시 대량 크레딧 지급
• addCredits(1000000)            - 100만 크레딧 추가
• addMythicItem("helmet")        - 신화 헬멧 추가
• addMythicItem("main_weapon")   - 신화 무기 추가

⚠️ 주의사항:
• 이 기능은 테스트 목적으로만 사용하세요
• 게임 밸런스가 깨질 수 있습니다
• 저장된 게임에 영향을 줍니다
      `);
    };

    // 초기 안내 메시지
    console.log(`
🎮 IdleWarrior 개발자 콘솔이 활성화되었습니다!

💡 사용법:
콘솔에서 showCommands() 를 입력하여 사용 가능한 명령어를 확인하세요.

🚀 빠른 시작:
• crackMode()           - 테스트용 크랙모드 활성화
• addMythicItem()       - 신화 아이템 추가
• showCommands()        - 전체 명령어 목록
    `);

    // 컴포넌트 언마운트 시 정리
    return () => {
      if (window.crackMode) delete window.crackMode;
      if (window.addCredits) delete window.addCredits;
      if (window.showCommands) delete window.showCommands;
      if (window.addMythicItem) delete window.addMythicItem;
      if (window.resetGame) delete window.resetGame;
    };
  }, [actions]);

  // 이 컴포넌트는 UI를 렌더링하지 않음
  return null;
}
