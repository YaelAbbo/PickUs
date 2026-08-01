import { useNativeDriver } from '@constants';
import { useRef, useState } from 'react';
import { Animated } from 'react-native';

export type UseSuccessOverlayAnimationContent = ReturnType<typeof useSuccessOverlayAnimation>;

export const useSuccessOverlayAnimation = (onFinish: () => void, displayDuration = 1500) => {
  const [showSuccess, setShowSuccess] = useState(false);
  const successFadeAnim = useRef(new Animated.Value(0)).current;
  const successScaleAnim = useRef(new Animated.Value(0.3)).current;

  const runSuccessAnimation = () => {
    setShowSuccess(true);
    Animated.parallel([
      Animated.timing(successFadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver,
      }),
      Animated.spring(successScaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver,
      }),
    ]).start();

    // After displayDuration seconds, start fade out and close/navigate
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(successFadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver,
        }),
        Animated.timing(successScaleAnim, {
          toValue: 0.8,
          duration: 300,
          useNativeDriver,
        }),
      ]).start();

      setTimeout(() => {
        setShowSuccess(false);
        onFinish();
      }, 350);
    }, displayDuration);
  };

  return {
    showSuccess,
    successFadeAnim,
    successScaleAnim,
    runSuccessAnimation,
  };
};
