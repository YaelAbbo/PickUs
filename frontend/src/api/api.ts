import { BASE_URL } from '@constants';
import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { refreshAccessToken } from './refreshToken';
import { tokenStorage } from './tokenStorage';

const AUTH_ROUTES = ['/auth/login', '/auth/refresh', '/auth/logout'];
const isAuthRoute = (url?: string) => AUTH_ROUTES.some((route) => url?.includes(route));

const setAccessTokenInRequestHeaders = (config: InternalAxiosRequestConfig, accessToken: string) =>
  (config.headers.Authorization = `Bearer ${accessToken}`);

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const [accessToken, userId] = await Promise.all([tokenStorage.getAccessToken(), tokenStorage.getUserId()]);

  if (accessToken) setAccessTokenInRequestHeaders(config, accessToken);

  if (userId) config.headers['X-User-Id'] = userId;

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const rejectError = () => Promise.reject(error);

    if (!(error instanceof AxiosError)) return rejectError();

    const originalRequestConfig = error.config as typeof error.config & { _retry?: boolean };

    const isNotSendRefresh =
      error.response?.status !== 401 || originalRequestConfig._retry || isAuthRoute(originalRequestConfig.url);

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
