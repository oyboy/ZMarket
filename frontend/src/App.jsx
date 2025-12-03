
import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';

import Marketplace from './components/Productservice';
import ProductDetails from './components/Productservice/ProductDetails';

import SellerDashboard from './components/pages/seller/Dashboard';
import Products from './components/pages/seller/Products';

import AdminDashboard from './components/pages/admin/Dashboard';
import AdminPendingSellers from './components/pages/admin/PendingSellers';
import AdminRejectedSellers from './components/pages/admin/RejectedSellers';

import RequireRole from './components/Productservice/Auth/RequireRole';
import Header from './components/Productservice/Header';
import Footer from './components/Productservice/Footer';
import LoginModal from './components/Productservice/LoginModal';
import RegisterModal from './components/Productservice/Auth/RegisterModal';
import BecomeSellerModal from './components/Userservice/BecomeSellerModal';

import { getRolesFromToken } from './utils/jwt';

import {
    TOKEN_URL,
    CLIENT_ID,
    onLogin,
    logout,
    scheduleAutoRefresh,
} from './services/http';

export default function App() {
    const [token, setToken] = useState(localStorage.getItem('jwtToken') || null);

    // modals
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [loginData, setLoginData] = useState({ username: '', password: '' });
    const [loginLoading, setLoginLoading] = useState(false);

    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [showBecomeSeller, setShowBecomeSeller] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();

    // INIT: auto-refresh + redirect by role (только для корня)
    useEffect(() => {
        const t = localStorage.getItem('jwtToken');
        if (!t) return;

        scheduleAutoRefresh();

        if (location.pathname === '/' || location.pathname === '/index.html') {
            const roles = getRolesFromToken(t);

            if (roles.includes('ADMIN') || roles.includes('ROLE_ADMIN'))
                navigate('/admin', { replace: true });
            else if (roles.includes('SELLER') || roles.includes('ROLE_SELLER'))
                navigate('/seller', { replace: true });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // LOGIN
    const handleLogin = async () => {
        if (!loginData.username || !loginData.password) return;

        setLoginLoading(true);

        try {
            const response = await fetch(TOKEN_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    client_id: CLIENT_ID,
                    grant_type: 'password',
                    username: loginData.username,
                    password: loginData.password,
                    scope: 'openid profile email',
                }),
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.error_description || 'Неверный логин или пароль');
            }

            const data = await response.json();

            onLogin(data.access_token, data.refresh_token);
            setToken(data.access_token);
            setShowLoginModal(false);

            const roles = getRolesFromToken(data.access_token);

            if (roles.includes('ADMIN') || roles.includes('ROLE_ADMIN'))
                navigate('/admin', { replace: true });
            else if (roles.includes('SELLER') || roles.includes('ROLE_SELLER'))
                navigate('/seller', { replace: true });
            else navigate('/', { replace: true });
        } catch (e) {
            alert(e.message || 'Ошибка входа');
        } finally {
            setLoginLoading(false);
        }
    };

    // AUTO LOGIN AFTER REGISTER
    const handleLoginWith = async (username, password) => {
        setLoginLoading(true);
        try {
            const response = await fetch(TOKEN_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    client_id: CLIENT_ID,
                    grant_type: 'password',
                    username,
                    password,
                    scope: 'openid profile email',
                }),
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.error_description || 'Ошибка входа');
            }

            const data = await response.json();

            onLogin(data.access_token, data.refresh_token);
            setToken(data.access_token);

            setShowRegisterModal(false);
            setShowLoginModal(false);
        } catch (e) {
            alert(e.message || 'Ошибка входа');
        } finally {
            setLoginLoading(false);
        }
    };

    const onLogout = () => {
        logout();
        setToken(null);
        navigate('/', { replace: true });
    };

    const openLogin = () => setShowLoginModal(true);
    const openRegister = () => setShowRegisterModal(true);
    const openBecomeSeller = () => setShowBecomeSeller(true);

    return (
        <div className="min-h-screen flex flex-col">
          <Header
            token={token}
            onLogout={onLogout}
            onOpenLogin={openLogin}
            onOpenRegister={openRegister}
            onOpenBecomeSeller={openBecomeSeller}
          />

          {/* Основной контент - растягивается на всю доступную высоту */}
          <main className="flex-1 flex flex-col">
            <Routes>
              {/* PUBLIC */}
              <Route
                path="/"
                element={
                  <div className="flex-1">
                    <Marketplace token={token} onRequireAuth={openLogin} />
                  </div>
                }
              />
              <Route
                path="/product/:uuid"
                element={
                  <div className="flex-1">
                    <ProductDetails onRequireAuth={openLogin} />
                  </div>
                }
              />

              {/* SELLER */}
              <Route
                element={
                  <RequireRole anyOf={['SELLER', 'ROLE_SELLER', 'ADMIN', 'ROLE_ADMIN']} />
                }
              >
                <Route
                  path="/seller"
                  element={
                    <div className="flex-1">
                      <SellerDashboard />
                    </div>
                  }
                />
                <Route
                  path="/seller/products"
                  element={
                    <div className="flex-1">
                      <Products />
                    </div>
                  }
                />
              </Route>

              {/* ADMIN */}
              <Route element={<RequireRole anyOf={['ADMIN', 'ROLE_ADMIN']} />}>
                <Route
                  path="/admin"
                  element={
                    <div className="flex-1">
                      <AdminDashboard />
                    </div>
                  }
                />
                <Route
                  path="/admin/pending-sellers"
                  element={
                    <div className="flex-1">
                      <AdminPendingSellers />
                    </div>
                  }
                />
                <Route
                  path="/admin/rejected-sellers"
                  element={
                    <div className="flex-1">
                      <AdminRejectedSellers />
                    </div>
                  }
                />
              </Route>

              {/* FALLBACK */}
              <Route
                path="*"
                element={
                  <div className="flex-1">
                    <Marketplace token={token} onRequireAuth={openLogin} />
                  </div>
                }
              />
            </Routes>
          </main>


          <Footer />

          {/* Модальные окна */}
          {/* ... остальной код модальных окон ... */}
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

            {/* REGISTER */}
            <RegisterModal
                open={showRegisterModal}
                onClose={() => setShowRegisterModal(false)}
                onRegistered={({ email, password }) => handleLoginWith(email, password)}
            />

            {/* BECOME SELLER */}
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