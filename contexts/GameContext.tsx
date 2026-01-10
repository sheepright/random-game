"use client";

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useState,
  ReactNode,
  useMemo,
  useCallback,
} from "react";
import {
  GameState,
  GameActions,
  OfflineProgress,
  Item,
  ItemType,
  ItemGrade,
  EquippedItems,
  BattleState,
  Boss,
  EnhancementAttempt,
  GachaCategory,
  GachaResult,
  ItemSaleResult,
} from "../types/game";
import {
  getDefaultGameState,
  GAME_LIMITS,
  BASE_CREDIT_PER_SECOND,
  STORAGE_KEY,
} from "../constants/game";
import {
  saveGameState,
  loadGameState,
  forceSaveWithRetry,
} from "../utils/gameStorage";
import { initializeBattle } from "../utils/battleSystem";
import {
  equipItem as performEquipItem,
  unequipItem as performUnequipItem,
  calculatePlayerStatsFromEquipment,
} from "../utils/equipmentManager";
import {
  canProgressToNextStage,
  canAccessStage,
  processBattleVictory,
  loadBossForStage,
} from "../utils/stageManager";
import { performInheritance } from "../utils/inheritanceSystem";
import {
  performEnhancement,
  applyEnhancementResult,
  canEnhanceItem,
  getEnhancementInfo,
  recalculateEnhancedStats,
  MAX_ENHANCEMENT_LEVEL,
} from "../utils/enhancementSystem";
import { performGachaDraw } from "../utils/gachaSystem";
import { processItemSale } from "../utils/itemSaleSystem";
import { performSynthesis } from "../utils/synthesisSystem";

// Game action types for reducer
type GameActionType =
  | { type: "SET_CREDITS"; payload: number }
  | { type: "ADD_CREDITS"; payload: number }
  | { type: "LOAD_GAME_STATE"; payload: GameState }
  | { type: "UPDATE_LAST_SAVE_TIME" }
  | { type: "APPLY_OFFLINE_PROGRESS"; payload: OfflineProgress }
  | { type: "ADD_ITEM_TO_INVENTORY"; payload: Item }
  | { type: "REMOVE_ITEM_FROM_INVENTORY"; payload: string }
  | { type: "EQUIP_ITEM"; payload: { item: Item; previousItem?: Item | null } }
  | {
      type: "UNEQUIP_ITEM";
      payload: { itemType: ItemType; unequippedItem: Item };
    }
  | { type: "UPDATE_PLAYER_STATS"; payload: { equippedItems: EquippedItems } }
  | {
      type: "INHERIT_ITEM";
      payload: { sourceItem: Item; targetItem: Item; inheritedItem: Item };
    }
  | {
      type: "INHERIT_ITEM_FAILED";
      payload: { sourceItem: Item; targetItem: Item };
    }
  | {
      type: "ENHANCE_ITEM";
      payload: {
        originalItem: Item;
        enhancedItem: Item;
        enhancementAttempt: EnhancementAttempt;
      };
    }
  | {
      type: "PERFORM_GACHA_DRAW";
      payload: { gachaResult: GachaResult };
    }
  | {
      type: "PERFORM_SYNTHESIS";
      payload: { synthesizedItem: Item; usedItems: Item[] };
    }
  | {
      type: "SELL_MULTIPLE_ITEMS";
      payload: { saleResult: ItemSaleResult };
    }
  | { type: "START_BATTLE"; payload: { boss: Boss } }
  | { type: "UPDATE_BATTLE_STATE"; payload: BattleState }
  | { type: "END_BATTLE"; payload: { result: "victory" | "defeat" } }
  | { type: "CLEAR_RECENT_STAGE_CLEAR_DROPS" }
  | { type: "SET_STAGE"; payload: number }; // 개발자 모드용 스테이지 변경

// Game context interface
interface GameContextType {
  gameState: GameState;
  actions: GameActions;
}

// Create context
const GameContext = createContext<GameContextType | undefined>(undefined);

// Game state reducer
function gameStateReducer(state: GameState, action: GameActionType): GameState {
  switch (action.type) {
    case "SET_CREDITS":
      return {
        ...state,
        credits: Math.min(action.payload, GAME_LIMITS.MAX_CREDITS),
        lastSaveTime: Date.now(),
      };

    case "ADD_CREDITS":
      return {
        ...state,
        credits: Math.min(
          state.credits + action.payload,
          GAME_LIMITS.MAX_CREDITS
        ),
        lastSaveTime: Date.now(),
      };

    case "LOAD_GAME_STATE":
      return {
        ...action.payload,
        lastSaveTime: Date.now(),
      };

    case "UPDATE_LAST_SAVE_TIME":
      return {
        ...state,
        lastSaveTime: Date.now(),
      };

    case "APPLY_OFFLINE_PROGRESS":
      return {
        ...state,
        credits: Math.min(
          state.credits + action.payload.creditsEarned,
          GAME_LIMITS.MAX_CREDITS
        ),
        lastSaveTime: Date.now(),
      };

    case "ADD_ITEM_TO_INVENTORY":
      return {
        ...state,
        inventory: [...state.inventory, action.payload],
        lastSaveTime: Date.now(),
      };

    case "REMOVE_ITEM_FROM_INVENTORY":
      return {
        ...state,
        inventory: state.inventory.filter((item) => item.id !== action.payload),
        lastSaveTime: Date.now(),
      };

    case "EQUIP_ITEM": {
      const { item, previousItem } = action.payload;

      // 제우스 검은 mainWeapon 슬롯에 장착
      let slotKey: keyof EquippedItems;
      if (item.type === ItemType.ZEUS_SWORD) {
        slotKey = "mainWeapon";
      } else {
        slotKey = item.type as keyof EquippedItems;
      }

      const newEquippedItems: EquippedItems = {
        ...state.equippedItems,
        [slotKey]: item,
      };

      // 이전 아이템이 있었다면 인벤토리에 추가
      let newInventory = state.inventory;
      if (previousItem) {
        newInventory = [...state.inventory, previousItem];
      }

      // 새로운 아이템을 인벤토리에서 제거
      newInventory = newInventory.filter((invItem) => invItem.id !== item.id);

      const newPlayerStats =
        calculatePlayerStatsFromEquipment(newEquippedItems);

      return {
        ...state,
        equippedItems: newEquippedItems,
        inventory: newInventory,
        playerStats: newPlayerStats,
        lastSaveTime: Date.now(),
      };
    }

    case "UNEQUIP_ITEM": {
      const { itemType, unequippedItem } = action.payload;
      const slotKey = itemType as keyof EquippedItems;

      const newEquippedItems: EquippedItems = {
        ...state.equippedItems,
        [slotKey]: null,
      };

      const newInventory = [...state.inventory, unequippedItem];
      const newPlayerStats =
        calculatePlayerStatsFromEquipment(newEquippedItems);

      return {
        ...state,
        equippedItems: newEquippedItems,
        inventory: newInventory,
        playerStats: newPlayerStats,
        lastSaveTime: Date.now(),
      };
    }

    case "UPDATE_PLAYER_STATS": {
      const { equippedItems } = action.payload;
      const newPlayerStats = calculatePlayerStatsFromEquipment(equippedItems);

      return {
        ...state,
        playerStats: newPlayerStats,
        lastSaveTime: Date.now(),
      };
    }

    case "INHERIT_ITEM": {
      const { sourceItem, targetItem, inheritedItem } = action.payload;

      // Remove source item from inventory or equipped items
      let newEquippedItems = { ...state.equippedItems };
      let newInventory = [...state.inventory];

      // Check if source item is equipped
      const sourceSlotKey = sourceItem.type as keyof EquippedItems;
      if (newEquippedItems[sourceSlotKey]?.id === sourceItem.id) {
        newEquippedItems[sourceSlotKey] = null;
      } else {
        newInventory = newInventory.filter((item) => item.id !== sourceItem.id);
      }

      // Update target item with inherited item
      const targetSlotKey = targetItem.type as keyof EquippedItems;
      if (newEquippedItems[targetSlotKey]?.id === targetItem.id) {
        newEquippedItems[targetSlotKey] = inheritedItem;
      } else {
        newInventory = newInventory.map((item) =>
          item.id === targetItem.id ? inheritedItem : item
        );
      }

      const newPlayerStats =
        calculatePlayerStatsFromEquipment(newEquippedItems);

      return {
        ...state,
        equippedItems: newEquippedItems,
        inventory: newInventory,
        playerStats: newPlayerStats,
        lastSaveTime: Date.now(),
      };
    }

    case "INHERIT_ITEM_FAILED": {
      const { sourceItem, targetItem } = action.payload;

      // 계승 실패 시 소스 아이템만 제거 (파괴)
      let newEquippedItems = { ...state.equippedItems };
      let newInventory = [...state.inventory];

      // Check if source item is equipped
      const sourceSlotKey = sourceItem.type as keyof EquippedItems;
      if (newEquippedItems[sourceSlotKey]?.id === sourceItem.id) {
        newEquippedItems[sourceSlotKey] = null;
      } else {
        newInventory = newInventory.filter((item) => item.id !== sourceItem.id);
      }

      const newPlayerStats =
        calculatePlayerStatsFromEquipment(newEquippedItems);

      return {
        ...state,
        equippedItems: newEquippedItems,
        inventory: newInventory,
        playerStats: newPlayerStats,
        lastSaveTime: Date.now(),
      };
    }

    case "ENHANCE_ITEM": {
      const { originalItem, enhancedItem, enhancementAttempt } = action.payload;

      // 크레딧 차감
      const newCredits = Math.max(
        0,
        state.credits - enhancementAttempt.costPaid
      );

      // 아이템 파괴 시 완전히 제거
      if (enhancementAttempt.result === "destruction") {
        let newEquippedItems = { ...state.equippedItems };
        let newInventory = [...state.inventory];

        const itemSlotKey = originalItem.type as keyof EquippedItems;
        if (newEquippedItems[itemSlotKey]?.id === originalItem.id) {
          // 장착된 아이템 제거
          newEquippedItems[itemSlotKey] = null;
        } else {
          // 인벤토리에서 아이템 제거
          newInventory = newInventory.filter(
            (item) => item.id !== originalItem.id
          );
        }

        const newPlayerStats =
          calculatePlayerStatsFromEquipment(newEquippedItems);

        return {
          ...state,
          credits: newCredits,
          equippedItems: newEquippedItems,
          inventory: newInventory,
          playerStats: newPlayerStats,
          lastSaveTime: Date.now(),
        };
      }

      // 파괴가 아닌 경우 기존 로직 유지
      let newEquippedItems = { ...state.equippedItems };
      let newInventory = [...state.inventory];

      const itemSlotKey = originalItem.type as keyof EquippedItems;
      if (newEquippedItems[itemSlotKey]?.id === originalItem.id) {
        // 장착된 아이템 업데이트
        newEquippedItems[itemSlotKey] = enhancedItem;
      } else {
        // 인벤토리 아이템 업데이트
        newInventory = newInventory.map((item) =>
          item.id === originalItem.id ? enhancedItem : item
        );
      }

      const newPlayerStats =
        calculatePlayerStatsFromEquipment(newEquippedItems);

      return {
        ...state,
        credits: newCredits,
        equippedItems: newEquippedItems,
        inventory: newInventory,
        playerStats: newPlayerStats,
        lastSaveTime: Date.now(),
      };
    }

    case "PERFORM_GACHA_DRAW": {
      const { gachaResult } = action.payload;

      // 크레딧 차감 및 아이템 인벤토리 추가
      const newCredits = Math.max(0, state.credits - gachaResult.cost);
      const newInventory = [...state.inventory, gachaResult.item];

      return {
        ...state,
        credits: newCredits,
        inventory: newInventory,
        lastSaveTime: Date.now(),
      };
    }

    case "PERFORM_SYNTHESIS": {
      const { synthesizedItem, usedItems } = action.payload;

      // 사용된 아이템들을 인벤토리에서 제거
      const usedItemIds = usedItems.map((item) => item.id);
      const newInventory = [
        ...state.inventory.filter((item) => !usedItemIds.includes(item.id)),
        synthesizedItem,
      ];

      return {
        ...state,
        inventory: newInventory,
        lastSaveTime: Date.now(),
      };
    }

    case "SELL_MULTIPLE_ITEMS": {
      const { saleResult } = action.payload;

      if (!saleResult.success) {
        return state; // 판매 실패 시 상태 변경 없음
      }

      // 크레딧 추가
      const newCredits = Math.min(
        state.credits + saleResult.credits,
        GAME_LIMITS.MAX_CREDITS
      );

      // 판매된 아이템들을 인벤토리에서 제거
      const soldItemIds = saleResult.soldItems.map((item) => item.id);
      const newInventory = state.inventory.filter(
        (item) => !soldItemIds.includes(item.id)
      );

      return {
        ...state,
        credits: newCredits,
        inventory: newInventory,
        lastSaveTime: Date.now(),
      };
    }

    case "START_BATTLE": {
      const { boss } = action.payload;
      const newBattleState = initializeBattle(boss, state.playerStats);

      return {
        ...state,
        battleState: newBattleState,
        lastSaveTime: Date.now(),
      };
    }

    case "UPDATE_BATTLE_STATE": {
      return {
        ...state,
        battleState: action.payload,
        lastSaveTime: Date.now(),
      };
    }

    case "END_BATTLE": {
      const { result } = action.payload;

      // 승리 시 다음 스테이지 해금 및 크레딧 생성률 증가, 아이템 드랍, 크레딧 보상
      if (result === "victory" && state.battleState) {
        const victoryResult = processBattleVictory(
          state.currentStage,
          BASE_CREDIT_PER_SECOND // 기본 크레딧 생성률 사용
        );

        // 드랍된 아이템들을 인벤토리에 추가
        const newInventory = [
          ...state.inventory,
          ...victoryResult.droppedItems,
        ];

        return {
          ...state,
          credits: state.credits + victoryResult.creditReward, // 즉시 크레딧 보상 추가
          currentStage: victoryResult.newStage,
          creditPerSecond: victoryResult.newCreditRate,
          inventory: newInventory,
          battleState: null,
          recentStageClearDrops: {
            items: victoryResult.droppedItems,
            stageNumber: state.currentStage,
            creditReward: victoryResult.creditReward,
            timestamp: Date.now(),
          },
          isGameComplete: victoryResult.isGameComplete || false, // 게임 완료 상태 추가
          lastSaveTime: Date.now(),
        };
      }

      return {
        ...state,
        battleState: null,
        lastSaveTime: Date.now(),
      };
    }

    case "CLEAR_RECENT_STAGE_CLEAR_DROPS":
      return {
        ...state,
        recentStageClearDrops: null,
        lastSaveTime: Date.now(),
      };

    case "SET_STAGE":
      return {
        ...state,
        currentStage: Math.max(
          1,
          Math.min(action.payload, GAME_LIMITS.MAX_STAGE)
        ),
        isGameComplete: action.payload >= GAME_LIMITS.MAX_STAGE,
        lastSaveTime: Date.now(),
      };

    default:
      return state;
  }
}

// Game Provider component
interface GameProviderProps {
  children: ReactNode;
}

export function GameProvider({ children }: GameProviderProps) {
  const [gameState, dispatch] = useReducer(
    gameStateReducer,
    getDefaultGameState()
  );
  const [lastOfflineProgress, setLastOfflineProgress] =
    useState<OfflineProgress | null>(null);
  const [isClient, setIsClient] = useState(false);

  // 클라이언트 사이드에서만 실행되도록 설정
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Game actions implementation with memoization and performance optimization
  const actions: GameActions = useMemo(
    () => ({
      addCredits: (amount: number): void => {
        dispatch({ type: "ADD_CREDITS", payload: amount });
      },

      enableCrackMode: (): void => {
        console.log("🚀 크랙모드 활성화! 테스트용 크레딧 999,999,999 지급!");
        dispatch({ type: "ADD_CREDITS", payload: 999999999 });
      },

      addTestCredits: (amount: number): void => {
        console.log(`💰 테스트 크레딧 ${amount.toLocaleString()} 지급!`);
        dispatch({ type: "ADD_CREDITS", payload: amount });
      },

      saveGame: (): void => {
        const result = forceSaveWithRetry(gameState, 3);
        if (!result.success) {
          console.warn("Failed to save game after retries:", result.error);
          // 사용자에게 알림을 표시할 수 있음
        } else {
          console.log("Game saved successfully");
        }
      },

      loadGame: (): GameState | null => {
        const result = loadGameState();
        if (result.success && result.data) {
          return result.data;
        } else {
          console.warn("Failed to load game:", result.error);
          return null;
        }
      },

      calculateOfflineProgress: (): OfflineProgress => {
        const now = Date.now();
        const lastSave = gameState.lastSaveTime || now;
        const elapsedMs = Math.max(0, now - lastSave);
        const elapsedHours = elapsedMs / (1000 * 60 * 60);

        // Cap offline progress to maximum 24 hours as per requirements
        const cappedHours = Math.min(elapsedHours, 24);
        const elapsedSeconds = cappedHours * 3600;

        // Calculate credits earned based on current credit per second rate
        const creditsEarned = Math.floor(
          elapsedSeconds * gameState.creditPerSecond
        );

        // Ensure we don't exceed maximum credits
        const maxPossibleCredits = Math.max(
          0,
          GAME_LIMITS.MAX_CREDITS - gameState.credits
        );
        const actualCreditsEarned = Math.min(creditsEarned, maxPossibleCredits);

        return {
          elapsedTime: cappedHours,
          creditsEarned: actualCreditsEarned,
          maxOfflineHours: 24,
        };
      },

      getLastOfflineProgress: (): OfflineProgress | null => {
        return lastOfflineProgress;
      },

      addItemToInventory: (item: Item): void => {
        dispatch({ type: "ADD_ITEM_TO_INVENTORY", payload: item });
      },

      removeItemFromInventory: (itemId: string): void => {
        dispatch({ type: "REMOVE_ITEM_FROM_INVENTORY", payload: itemId });
      },

      // 새로운 장비 관리 메서드들
      equipItem: (item: Item): boolean => {
        const equipResult = performEquipItem(item, gameState.equippedItems);

        if (!equipResult.success) {
          console.warn("Failed to equip item:", equipResult.error);
          return false;
        }

        dispatch({
          type: "EQUIP_ITEM",
          payload: {
            item,
            previousItem: equipResult.previousItem,
          },
        });

        return true;
      },

      unequipItem: (itemType: ItemType): Item | null => {
        const unequipResult = performUnequipItem(
          itemType,
          gameState.equippedItems
        );

        if (!unequipResult.success) {
          console.warn("Failed to unequip item:", unequipResult.error);
          return null;
        }

        dispatch({
          type: "UNEQUIP_ITEM",
          payload: {
            itemType,
            unequippedItem: unequipResult.unequippedItem!,
          },
        });

        return unequipResult.unequippedItem!;
      },

      updatePlayerStats: (): void => {
        dispatch({
          type: "UPDATE_PLAYER_STATS",
          payload: {
            equippedItems: gameState.equippedItems,
          },
        });
      },

      inheritItem: (sourceItem: Item, targetItem: Item): boolean => {
        const inheritanceResult = performInheritance(sourceItem, targetItem);

        if (!inheritanceResult.success) {
          console.warn("Failed to inherit item:", inheritanceResult.error);

          // 계승 실패 시에도 소스 아이템 제거 (파괴)
          dispatch({
            type: "INHERIT_ITEM_FAILED",
            payload: {
              sourceItem,
              targetItem,
            },
          });

          return false;
        }

        // 계승된 아이템의 강화 등급에 따른 스탯 재계산
        const inheritedItemWithRecalculatedStats = recalculateEnhancedStats(
          inheritanceResult.inheritedItem!
        );

        dispatch({
          type: "INHERIT_ITEM",
          payload: {
            sourceItem,
            targetItem,
            inheritedItem: inheritedItemWithRecalculatedStats,
          },
        });

        return true;
      },

      enhanceItem: (
        item: Item,
        useDestructionPrevention: boolean = false
      ): EnhancementAttempt => {
        console.log("enhanceItem 호출됨:", item);
        console.log("현재 크레딧:", gameState.credits);

        if (!item) {
          throw new Error("아이템이 존재하지 않습니다.");
        }

        if (!canEnhanceItem(item, gameState.credits)) {
          const enhancementInfo =
            item.enhancementLevel < MAX_ENHANCEMENT_LEVEL
              ? getEnhancementInfo(item)
              : null;

          if (item.enhancementLevel >= MAX_ENHANCEMENT_LEVEL) {
            throw new Error("이미 최대 강화 레벨에 도달했습니다.");
          } else if (
            enhancementInfo &&
            gameState.credits < enhancementInfo.cost
          ) {
            throw new Error(
              `크레딧이 부족합니다. 필요: ${enhancementInfo.cost}, 보유: ${gameState.credits}`
            );
          } else {
            throw new Error("강화할 수 없습니다.");
          }
        }

        try {
          const enhancementAttempt = performEnhancement(
            item,
            gameState.credits,
            useDestructionPrevention
          );
          console.log("강화 시도 결과:", enhancementAttempt);

          const enhancedItem = applyEnhancementResult(item, enhancementAttempt);
          console.log("강화된 아이템:", enhancedItem);

          dispatch({
            type: "ENHANCE_ITEM",
            payload: {
              originalItem: item,
              enhancedItem,
              enhancementAttempt,
            },
          });

          return enhancementAttempt;
        } catch (error) {
          console.error("강화 처리 중 오류:", error);
          throw error;
        }
      },

      performGachaDraw: (category: GachaCategory): GachaResult => {
        const gachaResult = performGachaDraw(category, gameState.credits);

        if (!gachaResult.success) {
          throw new Error(gachaResult.error || "가챠 뽑기에 실패했습니다.");
        }

        dispatch({
          type: "PERFORM_GACHA_DRAW",
          payload: { gachaResult: gachaResult.result! },
        });

        return gachaResult.result!;
      },

      performSynthesis: (
        grade: ItemGrade
      ): { success: boolean; synthesizedItem?: Item; error?: string } => {
        const allItems = [...gameState.inventory];
        const synthesisResult = performSynthesis(allItems, grade);

        if (!synthesisResult.success) {
          return {
            success: false,
            error: synthesisResult.error,
          };
        }

        dispatch({
          type: "PERFORM_SYNTHESIS",
          payload: {
            synthesizedItem: synthesisResult.synthesizedItem!,
            usedItems: synthesisResult.usedItems!,
          },
        });

        return {
          success: true,
          synthesizedItem: synthesisResult.synthesizedItem!,
        };
      },

      sellMultipleItems: (items: Item[]): ItemSaleResult => {
        const saleResult = processItemSale(items, gameState.equippedItems);

        if (!saleResult.success) {
          console.warn("아이템 판매 실패:", saleResult.error);
          return saleResult;
        }

        dispatch({
          type: "SELL_MULTIPLE_ITEMS",
          payload: { saleResult },
        });

        return saleResult;
      },

      // 전투 시스템 관련 액션들
      startBattle: (boss: Boss): void => {
        dispatch({ type: "START_BATTLE", payload: { boss } });
      },

      updateBattleState: (battleState: BattleState): void => {
        dispatch({ type: "UPDATE_BATTLE_STATE", payload: battleState });
      },

      endBattle: (result: "victory" | "defeat"): void => {
        dispatch({ type: "END_BATTLE", payload: { result } });
      },

      // 스테이지 관련 새로운 액션들
      loadBossForCurrentStage: (): Boss | null => {
        return loadBossForStage(gameState.currentStage);
      },

      clearRecentStageClearDrops: (): void => {
        dispatch({ type: "CLEAR_RECENT_STAGE_CLEAR_DROPS" });
      },

      // 개발자 모드용 스테이지 변경
      setStage: (stage: number): void => {
        dispatch({ type: "SET_STAGE", payload: stage });
      },
    }),
    [
      gameState.credits,
      gameState.equippedItems,
      gameState.inventory,
      gameState.currentStage,
      gameState.creditPerSecond,
      lastOfflineProgress,
    ]
  ); // 필요한 의존성만 포함하여 성능 최적화

  // Auto-save effect with cleanup and performance optimization
  useEffect(() => {
    if (!isClient) return; // 클라이언트에서만 실행

    const autoSaveInterval = setInterval(() => {
      actions.saveGame();
    }, 5000); // Auto-save every 5 seconds (더 자주 저장하여 데이터 손실 방지)

    return () => {
      clearInterval(autoSaveInterval);
    };
  }, [isClient]); // isClient 의존성 추가

  // Credit auto-generation effect
  useEffect(() => {
    if (!isClient) return; // 클라이언트에서만 실행

    const creditGenerationInterval = setInterval(() => {
      const totalCreditPerSecond =
        gameState.creditPerSecond + gameState.playerStats.creditPerSecondBonus;
      if (totalCreditPerSecond > 0) {
        dispatch({ type: "ADD_CREDITS", payload: totalCreditPerSecond });
      }
    }, 1000); // 1초마다 크레딧 생성

    return () => {
      clearInterval(creditGenerationInterval);
    };
  }, [
    isClient,
    gameState.creditPerSecond,
    gameState.playerStats.creditPerSecondBonus,
  ]);

  // Load game state on mount with proper cleanup
  useEffect(() => {
    if (!isClient) return; // 클라이언트에서만 실행

    let isMounted = true; // 컴포넌트 마운트 상태 추적

    const loadInitialState = async () => {
      try {
        const savedState = actions.loadGame();
        if (savedState && isMounted) {
          dispatch({ type: "LOAD_GAME_STATE", payload: savedState });

          // Calculate and apply offline progress
          const offlineProgress = actions.calculateOfflineProgress();
          if (offlineProgress.creditsEarned > 0 && isMounted) {
            setLastOfflineProgress(offlineProgress);
            dispatch({
              type: "APPLY_OFFLINE_PROGRESS",
              payload: offlineProgress,
            });

            // Show offline progress to user (could trigger a modal)
            console.log(
              `오프라인 진행: ${offlineProgress.elapsedTime.toFixed(1)}시간, ${
                offlineProgress.creditsEarned
              } 크레딧 획득`
            );
          }
        }
      } catch (error) {
        console.error("게임 상태 로드 중 오류:", error);
      }
    };

    loadInitialState();

    return () => {
      isMounted = false; // 언마운트 시 플래그 설정
    };
  }, [isClient]); // isClient 의존성 추가

  // Save timestamp when page is about to unload with proper cleanup
  useEffect(() => {
    if (!isClient) return; // 클라이언트에서만 실행

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Update last save time before page unloads
      dispatch({ type: "UPDATE_LAST_SAVE_TIME" });

      // 강제 저장 시도 (재시도 포함)
      const result = forceSaveWithRetry(gameState, 2);
      if (!result.success) {
        console.error("Critical: Failed to save game on page unload");
      }

      // 브라우저에 저장 중임을 알림 (선택사항)
      e.preventDefault();
      return (e.returnValue = "게임 데이터를 저장 중입니다...");
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page became hidden, save current state
        dispatch({ type: "UPDATE_LAST_SAVE_TIME" });
        const result = forceSaveWithRetry(gameState, 2);
        if (!result.success) {
          console.warn("Failed to save on visibility change:", result.error);
        }
      }
    };

    const handlePageHide = () => {
      // 페이지가 숨겨질 때 (모바일에서 더 안정적)
      dispatch({ type: "UPDATE_LAST_SAVE_TIME" });
      const result = forceSaveWithRetry(gameState, 2);
      if (!result.success) {
        console.warn("Failed to save on page hide:", result.error);
      }
    };

    // Register event listeners for page unload and visibility change
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("pagehide", handlePageHide);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      // Cleanup event listeners
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("pagehide", handlePageHide);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isClient]); // isClient 의존성 추가

  return (
    <GameContext.Provider value={{ gameState, actions }}>
      {children}
    </GameContext.Provider>
  );
}

// Custom hook to use game context
export function useGame(): GameContextType {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
}
