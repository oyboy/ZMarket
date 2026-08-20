import { apiFetch } from './http';
export const USERS_API = process.env.REACT_APP_USERS_URL || 'http://localhost:8072/userservice/api/v1';

export async function registerUser(body) {
    const res = await apiFetch(`${USERS_API}/users/register`, {
        method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(body),
    });
    if (res.status === 201 || res.status === 200) {
        const api = await res.json().catch(()=>({})); return api?.data || api;
    }
    let msg = `HTTP ${res.status}`; try {
        const err = await res.json(); if (err?.message) msg = Array.isArray(err.details)? `${err.message}: ${err.details.join('; ')}` : err.message;
    } catch {}
    throw new Error(msg);
}
export async function becomeSeller(body) {
    const res = await apiFetch(`${USERS_API}/users/become-seller`, {
        method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(body),
    });
    if (res.ok) { const api = await res.json().catch(()=>({})); return api?.message || 'Вы успешно стали продавцом'; }
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    if (res.status === 403) throw new Error('FORBIDDEN');
    let msg = `HTTP ${res.status}`; try { const err=await res.json(); if (err?.message) msg=err.message; } catch {}
    throw new Error(msg);
}

async function readJson(res) {
    const text = await res.text().catch(() => '');
    if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        if (text) {
            try {
                const err = JSON.parse(text);
                msg = err?.message || msg;
                if (Array.isArray(err?.details)) msg = `${msg}: ${err.details.join('; ')}`;
            } catch {
                msg = text || msg;
            }
        }
        throw new Error(msg);
    }
    if (!text) return null;
    try {
        return JSON.parse(text);
    } catch {
        return null;
    }
}

const unwrap = (json) => (json && typeof json === 'object' && 'success' in json ? json.data : json) ?? null;

export async function getSellerInfo(userId) {
    const res = await apiFetch(`${USERS_API}/users/${userId}/seller-info`);
    const json = await readJson(res);
    return unwrap(json);
}

export async function updateSellerProfile({ companyName, description }) {
    const res = await apiFetch(`${USERS_API}/users/seller/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName, description }),
    });
    const json = await readJson(res);
    return unwrap(json);
}

export async function uploadSellerAvatar(file) {
    const form = new FormData();
    form.append('file', file);
    const res = await apiFetch(`${USERS_API}/users/seller/avatar`, {
        method: 'POST',
        body: form,
    });
    const json = await readJson(res);
    return unwrap(json);
}

export async function deleteSellerAvatar() {
    const res = await apiFetch(`${USERS_API}/users/seller/avatar`, { method: 'DELETE' });
    const json = await readJson(res);
    return unwrap(json);
}