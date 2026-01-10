/**
 * 제우스 검 확률 확장 테스트 - 더 많은 샘플로 정확도 향상
 */

const DIVINE_RATE = 0.00001; // 0.001%

// 간단한 가챠 시뮬레이션 (제우스 검만 체크)
function isZeusSword() {
  return Math.random() <= DIVINE_RATE;
}

// 제우스 검이 나올 때까지의 시도 횟수 측정
function findZeus(maxAttempts = 500000) {
  for (let i = 1; i <= maxAttempts; i++) {
    if (isZeusSword()) {
      return i;
    }
  }
  return null; // 못찾음
}

// 대량 테스트
function massTest(testCount = 20) {
  console.log(`=== 제우스 검 대량 테스트 (${testCount}회) ===\n`);

  const results = [];
  let successCount = 0;

  console.log("진행상황:");
  for (let i = 1; i <= testCount; i++) {
    const attempts = findZeus();
    if (attempts) {
      results.push(attempts);
      successCount++;
      console.log(
        `테스트 ${i}: ${attempts.toLocaleString()}번 만에 성공! (${(
          (1 / attempts) *
          100
        ).toFixed(4)}%)`
      );
    } else {
      console.log(`테스트 ${i}: 실패 (50만번 내에 못찾음)`);
    }
  }

  console.log(`\n=== 결과 분석 ===`);
  console.log(
    `성공률: ${successCount}/${testCount} (${(
      (successCount / testCount) *
      100
    ).toFixed(1)}%)`
  );

  if (results.length > 0) {
    results.sort((a, b) => a - b);

    const sum = results.reduce((a, b) => a + b, 0);
    const avg = sum / results.length;
    const median = results[Math.floor(results.length / 2)];
    const min = results[0];
    const max = results[results.length - 1];

    console.log(`\n📊 통계:`);
    console.log(`평균: ${Math.round(avg).toLocaleString()}번`);
    console.log(`중앙값: ${median.toLocaleString()}번`);
    console.log(`최소: ${min.toLocaleString()}번`);
    console.log(`최대: ${max.toLocaleString()}번`);
    console.log(
      `표준편차: ${Math.round(
        Math.sqrt(
          results.map((x) => Math.pow(x - avg, 2)).reduce((a, b) => a + b) /
            results.length
        )
      ).toLocaleString()}번`
    );

    console.log(`\n💰 크레딧 비용 (가챠 1600 크레딧 기준):`);
    console.log(`평균 비용: ${Math.round(avg * 1600).toLocaleString()} 크레딧`);
    console.log(`중앙값 비용: ${(median * 1600).toLocaleString()} 크레딧`);
    console.log(`최소 비용: ${(min * 1600).toLocaleString()} 크레딧`);
    console.log(`최대 비용: ${(max * 1600).toLocaleString()} 크레딧`);

    console.log(`\n🎯 확률 분석:`);
    console.log(`이론적 기댓값: ${(1 / DIVINE_RATE).toLocaleString()}번`);
    console.log(
      `실제 평균과 차이: ${Math.round(
        avg - 1 / DIVINE_RATE
      ).toLocaleString()}번`
    );
    console.log(`평균 실제 확률: ${((1 / avg) * 100).toFixed(6)}%`);
    console.log(`이론 확률: ${(DIVINE_RATE * 100).toFixed(6)}%`);

    // 구간별 분포
    console.log(`\n📈 구간별 분포:`);
    const ranges = [
      { min: 0, max: 50000, label: "5만번 이하" },
      { min: 50000, max: 100000, label: "5-10만번" },
      { min: 100000, max: 150000, label: "10-15만번" },
      { min: 150000, max: 200000, label: "15-20만번" },
      { min: 200000, max: Infinity, label: "20만번 초과" },
    ];

    ranges.forEach((range) => {
      const count = results.filter(
        (r) => r > range.min && r <= range.max
      ).length;
      const percentage = ((count / results.length) * 100).toFixed(1);
      console.log(`${range.label}: ${count}회 (${percentage}%)`);
    });
  }
}

// 실행
massTest(15);

// 추가: 10만번 시도에서 제우스 검이 몇 개 나오는지 테스트
console.log(`\n=== 10만번 연속 가챠에서 제우스 검 개수 테스트 ===`);
const attempts = 100000;
let zeusCount = 0;

for (let i = 0; i < attempts; i++) {
  if (isZeusSword()) {
    zeusCount++;
  }
}

console.log(`10만번 가챠 결과: 제우스 검 ${zeusCount}개`);
console.log(`실제 확률: ${((zeusCount / attempts) * 100).toFixed(4)}%`);
console.log(`이론 확률: ${(DIVINE_RATE * 100).toFixed(4)}%`);
console.log(`기댓값: ${(attempts * DIVINE_RATE).toFixed(1)}개`);
