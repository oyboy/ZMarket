import { apiFetch } from './api';

function trimEndSlash(s) { return (s || '').replace(/\/+$/, ''); }
const ORDERS_BASE = trimEndSlash(process.env.REACT_APP_ORDERS_URL || 'http://localhost:8072/orderservice/api/v1');
const ORDERS_API = `${ORDERS_BASE}/orders`;

export async function getMyOrders() {
    const api = await apiFetch(`${ORDERS_API}/my`);
    return api?.data || api || [];
}

export async function getOrder(orderId) {
    const api = await apiFetch(`${ORDERS_API}/${orderId}`);
    return api?.data || api || null;
}

export async function createOrder({ deliveryAddress }) {
    const api = await apiFetch(`${ORDERS_API}`, {
        method: 'POST',
        body: JSON.stringify({ deliveryAddress }),
    });
    return api?.data || api || null;
}

export async function getSellerOrders() {
    const api = await apiFetch(`${ORDERS_API}/seller`);
    return api?.data || api || [];
}