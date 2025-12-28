import React, { useState, useMemo } from 'react';

const Filters = ({ searchTerm, setSearchTerm, sortBy, setSortBy, filterFlags, setFilterFlags }) => {
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [isSortFocused, setIsSortFocused] = useState(false);
    const [activeTags, setActiveTags] = useState({});

    const sortOptions = [
        { value: 'id', label: 'По умолчанию' },
        { value: 'price', label: 'По цене' },
        { value: 'rating', label: 'По рейтингу' },
        { value: 'title', label: 'По названию' },
    ];

    const quickTags = [
        { id: 'electronics', label: 'Электроника' },
        { id: 'cheap', label: 'До 10 000 ₽' },
        { id: 'highRating', label: 'Высокий рейтинг' },
        { id: 'inStock', label: 'В наличии' },
        { id: 'discount', label: 'Со скидкой' },
    ];

    const handleResetAll = () => {
        setSearchTerm('');
        setSortBy('id');
        setFilterFlags({
            maxPrice: null,
            minRating: null,
            onlyInStock: false,
            onlyDiscount: false,
        });
        setActiveTags({});
    };

    const toggleTag = (id) => {
        setActiveTags(prev => {
            const isActive = !!prev[id];
            const next = { ...prev, [id]: !isActive };

            if (id === 'electronics') {
                if (!isActive) setSearchTerm('электроника');
                else if (searchTerm.toLowerCase() === 'электроника') setSearchTerm('');
            }
            if (id === 'cheap') {
                setFilterFlags(f => ({ ...f, maxPrice: isActive ? null : 10000 }));
            }
            if (id === 'highRating') {
                setFilterFlags(f => ({ ...f, minRating: isActive ? null : 4 }));
            }
            if (id === 'inStock') {
                setFilterFlags(f => ({ ...f, onlyInStock: !isActive }));
            }
            if (id === 'discount') {
                setFilterFlags(f => ({ ...f, onlyDiscount: !isActive }));
            }

            return next;
        });
    };

    const activeFiltersCount = useMemo(() => {
        let count = 0;
        if (searchTerm) count += 1;
        if (filterFlags.maxPrice != null) count += 1;
        if (filterFlags.minRating != null) count += 1;
        if (filterFlags.onlyInStock) count += 1;
        if (filterFlags.onlyDiscount) count += 1;
        return count;
    }, [searchTerm, filterFlags]);

    return (
        <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    Фильтры и сортировка
                </h2>
                {(searchTerm || activeFiltersCount > 0 || sortBy !== 'id') && (
                    <button
                        onClick={handleResetAll}
                        className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                        Сбросить всё
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-lg p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* Поиск */}
                    <div className="flex-1">
                        <div className="relative group">
                            <div className={`absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl transition-opacity duration-300 ${isSearchFocused ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`} />

                            <div className="relative">
                                {/* Иконка поиска */}
                                <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none z-10">
                                    <div className="pl-1">
                                        <div className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-300 ${
                                            isSearchFocused
                                                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                                                : 'bg-gray-100 text-gray-400'
                                        }`}>
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                        </div>
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

                                {searchTerm.length > 0 && (
                                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                                        <span className={`text-xs px-2 py-1 rounded-full ${searchTerm.length > 30 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                            {searchTerm.length}
                                        </span>
                                    </div>
                                )}
                            </div>

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
                            <div className={`absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl transition-opacity duration-300 ${isSortFocused ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`} />

                            <div className="relative">
                                {/* Иконка сортировки */}
                                <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none z-10">
                                    <div className="pl-1">
                                        <div className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-300 ${
                                            isSortFocused
                                                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                                                : 'bg-gray-100 text-gray-400'
                                        }`}>
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
                                            </svg>
                                        </div>
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
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>

                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>

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

                {/* Быстрые фильтры */}
                <div className="mt-6 pt-6 border-t border-gray-100">
                    <div className="flex items-center gap-2 mb-3">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        <span className="text-sm font-medium text-gray-700">Быстрые фильтры:</span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {quickTags.map((tag) => {
                            const active = !!activeTags[tag.id];
                            return (
                                <button
                                    key={tag.id}
                                    onClick={() => toggleTag(tag.id)}
                                    className={`px-3 py-1.5 text-sm rounded-full border transition-all duration-300 ${
                                        active
                                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                                            : 'bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 border-gray-200 text-gray-800 hover:shadow-md hover:-translate-y-0.5'
                                    }`}
                                >
                                    {tag.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Статистика */}
                <div className="mt-6 pt-6 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-sm text-gray-600">
                                Активных фильтров: <span className="font-semibold">{activeFiltersCount}</span>
                            </span>
                        </div>
                        <div className="text-sm text-gray-600">
                            Сортировка: <span className="font-semibold text-blue-600">
                                {sortOptions.find((opt) => opt.value === sortBy)?.label}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Filters;