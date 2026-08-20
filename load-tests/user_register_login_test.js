import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8072/userservice';

const KEYCLOAK_BASE_URL   = __ENV.KEYCLOAK_BASE_URL   || 'http://localhost:8074';
const KEYCLOAK_REALM      = __ENV.KEYCLOAK_REALM      || 'master';
const KEYCLOAK_CLIENT_ID  = __ENV.KEYCLOAK_CLIENT_ID  || 'front-client';
const KEYCLOAK_CLIENT_SECRET = __ENV.KEYCLOAK_CLIENT_SECRET || '';

export const rateLimitedResponses = new Counter('rate_limited_responses');
export const registerErrors       = new Counter('register_errors');
export const loginErrors          = new Counter('login_errors');

export const options = {
    scenarios: {
        demo_register: {
            executor: 'ramping-arrival-rate',
            startRate: 2,
            timeUnit: '1s',
            preAllocatedVUs: 20,
            maxVUs: 100,

            stages: [
                { target: 5,  duration: '10s' },
                { target: 10, duration: '15s' },
                { target: 20, duration: '20s' },
            ],
            exec: 'register_and_login_flow',
        },
    },

    thresholds: {
        'http_req_failed{scenario:demo_register}': ['rate<0.3'],
        'http_req_duration{type:register,scenario:demo_register}': ['p(95)<2000'],
        'http_req_duration{type:login,scenario:demo_register}':    ['p(95)<2000'],
        'rate_limited_responses': ['count>0'],
    },
};

function buildRandomUser() {
    const suffix = `${__VU}-${__ITER}-${Date.now()}`;
    const email = `testuser+${suffix}@example.com`;
    const password = 'Aa123456';

    return {
        firstName: 'Test',
        lastName: 'User',
        email,
        password,
        confirmPassword: password,
    };
}

function loginKeycloak(email, password) {
    const url = `${KEYCLOAK_BASE_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`;

    const payload = {
        grant_type: 'password',
        client_id: KEYCLOAK_CLIENT_ID,
        // client_secret: KEYCLOAK_CLIENT_SECRET,
        username: email,
        password: password,
    };

    const params = {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        tags: { type: 'login' },
    };

    const res = http.post(url, payload, params);

    if (res.status === 429) {
        rateLimitedResponses.add(1);
    }
    if (res.status >= 400) {
        loginErrors.add(1);
    }

    check(res, {
        'login: статус 200': (r) => r.status === 200,
        'login: есть access_token': (r) =>
            r.status === 200 && !!r.json('access_token'),
    });

    return res;
}

export function register_and_login_flow() {
    const user = buildRandomUser();

    const registerRes = http.post(
        `${BASE_URL}/api/v1/users/register`,
        JSON.stringify(user),
        {
            headers: { 'Content-Type': 'application/json' },
            tags: { type: 'register' },
        },
    );

    if (registerRes.status === 429) {
        rateLimitedResponses.add(1);
    }
    if (registerRes.status >= 400) {
        registerErrors.add(1);
    }

    check(registerRes, {
        'register: статус 2xx': (r) => r.status >= 200 && r.status < 300,
    });

    loginKeycloak(user.email, user.password);

    sleep(1);
}

export default register_and_login_flow;