'use client';

import type { PaginationInfo } from './types';

interface ChatbotPaginationProps {
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
}

/** Pagination controls for chatbot conversations listing */
export function ChatbotPagination({ pagination, onPageChange }: ChatbotPaginationProps) {
  const { page, totalPages, total } = pagination;

  if (totalPages <= 1) return null;

  const pages: (number | '...')[] = [];

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('...');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  return (
    <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-ivory/40 text-xs">
        {total} conversation{total > 1 ? 's' : ''} au total
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="text-ivory/60 hover:bg-gold/10 hover:text-gold disabled:hover:text-ivory/60 rounded-md px-2 py-1 text-xs transition disabled:opacity-30 disabled:hover:bg-transparent"
        >
          &larr; Préc.
        </button>
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`dots-${i}`} className="text-ivory/30 px-1 text-xs">
              ...
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                p === page
                  ? 'bg-gold/20 text-gold'
                  : 'text-ivory/60 hover:bg-gold/10 hover:text-gold'
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="text-ivory/60 hover:bg-gold/10 hover:text-gold disabled:hover:text-ivory/60 rounded-md px-2 py-1 text-xs transition disabled:opacity-30 disabled:hover:bg-transparent"
        >
          Suiv. &rarr;
        </button>
      </div>
    </div>
  );
}
