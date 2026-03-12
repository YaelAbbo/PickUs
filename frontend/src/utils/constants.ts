import { Platform, type Animated } from 'react-native';

export const REQUIRED = 'שדה חובה';

export const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost/api';

export const useNativeDriver = (Platform.OS !== 'web') satisfies Animated.TimingAnimationConfig['useNativeDriver'];

export const APP_NAME = 'PickUs';
