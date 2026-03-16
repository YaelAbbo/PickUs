import { useNativeDriver } from '@constants';
import { Animated } from 'react-native';

export type UseShakeAnimationContent = ReturnType<typeof useShakeAnimation>;

export const useShakeAnimation = () => {
  const shakeAnimation = new Animated.Value(0);

  const startShake = () =>
    Animated.sequence([
      Animated.timing(shakeAnimation, { toValue: 12, duration: 50, useNativeDriver }),
      Animated.timing(shakeAnimation, { toValue: -12, duration: 50, useNativeDriver }),
      Animated.timing(shakeAnimation, { toValue: 8, duration: 50, useNativeDriver }),
      Animated.timing(shakeAnimation, { toValue: -8, duration: 50, useNativeDriver }),
      Animated.timing(shakeAnimation, { toValue: 0, duration: 50, useNativeDriver }),
    ]).start();

  return { startShake, shakeAnimation };
};
