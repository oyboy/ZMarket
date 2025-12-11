import React, { useEffect, useMemo, useState } from 'react';
import { getMyOrders } from '../../../services/orders';
import { emulatePaymentSuccess, emulatePaymentFail } from '../../../services/payments';
import { formatPrice } from '../../../utils/format';
import { useToast } from '../../Shared/ToastProvider';
import { Link, useNavigate } from 'react-router-dom';
import { getProductAttachments, PRODUCTS_API } from '../../../services/products';

const STATUS_LABELS = {
    ALL: 'Все',
    PENDING_PAYMENT: 'Ожидает оплаты',
    PAID: 'Оплачен',
    COMMIT: 'Списан',
    CANCELLED: 'Отменён',
};

const STATUSES = Object.keys(STATUS_LABELS);

export default function OrdersPage({ onRequireAuth }) {
    const toast = useToast();
    const navigate = useNavigate();
    const token = localStorage.getItem('jwtToken');

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('ALL');
    const [imgByProduct, setImgByProduct] = useState({});

    const load = async () => {
        setLoading(true);
        try {
            const list = await getMyOrders();
            setOrders(Array.isArray(list) ? list : []);
        } catch (e) {
            setOrders([]);
            toast.error(e.message || 'Не удалось загрузить заказы');
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
        let cancelled = false;
        const ids = new Set();
        (orders || []).forEach(o => (o.items || []).forEach(it => {
            if (!it?.imageUrl && it?.productId && !imgByProduct[it.productId]) ids.add(it.productId);
        }));
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
    }, [orders, imgByProduct]);

    const filtered = useMemo(() => {
        const t = (status || 'ALL').toUpperCase();
        if (t === 'ALL') return orders;
        return orders.filter(o => (o.status || '').toUpperCase() === t);
    }, [orders, status]);

    const paySuccess = async (o) => {
        try {
            await emulatePaymentSuccess(o.id);
            toast.success('Оплата успешно эмулирована');
            await load();
        } catch (e) {
            toast.error(e.message || 'Не удалось провести оплату');
        }
    };

    const payFail = async (o) => {
        try {
            await emulatePaymentFail(o.id);
            toast.warn('Эмуляция ошибки оплаты отправлена');
            await load();
        } catch (e) {
            toast.error(e.message || 'Не удалось отправить ошибку оплаты');
        }
    };

    const badge = (s) => {
        const t = (s || '').toUpperCase();
        const map = {
            PENDING: 'bg-amber-100 text-amber-700',
            PENDING_PAYMENT: 'bg-amber-100 text-amber-700',
            PAID: 'bg-emerald-100 text-emerald-700',
            COMMIT: 'bg-emerald-100 text-emerald-700',
            SHIPPED: 'bg-blue-100 text-blue-700',
            DELIVERED: 'bg-blue-100 text-blue-700',
            CANCELLED: 'bg-gray-100 text-gray-700',
            FAILED: 'bg-rose-100 text-rose-700',
        };
        return map[t] || 'bg-gray-100 text-gray-700';
    };

    const leftText = (expiresAt) => {
        if (!expiresAt) return null;
        const d = new Date(expiresAt).getTime() - Date.now();
        if (d <= 0) return 'истёк';
        const m = Math.floor(d / 60000);
        const s = Math.floor((d % 60000) / 1000);
        return `${m}м ${s}с`;
    };

    if (!token) return null;

    return (
        <div className="max-w-7xl mx-auto p-6">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold">Мои заказы</h1>
                <div className="sm:hidden">
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="border rounded px-3 py-2 text-sm"
                    >
                        {STATUSES.map((s) => (
                            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                        ))}
                    </select>
                </div>
                <div className="hidden sm:flex items-center gap-2">
                    {STATUSES.map((s) => (
                        <button
                            key={s}
                            onClick={() => setStatus(s)}
                            className={`px-3 py-1.5 rounded border text-sm ${
                                status === s ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-800 hover:bg-gray-50'
                            }`}
                        >
                            {STATUS_LABELS[s]}
                        </button>
                    ))}
                </div>
            </div>

            <div className="border rounded-lg overflow-hidden">
                {loading ? (
                    <div className="p-6 text-gray-600">Загрузка…</div>
                ) : filtered.length === 0 ? (
                    <div className="p-6 text-gray-600">Заказов пока нет</div>
                ) : (
                    filtered.map(o => {
                        const created = o.createdAt ? new Date(o.createdAt) : null;
                        const expires = o.expiresAt ? new Date(o.expiresAt) : null;
                        const canPay = ['NEW','PENDING','PENDING_PAYMENT'].includes((o.status || '').toUpperCase());
                        return (
                            <div key={o.id} className="p-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4 border-b last:border-b-0">
                                <div className="flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge(o.status)}`}>{o.status}</span>
                                        <span className="text-sm text-gray-600">№ {String(o.id).substring(0, 8)}…</span>
                                        {created && <span className="text-xs text-gray-500">от {created.toLocaleString()}</span>}
                                        {['NEW','PENDING','PENDING_PAYMENT'].includes((o.status || '').toUpperCase()) && o.expiresAt && (
                                            <span className="text-xs text-gray-500">· оплата до {new Date(o.expiresAt).toLocaleString()} ({leftText(o.expiresAt)})</span>
                                        )}
                                    </div>
                                    <div className="text-sm text-gray-700">
                                        Итог: <span className="font-semibold">{formatPrice(o.totalPrice)}</span>
                                    </div>
                                    {o.deliveryAddress && (
                                        <div className="text-sm text-gray-600">Доставка: {o.deliveryAddress}</div>
                                    )}
                                    {Array.isArray(o.items) && o.items.length > 0 && (
                                        <div className="mt-2 grid gap-2">
                                            {o.items.map(it => (
                                                <div key={`${o.id}-${it.productId}`} className="flex items-center gap-3">
                                                    {(it.imageUrl || imgByProduct[it.productId]) ? (
                                                        <img src={it.imageUrl || imgByProduct[it.productId]} alt="" className="w-12 h-12 object-cover rounded" />
                                                    ) : (
                                                        <div className="w-12 h-12 bg-gray-200 rounded" />
                                                    )}
                                                    <div className="flex-1">
                                                        <Link to={`/product/${it.productId}`} className="hover:underline text-sm">{it.title || it.productId}</Link>
                                                        <div className="text-xs text-gray-500">{it.sellerName || ''}</div>
                                                    </div>
                                                    <div className="text-right text-sm">
                                                        <div className="font-medium">{formatPrice(it.price)}</div>
                                                        <div className="text-gray-600">x {it.quantity}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Link to={`/orders/${o.id}`} className="px-3 py-1.5 rounded border text-sm">Открыть</Link>
                                    {canPay && (
                                        <>
                                            <button onClick={() => paySuccess(o)} className="px-3 py-1.5 rounded bg-emerald-600 text-white text-sm hover:bg-emerald-700">Оплатить (успех)</button>
                                            <button onClick={() => payFail(o)} className="px-3 py-1.5 rounded bg-rose-600 text-white text-sm hover:bg-rose-700">Оплата с ошибкой</button>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}