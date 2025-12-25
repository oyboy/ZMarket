export const PRODUCTS_API =
    (process.env.REACT_APP_PRODUCTS_URL || 'http://localhost:8072/productservice/api/v1').replace(/\/+$/, '');

export async function getProductById(productUUID) {
    const res = await fetch(`${PRODUCTS_API}/products/${productUUID}`, { headers: { Accept: 'application/json' } });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

export async function getProductAttachments(productUUID) {
    const res = await fetch(`${PRODUCTS_API}/products/${productUUID}/attachments`, { headers: { Accept: 'application/json' } });
    if (!res.ok) return [];
    return res.json();
}

export const buildAttachmentUrl = (key) =>
    key ? `${PRODUCTS_API}/products/attachments/download?key=${encodeURIComponent(key)}` : null;


export async function addProduct(payload, token) {
    const res = await fetch(`${PRODUCTS_API}/products`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
    });
    if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Failed to add product: ${res.status} ${txt}`);
    }
    return res.json();
}

export async function updateProduct(uuid, payload, token) {
    const res = await fetch(`${PRODUCTS_API}/products/${uuid}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
    });
    if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Failed to update product: ${res.status} ${txt}`);
    }
    return res.json();
}

export async function getProducts({ page = 0, size = 20, order = 'id', categoryId = null } = {}) {
    const params = new URLSearchParams();
    params.set('page', page);
    params.set('size', size);
    params.set('order', order);
    if (categoryId != null) params.set('categoryId', categoryId);

    const res = await fetch(`${PRODUCTS_API}/products?${params.toString()}`);
    if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(txt || `HTTP ${res.status}`);
    }
    return res.json();
}