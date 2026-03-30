import { AppBackground } from '@components';
import { IS_WEB } from '@constants';
import { Heebo_300Light, Heebo_400Regular, Heebo_500Medium, Heebo_700Bold, useFonts } from '@expo-google-fonts/heebo';
import { colors, spacing } from '@theme';
import type { FC } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { BrandPanel } from '../Login/BrandPanel';
import { useLoginAnimation } from '../Login/hooks';
import { ChangePasswordFormCard } from './ChangePasswordFormCard';
import { useChangePasswordForm, type UseChangePasswordFormArgs } from '@/hooks/changePassword/useChangePasswordForm';

const WIDE_WIDTH_BREAKPOINT = 800;

export type ChangePasswordScreenProps = Omit<UseChangePasswordFormArgs, 'startShake'>;

export const ChangePasswordScreen: FC<ChangePasswordScreenProps> = (useChangePasswordFormArgs) => {
  const { width } = useWindowDimensions();
  const isWide = width >= WIDE_WIDTH_BREAKPOINT;

  const [isFontsLoaded] = useFonts({ Heebo_300Light, Heebo_400Regular, Heebo_500Medium, Heebo_700Bold });

  const { bounceAnimationScale, fadeAnimationOpacity, startShake, shakeAnimation } = useLoginAnimation();

  const useChangePasswordFormContent = useChangePasswordForm({ ...useChangePasswordFormArgs, startShake });

  const isWideWeb = IS_WEB && isWide;

  if (!isFontsLoaded) return <AppBackground style={isWideWeb ? styles.webRoot : undefined} />;

  if (isWideWeb) {
    return (
      <AppBackground style={styles.webRoot}>
        <Animated.View style={[styles.webWrap, { opacity: fadeAnimationOpacity }]}>
          <BrandPanel bounceAnimationScale={bounceAnimationScale} />

          <View style={styles.formPanel}>
            <ChangePasswordFormCard
              isWide
              {...{ ...useChangePasswordFormContent, shakeAnimation, bounceAnimationScale }}
            />
          </View>
        </Animated.View>
      </AppBackground>
    );
  }

  return (
    <AppBackground>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, IS_WEB && styles.scrollContentWeb]}
          keyboardShouldPersistTaps='handled'
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ opacity: fadeAnimationOpacity, width: '100%', alignItems: 'center' }}>
            <ChangePasswordFormCard {...{ ...useChangePasswordFormContent, shakeAnimation, bounceAnimationScale }} />
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AppBackground>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  scrollContentWeb: {
    paddingVertical: spacing.xxl,
  },
  webRoot: {
    flex: 1,
    backgroundColor: colors.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  webWrap: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: 900,
    minHeight: 560,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 32 },
    shadowOpacity: 0.4,
    shadowRadius: 60,
  },
  formPanel: {
    flex: 1,
    backgroundColor: colors.purpleCard,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
});
