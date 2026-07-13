export interface Paginated<T> {
  count: number;
  limit: number;
  page: number;
  data: T[];
}

export interface OrderBy {
  field: string;
  param: 'asc' | 'desc';
}

export interface PaginatedQueryParams {
  limit: number;
  page: number;
  offset: number;
  orderBy: OrderBy;
}
