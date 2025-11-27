export const TOKEN_URL =
    process.env.REACT_APP_KEYCLOAK_TOKEN_URL ||
    'http://localhost:8074/realms/master/protocol/openid-connect/token';

export const CLIENT_ID =
    process.env.REACT_APP_OIDC_CLIENT_ID || 'front-client';

let refreshInFlight = null;
let autoRefreshTimer = null;

function parseJwt(token) {
    try {
        return JSON.parse(atob(token.split('.')[1])) || {};
    } catch {
        return {};
    }
}

export function scheduleAutoRefresh() {
    if (autoRefreshTimer) clearTimeout(autoRefreshTimer);

    const token = localStorage.getItem('jwtToken');
    if (!token) return;

    const payload = parseJwt(token);
    const exp = (payload.exp || 0) * 1000;
    const now = Date.now();
    const skew = 30000;

    let delay = exp - now - skew;
    if (delay < 5000) delay = 5000;

    autoRefreshTimer = setTimeout(() => {
        refreshToken().catch(() => {
            localStorage.removeItem('jwtToken');
            localStorage.removeItem('refresh_token');
        });
    }, delay);
}

export function onLogin(accessToken, refreshToken) {
    localStorage.setItem('jwtToken', accessToken);
    if (refreshToken) localStorage.setItem('refresh_token', refreshToken);
    scheduleAutoRefresh();
}

export function logout() {
    if (autoRefreshTimer) clearTimeout(autoRefreshTimer);
    autoRefreshTimer = null;
    refreshInFlight = null;
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('refresh_token');
}

export async function refreshToken() {
    if (refreshInFlight) return refreshInFlight;

    const rt = localStorage.getItem('refresh_token');
    if (!rt) throw new Error('NO_REFRESH_TOKEN');

    refreshInFlight = fetch(TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: CLIENT_ID,
            grant_type: 'refresh_token',
            refresh_token: rt,
        }),
    })
        .then(async (res) => {
            if (!res.ok) throw new Error('REFRESH_FAILED');
            const data = await res.json();

            if (data.access_token) localStorage.setItem('jwtToken', data.access_token);
            if (data.refresh_token) localStorage.setItem('refresh_token', data.refresh_token);

            scheduleAutoRefresh();
            return data.access_token;
        })
        .finally(() => {
            refreshInFlight = null;
        });

    return refreshInFlight;
}

export async function apiFetch(url, options = {}) {
    const token = localStorage.getItem('jwtToken');

    const headers = {
        Accept: 'application/json',
        ...(options.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const doFetch = () => fetch(url, { ...options, headers });

    let res = await doFetch();

    if (res.status === 401) {
        try {
            await refreshToken();
            const newToken = localStorage.getItem('jwtToken');

            const headers2 = {
                ...headers,
                ...(newToken ? { Authorization: `Bearer ${newToken}` } : {}),
            };

            res = await fetch(url, { ...options, headers: headers2 });
        } catch {
            logout();
            throw new Error('UNAUTHORIZED');
        }
    }

    return res;
}

export async function apiFetchJSON(url, options = {}) {
    const res = await apiFetch(url, options);

    if (res.status === 401 || res.status === 403) {
        return null;
    }
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || res.statusText || `HTTP ${res.status}`);
    }

    const text = await res.text().catch(() => '');
    if (!text) return null;

    try {
        return JSON.parse(text);
    } catch {
        return null;
    }
}