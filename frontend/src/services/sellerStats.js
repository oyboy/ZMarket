import { apiFetchJSON } from './http';
import { PRODUCTS_API } from './products';

const unwrap = (json) => {
    if (!json) return [];
    if (Array.isArray(json)) return json;
    if (Array.isArray(json.data)) return json.data;
    return [];
};

export async function getSellerTopProducts({ from, to, limit = 10 } = {}) {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (limit) params.set('limit', limit);

    const url = `${PRODUCTS_API}/seller/stats/top-products?${params.toString()}`;
    const json = await apiFetchJSON(url);
    return unwrap(json);
}

export async function getDailySalesForProduct(productUuid, { from, to } = {}) {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);

    const url = `${PRODUCTS_API}/seller/stats/products/${productUuid}/daily-sales?${params.toString()}`;
    const json = await apiFetchJSON(url);
    return unwrap(json);
}