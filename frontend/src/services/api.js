export const apiFetch = async (url, options = {}) => {
    const token = localStorage.getItem('jwtToken');
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(url, { ...options, headers });

    if (res.status === 401) {
        localStorage.removeItem('jwtToken');
        // Можно уведомить пользователя (alert, toast)
        return null;
    }
    if (res.status === 403) {
        // Можно уведомить пользователя (alert, toast)
        return null;
    }
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
    }

    const text = await res.text();
    try {
        return text ? JSON.parse(text) : null;
    } catch {
        return null;
    }
};