import React, { useState, useEffect } from 'react';
import ProductCard from './ProductCard';

const ProductsGrid = ({
    products,
    canManage,
    onEdit,
    showBuy = true,
    showUpload = false,
    onUpload,
    onRequireAuth,
    onSetMainAttachment,
    onDeleteAttachment,
    stockById,
    onOpenStock,
}) => {
    const [loading, setLoading] = useState(true);
    const [isEmpty, setIsEmpty] = useState(false);

    useEffect(() => {

        if (products.length > 0) {
            const timer = setTimeout(() => setLoading(false), 300);
            return () => clearTimeout(timer);
        } else {
            setLoading(false);
            setIsEmpty(true);
        }
    }, [products]);

    if (loading) {
        return (
            <div className="relative">
                {/* Gradient decoration like header */}
                <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full mb-8 animate-pulse"></div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[...Array(8)].map((_, index) => (
                        <div key={index} className="bg-white rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden animate-pulse">
                            <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200"></div>
                            <div className="p-5 space-y-4">
                                <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full"></div>
                                <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full"></div>
                                <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full w-2/3"></div>
                                <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full w-1/2"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (isEmpty) {
        return (
            <div className="relative">
                {/* Gradient decoration like header */}
                <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full mb-8"></div>

                <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                    <div className="relative mb-6">
                        <div className="w-24 h-24 bg-gradient-to-br from-blue-50 to-purple-50 rounded-full flex items-center justify-center mb-4 mx-auto">
                            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                        </div>
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
                    </div>

                    <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3 font-['Poppins']">
                        Товары не найдены
                    </h3>
                    <p className="text-gray-600 max-w-md mb-6 font-['Inter']">
                        Пока что в этой категории нет товаров. Загляните позже или посмотрите другие категории.
                    </p>

                    <button className="relative px-6 py-3 rounded-xl font-medium text-white transition-all duration-300 group overflow-hidden bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 active:scale-95 shadow-lg hover:shadow-xl">
                        <span className="relative z-10 flex items-center space-x-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                            </svg>
                            <span>Смотреть все категории</span>
                        </span>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="relative">
            {/* Gradient header decoration */}
            <div className="sticky top-16 z-40 mb-8">
                <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full shadow-lg"></div>
                <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center space-x-4">
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-['Poppins']">
                            Каталог товаров
                        </h2>
                        <span className="px-3 py-1 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-600 text-sm font-medium rounded-full border border-blue-100">
                            {products.length} товаров
                        </span>
                    </div>

                    {/* Filter/sort controls */}
                    <div className="flex items-center space-x-3">
                        <button className="relative px-4 py-2 rounded-lg font-medium transition-all duration-300 group overflow-hidden bg-gradient-to-r from-gray-50 to-blue-50 hover:from-gray-100 hover:to-blue-100 border border-gray-200">
                            <span className="relative z-10 flex items-center space-x-2 text-gray-700 font-['Inter']">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                </svg>
                                <span>Фильтры</span>
                            </span>
                        </button>

                        <button className="relative px-4 py-2 rounded-lg font-medium transition-all duration-300 group overflow-hidden bg-gradient-to-r from-gray-50 to-purple-50 hover:from-gray-100 hover:to-purple-100 border border-gray-200">
                            <span className="relative z-10 flex items-center space-x-2 text-gray-700 font-['Inter']">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
                                </svg>
                                <span>Сортировка</span>
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Main grid with animated cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fadeIn">
                {products.map((product, index) => {
                    const pid = product.productUUID || product.id;
                    const stockInfo = stockById?.[pid];

                    return (
                        <div
                            key={pid}
                            className="transform transition-all duration-500 hover:-translate-y-2 animate-slideUp"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <ProductCard
                                product={product}
                                canManage={canManage}
                                onEdit={onEdit}
                                showBuy={showBuy}
                                showUpload={showUpload}
                                onUpload={onUpload}
                                onRequireAuth={onRequireAuth}
                                onSetMainAttachment={onSetMainAttachment}
                                onDeleteAttachment={onDeleteAttachment}
                                stockInfo={stockInfo}
                                onOpenStock={onOpenStock}
                            />
                        </div>
                    );
                })}
            </div>

            {/* Pagination or load more button */}
            {products.length >= 8 && (
                <div className="mt-12 pt-8 border-t border-gray-200">
                    <div className="flex flex-col items-center">
                        <p className="text-gray-600 text-sm mb-4 font-['Inter']">
                            Показано {products.length} из 100+ товаров
                        </p>
                        <button className="relative px-8 py-3 rounded-xl font-medium text-white transition-all duration-300 group overflow-hidden bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 active:scale-95 shadow-lg hover:shadow-xl">
                            <span className="relative z-10 flex items-center space-x-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                <span>Показать еще</span>
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                        </button>
                    </div>
                </div>
            )}

            {/* CSS Animations */}
            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.6s ease-out;
                }
                .animate-slideUp {
                    opacity: 0;
                    animation: slideUp 0.5s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default ProductsGrid;