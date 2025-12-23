import http from 'k6/http';
import { check, fail } from 'k6';

const KEYCLOAK_BASE_URL  = __ENV.KEYCLOAK_BASE_URL  || 'http://localhost:8074';
const KEYCLOAK_REALM     = __ENV.KEYCLOAK_REALM     || 'master';
const KEYCLOAK_CLIENT_ID = __ENV.KEYCLOAK_CLIENT_ID || 'front-client';
const KEYCLOAK_CLIENT_SECRET = __ENV.KEYCLOAK_CLIENT_SECRET || '';

const TEST_USERNAME = __ENV.TEST_USERNAME || 'Test2@mail.com';
const TEST_PASSWORD = __ENV.TEST_PASSWORD || 'Test2@mail.com';

let cachedToken = null;
let cachedExpiresAt = 0;

export function getAccessToken() {
    const now = Date.now();
    if (cachedToken && now < cachedExpiresAt - 5000) {
        return cachedToken;
    }

    const url = `${KEYCLOAK_BASE_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`;

    const payload = {
        grant_type: 'password',
        client_id: KEYCLOAK_CLIENT_ID,
        username: TEST_USERNAME,
        password: TEST_PASSWORD,
    };

    if (KEYCLOAK_CLIENT_SECRET) {
        payload.client_secret = KEYCLOAK_CLIENT_SECRET;
    }

    const params = {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    };

    const res = http.post(url, payload, params);

    check(res, {
        'auth: статус 200': (r) => r.status === 200,
        'auth: есть access_token': (r) => !!r.json('access_token'),
    });

    if (res.status !== 200) {
        fail(`Не удалось получить токен. Статус: ${res.status}, тело: ${res.body}`);
    }

    const body = res.json();
    cachedToken = body.access_token;
    const expiresIn = body.expires_in || 60;
    cachedExpiresAt = now + expiresIn * 1000;

    return cachedToken;
}

export function getAuthHeaders() {
    const token = getAccessToken();
    return {
        Authorization: `Bearer ${token}`,
    };
}