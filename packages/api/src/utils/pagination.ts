/**
 * Pagination Utilities
 *
 * Helper functions for handling pagination in API responses.
 */

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/**
 * Calculated pagination values for database queries
 */
export interface PaginationQuery {
  skip: number;
  take: number;
  page: number;
  limit: number;
}

/**
 * Pagination result metadata
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
  nextPage: number | null;
  previousPage: number | null;
}

/**
 * Default pagination configuration
 */
export const DEFAULT_PAGINATION = {
  page: 1,
  limit: 20,
  maxLimit: 100,
  minLimit: 1,
} as const;

/**
 * Parse and validate pagination parameters
 *
 * @param params - Raw pagination parameters
 * @param options - Configuration options
 * @returns Validated pagination query values
 *
 * @example
 * ```typescript
 * const { skip, take, page, limit } = parsePagination({
 *   page: searchParams.get('page'),
 *   limit: searchParams.get('limit'),
 * });
 *
 * const posts = await prisma.post.findMany({
 *   skip,
 *   take,
 * });
 * ```
 */
export function parsePagination(
  params: PaginationParams | { page?: string | null; limit?: string | null },
  options: {
    defaultLimit?: number;
    maxLimit?: number;
    minLimit?: number;
  } = {}
): PaginationQuery {
  const {
    defaultLimit = DEFAULT_PAGINATION.limit,
    maxLimit = DEFAULT_PAGINATION.maxLimit,
    minLimit = DEFAULT_PAGINATION.minLimit,
  } = options;

  // Parse page
  let page: number = DEFAULT_PAGINATION.page;
  const rawPage = params.page;
  if (rawPage !== undefined && rawPage !== null) {
    const parsed = typeof rawPage === 'string' ? parseInt(rawPage, 10) : rawPage;
    if (!isNaN(parsed) && parsed >= 1) {
      page = parsed;
    }
  }

  // Parse limit
  let limit = defaultLimit;
  const rawLimit = params.limit;
  if (rawLimit !== undefined && rawLimit !== null) {
    const parsed = typeof rawLimit === 'string' ? parseInt(rawLimit, 10) : rawLimit;
    if (!isNaN(parsed)) {
      limit = Math.max(minLimit, Math.min(maxLimit, parsed));
    }
  }

  return {
    skip: (page - 1) * limit,
    take: limit,
    page,
    limit,
  };
}

/**
 * Calculate pagination metadata from results
 *
 * @param page - Current page number
 * @param limit - Items per page
 * @param total - Total number of items
 * @returns Pagination metadata
 *
 * @example
 * ```typescript
 * const total = await prisma.post.count({ where: { published: true } });
 * const pagination = calculatePagination(page, limit, total);
 *
 * return NextResponse.json({
 *   data: posts,
 *   pagination,
 * });
 * ```
 */
export function calculatePagination(page: number, limit: number, total: number): PaginationMeta {
  const totalPages = Math.ceil(total / limit) || 1;
  const hasNext = page < totalPages;
  const hasPrevious = page > 1;

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext,
    hasPrevious,
    nextPage: hasNext ? page + 1 : null,
    previousPage: hasPrevious ? page - 1 : null,
  };
}

/**
 * Get offset for cursor-based pagination
 *
 * @param cursor - Cursor value (e.g., last item ID)
 * @param limit - Number of items to fetch
 * @returns Prisma cursor configuration
 *
 * @example
 * ```typescript
 * const posts = await prisma.post.findMany({
 *   ...getCursorPagination(cursor, limit),
 *   orderBy: { createdAt: 'desc' },
 * });
 * ```
 */
export function getCursorPagination(
  cursor: string | null | undefined,
  limit: number
): {
  take: number;
  skip?: number;
  cursor?: { id: string };
} {
  if (!cursor) {
    return { take: limit };
  }

  return {
    take: limit,
    skip: 1, // Skip the cursor item
    cursor: { id: cursor },
  };
}

/**
 * Build pagination links for API responses
 *
 * @param baseUrl - Base URL for pagination links
 * @param pagination - Pagination metadata
 * @returns Object with pagination URLs
 *
 * @example
 * ```typescript
 * const links = buildPaginationLinks('/api/posts', pagination);
 * // { first: '/api/posts?page=1', last: '/api/posts?page=5', next: '/api/posts?page=3', prev: '/api/posts?page=1' }
 * ```
 */
export function buildPaginationLinks(
  baseUrl: string,
  pagination: PaginationMeta
): {
  first: string;
  last: string;
  next: string | null;
  prev: string | null;
} {
  const { page, limit, totalPages, hasNext, hasPrevious } = pagination;

  // Parse existing URL and preserve other query params
  const url = new URL(baseUrl, 'http://localhost');
  const setPage = (p: number) => {
    const newUrl = new URL(url);
    newUrl.searchParams.set('page', String(p));
    newUrl.searchParams.set('limit', String(limit));
    return newUrl.pathname + newUrl.search;
  };

  return {
    first: setPage(1),
    last: setPage(totalPages),
    next: hasNext ? setPage(page + 1) : null,
    prev: hasPrevious ? setPage(page - 1) : null,
  };
}

/**
 * Create a reusable paginator for a specific configuration
 *
 * @param config - Default pagination configuration
 * @returns Paginator functions
 */
export function createPaginator(
  config: {
    defaultLimit?: number;
    maxLimit?: number;
  } = {}
) {
  return {
    parse: (params: PaginationParams) => parsePagination(params, config),
    calculate: calculatePagination,
    cursor: getCursorPagination,
    links: buildPaginationLinks,
  };
}
