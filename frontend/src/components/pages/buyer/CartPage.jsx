import React, { useEffect, useState } from 'react';
import { getCart, addToCart, setCartItemQuantity, removeFromCart, clearCart } from '../../../services/cart';
import { formatPrice } from '../../../utils/format';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../../Shared/ToastProvider';
import { createOrder } from '../../../services/orders';
import { getProductAttachments, PRODUCTS_API } from '../../../services/products';
import RecommendationsSection from '../../Productservice/RecommendationsSection';

export default function CartPage({ onRequireAuth }) {
    const toast = useToast();
    const navigate = useNavigate();

    const token = localStorage.getItem('jwtToken');

    const [cart, setCart] = useState({ cartItems: [], totalItems: 0, totalPrice: 0 });
    const [loading, setLoading] = useState(false);

    const [checkoutOpen, setCheckoutOpen] = useState(false);
    const [addr, setAddr] = useState('');
    const [creating, setCreating] = useState(false);

    const [imgByProduct, setImgByProduct] = useState({});

    const load = async () => {
        setLoading(true);
        try {
            const data = await getCart();
            setCart({
                cartItems: data?.cartItems || [],
                totalItems: Number(data?.totalItems || 0),
                totalPrice: Number(data?.totalPrice || 0),
            });
        } catch (e) {
            toast.error(e.message || 'Не удалось загрузить корзину');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!token) {
            onRequireAuth?.();
            return;
        }
        load();
    }, [token]);

    useEffect(() => {
        const ids = new Set();
        (cart.cartItems || []).forEach(it => {
            if (!it?.imageUrl && it?.productId && !imgByProduct[it.productId]) ids.add(it.productId);
        });
        if (ids.size === 0) return;

        let cancelled = false;
        (async () => {
            const entries = await Promise.all([...ids].map(async (pid) => {
                try {
                    const list = await getProductAttachments(pid);
                    const first = Array.isArray(list) && list.length ? list[0] : null;
                    const key = first ? (first.objectKey || first.key) : null;
                    const url = key ? `${PRODUCTS_API}/products/attachments/download?key=${encodeURIComponent(key)}` : null;
                    return [pid, url];
                } catch {
                    return [pid, null];
                }
            }));
            if (cancelled) return;
            setImgByProduct(prev => {
                const next = { ...prev };
                entries.forEach(([pid, url]) => { if (url) next[pid] = url; });
                return next;
            });
        })();

        return () => { cancelled = true; };
    }, [cart]);

    const onAddOne = async (pId) => {
        try {
            await addToCart(pId, 1);
            await load();
            toast.success('Добавлено в корзину');
        } catch (e) {
            toast.error(e.message || 'Не удалось добавить');
        }
    };

    const onDecOne = async (pId, currentQty) => {
        try {
            if (currentQty > 1) {
                await setCartItemQuantity(pId, currentQty - 1);
            } else {
                await removeFromCart(pId);
            }
            await load();
        } catch (e) {
            toast.error(e.message || 'Не удалось изменить количество');
        }
    };

    const onRemoveItem = async (pId) => {
        try {
            await removeFromCart(pId);
            await load();
            toast.info('Товар удалён из корзины');
        } catch (e) {
            toast.error(e.message || 'Не удалось удалить из корзины');
        }
    };

    const onClear = async () => {
        try {
            await clearCart();
            await load();
            toast.info('Корзина очищена');
        } catch (e) {
            toast.error(e.message || 'Не удалось очистить корзину');
        }
    };

    if (!token) return null;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Моя корзина</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Товары, которые вы собираетесь купить
                    </p>
                </div>
                {cart.totalItems > 0 && (
                    <div className="hidden sm:flex items-center text-sm text-gray-600">
                        Товаров: <span className="ml-1 font-medium">{cart.totalItems}</span>
                    </div>
                )}
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-600">Загрузка…</div>
                ) : cart.cartItems.length === 0 ? (
                    <div className="p-10 text-center">
                        <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
                            <svg
                                className="w-8 h-8 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M3 3h2l.4 2M7 13h10l3-8H6.4М7 13L5.4 5M7 13l-2 7h14l-2-7M10 21a1 1 0 11-2 0 1 1 0 012 0zm8 0a1 1 0 11-2 0 1 1 0 012 0z"
                                />
                            </svg>
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-1">
                            Корзина пуста
                        </h2>
                        <p className="text-sm text-gray-500 mb-4">
                            Добавьте товары в корзину, чтобы оформить заказ.
                        </p>
                        <Link
                            to="/"
                            className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-md"
                        >
                            Перейти в каталог
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="divide-y divide-gray-100">
                            {cart.cartItems.map((it, index) => (
                                <div
                                    key={it.productId}
                                    className={`p-4 sm:p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 transition-colors ${
                                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                                    }`}
                                >
                                    <div className="flex items-center gap-4 flex-1">
                                        {(it.imageUrl || imgByProduct[it.productId]) ? (
                                            <img
                                                src={it.imageUrl || imgByProduct[it.productId]}
                                                alt=""
                                                className="w-16 h-16 object-cover rounded border border-gray-200"
                                            />
                                        ) : (
                                            <div className="w-16 h-16 bg-gray-200 rounded border border-gray-200" />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <Link
                                                to={`/product/${it.productId}`}
                                                className="font-medium text-sm text-gray-900 hover:underline truncate"
                                            >
                                                {it.title}
                                            </Link>
                                            <div className="text-xs text-gray-500 truncate">
                                                Продавец: {it.sellerName || '—'}
                                            </div>
                                            <div className="mt-1 text-xs text-gray-500">
                                                Товар ID: {String(it.productId).substring(0, 8)}…
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3">
                                        <div className="text-right sm:text-left">
                                            <div className="font-semibold text-gray-900">
                                                {formatPrice(it.price)}
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                x {it.quantity}
                                            </div>
                                            <div className="text-xs text-gray-400 mt-0.5">
                                                {formatPrice(it.price * it.quantity)}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 justify-end">
                                            <button
                                                onClick={() => onDecOne(it.productId, it.quantity)}
                                                className="px-3 py-1.5 rounded-lg border text-sm hover:bg-gray-50"
                                            >
                                                −
                                            </button>
                                            <span className="w-8 text-center text-sm font-medium text-gray-800">
                                                {it.quantity}
                                            </span>
                                            <button
                                                onClick={() => onAddOne(it.productId)}
                                                className="px-3 py-1.5 rounded-lg border text-sm hover:bg-gray-50"
                                            >
                                                +1
                                            </button>
                                            <button
                                                onClick={() => onRemoveItem(it.productId)}
                                                className="px-3 py-1.5 rounded-lg border text-sm text-rose-600 hover:bg-rose-50"
                                            >
                                                Удалить
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="px-4 sm:px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-gray-50">
                            <div className="text-sm text-gray-700">
                                Товаров:{' '}
                                <span className="font-semibold">
                                    {cart.totalItems}
                                </span>
                            </div>
                            <div className="flex items-center gap-4 justify-between sm:justify-end flex-1">
                                <div className="text-lg sm:text-xl font-bold text-gray-900">
                                    Итого: {formatPrice(cart.totalPrice)}
                                </div>
                                <div className="flex flex-wrap gap-2 justify-end">
                                    <button
                                        onClick={onClear}
                                        className="px-4 py-2 rounded-lg border text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                        Очистить
                                    </button>
                                    <button
                                        onClick={() => navigate('/')}
                                        className="px-4 py-2 rounded-lg border text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                        Продолжить покупки
                                    </button>
                                    <button
                                        onClick={() => setCheckoutOpen(true)}
                                        className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-md"
                                    >
                                        Оформить заказ
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            <div className="mt-10">
                <RecommendationsSection token={token} />
            </div>

            {checkoutOpen && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-5 py-4 border-b flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Оформление заказа
                            </h3>
                            <button
                                onClick={() => setCheckoutOpen(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ×
                            </button>
                        </div>
                        <div className="px-5 py-4 space-y-3">
                            <label className="block text-sm text-gray-700 mb-1">
                                Адрес доставки
                            </label>
                            <textarea
                                rows={3}
                                value={addr}
                                onChange={(e) => setAddr(e.target.value)}
                                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                                placeholder="Город, улица, дом, квартира..."
                            />
                        </div>
                        <div className="px-5 py-4 border-t flex justify-end gap-2 bg-gray-50">
                            <button
                                onClick={() => setCheckoutOpen(false)}
                                className="px-4 py-2 rounded-lg border text-sm text-gray-700 hover:bg-gray-100"
                            >
                                Отмена
                            </button>
                            <button
                                onClick={async () => {
                                    const value = addr.trim();
                                    if (!value) {
                                        toast.warn('Укажите адрес');
                                        return;
                                    }
                                    setCreating(true);
                                    try {
                                        const order = await createOrder({ deliveryAddress: value });
                                        toast.success('Заказ создан');
                                        setCheckoutOpen(false);
                                        navigate(`/orders/${order.id}`);
                                    } catch (e) {
                                        toast.error(e.message || 'Не удалось создать заказ');
                                    } finally {
                                        setCreating(false);
                                    }
                                }}
                                disabled={creating || !addr.trim()}
                                className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {creating ? 'Создаём…' : 'Создать заказ'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}