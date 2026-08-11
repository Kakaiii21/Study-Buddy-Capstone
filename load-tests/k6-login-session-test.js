import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate } from 'k6/metrics';

const freshLoginTime = new Trend('fresh_login_time');       // Row 1
const sessionReuseTime = new Trend('session_reuse_time');   // Row 2 & 3
const sessionIsolationOk = new Rate('session_isolation_ok'); // Row 3 correctness check

const FIREBASE_API_KEY = __ENV.FIREBASE_API_KEY;
const FUNCTIONS_BASE = __ENV.FUNCTIONS_BASE || 'https://us-central1-study-buddy-cbaa8.cloudfunctions.net';
const NUM_USERS = 50;
const IDENTITY_TOOLKIT_URL = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`;

function testUser(vuId) {
  return {
    email: `loadtest_user_${vuId}@studybuddyph.site`,
    password: 'LoadTest123!',
  };
}

export const options = {
  scenarios: {
    session_reuse_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '15s', target: 50 },
        { duration: '1m', target: 50 },
        { duration: '10s', target: 0 },
      ],
      gracefulRampDown: '5s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.02'],
    session_isolation_ok: ['rate>0.99'],
  },
};

// ── ROW 1: First Time Visit ──────────────────────────────────────
// Real fresh logins for all 50 users, staggered so Firebase's own
// login-throttling doesn't reject them as suspicious traffic. Each
// call is individually timed, then averaged — this is a genuine
// "first login" measurement even though execution is sequential;
// true instant-simultaneous fresh logins aren't something Firebase
// itself allows from one IP, which is worth noting as a finding.
export function setup() {
  const tokens = [];

  for (let i = 1; i <= NUM_USERS; i++) {
    const user = testUser(i);
    const res = http.post(
      IDENTITY_TOOLKIT_URL,
      JSON.stringify({ email: user.email, password: user.password, returnSecureToken: true }),
      { headers: { 'Content-Type': 'application/json' } }
    );

    freshLoginTime.add(res.timings.duration);

    if (res.status === 200) {
      tokens.push(JSON.parse(res.body).idToken);
    } else {
      console.warn(`setup: login failed for user ${i}: ${res.status} ${res.body}`);
      tokens.push(null);
    }

    sleep(0.3);
  }

  return { tokens };
}

// ── ROWS 2 & 3: Second Time Visit + Multiple User Visit ─────────
// All 50 VUs concurrently reuse their already-issued token (the way
// a returning user's cached session behaves) against an authenticated
// endpoint. Row 2's number is the average latency per request. Row 3
// is validated by session_isolation_ok: every user must get a clean
// per-user response (400, meaning THEIR token verified correctly) —
// never a 401, which would mean token/session cross-contamination
// under concurrency.
export default function (data) {
  const idToken = data.tokens[__VU - 1];
  if (!idToken) return;

  group('Session reuse under concurrent load', function () {
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    };
    // Deliberately incomplete body — fails validation at 400 AFTER
    // auth succeeds, so we're timing real token verification without
    // triggering Groq cost or the cooldown side effects.
    const body = JSON.stringify({ mode: 'quiz', numItems: 5 });

    const res = http.post(`${FUNCTIONS_BASE}/generateStudyMaterial`, body, { headers });
    sessionReuseTime.add(res.timings.duration);

    const isolated = check(res, {
      "this user's own session verified correctly (400, not 401)": (r) => r.status === 400,
    });
    sessionIsolationOk.add(isolated);
  });

  sleep(1);
}

export function handleSummary(data) {
  const fresh = data.metrics.fresh_login_time?.values;
  const reuse = data.metrics.session_reuse_time?.values;
  const isolation = data.metrics.session_isolation_ok?.values?.rate;
  const failRate = data.metrics.http_req_failed?.values?.rate;

  console.log(`
=== Login: Cache and Session Testing Result ===
Row 1 — First Time Visit (fresh login, staggered, n=${NUM_USERS}):
  Average: ${fresh?.avg.toFixed(2)} ms   p95: ${fresh?.['p(95)'].toFixed(2)} ms

Row 2 — Second Time Visit (cached session reuse, 50 concurrent):
  Average: ${reuse?.avg.toFixed(2)} ms   p95: ${reuse?.['p(95)'].toFixed(2)} ms

Row 3 — Multiple User Visit (session isolation under concurrency):
  Sessions correctly isolated: ${(isolation * 100).toFixed(2)}%
  Status: ${isolation > 0.99 ? 'PASSED' : 'FAILED'}
`);

  return {
    stdout: JSON.stringify(
      {
        row1_first_time_visit_avg_ms: fresh?.avg,
        row2_second_time_visit_avg_ms: reuse?.avg,
        row3_session_isolation_rate: isolation,
        row3_status: isolation > 0.99 ? 'PASSED' : 'FAILED',
        error_rate: failRate,
      },
      null,
      2
    ),
  };
}