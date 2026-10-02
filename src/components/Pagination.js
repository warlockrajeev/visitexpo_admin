'use client';

import { useId, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const getPageItems = (currentPage, totalPages) => {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }
  if (currentPage <= 3) return [1, 2, 3, 'ellipsis-right', totalPages];
  if (currentPage >= totalPages - 2) {
    return [1, 'ellipsis-left', totalPages - 2, totalPages - 1, totalPages];
  }
  return [1, 'ellipsis-left', currentPage - 1, currentPage, currentPage + 1, 'ellipsis-right', totalPages];
};

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  itemLabel = 'items',
  pageSizeLabel = 'Items per page',
  alwaysVisible = false,
  className = ''
}) {
  const pageInputRef = useRef(null);
  const pageInputId = useId();
  const safeTotalPages = Math.max(1, Number(totalPages) || 1);
  const safeCurrentPage = Math.min(Math.max(Number(currentPage) || 1, 1), safeTotalPages);
  const pageItems = getPageItems(safeCurrentPage, safeTotalPages);

  if (safeTotalPages <= 1 && !alwaysVisible && !onPageSizeChange) return null;

  const pageSize = itemsPerPage === 'all' ? Number(totalItems) || 0 : Number(itemsPerPage) || 1;
  const startItem = totalItems > 0
    ? itemsPerPage === 'all' ? 1 : (safeCurrentPage - 1) * pageSize + 1
    : 0;
  const endItem = totalItems > 0
    ? itemsPerPage === 'all' ? totalItems : Math.min(safeCurrentPage * pageSize, totalItems)
    : 0;

  const handlePageJump = (event) => {
    event.preventDefault();
    const targetPage = Number(pageInputRef.current?.value);
    if (Number.isInteger(targetPage) && targetPage >= 1 && targetPage <= safeTotalPages) {
      onPageChange(targetPage);
    } else if (pageInputRef.current) {
      pageInputRef.current.value = String(safeCurrentPage);
    }
  };

  return (
    <div className={`flex flex-col items-center justify-between gap-3 border-t border-border bg-muted/10 p-4 text-xs sm:flex-row ${className}`}>
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
        <p className="text-muted-foreground">
          {typeof totalItems === 'number' ? (
            <>
              Showing <span className="font-bold text-foreground">{startItem}</span> to{' '}
              <span className="font-bold text-foreground">{endItem}</span> of{' '}
              <span className="font-bold text-foreground">{totalItems}</span> {itemLabel}
            </>
          ) : (
            <>
              Page <span className="font-bold text-foreground">{safeCurrentPage}</span> of{' '}
              <span className="font-bold text-foreground">{safeTotalPages}</span>
            </>
          )}
        </p>

        {onPageSizeChange && (
          <label className="flex items-center gap-2 text-muted-foreground">
            <span>{pageSizeLabel}</span>
            <select
              value={itemsPerPage}
              onChange={(event) => {
                const value = event.target.value;
                onPageSizeChange(value === 'all' ? 'all' : Number(value));
              }}
              className="rounded-lg border border-border bg-background px-2 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>{size === 'all' ? 'All' : size}</option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, safeCurrentPage - 1))}
          disabled={safeCurrentPage === 1}
          aria-label="Previous page"
          className="inline-flex items-center gap-1 rounded-lg border border-border bg-secondary px-2.5 py-1.5 font-semibold text-foreground transition-colors hover:bg-secondary/80 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Previous
        </button>

        {pageItems.map((pageItem) => typeof pageItem === 'number' ? (
          <button
            key={pageItem}
            type="button"
            onClick={() => onPageChange(pageItem)}
            aria-label={`Go to page ${pageItem}`}
            aria-current={safeCurrentPage === pageItem ? 'page' : undefined}
            className={`h-8 min-w-8 rounded-lg px-2 text-xs font-bold transition-colors ${
              safeCurrentPage === pageItem
                ? 'bg-primary text-primary-foreground'
                : 'border border-border bg-card text-foreground hover:bg-secondary'
            }`}
          >
            {pageItem}
          </button>
        ) : (
          <span key={pageItem} aria-hidden="true" className="px-0.5 text-muted-foreground">...</span>
        ))}

        <button
          type="button"
          onClick={() => onPageChange(Math.min(safeTotalPages, safeCurrentPage + 1))}
          disabled={safeCurrentPage === safeTotalPages}
          aria-label="Next page"
          className="inline-flex items-center gap-1 rounded-lg border border-border bg-secondary px-2.5 py-1.5 font-semibold text-foreground transition-colors hover:bg-secondary/80 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next <ChevronRight className="h-3.5 w-3.5" />
        </button>

        {safeTotalPages > 1 && (
          <form onSubmit={handlePageJump} className="ml-1 flex items-center gap-1.5">
            <label htmlFor={pageInputId} className="sr-only">Go to page</label>
            <input
              key={safeCurrentPage}
              id={pageInputId}
              ref={pageInputRef}
              type="number"
              min={1}
              max={safeTotalPages}
              step={1}
              defaultValue={safeCurrentPage}
              className="w-16 rounded-lg border border-border bg-background px-2 py-1.5 text-center text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              type="submit"
              className="rounded-lg border border-border bg-secondary px-2.5 py-1.5 font-bold text-foreground transition-colors hover:bg-secondary/80"
            >
              Go
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
