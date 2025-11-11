import React, { useEffect, useState } from 'react';
import ProductsGrid from '../ProductsGrid';
import ProductModal from '../ProductModal';
import { apiFetch } from '../../../services/api';

const PRODUCTS_API =
    process.env.REACT_APP_PRODUCTS_URL ||
    'http://localhost:8072/productservice/api/v1';

const SellerProducts = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading]   = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [currentProduct, setCurrentProduct] = useState(null);
    const [formData, setFormData] = useState({ title:'', description:'', price:0, stock:0 });
    const [imageFile, setImageFile] = useState(null);

    const token = localStorage.getItem('jwtToken');
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

    const loadMine = async () => {
        setLoading(true);
        try {
            const data = await apiFetch(`${PRODUCTS_API}/products/mine`);
            setProducts(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error(e);
            setProducts([]);
        } finally {
            setLoading(false);
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
            headers: authHeaders, // без Content-Type
            body: form,
        });
        const contentType = res.headers.get('content-type') || '';
        if (!res.ok) throw new Error(await res.text().catch(() => 'Upload failed'));

        // Пытаемся получить fileId
        let fileId = null;
        if (contentType.includes('application/json')) {
            try {
                const payload = await res.json();
                fileId = payload?.gridFsId || payload?.id || null;
            } catch { /* ignore */ }
        }
        if (!fileId) {
            // Если upload вернул строку — достанем список и найдём по имени
            try {
                const listRes = await fetch(`${PRODUCTS_API}/products/${productUUID}/attachments`, { headers: authHeaders });
                if (listRes.ok) {
                    const list = await listRes.json();
                    // Ищем по имени файла, если бэк его сохраняет
                    const found = Array.isArray(list)
                        ? list.find(a => a?.fileName === file.name)
                        : null;
                    fileId = found?.gridFsId || found?.id || null;
                    // На крайняк — возьмём первый
                    if (!fileId && Array.isArray(list) && list.length) {
                        fileId = list[0]?.gridFsId || list[0]?.id || null;
                    }
                }
            } catch { /* ignore */ }
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

            // Если выбрали файл — загружаем и ставим его как превью
            if (imageFile && productUUID) {
                const newId = await uploadImage(productUUID, imageFile);
                if (newId) {
                    await setMainAttachment(productUUID, newId);
                }
            }

            setShowModal(false);
            setImageFile(null);
            await loadMine();
        } catch (e) {
            alert('Ошибка сохранения');
            console.error(e);
        }
    };

    // Коллбеки для карточек
    const handleUploadFromCard = async (product, file) => {
        try {
            const id = await uploadImage(product.productUUID || product.id, file);
            if (id) await setMainAttachment(product.productUUID || product.id, id);
            await loadMine();
        } catch (e) {
            console.error('Upload error:', e);
            alert('Не удалось загрузить изображение');
        }
    };

    const handleSetMainFromCard = async (product, attachmentId) => {
        try {
            await setMainAttachment(product.productUUID || product.id, attachmentId);
            await loadMine();
        } catch (e) {
            alert('Не удалось установить превью');
        }
    };

    const handleDeleteFromCard = async (product, attachmentId) => {
        try {
            await deleteAttachment(product.productUUID || product.id, attachmentId);
            await loadMine();
        } catch (e) {
            alert('Не удалось удалить изображение');
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
            </div>
        </div>
    );
};

export default SellerProducts;