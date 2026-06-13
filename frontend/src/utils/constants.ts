import Constants from 'expo-constants';
import { Platform, type Animated } from 'react-native';

import { i18n } from '@/i18n';

export const REQUIRED = i18n.general.required_field;

const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;

  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(':').shift();
    if (host) return `http://${host}/api`;
  }

  return 'http://localhost/api';
};

export const BASE_URL = getBaseUrl();
console.log({ BASE_URL, GOOGLE_MAPS_API_KEY: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY });

export const IS_WEB = Platform.OS === 'web';
export const IS_MOBILE = !IS_WEB;

export const useNativeDriver = IS_MOBILE satisfies Animated.TimingAnimationConfig['useNativeDriver'];

export const APP_NAME = 'PickUs';
