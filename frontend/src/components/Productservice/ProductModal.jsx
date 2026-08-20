import React from 'react';

const ProductModal = ({ open, isEdit, loading, formData, onChange, onSubmit, onClose }) => {
    if (!open) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit();
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="fixed inset-0 bg-gradient-to-br from-gray-900/80 via-blue-900/50 to-purple-900/60 backdrop-blur-sm" onClick={onClose}></div>

            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    {/* Gradient Header */}
                    <div className="relative bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500 p-6">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500"></div>
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-2xl font-bold text-white font-['Poppins']">
                                    {isEdit ? (
                                        <span className="flex items-center">
                                            <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                            Редактировать товар
                                        </span>
                                    ) : (
                                        <span className="flex items-center">
                                            <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                            </svg>
                                            Добавить новый товар
                                        </span>
                                    )}
                                </h3>
                                <p className="text-blue-100 text-sm mt-1 font-['Inter']">
                                    {isEdit ? 'Обновите информацию о товаре' : 'Заполните информацию о новом товаре'}
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-all duration-300"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Form Content */}
                    <div className="p-6 bg-gradient-to-b from-white to-gray-50">
                        <form onSubmit={handleSubmit}>
                            <div className="space-y-5">
                                {/* Title Input */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 font-['Inter']">
                                        <span className="flex items-center">
                                            <svg className="w-4 h-4 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                            Название товара *
                                        </span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            name="title"
                                            value={formData.title}
                                            onChange={onChange}
                                            required
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 font-['Inter']"
                                            placeholder="Введите название товара"
                                        />
                                        {formData.title && (
                                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                                <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Description Textarea */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 font-['Inter']">
                                        <span className="flex items-center">
                                            <svg className="w-4 h-4 text-purple-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                            </svg>
                                            Описание товара *
                                        </span>
                                    </label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={onChange}
                                        rows={4}
                                        required
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-300 font-['Inter'] resize-none"
                                        placeholder="Детальное описание товара, его особенности и преимущества"
                                    />
                                </div>

                                {/* Price and Stock Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {/* Price Input */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2 font-['Inter']">
                                            <span className="flex items-center">
                                                <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                Цена (₽) *
                                            </span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                name="price"
                                                value={formData.price}
                                                onChange={onChange}
                                                required
                                                min="0.01"
                                                step="0.01"
                                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-300 font-['Inter']"
                                                placeholder="0.00"
                                            />
                                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                                <div className="px-2 py-1 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                                                    <span className="text-xs font-medium text-blue-600">₽</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stock Input */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2 font-['Inter']">
                                            <span className="flex items-center">
                                                <svg className="w-4 h-4 text-orange-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                                </svg>
                                                Остаток на складе
                                            </span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                name="stock"
                                                value={formData.stock}
                                                onChange={onChange}
                                                min="0"
                                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all duration-300 font-['Inter']"
                                                placeholder="0"
                                            />
                                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                                <div className="px-2 py-1 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-100">
                                                    <span className="text-xs font-medium text-orange-600">шт.</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Optional Category Field */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 font-['Inter']">
                                        <span className="flex items-center">
                                            <svg className="w-4 h-4 text-pink-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                            </svg>
                                            Категория (опционально)
                                        </span>
                                    </label>
                                    <select
                                        name="category"
                                        value={formData.category || ''}
                                        onChange={onChange}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all duration-300 font-['Inter'] bg-white"
                                    >
                                        <option value="">Выберите категорию</option>
                                        <option value="Электроника">Электроника</option>
                                        <option value="Одежда">Одежда</option>
                                        <option value="Книги">Книги</option>
                                        <option value="Спорт">Спорт</option>
                                        <option value="Дом">Дом</option>
                                        <option value="Красота">Красота</option>
                                    </select>
                                </div>
                            </div>

                            {/* Form Actions */}
                            <div className="mt-8 pt-6 border-t border-gray-200">
                                <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="mt-3 sm:mt-0 w-full sm:w-auto px-6 py-3 rounded-xl font-medium transition-all duration-300 group overflow-hidden bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 active:scale-95 shadow-sm font-['Inter']"
                                    >
                                        <span className="relative z-10 flex items-center justify-center space-x-2 text-gray-700">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                            <span>Отмена</span>
                                        </span>
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={loading || !formData.title || !formData.description || formData.price <= 0}
                                        className="w-full sm:w-auto px-6 py-3 rounded-xl font-medium text-white transition-all duration-300 group overflow-hidden bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 active:scale-95 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-['Inter']"
                                    >
                                        <span className="relative z-10 flex items-center justify-center space-x-2">
                                            {loading ? (
                                                <>
                                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                    <span>Сохранение...</span>
                                                </>
                                            ) : isEdit ? (
                                                <>
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    <span>Обновить товар</span>
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                    </svg>
                                                    <span>Добавить товар</span>
                                                </>
                                            )}
                                        </span>
                                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 to-white/0 group-hover:from-white/10 group-hover:to-white/10 transition-all duration-300"></div>
                                    </button>
                                </div>
                            </div>

                            {/* Form Validation Status */}
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center space-x-2">
                                        <div className={`w-3 h-3 rounded-full ${formData.title ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
                                        <span className={`font-medium ${formData.title ? 'text-gray-900' : 'text-gray-500'}`}>
                                            Название товара
                                        </span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <div className={`w-3 h-3 rounded-full ${formData.description ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
                                        <span className={`font-medium ${formData.description ? 'text-gray-900' : 'text-gray-500'}`}>
                                            Описание
                                        </span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <div className={`w-3 h-3 rounded-full ${formData.price > 0 ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
                                        <span className={`font-medium ${formData.price > 0 ? 'text-gray-900' : 'text-gray-500'}`}>
                                            Цена
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductModal;