import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL, thresholds, summaryTrendStats } from './shared.ts';

export const options = {
  stages: [
    { duration: '5m', target: 50 },
    { duration: '10m', target: 50 },
    { duration: '30s', target: 0 },
  ],
  thresholds,
  summaryTrendStats,
};

export default function () {
  const res = http.get(`${BASE_URL}/genres`);
  check(res, {
    'status is 200': (r) => r.status === 200,
  });
}
