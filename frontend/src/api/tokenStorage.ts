import type { User } from '@entities';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { deleteItemAsync, getItemAsync, setItemAsync } from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';
import { Platform } from 'react-native';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_ID_KEY = 'userId';

export const isNative = Platform.OS !== 'web';

export const tokenStorage = {
  getAccessToken: () => AsyncStorage.getItem(ACCESS_TOKEN_KEY),
  setAccessToken: (accessToken: string) => AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken),
  clearAccessToken: () => AsyncStorage.removeItem(ACCESS_TOKEN_KEY),

  getRefreshToken: () => (isNative ? getItemAsync(REFRESH_TOKEN_KEY) : null),
  setRefreshToken: (refreshToken: string) => (isNative ? setItemAsync(REFRESH_TOKEN_KEY, refreshToken) : null),
  clearRefreshToken: () => (isNative ? deleteItemAsync(REFRESH_TOKEN_KEY) : null),

  getUserId: () => AsyncStorage.getItem(USER_ID_KEY),
  setUserId: (userId: User['id']) => AsyncStorage.setItem(USER_ID_KEY, userId),
  clearUserId: () => AsyncStorage.removeItem(USER_ID_KEY),

  getUserIdFromAccessToken: (accessToken: string) => (jwtDecode(accessToken)?.sub as User['id'] | null) ?? null,

  clearAll: () =>
    Promise.all([tokenStorage.clearAccessToken(), tokenStorage.clearRefreshToken(), tokenStorage.clearUserId()]),
};
