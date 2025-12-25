import React, { useEffect, useMemo, useState } from 'react';
import { getSellerOrders } from '../../../services/orders';
import { getProductAttachments, PRODUCTS_API } from '../../../services/products';
import { useToast } from '../../Shared/ToastProvider';
import { formatPrice } from '../../../utils/format';
import { Link } from 'react-router-dom';

const STATUS_LABELS = {
    PENDING_PAYMENT: 'Ожидает оплаты',
    PAID: 'Оплачен',
    COMMIT: 'Списан',
    SHIPPED: 'Отправлен',
    DELIVERED: 'Доставлен',
    CANCELLED: 'Отменён',
};

const statusBadge = (s) => {
    const t = (s || '').toUpperCase();
    const map = {
        PENDING_PAYMENT: 'bg-amber-100 text-amber-700',
        PAID: 'bg-emerald-100 text-emerald-700',
        COMMIT: 'bg-emerald-100 text-emerald-700',
        SHIPPED: 'bg-blue-100 text-blue-700',
        DELIVERED: 'bg-blue-100 text-blue-700',
        CANCELLED: 'bg-gray-100 text-gray-700',
    };
    return map[t] || 'bg-gray-100 text-gray-700';
};

export default function SellerOrders() {
    const toast = useToast();
    const token = localStorage.getItem('jwtToken');

    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);

    const [status, setStatus] = useState('ALL');
    const [sortKey, setSortKey] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');
    const [q, setQ] = useState('');

    const [imgByProduct, setImgByProduct] = useState({});

    const load = async () => {
        setLoading(true);
        try {
            const list = await getSellerOrders();
            setRows(Array.isArray(list) ? list : []);
        } catch (e) {
            toast.error(e.message || 'Не удалось загрузить заказы');
            setRows([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!token) return;
        load();
    }, [token]);

    useEffect(() => {
        const ids = new Set();
        (rows || []).forEach(r => {
            if (r.productId && !imgByProduct[r.productId]) ids.add(r.productId);
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
    }, [rows]);

    const filtered = useMemo(() => {
        let arr = Array.isArray(rows) ? [...rows] : [];
        if (status !== 'ALL') {
            arr = arr.filter(r => (r.status || '').toUpperCase() === status);
        }
        if (q.trim()) {
            const s = q.trim().toLowerCase();
            arr = arr.filter(r =>
                (r.productTitle || '').toLowerCase().includes(s) ||
                (r.deliveryAddress || '').toLowerCase().includes(s) ||
                (r.customerName || '').toLowerCase().includes(s) ||
                (r.customerEmail || '').toLowerCase().includes(s) ||
                (r.customerPhone || '').toLowerCase().includes(s) ||
                String(r.orderId || '').toLowerCase().includes(s)
            );
        }
        const ts = (x) => x?.createdAt ? new Date(x.createdAt).getTime() : 0;
        arr.sort((a, b) => {
            if (sortKey === 'createdAt') return sortOrder === 'desc' ? ts(b) - ts(a) : ts(a) - ts(b);
            if (sortKey === 'quantity') {
                const A = Number(a.quantity || 0), B = Number(b.quantity || 0);
                return sortOrder === 'desc' ? B - A : A - B;
            }
            if (sortKey === 'totalItemPrice') {
                const A = Number(a.totalItemPrice || 0), B = Number(b.totalItemPrice || 0);
                return sortOrder === 'desc' ? B - A : A - B;
            }
            return 0;
        });
        return arr;
    }, [rows, status, q, sortKey, sortOrder]);

    if (!token) return null;

    return (
        <div className="max-w-7xl mx-auto p-6">
            <div className="flex flex-wrap items-center gap-3 mb-4">
                <h1 className="text-2xl font-bold w-full">
                    Заказы по моим товарам
                </h1>

                <div className="w-full md:flex-1 md:min-w-[320px]">
                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        className="w-full border rounded px-3 py-2 text-sm"
                        placeholder="Поиск по товару, адресу, покупателю или номеру заказа"
                    />
                </div>

                <div className="hidden sm:flex flex-wrap items-center gap-2 w-full">
                    {['ALL','PENDING_PAYMENT','PAID','COMMIT','SHIPPED','DELIVERED','CANCELLED'].map(s => (
                        <button
                            key={s}
                            onClick={() => setStatus(s)}
                            className={`px-3 py-1.5 rounded border text-sm ${
                                status === s
                                    ? 'bg-indigo-600 text-white border-indigo-600'
                                    : 'bg-white text-gray-800 hover:bg-gray-50'
                            }`}
                        >
                            {s === 'ALL' ? 'Все' : (STATUS_LABELS[s] || s)}
                        </button>
                    ))}
                </div>

                <div className="sm:hidden w-full">
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full border rounded px-3 py-2 text-sm"
                    >
                        {['ALL','PENDING_PAYMENT','PAID','COMMIT','SHIPPED','DELIVERED','CANCELLED'].map(s => (
                            <option key={s} value={s}>
                                {s === 'ALL' ? 'Все' : (STATUS_LABELS[s] || s)}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <select
                        value={sortKey}
                        onChange={(e) => setSortKey(e.target.value)}
                        className="border rounded px-2 py-2 text-sm"
                    >
                        <option value="createdAt">По времени</option>
                        <option value="quantity">По количеству</option>
                        <option value="totalItemPrice">По сумме позиции</option>
                    </select>

                    <select
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value)}
                        className="border rounded px-2 py-2 text-sm"
                    >
                        <option value="desc">Сначала новые</option>
                        <option value="asc">Сначала старые</option>
                    </select>
                </div>
            </div>

            <div className="border rounded-lg overflow-hidden">
                {loading ? (
                    <div className="p-6 text-gray-600">Загрузка…</div>
                ) : filtered.length === 0 ? (
                    <div className="p-6 text-gray-600">Записей нет</div>
                ) : (
                    <div className="divide-y">
                        {filtered.map((r) => {
                            const dt = r.createdAt ? new Date(r.createdAt).toLocaleString() : '';
                            const img = imgByProduct[r.productId];
                            return (
                                <div key={`${r.orderId}-${r.productId}`} className="p-3 grid grid-cols-12 gap-3 items-center">
                                    <div className="col-span-12 sm:col-span-4 flex items-center gap-3">
                                        {img ? (
                                            <img src={img} alt="" className="w-12 h-12 object-cover rounded" />
                                        ) : (
                                            <div className="w-12 h-12 bg-gray-200 rounded" />
                                        )}
                                        <div>
                                            <Link to={`/product/${r.productId}`} className="font-medium hover:underline text-sm">
                                                {r.productTitle || 'Товар'}
                                            </Link>
                                            <div className="text-xs text-gray-500">{dt}</div>
                                            <div className="text-xs text-gray-500">№ {String(r.orderId).substring(0, 8)}…</div>
                                        </div>
                                    </div>

                                    <div className="col-span-6 sm:col-span-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(r.status)}`}>
                      {r.status}
                    </span>
                                    </div>

                                    <div className="col-span-6 sm:col-span-2 text-sm">
                                        Количество: <span className="font-medium">{r.quantity}</span>
                                    </div>

                                    <div className="col-span-6 sm:col-span-2 text-sm">
                                        Цена: <span className="font-medium">{formatPrice(r.price)}</span>
                                    </div>

                                    <div className="col-span-6 sm:col-span-2 text-sm">
                                        Сумма: <span className="font-semibold">{formatPrice(r.totalItemPrice)}</span>
                                    </div>

                                    {r.deliveryAddress && (
                                        <div className="col-span-12 sm:col-span-8 text-xs text-gray-600">
                                            Доставка: {r.deliveryAddress}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}