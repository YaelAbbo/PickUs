import React, { FC, useEffect } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';

interface ToastProps {
  message: string;
  type?: 'success' | 'error';
  visible: boolean;
  onHide: () => void;
}

const Toast: FC<ToastProps> = ({ message, type = 'success', visible, onHide }) => {
  const translateY = React.useRef(new Animated.Value(100)).current;
  const opacity = React.useRef(new Animated.Value(0)).current;
  const [isAnimating, setIsAnimating] = React.useState(false);

  useEffect(() => {
    if (!visible) return;

    setIsAnimating(true);
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: 100,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setIsAnimating(false);
          onHide();
        });
      }, 2500);
    });
  }, [visible, onHide, opacity, translateY]);

  if (!visible && !isAnimating) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        type === 'error' ? styles.error : styles.success,
        { opacity, transform: [{ translateY }] },
      ]}
    >
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1000,
  },
  success: {
    backgroundColor: '#10B981',
  },
  error: {
    backgroundColor: '#EF4444',
  },
  text: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default Toast;
