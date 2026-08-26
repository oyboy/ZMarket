import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Filters from './Filters';
import ProductsGrid from './ProductsGrid';
import Pagination from './Pagination';
import ProductModal from './ProductModal';
import { getRolesFromToken } from '../../utils/jwt';
import { apiFetch } from '../../../src/services/api';

const Marketplace = ({ token, onRequireAuth }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);

    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('id');

    const [showProductModal, setShowProductModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [currentProduct, setCurrentProduct] = useState(null);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: 0,
        stock: 0,
    });

    const [filterFlags, setFilterFlags] = useState({
        maxPrice: null,
        minRating: null,
        onlyInStock: false,
        onlyDiscount: false,
    });

    const [userRoles, setUserRoles] = useState([]);

    const pageSize = 20;
    const PRODUCTS_URL =
        process.env.REACT_APP_PRODUCTS_URL ||
        'http://localhost:8072/productservice/api/v1';

    const isAdmin = () =>
        userRoles.some((role) => role === 'ADMIN' || role === 'ROLE_ADMIN');

    const isSellerOrAdmin = () =>
        userRoles.some((role) =>
            ['SELLER', 'ROLE_SELLER', 'ADMIN', 'ROLE_ADMIN'].includes(role)
        );

    const [searchParams] = useSearchParams();
    const categoryIdParam = searchParams.get('categoryId');
    const categoryId = categoryIdParam ? Number(categoryIdParam) : null;

    const fetchProducts = async (catId) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.set('page', 0);
            params.set('size', 100);
            if (catId != null) {
                params.set('categoryId', catId);
            }

            const data = await apiFetch(`${PRODUCTS_URL}/products?${params.toString()}`);
            setProducts(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching products:', error);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setUserRoles(token ? getRolesFromToken(token) : []);
    }, [token]);

    useEffect(() => {
        fetchProducts(categoryId);
    }, [token, categoryId]);

    useEffect(() => {
        const filtered = products.filter(
            (p) =>
                (p.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (p.description || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
        setTotalPages(Math.ceil(filtered.length / pageSize) || 0);
        setCurrentPage(0);
    }, [searchTerm, sortBy, products]);

    const getDisplayedProducts = () => {
        let filtered = [...products];

        if (searchTerm.trim()) {
            const q = searchTerm.toLowerCase();
            filtered = filtered.filter(
                (p) =>
                    (p.title || '').toLowerCase().includes(q) ||
                    (p.description || '').toLowerCase().includes(q)
            );
        }

        if (filterFlags.maxPrice != null) {
            filtered = filtered.filter(
                (p) => Number(p.price || 0) <= filterFlags.maxPrice
            );
        }

        if (filterFlags.minRating != null) {
            filtered = filtered.filter((p) => {
                const r =
                    p.rating ??
                    p.ratingAverage ??
                    p.avgRating ??
                    p.averageRating ??
                    0;
                return Number(r) >= filterFlags.minRating;
            });
        }

        if (filterFlags.onlyInStock) {
            filtered = filtered.filter((p) => Number(p.stock || 0) > 0);
        }

        if (filterFlags.onlyDiscount) {
            filtered = filtered.filter(
                (p) => p.oldPrice && Number(p.oldPrice) > Number(p.price || 0)
            );
        }

        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'price':
                    return (a.price || 0) - (b.price || 0);
                case 'rating': {
                    const ra =
                        a.rating ?? a.ratingAverage ?? a.avgRating ?? a.averageRating ?? 0;
                    const rb =
                        b.rating ?? b.ratingAverage ?? b.avgRating ?? b.averageRating ?? 0;
                    return Number(rb) - Number(ra);
                }
                case 'title':
                    return (a.title || '').localeCompare(b.title || '');
                case 'id':
                default:
                    return (a.id || 0) - (b.id || 0);
            }
        });

        const startIndex = currentPage * pageSize;
        const endIndex = startIndex + pageSize;
        return filtered.slice(startIndex, endIndex);
    };

    const handleProductInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === 'price' || name === 'stock' ? Number(value) : value,
        }));
    };

    const handleSubmitProduct = async () => {
        if (!token) {
            onRequireAuth?.();
            return;
        }
        if (!isSellerOrAdmin()) {
            alert('Нужна роль SELLER или ADMIN для добавления/обновления');
            return;
        }
        setLoading(true);
        try {
            const url = isEdit
                ? `${PRODUCTS_URL}/products/${currentProduct.productUUID}`
                : `${PRODUCTS_URL}/products`;
            const method = isEdit ? 'PATCH' : 'POST';

            const data = await apiFetch(url, {
                method,
                body: JSON.stringify(formData),
            });
            if (data !== null) {
                await fetchProducts(categoryId);
                setShowProductModal(false);
            }
        } catch (error) {
            console.error('Product save error:', error);
        } finally {
            setLoading(false);
        }
    };

    const openProductModal = (product = null) => {
        if (!token) {
            onRequireAuth?.();
            return;
        }
        if (!isSellerOrAdmin()) {
            alert('Нужна роль SELLER или ADMIN для редактирования');
            return;
        }

        if (!isAdmin() && product) {
            alert(
                'Редактирование из каталога только для администратора. Перейдите в "Кабинет продавца".'
            );
            return;
        }

        if (product) {
            setIsEdit(true);
            setCurrentProduct(product);
            setFormData({
                title: product.title,
                description: product.description,
                price: product.price,
                stock: product.stock,
                categoryId: product.categoryId ?? '',
                attributes: product.attributes || {},
            });
        } else {
            setIsEdit(false);
            setCurrentProduct(null);
            setFormData({
                title: '',
                description: '',
                price: 0,
                stock: 0,
                categoryId: '',
                attributes: {},
            });
        }

        setShowProductModal(true);
    };

    const displayedProducts = getDisplayedProducts();

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <Filters
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    sortBy={sortBy}
                    setSortBy={setSortBy}
                    filterFlags={filterFlags}
                    setFilterFlags={setFilterFlags}
                />

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <ProductsGrid
                        products={displayedProducts}
                        canManage={isAdmin()}
                        onEdit={(p) => openProductModal(p)}
                        showBuy={true}
                        onRequireAuth={() => onRequireAuth?.()}
                    />
                )}

                {totalPages > 1 && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                )}

{/*                 {!loading && displayedProducts.length === 0 && ( */}
{/*                     <div className="text-center py-12"> */}
{/*                         <svg */}
{/*                             className="mx-auto h-12 w-12 text-gray-400" */}
{/*                             fill="none" */}
{/*                             stroke="currentColor" */}
{/*                             viewBox="0 0 24 24" */}
{/*                         > */}
{/*                             <path */}
{/*                                 strokeLinecap="round" */}
{/*                                 strokeLinejoin="round" */}
{/*                                 strokeWidth={2} */}
{/*                                 d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" */}
{/*                             /> */}
{/*                         </svg> */}
{/*                         <h3 className="mt-2 text-sm font-medium text-gray-900"> */}
{/*                             Товары не найдены */}
{/*                         </h3> */}
{/*                         <p className="mt-1 text-sm text-gray-500"> */}
{/*                             Попробуйте изменить параметры поиска. */}
{/*                         </p> */}
{/*                     </div> */}
{/*                 )} */}
            </div>

            <ProductModal
                open={showProductModal}
                isEdit={isEdit}
                loading={loading}
                formData={formData}
                onChange={handleProductInputChange}
                onSubmit={handleSubmitProduct}
                onClose={() => setShowProductModal(false)}
            />
        </div>
    );
};

export default Marketplace;
