// import React, { useEffect, useState } from 'react';
// import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
//
// import Marketplace from './components/Productservice';
// import ProductDetails from './components/Productservice/ProductDetails';
//
// import SellerDashboard from './components/pages/seller/Dashboard';
// import Products from './components/pages/seller/Products';
//
// import AdminDashboard from './components/pages/admin/Dashboard';
// import AdminPendingSellers from './components/pages/admin/PendingSellers';
// import AdminRejectedSellers from './components/pages/admin/RejectedSellers';
//
// import RequireRole from './components/Productservice/Auth/RequireRole';
// import Header from './components/Productservice/Header';
// import LoginModal from './components/Productservice/LoginModal';
// import RegisterModal from './components/Productservice/Auth/RegisterModal';
// import BecomeSellerModal from './components/Userservice/BecomeSellerModal';
//
// import CartPage from './components/pages/buyer/CartPage';
//
//
// import { getRolesFromToken } from './utils/jwt';
//
// import {
//     TOKEN_URL,
//     CLIENT_ID,
//     onLogin,
//     logout,
//     scheduleAutoRefresh,
// } from './services/http';
// import {ToastProvider} from "./components/Shared/ToastProvider";
//
// export default function App() {
//     const [token, setToken] = useState(localStorage.getItem('jwtToken') || null);
//
//     // modals
//     const [showLoginModal, setShowLoginModal] = useState(false);
//     const [loginData, setLoginData] = useState({ username: '', password: '' });
//     const [loginLoading, setLoginLoading] = useState(false);
//
//     const [showRegisterModal, setShowRegisterModal] = useState(false);
//     const [showBecomeSeller, setShowBecomeSeller] = useState(false);
//
//     const navigate = useNavigate();
//     const location = useLocation();
//
//     // INIT: auto-refresh + redirect by role (только для корня)
//     useEffect(() => {
//         const t = localStorage.getItem('jwtToken');
//         if (!t) return;
//
//         scheduleAutoRefresh();
//
//         if (location.pathname === '/' || location.pathname === '/index.html') {
//             const roles = getRolesFromToken(t);
//
//             if (roles.includes('ADMIN') || roles.includes('ROLE_ADMIN'))
//                 navigate('/admin', { replace: true });
//             else if (roles.includes('SELLER') || roles.includes('ROLE_SELLER'))
//                 navigate('/seller', { replace: true });
//         }
//         // eslint-disable-next-line react-hooks/exhaustive-deps
//     }, []);
//
//     // LOGIN
//     const handleLogin = async () => {
//         if (!loginData.username || !loginData.password) return;
//
//         setLoginLoading(true);
//
//         try {
//             const response = await fetch(TOKEN_URL, {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/x-www-form-urlencoded',
//                 },
//                 body: new URLSearchParams({
//                     client_id: CLIENT_ID,
//                     grant_type: 'password',
//                     username: loginData.username,
//                     password: loginData.password,
//                     scope: 'openid profile email',
//                 }),
//             });
//
//             if (!response.ok) {
//                 const err = await response.json().catch(() => ({}));
//                 throw new Error(err.error_description || 'Неверный логин или пароль');
//             }
//
//             const data = await response.json();
//
//             onLogin(data.access_token, data.refresh_token);
//             setToken(data.access_token);
//             setShowLoginModal(false);
//
//             const roles = getRolesFromToken(data.access_token);
//
//             if (roles.includes('ADMIN') || roles.includes('ROLE_ADMIN'))
//                 navigate('/admin', { replace: true });
//             else if (roles.includes('SELLER') || roles.includes('ROLE_SELLER'))
//                 navigate('/seller', { replace: true });
//             else navigate('/', { replace: true });
//         } catch (e) {
//             alert(e.message || 'Ошибка входа');
//         } finally {
//             setLoginLoading(false);
//         }
//     };
//
//     // AUTO LOGIN AFTER REGISTER
//     const handleLoginWith = async (username, password) => {
//         setLoginLoading(true);
//         try {
//             const response = await fetch(TOKEN_URL, {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
//                 body: new URLSearchParams({
//                     client_id: CLIENT_ID,
//                     grant_type: 'password',
//                     username,
//                     password,
//                     scope: 'openid profile email',
//                 }),
//             });
//
//             if (!response.ok) {
//                 const error = await response.json().catch(() => ({}));
//                 throw new Error(error.error_description || 'Ошибка входа');
//             }
//
//             const data = await response.json();
//
//             onLogin(data.access_token, data.refresh_token);
//             setToken(data.access_token);
//
//             setShowRegisterModal(false);
//             setShowLoginModal(false);
//         } catch (e) {
//             alert(e.message || 'Ошибка входа');
//         } finally {
//             setLoginLoading(false);
//         }
//     };
//
//     const onLogout = () => {
//         logout();
//         setToken(null);
//         navigate('/', { replace: true });
//     };
//
//     const openLogin = () => setShowLoginModal(true);
//     const openRegister = () => setShowRegisterModal(true);
//     const openBecomeSeller = () => setShowBecomeSeller(true);
//
//     return (
//         <ToastProvider>
//             <Header
//                 token={token}
//                 onLogout={onLogout}
//                 onOpenLogin={openLogin}
//                 onOpenRegister={openRegister}
//                 onOpenBecomeSeller={openBecomeSeller}
//             />
//
//             <Routes>
//                 {/* PUBLIC */}
//                 <Route
//                     path="/"
//                     element={<Marketplace token={token} onRequireAuth={openLogin} />}
//                 />
//                 <Route
//                     path="/product/:uuid"
//                     element={<ProductDetails onRequireAuth={openLogin} />}
//                 />
//
//                 {/* CART */}
//                 <Route path="/cart" element={<CartPage onRequireAuth={openLogin} />} />
//
//                 {/* SELLER */}
//                 <Route
//                     element={
//                         <RequireRole anyOf={['SELLER', 'ROLE_SELLER', 'ADMIN', 'ROLE_ADMIN']} />
//                     }
//                 >
//                     <Route path="/seller" element={<SellerDashboard />} />
//                     <Route path="/seller/products" element={<Products />} />
//                 </Route>
//
//                 {/* ADMIN */}
//                 <Route element={<RequireRole anyOf={['ADMIN', 'ROLE_ADMIN']} />}>
//                     <Route path="/admin" element={<AdminDashboard />} />
//                     <Route path="/admin/pending-sellers" element={<AdminPendingSellers />} />
//                     <Route path="/admin/rejected-sellers" element={<AdminRejectedSellers />} />
//                 </Route>
//
//                 {/* FALLBACK */}
//                 <Route
//                     path="*"
//                     element={<Marketplace token={token} onRequireAuth={openLogin} />}
//                 />
//             </Routes>
//
//             {/* LOGIN */}
//             <LoginModal
//                 open={showLoginModal}
//                 loading={loginLoading}
//                 loginData={loginData}
//                 onChange={(e) =>
//                     setLoginData((d) => ({
//                         ...d,
//                         [e.target.name]: e.target.value,
//                     }))
//                 }
//                 onLogin={handleLogin}
//                 onClose={() => setShowLoginModal(false)}
//             />
//
//             {/* REGISTER */}
//             <RegisterModal
//                 open={showRegisterModal}
//                 onClose={() => setShowRegisterModal(false)}
//                 onRegistered={({ email, password }) => handleLoginWith(email, password)}
//             />
//
//             {/* BECOME SELLER */}
//             <BecomeSellerModal
//                 open={showBecomeSeller}
//                 onClose={() => setShowBecomeSeller(false)}
//                 onSuccess={() => {
//                     setShowBecomeSeller(false);
//                     alert('Заявка отправлена. Ожидайте подтверждение администратора.');
//                 }}
//             />
//         </ToastProvider>
//     );
// }



import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';

// Компоненты Productservice
import Marketplace from './components/Productservice/index';
import ProductDetails from './components/Productservice/ProductDetails';
import Header from './components/Productservice/Header';
import Footer from './components/Productservice/Footer';
import LoginModal from './components/Productservice/LoginModal';
import Filters from './components/Productservice/Filters';
import Pagination from './components/Productservice/Pagination';
import ProductModal from './components/Productservice/ProductModal';

import SubtleWaveBackground from './components/Shared/SubtleWaveBackGround';

// Компоненты Auth
import RequireRole from './components/Productservice/Auth/RequireRole';
import RequireAuth from './components/Productservice/Auth/RequireAuth';
import RegisterModal from './components/Productservice/Auth/RegisterModal';


import { getRolesFromToken } from './utils/jwt';
import {
    TOKEN_URL,
    CLIENT_ID,
    onLogin,
    logout,
    scheduleAutoRefresh,
} from './services/http';
import { ToastProvider } from './components/Shared/ToastProvider';

const SimpleWaveBackground = () => (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 opacity-70" />
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-blue-100/30 to-transparent" />
    </div>
);

export default function App() {
    const [token, setToken] = useState(localStorage.getItem('jwtToken') || null);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [loginLoading, setLoginLoading] = useState(false);
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [showBecomeSeller, setShowBecomeSeller] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();

    // Автоматический вход при наличии токена (упрощенная версия)
    useEffect(() => {
        const storedToken = localStorage.getItem('jwtToken');
        if (storedToken) {
            setToken(storedToken);
        }
    }, []);

    const handleLogin = async () => {
        if (!loginData.username || !loginData.password) {
            alert('Введите имя пользователя и пароль');
            return;
        }

        setLoginLoading(true);

        try {
            // Временная имитация входа (замените на реальный вызов API)
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Создаем mock токен
            const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyMTIzIiwibmFtZSI6IlVzZXIgVGVzdCIsInJvbGVzIjpbIlVTRVIiXSwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

            localStorage.setItem('jwtToken', mockToken);
            setToken(mockToken);
            setShowLoginModal(false);
            setLoginData({ username: '', password: '' });

            // Перенаправление в зависимости от роли
            const roles = getRolesFromToken(mockToken);
            if (roles.includes('ADMIN') || roles.includes('ROLE_ADMIN')) {
                navigate('/admin', { replace: true });
            } else if (roles.includes('SELLER') || roles.includes('ROLE_SELLER')) {
                navigate('/seller', { replace: true });
            } else {
                navigate('/', { replace: true });
            }

        } catch (e) {
            alert('Ошибка входа: ' + (e.message || 'Проверьте данные'));
        } finally {
            setLoginLoading(false);
        }
    };

    const handleLoginWith = async (username, password) => {
        setLoginLoading(true);
        try {
            // Временная имитация входа после регистрации
            await new Promise(resolve => setTimeout(resolve, 1000));

            const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyMTIzIiwibmFtZSI6Ik5ldyBVc2VyIiwicm9sZXMiOlsiVVNFUiJdLCJpYXQiOjE1MTYyMzkwMjJ9.4Adcj3UFYzPUVaVF43FmMab6RlaQD3A2hXp7iZbYzPo';

            localStorage.setItem('jwtToken', mockToken);
            setToken(mockToken);
            setShowRegisterModal(false);
            setShowLoginModal(false);

            navigate('/', { replace: true });
        } catch (e) {
            alert('Ошибка входа: ' + (e.message || 'Проверьте данные'));
        } finally {
            setLoginLoading(false);
        }
    };

    const onLogout = () => {
        localStorage.removeItem('jwtToken');
        setToken(null);
        navigate('/', { replace: true });
    };

    const openLogin = () => setShowLoginModal(true);
    const openRegister = () => setShowRegisterModal(true);
    const openBecomeSeller = () => setShowBecomeSeller(true);

    // Простой BecomeSellerModal
    const BecomeSellerModal = ({ open, onClose, onSuccess }) => {
        if (!open) return null;

        return (
            <div className="fixed inset-0 z-50 overflow-y-auto">
                <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
                    <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full sm:p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Стать продавцом</h3>
                        <p className="text-gray-600 mb-4">
                            Отправьте заявку на получение статуса продавца. Наш менеджер свяжется с вами в течение 24 часов.
                        </p>
                        <div className="mt-5 sm:mt-6">
                            <button
                                onClick={onSuccess}
                                className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
                            >
                                Отправить заявку
                            </button>
                            <button
                                onClick={onClose}
                                className="mt-3 inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
                            >
                                Отмена
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-white">
            {/* Простой статичный фон */}
            <SimpleWaveBackground />

            {/* Хедер */}
            <Header
                token={token}
                onLogout={onLogout}
                onOpenLogin={openLogin}
                onOpenRegister={openRegister}
                onOpenBecomeSeller={openBecomeSeller}
            />

            <Routes>
                {/* PUBLIC */}
                <Route
                    path="/"
                    element={<Marketplace token={token} onRequireAuth={openLogin} />}
                />
                <Route
                    path="/product/:uuid"
                    element={<ProductDetails onRequireAuth={openLogin} />}
                />

                <main className="flex-1 relative z-10">
                    <Routes>
                        <Route
                            path="/"
                            element={<Marketplace token={token} onRequireAuth={openLogin} />}
                        />
                        <Route
                            path="/product/:uuid"
                            element={<ProductDetails onRequireAuth={openLogin} />}
                        />

                        <Route
                            path="/cart"
                            element={<CartPage onRequireAuth={openLogin} />}
                        />

                        <Route
                            path="/orders"
                            element={<OrdersPage onRequireAuth={openLogin} />}
                        />
                        <Route
                            path="/orders/:orderId"
                            element={<OrderDetails />}
                        />

                        <Route
                            element={
                                <RequireRole anyOf={['SELLER', 'ROLE_SELLER', 'ADMIN', 'ROLE_ADMIN']} />
                            }
                        >
                            <Route path="/seller" element={<SellerDashboard />} />
                            <Route path="/seller/products" element={<Products />} />
                            <Route path="/seller/warehouse" element={<WarehouseMovements />} />
                            <Route path="/seller/orders" element={<SellerOrders />} />
                            <Route path="/seller/stats" element={<SellerStats />} />
                        </Route>

                        <Route element={<RequireRole anyOf={['ADMIN', 'ROLE_ADMIN']} />}>
                            <Route path="/admin" element={<AdminDashboard />} />
                            <Route
                                path="/admin/pending-sellers"
                                element={<AdminPendingSellers />}
                            />
                            <Route
                                path="/admin/rejected-sellers"
                                element={<AdminRejectedSellers />}
                            />
                            <Route
                                path="/admin/categories"
                                element={<AdminCategories />}
                            />
                        </Route>

                        <Route
                            path="*"
                            element={<Marketplace token={token} onRequireAuth={openLogin} />}
                        />
                    </Routes>
                </main>

                <Footer />

                <LoginModal
                    open={showLoginModal}
                    loading={loginLoading}
                    onLogin={handleLogin}
                    onClose={() => setShowLoginModal(false)}
                    onOpenRegister={openRegister}
                />

                <RegisterModal
                    open={showRegisterModal}
                    onClose={() => setShowRegisterModal(false)}
                    onRegistered={({ email, password }) =>
                        handleLoginWith(email, password)
                    }
                />
            </Routes>

            {/* LOGIN */}
            <LoginModal
                open={showLoginModal}
                loading={loginLoading}
                loginData={loginData}
                onChange={(e) =>
                    setLoginData((d) => ({
                        ...d,
                        [e.target.name]: e.target.value,
                    }))
                }
                onLogin={handleLogin}
                onClose={() => setShowLoginModal(false)}
            />

            <RegisterModal
                open={showRegisterModal}
                onClose={() => setShowRegisterModal(false)}
                onRegistered={({ email, password }) => handleLoginWith(email, password)}
            />

            <BecomeSellerModal
                open={showBecomeSeller}
                onClose={() => setShowBecomeSeller(false)}
                onSuccess={() => {
                    setShowBecomeSeller(false);
                    alert('Заявка отправлена. Ожидайте подтверждение администратора.');
                }}
            />
        </div>
    );
}
