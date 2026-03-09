"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (currentPage > 3) {
        pages.push("...");
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push("...");
      }

      pages.push(totalPages);
    }

    return pages;
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handlePageChange = (page: number) => {
    onPageChange(page);
  };

  const pageNumbers = getPageNumbers();

  return (
    <nav
      className="mt-12 flex items-center justify-center gap-2"
      aria-label="Pagination"
    >
      {/* Previous Button */}
      <button
        type="button"
        onClick={handlePrevious}
        disabled={currentPage === 1}
        className="flex items-center gap-1 rounded-lg border border-ivory/20 bg-night/50 px-4 py-2 text-sm font-medium text-ivory transition-all hover:border-gold/50 hover:bg-night/80 hover:text-gold disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-ivory/20 disabled:hover:bg-night/50 disabled:hover:text-ivory"
        aria-label="Page précédente"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Précédent</span>
      </button>

      {/* Page Numbers */}
      <div className="flex items-center gap-1">
        {pageNumbers.map((pageNum, index) => {
          if (pageNum === "...") {
            return (
              <span
                key={`ellipsis-${index}`}
                className="px-3 py-2 text-ivory/50"
              >
                ...
              </span>
            );
          }

          const page = pageNum as number;
          const isActive = page === currentPage;

          return (
            <button
              type="button"
              key={page}
              onClick={() => handlePageChange(page)}
              className={`min-w-[40px] rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                isActive
                  ? "border-gold bg-gold/10 text-gold shadow-lg shadow-gold/20"
                  : "border-ivory/20 bg-night/50 text-ivory hover:border-gold/50 hover:bg-night/80 hover:text-gold"
              }`}
              aria-label={`Page ${page}`}
              aria-current={isActive ? "page" : undefined}
            >
              {page}
            </button>
          );
        })}
      </div>

      {/* Next Button */}
      <button
        type="button"
        onClick={handleNext}
        disabled={currentPage === totalPages}
        className="flex items-center gap-1 rounded-lg border border-ivory/20 bg-night/50 px-4 py-2 text-sm font-medium text-ivory transition-all hover:border-gold/50 hover:bg-night/80 hover:text-gold disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-ivory/20 disabled:hover:bg-night/50 disabled:hover:text-ivory"
        aria-label="Page suivante"
      >
        <span className="hidden sm:inline">Suivant</span>
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}
