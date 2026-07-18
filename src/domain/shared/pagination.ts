// Shared pagination contract used by list queries across the domain layer.
// 领域层各列表查询共用的分页契约。
export interface PaginationInput {
  page: number;
  pageSize: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const DEFAULT_PAGE_SIZE = 9;

// Clamp untrusted pagination input to safe bounds before hitting the database.
// 在查询数据库前，将不可信的分页输入收敛到安全范围。
export function normalizePagination(
  input: Partial<PaginationInput> | undefined,
  pageSize: number = DEFAULT_PAGE_SIZE,
): PaginationInput {
  const safePage = Math.max(1, Math.floor(input?.page ?? 1));
  const safePageSize = Math.min(
    50,
    Math.max(1, Math.floor(input?.pageSize ?? pageSize)),
  );
  return { page: safePage, pageSize: safePageSize };
}

export function buildPaginated<T>(
  items: T[],
  total: number,
  pagination: PaginationInput,
): Paginated<T> {
  return {
    items,
    total,
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalPages: Math.max(1, Math.ceil(total / pagination.pageSize)),
  };
}
