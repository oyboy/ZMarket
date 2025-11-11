import React, { useEffect, useState } from 'react';
import Header from './Header';
import Filters from './Filters';
import ProductsGrid from './ProductsGrid';
import Pagination from './Pagination';
import ProductModal from './ProductModal';
import LoginModal from './LoginModal';
import { getRolesFromToken } from '../../utils/jwt';
import { apiFetch } from '../../services/api';

const Marketplace = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);

    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('id');

    const [showProductModal, setShowProductModal] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);

    const [isEdit, setIsEdit] = useState(false);
    const [currentProduct, setCurrentProduct] = useState(null);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: 0,
        stock: 0,
    });

    const [loginData, setLoginData] = useState({ username: '', password: '' });

    const [token, setToken] = useState(localStorage.getItem('jwtToken') || null);
    const [userRoles, setUserRoles] = useState([]);

    const pageSize = 20;
    const PRODUCTS_URL = process.env.REACT_APP_PRODUCTS_URL || 'http://localhost:8072/productservice/api/v1';
    const AUTH_URL = process.env.REACT_APP_AUTH_URL || 'http://localhost:8072/authservice/auth';

    const isAdmin = () =>
        userRoles.some((role) => role === 'ADMIN' || role === 'ROLE_ADMIN');

    const isSellerOrAdmin = () =>
        userRoles.some((role) => role === 'SELLER' || role === 'ADMIN' || role === 'ROLE_SELLER' || role === 'ROLE_ADMIN');

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const data = await apiFetch(`${PRODUCTS_URL}/products?page=0&size=100`);
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
        fetchProducts();
    }, [token]);

    useEffect(() => {
        const filtered = products.filter(
            (p) =>
                p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setTotalPages(Math.ceil(filtered.length / pageSize) || 0);
        setCurrentPage(0);
    }, [searchTerm, sortBy, products]);

    const getDisplayedProducts = () => {
        let filtered = [...products];

        if (searchTerm.trim()) {
            filtered = filtered.filter(
                (p) =>
                    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    p.description.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'price':
                    return a.price - b.price;
                case 'rating':
                    return (b.rating || 0) - (a.rating || 0);
                case 'title':
                    return a.title.localeCompare(b.title);
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

    const handleLoginInputChange = (e) => {
        const { name, value } = e.target;
        setLoginData((prev) => ({ ...prev, [name]: value }));
    };

    const handleLogin = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${AUTH_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(loginData),
            });
            if (!response.ok) {
                throw new Error('Неверные данные для входа');
            }
            const data = await response.json();
            const newToken = data.token || data.access_token;
            if (newToken) {
                localStorage.setItem('jwtToken', newToken);
                setToken(newToken);
                setShowLoginModal(false);
                alert('Успешный вход!');
            }
        } catch (error) {
            console.error('Login error:', error);
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('jwtToken');
        setToken(null);
        setProducts([]);
    };

    const handleSubmitProduct = async () => {
        if (!token || !isSellerOrAdmin()) {
            alert('Нужна роль SELLER или ADMIN для добавления/обновления');
            return;
        }
        setLoading(true);
        try {
            const url = isEdit
                ? `${PRODUCTS_URL}/products/${currentProduct.productUUID}`
                : `${PRODUCTS_URL}/products`;
            const method = isEdit ? 'PATCH' : 'POST';

            const data = await apiFetch(url, { method, body: JSON.stringify(formData) });
            if (data !== null) {
                await fetchProducts();
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
            alert('Нужно войти для редактирования');
            return;
        }
        if (!isSellerOrAdmin()) {
            alert('Нужна роль SELLER или ADMIN для редактирования');
            return;
        }

        if (!isAdmin() && product) {
            alert('Редактирование из каталога только для администратора. Перейдите в "Кабинет продавца".');
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
            });
        } else {
            setIsEdit(false);
            setCurrentProduct(null);
            setFormData({ title: '', description: '', price: 0, stock: 0 });
        }

        setShowProductModal(true);
    };

    const displayedProducts = getDisplayedProducts();

    return (
        <div className="min-h-screen bg-gray-50">
            <Header
                token={token}
                canManage={isAdmin()}
                onLogout={handleLogout}
                onOpenAdd={() => openProductModal()}
                onOpenLogin={() => setShowLoginModal(true)}
                showSellerLink={isSellerOrAdmin()}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <Filters
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    sortBy={sortBy}
                    setSortBy={setSortBy}
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
                        onRequireAuth={() => setShowLoginModal(true)}
                    />
                )}

                {totalPages > 1 && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                )}

                {!loading && displayedProducts.length === 0 && (
                    <div className="text-center py-12">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">Товары не найдены</h3>
                        <p className="mt-1 text-sm text-gray-500">Попробуйте изменить параметры поиска.</p>
                    </div>
                )}
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

            <LoginModal
                open={showLoginModal}
                loading={loading}
                loginData={loginData}
                onChange={handleLoginInputChange}
                onLogin={handleLogin}
                onClose={() => setShowLoginModal(false)}
            />
        </div>
    );
};

export default Marketplace;