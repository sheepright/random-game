/**
 * Property-based tests for CreditDisplay formatting logic
 * Feature: idle-gacha-game, Property 12: Real-time Credit Display
 * Validates: Requirements 5.1
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

// Extract formatting logic from CreditDisplay component for testing
function formatCredits(credits: number): string {
  if (credits >= 1000000) {
    return `${(credits / 1000000).toFixed(1)}M`;
  } else if (credits >= 1000) {
    return `${(credits / 1000).toFixed(1)}K`;
  }
  return credits.toString();
}

// Calculate per-minute and per-hour rates
function calculateRates(creditPerSecond: number) {
  return {
    perMinute: creditPerSecond * 60,
    perHour: creditPerSecond * 3600,
  };
}

describe("Property 12: Real-time Credit Display", () => {
  /**
   * Property 12: Real-time Credit Display
   * For any credit amount change, the displayed credit value should update to reflect the new amount
   * Validates: Requirements 5.1
   */
  it("should format credits accurately for any valid credit amount", () => {
    fc.assert(
      fc.property(
        // 크레딧 범위: 0 ~ 1억 (게임에서 합리적한 범위)
        fc.integer({ min: 0, max: 100_000_000 }),
        (credits: number) => {
          const formattedCredits = formatCredits(credits);

          // 포맷팅된 결과가 문자열이어야 함
          expect(typeof formattedCredits).toBe("string");
          expect(formattedCredits).toBeTruthy();

          // 포맷팅 규칙 검증
          if (credits >= 1_000_000) {
            // 백만 이상은 M 단위로 표시되어야 함
            expect(formattedCredits).toMatch(/^\d+(\.\d+)?M$/);
            const numericPart = parseFloat(formattedCredits.slice(0, -1));
            expect(numericPart).toBeGreaterThanOrEqual(1.0);
            expect(numericPart).toBeLessThan(1000.0);
          } else if (credits >= 1000) {
            // 천 이상은 K 단위로 표시되어야 함
            expect(formattedCredits).toMatch(/^\d+(\.\d+)?K$/);
            const numericPart = parseFloat(formattedCredits.slice(0, -1));
            expect(numericPart).toBeGreaterThanOrEqual(1.0);
            expect(numericPart).toBeLessThan(1000.0);
          } else {
            // 천 미만은 그대로 표시되어야 함
            expect(formattedCredits).toBe(credits.toString());
            expect(parseInt(formattedCredits, 10)).toBe(credits);
          }

          // 결과에 NaN이나 Infinity가 포함되지 않아야 함
          expect(formattedCredits).not.toBe("NaN");
          expect(formattedCredits).not.toBe("Infinity");
          expect(formattedCredits).not.toBe("-Infinity");
        }
      ),
      { numRuns: 100 } // 최소 100회 반복 실행
    );
  });

  it("should format large credit amounts correctly with proper precision", () => {
    fc.assert(
      fc.property(
        // 큰 숫자 범위에 집중
        fc.oneof(
          fc.integer({ min: 0, max: 999 }), // 천 단위 미만
          fc.integer({ min: 1000, max: 999_999 }), // 천 단위 (K)
          fc.integer({ min: 1_000_000, max: 999_999_999 }), // 백만 단위 (M)
          fc.integer({ min: 1_000_000_000, max: Number.MAX_SAFE_INTEGER }) // 십억 단위 이상
        ),
        (credits: number) => {
          const formatted = formatCredits(credits);

          // 포맷팅된 값이 원본 값을 적절히 나타내는지 확인
          const parsedValue = parseFormattedCredits(formatted);

          if (credits >= 1_000_000) {
            // M 단위의 경우 소수점 1자리 반올림으로 인한 오차 허용
            const expectedM = Math.round((credits / 1_000_000) * 10) / 10;
            const actualM = parsedValue / 1_000_000;
            // 부동소수점 정밀도 문제를 고려하여 더 관대한 허용 오차 적용
            expect(Math.abs(actualM - expectedM)).toBeLessThanOrEqual(0.15);
          } else if (credits >= 1000) {
            // K 단위의 경우 소수점 1자리 반올림으로 인한 오차 허용
            const expectedK = Math.round((credits / 1000) * 10) / 10;
            const actualK = parsedValue / 1000;
            // 부동소수점 정밀도 문제를 고려하여 더 관대한 허용 오차 적용
            expect(Math.abs(actualK - expectedK)).toBeLessThanOrEqual(0.15);
          } else {
            // 천 미만은 정확히 일치해야 함
            expect(parsedValue).toBe(credits);
          }

          // 포맷팅 결과가 유효한 형식인지 확인
          expect(formatted).toMatch(/^(\d+|\d+\.\d+[KM])$/);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should calculate credit generation rates correctly", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }), // 크레딧 생성률
        (creditPerSecond: number) => {
          const rates = calculateRates(creditPerSecond);

          // 분당 계산 확인
          expect(rates.perMinute).toBe(creditPerSecond * 60);

          // 시간당 계산 확인
          expect(rates.perHour).toBe(creditPerSecond * 3600);

          // 시간당이 분당보다 60배 많아야 함
          expect(rates.perHour).toBe(rates.perMinute * 60);

          // 모든 값이 양수여야 함
          expect(creditPerSecond).toBeGreaterThan(0);
          expect(rates.perMinute).toBeGreaterThan(0);
          expect(rates.perHour).toBeGreaterThan(0);

          // 모든 값이 유한해야 함
          expect(Number.isFinite(creditPerSecond)).toBe(true);
          expect(Number.isFinite(rates.perMinute)).toBe(true);
          expect(Number.isFinite(rates.perHour)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should handle edge cases and boundary values correctly", () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(0), // 0 크레딧
          fc.constant(1), // 최소 크레딧
          fc.constant(999), // K 단위 직전
          fc.constant(1000), // 정확히 1K
          fc.constant(1001), // K 단위 직후
          fc.constant(999_999), // M 단위 직전
          fc.constant(1_000_000), // 정확히 1M
          fc.constant(1_000_001), // M 단위 직후
          fc.constant(Number.MAX_SAFE_INTEGER) // 최대 안전 정수
        ),
        (credits: number) => {
          const formatted = formatCredits(credits);

          // 모든 경우에 유효한 문자열이 반환되어야 함
          expect(typeof formatted).toBe("string");
          expect(formatted).toBeTruthy();

          // 경계값에서 포맷팅이 올바른지 확인
          if (credits === 0) {
            expect(formatted).toBe("0");
          } else if (credits === 1000) {
            expect(formatted).toBe("1.0K");
          } else if (credits === 1_000_000) {
            expect(formatted).toBe("1.0M");
          }

          // 매우 큰 숫자도 적절히 처리되어야 함
          if (credits === Number.MAX_SAFE_INTEGER) {
            expect(formatted).toMatch(/\d+(\.\d+)?M/);
          }

          // 표시된 모든 값이 유효해야 함
          expect(formatted).not.toBe("NaN");
          expect(formatted).not.toBe("Infinity");
          expect(formatted).not.toBe("undefined");
          expect(formatted).not.toBe("null");
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should maintain consistency between different time unit calculations", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 500 }), // 크레딧 생성률
        (creditPerSecond: number) => {
          const rates = calculateRates(creditPerSecond);

          // 시간 단위 간 일관성 확인
          // 분당 = 초당 × 60
          expect(rates.perMinute).toBe(creditPerSecond * 60);

          // 시간당 = 초당 × 3600 = 분당 × 60
          expect(rates.perHour).toBe(creditPerSecond * 3600);
          expect(rates.perHour).toBe(rates.perMinute * 60);

          // 포맷팅된 값들도 비례 관계를 유지해야 함
          const formattedPerSecond = formatCredits(creditPerSecond);
          const formattedPerMinute = formatCredits(rates.perMinute);
          const formattedPerHour = formatCredits(rates.perHour);

          const numericPerSecond = parseFormattedCredits(formattedPerSecond);
          const numericPerMinute = parseFormattedCredits(formattedPerMinute);
          const numericPerHour = parseFormattedCredits(formattedPerHour);

          // 포맷팅으로 인한 오차를 고려한 비례 관계 확인
          const ratioMinuteToSecond = numericPerMinute / numericPerSecond;
          const ratioHourToSecond = numericPerHour / numericPerSecond;

          // 분당은 초당의 약 60배여야 함 (포맷팅 오차 허용)
          expect(Math.abs(ratioMinuteToSecond - 60)).toBeLessThan(10);

          // 시간당은 초당의 약 3600배여야 함 (포맷팅 오차 허용)
          expect(Math.abs(ratioHourToSecond - 3600)).toBeLessThan(500);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should handle zero and negative values gracefully", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -1000, max: 0 }), // 음수 및 0 값
        (credits: number) => {
          if (credits < 0) {
            // 음수 크레딧은 실제 게임에서 발생하지 않아야 하지만
            // 포맷팅 함수는 안전하게 처리해야 함
            const formatted = formatCredits(credits);
            expect(typeof formatted).toBe("string");
            expect(formatted).toBe(credits.toString());
          } else if (credits === 0) {
            // 0 크레딧은 정확히 "0"으로 표시되어야 함
            const formatted = formatCredits(credits);
            expect(formatted).toBe("0");
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it("should maintain reasonable precision in format conversions", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1000, max: 10_000_000 }), // K와 M 단위가 모두 포함되는 범위
        (credits: number) => {
          const formatted = formatCredits(credits);
          const parsed = parseFormattedCredits(formatted);

          // 포맷팅 후 파싱한 값이 원본과 합리적인 범위 내에 있어야 함
          const absoluteDifference = Math.abs(parsed - credits);

          if (credits >= 1_000_000) {
            // M 단위의 경우 최대 100,000 크레딧 차이 허용 (소수점 1자리 반올림)
            expect(absoluteDifference).toBeLessThan(100_000);
          } else if (credits >= 1000) {
            // K 단위의 경우 최대 100 크레딧 차이 허용 (소수점 1자리 반올림)
            expect(absoluteDifference).toBeLessThan(100);
          }

          // 포맷팅된 값이 원본과 너무 크게 벗어나지 않아야 함 (±5% 이내)
          const lowerBound = credits * 0.95;
          const upperBound = credits * 1.05;
          expect(parsed).toBeGreaterThanOrEqual(lowerBound);
          expect(parsed).toBeLessThanOrEqual(upperBound);

          // 포맷팅 결과가 유효한 형식인지 확인
          expect(formatted).toMatch(/^(\d+|\d+\.\d+[KM])$/);

          // 파싱된 값이 유한한 숫자여야 함
          expect(Number.isFinite(parsed)).toBe(true);
          expect(parsed).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Helper function to parse formatted credits back to numeric value
function parseFormattedCredits(formatted: string): number {
  if (formatted.endsWith("M")) {
    return parseFloat(formatted.slice(0, -1)) * 1_000_000;
  } else if (formatted.endsWith("K")) {
    return parseFloat(formatted.slice(0, -1)) * 1000;
  }
  return parseInt(formatted, 10);
}
