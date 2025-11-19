export const PRODUCTS_API =
    process.env.REACT_APP_PRODUCTS_URL ||
    'http://localhost:8072/productservice/api/v1';

export async function getProductById(productUUID) {
    const res = await fetch(`${PRODUCTS_API}/products/${productUUID}`, { headers: { Accept: 'application/json' } });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

export async function getProductAttachments(productUUID) {
    const res = await fetch(`${PRODUCTS_API}/products/${productUUID}/attachments`, { headers: { Accept: 'application/json' } });
    if (!res.ok) return [];
    return res.json(); // ожидаем массив [{gridFsId|id,...}]
}