import { queryClient } from '@/queryClient';
import { clearUserCache } from '@/services/auth/utils';
import { BASE_URL } from '@constants';
import { AxiosError, create, HttpStatusCode, type InternalAxiosRequestConfig } from 'axios';
import { refreshAccessToken } from './refreshToken';
import { tokenStorage } from './tokenStorage';

const NO_REFRESH_ROUTES = ['/auth/login', '/auth/refresh'];
const isNoRefreshRoute = (url?: string) => NO_REFRESH_ROUTES.some((route) => url?.includes(route));

const setAccessTokenInRequestHeaders = (config: InternalAxiosRequestConfig, accessToken: string) =>
  (config.headers.Authorization = `Bearer ${accessToken}`);

export const api = create({ baseURL: BASE_URL, withCredentials: true });

api.interceptors.request.use(async (config) => {
  const [accessToken, userId] = await Promise.all([tokenStorage.getAccessToken(), tokenStorage.getUserId()]);

  if (accessToken) setAccessTokenInRequestHeaders(config, accessToken);

  if (userId) config.headers['X-User-Id'] = userId;

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const oldAccessToken = await tokenStorage.getAccessToken();

    const rejectError = () => Promise.reject(error);

    if (!(error instanceof AxiosError)) return rejectError();

    const originalRequestConfig = error.config as typeof error.config & { _retry?: boolean };

    const isUnauthorized = error.response?.status === HttpStatusCode.Unauthorized;
    const isNoRefresh = isNoRefreshRoute(originalRequestConfig.url);

    const isUnauthorizedWithNoToken = !oldAccessToken && isUnauthorized && !isNoRefresh;

    if (isUnauthorizedWithNoToken) {
      await clearUserCache(queryClient);

      return rejectError();
    }

    const isNotSendRefresh =
      !oldAccessToken || !isUnauthorized || originalRequestConfig._retry || isNoRefreshRoute(originalRequestConfig.url);

    if (isNotSendRefresh) return rejectError();

    originalRequestConfig._retry = true;

    try {
      const { accessToken: newAccessToken } = await refreshAccessToken();

      setAccessTokenInRequestHeaders(originalRequestConfig, newAccessToken);

      return api(originalRequestConfig);
    } catch {
      await tokenStorage.clearAll();

      return rejectError();
    }
  },
);
