import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL, thresholds, summaryTrendStats } from './shared.ts';

export const options = {
  stages: [
    { duration: '2m', target: 50 },
    { duration: '2m', target: 100 },
    { duration: '2m', target: 150 },
    { duration: '2m', target: 200 },
    { duration: '2m', target: 250 },
    { duration: '2m', target: 300 },
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
