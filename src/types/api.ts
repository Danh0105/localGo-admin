export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: unknown[];
}

export interface ApiErrorResponse {
  success: false;
  error: ApiErrorBody;
  requestId?: string;
}

export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}

/** Thrown by the api client for every non-2xx response; carries the backend's error code. */
export class ApiError extends Error {
  code: string;
  details?: unknown[];
  requestId?: string;
  status?: number;

  constructor(body: ApiErrorBody, requestId?: string, status?: number) {
    super(body.message);
    this.name = 'ApiError';
    this.code = body.code;
    this.details = body.details;
    this.requestId = requestId;
    this.status = status;
  }
}
