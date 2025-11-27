import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getRolesFromToken } from '../../utils/jwt';

const Header = ({ token, onLogout, onOpenLogin, onOpenRegister, onOpenBecomeSeller }) => {
    const roles = useMemo(() => getRolesFromToken(token), [token]);
    const isAdmin = roles.includes('ADMIN') || roles.includes('ROLE_ADMIN');
    const isSeller = roles.includes('SELLER') || roles.includes('ROLE_SELLER');
    const isUserOnly = !!token && !isSeller && !isAdmin;

    return (
        <div className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto p-4 flex items-center justify-between">
                <Link to="/" className="font-bold text-xl text-gray-900">Маркетплейс</Link>

                <div className="flex items-center gap-3">
                    {isSeller && <Link to="/seller" className="px-3 py-1.5 rounded border text-sm">Кабинет продавца</Link>}
                    {isAdmin && (
                        <>
                            <Link to="/admin" className="px-3 py-1.5 rounded border text-sm">Админ</Link>
                        </>
                    )}

                    {!token ? (
                        <>
                            <button onClick={onOpenRegister} className="px-4 py-2 rounded border">Регистрация</button>
                            <button onClick={onOpenLogin} className="px-4 py-2 rounded bg-green-600 text-white">Войти</button>
                        </>
                    ) : (
                        <>
                            {isUserOnly && (
                                <button onClick={onOpenBecomeSeller} className="px-4 py-2 rounded bg-purple-600 text-white">
                                    Стать продавцом
                                </button>
                            )}
                            <button onClick={onLogout} className="px-4 py-2 rounded bg-red-600 text-white">Выйти</button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Header;