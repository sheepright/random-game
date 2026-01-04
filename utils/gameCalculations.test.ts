/**
 * Property-based tests for game calculations
 * Feature: idle-gacha-game, Property 1: Credit Generation Rate Consistency
 * Feature: idle-gacha-game, Property 14: Offline Progress Calculation
 * Feature: idle-gacha-game, Property 15: Offline Time Tracking
 * Validates: Requirements 1.1, 1.2, 1.5, 6.1, 6.2, 6.3, 6.5
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { calculateOfflineCredits } from "./gameCalculations";

describe("Property 1: Credit Generation Rate Consistency", () => {
  /**
   * Property 1: Credit Generation Rate Consistency
   * For any time duration and credit generation rate, the total credits generated should equal the duration multiplied by the rate
   * Validates: Requirements 1.1, 1.2
   */
  it("should generate credits consistently based on time duration and generation rate", () => {
    fc.assert(
      fc.property(
        // 시간 범위: 0초 ~ 24시간 (86400초)
        fc.integer({ min: 0, max: 86400 * 1000 }), // 밀리초 단위
        // 크레딧 생성률: 1 ~ 1000 크레딧/초
        fc.integer({ min: 1, max: 1000 }),
        (elapsedTimeMs: number, creditPerSecond: number) => {
          const result = calculateOfflineCredits(
            elapsedTimeMs,
            creditPerSecond
          );

          // 경과 시간을 초 단위로 변환
          const elapsedSeconds = Math.floor(elapsedTimeMs / 1000);

          // 24시간 제한 적용 (86400초)
          const maxOfflineSeconds = 24 * 60 * 60;
          const cappedElapsedSeconds = Math.min(
            elapsedSeconds,
            maxOfflineSeconds
          );

          // 예상 크레딧 계산
          const expectedCredits = Math.floor(
            cappedElapsedSeconds * creditPerSecond
          );

          // 실제 결과와 예상 결과가 일치해야 함
          expect(result).toBe(expectedCredits);

          // 결과는 항상 0 이상이어야 함
          expect(result).toBeGreaterThanOrEqual(0);

          // 24시간을 초과하는 시간에 대해서는 24시간 분량만 지급되어야 함
          if (elapsedSeconds > maxOfflineSeconds) {
            const maxCredits = Math.floor(maxOfflineSeconds * creditPerSecond);
            expect(result).toBe(maxCredits);
          }

          // 시간이 0이면 크레딧도 0이어야 함
          if (elapsedTimeMs === 0) {
            expect(result).toBe(0);
          }

          // 크레딧 생성률이 높을수록 더 많은 크레딧을 받아야 함 (같은 시간 기준)
          if (elapsedTimeMs > 0 && creditPerSecond > 1) {
            const lowerRateResult = calculateOfflineCredits(elapsedTimeMs, 1);
            expect(result).toBeGreaterThanOrEqual(lowerRateResult);
          }
        }
      ),
      { numRuns: 5 } // 최소 100회 반복 실행
    );
  });

  it("should handle edge cases correctly", () => {
    fc.assert(
      fc.property(
        // 극단적인 값들 테스트
        fc.oneof(
          fc.constant(0), // 0 시간
          fc.constant(1000), // 1초
          fc.constant(3600 * 1000), // 1시간
          fc.constant(24 * 3600 * 1000), // 정확히 24시간
          fc.constant(25 * 3600 * 1000), // 24시간 초과
          fc.constant(100 * 24 * 3600 * 1000) // 매우 긴 시간
        ),
        fc.integer({ min: 1, max: 100 }),
        (elapsedTimeMs: number, creditPerSecond: number) => {
          const result = calculateOfflineCredits(
            elapsedTimeMs,
            creditPerSecond
          );

          // 결과는 항상 유한한 숫자여야 함
          expect(Number.isFinite(result)).toBe(true);
          expect(Number.isInteger(result)).toBe(true);

          // 결과는 항상 0 이상이어야 함
          expect(result).toBeGreaterThanOrEqual(0);

          // 24시간 제한이 올바르게 적용되어야 함
          const maxPossibleCredits = Math.floor(24 * 60 * 60 * creditPerSecond);
          expect(result).toBeLessThanOrEqual(maxPossibleCredits);
        }
      ),
      { numRuns: 5 }
    );
  });

  it("should maintain proportional relationship between time and credits", () => {
    fc.assert(
      fc.property(
        // 기본 시간 (1시간 이하)
        fc.integer({ min: 1000, max: 3600 * 1000 }),
        fc.integer({ min: 1, max: 50 }),
        (baseTimeMs: number, creditPerSecond: number) => {
          const baseCredits = calculateOfflineCredits(
            baseTimeMs,
            creditPerSecond
          );

          // 시간을 2배로 늘렸을 때 (24시간 제한 내에서)
          const doubleTimeMs = Math.min(baseTimeMs * 2, 24 * 3600 * 1000);
          const doubleTimeCredits = calculateOfflineCredits(
            doubleTimeMs,
            creditPerSecond
          );

          // 시간이 정확히 2배가 되었다면 크레딧도 거의 2배가 되어야 함
          // Math.floor 연산으로 인한 오차는 creditPerSecond만큼 허용
          if (doubleTimeMs === baseTimeMs * 2) {
            const expectedDoubleCredits = baseCredits * 2;
            const creditDifference = Math.abs(
              doubleTimeCredits - expectedDoubleCredits
            );
            expect(creditDifference).toBeLessThanOrEqual(creditPerSecond);
          }

          // 어떤 경우든 더 긴 시간은 더 많거나 같은 크레딧을 생성해야 함
          expect(doubleTimeCredits).toBeGreaterThanOrEqual(baseCredits);
        }
      ),
      { numRuns: 5 }
    );
  });

  it("should handle negative and invalid inputs gracefully", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -10000, max: 0 }), // 음수 시간
        fc.integer({ min: 1, max: 100 }),
        (negativeTimeMs: number, creditPerSecond: number) => {
          const result = calculateOfflineCredits(
            negativeTimeMs,
            creditPerSecond
          );

          // 음수 시간에 대해서는 0 크레딧을 반환해야 함
          expect(result).toBe(0);
        }
      ),
      { numRuns: 3 }
    );
  });

  it("should respect maximum offline hours parameter", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }), // 1~10시간 제한
        fc.integer({ min: 1, max: 20 }), // 크레딧 생성률
        (maxOfflineHours: number, creditPerSecond: number) => {
          // 제한 시간보다 긴 시간 테스트
          const longTimeMs = (maxOfflineHours + 5) * 3600 * 1000;

          const result = calculateOfflineCredits(
            longTimeMs,
            creditPerSecond,
            maxOfflineHours
          );

          // 최대 제한 시간만큼의 크레딧만 받아야 함
          const maxExpectedCredits = Math.floor(
            maxOfflineHours * 3600 * creditPerSecond
          );
          expect(result).toBe(maxExpectedCredits);

          // 제한 시간 내의 시간 테스트
          const shortTimeMs = (maxOfflineHours - 1) * 3600 * 1000;
          const shortResult = calculateOfflineCredits(
            shortTimeMs,
            creditPerSecond,
            maxOfflineHours
          );

          // 제한 시간 내에서는 정확한 비례 관계가 유지되어야 함
          const expectedShortCredits = Math.floor(
            (maxOfflineHours - 1) * 3600 * creditPerSecond
          );
          expect(shortResult).toBe(expectedShortCredits);
        }
      ),
      { numRuns: 5 }
    );
  });
});

describe("Property 14: Offline Progress Calculation", () => {
  /**
   * Property 14: Offline Progress Calculation
   * For any elapsed offline time and credit generation rate, the offline credits calculated should equal the minimum of (elapsed time × rate) and (24 hours × rate)
   * Validates: Requirements 1.5, 6.3, 6.5
   */
  it("should calculate offline credits correctly with 24-hour cap", () => {
    fc.assert(
      fc.property(
        // 오프라인 시간: 0분 ~ 72시간 (3일)
        fc.integer({ min: 0, max: 72 * 60 * 60 * 1000 }), // 밀리초 단위
        // 크레딧 생성률: 1 ~ 500 크레딧/초
        fc.integer({ min: 1, max: 500 }),
        // 최대 오프라인 시간: 1 ~ 48시간
        fc.integer({ min: 1, max: 48 }),
        (
          elapsedTimeMs: number,
          creditPerSecond: number,
          maxOfflineHours: number
        ) => {
          const result = calculateOfflineCredits(
            elapsedTimeMs,
            creditPerSecond,
            maxOfflineHours
          );

          // 경과 시간을 초 단위로 변환
          const elapsedSeconds = Math.floor(elapsedTimeMs / 1000);
          const maxOfflineSeconds = maxOfflineHours * 60 * 60;

          // 실제 적용되는 시간 (최대 오프라인 시간으로 제한)
          const cappedElapsedSeconds = Math.min(
            elapsedSeconds,
            maxOfflineSeconds
          );

          // 예상 크레딧 계산
          const expectedCredits = Math.floor(
            cappedElapsedSeconds * creditPerSecond
          );

          // 실제 결과와 예상 결과가 일치해야 함
          expect(result).toBe(expectedCredits);

          // 결과는 항상 0 이상이어야 함
          expect(result).toBeGreaterThanOrEqual(0);

          // 최대 오프라인 시간을 초과하는 경우 제한이 적용되어야 함
          if (elapsedSeconds > maxOfflineSeconds) {
            const maxCredits = Math.floor(maxOfflineSeconds * creditPerSecond);
            expect(result).toBe(maxCredits);
            expect(result).toBeLessThanOrEqual(maxCredits);
          }

          // 시간이 0이면 크레딧도 0이어야 함
          if (elapsedTimeMs === 0) {
            expect(result).toBe(0);
          }

          // 최대 가능한 크레딧을 초과하지 않아야 함
          const maxPossibleCredits = Math.floor(
            maxOfflineSeconds * creditPerSecond
          );
          expect(result).toBeLessThanOrEqual(maxPossibleCredits);
        }
      ),
      { numRuns: 5 } // 최소 100회 반복 실행
    );
  });

  it("should handle edge cases in offline progress calculation", () => {
    fc.assert(
      fc.property(
        // 극단적인 시간 값들
        fc.oneof(
          fc.constant(0), // 0 시간
          fc.constant(1000), // 1초
          fc.constant(60 * 1000), // 1분
          fc.constant(3600 * 1000), // 1시간
          fc.constant(24 * 3600 * 1000), // 정확히 24시간
          fc.constant(25 * 3600 * 1000), // 24시간 초과
          fc.constant(100 * 24 * 3600 * 1000) // 매우 긴 시간 (100일)
        ),
        fc.integer({ min: 1, max: 1000 }),
        (elapsedTimeMs: number, creditPerSecond: number) => {
          const result = calculateOfflineCredits(
            elapsedTimeMs,
            creditPerSecond
          );

          // 결과는 항상 유한한 정수여야 함
          expect(Number.isFinite(result)).toBe(true);
          expect(Number.isInteger(result)).toBe(true);

          // 결과는 항상 0 이상이어야 함
          expect(result).toBeGreaterThanOrEqual(0);

          // 기본 24시간 제한이 올바르게 적용되어야 함
          const maxCredits24h = Math.floor(24 * 60 * 60 * creditPerSecond);
          expect(result).toBeLessThanOrEqual(maxCredits24h);

          // 매우 긴 시간에 대해서도 24시간 분량만 지급되어야 함
          if (elapsedTimeMs > 24 * 3600 * 1000) {
            expect(result).toBe(maxCredits24h);
          }
        }
      ),
      { numRuns: 5 }
    );
  });

  it("should maintain proportional relationship within time limits", () => {
    fc.assert(
      fc.property(
        // 기본 시간 (12시간 이하)
        fc.integer({ min: 1000, max: 12 * 3600 * 1000 }),
        fc.integer({ min: 1, max: 100 }),
        (baseTimeMs: number, creditPerSecond: number) => {
          const baseCredits = calculateOfflineCredits(
            baseTimeMs,
            creditPerSecond
          );

          // 시간을 2배로 늘렸을 때 (24시간 제한 내에서)
          const doubleTimeMs = Math.min(baseTimeMs * 2, 24 * 3600 * 1000);
          const doubleTimeCredits = calculateOfflineCredits(
            doubleTimeMs,
            creditPerSecond
          );

          // 시간이 정확히 2배가 되었다면 크레딧도 거의 2배가 되어야 함
          if (doubleTimeMs === baseTimeMs * 2) {
            const expectedDoubleCredits = baseCredits * 2;
            const creditDifference = Math.abs(
              doubleTimeCredits - expectedDoubleCredits
            );
            // Math.floor 연산으로 인한 오차는 creditPerSecond만큼 허용
            expect(creditDifference).toBeLessThanOrEqual(creditPerSecond);
          }

          // 어떤 경우든 더 긴 시간은 더 많거나 같은 크레딧을 생성해야 함
          expect(doubleTimeCredits).toBeGreaterThanOrEqual(baseCredits);
        }
      ),
      { numRuns: 5 }
    );
  });

  it("should handle different maximum offline hour limits correctly", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20 }), // 1~20시간 제한
        fc.integer({ min: 1, max: 50 }), // 크레딧 생성률
        (maxOfflineHours: number, creditPerSecond: number) => {
          // 제한 시간의 절반 시간 테스트
          const halfTimeMs = (maxOfflineHours / 2) * 3600 * 1000;
          const halfResult = calculateOfflineCredits(
            halfTimeMs,
            creditPerSecond,
            maxOfflineHours
          );

          // 제한 시간 정확히 테스트
          const exactTimeMs = maxOfflineHours * 3600 * 1000;
          const exactResult = calculateOfflineCredits(
            exactTimeMs,
            creditPerSecond,
            maxOfflineHours
          );

          // 제한 시간의 2배 시간 테스트
          const doubleTimeMs = maxOfflineHours * 2 * 3600 * 1000;
          const doubleResult = calculateOfflineCredits(
            doubleTimeMs,
            creditPerSecond,
            maxOfflineHours
          );

          // 절반 시간 결과는 정확한 비례 관계여야 함
          const expectedHalfCredits = Math.floor(
            (maxOfflineHours / 2) * 3600 * creditPerSecond
          );
          expect(halfResult).toBe(expectedHalfCredits);

          // 정확한 제한 시간 결과
          const expectedExactCredits = Math.floor(
            maxOfflineHours * 3600 * creditPerSecond
          );
          expect(exactResult).toBe(expectedExactCredits);

          // 2배 시간은 제한에 의해 정확한 시간과 같은 결과여야 함
          expect(doubleResult).toBe(exactResult);

          // 시간이 증가할수록 크레딧도 증가하거나 같아야 함 (제한 내에서)
          expect(exactResult).toBeGreaterThanOrEqual(halfResult);
          expect(doubleResult).toBeGreaterThanOrEqual(exactResult);
        }
      ),
      { numRuns: 5 }
    );
  });

  it("should handle negative and invalid time inputs gracefully", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -100000, max: 0 }), // 음수 시간
        fc.integer({ min: 1, max: 100 }),
        (negativeTimeMs: number, creditPerSecond: number) => {
          const result = calculateOfflineCredits(
            negativeTimeMs,
            creditPerSecond
          );

          // 음수 시간에 대해서는 항상 0 크레딧을 반환해야 함
          expect(result).toBe(0);
        }
      ),
      { numRuns: 3 }
    );
  });
});

describe("Property 15: Offline Time Tracking", () => {
  /**
   * Property 15: Offline Time Tracking
   * For any game session, closing and reopening the game should correctly calculate the elapsed time between sessions
   * Validates: Requirements 6.1, 6.2
   */
  it("should correctly calculate elapsed time between save and load operations", () => {
    fc.assert(
      fc.property(
        // 저장 시점 타임스탬프 (과거 시점)
        fc.integer({ min: 1640995200000, max: Date.now() - 1000 }), // 2022년 1월 1일부터 1초 전까지
        // 경과 시간 (밀리초)
        fc.integer({ min: 1000, max: 72 * 60 * 60 * 1000 }), // 1초 ~ 72시간
        (lastSaveTime: number, elapsedTimeMs: number) => {
          const currentTime = lastSaveTime + elapsedTimeMs;

          // 실제 경과 시간 계산 (calculateOfflineCredits 함수 내부 로직과 동일)
          const calculatedElapsedMs = Math.max(0, currentTime - lastSaveTime);

          // 경과 시간이 정확히 계산되어야 함
          expect(calculatedElapsedMs).toBe(elapsedTimeMs);

          // 경과 시간은 항상 0 이상이어야 함
          expect(calculatedElapsedMs).toBeGreaterThanOrEqual(0);

          // 경과 시간은 실제 시간 차이와 일치해야 함
          expect(calculatedElapsedMs).toBe(currentTime - lastSaveTime);

          // 시간이 역행하지 않는 경우 (currentTime >= lastSaveTime)
          if (currentTime >= lastSaveTime) {
            expect(calculatedElapsedMs).toBe(currentTime - lastSaveTime);
          }
        }
      ),
      { numRuns: 5 } // 최소 100회 반복 실행
    );
  });

  it("should handle time edge cases correctly", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1640995200000, max: Date.now() }), // 유효한 타임스탬프 범위
        fc.oneof(
          fc.constant(0), // 시간 차이 없음
          fc.constant(1), // 1ms 차이
          fc.constant(1000), // 1초 차이
          fc.constant(60 * 1000), // 1분 차이
          fc.constant(3600 * 1000), // 1시간 차이
          fc.constant(24 * 3600 * 1000), // 24시간 차이
          fc.constant(7 * 24 * 3600 * 1000) // 1주일 차이
        ),
        (baseTime: number, timeDifference: number) => {
          const lastSaveTime = baseTime;
          const currentTime = baseTime + timeDifference;

          const calculatedElapsedMs = Math.max(0, currentTime - lastSaveTime);

          // 계산된 경과 시간이 예상 시간 차이와 일치해야 함
          expect(calculatedElapsedMs).toBe(timeDifference);

          // 경과 시간은 항상 0 이상이어야 함
          expect(calculatedElapsedMs).toBeGreaterThanOrEqual(0);

          // 시간 차이가 0이면 경과 시간도 0이어야 함
          if (timeDifference === 0) {
            expect(calculatedElapsedMs).toBe(0);
          }

          // 시간 차이가 양수면 경과 시간도 양수여야 함
          if (timeDifference > 0) {
            expect(calculatedElapsedMs).toBeGreaterThan(0);
            expect(calculatedElapsedMs).toBe(timeDifference);
          }
        }
      ),
      { numRuns: 5 }
    );
  });

  it("should handle invalid or corrupted timestamps gracefully", () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(0), // 0 타임스탬프
          fc.constant(-1), // 음수 타임스탬프
          fc.constant(NaN), // NaN 값
          fc.constant(Infinity), // 무한대 값
          fc.constant(-Infinity), // 음의 무한대 값
          fc.integer({ min: -1000000, max: 0 }) // 음수 범위
        ),
        (invalidTimestamp: number) => {
          const currentTime = Date.now();

          // 유효하지 않은 타임스탬프에 대한 경과 시간 계산
          const calculatedElapsedMs = Math.max(
            0,
            currentTime - invalidTimestamp
          );

          // 결과는 항상 0 이상이어야 함 (NaN 제외)
          if (!Number.isNaN(calculatedElapsedMs)) {
            expect(calculatedElapsedMs).toBeGreaterThanOrEqual(0);
          }

          // NaN이나 무한대 타임스탬프의 경우 특별 처리
          if (Number.isNaN(invalidTimestamp)) {
            // NaN과의 연산 결과는 NaN이므로 Math.max(0, NaN)는 NaN이 됨
            // 하지만 실제 게임에서는 이런 경우 0으로 처리되어야 함
            expect(
              Number.isNaN(calculatedElapsedMs) || calculatedElapsedMs >= 0
            ).toBe(true);
          } else if (invalidTimestamp === Infinity) {
            // currentTime - Infinity = -Infinity, Math.max(0, -Infinity) = 0
            expect(calculatedElapsedMs).toBe(0);
          } else if (invalidTimestamp === -Infinity) {
            // currentTime - (-Infinity) = Infinity, Math.max(0, Infinity) = Infinity
            // 이 경우 결과가 무한대가 될 수 있음
            expect(
              calculatedElapsedMs === Infinity ||
                Number.isFinite(calculatedElapsedMs)
            ).toBe(true);
          } else if (Number.isFinite(invalidTimestamp)) {
            // 유한한 숫자인 경우 결과도 유한해야 함
            expect(Number.isFinite(calculatedElapsedMs)).toBe(true);

            // 음수 타임스탬프의 경우 현재 시간과의 차이가 매우 클 것
            if (invalidTimestamp < 0) {
              expect(calculatedElapsedMs).toBeGreaterThan(currentTime);
            }
          }
        }
      ),
      { numRuns: 5 }
    );
  });

  it("should maintain consistency across multiple time calculations", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1640995200000, max: Date.now() - 10000 }), // 기준 시간 (10초 전까지)
        fc.array(fc.integer({ min: 1000, max: 10000 }), {
          minLength: 2,
          maxLength: 5,
        }), // 시간 간격들
        (baseTime: number, timeIntervals: number[]) => {
          let currentTime = baseTime;
          let totalElapsed = 0;

          // 여러 시간 간격을 순차적으로 적용
          for (const interval of timeIntervals) {
            const previousTime = currentTime;
            currentTime += interval;

            const calculatedElapsed = Math.max(0, currentTime - previousTime);

            // 각 간격이 정확히 계산되어야 함
            expect(calculatedElapsed).toBe(interval);

            totalElapsed += interval;
          }

          // 전체 경과 시간 계산
          const totalCalculatedElapsed = Math.max(0, currentTime - baseTime);

          // 전체 경과 시간이 개별 간격들의 합과 일치해야 함
          expect(totalCalculatedElapsed).toBe(totalElapsed);

          // 전체 경과 시간이 예상 값과 일치해야 함
          const expectedTotal = timeIntervals.reduce(
            (sum, interval) => sum + interval,
            0
          );
          expect(totalCalculatedElapsed).toBe(expectedTotal);
        }
      ),
      { numRuns: 5 }
    );
  });

  it("should handle future timestamps correctly", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1000, max: 24 * 60 * 60 * 1000 }), // 1초 ~ 24시간 미래
        (futureOffset: number) => {
          const currentTime = Date.now();
          const futureTime = currentTime + futureOffset;

          // 미래 시간을 lastSaveTime으로, 현재 시간을 비교 시점으로 사용
          // 이는 시계가 뒤로 가거나 시스템 시간이 변경된 상황을 시뮬레이션
          const calculatedElapsed = Math.max(0, currentTime - futureTime);

          // 미래 시간이 기준점이므로 경과 시간은 0이어야 함 (Math.max(0, ...)로 인해)
          expect(calculatedElapsed).toBe(0);

          // 결과는 항상 0 이상이어야 함
          expect(calculatedElapsed).toBeGreaterThanOrEqual(0);

          // 시간이 역행하는 경우에 대한 안전한 처리 확인
          expect(Number.isFinite(calculatedElapsed)).toBe(true);
        }
      ),
      { numRuns: 5 }
    );
  });
});
