import React, { useEffect, useMemo, useState } from 'react';
import { getSellerTopProducts, getDailySalesForProduct } from '../../../services/sellerStats';
import { formatPrice } from '../../../utils/format';
import { useToast } from '../../Shared/ToastProvider';
import { getProductAttachments, PRODUCTS_API } from '../../../services/products';

const formatDateInput = (d) => d.toISOString().slice(0, 10);

const SellerStats = () => {
    const toast = useToast();
    const token = localStorage.getItem('jwtToken');

    const [from, setFrom] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return formatDateInput(d);
    });
    const [to, setTo] = useState(() => formatDateInput(new Date()));
    const [limit, setLimit] = useState(10);

    const [top, setTop] = useState([]);
    const [topLoading, setTopLoading] = useState(false);
    const [topError, setTopError] = useState('');

    const [selectedProduct, setSelectedProduct] = useState(null);
    const [daily, setDaily] = useState([]);
    const [dailyLoading, setDailyLoading] = useState(false);
    const [dailyError, setDailyError] = useState('');

    const [imgByProduct, setImgByProduct] = useState({});

    const loadTop = async () => {
        setTopLoading(true);
        setTopError('');
        try {
            const list = await getSellerTopProducts({ from, to, limit });
            const arr = Array.isArray(list) ? list : [];
            setTop(arr);
            if (arr.length > 0) {
                setSelectedProduct(arr[0]);
            } else {
                setSelectedProduct(null);
                setDaily([]);
            }
        } catch (e) {
            setTop([]);
            setTopError(e.message || 'Не удалось загрузить статистику');
        } finally {
            setTopLoading(false);
        }
    };

    useEffect(() => {
        if (!token) return;
        loadTop();
    }, [token]);

    useEffect(() => {
        let alive = true;
        (async () => {
            if (!selectedProduct || !selectedProduct.product) {
                setDaily([]);
                setDailyError('');
                return;
            }
            setDailyLoading(true);
            setDailyError('');
            try {
                const uuid = selectedProduct.product.productUUID || selectedProduct.product.id;
                const points = await getDailySalesForProduct(uuid, { from, to });
                if (!alive) return;
                setDaily(Array.isArray(points) ? points : []);
            } catch (e) {
                if (!alive) return;
                setDaily([]);
                setDailyError(e.message || 'Не удалось загрузить график продаж');
            } finally {
                if (alive) setDailyLoading(false);
            }
        })();
        return () => {
            alive = false;
        };
    }, [selectedProduct, from, to]);

    useEffect(() => {
        const ids = new Set();
        (top || []).forEach(row => {
            const p = row.product;
            if (!p) return;
            const pid = p.productUUID || p.id;
            if (!pid) return;
            if (!imgByProduct[pid]) ids.add(pid);
        });
        if (ids.size === 0) return;

        let cancelled = false;
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
    }, [top]);

    const totalQty = useMemo(
        () => daily.reduce((acc, p) => acc + Number(p.quantitySum || 0), 0),
        [daily]
    );
    const maxQty = useMemo(
        () => daily.reduce((m, p) => Math.max(m, Number(p.quantitySum || 0)), 0),
        [daily]
    );

    const handleApply = () => {
        loadTop();
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Статистика по заказам
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Топ товаров по заказам и динамика продаж по дням
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5 mb-8">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div className="flex flex-wrap gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                С даты
                            </label>
                            <input
                                type="date"
                                value={from}
                                max={to}
                                onChange={(e) => setFrom(e.target.value)}
                                className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                По дату
                            </label>
                            <input
                                type="date"
                                value={to}
                                min={from}
                                onChange={(e) => setTo(e.target.value)}
                                className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                Топ товаров
                            </label>
                            <select
                                value={limit}
                                onChange={(e) => setLimit(Number(e.target.value))}
                                className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                            >
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={handleApply}
                            disabled={topLoading}
                            className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-sm disabled:opacity-50"
                        >
                            Обновить
                        </button>
                    </div>
                </div>
                {topError && (
                    <div className="mt-3 text-sm text-red-600">
                        {topError}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3">
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-sm font-semibold text-gray-800">
                                Топ товаров по заказам
                            </h2>
                            {topLoading && (
                                <span className="text-xs text-gray-400">
                                    Обновляем…
                                </span>
                            )}
                        </div>
                        {topLoading ? (
                            <div className="p-6 text-gray-600 text-sm">
                                Загрузка…
                            </div>
                        ) : top.length === 0 ? (
                            <div className="p-6 text-gray-500 text-sm">
                                Нет данных за выбранный период.
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {top.map((row, idx) => {
                                    const p = row.product;
                                    const pid = p?.productUUID || p?.id;
                                    const img = pid ? imgByProduct[pid] : null;
                                    const revenue =
                                        (p?.price || 0) * (row.quantitySum || 0);
                                    const isSelected =
                                        selectedProduct &&
                                        selectedProduct.product &&
                                        (selectedProduct.product.productUUID ||
                                            selectedProduct.product.id) ===
                                        (p.productUUID || p.id);

                                    return (
                                        <button
                                            key={p.productUUID || p.id || idx}
                                            type="button"
                                            onClick={() => setSelectedProduct(row)}
                                            className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                                                isSelected ? 'bg-indigo-50' : ''
                                            }`}
                                        >
                                            <div className="w-10 h-10 rounded bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200">
                                                {img ? (
                                                    <img
                                                        src={img}
                                                        alt=""
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
                                                        —
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="truncate text-sm font-medium text-gray-900">
                                                        {p.title || 'Товар'}
                                                    </div>
                                                    <div className="text-xs text-gray-500 flex-shrink-0">
                                                        #{String(p.id || p.productUUID || '').toString().substring(0, 6)}…
                                                    </div>
                                                </div>
                                                <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-gray-600">
                                                    <span>
                                                        Заказов:{' '}
                                                        <span className="font-semibold">
                                                            {row.ordersCount}
                                                        </span>
                                                    </span>
                                                    <span>
                                                        Штук:{' '}
                                                        <span className="font-semibold">
                                                            {row.quantitySum}
                                                        </span>
                                                    </span>
                                                    <span className="hidden sm:inline">
                                                        Выручка:{' '}
                                                        <span className="font-semibold">
                                                            {formatPrice(revenue)}
                                                        </span>
                                                    </span>
                                                </div>
                                                {row.lastOrderAt && (
                                                    <div className="mt-0.5 text-[11px] text-gray-400">
                                                        Последний заказ:{' '}
                                                        {new Date(row.lastOrderAt).toLocaleString()}
                                                    </div>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                        <div className="px-5 py-3 border-b border-gray-100">
                            <h2 className="text-sm font-semibold text-gray-800 mb-1">
                                График продаж по дням
                            </h2>
                            {selectedProduct?.product && (
                                <p className="text-xs text-gray-500 truncate">
                                    {selectedProduct.product.title}
                                </p>
                            )}
                            {totalQty > 0 && (
                                <p className="mt-1 text-xs text-gray-500">
                                    Продано за период:{' '}
                                    <span className="font-semibold text-gray-700">
                                        {totalQty} шт.
                                    </span>
                                </p>
                            )}
                        </div>
                        <div className="p-4">
                            {dailyLoading ? (
                                <div className="text-sm text-gray-600">
                                    Загрузка графика…
                                </div>
                            ) : dailyError ? (
                                <div className="text-sm text-red-600">
                                    {dailyError}
                                </div>
                            ) : !daily.length ? (
                                <div className="text-sm text-gray-500">
                                    Нет данных по продажам за выбранный период.
                                </div>
                            ) : (
                                <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
                                    {daily.map((pt) => {
                                        const q = Number(pt.quantitySum || 0);
                                        const width =
                                            maxQty > 0
                                                ? `${Math.max(5, (q * 100) / maxQty)}%`
                                                : '0%';
                                        return (
                                            <div
                                                key={pt.day}
                                                className="flex items-center gap-2 text-xs"
                                            >
                                                <div className="w-16 text-gray-500">
                                                    {pt.day}
                                                </div>
                                                <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                                                        style={{ width }}
                                                    />
                                                </div>
                                                <div className="w-10 text-right text-gray-700 font-medium">
                                                    {q}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SellerStats;