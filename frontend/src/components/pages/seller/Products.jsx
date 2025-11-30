import React, { useEffect, useState } from 'react';
import ProductsGrid from '../../Productservice/ProductsGrid';
import ProductModal from '../../Productservice/ProductModal';
import { apiFetch } from '../../../services/api';
import { getStockInfo, addStock } from '../../../services/warehouse';
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
            // подтянем остатки
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

    // Колбэки для карточек
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

    // Склад — модалка
    const [stockModalOpen, setStockModalOpen] = useState(false);
    const [stockProduct, setStockProduct] = useState(null);
    const [stockQty, setStockQty] = useState(0);
    const [stockSubmitting, setStockSubmitting] = useState(false);

    const openStock = (p) => {
        setStockProduct(p);
        setStockQty(0);
        setStockModalOpen(true);
    };

    const submitStock = async () => {
        if (!stockProduct || stockQty <= 0) return;
        setStockSubmitting(true);
        try {
            const pid = stockProduct.productUUID || stockProduct.id;
            await addStock(pid, Number(stockQty));
            // обновим конкретную позицию склада
            try {
                const info = await getStockInfo(pid);
                setStockById(prev => ({ ...prev, [pid]: info }));
            } catch {}
            setStockModalOpen(false);
            toast.success('Склад пополнен');
        } catch (e) {
            toast.error(e.message || 'Не удалось пополнить склад');
        } finally {
            setStockSubmitting(false);
        }
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
                    qty={stockQty}
                    onQtyChange={setStockQty}
                    loading={stockSubmitting}
                    onSubmit={submitStock}
                    onClose={() => setStockModalOpen(false)}
                />
            </div>
        </div>
    );
};

export default Products;

// В этом же файле (ниже) простой модал для пополнения склада
function StockModal({ open, product, qty, onQtyChange, loading, onSubmit, onClose }) {
    if (!open) return null;
    const title = product?.title || 'Товар';
    return (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="px-5 py-4 border-b flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Пополнить склад</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">&times;</button>
                </div>
                <div className="px-5 py-4 space-y-3">
                    <div className="text-sm text-gray-700">Товар: <span className="font-medium">{title}</span></div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Количество</label>
                        <input
                            type="number"
                            min="1"
                            step="1"
                            value={qty}
                            onChange={(e) => onQtyChange(Math.max(0, Number(e.target.value)))}
                            className="w-full border rounded px-3 py-2"
                            placeholder="Например, 10"
                        />
                    </div>
                </div>
                <div className="px-5 py-4 border-t flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 rounded border">Отмена</button>
                    <button
                        onClick={onSubmit}
                        disabled={loading || qty <= 0}
                        className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
                    >
                        {loading ? 'Сохранение…' : 'Добавить'}
                    </button>
                </div>
            </div>
        </div>
    );
}