import { apiFetch } from './api';

function trimEndSlash(s) { return (s || '').replace(/\/+$/, ''); }
const PAY_BASE = trimEndSlash(process.env.REACT_APP_PAYMENTS_URL || 'http://localhost:8072/paymentservice/api/v1');
const PAY_API = `${PAY_BASE}/payments`;

export async function emulatePaymentSuccess(orderId) {
    const api = await apiFetch(`${PAY_API}/${orderId}`, { method: 'POST' });
    return api;
}

export async function emulatePaymentFail(orderId) {
    const api = await apiFetch(`${PAY_API}/${orderId}/fail`, { method: 'POST' });
    return api;
}