import { apiFetch } from './http';

const USERS_API =
    process.env.REACT_APP_USERS_URL ||
    'http://localhost:8072/userservice/api/v1';

export async function adminGetPendingSellers() {
    const res = await apiFetch(`${USERS_API}/admin/pending-sellers`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const api = await res.json().catch(() => ({}));
    return api?.data || [];
}

export async function adminVerifySeller(userId) {
    const res = await apiFetch(`${USERS_API}/admin/verify-seller/${userId}`, { method: 'POST' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const api = await res.json().catch(() => ({}));
    return api?.message || 'Верификация успешна';
}

export async function adminRejectSeller(userId, reason) {
    const res = await apiFetch(`${USERS_API}/admin/reject-seller-verification/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // контроллер принимает String reason
        body: reason || '',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const api = await res.json().catch(() => ({}));
    return api?.message || 'Верификация отклонена';
}

export async function adminGetRejectedSellers() {
    const url = `${USERS_API}/admin/rejected-sellers`;
    const res = await apiFetch(url);
    if (res.status === 404) return [];
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const api = await res.json().catch(() => ({}));
    return api?.data || [];
}