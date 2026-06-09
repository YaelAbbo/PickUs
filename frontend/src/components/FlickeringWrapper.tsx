import { useNativeDriver } from '@constants';
import { useEffect, useRef, type PropsWithChildren } from 'react';
import { Animated } from 'react-native';

type FlickeringWrapperProps = PropsWithChildren;

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
