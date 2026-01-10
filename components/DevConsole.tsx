"use client";

import { useEffect } from "react";
import { useGame } from "../contexts/GameContext";
import { ItemGrade, ItemType } from "../types/game";
import {
  ITEM_BASE_STATS,
  GRADE_BASE_STATS,
  getItemImagePath,
} from "../constants/game";

// 개발자 콘솔용 전역 함수들을 정의
declare global {
  interface Window {
    crackMode?: () => void;
    addCredits?: (amount: number) => void;
    showCommands?: () => void;
    addMythicItem?: (type?: string) => void;
    addZeusSword?: () => void;
    resetGame?: () => void;
    goToStage?: (stage: number) => void; // 스테이지 이동 명령어 추가
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

      // 가챠 시스템과 동일한 방식으로 신화 아이템 생성
      const baseStats = { ...ITEM_BASE_STATS[selectedType] };
      const gradeBaseStats = GRADE_BASE_STATS[ItemGrade.MYTHIC];

      // 랜덤 보너스 (1~5)
      const getRandomBonus = () => 1 + Math.floor(Math.random() * 5);

      // 재물 물약 전용 랜덤 보너스 (등급별 차등 적용)
      const getCreditRandomBonus = (grade: ItemGrade) => {
        switch (grade) {
          case ItemGrade.COMMON:
            return 0; // 1+0=1 (레어 기본값 2 미만)
          case ItemGrade.RARE:
            return Math.floor(Math.random() * 2); // 0~1 → 2~3 (에픽 기본값 4 미만)
          case ItemGrade.EPIC:
            return Math.floor(Math.random() * 4); // 0~3 → 4~7 (전설 기본값 8 미만)
          case ItemGrade.LEGENDARY:
          case ItemGrade.MYTHIC:
            return getRandomBonus(); // 기존 1~5 유지 (문제없음)
          default:
            return 0;
        }
      };

      const finalStats = {
        attack:
          baseStats.attack > 0 ? gradeBaseStats.attack + getRandomBonus() : 0,
        defense:
          baseStats.defense > 0 ? gradeBaseStats.defense + getRandomBonus() : 0,
        defensePenetration:
          baseStats.defensePenetration > 0
            ? gradeBaseStats.defensePenetration + getRandomBonus()
            : 0,
        additionalAttackChance:
          baseStats.additionalAttackChance > 0
            ? gradeBaseStats.additionalAttackChance + getRandomBonus() * 0.001
            : 0,
        creditPerSecondBonus:
          baseStats.creditPerSecondBonus > 0
            ? gradeBaseStats.creditPerSecondBonus +
              getCreditRandomBonus(ItemGrade.MYTHIC)
            : 0,
        criticalDamageMultiplier:
          baseStats.criticalDamageMultiplier > 0
            ? gradeBaseStats.criticalDamageMultiplier + getRandomBonus() * 0.01
            : 0,
        criticalChance:
          baseStats.criticalChance > 0
            ? gradeBaseStats.criticalChance + getRandomBonus() * 0.01
            : 0,
      };

      const mythicItem = {
        id: `mythic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: selectedType,
        grade: ItemGrade.MYTHIC,
        baseStats: finalStats, // 가챠 시스템과 동일하게 변경
        enhancedStats: { ...finalStats }, // 가챠 시스템과 동일하게 변경
        level: 1,
        enhancementLevel: 0,
        imagePath: getItemImagePath(selectedType), // 올바른 이미지 경로 함수 사용
      };

      actions.addItemToInventory(mythicItem);
      console.log(
        `🌟 신화 등급 ${selectedType} 아이템이 인벤토리에 추가되었습니다!`
      );
    };

    window.addZeusSword = () => {
      // 제우스 검 생성
      const zeusSwordStats = ITEM_BASE_STATS[ItemType.ZEUS_SWORD];

      const zeusSword = {
        id: `zeus-sword-dev-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}`,
        type: ItemType.ZEUS_SWORD,
        grade: ItemGrade.DIVINE, // 신급 등급으로 변경
        baseStats: { ...zeusSwordStats },
        enhancedStats: { ...zeusSwordStats },
        level: 1,
        enhancementLevel: 0, // 강화 불가
        imagePath: getItemImagePath(ItemType.ZEUS_SWORD),
      };

      actions.addItemToInventory(zeusSword);
      console.log("⚡ 제우스 검이 인벤토리에 추가되었습니다!");
      console.log("📊 제우스 검 스탯:");
      console.log(`  • 공격력: ${zeusSwordStats.attack.toLocaleString()}`);
      console.log(
        `  • 방어무시: ${zeusSwordStats.defensePenetration.toLocaleString()}`
      );
      console.log(
        `  • 추가타격: ${(zeusSwordStats.additionalAttackChance * 100).toFixed(
          1
        )}%`
      );
      console.log(
        `  • 크리티컬: ${(zeusSwordStats.criticalChance * 100).toFixed(1)}%`
      );
      console.log(
        `  • 크리데미지: ${(
          zeusSwordStats.criticalDamageMultiplier * 100
        ).toFixed(0)}%`
      );
      console.log("🛡️ 주무기 슬롯에 장착 가능하며 강화는 불가능합니다.");
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

    window.goToStage = (stage: number) => {
      if (typeof stage !== "number" || stage < 1 || stage > 100) {
        console.error("❌ 올바른 스테이지 번호를 입력하세요. (1-100)");
        console.log("💡 사용법: goToStage(100)");
        return;
      }

      actions.setStage(stage);
      console.log(`🚀 ${stage}스테이지로 이동했습니다!`);

      if (stage === 100) {
        console.log("🎉 100스테이지! 게임 완료 상태가 됩니다.");
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
• addZeusSword()                 - 제우스 검 획득 (최강 무기)

🎯 게임 관리:
• resetGame()                    - 게임 완전 초기화
• goToStage(숫자)                - 원하는 스테이지로 이동 (1-100)

📋 기타:
• showCommands()                 - 이 도움말 표시

💡 사용 예시:
• crackMode()                    - 즉시 대량 크레딧 지급
• addCredits(1000000)            - 100만 크레딧 추가
• addMythicItem("helmet")        - 신화 헬멧 추가
• addZeusSword()                 - 전설의 제우스 검 획득
• goToStage(100)                 - 100스테이지로 바로 이동

⚡ 제우스 검 특징:
• 공격력: 99,999,999
• 방어무시: 99,999,999  
• 추가타격: 100%
• 크리티컬: 100%
• 크리데미지: 500%
• 강화 불가 (이미 최강)

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
• addZeusSword()        - 전설의 제우스 검 획득
• goToStage(100)        - 100스테이지로 바로 이동
• showCommands()        - 전체 명령어 목록
    `);

    // 컴포넌트 언마운트 시 정리
    return () => {
      if (window.crackMode) delete window.crackMode;
      if (window.addCredits) delete window.addCredits;
      if (window.showCommands) delete window.showCommands;
      if (window.addMythicItem) delete window.addMythicItem;
      if (window.addZeusSword) delete window.addZeusSword;
      if (window.resetGame) delete window.resetGame;
      if (window.goToStage) delete window.goToStage;
    };
  }, [actions]);

  // 이 컴포넌트는 UI를 렌더링하지 않음
  return null;
}
