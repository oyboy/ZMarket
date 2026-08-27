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
        <div className="flex justify-center items-center space-x-2 mt-8">
            <button
                onClick={() => onPageChange(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Назад
            </button>

            {pagesToShow.map((pageNum) => (
                <button
                    key={pageNum}
                    onClick={() => onPageChange(pageNum)}
                    className={`px-3 py-2 rounded-lg ${
                        currentPage === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                >
                    {pageNum + 1}
                </button>
            ))}

            <button
                onClick={() => onPageChange(Math.min(totalPages - 1, currentPage + 1))}
                disabled={currentPage === totalPages - 1}
                className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Вперёд
            </button>
        </div>
    );
};

export default Pagination;