import React, { useState, useMemo, useCallback } from 'react';

interface VirtualTableProps<T> {
  data: T[];
  columns: Array<{
    key: string;
    header: string;
    render: (item: T, index: number) => React.ReactNode;
    width?: string;
  }>;
  itemHeight?: number;
  visibleRows?: number;
  className?: string;
  headerClassName?: string;
  rowClassName?: string;
  emptyMessage?: string;
  isLoading?: boolean;
  loadingComponent?: React.ReactNode;
}

const VirtualTable = <T,>({
  data,
  columns,
  itemHeight = 60,
  visibleRows = 5,
  className = '',
  headerClassName = '',
  rowClassName = '',
  emptyMessage = 'No data available',
  isLoading = false,
  loadingComponent
}: VirtualTableProps<T>) => {
  const [currentPage, setCurrentPage] = useState(1);
  
  // Calculate pagination
  const totalPages = Math.ceil(data.length / visibleRows);
  const startIndex = (currentPage - 1) * visibleRows;
  const endIndex = startIndex + visibleRows;
  const currentItems = data.slice(startIndex, endIndex);

  // Reset to first page when data changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [data.length]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // Memoize pagination buttons to prevent unnecessary re-renders
  const paginationButtons = useMemo(() => {
    if (totalPages <= 1) return null;

    const buttons = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // Adjust start page if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Previous button
    buttons.push(
      <button
        key="prev"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-2 sm:px-3 py-1 sm:py-1.5 bg-slate-600 hover:bg-slate-500 disabled:bg-slate-700 disabled:text-slate-500 text-slate-200 rounded-lg text-xs sm:text-sm transition whitespace-nowrap"
      >
        Previous
      </button>
    );

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm transition whitespace-nowrap ${
            currentPage === i
              ? 'bg-cyan-600 text-white'
              : 'bg-slate-600 hover:bg-slate-500 text-slate-200'
          }`}
        >
          {i}
        </button>
      );
    }

    // Next button
    buttons.push(
      <button
        key="next"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-2 sm:px-3 py-1 sm:py-1.5 bg-slate-600 hover:bg-slate-500 disabled:bg-slate-700 disabled:text-slate-500 text-slate-200 rounded-lg text-xs sm:text-sm transition whitespace-nowrap"
      >
        Next
      </button>
    );

    return buttons;
  }, [currentPage, totalPages, handlePageChange]);

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="overflow-x-auto">
          <table className={`w-full text-sm text-left text-slate-300 ${className}`}>
            <thead className={`text-xs text-slate-400 uppercase bg-slate-700/50 ${headerClassName}`}>
              <tr>
                {columns.map((column) => (
                  <th key={column.key} className="px-4 py-3" style={{ width: column.width }}>
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={columns.length} className="text-center py-8">
                  {loadingComponent || (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-400"></div>
                    </div>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="overflow-x-auto">
        <table className={`w-full text-sm text-left text-slate-300 ${className}`}>
          <thead className={`text-xs text-slate-400 uppercase bg-slate-700/50 ${headerClassName}`}>
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="px-4 py-3" style={{ width: column.width }}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentItems.length > 0 ? (
              currentItems.map((item, index) => (
                <tr 
                  key={startIndex + index} 
                  className={`border-b border-slate-700 hover:bg-slate-700/50 ${rowClassName}`}
                  style={{ height: itemHeight }}
                >
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-3">
                      {column.render(item, startIndex + index)}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="text-center py-8 text-slate-400">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data.length > 0 && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-4 px-2 py-2 bg-slate-700/30 rounded-lg w-full gap-2">
          <div className="text-xs sm:text-sm text-slate-300 mb-2 sm:mb-0">
            Page {currentPage} of {totalPages} ({data.length} total items)
          </div>
          <div className="flex gap-1 sm:gap-2 overflow-x-auto w-full sm:w-auto pb-1">
            {paginationButtons}
          </div>
        </div>
      )}
    </div>
  );
};

export default VirtualTable;
