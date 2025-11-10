import React, { useEffect, useState } from 'react';
import ProductsGrid from '../ProductsGrid';
import ProductModal from '../ProductModal';
import { apiFetch } from '../../../services/api';

const PRODUCTS_URL = process.env.REACT_APP_PRODUCTS_URL || 'http://localhost:8072/productservice/api/v1';

const SellerProducts = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading]   = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [currentProduct, setCurrentProduct] = useState(null);
    const [formData, setFormData] = useState({ title:'', description:'', price:0, stock:0 });

    const loadMine = async () => {
        setLoading(true);
        try {
            const data = await apiFetch(`${PRODUCTS_URL}/products/mine`);
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
        setShowModal(true);
    };

    const openEdit = (p) => {
        setIsEdit(true);
        setCurrentProduct(p);
        setFormData({
            title: p.title,
            description: p.description,
            price: p.price,
            stock: p.stock,
        });
        setShowModal(true);
    };

    const onChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'price' || name === 'stock' ? Number(value) : value }));
    };

    const save = async () => {
        try {
            const url = isEdit ? `${PRODUCTS_URL}/products/${currentProduct.productUUID}` : `${PRODUCTS_URL}/products`;
            const method = isEdit ? 'PATCH' : 'POST';
            await apiFetch(url, { method, body: JSON.stringify(formData) });
            setShowModal(false);
            await loadMine();
        } catch (e) {
            alert('Ошибка сохранения');
            console.error(e);
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
                ) : products.length === 0 ? (
                    <div className="text-center py-12">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">Товары не найдены</h3>
                        <p className="mt-1 text-sm text-gray-500">У вас пока нет товаров.</p>
                    </div>
                ) : (
                    <ProductsGrid
                        products={products}
                        canManage={true}
                        onEdit={openEdit}
                        showBuy={false}
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
                />
            </div>
        </div>
    );
};

export default SellerProducts;