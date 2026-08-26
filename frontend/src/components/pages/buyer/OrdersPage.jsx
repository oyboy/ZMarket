import React, { useEffect, useMemo, useState } from 'react';
import { getMyOrders } from '../../../services/orders';
import { emulatePaymentSuccess, emulatePaymentFail } from '../../../services/payments';
import { formatPrice } from '../../../utils/format';
import { useToast } from '../../Shared/ToastProvider';
import { Link, useNavigate } from 'react-router-dom';
import { getProductAttachments, PRODUCTS_API } from '../../../services/products';
import RecommendationsSection from '../../Productservice/RecommendationsSection';

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
        (orders || []).forEach(o =>
            (o.items || []).forEach(it => {
                if (!it?.imageUrl && it?.productId && !imgByProduct[it.productId]) {
                    ids.add(it.productId);
                }
            })
        );
        if (ids.size === 0) return;
        (async () => {
            const entries = await Promise.all(
                [...ids].map(async (pid) => {
                    try {
                        const list = await getProductAttachments(pid);
                        const first = Array.isArray(list) && list.length ? list[0] : null;
                        const key = first ? (first.objectKey || first.key) : null;
                        const url = key
                            ? `${PRODUCTS_API}/products/attachments/download?key=${encodeURIComponent(
                                key
                            )}`
                            : null;
                        return [pid, url];
                    } catch {
                        return [pid, null];
                    }
                })
            );
            if (cancelled) return;
            setImgByProduct(prev => {
                const next = { ...prev };
                entries.forEach(([pid, url]) => {
                    if (url) next[pid] = url;
                });
                return next;
            });
        })();
        return () => {
            cancelled = true;
        };
    }, [orders]);

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Мои заказы</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        История покупок и статус ваших заказов
                    </p>
                </div>
                <div className="sm:hidden">
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="border rounded px-3 py-2 text-sm bg-white"
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
                            className={`px-3 py-1.5 rounded-full border text-sm transition-colors ${
                                status === s
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                    : 'bg-white text-gray-800 hover:bg-gray-50'
                            }`}
                        >
                            {STATUS_LABELS[s]}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-600">Загрузка…</div>
                ) : filtered.length === 0 ? (
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
                                    d="M9 20l-5.447-2.724A2 2 0 013 15.382V6.618a2 2 0 011.105-1.789L9 3m6 17l5.447-2.724A2 2 0 0021 15.382V6.618a2 2 0 00-1.105-1.789L15 3M9 3l6 3m-6-3v17m6-14v14"
                                />
                            </svg>
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-1">
                            Заказов пока нет
                        </h2>
                        <p className="text-sm text-gray-500">
                            Как только вы что‑нибудь купите, заказы появятся здесь.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {filtered.map((o, index) => {
                            const created = o.createdAt ? new Date(o.createdAt) : null;
                            const canPay = ['NEW','PENDING','PENDING_PAYMENT'].includes((o.status || '').toUpperCase());
                            return (
                                <div
                                    key={o.id}
                                    className={`p-4 sm:p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 transition-colors ${
                                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                                    }`}
                                >
                                    <div className="flex-1">
                                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge(o.status)}`}>
                                                {o.status}
                                            </span>
                                            <span className="text-sm text-gray-700">
                                                № {String(o.id).substring(0, 8)}…
                                            </span>
                                            {created && (
                                                <span className="text-xs text-gray-500">
                                                    от {created.toLocaleString()}
                                                </span>
                                            )}
                                            {['NEW','PENDING','PENDING_PAYMENT'].includes((o.status || '').toUpperCase()) && o.expiresAt && (
                                                <span className="text-xs text-gray-500">
                                                    · оплата до {new Date(o.expiresAt).toLocaleString()} ({leftText(o.expiresAt)})
                                                </span>
                                            )}
                                        </div>

                                        <div className="text-sm text-gray-700 mb-1">
                                            Итог:{' '}
                                            <span className="font-semibold">
                                                {formatPrice(o.totalPrice)}
                                            </span>
                                        </div>
                                        {o.deliveryAddress && (
                                            <div className="text-sm text-gray-600">
                                                Доставка: {o.deliveryAddress}
                                            </div>
                                        )}

                                        {Array.isArray(o.items) && o.items.length > 0 && (
                                            <div className="mt-3 space-y-2">
                                                {o.items.map(it => (
                                                    <div
                                                        key={`${o.id}-${it.productId}`}
                                                        className="flex items-center gap-3"
                                                    >
                                                        {(it.imageUrl || imgByProduct[it.productId]) ? (
                                                            <img
                                                                src={it.imageUrl || imgByProduct[it.productId]}
                                                                alt=""
                                                                className="w-12 h-12 object-cover rounded border border-gray-200"
                                                            />
                                                        ) : (
                                                            <div className="w-12 h-12 bg-gray-200 rounded border border-gray-200" />
                                                        )}
                                                        <div className="flex-1 min-w-0">
                                                            <Link
                                                                to={`/product/${it.productId}`}
                                                                className="hover:underline text-sm text-gray-900 truncate"
                                                            >
                                                                {it.title || it.productId}
                                                            </Link>
                                                            <div className="text-xs text-gray-500 truncate">
                                                                {it.sellerName || ''}
                                                            </div>
                                                        </div>
                                                        <div className="text-right text-sm whitespace-nowrap">
                                                            <div className="font-medium">
                                                                {formatPrice(it.price)}
                                                            </div>
                                                            <div className="text-gray-600">
                                                                x {it.quantity}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 self-start sm:self-auto">
                                        <Link
                                            to={`/orders/${o.id}`}
                                            className="px-3 py-1.5 rounded-lg border text-sm bg-white hover:bg-gray-50"
                                        >
                                            Открыть
                                        </Link>
                                        {canPay && (
                                            <>
                                                <button
                                                    onClick={() => paySuccess(o)}
                                                    className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-700"
                                                >
                                                    Оплатить (успех)
                                                </button>
                                                <button
                                                    onClick={() => payFail(o)}
                                                    className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-sm hover:bg-rose-700"
                                                >
                                                    Оплата с ошибкой
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
            <div className="mt-10">
                <RecommendationsSection token={token} />
            </div>
        </div>
    );
}