import React from 'react';
import { Link } from 'react-router-dom';

const Header = ({ token, canManage, onLogout, onOpenAdd, onOpenLogin, showSellerLink }) => {
    return (
        <div className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Маркетплейс</h1>
                        <p className="text-gray-600 mt-1">Найдите лучшие товары по лучшим ценам</p>
                    </div>
                    <div className="flex items-center space-x-3">
                        {showSellerLink && (
                            <Link
                                to="/seller/products"
                                className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg"
                            >
                                Кабинет продавца
                            </Link>
                        )}
                        {token ? (
                            <>
                                <button
                                    onClick={onLogout}
                                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
                                >
                                    Выйти
                                </button>
                                {canManage && (
                                    <button
                                        onClick={onOpenAdd}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        <span>Добавить товар</span>
                                    </button>
                                )}
                            </>
                        ) : (
                            <button
                                onClick={onOpenLogin}
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                            >
                                Войти
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Header;