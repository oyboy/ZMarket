import { apiFetch } from './api';

function trimEndSlash(s) { return (s || '').replace(/\/+$/, ''); }
const W_BASE = trimEndSlash(process.env.REACT_APP_WAREHOUSE_URL || 'http://localhost:8072/warehouseservice/api/v1');
export const WAREHOUSE_API = `${W_BASE}/warehouse`;

export async function getStockInfo(productId) {
    const api = await apiFetch(`${WAREHOUSE_API}/${productId}`).catch((e) => {
        if (e.status === 404) return null;
        throw e;
    });
    if (!api) return null;
    if (api.success === false) throw new Error(api.message || 'Ошибка склада');
    return api.data || null;
}

export async function addStock(productId, quantity) {
    const api = await apiFetch(`${WAREHOUSE_API}/add`, {
        method: 'POST',
        body: JSON.stringify({ productId, quantity }),
    });
    if (api?.success === false) throw new Error(api.message || 'Не удалось пополнить склад');
    return api;
}

export async function removeStock(productId, quantity) {
    const api = await apiFetch(`${WAREHOUSE_API}/remove`, {
        method: 'POST',
        body: JSON.stringify({ productId, quantity }),
    });
    if (api?.success === false) throw new Error(api.message || 'Не удалось уменьшить остаток');
    return api;
}

export async function setStock(productId, newQuantity) {
    const api = await apiFetch(`${WAREHOUSE_API}/set`, {
        method: 'POST',
        body: JSON.stringify({ productId, quantity: newQuantity }),
    });
    if (api?.success === false) throw new Error(api.message || 'Не удалось установить остаток');
    return api;
}

export async function getMovements(productId, { limit = 20, offset = 0 } = {}) {
    const api = await apiFetch(`${WAREHOUSE_API}/${productId}/movements?limit=${limit}&offset=${offset}`);
    if (api?.success === false) throw new Error(api.message || 'Не удалось получить движение');
    const list = api?.data || api;
    return Array.isArray(list) ? list : [];
}