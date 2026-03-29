import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // حساب الصفحات المعروضة
  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else {
      if (totalPages > 1) {
        rangeWithDots.push(totalPages);
      }
    }

    return rangeWithDots;
  };

  if (totalPages <= 1) {
    return (
      <div className="flex items-center justify-between bg-white px-4 py-3 border-t border-gray-200">
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-700">
            عرض {totalItems} من أصل {totalItems} عنصر
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-700">عرض:</label>
            <select
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
              className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-moe-500 focus:border-transparent"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={30}>30</option>
              <option value={50}>50</option>
            </select>
            <span className="text-sm text-gray-700">عنصر</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between bg-white px-4 py-3 border-t border-gray-200 gap-4">
      {/* معلومات العرض */}
      <div className="flex items-center gap-4">
        <div className="text-sm text-gray-700">
          عرض {startItem} إلى {endItem} من أصل {totalItems} عنصر
        </div>
        
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-700">عرض:</label>
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-moe-500 focus:border-transparent"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={30}>30</option>
            <option value={50}>50</option>
          </select>
          <span className="text-sm text-gray-700">عنصر</span>
        </div>
      </div>

      {/* أزرار التنقل */}
      <div className="flex items-center gap-2">
        {/* زر السابق */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
          السابق
        </button>

        {/* أرقام الصفحات */}
        <div className="flex items-center gap-1">
          {getVisiblePages().map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <span className="px-3 py-2 text-sm text-gray-500">...</span>
              ) : (
                <button
                  onClick={() => onPageChange(page as number)}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    currentPage === page
                      ? 'bg-moe-600 text-white'
                      : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* زر التالي */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          التالي
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};