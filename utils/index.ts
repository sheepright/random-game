/**
 * Main utils export file
 */

export * from "./gameStorage";
export * from "./equipmentManager";
export * from "./gameMigration";
export * from "./itemDropSystem";
export * from "./inventoryManager";
export * from "./inheritanceSystem";
export * from "./battleSystem";

// gameCalculations에서 선택적 export
export {
  calculateOfflineCredits,
  isValidGameState,
  calculateTotalStats,
  formatDuration,
  formatNumber,
} from "./gameCalculations";

// stageManager에서 모든 함수 export
export * from "./stageManager";
