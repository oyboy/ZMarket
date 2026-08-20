import React, { useEffect, useState } from 'react';
import ProductsGrid from '../../Productservice/ProductsGrid';
import ProductModal from '../../Productservice/ProductModal';
import { apiFetch } from '../../../services/api';
import { getStockInfo, addStock, removeStock, setStock } from '../../../services/warehouse';
import { useToast } from '../../Shared/ToastProvider';

const PRODUCTS_API =
    process.env.REACT_APP_PRODUCTS_URL ||
    'http://localhost:8072/productservice/api/v1';

const Products = () => {
    const toast = useToast();
    const [products, setProducts] = useState([]);
    const [loading, setLoading]   = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [currentProduct, setCurrentProduct] = useState(null);
    const [formData, setFormData] = useState({ title:'', description:'', price:0, stock:0 });
    const [imageFile, setImageFile] = useState(null);

    // склад
    const [stockById, setStockById] = useState({});
    const [stockLoading, setStockLoading] = useState(false);

    const token = localStorage.getItem('jwtToken');
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

    const loadMine = async () => {
        setLoading(true);
        try {
            const data = await apiFetch(`${PRODUCTS_API}/products/mine`);
            const list = Array.isArray(data) ? data : [];
            setProducts(list);
            await loadStocks(list);
        } catch (e) {
            console.error(e);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    const loadStocks = async (list) => {
        setStockLoading(true);
        try {
            const entries = await Promise.all(
                (list || []).map(async (p) => {
                    const pid = p.productUUID || p.id;
                    if (!pid) return [null, null];
                    try {
                        const info = await getStockInfo(pid);
                        return [pid, info];
                    } catch {
                        return [pid, null];
                    }
                })
            );
            const m = {};
            entries.forEach(([pid, info]) => { if (pid && info) m[pid] = info; });
            setStockById(m);
        } finally {
            setStockLoading(false);
        }
    };

    useEffect(() => { loadMine(); }, []);

    const openAdd = () => {
        setIsEdit(false);
        setCurrentProduct(null);
        setFormData({ title:'', description:'', price:0, stock:0 });
        setImageFile(null);
        setShowModal(true);
    };

    const openEdit = (p) => {
        setIsEdit(true);
        setCurrentProduct(p);
        setFormData({ title: p.title, description: p.description, price: p.price, stock: p.stock });
        setImageFile(null);
        setShowModal(true);
    };

    const onChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'price' || name === 'stock' ? Number(value) : value }));
    };

    const uploadImage = async (productUUID, file) => {
        const form = new FormData();
        form.append('file', file);
        const res = await fetch(`${PRODUCTS_API}/products/${productUUID}/attachments`, {
            method: 'POST',
            headers: authHeaders,
            body: form,
        });
        const contentType = res.headers.get('content-type') || '';
        if (!res.ok) throw new Error(await res.text().catch(() => 'Upload failed'));

        let fileId = null;
        if (contentType.includes('application/json')) {
            try {
                const payload = await res.json();
                fileId = payload?.gridFsId || payload?.id || null;
            } catch {}
        }
        if (!fileId) {
            try {
                const listRes = await fetch(`${PRODUCTS_API}/products/${productUUID}/attachments`, { headers: authHeaders });
                if (listRes.ok) {
                    const list = await listRes.json();
                    const found = Array.isArray(list) ? list.find(a => a?.fileName === file.name) : null;
                    fileId = found?.gridFsId || found?.id || null;
                    if (!fileId && Array.isArray(list) && list.length) {
                        fileId = list[0]?.gridFsId || list[0]?.id || null;
                    }
                }
            } catch {}
        }
        return fileId;
    };

    const setMainAttachment = async (productUUID, attachmentId) => {
        const res = await fetch(`${PRODUCTS_API}/products/${productUUID}/attachments/${attachmentId}/main`, {
            method: 'POST',
            headers: authHeaders,
        });
        if (!res.ok) throw new Error(await res.text().catch(() => 'Set main failed'));
    };

    const deleteAttachment = async (productUUID, attachmentId) => {
        const res = await fetch(`${PRODUCTS_API}/products/${productUUID}/attachments/${attachmentId}`, {
            method: 'DELETE',
            headers: authHeaders,
        });
        if (!res.ok) throw new Error(await res.text().catch(() => 'Delete failed'));
    };

    const save = async () => {
        try {
            const url = isEdit
                ? `${PRODUCTS_API}/products/${currentProduct.productUUID}`
                : `${PRODUCTS_API}/products`;
            const method = isEdit ? 'PATCH' : 'POST';

            const saved = await apiFetch(url, { method, body: JSON.stringify(formData) });
            const productUUID = isEdit ? currentProduct.productUUID : saved?.productUUID;

            if (imageFile && productUUID) {
                const newId = await uploadImage(productUUID, imageFile);
                if (newId) await setMainAttachment(productUUID, newId);
            }

            setShowModal(false);
            setImageFile(null);
            await loadMine();
            toast.success(isEdit ? 'Товар обновлён' : 'Товар создан');
        } catch (e) {
            toast.error('Ошибка сохранения');
            console.error(e);
        }
    };

    // карточка: загрузка/установка/удаление фото
    const handleUploadFromCard = async (product, file) => {
        try {
            const id = await uploadImage(product.productUUID || product.id, file);
            if (id) await setMainAttachment(product.productUUID || product.id, id);
            await loadMine();
            toast.success('Фото загружено');
        } catch (e) {
            console.error('Upload error:', e);
            toast.error('Не удалось загрузить изображение');
        }
    };

    const handleSetMainFromCard = async (product, attachmentId) => {
        try {
            await setMainAttachment(product.productUUID || product.id, attachmentId);
            await loadMine();
        } catch (e) {
            toast.error('Не удалось установить превью');
        }
    };

    const handleDeleteFromCard = async (product, attachmentId) => {
        try {
            await deleteAttachment(product.productUUID || product.id, attachmentId);
            await loadMine();
        } catch (e) {
            toast.error('Не удалось удалить изображение');
        }
    };

    const [stockModalOpen, setStockModalOpen] = useState(false);
    const [stockProduct, setStockProduct] = useState(null);
    const [stockMode, setStockMode] = useState('add');
    const [stockDelta, setStockDelta] = useState(0);
    const [stockTarget, setStockTarget] = useState('');
    const [stockSubmitting, setStockSubmitting] = useState(false);

    const openStock = (p) => {
        setStockProduct(p);
        setStockMode('add');
        setStockDelta(0);
        setStockTarget('');
        setStockModalOpen(true);
    };

    const refreshStock = async (pid) => {
        try {
            const info = await getStockInfo(pid);
            setStockById(prev => ({ ...prev, [pid]: info || null }));
        } catch {}
    };

    const submitDelta = async () => {
        if (!stockProduct || stockDelta <= 0) return;
        setStockSubmitting(true);
        try {
            const pid = stockProduct.productUUID || stockProduct.id;
            if (stockMode === 'add') {
                await addStock(pid, Number(stockDelta));
                toast.success('Склад пополнен');
            } else {
                await removeStock(pid, Number(stockDelta));
                toast.success('Остаток уменьшен');
            }
            await refreshStock(pid);
            setStockModalOpen(false);
        } catch (e) {
            toast.error(e.message || 'Не удалось изменить количество');
        } finally {
            setStockSubmitting(false);
        }
    };

    const submitSetExact = async () => {
        const target = Number(stockTarget);
        if (!stockProduct || !Number.isFinite(target) || target < 0) return;
        setStockSubmitting(true);
        try {
            const pid = stockProduct.productUUID || stockProduct.id;
            await setStock(pid, target);
            toast.success('Остаток установлен');
            await refreshStock(pid);
            setStockModalOpen(false);
        } catch (e) {
            toast.error(e.message || 'Не удалось установить остаток');
        } finally {
            setStockSubmitting(false);
        }
    };

    const currentStockInfo = (p) => {
        const pid = p?.productUUID || p?.id;
        return pid ? stockById[pid] : null;
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold">Мои товары</h2>
                    <button onClick={openAdd} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
                        Добавить товар
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <ProductsGrid
                        products={products}
                        canManage={true}
                        onEdit={openEdit}
                        showBuy={false}
                        showUpload={true}
                        onUpload={handleUploadFromCard}
                        onSetMainAttachment={handleSetMainFromCard}
                        onDeleteAttachment={handleDeleteFromCard}
                        stockById={stockById}
                        onOpenStock={openStock}
                    />
                )}

                <ProductModal
                    open={showModal}
                    isEdit={isEdit}
                    loading={false}
                    formData={formData}
                    onChange={onChange}
                    onSubmit={save}
                    onClose={() => setShowModal(false)}
                    imageFile={imageFile}
                    onImageChange={setImageFile}
                />

                <StockModal
                    open={stockModalOpen}
                    product={stockProduct}
                    info={currentStockInfo(stockProduct)}
                    mode={stockMode}
                    onModeChange={setStockMode}
                    delta={stockDelta}
                    onDeltaChange={setStockDelta}
                    target={stockTarget}
                    onTargetChange={setStockTarget}
                    loading={stockSubmitting}
                    onApplyDelta={submitDelta}
                    onSetExact={submitSetExact}
                    onClose={() => setStockModalOpen(false)}
                />
            </div>
        </div>
    );
};

export default Products;

function StockModal({
                        open, product, info,
                        mode, onModeChange,
                        delta, onDeltaChange,
                        target, onTargetChange,
                        loading, onApplyDelta, onSetExact, onClose
                    }) {
    if (!open) return null;
    const title = product?.title || 'Товар';
    const onHand = Number(info?.quantityOnHand ?? 0);
    const available = Number(info?.available ?? 0);
    const reserved = Number(info?.quantityReserved ?? 0);

    return (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
                <div className="px-5 py-4 border-b flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Изменить количество</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">&times;</button>
                </div>

                <div className="px-5 py-4 space-y-5">
                    <div className="text-sm text-gray-700 flex flex-wrap gap-4">
                        <div>Доступно: <span className="font-medium">{available}</span></div>
                        <div>На полке: <span className="font-medium">{onHand}</span></div>
                        <div>Резерв: <span className="font-medium">{reserved}</span></div>
                    </div>

                    {/* Блок 1: Пополнить/Уменьшить */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Toggle active={mode==='add'} onClick={() => onModeChange('add')}>Пополнить</Toggle>
                            <Toggle active={mode==='remove'} onClick={() => onModeChange('remove')}>Уменьшить</Toggle>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-end">
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Количество</label>
                                <input
                                    type="number"
                                    min="1"
                                    step="1"
                                    value={delta}
                                    onChange={(e) => onDeltaChange(Math.max(0, Number(e.target.value)))}
                                    className="w-full border rounded px-3 py-2"
                                    placeholder="Например, 10"
                                />
                            </div>
                            <button
                                onClick={onApplyDelta}
                                disabled={loading || delta <= 0}
                                className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
                            >
                                Применить
                            </button>
                        </div>
                    </div>

                    <hr className="border-gray-200" />

                    {/* Блок 2: Установить остаток */}
                    <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-end">
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Установить остаток (шт)</label>
                            <input
                                type="number"
                                min="0"
                                step="1"
                                value={target}
                                onChange={(e) => onTargetChange(e.target.value)}
                                className="w-full border rounded px-3 py-2"
                                placeholder={`Текущий: ${onHand}`}
                            />
                        </div>
                        <button
                            onClick={onSetExact}
                            disabled={loading || target === '' || Number(target) < 0 || Number(target) === onHand}
                            className="px-4 py-2 rounded bg-gray-800 hover:bg-gray-900 text-white disabled:opacity-50"
                        >
                            Установить
                        </button>
                    </div>
                </div>

                <div className="px-5 py-4 border-t flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 rounded border">Отмена</button>
                </div>
            </div>
        </div>
    );
}

function Toggle({ active, onClick, children }) {
    return (
        <button
            onClick={onClick}
            className={`px-3 py-1.5 rounded border text-sm ${
                active ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-800 hover:bg-gray-50'
            }`}
        >
            {children}
        </button>
    );
}