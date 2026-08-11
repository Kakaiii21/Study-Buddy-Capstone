import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';

const invalidLoginTime = new Trend('invalid_login_time');
const correctlyRejected = new Rate('correctly_rejected');
const noSessionCreated = new Rate('no_session_created');

const FIREBASE_API_KEY = __ENV.FIREBASE_API_KEY;
const IDENTITY_TOOLKIT_URL = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`;
const NUM_USERS = 50;

export const options = {
  scenarios: {
    invalid_login_attempt: {
      executor: 'ramping-vus',
      startVUs: 0,
      // Staggered ramp — same reasoning as the valid-login test: an
      // instant burst of 50 failed logins from one IP risks Firebase
      // throttling ALL of them with TOO_MANY_ATTEMPTS_TRY_LATER,
      // which would look identical to "correctly rejected" in the
      // response code but means something different. Spreading them
      // out keeps this test measuring credential rejection, not
      // triggering the separate abuse-throttle layer.
      stages: [
        { duration: '20s', target: 50 },
        { duration: '20s', target: 50 },
        { duration: '5s', target: 0 },
      ],
      gracefulRampDown: '5s',
    },
  },
};

export default function () {
  const email = `loadtest_user_${__VU}@studybuddyph.site`;
  const wrongPassword = 'DefinitelyWrongPassword999!';

  const res = http.post(
    IDENTITY_TOOLKIT_URL,
    JSON.stringify({ email, password: wrongPassword, returnSecureToken: true }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  invalidLoginTime.add(res.timings.duration);

  let errorCode = null;
  let gotToken = false;
  try {
    const body = JSON.parse(res.body);
    errorCode = body.error?.message;
    gotToken = !!body.idToken;
  } catch {
    // ignore parse failure
  }

  const rejected = check(res, {
    'login correctly rejected (400)': (r) => r.status === 400,
    'rejected for wrong credentials, not rate-limited': () =>
      errorCode === 'INVALID_LOGIN_CREDENTIALS' || errorCode === 'INVALID_PASSWORD',
  });
  correctlyRejected.add(rejected);
  noSessionCreated.add(!gotToken);

  if (errorCode === 'TOO_MANY_ATTEMPTS_TRY_LATER') {
    console.warn(`VU ${__VU}: hit rate-limit instead of credential check — reduce ramp speed or NUM_USERS`);
  }

  sleep(1);
}

export function handleSummary(data) {
  const t = data.metrics.invalid_login_time?.values;
  const rejectedRate = data.metrics.correctly_rejected?.values?.rate;
  const noSessionRate = data.metrics.no_session_created?.values?.rate;

  const avgSec = t?.avg / 1000;
  const p95Sec = t?.['p(95)'] / 1000;

  console.log(`
=== Login: Invalid Login Attempt Testing Result ===
Average response time: ${avgSec.toFixed(4)} s  (${t?.avg.toFixed(2)} ms)
p95 response time:     ${p95Sec.toFixed(4)} s
Correctly rejected:    ${(rejectedRate * 100).toFixed(2)}%
No session created:    ${(noSessionRate * 100).toFixed(2)}%
Status:                ${rejectedRate > 0.95 && noSessionRate === 1 ? 'PASSED' : 'FAILED'}
`);

  return {
    stdout: JSON.stringify(
      {
        row4_invalid_login_avg_sec: Number(avgSec.toFixed(4)),
        row4_invalid_login_avg_ms: t?.avg,
        row4_correctly_rejected_rate: rejectedRate,
        row4_no_session_created_rate: noSessionRate,
        row4_status: rejectedRate > 0.95 && noSessionRate === 1 ? 'PASSED' : 'FAILED',
      },
      null,
      2
    ),
  };
}