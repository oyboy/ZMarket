import { PRODUCTS_API } from './products';

export async function getPopularProducts(limit = 10) {
    const url = `${PRODUCTS_API}/products/recommendations/popular?limit=${encodeURIComponent(
        limit
    )}`;
    const res = await fetch(url, {
        headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
        throw new Error(`Popular recommendations HTTP ${res.status}`);
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
}

export async function getPersonalRecommendations(limit = 10, token) {
    if (!token) return [];
    const url = `${PRODUCTS_API}/products/recommendations/personal?limit=${encodeURIComponent(
        limit
    )}`;
    const res = await fetch(url, {
        headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
        },
    });
    if (!res.ok) {
        if (res.status === 401) return [];
        throw new Error(`Personal recommendations HTTP ${res.status}`);
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
}

export async function getSameManufacturerProducts(productUUID, { limit = 6 } = {}) {
    const url = `${PRODUCTS_API}/products/recommendations/${productUUID}/same-manufacturer?limit=${encodeURIComponent(
        limit
    )}`;
    const res = await fetch(url, {
        headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
        throw new Error(`Same-manufacturer HTTP ${res.status}`);
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
}