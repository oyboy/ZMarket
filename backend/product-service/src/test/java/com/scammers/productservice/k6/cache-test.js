import http from 'k6/http';
import { check } from 'k6';

export const options = {
    stages: [
        { duration: '10s', target: 100 },
        { duration: '10s', target: 500 },
        { duration: '20s', target: 1000 },
        { duration: '5s', target: 100 },
    ],
    thresholds: {
        http_req_duration: ['p(95)<500'],
        http_req_failed: ['rate<0.01'],
    },
};

const AUTH_URL = 'http://localhost:8072/authservice/auth/login';
const USERNAME = 'user';
const PASSWORD = 'pass';

const BASE_URL = 'http://localhost:8072/productservice/api/v1/products';
const PRODUCT_ID = '48c885f9-cfdb-4c39-b31f-7f99900eb2da';

let authToken = '';

export function setup() {
    console.log('Getting auth token...');

    const formData = JSON.stringify({
        username: USERNAME,
        password: PASSWORD,
    });

    const authResponse = http.post(AUTH_URL, formData, {
        headers: { 'Content-Type': 'application/json' },
    });

    if (authResponse.status !== 200) {
        throw new Error(`Auth failed: ${authResponse.status} - ${authResponse.body}`);
    }

    const token = authResponse.json('access_token');
    console.log('Token received successfully');

    return { token };
}

export default function(data) {
    const headers = {
        'Authorization': `Bearer ${data.token}`,
        'Content-Type': 'application/json',
    };

    const res = http.get(`${BASE_URL}/${PRODUCT_ID}`, {
        headers: headers,
        tags: { name: 'cached-product' }
    });

    check(res, {
        'status is 200': (r) => r.status === 200,
        'response time < 500ms': (r) => r.timings.duration < 500,
    });
}