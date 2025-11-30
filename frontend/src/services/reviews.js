export const PRODUCTS_API =
    process.env.REACT_APP_PRODUCTS_URL ||
    'http://localhost:8072/productservice/api/v1';

export async function getProductRating(productUUID) {
    const res = await fetch(`${PRODUCTS_API}/products/${productUUID}/reviews/rating`, {
        headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`Rating HTTP ${res.status}`);
    return res.json();
}

export async function postReview(productUUID, { mark, text }, token) {
    const res = await fetch(`${PRODUCTS_API}/products/${productUUID}/reviews`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ mark, text }),
    });
    if (res.status === 202) return { accepted: true };
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return { accepted: true };
}

export async function getProductReviews(productUUID, { limit = 10, offset = 0 } = {}) {
    const url = `${PRODUCTS_API}/products/${productUUID}/reviews?limit=${limit}&offset=${offset}`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return [];
    const data = await res.json();
    return (Array.isArray(data) ? data : []).map((x, i) => ({
        id: x.id ?? `${x.userId}-${i}`,
        userId: x.userId,
        rating: Number(x.rating ?? 0),
        text: x.text ?? '',
        createdAt: x.updated_at ?? null
    }));
}