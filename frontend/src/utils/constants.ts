import { Platform, type Animated } from 'react-native';

export const REQUIRED = 'שדה חובה';

export const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost/api';

export const IS_WEB = Platform.OS === 'web';
export const IS_MOBILE = !IS_WEB;

export const useNativeDriver = IS_MOBILE satisfies Animated.TimingAnimationConfig['useNativeDriver'];

export const APP_NAME = 'PickUs';
