"use client";

import { useState, useMemo, useCallback } from "react";

export interface UsePaginationOptions {
  /** Total number of items */
  totalItems: number;
  /** Initial page number (1-indexed) */
  initialPage?: number;
  /** Items per page */
  pageSize?: number;
  /** Maximum number of page buttons to show */
  maxPageButtons?: number;
}

export interface UsePaginationResult {
  /** Current page number (1-indexed) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Items per page */
  pageSize: number;
  /** Start index for current page (0-indexed) */
  startIndex: number;
  /** End index for current page (exclusive) */
  endIndex: number;
  /** Whether there is a previous page */
  hasPrevious: boolean;
  /** Whether there is a next page */
  hasNext: boolean;
  /** Array of page numbers to display */
  pageNumbers: (number | "...")[];
  /** Go to a specific page */
  goToPage: (page: number) => void;
  /** Go to the next page */
  nextPage: () => void;
  /** Go to the previous page */
  previousPage: () => void;
  /** Go to the first page */
  firstPage: () => void;
  /** Go to the last page */
  lastPage: () => void;
  /** Set the page size */
  setPageSize: (size: number) => void;
}

/**
 * usePagination - Hook for managing pagination state
 *
 * @example
 * ```tsx
 * const { currentPage, totalPages, pageNumbers, goToPage, hasNext, hasPrevious } = usePagination({
 *   totalItems: 100,
 *   pageSize: 10,
 * });
 *
 * const paginatedData = data.slice(startIndex, endIndex);
 *
 * return (
 *   <>
 *     <DataTable data={paginatedData} />
 *     <Pagination
 *       currentPage={currentPage}
 *       totalPages={totalPages}
 *       onPageChange={goToPage}
 *     />
 *   </>
 * );
 * ```
 */
export function usePagination({
  totalItems,
  initialPage = 1,
  pageSize: initialPageSize = 10,
  maxPageButtons = 7,
}: UsePaginationOptions): UsePaginationResult {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSizeState] = useState(initialPageSize);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalItems / pageSize)),
    [totalItems, pageSize]
  );

  // Ensure current page is within bounds
  const validPage = useMemo(
    () => Math.min(Math.max(1, currentPage), totalPages),
    [currentPage, totalPages]
  );

  // Update current page if it exceeds total pages
  if (validPage !== currentPage) {
    setCurrentPage(validPage);
  }

  const startIndex = (validPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  const hasPrevious = validPage > 1;
  const hasNext = validPage < totalPages;

  const pageNumbers = useMemo(() => {
    const pages: (number | "...")[] = [];

    if (totalPages <= maxPageButtons) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      // Calculate range around current page
      const leftBound = Math.max(2, validPage - Math.floor((maxPageButtons - 4) / 2));
      const rightBound = Math.min(totalPages - 1, validPage + Math.floor((maxPageButtons - 4) / 2));

      // Add ellipsis if needed
      if (leftBound > 2) {
        pages.push("...");
      }

      // Add pages in range
      for (let i = leftBound; i <= rightBound; i++) {
        if (!pages.includes(i)) {
          pages.push(i);
        }
      }

      // Add ellipsis if needed
      if (rightBound < totalPages - 1) {
        pages.push("...");
      }

      // Always show last page
      if (!pages.includes(totalPages)) {
        pages.push(totalPages);
      }
    }

    return pages;
  }, [totalPages, validPage, maxPageButtons]);

  const goToPage = useCallback(
    (page: number) => {
      const newPage = Math.min(Math.max(1, page), totalPages);
      setCurrentPage(newPage);
    },
    [totalPages]
  );

  const nextPage = useCallback(() => {
    if (hasNext) {
      setCurrentPage((prev) => prev + 1);
    }
  }, [hasNext]);

  const previousPage = useCallback(() => {
    if (hasPrevious) {
      setCurrentPage((prev) => prev - 1);
    }
  }, [hasPrevious]);

  const firstPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const lastPage = useCallback(() => {
    setCurrentPage(totalPages);
  }, [totalPages]);

  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size);
    setCurrentPage(1); // Reset to first page when page size changes
  }, []);

  return {
    currentPage: validPage,
    totalPages,
    pageSize,
    startIndex,
    endIndex,
    hasPrevious,
    hasNext,
    pageNumbers,
    goToPage,
    nextPage,
    previousPage,
    firstPage,
    lastPage,
    setPageSize,
  };
}
