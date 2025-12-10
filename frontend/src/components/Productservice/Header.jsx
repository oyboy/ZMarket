//
// import React, { useMemo } from 'react';
// import { Link } from 'react-router-dom';
// import { getRolesFromToken } from '../../utils/jwt';
//
// export default function Header({
//                                    token,
//                                    onLogout,
//                                    onOpenLogin,
//                                    onOpenRegister,
//                                    onOpenBecomeSeller,
//                                }) {
//     const roles = useMemo(() => (token ? getRolesFromToken(token) : []), [token]);
//     const isSeller = roles.includes('SELLER') || roles.includes('ROLE_SELLER');
//     const isAdmin  = roles.includes('ADMIN')  || roles.includes('ROLE_ADMIN');
//     const isBuyer  = !!token && !isSeller && !isAdmin;
//
//     return (
//         <header className="bg-white border-b">
//             <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
//                 <div className="flex items-center gap-4">
//                     <Link to="/" className="font-bold text-lg">Marketplace</Link>
//                     <Link to="/" className="text-gray-700 hover:text-gray-900">Каталог</Link>
//                     {isSeller && <Link to="/seller" className="text-gray-700 hover:text-gray-900">Кабинет продавца</Link>}
//                     {isAdmin && <Link to="/admin" className="text-gray-700 hover:text-gray-900">Админка</Link>}
//                     {isBuyer && <Link to="/cart" className="text-gray-700 hover:text-gray-900">Корзина</Link>}
//                 </div>
//
//                 <div className="flex items-center gap-3">
//                     {!token ? (
//                         <>
//                             <button onClick={onOpenLogin} className="px-3 py-1.5 rounded border">Войти</button>
//                             <button onClick={onOpenRegister} className="px-3 py-1.5 rounded bg-blue-600 text-white">Регистрация</button>
//                         </>
//                     ) : (
//                         <>
//                             {isBuyer && (
//                                 <button onClick={onOpenBecomeSeller} className="px-3 py-1.5 rounded border">
//                                     Стать продавцом
//                                 </button>
//                             )}
//                             <button onClick={onLogout} className="px-3 py-1.5 rounded border">Выйти</button>
//                         </>
//                     )}
//
//                 </div>
//             </div>
//         </header>
//     );
// }

import React, { useMemo, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getRolesFromToken } from '../../utils/jwt';

export default function Header({
    token,
    onLogout,
    onOpenLogin,
    onOpenRegister,
    onOpenBecomeSeller,
}) {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const location = useLocation();

    const roles = useMemo(() => (token ? getRolesFromToken(token) : []), [token]);
    const isSeller = roles.includes('SELLER') || roles.includes('ROLE_SELLER');
    const isAdmin = roles.includes('ADMIN') || roles.includes('ROLE_ADMIN');
    const isBuyer = !!token && !isSeller && !isAdmin;

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        setMobileMenuOpen(false);
    }, [location]);

    const navItems = [
        { to: "/", label: "Каталог", icon: "" },
        ...(isSeller ? [{ to: "/seller", label: "Кабинет продавца", icon: "" }] : []),
        ...(isAdmin ? [{ to: "/admin", label: "Админ панель", icon: "⚙" }] : []),
        ...(isBuyer ? [{ to: "/cart", label: "Корзина", icon: "" }] : []),
    ];

    return (
        <header className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-gradient-to-r from-blue-50 to-indigo-50'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Логотип и навигация - ИЗМЕНЕНО: буква Z вместо M */}
                    <div className="flex items-center">
                        <Link to="/" className="flex items-center space-x-3 group">
                            <div className="relative">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-300 shadow-lg">
                                    <span className="text-white font-bold text-lg font-['Poppins']">Z</span>
                                </div>
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-['Poppins']">
                                    ZMarket
                                </h1>
                                <p className="text-xs text-gray-500 font-['Inter']">Гойда</p>
                            </div>
                        </Link>


                        <nav className="hidden md:ml-10 md:flex md:space-x-1">
                            {navItems.map((item, index) => (
                                <Link
                                    key={item.to}
                                    to={item.to}
                                    className={`relative px-4 py-2 rounded-lg flex items-center space-x-2 transition-all duration-300 font-['Inter'] ${
                                        location.pathname === item.to
                                            ? 'text-white bg-gradient-to-r from-blue-500 to-purple-500 shadow-md'
                                            : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                                    }`}
                                >
                                    <span className="text-lg">{item.icon}</span>
                                    <span className="font-medium">{item.label}</span>
                                    {location.pathname === item.to && (
                                        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
                                    )}
                                </Link>
                            ))}
                        </nav>
                    </div>

                    {/* Кнопки пользователя - ИЗМЕНЕНО: иконка для кнопки "Войти" */}
                    <div className="flex items-center space-x-3">
                        {!token ? (
                            <>
                                <button
                                    onClick={onOpenLogin}
                                    className="relative px-5 py-2 rounded-lg font-medium transition-all duration-300 group overflow-hidden bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 shadow-sm hover:shadow-md active:scale-95 font-['Inter']"
                                >
                                    <span className="relative z-10 flex items-center space-x-2">
                                        {/* ИЗМЕНЕНО: Иконка пользователя вместо иконки входа */}
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        <span>Войти</span>
                                    </span>
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/10 group-hover:to-purple-500/10 transition-all duration-300"></div>
                                </button>

                                <button
                                    onClick={onOpenRegister}
                                    className="relative px-5 py-2 rounded-lg font-medium text-white transition-all duration-300 group overflow-hidden bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-purple-700 active:scale-95 font-['Inter']"
                                >
                                    <span className="relative z-10 flex items-center space-x-2">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                        </svg>
                                        <span>Регистрация</span>
                                    </span>
                                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 to-white/0 group-hover:from-white/10 group-hover:to-white/10 transition-all duration-300"></div>
                                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                                </button>
                            </>
                        ) : (
                            <>
                                {isBuyer && (
                                    <button
                                        onClick={onOpenBecomeSeller}
                                        className="relative px-5 py-2 rounded-lg font-medium transition-all duration-300 group overflow-hidden bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg hover:shadow-xl hover:from-green-600 hover:to-emerald-700 active:scale-95 font-['Inter']"
                                    >
                                        <span className="relative z-10 flex items-center space-x-2">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                            <span>Стать продавцом</span>
                                        </span>
                                    </button>
                                )}

                                <button
                                    onClick={onLogout}
                                    className="relative px-5 py-2 rounded-lg font-medium transition-all duration-300 group overflow-hidden bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg hover:shadow-xl hover:from-red-600 hover:to-pink-700 active:scale-95 font-['Inter']"
                                >
                                    <span className="relative z-10 flex items-center space-x-2">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                        <span>Выйти</span>
                                    </span>
                                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 to-white/0 group-hover:from-white/10 group-hover:to-white/10 transition-all duration-300"></div>
                                </button>
                            </>
                        )}

                        {/* Кнопка мобильного меню */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden ml-2 p-2 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                            {mobileMenuOpen ? (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            ) : (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>

                {/* Мобильное меню */}
                {mobileMenuOpen && (
                    <div className="md:hidden py-4 px-3 bg-white/95 backdrop-blur-md rounded-xl shadow-lg mt-2 animate-slideDown">
                        <div className="space-y-2">
                            {navItems.map((item) => (
                                <Link
                                    key={item.to}
                                    to={item.to}
                                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 font-['Inter'] ${
                                        location.pathname === item.to
                                            ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-600 border-l-4 border-blue-500'
                                            : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                                    }`}
                                >
                                    <span className="text-xl">{item.icon}</span>
                                    <span className="font-medium">{item.label}</span>
                                </Link>
                            ))}

                            {/* Информация о пользователе */}
                            {token && (
                                <div className="px-4 py-3 rounded-lg bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 mt-4">
                                    <p className="text-sm text-gray-600 font-['Inter']">
                                        Роль: {isAdmin ? 'Администратор' : isSeller ? 'Продавец' : 'Покупатель'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>


            <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
        </header>
    );
}