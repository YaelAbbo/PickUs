import { useNativeDriver } from '@constants';
import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

type FlickeringWrapperProps = {
  children: React.ReactNode;
};

export const FlickeringWrapper = ({ children }: FlickeringWrapperProps) => {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver,
        }),
      ]),
    );
    animation.start();

    return () => animation.stop();
  }, [opacity]);

  return <Animated.View style={{ opacity }}>{children}</Animated.View>;
};
