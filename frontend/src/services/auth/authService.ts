import { parseRefreshCookie } from '@/api/refreshToken';
import { tokenStorage } from '@/api/tokenStorage';
import type { User } from '@/api/user';
import { api } from '@api';
import { IS_MOBILE } from '@constants';
import { jwtDecode } from 'jwt-decode';

export type TokenResponse = { accessToken: string; isTempPassword: boolean };

export const calcIsTokenExpired = (token: string) => {
  const payload = jwtDecode(token);

  const isTokenExpired = !payload.exp || payload.exp * 1000 < Date.now();

  return isTokenExpired;
};

export const authService = {
  login: async (loginDTO: Pick<User, 'nationalId'> & { password: string }) => {
    const { data, headers } = await api.post<TokenResponse>('/auth/login', loginDTO);

    const userId = tokenStorage.getUserIdFromAccessToken(data.accessToken);

    await tokenStorage.setAccessToken(data.accessToken);

    if (userId) await tokenStorage.setUserId(userId);

    if (!IS_MOBILE) {
      const refreshToken = parseRefreshCookie(headers['set-cookie']);

      if (refreshToken) await tokenStorage.setRefreshToken(refreshToken);
    }

    return { isTempPassword: data.isTempPassword };
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      await tokenStorage.clearAll();
    }
  },

  getStoredToken: tokenStorage.getAccessToken,

  getMe: async () => {
    const { data: user } = await api.get<User>('/auth/me');

    return user;
  },
};
