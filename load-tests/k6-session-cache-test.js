import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate } from 'k6/metrics';

const cacheHitRate = new Rate('cache_hit_rate');
const coldRequestDuration = new Trend('cold_request_duration');
const warmRequestDuration = new Trend('warm_request_duration');
const cooldownEnforcedRate = new Rate('cooldown_enforced_rate');

const FIREBASE_API_KEY = __ENV.FIREBASE_API_KEY;
const FUNCTIONS_BASE = __ENV.FUNCTIONS_BASE || 'https://us-central1-study-buddy-cbaa8.cloudfunctions.net';
const BASE_URL = __ENV.BASE_URL || 'https://studybuddyph.site';
const NUM_USERS = 50;

const IDENTITY_TOOLKIT_URL = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`;
const CACHEABLE_ENDPOINT = `${BASE_URL}/`;

export const options = {
  scenarios: {
    session_and_cache: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 50 },
        { duration: '2m', target: 50 },
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '10s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<800'],
    cooldown_enforced_rate: ['rate>0.95'],
  },
};

function testUser(vuId) {
  return {
    email: `loadtest_user_${vuId}@studybuddyph.site`,
    password: 'LoadTest123!',
  };
}

// Runs ONCE before the load test, not per-VU-per-iteration. Logs each
// test user in sequentially with a small gap so Identity Toolkit's
// abuse protection doesn't throttle a burst of 50 simultaneous
// sign-ins from one IP. Tokens are handed to each VU via the return
// value, so login never happens again during the actual load ramp.
export function setup() {
  const tokens = [];
  for (let i = 1; i <= NUM_USERS; i++) {
    const user = testUser(i);
    const res = http.post(
      IDENTITY_TOOLKIT_URL,
      JSON.stringify({ email: user.email, password: user.password, returnSecureToken: true }),
      { headers: { 'Content-Type': 'application/json' } }
    );

    if (res.status === 200) {
      tokens.push(JSON.parse(res.body).idToken);
    } else {
      console.warn(`setup: login failed for user ${i}: ${res.status} ${res.body}`);
      tokens.push(null);
    }

    sleep(0.3); // stagger sign-ins to stay under Identity Toolkit's rate limit
  }
  return { tokens };
}

export default function (data) {
  const idToken = data.tokens[__VU - 1];

  group('1. Per-user cooldown isolation under concurrency (session test)', function () {
    if (!idToken) return; // this VU's setup login failed, skip cleanly

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    };
    const body = JSON.stringify({ mode: 'quiz', numItems: 5 });

    const first = http.post(`${FUNCTIONS_BASE}/generateStudyMaterial`, body, { headers });
    check(first, {
      'first call: auth + cooldown passed (400, not 401/429)': (r) => r.status === 400,
    });

    sleep(0.3);

    const second = http.post(`${FUNCTIONS_BASE}/generateStudyMaterial`, body, { headers });
    const blocked = check(second, {
      'second call blocked by cooldown (429)': (r) => r.status === 429,
    });
    cooldownEnforcedRate.add(blocked);
  });

  group('2. Cache behavior on Firebase Hosting (cold vs warm)', function () {
    const coldRes = http.get(CACHEABLE_ENDPOINT, { headers: { 'Cache-Control': 'no-cache' } });
    coldRequestDuration.add(coldRes.timings.duration);

    sleep(0.2);

    const warmRes = http.get(CACHEABLE_ENDPOINT);
    warmRequestDuration.add(warmRes.timings.duration);

    // Firebase Hosting's CDN doesn't expose Age/X-Cache headers, so
    // hit/miss can't be asserted reliably from outside — just record
    // whether Cache-Control is present and let response times speak
    // for themselves in the summary instead of failing on a guess.
    cacheHitRate.add(!!warmRes.headers['Cache-Control']);

    check(warmRes, {
      'warm response OK': (r) => r.status === 200 || r.status === 304,
    });
  });

  sleep(1);
}

export function handleSummary(data) {
  return {
    stdout: JSON.stringify(
      {
        cooldown_enforced_rate: data.metrics.cooldown_enforced_rate?.values?.rate,
        avg_cold_ms: data.metrics.cold_request_duration?.values?.avg,
        avg_warm_ms: data.metrics.warm_request_duration?.values?.avg,
        cache_control_present_rate: data.metrics.cache_hit_rate?.values?.rate,
        p95_overall_ms: data.metrics.http_req_duration?.values['p(95)'],
        error_rate: data.metrics.http_req_failed?.values?.rate,
      },
      null,
      2
    ),
  };
}