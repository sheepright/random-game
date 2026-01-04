/**
 * Game state persistence utilities
 * Handles localStorage operations with error handling and data validation
 * Enhanced with multiple storage mechanisms for maximum reliability
 * Requirements: 4.1, 4.2, 4.4, 4.5
 */

import { GameState } from "../types/game";
import { STORAGE_KEY } from "../constants/game";
import {
  migrateGameState,
  isValidGameState,
  performSafeMigration,
} from "./gameMigration";

export interface StorageResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// 다중 저장소 키들
const STORAGE_KEYS = {
  primary: STORAGE_KEY,
  backup: `${STORAGE_KEY}_backup`,
  emergency: `${STORAGE_KEY}_emergency`,
  lastSave: `${STORAGE_KEY}_last_save_time`,
} as const;

/**
 * Enhanced save with multiple storage locations and error recovery
 */
export function saveGameState(gameState: any): StorageResult<void> {
  try {
    let stateToSave: GameState;

    // Check if the state is valid, if not, try to migrate it
    if (isValidGameState(gameState)) {
      stateToSave = gameState;
    } else {
      // Attempt to migrate the state if it's not valid
      try {
        stateToSave = migrateGameState(gameState);
      } catch (migrationError) {
        return {
          success: false,
          error: `Failed to migrate game state: ${
            migrationError instanceof Error
              ? migrationError.message
              : "Unknown error"
          }`,
        };
      }
    }

    // Create a clean copy with updated timestamp
    const finalState: GameState = {
      ...stateToSave,
      lastSaveTime: Date.now(),
    };

    const serializedState = JSON.stringify(finalState);
    const saveTime = Date.now().toString();

    // 다중 저장 전략: 주 저장소, 백업, 비상 저장소에 모두 저장
    const saveOperations = [
      () => localStorage.setItem(STORAGE_KEYS.primary, serializedState),
      () => localStorage.setItem(STORAGE_KEYS.backup, serializedState),
      () => localStorage.setItem(STORAGE_KEYS.emergency, serializedState),
      () => localStorage.setItem(STORAGE_KEYS.lastSave, saveTime),
    ];

    let successCount = 0;
    let lastError: Error | null = null;

    // 각 저장소에 순차적으로 저장 시도
    for (const saveOp of saveOperations) {
      try {
        saveOp();
        successCount++;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Unknown error");
        console.warn("Storage operation failed:", lastError.message);
      }
    }

    // 최소 하나의 저장소에라도 성공했으면 성공으로 간주
    if (successCount > 0) {
      return { success: true };
    } else {
      return {
        success: false,
        error: lastError?.message || "All storage operations failed",
      };
    }
  } catch (error) {
    // Handle localStorage errors (quota exceeded, unavailable, etc.)
    const errorMessage =
      error instanceof Error ? error.message : "Unknown storage error";
    console.warn("Failed to save game state:", errorMessage);

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Enhanced load with fallback to backup storage locations
 */
export function loadGameState(): StorageResult<GameState> {
  try {
    // Check if localStorage is available
    if (typeof localStorage === "undefined") {
      return {
        success: false,
        error: "localStorage is not available",
      };
    }

    // 저장소 우선순위: 주 저장소 -> 백업 -> 비상 저장소
    const storageKeys = [
      STORAGE_KEYS.primary,
      STORAGE_KEYS.backup,
      STORAGE_KEYS.emergency,
    ];

    let lastError: Error | null = null;

    for (const storageKey of storageKeys) {
      try {
        const savedState = localStorage.getItem(storageKey);

        if (!savedState) {
          continue; // 다음 저장소 시도
        }

        // Parse the saved state
        const parsedState = JSON.parse(savedState);

        // Perform safe migration with backup and error handling
        const migratedState = performSafeMigration(parsedState);

        // Validate the migrated state
        if (!isValidGameState(migratedState)) {
          console.warn(`Invalid state in ${storageKey}, trying next storage`);
          continue;
        }

        // 성공적으로 로드된 경우, 다른 저장소들도 업데이트
        if (storageKey !== STORAGE_KEYS.primary) {
          console.log(`Loaded from ${storageKey}, updating other storages`);
          saveGameState(migratedState);
        }

        return {
          success: true,
          data: migratedState,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Unknown error");
        console.warn(`Failed to load from ${storageKey}:`, lastError.message);
        continue;
      }
    }

    // 모든 저장소에서 로드 실패
    console.warn("All storage locations failed, clearing corrupted data");
    clearGameState();

    return {
      success: false,
      error: lastError?.message || "No valid save data found in any storage",
    };
  } catch (error) {
    // Handle JSON parsing errors or other exceptions
    const errorMessage =
      error instanceof Error ? error.message : "Unknown loading error";
    console.warn("Failed to load game state:", errorMessage);

    // Clear corrupted data
    clearGameState();

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Clear all saved game state from all storage locations
 */
export function clearGameState(): StorageResult<void> {
  try {
    const keysToRemove = Object.values(STORAGE_KEYS);
    let successCount = 0;

    for (const key of keysToRemove) {
      try {
        localStorage.removeItem(key);
        successCount++;
      } catch (error) {
        console.warn(`Failed to remove ${key}:`, error);
      }
    }

    return { success: successCount > 0 };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Check if localStorage is available and functional
 */
export function isStorageAvailable(): boolean {
  try {
    if (typeof localStorage === "undefined") {
      return false;
    }

    // Test localStorage functionality
    const testKey = "__storage_test__";
    localStorage.setItem(testKey, "test");
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get storage usage information for all storage locations
 */
export function getStorageInfo(): {
  used: number;
  available: boolean;
  storageStatus: Record<string, boolean>;
} {
  try {
    if (!isStorageAvailable()) {
      return {
        used: 0,
        available: false,
        storageStatus: {},
      };
    }

    let totalUsed = 0;
    const storageStatus: Record<string, boolean> = {};

    for (const [name, key] of Object.entries(STORAGE_KEYS)) {
      try {
        const savedState = localStorage.getItem(key);
        if (savedState) {
          totalUsed += new Blob([savedState]).size;
          storageStatus[name] = true;
        } else {
          storageStatus[name] = false;
        }
      } catch {
        storageStatus[name] = false;
      }
    }

    return { used: totalUsed, available: true, storageStatus };
  } catch {
    return { used: 0, available: false, storageStatus: {} };
  }
}

/**
 * Force save with retry mechanism
 */
export function forceSaveWithRetry(
  gameState: GameState,
  maxRetries: number = 3
): StorageResult<void> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const result = saveGameState(gameState);

    if (result.success) {
      if (attempt > 1) {
        console.log(`Save succeeded on attempt ${attempt}`);
      }
      return result;
    }

    lastError = new Error(result.error || "Unknown error");
    console.warn(`Save attempt ${attempt} failed:`, lastError.message);

    // 재시도 전 잠시 대기
    if (attempt < maxRetries) {
      // 동기적 대기 (간단한 구현)
      const start = Date.now();
      while (Date.now() - start < 100) {
        // 100ms 대기
      }
    }
  }

  return {
    success: false,
    error: `All ${maxRetries} save attempts failed. Last error: ${lastError?.message}`,
  };
}
