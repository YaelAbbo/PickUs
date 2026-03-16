import { IS_WEB, useNativeDriver } from '@constants';
import { useShakeAnimation } from '@hooks';
import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

export type UseLoginAnimationContent = ReturnType<typeof useLoginAnimation>;

export const useLoginAnimation = () => {
  const bounceAnimationScaleRef = useRef(new Animated.Value(IS_WEB ? 1 : 0.88));
  const fadeAnimationOpacityRef = useRef(new Animated.Value(0));
  const useShakeAnimationContent = useShakeAnimation();

  useEffect(() => {
    Animated.parallel([
      Animated.spring(bounceAnimationScaleRef.current, { toValue: 1, friction: 5, tension: 80, useNativeDriver }),
      Animated.timing(fadeAnimationOpacityRef.current, { toValue: 1, duration: 600, useNativeDriver }),
    ]).start();
  }, []);

  return {
    bounceAnimationScale: bounceAnimationScaleRef.current,
    fadeAnimationOpacity: fadeAnimationOpacityRef.current,
    ...useShakeAnimationContent,
  };
};
