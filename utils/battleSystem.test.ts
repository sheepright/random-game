/**
 * Battle System utilities tests
 * 보스 전투 시스템 테스트
 */

import { describe, it, expect } from "vitest";
import {
  calculateDamage,
  calculatePlayerMaxHP,
  createBossFromInfo,
  initializeBattle,
  processPlayerAttack,
  processBossAttack,
  checkVictoryCondition,
  checkDefeatCondition,
  simulateBattle,
  getBossForStage,
} from "./battleSystem";
import { PlayerStats, BossInfo, Boss } from "../types/game";

describe("BattleSystem", () => {
  const mockPlayerStats: PlayerStats = {
    attack: 20,
    defense: 10,
    defensePenetration: 5,
    additionalAttackChance: 0,
  };

  const mockBossInfo: BossInfo = {
    name: "테스트 보스",
    maxHP: 100,
    attack: 15,
    defense: 8,
  };

  const mockBoss: Boss = {
    id: "test-boss",
    name: "테스트 보스",
    stage: 1,
    maxHP: 100,
    currentHP: 100,
    attack: 15,
    defense: 8,
  };

  describe("calculateDamage", () => {
    it("should calculate damage correctly with defense penetration", () => {
      const damage = calculateDamage(20, 10, 5);
      expect(damage).toBe(15); // 20 - (10 - 5) = 15
    });

    it("should return minimum 1 damage", () => {
      const damage = calculateDamage(5, 10, 0);
      expect(damage).toBe(1); // 최소 1 데미지
    });

    it("should handle defense penetration exceeding defense", () => {
      const damage = calculateDamage(20, 5, 10);
      expect(damage).toBe(20); // 20 - max(0, 5 - 10) = 20
    });
  });

  describe("calculatePlayerMaxHP", () => {
    it("should calculate player max HP based on defense", () => {
      const maxHP = calculatePlayerMaxHP(mockPlayerStats);
      expect(maxHP).toBe(120); // 100 + 10 * 2 = 120
    });
  });

  describe("createBossFromInfo", () => {
    it("should create boss from boss info", () => {
      const boss = createBossFromInfo(mockBossInfo, 1);
      expect(boss.name).toBe("테스트 보스");
      expect(boss.stage).toBe(1);
      expect(boss.maxHP).toBe(100);
      expect(boss.currentHP).toBe(100);
      expect(boss.attack).toBe(15);
      expect(boss.defense).toBe(8);
      expect(boss.id).toContain("boss_1_");
    });
  });

  describe("initializeBattle", () => {
    it("should initialize battle state correctly", () => {
      const battleState = initializeBattle(mockBoss, mockPlayerStats);

      expect(battleState.boss.name).toBe("테스트 보스");
      expect(battleState.playerHP).toBe(120); // 100 + 10 * 2
      expect(battleState.bossHP).toBe(100);
      expect(battleState.isPlayerTurn).toBe(true);
      expect(battleState.battleResult).toBe("ongoing");
      expect(battleState.battleLog).toHaveLength(1);
      expect(battleState.battleLog[0].type).toBe("battle_start");
    });
  });

  describe("processPlayerAttack", () => {
    it("should process player attack correctly", () => {
      const initialBattleState = initializeBattle(mockBoss, mockPlayerStats);
      const newBattleState = processPlayerAttack(
        initialBattleState,
        mockPlayerStats
      );

      const expectedDamage = calculateDamage(20, 8, 5); // 17 데미지
      expect(newBattleState.bossHP).toBe(100 - expectedDamage);
      expect(newBattleState.isPlayerTurn).toBe(false); // 보스 턴으로 변경
      expect(newBattleState.battleLog).toHaveLength(2);
      expect(newBattleState.battleLog[1].type).toBe("player_attack");
      expect(newBattleState.battleLog[1].damage).toBe(expectedDamage);
    });

    it("should handle victory condition", () => {
      const weakBoss: Boss = { ...mockBoss, maxHP: 1, currentHP: 1 };
      const initialBattleState = initializeBattle(weakBoss, mockPlayerStats);
      const newBattleState = processPlayerAttack(
        initialBattleState,
        mockPlayerStats
      );

      expect(newBattleState.bossHP).toBe(0);
      expect(newBattleState.battleResult).toBe("victory");
      expect(newBattleState.battleLog).toHaveLength(3); // start, attack, victory
      expect(newBattleState.battleLog[2].type).toBe("battle_end");
    });

    it("should not process attack when not player turn", () => {
      const initialBattleState = initializeBattle(mockBoss, mockPlayerStats);
      initialBattleState.isPlayerTurn = false;

      const newBattleState = processPlayerAttack(
        initialBattleState,
        mockPlayerStats
      );
      expect(newBattleState).toBe(initialBattleState); // 상태 변경 없음
    });
  });

  describe("processBossAttack", () => {
    it("should process boss attack correctly", () => {
      const initialBattleState = initializeBattle(mockBoss, mockPlayerStats);
      initialBattleState.isPlayerTurn = false; // 보스 턴으로 설정

      const newBattleState = processBossAttack(
        initialBattleState,
        mockPlayerStats
      );

      const expectedDamage = calculateDamage(15, 10); // 5 데미지
      expect(newBattleState.playerHP).toBe(120 - expectedDamage);
      expect(newBattleState.isPlayerTurn).toBe(true); // 플레이어 턴으로 변경
      expect(newBattleState.battleLog).toHaveLength(2);
      expect(newBattleState.battleLog[1].type).toBe("boss_attack");
      expect(newBattleState.battleLog[1].damage).toBe(expectedDamage);
    });

    it("should handle defeat condition", () => {
      const weakPlayerStats: PlayerStats = {
        attack: 1,
        defense: 0,
        defensePenetration: 0,
        additionalAttackChance: 0,
      };
      const initialBattleState = initializeBattle(mockBoss, weakPlayerStats);
      initialBattleState.playerHP = 1; // 약한 HP로 설정
      initialBattleState.isPlayerTurn = false; // 보스 턴으로 설정

      const newBattleState = processBossAttack(
        initialBattleState,
        weakPlayerStats
      );

      expect(newBattleState.playerHP).toBe(0);
      expect(newBattleState.battleResult).toBe("defeat");
      expect(newBattleState.battleLog).toHaveLength(3); // start, attack, defeat
      expect(newBattleState.battleLog[2].type).toBe("battle_end");
    });
  });

  describe("checkVictoryCondition", () => {
    it("should return true for victory condition", () => {
      const battleState = initializeBattle(mockBoss, mockPlayerStats);
      battleState.bossHP = 0;
      battleState.battleResult = "victory";

      expect(checkVictoryCondition(battleState)).toBe(true);
    });

    it("should return false when boss is not defeated", () => {
      const battleState = initializeBattle(mockBoss, mockPlayerStats);
      battleState.bossHP = 10;
      battleState.battleResult = "ongoing";

      expect(checkVictoryCondition(battleState)).toBe(false);
    });
  });

  describe("checkDefeatCondition", () => {
    it("should return true for defeat condition", () => {
      const battleState = initializeBattle(mockBoss, mockPlayerStats);
      battleState.playerHP = 0;
      battleState.battleResult = "defeat";

      expect(checkDefeatCondition(battleState)).toBe(true);
    });

    it("should return false when player is not defeated", () => {
      const battleState = initializeBattle(mockBoss, mockPlayerStats);
      battleState.playerHP = 50;
      battleState.battleResult = "ongoing";

      expect(checkDefeatCondition(battleState)).toBe(false);
    });
  });

  describe("simulateBattle", () => {
    it("should simulate battle and return result", () => {
      const strongPlayerStats: PlayerStats = {
        attack: 50,
        defense: 20,
        defensePenetration: 10,
        additionalAttackChance: 0,
      };

      const result = simulateBattle(mockBoss, strongPlayerStats);

      expect(result.canWin).toBe(true);
      expect(result.estimatedRounds).toBeGreaterThan(0);
      expect(result.playerSurvivalRate).toBeGreaterThan(0);
    });

    it("should handle weak player scenario", () => {
      const weakPlayerStats: PlayerStats = {
        attack: 1,
        defense: 0,
        defensePenetration: 0,
        additionalAttackChance: 0,
      };

      const result = simulateBattle(mockBoss, weakPlayerStats);

      expect(result.canWin).toBe(false);
      expect(result.playerSurvivalRate).toBe(0);
    });
  });

  describe("getBossForStage", () => {
    it("should return boss for valid stage", () => {
      const boss = getBossForStage(1);
      expect(boss).toBeTruthy();
      expect(boss?.stage).toBe(1);
      expect(boss?.name).toBe("슬라임 킹");
    });

    it("should return null for invalid stage", () => {
      const boss = getBossForStage(999);
      expect(boss).toBeNull();
    });
  });
});
