import { apiFetchJSON } from './http';

export const apiFetch = async (url, options = {}) => {
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
    };
    return apiFetchJSON(url, { ...options, headers });
};