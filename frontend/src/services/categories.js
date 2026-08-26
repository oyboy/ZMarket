import { PRODUCTS_API } from './products';

function normalizeTree(raw) {
    const arr = Array.isArray(raw) ? raw : [];
    return arr.map(node => ({
        id: node.id ?? node.categoryId,
        name: node.name ?? node.title,
        parentId: node.parentId ?? node.parent_id ?? null,
        children: normalizeTree(node.children || node.childs || node.subcategories || [])
    }));
}

function toTreeFromFlat(flat) {
    const byId = new Map();
    flat.forEach(c => {
        const id = c.id ?? c.categoryId;
        byId.set(id, { id, name: c.name ?? c.title, parentId: c.parentId ?? c.parent_id ?? null, children: [] });
    });
    const roots = [];
    byId.forEach((n) => {
        if (n.parentId && byId.has(n.parentId)) {
            byId.get(n.parentId).children.push(n);
        } else {
            roots.push(n);
        }
    });
    return roots;
}

export async function getCategories() {
    let res = await fetch(`${PRODUCTS_API}/categories/tree`);
    if (res.ok) {
        const raw = await res.json();
        return normalizeTree(raw);
    }
    res = await fetch(`${PRODUCTS_API}/categories`);
    if (!res.ok) return [];
    const raw = await res.json();
    if (!Array.isArray(raw)) return [];
    return toTreeFromFlat(raw);
}

async function req(path, { method = 'GET', token, body } = {}) {
    const res = await fetch(`${PRODUCTS_API}/categories${path}`, {
        method,
        headers: {
            Accept: 'application/json',
            ...(body ? { 'Content-Type': 'application/json' } : {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: body ? JSON.stringify(body) : undefined
    });
    if (!res.ok) {
        const txt = await res.text().catch(() => '');
        const err = new Error(txt || `HTTP ${res.status}`);
        err.status = res.status;
        throw err;
    }
    if (res.status === 204) return null;
    return res.json();
}

export async function getAllCategories(token) {
    return req('', { token });
}

export async function getCategoryTree(token) {
    return req('/tree', { token });
}

export async function createCategory(payload, token) {
    return req('', { method: 'POST', token, body: payload });
}

export async function updateCategory(id, payload, token) {
    return req(`/${id}`, { method: 'PUT', token, body: payload });
}

export async function deleteCategory(id, token) {
    return req(`/${id}`, { method: 'DELETE', token });
}