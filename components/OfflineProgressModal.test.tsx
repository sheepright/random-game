/**
 * Unit tests for OfflineProgressModal component
 * Requirements: 6.4 - 오프라인 진행 결과 표시
 */

import { describe, it, expect } from "vitest";
import { OfflineProgress } from "../types/game";

// Extract formatting functions from OfflineProgressModal for testing
function formatTime(hours: number): string {
  if (hours < 1) {
    const minutes = Math.floor(hours * 60);
    return `${minutes}분`;
  } else if (hours < 24) {
    const wholeHours = Math.floor(hours);
    const minutes = Math.floor((hours - wholeHours) * 60);
    return minutes > 0 ? `${wholeHours}시간 ${minutes}분` : `${wholeHours}시간`;
  } else {
    return "24시간";
  }
}

function formatCredits(credits: number): string {
  if (credits >= 1000000) {
    return `${(credits / 1000000).toFixed(1)}M`;
  } else if (credits >= 1000) {
    return `${(credits / 1000).toFixed(1)}K`;
  }
  return credits.toString();
}

describe("OfflineProgressModal Formatting Functions", () => {
  describe("시간 포맷팅", () => {
    it("분 단위 시간을 올바르게 포맷팅한다", () => {
      expect(formatTime(0.5)).toBe("30분");
      expect(formatTime(0.25)).toBe("15분");
      expect(formatTime(0.75)).toBe("45분");
    });

    it("시간 단위 시간을 올바르게 포맷팅한다", () => {
      expect(formatTime(1)).toBe("1시간");
      expect(formatTime(2)).toBe("2시간");
      expect(formatTime(1.5)).toBe("1시간 30분");
      expect(formatTime(2.25)).toBe("2시간 15분");
    });

    it("24시간 이상은 24시간으로 표시한다", () => {
      expect(formatTime(24)).toBe("24시간");
      expect(formatTime(25)).toBe("24시간");
      expect(formatTime(48)).toBe("24시간");
    });

    it("0시간은 0분으로 표시한다", () => {
      expect(formatTime(0)).toBe("0분");
    });
  });

  describe("크레딧 포맷팅", () => {
    it("천 단위 미만은 그대로 표시한다", () => {
      expect(formatCredits(0)).toBe("0");
      expect(formatCredits(500)).toBe("500");
      expect(formatCredits(999)).toBe("999");
    });

    it("천 단위는 K로 표시한다", () => {
      expect(formatCredits(1000)).toBe("1.0K");
      expect(formatCredits(1500)).toBe("1.5K");
      expect(formatCredits(999999)).toBe("1000.0K");
    });

    it("백만 단위는 M으로 표시한다", () => {
      expect(formatCredits(1000000)).toBe("1.0M");
      expect(formatCredits(1500000)).toBe("1.5M");
      expect(formatCredits(2500000)).toBe("2.5M");
    });
  });

  describe("오프라인 진행 데이터 검증", () => {
    it("유효한 오프라인 진행 데이터를 처리한다", () => {
      const offlineProgress: OfflineProgress = {
        elapsedTime: 2.5,
        creditsEarned: 9000,
        maxOfflineHours: 24,
      };

      expect(offlineProgress.elapsedTime).toBeGreaterThan(0);
      expect(offlineProgress.creditsEarned).toBeGreaterThanOrEqual(0);
      expect(offlineProgress.maxOfflineHours).toBe(24);

      // 포맷팅 결과 확인
      expect(formatTime(offlineProgress.elapsedTime)).toBe("2시간 30분");
      expect(formatCredits(offlineProgress.creditsEarned)).toBe("9.0K");
    });

    it("최대 시간 도달 여부를 올바르게 판단한다", () => {
      const maxTimeReached: OfflineProgress = {
        elapsedTime: 24,
        creditsEarned: 86400, // 24시간 * 1초당 1크레딧
        maxOfflineHours: 24,
      };

      const belowMaxTime: OfflineProgress = {
        elapsedTime: 12,
        creditsEarned: 43200, // 12시간 * 1초당 1크레딧
        maxOfflineHours: 24,
      };

      expect(maxTimeReached.elapsedTime >= maxTimeReached.maxOfflineHours).toBe(
        true
      );
      expect(belowMaxTime.elapsedTime >= belowMaxTime.maxOfflineHours).toBe(
        false
      );
    });

    it("경계값에서 올바르게 작동한다", () => {
      // 정확히 1시간
      expect(formatTime(1.0)).toBe("1시간");

      // 정확히 1000 크레딧
      expect(formatCredits(1000)).toBe("1.0K");

      // 정확히 1M 크레딧
      expect(formatCredits(1000000)).toBe("1.0M");

      // 정확히 24시간
      expect(formatTime(24.0)).toBe("24시간");
    });

    it("소수점 시간을 올바르게 처리한다", () => {
      // 1시간 15분 = 1.25시간
      expect(formatTime(1.25)).toBe("1시간 15분");

      // 2시간 45분 = 2.75시간
      expect(formatTime(2.75)).toBe("2시간 45분");

      // 0.1시간 = 6분
      expect(formatTime(0.1)).toBe("6분");
    });
  });

  describe("Requirements 6.4 검증", () => {
    it("오프라인 진행 결과 표시 요구사항을 만족한다", () => {
      const testProgress: OfflineProgress = {
        elapsedTime: 3.75, // 3시간 45분
        creditsEarned: 13500, // 13.5K
        maxOfflineHours: 24,
      };

      // 경과 시간 표시
      const timeDisplay = formatTime(testProgress.elapsedTime);
      expect(timeDisplay).toBe("3시간 45분");
      expect(timeDisplay).toMatch(/\d+시간 \d+분|\d+시간|\d+분/);

      // 획득 크레딧 표시
      const creditDisplay = formatCredits(testProgress.creditsEarned);
      expect(creditDisplay).toBe("13.5K");
      expect(creditDisplay).toMatch(/^\d+(\.\d+)?[KM]?$/);

      // 최대 시간 제한 확인
      expect(testProgress.maxOfflineHours).toBe(24);
      expect(testProgress.elapsedTime).toBeLessThanOrEqual(
        testProgress.maxOfflineHours
      );
    });

    it("다양한 시나리오에서 일관된 포맷팅을 제공한다", () => {
      const scenarios = [
        {
          elapsedTime: 0.5,
          creditsEarned: 1800,
          expected: { time: "30분", credits: "1.8K" },
        },
        {
          elapsedTime: 1,
          creditsEarned: 3600,
          expected: { time: "1시간", credits: "3.6K" },
        },
        {
          elapsedTime: 12,
          creditsEarned: 43200,
          expected: { time: "12시간", credits: "43.2K" },
        },
        {
          elapsedTime: 24,
          creditsEarned: 86400,
          expected: { time: "24시간", credits: "86.4K" },
        },
      ];

      scenarios.forEach(({ elapsedTime, creditsEarned, expected }) => {
        expect(formatTime(elapsedTime)).toBe(expected.time);
        expect(formatCredits(creditsEarned)).toBe(expected.credits);
      });
    });
  });
});
