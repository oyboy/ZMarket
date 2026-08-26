import React, { useState } from 'react';

const Filters = ({ searchTerm, setSearchTerm, sortBy, setSortBy }) => {
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [isSortFocused, setIsSortFocused] = useState(false);

    const sortOptions = [
        { value: 'id', label: 'По умолчанию', icon: '' },
        { value: 'price', label: 'По цене', icon: '' },
        { value: 'rating', label: 'По рейтингу', icon: '' },
        { value: 'title', label: 'По названию', icon: '' },
    ];

    return (
        <div className="mb-8">
            {/* Заголовок раздела фильтров */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    Фильтры и сортировка
                </h2>
                {searchTerm && (
                    <button
                        onClick={() => setSearchTerm('')}
                        className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                        Сбросить
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Контейнер фильтров */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-lg p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* Поле поиска */}
                    <div className="flex-1">
                        <div className="relative group">
                            <div className={`absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl transition-opacity duration-300 ${isSearchFocused ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}></div>

                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <div className={`p-2 rounded-lg transition-all duration-300 ${isSearchFocused ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                </div>

                                <input
                                    type="text"
                                    placeholder="Найти товары по названию или описанию..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onFocus={() => setIsSearchFocused(true)}
                                    onBlur={() => setIsSearchFocused(false)}
                                    className="block w-full pl-14 pr-4 py-3 bg-white/50 border-2 border-gray-200 rounded-xl leading-5 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300"
                                />

                                {/* Счетчик символов */}
                                {searchTerm.length > 0 && (
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                        <span className={`text-xs px-2 py-1 rounded-full ${searchTerm.length > 30 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                            {searchTerm.length}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Подсказка под полем */}
                            <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>Введите ключевые слова для поиска товаров</span>
                            </div>
                        </div>
                    </div>

                    {/* Сортировка */}
                    <div className="lg:w-64">
                        <div className="relative group">
                            <div className={`absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl transition-opacity duration-300 ${isSortFocused ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}></div>

                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <div className={`p-2 rounded-lg transition-all duration-300 ${isSortFocused ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
                                        </svg>
                                    </div>
                                </div>

                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    onFocus={() => setIsSortFocused(true)}
                                    onBlur={() => setIsSortFocused(false)}
                                    className="block w-full pl-14 pr-10 py-3 bg-white/50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 appearance-none transition-all duration-300"
                                >
                                    {sortOptions.map((option) => (
                                        <option key={option.value} value={option.value} className="flex items-center gap-2">
                                            {option.icon} {option.label}
                                        </option>
                                    ))}
                                </select>

                                {/* Кастомная стрелка */}
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>

                            {/* Подсказка под селектом */}
                            <div className="mt-2 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    Сортировка по выбранному параметру
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Быстрые фильтры (теги) */}
                <div className="mt-6 pt-6 border-t border-gray-100">
                    <div className="flex items-center gap-2 mb-3">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        <span className="text-sm font-medium text-gray-700">Быстрые фильтры:</span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {['Электроника', 'До 10 000 ₽', 'Высокий рейтинг', 'В наличии', 'Со скидкой'].map((filter) => (
                            <button
                                key={filter}
                                onClick={() => {
                                    if (filter === 'Электроника') {
                                        setSearchTerm('электроника');
                                    } else if (filter === 'До 10 000 ₽') {
                                        setSortBy('price');
                                    }
                                }}
                                className="px-3 py-1.5 text-sm bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 border border-gray-200 rounded-full transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
                            >
                                {filter}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Статистика поиска */}
                <div className="mt-6 pt-6 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-sm text-gray-600">
                                Активных фильтров: <span className="font-semibold">{searchTerm ? 1 : 0}</span>
                            </span>
                        </div>

                        <div className="text-sm text-gray-600">
                            Сортировка: <span className="font-semibold text-blue-600">
                                {sortOptions.find(opt => opt.value === sortBy)?.label}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Filters;