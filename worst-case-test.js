/**
 * 제우스 검 최악의 경우 시나리오 테스트
 */

const DIVINE_RATE = 0.00001; // 0.001%

function isZeusSword() {
  return Math.random() <= DIVINE_RATE;
}

// 운이 나쁜 경우 시뮬레이션
function worstCaseScenario() {
  console.log("=== 제우스 검 최악의 경우 시나리오 ===\n");

  // 99.9% 확률로 이 횟수 안에는 나와야 함
  const probability99_9 = Math.log(0.001) / Math.log(1 - DIVINE_RATE);
  console.log(
    `99.9% 확률로 ${Math.round(
      probability99_9
    ).toLocaleString()}번 안에 나와야 함`
  );

  // 99% 확률로 이 횟수 안에는 나와야 함
  const probability99 = Math.log(0.01) / Math.log(1 - DIVINE_RATE);
  console.log(
    `99% 확률로 ${Math.round(probability99).toLocaleString()}번 안에 나와야 함`
  );

  // 95% 확률로 이 횟수 안에는 나와야 함
  const probability95 = Math.log(0.05) / Math.log(1 - DIVINE_RATE);
  console.log(
    `95% 확률로 ${Math.round(probability95).toLocaleString()}번 안에 나와야 함`
  );

  // 90% 확률로 이 횟수 안에는 나와야 함
  const probability90 = Math.log(0.1) / Math.log(1 - DIVINE_RATE);
  console.log(
    `90% 확률로 ${Math.round(probability90).toLocaleString()}번 안에 나와야 함`
  );

  // 50% 확률로 이 횟수 안에는 나와야 함 (중앙값)
  const probability50 = Math.log(0.5) / Math.log(1 - DIVINE_RATE);
  console.log(
    `50% 확률로 ${Math.round(
      probability50
    ).toLocaleString()}번 안에 나와야 함 (중앙값)`
  );

  console.log(`\n💰 크레딧 비용으로 환산:`);
  console.log(
    `99.9% 확률: ${Math.round(
      probability99_9 * 1600
    ).toLocaleString()} 크레딧 (약 ${Math.round(
      (probability99_9 * 1600) / 1000000
    )}백만)`
  );
  console.log(
    `99% 확률: ${Math.round(
      probability99 * 1600
    ).toLocaleString()} 크레딧 (약 ${Math.round(
      (probability99 * 1600) / 1000000
    )}백만)`
  );
  console.log(
    `95% 확률: ${Math.round(
      probability95 * 1600
    ).toLocaleString()} 크레딧 (약 ${Math.round(
      (probability95 * 1600) / 1000000
    )}백만)`
  );
  console.log(
    `90% 확률: ${Math.round(
      probability90 * 1600
    ).toLocaleString()} 크레딧 (약 ${Math.round(
      (probability90 * 1600) / 1000000
    )}백만)`
  );
  console.log(
    `50% 확률: ${Math.round(
      probability50 * 1600
    ).toLocaleString()} 크레딧 (약 ${Math.round(
      (probability50 * 1600) / 1000000
    )}백만)`
  );
}

// 실제로 운이 매우 나쁜 경우 테스트
function unluckyTest() {
  console.log(`\n=== 운이 나쁜 플레이어 시뮬레이션 ===`);

  const maxAttempts = 500000; // 50만번까지
  let attempts = 0;
  let found = false;

  console.log(`최대 ${maxAttempts.toLocaleString()}번까지 시도...`);

  while (attempts < maxAttempts && !found) {
    attempts++;
    if (isZeusSword()) {
      found = true;
    }

    // 중간 체크포인트
    if (attempts === 100000) console.log(`10만번 시도... 아직 못찾음`);
    if (attempts === 200000) console.log(`20만번 시도... 아직 못찾음`);
    if (attempts === 300000) console.log(`30만번 시도... 아직 못찾음`);
    if (attempts === 400000) console.log(`40만번 시도... 아직 못찾음`);
  }

  if (found) {
    console.log(`🎉 ${attempts.toLocaleString()}번 만에 발견!`);
    console.log(`비용: ${(attempts * 1600).toLocaleString()} 크레딧`);

    // 이게 얼마나 운이 나쁜 경우인지 계산
    const probability = Math.pow(1 - DIVINE_RATE, attempts - 1) * DIVINE_RATE;
    console.log(
      `이 정도로 늦게 나올 확률: ${(probability * 100).toExponential(2)}%`
    );
  } else {
    console.log(`😱 ${maxAttempts.toLocaleString()}번 시도했지만 못찾음!`);
    console.log(
      `이런 일이 일어날 확률: ${(
        Math.pow(1 - DIVINE_RATE, maxAttempts) * 100
      ).toFixed(4)}%`
    );
    console.log(`비용: ${(maxAttempts * 1600).toLocaleString()} 크레딧`);
  }
}

// 여러 명의 플레이어가 동시에 뽑는다면?
function multiPlayerTest() {
  console.log(`\n=== 100명이 동시에 뽑는다면? ===`);

  const playerCount = 100;
  const maxAttemptsPerPlayer = 200000;

  let results = [];

  for (let player = 1; player <= playerCount; player++) {
    let attempts = 0;
    let found = false;

    while (attempts < maxAttemptsPerPlayer && !found) {
      attempts++;
      if (isZeusSword()) {
        found = true;
        results.push(attempts);
        break;
      }
    }

    if (!found) {
      console.log(
        `플레이어 ${player}: ${maxAttemptsPerPlayer.toLocaleString()}번 내에 못찾음`
      );
    }
  }

  console.log(`\n결과:`);
  console.log(`성공한 플레이어: ${results.length}/${playerCount}명`);

  if (results.length > 0) {
    results.sort((a, b) => a - b);
    const avg = results.reduce((a, b) => a + b, 0) / results.length;

    console.log(`가장 빨리 찾은 플레이어: ${results[0].toLocaleString()}번`);
    console.log(
      `가장 늦게 찾은 플레이어: ${results[
        results.length - 1
      ].toLocaleString()}번`
    );
    console.log(`평균: ${Math.round(avg).toLocaleString()}번`);

    // 1만번 이하로 찾은 행운의 플레이어
    const luckyPlayers = results.filter((r) => r <= 10000).length;
    console.log(`1만번 이하로 찾은 행운의 플레이어: ${luckyPlayers}명`);

    // 20만번 가까이 걸린 불운의 플레이어
    const unluckyPlayers = results.filter((r) => r >= 150000).length;
    console.log(`15만번 이상 걸린 불운의 플레이어: ${unluckyPlayers}명`);
  }
}

// 실행
worstCaseScenario();
unluckyTest();
multiPlayerTest();
