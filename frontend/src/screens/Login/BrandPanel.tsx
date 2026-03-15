import { colors, spacing, typography } from '@/theme';
import { APP_NAME } from '@constants';
import type { FC } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';

export type BrandPanelProps = { bounceAnimationScale: Animated.Value };

export const BrandPanel: FC<BrandPanelProps> = ({ bounceAnimationScale }) => {
  return (
    <View style={styles.panel}>
      <Animated.View style={[styles.inner, { transform: [{ scale: bounceAnimationScale }] }]}>
        <Image source={require('@/assets/images/logo.jpeg')} style={styles.logo} resizeMode='contain' />

        <Text style={styles.appName}>{APP_NAME}</Text>

        <Text style={styles.tagline}>הדרך החכמה{'\n'}לנסוע ביחד</Text>

        <View style={styles.dots}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.dot, i === 0 && styles.dotActive]} />
          ))}
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  panel: {
    flex: 1,
    backgroundColor: colors.purple,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    overflow: 'hidden',
  },
  inner: {
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 28,
    marginBottom: spacing.lg,
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
    fontSize: typography.sizes.lg,
    color: colors.textLight,
    opacity: 0.8,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 28,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
    marginTop: spacing.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dotActive: {
    backgroundColor: colors.yellow,
    width: 24,
  },
});
