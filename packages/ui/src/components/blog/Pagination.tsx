"use client";

import { useMemo } from "react";
import { cn } from "../../utils/cn";

export interface PaginationProps {
  /** Current page number (1-indexed) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Callback when page changes */
  onPageChange: (page: number) => void;
  /** Previous button label */
  previousLabel?: string;
  /** Next button label */
  nextLabel?: string;
  /** Maximum number of visible page numbers */
  maxVisible?: number;
  /** Custom class name */
  className?: string;
  /** Custom button class name */
  buttonClassName?: string;
}

/**
 * Pagination component for navigating through pages
 *
 * @example
 * ```tsx
 * <Pagination
 *   currentPage={1}
 *   totalPages={10}
 *   onPageChange={(page) => setCurrentPage(page)}
 * />
 * ```
 */
export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  previousLabel = "Previous",
  nextLabel = "Next",
  maxVisible = 7,
  className,
  buttonClassName,
}: PaginationProps) {
  // Don't render if only one page
  if (totalPages <= 1) return null;

  // Calculate visible page numbers
  const pageNumbers = useMemo(() => {
    const pages: (number | string)[] = [];

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      // Show ellipsis if current page is far from start
      if (currentPage > 3) {
        pages.push("...");
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      // Show ellipsis if current page is far from end
      if (currentPage < totalPages - 2) {
        pages.push("...");
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  }, [currentPage, totalPages, maxVisible]);

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

  const baseButtonClass = cn(
    "flex items-center gap-1 rounded-lg border px-4 py-2 text-sm font-medium transition-all",
    "focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-night"
  );

  const navButtonClass = cn(
    baseButtonClass,
    "border-ivory/20 bg-night/50 text-ivory",
    "hover:border-gold/50 hover:bg-night/80 hover:text-gold",
    "disabled:cursor-not-allowed disabled:opacity-30",
    "disabled:hover:border-ivory/20 disabled:hover:bg-night/50 disabled:hover:text-ivory"
  );

  return (
    <nav
      className={cn("mt-12 flex items-center justify-center gap-2", className)}
      aria-label="Pagination"
    >
      {/* Previous Button */}
      <button
        type="button"
        onClick={handlePrevious}
        disabled={currentPage === 1}
        className={cn(navButtonClass, buttonClassName)}
        aria-label="Previous page"
      >
        {/* Chevron Left */}
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 19l-7-7 7-7"
          />
        </svg>
        <span className="hidden sm:inline">{previousLabel}</span>
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
              onClick={() => onPageChange(page)}
              className={cn(
                "min-w-[40px] rounded-lg border px-3 py-2 text-sm font-medium transition-all",
                "focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-night",
                isActive
                  ? "border-gold bg-gold/10 text-gold shadow-lg shadow-gold/20"
                  : "border-ivory/20 bg-night/50 text-ivory hover:border-gold/50 hover:bg-night/80 hover:text-gold",
                buttonClassName
              )}
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
        className={cn(navButtonClass, buttonClassName)}
        aria-label="Next page"
      >
        <span className="hidden sm:inline">{nextLabel}</span>
        {/* Chevron Right */}
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </nav>
  );
}

