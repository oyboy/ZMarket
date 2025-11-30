import { apiFetch } from './api';

function trimEndSlash(s) { return (s || '').replace(/\/+$/, ''); }
const CART_BASE = trimEndSlash(process.env.REACT_APP_CART_URL || 'http://localhost:8072/cartservice/api/v1');
const CART_API = `${CART_BASE}/cart`;

export async function getCart() {
    const data = await apiFetch(`${CART_API}`);
    return data || { cartItems: [], totalItems: 0, totalPrice: 0 };
}

export async function addToCart(productId, quantity = 1) {
    return apiFetch(`${CART_API}/items`, {
        method: 'POST',
        body: JSON.stringify({ productId, quantity }),
    });
}

export async function setCartItemQuantity(productId, quantity) {
    return apiFetch(`${CART_API}/items`, {
        method: 'PUT',
        body: JSON.stringify({ productId, quantity }),
    });
}

export async function removeFromCart(productId) {
    return apiFetch(`${CART_API}/items/${productId}`, { method: 'DELETE' });
}

export async function clearCart() {
    await apiFetch(`${CART_API}`, { method: 'DELETE' });
}