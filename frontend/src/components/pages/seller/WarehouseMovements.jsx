import React, { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../../../services/api';
import { getStockInfo, getMovements } from '../../../services/warehouse';
import { useToast } from '../../Shared/ToastProvider';

const PRODUCTS_API = process.env.REACT_APP_PRODUCTS_URL || 'http://localhost:8072/productservice/api/v1';

const typeBadge = (t) => {
    const tt = (t || '').toUpperCase();
    const map = {
        INBOUND:    'bg-emerald-100 text-emerald-700',
        OUTBOUND:   'bg-rose-100 text-rose-700',
        RESERVE:    'bg-amber-100 text-amber-700',
        COMMIT:     'bg-blue-100 text-blue-700',
        RELEASE:    'bg-gray-100 text-gray-700',
        ADJUSTMENT: 'bg-violet-100 text-violet-700',
    };
    return map[tt] || 'bg-gray-100 text-gray-700';
};

const normalize = (m) => ({
    id: m.id || m.movementId,
    productId: m.productId || m.product_id,
    orderId: m.orderId || m.order_id || null,
    quantity: Number(m.quantity || 0),
    note: m.note || '',
    transactionType: m.transactionType || m.transaction_type || m.type || 'UNKNOWN',
    createdAt: m.createdAt || m.created_at || null,
});

export default function WarehouseMovements() {
    const toast = useToast();

    const [products, setProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(false);

    const [selectedId, setSelectedId] = useState(null);
    const selectedProduct = useMemo(
        () => products.find(p => (p.productUUID || p.id) === selectedId),
        [products, selectedId]
    );

    const [stock, setStock] = useState(null);
    const [stockLoading, setStockLoading] = useState(false);

    const [moves, setMoves] = useState([]);
    const [mvPage, setMvPage] = useState(0);
    const [mvHasMore, setMvHasMore] = useState(true);
    const [mvLoading, setMvLoading] = useState(false);

    const [typeFilter, setTypeFilter] = useState('ALL'); // ALL | INBOUND | RESERVE | COMMIT | RELEASE
    const filteredMoves = useMemo(
        () => typeFilter === 'ALL' ? moves : moves.filter(x => (x.transactionType || '').toUpperCase() === typeFilter),
        [moves, typeFilter]
    );

    const loadProducts = async () => {
        setLoadingProducts(true);
        try {
            const data = await apiFetch(`${PRODUCTS_API}/products/mine`);
            const list = Array.isArray(data) ? data : [];
            setProducts(list);
            if (list.length > 0) {
                const firstId = list[0].productUUID || list[0].id;
                setSelectedId(firstId);
            }
        } catch (e) {
            toast.error('Не удалось загрузить товары');
        } finally {
            setLoadingProducts(false);
        }
    };

    const loadStock = async (pid) => {
        setStockLoading(true);
        try {
            const info = await getStockInfo(pid);
            setStock(info);
        } catch {
            setStock(null);
        } finally {
            setStockLoading(false);
        }
    };

    const loadMoves = async (pid, reset = false) => {
        if (!pid) return;
        if (mvLoading) return;
        setMvLoading(true);
        try {
            const page = reset ? 0 : mvPage;
            const batch = await getMovements(pid, { limit: 20, offset: page * 20 });
            const norm = batch.map(normalize);
            if (reset) {
                setMoves(norm);
                setMvPage(1);
            } else {
                setMoves(prev => [...prev, ...norm]);
                setMvPage(p => p + 1);
            }
            setMvHasMore(norm.length === 20);
        } catch (e) {
            toast.error(e.message || 'Не удалось загрузить движение');
        } finally {
            setMvLoading(false);
        }
    };

    useEffect(() => { loadProducts(); /* eslint-disable-next-line */ }, []);
    useEffect(() => {
        if (!selectedId) return;
        loadStock(selectedId);
        loadMoves(selectedId, true);
        setTypeFilter('ALL');
    }, [selectedId]);

    return (
        <div className="max-w-7xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-4">Движение по складу</h1>

            {/* Выбор товара */}
            <div className="mb-4 flex flex-wrap gap-3 items-end">
                <div>
                    <label className="block text-sm text-gray-600 mb-1">Товар</label>
                    <select
                        disabled={loadingProducts || products.length === 0}
                        value={selectedId || ''}
                        onChange={(e) => setSelectedId(e.target.value)}
                        className="border rounded px-3 py-2 min-w-[280px]"
                    >
                        {products.length === 0 && <option value="">Нет товаров</option>}
                        {products.map(p => {
                            const pid = p.productUUID || p.id;
                            return <option key={pid} value={pid}>{p.title}</option>;
                        })}
                    </select>
                </div>

                {/* Статус склада */}
                <div className="text-sm text-gray-700">
                    {stockLoading ? (
                        <div className="text-gray-500">Статус склада загружается…</div>
                    ) : stock ? (
                        <div className="flex gap-4">
                            <div>Доступно: <span className="font-medium">{stock.available}</span></div>
                            <div>На полке: <span className="font-medium">{stock.quantityOnHand}</span></div>
                            <div>Резерв: <span className="font-medium">{stock.quantityReserved}</span></div>
                        </div>
                    ) : (
                        <div className="text-gray-500">Нет данных по складу</div>
                    )}
                </div>
            </div>

            {/* Фильтр по типу */}
            <div className="mb-3 flex gap-2">
                {['ALL', 'INBOUND', 'OUTBOUND', 'RESERVE', 'COMMIT', 'RELEASE', 'ADJUSTMENT'].map(t => (
                    <button
                        key={t}
                        onClick={() => setTypeFilter(t)}
                        className={`px-3 py-1.5 rounded border text-sm ${
                            typeFilter === t ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-800 hover:bg-gray-50'
                        }`}
                    >
                        {({
                            ALL:'Все',
                            INBOUND:'Поступление',
                            OUTBOUND:'Ручное списание',
                            RESERVE:'Резерв',
                            COMMIT:'Списание (оплата)',
                            RELEASE:'Снятие резерва',
                            ADJUSTMENT:'Корректировка',
                        }[t])}
                    </button>
                ))}
            </div>

            {/* Лента движения */}
            <div className="divide-y border rounded-lg">
                {filteredMoves.length === 0 && !mvLoading && (
                    <div className="p-4 text-sm text-gray-500">Записей пока нет</div>
                )}
                {filteredMoves.map(m => (
                    <div key={m.id || `${m.createdAt}-${m.transactionType}-${m.orderId || ''}`} className="p-3 text-sm flex items-start gap-3">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeBadge((m.transactionType || '').toUpperCase())}`}>
              {m.transactionType}
            </span>
                        <div className="flex-1">
                            <div className="text-gray-900">
                                {m.note || ({
                                    INBOUND:    'Поставка товара',
                                    OUTBOUND:   'Ручное списание',
                                    RESERVE:    'Резерв под заказ',
                                    COMMIT:     'Заказ оплачен',
                                    RELEASE:    'Отмена резерва',
                                    ADJUSTMENT: 'Корректировка',
                                }[(m.transactionType || '').toUpperCase()] || 'Операция')}
                            </div>
                            <div className="text-gray-600">
                                Количество: <span className="font-medium">{m.quantity}</span>
                                {m.orderId && <span className="ml-2">Заказ: <span className="font-mono text-gray-700">{String(m.orderId).substring(0, 8)}…</span></span>}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                                {m.createdAt ? new Date(m.createdAt).toLocaleString() : ''}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {mvHasMore && (
                <div className="mt-3">
                    <button
                        onClick={() => loadMoves(selectedId, false)}
                        disabled={mvLoading}
                        className="px-3 py-1.5 rounded border text-sm"
                    >
                        {mvLoading ? 'Загрузка…' : 'Показать ещё'}
                    </button>
                </div>
            )}
        </div>
    );
}