/**
 * 제우스 검 0.001% 확률 테스트 시뮬레이션
 */

// 가챠 확률 설정 (실제 게임과 동일)
const GACHA_RATES = {
  common: 0.72, // 72%
  rare: 0.25, // 25%
  epic: 0.0245, // 2.45%
  legendary: 0.005, // 0.5%
  mythic: 0.00049, // 0.049%
  divine: 0.00001, // 0.001%
};

// 누적 확률 계산
const cumulativeRates = [];
let cumulative = 0;
for (const [grade, rate] of Object.entries(GACHA_RATES)) {
  cumulative += rate;
  cumulativeRates.push({ grade, threshold: cumulative });
}

console.log("=== 제우스 검 0.001% 확률 테스트 ===\n");
console.log("누적 확률:");
cumulativeRates.forEach(({ grade, threshold }) => {
  console.log(`${grade}: ${(threshold * 100).toFixed(5)}%`);
});
console.log(`총합: ${(cumulative * 100).toFixed(5)}%\n`);

// 가챠 시뮬레이션 함수
function simulateGacha() {
  const random = Math.random();

  for (const { grade, threshold } of cumulativeRates) {
    if (random <= threshold) {
      return grade;
    }
  }
  return "common"; // 기본값
}

// 제우스 검이 나올 때까지 시뮬레이션
function testZeusProbability(maxAttempts = 1000000) {
  console.log(
    `최대 ${maxAttempts.toLocaleString()}번 시도로 제우스 검 테스트 시작...\n`
  );

  let attempts = 0;
  let zeusFound = false;

  const startTime = Date.now();

  while (attempts < maxAttempts && !zeusFound) {
    attempts++;
    const result = simulateGacha();

    if (result === "divine") {
      zeusFound = true;
      break;
    }

    // 진행상황 표시 (10만번마다)
    if (attempts % 100000 === 0) {
      console.log(`${attempts.toLocaleString()}번 시도... (아직 못찾음)`);
    }
  }

  const endTime = Date.now();
  const duration = endTime - startTime;

  if (zeusFound) {
    console.log(`🎉 제우스 검 발견!`);
    console.log(`시도 횟수: ${attempts.toLocaleString()}번`);
    console.log(`실제 확률: ${((1 / attempts) * 100).toFixed(6)}%`);
    console.log(`이론 확률: 0.001000%`);
    console.log(`확률 차이: ${((1 / attempts) * 100 - 0.001).toFixed(6)}%`);
    console.log(`소요 시간: ${duration}ms`);

    // 크레딧으로 환산 (가챠 비용 1600 크레딧 기준)
    const totalCost = attempts * 1600;
    console.log(`\n💰 크레딧 비용:`);
    console.log(`총 비용: ${totalCost.toLocaleString()} 크레딧`);
    console.log(`약 ${Math.round(totalCost / 1000000)}백만 크레딧`);
  } else {
    console.log(
      `❌ ${maxAttempts.toLocaleString()}번 시도했지만 제우스 검을 찾지 못했습니다.`
    );
    console.log(`소요 시간: ${duration}ms`);
  }

  return { attempts, found: zeusFound, duration };
}

// 여러 번 테스트해서 평균 구하기
function multipleTests(testCount = 5, maxAttemptsPerTest = 200000) {
  console.log(
    `=== ${testCount}번 반복 테스트 (각각 최대 ${maxAttemptsPerTest.toLocaleString()}번) ===\n`
  );

  const results = [];
  let totalFound = 0;

  for (let i = 1; i <= testCount; i++) {
    console.log(`--- 테스트 ${i}/${testCount} ---`);
    const result = testZeusProbability(maxAttemptsPerTest);
    results.push(result);

    if (result.found) {
      totalFound++;
    }
    console.log("");
  }

  console.log("=== 종합 결과 ===");
  console.log(`성공한 테스트: ${totalFound}/${testCount}`);

  if (totalFound > 0) {
    const successfulAttempts = results
      .filter((r) => r.found)
      .map((r) => r.attempts);
    const avgAttempts =
      successfulAttempts.reduce((a, b) => a + b, 0) / successfulAttempts.length;
    const minAttempts = Math.min(...successfulAttempts);
    const maxAttempts = Math.max(...successfulAttempts);

    console.log(
      `평균 시도 횟수: ${Math.round(avgAttempts).toLocaleString()}번`
    );
    console.log(`최소 시도 횟수: ${minAttempts.toLocaleString()}번`);
    console.log(`최대 시도 횟수: ${maxAttempts.toLocaleString()}번`);
    console.log(`평균 실제 확률: ${((1 / avgAttempts) * 100).toFixed(6)}%`);

    // 크레딧 비용
    const avgCost = avgAttempts * 1600;
    console.log(
      `평균 크레딧 비용: ${Math.round(avgCost).toLocaleString()} 크레딧`
    );
  }
}

// 이론적 기댓값 계산
function theoreticalExpectation() {
  console.log("=== 이론적 기댓값 ===");
  const probability = 0.00001; // 0.001%
  const expectedAttempts = 1 / probability;
  const expectedCost = expectedAttempts * 1600;

  console.log(`이론적 기댓값: ${expectedAttempts.toLocaleString()}번`);
  console.log(`이론적 크레딧 비용: ${expectedCost.toLocaleString()} 크레딧`);
  console.log(`약 ${Math.round(expectedCost / 1000000)}백만 크레딧\n`);
}

// 실행
theoreticalExpectation();
multipleTests(3, 300000); // 3번 테스트, 각각 최대 30만번
