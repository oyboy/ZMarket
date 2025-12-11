import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getOrder } from '../../../services/orders';
import { emulatePaymentSuccess, emulatePaymentFail } from '../../../services/payments';
import { formatPrice } from '../../../utils/format';
import { useToast } from '../../Shared/ToastProvider';
import { getProductAttachments, PRODUCTS_API } from '../../../services/products';

const statusStyle = (s) => {
    const t = (s || '').toUpperCase();
    const map = {
        NEW: 'bg-amber-100 text-amber-700',
        PENDING_PAYMENT: 'bg-amber-100 text-amber-700',
        PAID: 'bg-emerald-100 text-emerald-700',
        COMMIT: 'bg-emerald-100 text-emerald-700',
        CANCELLED: 'bg-gray-100 text-gray-700',
        EXPIRED: 'bg-rose-100 text-rose-700',
    };
    return map[t] || 'bg-gray-100 text-gray-700';
};

export default function OrderDetails() {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [imgByProduct, setImgByProduct] = useState({});

    const load = async () => {
        setLoading(true);
        try {
            const data = await getOrder(orderId);
            setOrder(data);
        } catch (e) {
            toast.error(e.message || 'Не удалось загрузить заказ');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); /* eslint-disable-next-line */ }, [orderId]);

    useEffect(() => {
        if (!order?.items?.length) return;
        let cancelled = false;
        const ids = new Set();
        order.items.forEach(it => {
            if (!it?.imageUrl && it?.productId && !imgByProduct[it.productId]) ids.add(it.productId);
        });
        if (ids.size === 0) return;

        (async () => {
            const entries = await Promise.all([...ids].map(async (pid) => {
                try {
                    const list = await getProductAttachments(pid);
                    const first = Array.isArray(list) && list.length ? list[0] : null;
                    const attId = first ? (first.gridFsId || first.id || first) : null;
                    const url = attId ? `${PRODUCTS_API}/products/${attId}/attachments-fs` : null;
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
    }, [order, imgByProduct]);

    const canPay = ['NEW','PENDING_PAYMENT'].includes((order?.status || '').toUpperCase());

    const payOk = async () => {
        try {
            await emulatePaymentSuccess(order.id);
            toast.success('Оплата успешно эмулирована');
            await load();
        } catch (e) {
            toast.error(e.message || 'Не удалось провести оплату');
        }
    };
    const payFail = async () => {
        try {
            await emulatePaymentFail(order.id);
            toast.warn('Эмуляция ошибки оплаты отправлена');
            await load();
        } catch (e) {
            toast.error(e.message || 'Не удалось отправить ошибку оплаты');
        }
    };

    if (loading) return <div className="max-w-5xl mx-auto p-6">Загрузка…</div>;
    if (!order) {
        return (
            <div className="max-w-5xl mx-auto p-6">
                <button onClick={() => navigate(-1)} className="text-blue-600 hover:underline">Назад</button>
                <div className="mt-4 text-gray-600">Заказ не найден</div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto p-6">
            <button onClick={() => navigate(-1)} className="text-blue-600 hover:underline">Назад</button>

            <div className="mt-4 flex items-center gap-3">
                <h1 className="text-2xl font-bold">Заказ {String(order.id).substring(0, 8)}…</h1>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusStyle(order.status)}`}>{order.status}</span>
            </div>

            <div className="mt-2 text-gray-700">
                Итог: <span className="font-semibold">{formatPrice(order.totalPrice)}</span>
            </div>
            {order.deliveryAddress && (
                <div className="text-sm text-gray-600">Доставка: {order.deliveryAddress}</div>
            )}
            <div className="text-xs text-gray-500">
                {order.createdAt && <>Создан: {new Date(order.createdAt).toLocaleString()} </>}
                {order.expiresAt && <>· Оплатить до: {new Date(order.expiresAt).toLocaleString()}</>}
            </div>

            <div className="mt-4 border rounded-lg overflow-hidden">
                {Array.isArray(order.items) && order.items.length > 0 ? (
                    order.items.map(it => (
                        <div key={`${order.id}-${it.productId}`} className="p-3 flex items-center gap-3 border-b last:border-b-0">
                            {(it.imageUrl || imgByProduct[it.productId]) ? (
                                <img src={it.imageUrl || imgByProduct[it.productId]} alt="" className="w-14 h-14 object-cover rounded" />
                            ) : (
                                <div className="w-14 h-14 bg-gray-200 rounded" />
                            )}
                            <div className="flex-1">
                                <Link to={`/product/${it.productId}`} className="hover:underline">{it.title || it.productId}</Link>
                                <div className="text-xs text-gray-500">{it.sellerName || ''}</div>
                            </div>
                            <div className="text-right">
                                <div className="font-medium">{formatPrice(it.price)}</div>
                                <div className="text-sm text-gray-600">x {it.quantity}</div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="p-4 text-gray-600">Товары не найдены</div>
                )}
            </div>

            {canPay && (
                <div className="mt-4 flex items-center gap-2">
                    <button onClick={payOk} className="px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700">Оплатить (успех)</button>
                    <button onClick={payFail} className="px-4 py-2 rounded bg-rose-600 text-white hover:bg-rose-700">Оплата с ошибкой</button>
                </div>
            )}
        </div>
    );
}