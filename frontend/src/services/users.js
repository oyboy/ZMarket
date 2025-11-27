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