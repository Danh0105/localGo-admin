import axios, {
  AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import type { ApiErrorBody, ApiSuccessResponse, Paginated } from '../types/api';
import { ApiError } from '../types/api';
import { useAuthStore } from '../store/auth-store';

const baseURL =
  import.meta.env.VITE_API_BASE_URL ?? 'https://api.localgo.skilltripx.com.vn/api/v1';

export const apiClient = axios.create({ baseURL });

apiClient.interceptors.request.use((config) => {
  const accessToken = useAuthStore.getState().accessToken;
  if (accessToken) {
    config.headers.set('Authorization', `Bearer ${accessToken}`);
  }
  return config;
});

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retried?: boolean;
}

let refreshPromise: Promise<string | null> | null = null;

/** Single-flight refresh: concurrent 401s all await the same in-flight refresh call. */
export async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }
  const refreshToken = useAuthStore.getState().refreshToken;
  if (!refreshToken) {
    return null;
  }

  refreshPromise = axios
    .post<
      ApiSuccessResponse<{ accessToken: string; refreshToken: string; expiresAt: string }>
    >(`${baseURL}/auth/refresh`, { refreshToken })
    .then((res) => {
      const tokens = res.data.data;
      useAuthStore.getState().setTokens(tokens.accessToken, tokens.refreshToken);
      return tokens.accessToken;
    })
    .catch(() => {
      useAuthStore.getState().clear();
      return null;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponseBody>) => {
    const originalRequest = error.config as RetriableConfig | undefined;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retried &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      originalRequest._retried = true;
      const newAccessToken = await refreshAccessToken();
      if (newAccessToken) {
        originalRequest.headers.set('Authorization', `Bearer ${newAccessToken}`);
        return apiClient(originalRequest);
      }
    }

    const body = error.response?.data;
    if (body && 'error' in body) {
      throw new ApiError(body.error, body.requestId, error.response?.status);
    }
    throw new ApiError(
      { code: 'NETWORK_ERROR', message: error.message || 'Lỗi kết nối mạng' },
      undefined,
      error.response?.status,
    );
  },
);

interface ApiErrorResponseBody {
  success: false;
  error: ApiErrorBody;
  requestId?: string;
}

export async function unwrap<T>(
  promise: Promise<AxiosResponse<ApiSuccessResponse<T>>>,
): Promise<T> {
  const res = await promise;
  return res.data.data;
}

export async function unwrapPaginated<T>(
  promise: Promise<AxiosResponse<ApiSuccessResponse<T[]>>>,
): Promise<Paginated<T>> {
  const res = await promise;
  return { data: res.data.data, meta: res.data.meta! };
}
