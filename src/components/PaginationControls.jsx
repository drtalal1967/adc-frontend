import React from 'react';

export default function PaginationControls({
  totalItems = 0,
  page = 1,
  pageSize = 50,
  onPageChange,
  onPageSizeChange,
  label = 'records',
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = Math.min(totalItems, safePage * pageSize);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
      <p className="text-xs font-bold text-gray-500">
        Showing <span className="text-gray-900">{start}-{end}</span> of <span className="text-gray-900">{totalItems}</span> {label}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
          className="h-9 rounded-xl border border-gray-200 bg-gray-50 px-3 text-xs font-bold text-gray-600"
        >
          {[25, 50, 100].map(size => (
            <option key={size} value={size}>{size} / page</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => onPageChange(safePage - 1)}
          disabled={safePage <= 1}
          className="h-9 rounded-xl border border-gray-200 px-3 text-xs font-bold text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          Previous
        </button>
        <span className="h-9 min-w-20 rounded-xl bg-blue-50 px-3 text-xs font-black text-blue-900 flex items-center justify-center">
          {safePage} / {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(safePage + 1)}
          disabled={safePage >= totalPages}
          className="h-9 rounded-xl border border-gray-200 px-3 text-xs font-bold text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
