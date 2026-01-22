/**
 * Filter Utilities
 *
 * Helper functions for parsing and applying filters from query parameters.
 */

/**
 * Filter operator types
 */
export type FilterOperator =
  | 'eq' // equals
  | 'ne' // not equals
  | 'gt' // greater than
  | 'gte' // greater than or equal
  | 'lt' // less than
  | 'lte' // less than or equal
  | 'in' // in array
  | 'nin' // not in array
  | 'contains' // string contains
  | 'startsWith' // string starts with
  | 'endsWith' // string ends with
  | 'between'; // between two values

/**
 * Parsed filter value
 */
export interface ParsedFilter {
  field: string;
  operator: FilterOperator;
  value: unknown;
}

/**
 * Filter configuration
 */
export interface FilterConfig {
  /** Allowed fields for filtering */
  allowedFields?: string[];
  /** Field type mappings for proper parsing */
  fieldTypes?: Record<string, 'string' | 'number' | 'boolean' | 'date' | 'array'>;
  /** Default operator if not specified */
  defaultOperator?: FilterOperator;
}

/**
 * Sort direction
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Parsed sort value
 */
export interface ParsedSort {
  field: string;
  direction: SortDirection;
}

/**
 * Parse filter value based on field type
 */
function parseValue(value: string, type?: string): unknown {
  if (!type || type === 'string') {
    return value;
  }

  switch (type) {
    case 'number': {
      const num = parseFloat(value);
      return isNaN(num) ? value : num;
    }

    case 'boolean':
      return value === 'true' || value === '1';

    case 'date': {
      const date = new Date(value);
      return isNaN(date.getTime()) ? value : date;
    }

    case 'array':
      return value.split(',').map(v => v.trim());

    default:
      return value;
  }
}

/**
 * Parse filters from query parameters
 *
 * Supports various filter formats:
 * - Simple: ?status=published
 * - Operator: ?price[gte]=100
 * - Array: ?tags[in]=news,tech
 *
 * @param params - URL search params or query object
 * @param config - Filter configuration
 * @returns Array of parsed filters
 *
 * @example
 * ```typescript
 * const url = new URL(request.url);
 * const filters = parseFilters(url.searchParams, {
 *   allowedFields: ['status', 'category', 'createdAt'],
 *   fieldTypes: { createdAt: 'date' },
 * });
 *
 * // Build Prisma where clause
 * const where = buildPrismaFilters(filters);
 * ```
 */
export function parseFilters(
  params: URLSearchParams | Record<string, string | string[] | undefined>,
  config: FilterConfig = {}
): ParsedFilter[] {
  const { allowedFields, fieldTypes = {}, defaultOperator = 'eq' } = config;
  const filters: ParsedFilter[] = [];

  // Convert to entries
  const entries: [string, string][] =
    params instanceof URLSearchParams
      ? Array.from(params.entries())
      : Object.entries(params)
          .filter((entry): entry is [string, string] => typeof entry[1] === 'string')
          .concat(
            Object.entries(params)
              .filter((entry): entry is [string, string[]] => Array.isArray(entry[1]))
              .flatMap(([key, values]) => values.map(v => [key, v] as [string, string]))
          );

  for (const [key, value] of entries) {
    // Skip pagination and sorting params
    if (['page', 'limit', 'sort', 'order', 'cursor'].includes(key)) {
      continue;
    }

    // Parse key for operator: field[operator]=value
    const match = key.match(/^(\w+)(?:\[(\w+)\])?$/);
    if (!match) continue;

    const [, field, operatorStr] = match;
    if (!field) continue;

    // Check if field is allowed
    if (allowedFields && !allowedFields.includes(field)) {
      continue;
    }

    // Parse operator
    const operator = (operatorStr as FilterOperator) || defaultOperator;

    // Parse value based on field type
    const parsedValue = parseValue(value, fieldTypes[field]);

    // Handle special cases
    if (operator === 'in' || operator === 'nin') {
      // Split comma-separated values
      const arrayValue =
        typeof parsedValue === 'string'
          ? parsedValue.split(',').map(v => parseValue(v.trim(), fieldTypes[field]))
          : Array.isArray(parsedValue)
            ? parsedValue
            : [parsedValue];

      filters.push({ field, operator, value: arrayValue });
    } else if (operator === 'between') {
      // Expect format: min,max
      const [min, max] =
        typeof parsedValue === 'string'
          ? parsedValue.split(',').map(v => parseValue(v.trim(), fieldTypes[field]))
          : [parsedValue, parsedValue];

      filters.push({ field, operator, value: { min, max } });
    } else {
      filters.push({ field, operator, value: parsedValue });
    }
  }

  return filters;
}

/**
 * Parse sort parameters from query
 *
 * Supports formats:
 * - Simple: ?sort=createdAt
 * - With direction: ?sort=createdAt&order=desc
 * - Combined: ?sort=-createdAt (- prefix for desc)
 * - Multiple: ?sort=category,-createdAt
 *
 * @param params - URL search params or query object
 * @param allowedFields - Optional list of allowed sort fields
 * @returns Array of parsed sort values
 */
export function parseSort(
  params: URLSearchParams | Record<string, string | undefined>,
  allowedFields?: string[]
): ParsedSort[] {
  const getValue = (key: string) =>
    params instanceof URLSearchParams ? params.get(key) : params[key];

  const sortParam = getValue('sort');
  const orderParam = getValue('order');

  if (!sortParam) {
    return [];
  }

  const sorts: ParsedSort[] = [];
  const fields = sortParam.split(',');

  for (let field of fields) {
    field = field.trim();
    if (!field) continue;

    // Check for direction prefix
    let direction: SortDirection = 'asc';
    if (field.startsWith('-')) {
      direction = 'desc';
      field = field.slice(1);
    } else if (field.startsWith('+')) {
      field = field.slice(1);
    }

    // Check if field is allowed
    if (allowedFields && !allowedFields.includes(field)) {
      continue;
    }

    // Use order param for first field if no prefix was used
    if (
      sorts.length === 0 &&
      orderParam &&
      !sortParam.startsWith('-') &&
      !sortParam.startsWith('+')
    ) {
      direction = orderParam === 'desc' ? 'desc' : 'asc';
    }

    sorts.push({ field, direction });
  }

  return sorts;
}

/**
 * Convert parsed filters to Prisma where clause
 *
 * @param filters - Parsed filters
 * @returns Prisma-compatible where object
 */
export function buildPrismaFilters(filters: ParsedFilter[]): Record<string, unknown> {
  const where: Record<string, unknown> = {};

  for (const { field, operator, value } of filters) {
    switch (operator) {
      case 'eq':
        where[field] = value;
        break;

      case 'ne':
        where[field] = { not: value };
        break;

      case 'gt':
        where[field] = { gt: value };
        break;

      case 'gte':
        where[field] = { gte: value };
        break;

      case 'lt':
        where[field] = { lt: value };
        break;

      case 'lte':
        where[field] = { lte: value };
        break;

      case 'in':
        where[field] = { in: value };
        break;

      case 'nin':
        where[field] = { notIn: value };
        break;

      case 'contains':
        where[field] = { contains: value, mode: 'insensitive' };
        break;

      case 'startsWith':
        where[field] = { startsWith: value, mode: 'insensitive' };
        break;

      case 'endsWith':
        where[field] = { endsWith: value, mode: 'insensitive' };
        break;

      case 'between': {
        const { min, max } = value as { min: unknown; max: unknown };
        where[field] = { gte: min, lte: max };
        break;
      }
    }
  }

  return where;
}

/**
 * Convert parsed sorts to Prisma orderBy clause
 *
 * @param sorts - Parsed sorts
 * @returns Prisma-compatible orderBy array
 */
export function buildPrismaSort(sorts: ParsedSort[]): Record<string, SortDirection>[] {
  return sorts.map(({ field, direction }) => ({ [field]: direction }));
}

/**
 * Parse date range from query parameters
 *
 * @param params - URL search params or query object
 * @param startKey - Key for start date (default: 'startDate')
 * @param endKey - Key for end date (default: 'endDate')
 * @returns Date range object or null if not specified
 */
export function parseDateRange(
  params: URLSearchParams | Record<string, string | undefined>,
  startKey = 'startDate',
  endKey = 'endDate'
): { start: Date | null; end: Date | null } {
  const getValue = (key: string) =>
    params instanceof URLSearchParams ? params.get(key) : params[key];

  const startStr = getValue(startKey);
  const endStr = getValue(endKey);

  const start = startStr ? new Date(startStr) : null;
  const end = endStr ? new Date(endStr) : null;

  return {
    start: start && !isNaN(start.getTime()) ? start : null,
    end: end && !isNaN(end.getTime()) ? end : null,
  };
}

/**
 * Parse search query from parameters
 *
 * @param params - URL search params or query object
 * @param keys - Keys to check for search query (default: ['q', 'search', 'query'])
 * @returns Search query string or null
 */
export function parseSearch(
  params: URLSearchParams | Record<string, string | undefined>,
  keys = ['q', 'search', 'query']
): string | null {
  const getValue = (key: string) =>
    params instanceof URLSearchParams ? params.get(key) : params[key];

  for (const key of keys) {
    const value = getValue(key);
    if (value && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

/**
 * Create a filter parser with preset configuration
 */
export function createFilterParser(config: FilterConfig = {}) {
  return {
    filters: (params: URLSearchParams | Record<string, string | string[] | undefined>) =>
      parseFilters(params, config),
    sort: (
      params: URLSearchParams | Record<string, string | undefined>,
      allowedFields?: string[]
    ) => parseSort(params, allowedFields || config.allowedFields),
    dateRange: parseDateRange,
    search: parseSearch,
    toPrisma: {
      where: buildPrismaFilters,
      orderBy: buildPrismaSort,
    },
  };
}
