import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';

const responseTime = new Trend('landing_page_response_time');

const BASE_URL = __ENV.BASE_URL || 'https://studybuddyph.site';

export const options = {
  scenarios: {
    multiple_user_visit: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '15s', target: 50 }, // ramp up to 50 concurrent "visitors"
        { duration: '1m', target: 50 },  // hold 50 concurrent for 1 minute
        { duration: '10s', target: 0 },  // ramp down
      ],
      gracefulRampDown: '5s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'], // fewer than 1% of requests should fail
  },
};

export default function () {
  const res = http.get(BASE_URL);

  responseTime.add(res.timings.duration);

  check(res, {
    'status is 200': (r) => r.status === 200,
  });

  sleep(1);
}

// Prints a clean summary at the end — this is the number you'll put
// in the "Average Response Time" column for the Multiple User Visit row.
export function handleSummary(data) {
  const avg = data.metrics.landing_page_response_time.values.avg;
  const p95 = data.metrics.landing_page_response_time.values['p(95)'];
  const failRate = data.metrics.http_req_failed.values.rate;
  const totalRequests = data.metrics.http_reqs.values.count;

  console.log(`
=== Landing Page: Multiple User Visit (50 concurrent) ===
Total requests:        ${totalRequests}
Average response time: ${avg.toFixed(2)} ms
95th percentile:       ${p95.toFixed(2)} ms
Failure rate:          ${(failRate * 100).toFixed(2)}%
Status:                ${failRate < 0.01 ? 'PASSED' : 'FAILED'}
`);

  return {
    stdout: JSON.stringify(
      {
        total_requests: totalRequests,
        avg_response_time_ms: avg,
        p95_response_time_ms: p95,
        failure_rate: failRate,
        status: failRate < 0.01 ? 'PASSED' : 'FAILED',
      },
      null,
      2
    ),
  };
}