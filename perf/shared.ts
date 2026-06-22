export const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export const thresholds = {
  http_req_failed: ['rate<0.01'],
  http_req_duration: ['p(95)<3000'],
};

export const summaryTrendStats = ['avg', 'min', 'med', 'p(90)', 'p(95)', 'p(99)', 'max'];
