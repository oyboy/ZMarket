import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter } from 'k6/metrics';
import { getAuthHeaders } from './auth.js';

const ORDER_BASE_URL = __ENV.ORDER_BASE_URL || 'http://localhost:8072/orderservice';
const DEMO_USER_ID   = __ENV.DEMO_USER_ID   || '911ffaa6-476f-409d-a98a-6845033af404';

export const bulkheadFull = new Counter('bulkhead_full');

export const options = {
    scenarios: {
        order_bulkhead_demo: {
            executor: 'constant-arrival-rate',
            rate: 10,
            timeUnit: '1s',
            duration: '30s',
            preAllocatedVUs: 30,
            maxVUs: 100,
            exec: 'order_bulkhead_flow',
        },
    },
    thresholds: {
        'bulkhead_full': ['count>0'],
        'http_req_failed{scenario:order_bulkhead_demo}': ['rate<0.7'],
    },
};

export function order_bulkhead_flow() {
    const headers = getAuthHeaders();

    const res = http.get(
        `${ORDER_BASE_URL}/api/v1/orders/demo/user-contact?userId=${DEMO_USER_ID}`,
        { headers },
    );

    if (res.status === 503) {
        bulkheadFull.add(1);
    }

    check(res, {
        'status is 2xx or 503': (r) =>
            (r.status >= 200 && r.status < 300) || r.status === 503,
    });

    sleep(0.1);
}

export default order_bulkhead_flow;