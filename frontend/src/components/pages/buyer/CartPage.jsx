import React, { useEffect, useState } from 'react';
import { getCart, addToCart, setCartItemQuantity, removeFromCart, clearCart } from '../../../services/cart';
import { formatPrice } from '../../../utils/format';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../../Shared/ToastProvider';

export default function CartPage({ onRequireAuth }) {
    const token = localStorage.getItem('jwtToken');
    const navigate = useNavigate();
    const toast = useToast();

    const [cart, setCart] = useState({ cartItems: [], totalItems: 0, totalPrice: 0 });
    const [loading, setLoading] = useState(false);

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
        if (!token) { onRequireAuth?.(); return; }
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    const onAddOne = async (pId) => {
        try {
            await addToCart(pId, 1);
            await load();
            toast.success('Добавлено в корзину');
        } catch (e) {
            toast.error(e.message || 'Не удалось добавить в корзину');
        }
    };

    const onDecOne = async (pId, currentQty) => {
        try {
            if (currentQty > 1) {
                await setCartItemQuantity(pId, currentQty - 1);
                await load();
            } else {
                await removeFromCart(pId);
                await load();
            }
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
        <div className="max-w-5xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-4">Моя корзина</h1>

            {loading ? (
                <div>Загрузка…</div>
            ) : cart.cartItems.length === 0 ? (
                <div className="text-gray-600">
                    Корзина пуста. <Link to="/" className="text-blue-600 hover:underline">Перейти в каталог</Link>
                </div>
            ) : (
                <>
                    <div className="divide-y border rounded-lg">
                        {cart.cartItems.map((it) => (
                            <div key={it.productId} className="p-3 flex items-center gap-4">
                                {it.imageUrl ? (
                                    <img src={it.imageUrl} alt="" className="w-16 h-16 object-cover rounded" />
                                ) : (
                                    <div className="w-16 h-16 bg-gray-200 rounded" />
                                )}
                                <div className="flex-1">
                                    <Link to={`/product/${it.productId}`} className="font-medium hover:underline">
                                        {it.title}
                                    </Link>
                                    <div className="text-sm text-gray-600">
                                        Продавец: {it.sellerName || '—'}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-semibold">{formatPrice(it.price)}</div>
                                    <div className="text-sm text-gray-600">x {it.quantity}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => onDecOne(it.productId, it.quantity)} className="px-3 py-1.5 rounded border">−</button>
                                    <span className="w-8 text-center">{it.quantity}</span>
                                    <button onClick={() => onAddOne(it.productId)} className="px-3 py-1.5 rounded border">+1</button>
                                    <button onClick={() => onRemoveItem(it.productId)} className="px-3 py-1.5 rounded border text-red-600">Удалить</button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                        <div className="text-gray-700">
                            Товаров: <span className="font-medium">{cart.totalItems}</span>
                        </div>
                        <div className="text-xl font-bold">
                            Итого: {formatPrice(cart.totalPrice)}
                        </div>
                    </div>

                    <div className="mt-4 flex items-center gap-3">
                        <button onClick={onClear} className="px-4 py-2 rounded border">Очистить</button>
                        <button onClick={() => navigate('/')} className="px-4 py-2 rounded border">Продолжить покупки</button>
                        <button className="px-4 py-2 rounded bg-blue-600 text-white">Оформить заказ</button>
                    </div>
                </>
            )}
        </div>
    );
}