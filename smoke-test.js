#!/usr/bin/env node

const http = require('http');

const BASE_URL = process.env.API_URL || 'http://localhost:3000';
const RESULTS = [];
let HAS_FAILURES = false;

function get(path) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    http.get(url.href, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    }).on('error', reject);
  });
}

function post(path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const data = JSON.stringify(body);
    const req = http.request({
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    }, (res) => {
      let resData = '';
      res.on('data', chunk => resData += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(resData) });
        } catch {
          resolve({ status: res.statusCode, data: resData });
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function test(name, fn) {
  try {
    const result = await fn();
    const passed = result.status >= 200 && result.status < 300;
    if (!passed) HAS_FAILURES = true;
    RESULTS.push({ name, passed, status: result.status, detail: result.data?.error || result.data?.message || 'OK' });
    console.log(`${passed ? '✓' : '✗'} ${name} [${result.status}]`);
  } catch (err) {
    HAS_FAILURES = true;
    RESULTS.push({ name, passed: false, status: 0, detail: err.message });
    console.log(`✗ ${name} [ERROR: ${err.message}]`);
  }
}

async function run() {
  console.log(`\n🔍 Priv8sus Smoke Tests`);
  console.log(`   API: ${BASE_URL}`);
  console.log(`   Time: ${new Date().toISOString()}\n`);

  console.log('--- Health & Monitoring ---');
  await test('GET /api/health', () => get('/api/health'));
  await test('GET /api/monitoring/error-stats', () => get('/api/monitoring/error-stats'));

  console.log('\n--- Authentication ---');
  const testEmail = `smoke_test_${Date.now()}@test.com`;
  const testPassword = 'testpass123';

  await test('POST /api/auth/signup (new user)', () =>
    post('/api/auth/signup', { email: testEmail, password: testPassword })
  );

  await test('POST /api/auth/signup (duplicate email)', () =>
    post('/api/auth/signup', { email: testEmail, password: testPassword })
  );

  const loginRes = await post('/api/auth/login', { email: testEmail, password: testPassword });
  const token = loginRes.data?.token;
  await test('POST /api/auth/login', () => Promise.resolve(loginRes));

  if (token) {
    console.log('\n--- Authenticated Requests ---');
    await test('GET /api/auth/me', () => get('/api/auth/me'));
    await test('GET /api/subscription', () => get('/api/subscription'));
    await test('POST /api/auth/onboarding-complete', () =>
      post('/api/auth/onboarding-complete', {})
    );
    await test('POST /api/auth/tour-complete', () =>
      post('/api/auth/tour-complete', {})
    );
    await test('GET /api/streaks', () => get('/api/streaks'));
    await test('POST /api/streaks/record', () =>
      post('/api/streaks/record', { activityType: 'prediction_view' })
    );
  }

  console.log('\n--- Predictions & NBA Data ---');
  const today = new Date().toISOString().split('T')[0];
  await test('GET /api/predictions (today)', () => get('/api/predictions'));
  await test('GET /api/predictions (specific date)', () => get(`/api/predictions?date=2024-03-01`));
  await test('GET /api/history', () => get('/api/history'));
  await test('GET /api/accuracy', () => get('/api/accuracy'));
  await test('GET /api/players/search?q=LeBron', () => get('/api/players/search?q=LeBron'));
  await test('GET /api/best-bets', () => get('/api/best-bets'));

  console.log('\n--- Analytics ---');
  await test('GET /api/analytics/daily-active-users', () => get('/api/analytics/daily-active-users'));
  await test('GET /api/analytics/signups', () => get('/api/analytics/signups'));
  await test('GET /api/analytics/retention?day=1', () => get('/api/analytics/retention?day=1'));
  await test('GET /api/analytics/paper-trades', () => get('/api/analytics/paper-trades'));

  console.log('\n--- Paper Trading ---');
  await test('POST /api/paper-trading/init', () =>
    post('/api/paper-trading/init', { startBalance: 5000 })
  );
  await test('GET /api/paper-trading/bankroll', () => get('/api/paper-trading/bankroll'));
  await test('GET /api/paper-trading/stats', () => get('/api/paper-trading/stats'));
  await test('GET /api/paper-trading/bets/open', () => get('/api/paper-trading/bets/open'));
  await test('GET /api/paper-trading/bets/history', () => get('/api/paper-trading/bets/history'));

  await test('POST /api/paper-trading/kelly', () =>
    post('/api/paper-trading/kelly', { probability: 0.55, odds: -110 })
  );

  const betRes = await post('/api/paper-trading/bets', {
    playerId: 1,
    playerName: 'Test Player',
    gameDate: '2024-03-01',
    statType: 'pts',
    line: 25.5,
    overOrUnder: 'over',
    odds: -110,
    stake: 100,
    probability: 0.55
  });
  const betId = betRes.data?.bet?.id;
  await test('POST /api/paper-trading/bets', () => Promise.resolve(betRes));

  if (betId) {
    await test('POST /api/paper-trading/settle (win)', () =>
      post('/api/paper-trading/settle', { betId, actualValue: 28 })
    );
  }

  await test('POST /api/paper-trading/reset', () => post('/api/paper-trading/reset', {}));

  console.log('\n--- Newsletter ---');
  await test('POST /api/subscribe', () =>
    post('/api/subscribe', { email: `newsletter_${Date.now()}@test.com`, source: 'smoke_test' })
  );

  console.log('\n--- Summary ---');
  const passed = RESULTS.filter(r => r.passed).length;
  const failed = RESULTS.filter(r => !r.passed).length;
  console.log(`   Passed: ${passed}/${RESULTS.length}`);
  console.log(`   Failed: ${failed}/${RESULTS.length}`);
  console.log(`   Status: ${HAS_FAILURES ? '❌ FAILURES' : '✅ ALL PASSED'}\n`);

  if (HAS_FAILURES) {
    console.log('Failed tests:');
    RESULTS.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.name} [${r.status}] ${r.detail}`);
    });
    console.log();
    process.exit(1);
  }

  process.exit(0);
}

run().catch(err => {
  console.error('Smoke test runner error:', err);
  process.exit(1);
});
