import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getRolesFromToken } from '../../utils/jwt';

export default function Header({
                                   token,
                                   onLogout,
                                   onOpenLogin,
                                   onOpenRegister,
                                   onOpenBecomeSeller,
                               }) {
    const roles = useMemo(() => (token ? getRolesFromToken(token) : []), [token]);
    const isSeller = roles.includes('SELLER') || roles.includes('ROLE_SELLER');
    const isAdmin  = roles.includes('ADMIN')  || roles.includes('ROLE_ADMIN');
    const isBuyer  = !!token && !isSeller && !isAdmin;

    return (
        <header className="bg-white border-b">
            <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link to="/" className="font-bold text-lg">Marketplace</Link>
                    <Link to="/" className="text-gray-700 hover:text-gray-900">Каталог</Link>
                    {isSeller && <Link to="/seller" className="text-gray-700 hover:text-gray-900">Кабинет продавца</Link>}
                    {isAdmin && <Link to="/admin" className="text-gray-700 hover:text-gray-900">Админка</Link>}
                    {isBuyer && <Link to="/cart" className="text-gray-700 hover:text-gray-900">Корзина</Link>}
                </div>

                <div className="flex items-center gap-3">
                    {!token ? (
                        <>
                            <button onClick={onOpenLogin} className="px-3 py-1.5 rounded border">Войти</button>
                            <button onClick={onOpenRegister} className="px-3 py-1.5 rounded bg-blue-600 text-white">Регистрация</button>
                        </>
                    ) : (
                        <>
                            {isBuyer && (
                                <button onClick={onOpenBecomeSeller} className="px-3 py-1.5 rounded border">
                                    Стать продавцом
                                </button>
                            )}
                            <button onClick={onLogout} className="px-3 py-1.5 rounded border">Выйти</button>
                        </>
                    )}

                </div>
            </div>
        </header>
    );
}