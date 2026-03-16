import { colors, typography } from '@/theme';
import { useNativeDriver } from '@constants';
import { Heebo_300Light, Heebo_500Medium, useFonts } from '@expo-google-fonts/heebo';
import { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';
import { AppBackground } from './ui';

export function SplashScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  const [isFontsLoaded] = useFonts({ Heebo_300Light, Heebo_500Medium });

  useEffect(() => {
    // Logo entrance
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 80, useNativeDriver }),
    ]).start();

    // Pulsing dots loop
    const pulse = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 400, useNativeDriver }),
          Animated.timing(dot, { toValue: 0.3, duration: 400, useNativeDriver }),
        ]),
      );

    Animated.parallel([pulse(dot1, 0), pulse(dot2, 160), pulse(dot3, 320)]).start();
  }, [dot1, dot2, dot3, fadeAnim, scaleAnim]);

  return (
    <AppBackground>
      <Animated.View style={[styles.inner, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <Image source={require('@/assets/images/logo.jpeg')} style={styles.logo} resizeMode='contain' />

        {isFontsLoaded && (
          <>
            <Text style={styles.appName}>PickUs</Text>
            <Text style={styles.tagline}>הדרך החכמה לנסוע ביחד</Text>
          </>
        )}
      </Animated.View>

      <View style={styles.dotsRow}>
        {[dot1, dot2, dot3].map((dot, i) => (
          <Animated.View key={i} style={[styles.dot, { opacity: dot }]} />
        ))}
      </View>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  inner: {
    alignItems: 'center',
  },
  logo: {
    width: 110,
    height: 110,
    borderRadius: 26,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 16,
  },
  appName: {
    fontFamily: typography.fonts.medium,
    fontSize: 52,
    color: colors.yellow,
    letterSpacing: -1,
  },
  tagline: {
    fontFamily: typography.fonts.light,
    fontSize: 15,
    color: colors.textLight,
    opacity: 0.7,
    marginTop: 8,
  },
  dotsRow: {
    position: 'absolute',
    bottom: 60,
    flexDirection: 'row',
    gap: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.yellow,
  },
});
