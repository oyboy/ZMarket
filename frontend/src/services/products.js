//export const PRODUCTS_API =
//    process.env.REACT_APP_PRODUCTS_URL ||
//    'http://localhost:8072/productservice/api/v1';
//
//export async function getProductById(productUUID) {
//    const res = await fetch(`${PRODUCTS_API}/products/${productUUID}`, { headers: { Accept: 'application/json' } });
//    if (res.status === 404) return null;
//    if (!res.ok) throw new Error(`HTTP ${res.status}`);
//    return res.json();
//}
//
//export async function getProductAttachments(productUUID) {
//    const res = await fetch(`${PRODUCTS_API}/products/${productUUID}/attachments`, { headers: { Accept: 'application/json' } });
//    if (!res.ok) return [];
//    return res.json(); // ожидаем массив [{gridFsId|id,...}]
//}



export const PRODUCTS_API = process.env.REACT_APP_PRODUCTS_URL || 'http://localhost:8072/productservice/api/v1';

export const getProductById = async (id) => {
    try {
        const response = await fetch(`${PRODUCTS_API}/products/${id}`);
        if (!response.ok) return null;
        return await response.json();
    } catch {
        return null;
    }
};

export const getProductAttachments = async (id) => {
    try {
        const response = await fetch(`${PRODUCTS_API}/products/${id}/attachments`);
        if (!response.ok) return [];
        return await response.json();
    } catch {
        return [];
    }
};

export const getProducts = async () => {
    try {
        const response = await fetch(`${PRODUCTS_API}/products`);
        if (!response.ok) return [];
        return await response.json();
    } catch {
        return [];
    }
};

export const createProduct = async (productData, token) => {
    try {
        const response = await fetch(`${PRODUCTS_API}/products`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(productData)
        });
        return await response.json();
    } catch {
        return null;
    }
};

export const updateProduct = async (id, productData, token) => {
    try {
        const response = await fetch(`${PRODUCTS_API}/products/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(productData)
        });
        return await response.json();
    } catch {
        return null;
    }
};

export const deleteProduct = async (id, token) => {
    try {
        const response = await fetch(`${PRODUCTS_API}/products/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.ok;
    } catch {
        return false;
    }
};

export const uploadAttachment = async (productId, file, token) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch(`${PRODUCTS_API}/products/${productId}/attachments`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        return await response.json();
    } catch {
        return null;
    }
};

export const setMainAttachment = async (productId, attachmentId, token) => {
    try {
        const response = await fetch(`${PRODUCTS_API}/products/${productId}/attachments/${attachmentId}/main`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.ok;
    } catch {
        return false;
    }
};

export const deleteAttachment = async (productId, attachmentId, token) => {
    try {
        const response = await fetch(`${PRODUCTS_API}/products/${productId}/attachments/${attachmentId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.ok;
    } catch {
        return false;
    }
};

