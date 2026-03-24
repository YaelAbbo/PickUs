import Constants from 'expo-constants';
import { Platform, type Animated } from 'react-native';

export const REQUIRED = 'שדה חובה';

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

export const IS_WEB = Platform.OS === 'web';
export const IS_MOBILE = !IS_WEB;

export const useNativeDriver = IS_MOBILE satisfies Animated.TimingAnimationConfig['useNativeDriver'];

export const APP_NAME = 'PickUs';
