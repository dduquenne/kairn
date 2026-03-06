/**
 * @kairn/api Utilities
 *
 * Helper functions for API handlers.
 */

// Response utilities
export {
  success,
  error,
  paginated,
  buildHeaders,
  getStatusForError,
  appErrorToResponse,
  handleErrorResponse,
  ErrorCodes,
  HttpStatus,
  ErrorCodeToStatus,
  CacheControl,
  type SuccessResponse,
  type ErrorResponse,
  type PaginatedResponse,
  type AppErrorResponseResult,
} from './response';

// Pagination utilities
export {
  parsePagination,
  calculatePagination,
  getCursorPagination,
  buildPaginationLinks,
  createPaginator,
  DEFAULT_PAGINATION,
  type PaginationParams,
  type PaginationQuery,
  type PaginationMeta,
} from './pagination';

// Filter utilities
export {
  parseFilters,
  parseSort,
  parseDateRange,
  parseSearch,
  buildPrismaFilters,
  buildPrismaSort,
  createFilterParser,
  type FilterOperator,
  type ParsedFilter,
  type FilterConfig,
  type SortDirection,
  type ParsedSort,
} from './filters';
