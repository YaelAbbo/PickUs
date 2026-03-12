import type { ViewStyle } from 'react-native';

export type WithStyle<T = unknown> = T & { style?: ViewStyle };
