import { parseRefreshCookie } from '@/api/refreshToken';
import { tokenStorage } from '@/api/tokenStorage';
import { api } from '@api';
import { IS_MOBILE } from '@constants';
import type { User } from '@schemas';
import { jwtDecode } from 'jwt-decode';

export type TokenResponse = { accessToken: string };

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
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.log(error);
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
