import { BASE_URL } from '@constants';
import axios from 'axios';
import { isNative, tokenStorage } from './tokenStorage';

export const parseRefreshCookie = (header: string | string[] | undefined): string | null => {
  if (!header) return null;

  const headers = Array.isArray(header) ? header : [header];
  const match = headers.map((h) => h.match(/refreshToken=([^;]+)/)).find(Boolean);

  return match?.[1] ?? null;
};

export const refreshAccessToken = async () => {
  const headers: Record<string, string> = {};

  if (isNative) {
    const refreshToken = await tokenStorage.getRefreshToken();

    if (!refreshToken) throw new Error('No refresh token stored');

    headers.Cookie = `refreshToken=${refreshToken}`;
  }

  const {
    data: { accessToken },
    headers: responseHeaders,
  } = await axios.post<{ accessToken: string }>(`${BASE_URL}/auth/refresh`, {}, { withCredentials: true, headers });

  await tokenStorage.setAccessToken(accessToken);

  if (isNative) {
    const refreshToken = parseRefreshCookie(responseHeaders['set-cookie']);

    if (refreshToken) await tokenStorage.setRefreshToken(refreshToken);
  }

  return { accessToken };
};
