import React from 'react';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;

    const pagesToShow = [];
    const limit = Math.min(5, totalPages);

    for (let i = 0; i < limit; i++) {
        let pageNum;
        if (totalPages <= 5) {
            pageNum = i;
        } else if (currentPage < 3) {
            pageNum = i;
        } else if (currentPage >= totalPages - 3) {
            pageNum = totalPages - 5 + i;
        } else {
            pageNum = currentPage - 2 + i;
        }
        pagesToShow.push(pageNum);
    }

    return (
        <div className="relative mt-10">
            {/* Gradient divider like in header */}
            <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full mb-6"></div>

            <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
                {/* Page info */}
                <div className="flex items-center space-x-2">
                    <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
                        <span className="text-sm font-medium text-gray-700 font-['Inter']">
                            Страница <span className="font-bold text-blue-600">{currentPage + 1}</span> из {totalPages}
                        </span>
                    </div>
                </div>

                {/* Pagination controls */}
                <div className="flex items-center space-x-2">
                    {/* Previous button */}
                    <button
                        onClick={() => onPageChange(Math.max(0, currentPage - 1))}
                        disabled={currentPage === 0}
                        className="relative px-4 py-2.5 rounded-xl font-medium transition-all duration-300 group overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {currentPage !== 0 ? (
                            <>
                                <div className="absolute inset-0 bg-gradient-to-r from-gray-100 to-gray-200 group-hover:from-gray-200 group-hover:to-gray-300"></div>
                                <div className="absolute inset-0 border border-gray-200 group-hover:border-gray-300 rounded-xl"></div>
                                <span className="relative z-10 flex items-center space-x-2 text-gray-700 font-['Inter']">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                    <span>Назад</span>
                                </span>
                            </>
                        ) : (
                            <div className="absolute inset-0 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl"></div>
                        )}
                    </button>

                    {/* Page numbers */}
                    <div className="flex items-center space-x-1">
                        {pagesToShow.map((pageNum, index) => {
                            // Show ellipsis for gaps
                            if (index > 0 && pageNum !== pagesToShow[index - 1] + 1) {
                                return (
                                    <React.Fragment key={`ellipsis-${index}`}>
                                        <span className="px-2 text-gray-400">...</span>
                                        <button
                                            key={pageNum}
                                            onClick={() => onPageChange(pageNum)}
                                            className={`relative w-10 h-10 rounded-xl font-medium transition-all duration-300 ${
                                                currentPage === pageNum
                                                    ? 'text-white shadow-lg transform scale-105'
                                                    : 'text-gray-700 hover:text-blue-600'
                                            }`}
                                        >
                                            {currentPage === pageNum ? (
                                                <>
                                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl"></div>
                                                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                                                    <span className="relative z-10 font-bold">{pageNum + 1}</span>
                                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="absolute inset-0 bg-gradient-to-r from-gray-50 to-blue-50 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity duration-300"></div>
                                                    <div className="absolute inset-0 border border-gray-200 group-hover:border-blue-200 rounded-xl transition-colors duration-300"></div>
                                                    <span className="relative z-10">{pageNum + 1}</span>
                                                </>
                                            )}
                                        </button>
                                    </React.Fragment>
                                );
                            }

                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => onPageChange(pageNum)}
                                    className={`relative w-10 h-10 rounded-xl font-medium transition-all duration-300 group ${
                                        currentPage === pageNum
                                            ? 'text-white shadow-lg transform scale-105'
                                            : 'text-gray-700 hover:text-blue-600'
                                    }`}
                                >
                                    {currentPage === pageNum ? (
                                        <>
                                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl"></div>
                                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                                            <span className="relative z-10 font-bold">{pageNum + 1}</span>
                                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="absolute inset-0 bg-gradient-to-r from-gray-50 to-blue-50 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity duration-300"></div>
                                            <div className="absolute inset-0 border border-gray-200 group-hover:border-blue-200 rounded-xl transition-colors duration-300"></div>
                                            <span className="relative z-10">{pageNum + 1}</span>
                                        </>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Next button */}
                    <button
                        onClick={() => onPageChange(Math.min(totalPages - 1, currentPage + 1))}
                        disabled={currentPage === totalPages - 1}
                        className="relative px-4 py-2.5 rounded-xl font-medium transition-all duration-300 group overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {currentPage !== totalPages - 1 ? (
                            <>
                                <div className="absolute inset-0 bg-gradient-to-r from-gray-100 to-gray-200 group-hover:from-gray-200 group-hover:to-gray-300"></div>
                                <div className="absolute inset-0 border border-gray-200 group-hover:border-gray-300 rounded-xl"></div>
                                <span className="relative z-10 flex items-center space-x-2 text-gray-700 font-['Inter']">
                                    <span>Вперёд</span>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </span>
                            </>
                        ) : (
                            <div className="absolute inset-0 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl"></div>
                        )}
                    </button>
                </div>

                {/* Quick navigation */}
                <div className="flex items-center space-x-2">
                    <div className="hidden md:flex items-center space-x-2">
                        <span className="text-sm text-gray-600 font-['Inter']">Перейти:</span>
                        <div className="relative">
                            <input
                                type="number"
                                min="1"
                                max={totalPages}
                                defaultValue={currentPage + 1}
                                onChange={(e) => {
                                    const page = parseInt(e.target.value) - 1;
                                    if (page >= 0 && page < totalPages) {
                                        onPageChange(page);
                                    }
                                }}
                                className="w-20 px-3 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 font-['Inter'] text-center"
                            />
                            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                <div className="px-1 py-0.5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded border border-blue-100">
                                    <span className="text-xs font-medium text-blue-600">стр.</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile view for page selection */}
            <div className="mt-6 md:hidden">
                <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100">
                    <span className="text-sm font-medium text-gray-700 font-['Inter']">
                        Быстрый переход:
                    </span>
                    <select
                        value={currentPage}
                        onChange={(e) => onPageChange(parseInt(e.target.value))}
                        className="px-3 py-1.5 border-2 border-blue-200 rounded-lg bg-white text-blue-600 font-medium focus:outline-none focus:border-blue-500 font-['Inter']"
                    >
                        {Array.from({ length: totalPages }, (_, i) => (
                            <option key={i} value={i}>
                                Страница {i + 1}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Progress bar */}
            <div className="mt-6">
                <div className="w-full h-2 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${((currentPage + 1) / totalPages) * 100}%` }}
                    ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-2 font-['Inter']">
                    <span>Начало</span>
                    <span>{Math.round(((currentPage + 1) / totalPages) * 100)}% просмотрено</span>
                    <span>Конец</span>
                </div>
            </div>
        </div>
    );
};

export default Pagination;