import React from 'react';
import StarRating from '../Shared/StarRating';
import { formatPrice } from '../../utils/format';

const ProductCard = ({ product, canManage, onEdit, showBuy = true }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden group">
            <div className="relative aspect-square overflow-hidden bg-gray-200">
                <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                </div>
                {product.stock <= 5 && product.stock > 0 && (
                    <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                        Осталось {product.stock}
                    </div>
                )}
                {product.stock === 0 && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <span className="text-white font-medium">Нет в наличии</span>
                    </div>
                )}
            </div>

            <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2">{product.title}</h3>
                </div>

                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>

                <div className="flex items-center mb-3">
                    <StarRating rating={product.rating || 0} />
                    <span className="text-sm text-gray-500 ml-2">({product.rating || 0})</span>
                </div>

                <div className={`flex items-center ${showBuy ? 'justify-between' : 'justify-start'}`}>
                    <span className="text-xl font-bold text-gray-900">{formatPrice(product.price)}</span>
                    {showBuy && (
                        <button
                            disabled={product.stock === 0}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                product.stock > 0
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                        >
                            {product.stock > 0 ? 'Купить' : 'Недоступно'}
                        </button>
                    )}
                </div>

                {canManage && (
                    <button
                        onClick={() => onEdit(product)}
                        className="mt-2 px-4 py-2 rounded-lg text-sm font-medium bg-green-600 hover:bg-green-700 text-white"
                    >
                        Редактировать
                    </button>
                )}
            </div>
        </div>
    );
};

export default ProductCard;