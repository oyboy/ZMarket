export const apiFetch = async (url, options = {}) => {
    const token = localStorage.getItem('jwtToken');
    const isForm = options.body instanceof FormData;

    const headers = {
        ...(isForm ? {} : { 'Content-Type': 'application/json' }),
        ...(options.headers || {}),
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(url, { ...options, headers });
    const text = await res.text().catch(() => '');

    if (res.status === 401) {
        localStorage.removeItem('jwtToken');
        throw new Error('UNAUTHORIZED');
    }
    if (res.status === 403) {
        throw new Error('FORBIDDEN');
    }

    if (!res.ok) {
        let msg = res.statusText || `HTTP ${res.status}`;
        if (text) {
            try {
                const json = JSON.parse(text);
                msg = json.message || json.error_description || json.error || msg;
            } catch {
                msg = text;
            }
        }
        const err = new Error(msg);
        err.status = res.status;
        err.body = text;
        throw err;
    }

    if (!text) return null;
    try {
        return JSON.parse(text);
    } catch {
        return null;
    }
};