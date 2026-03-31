import type { UseChangePasswordFormContent } from '@/hooks/changePassword/useChangePasswordForm';
import { i18n } from '@/i18n';
import { colors, radii, spacing, typography } from '@/theme';
import { AppButton, AppTextInput } from '@components';
import type { FC } from 'react';
import { Controller } from 'react-hook-form';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';

export type ChangePasswordFormCardProps = UseChangePasswordFormContent & {
  isWide?: boolean;
  bounceAnimationScale: Animated.Value;
  shakeAnimation: Animated.Value;
};

export const ChangePasswordFormCard: FC<ChangePasswordFormCardProps> = ({
  isWide = false,
  bounceAnimationScale,
  control,
  onSubmit,
  shakeAnimation,
  isSubmitting,
  errors,
}) => {
  return (
    <Animated.View style={[styles.card, isWide && styles.cardWide, { transform: [{ translateX: shakeAnimation }] }]}>
      {!isWide && (
        <Animated.View style={[styles.logoBlock, { transform: [{ scale: bounceAnimationScale }] }]}>
          <Image source={require('@/assets/images/logo.jpeg')} style={styles.logo} resizeMode='contain' />

          <Text style={styles.appName}>PickUs</Text>
          <Text style={styles.welcomeText}>{i18n.change_password.title}</Text>
        </Animated.View>
      )}

      {isWide && (
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{i18n.change_password.title}</Text>
          <Text style={styles.cardSubtitle}>{i18n.change_password.enter_new_password}</Text>
        </View>
      )}

      <Controller
        control={control}
        name='newPassword'
        render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
          <AppTextInput
            nativeID={i18n.change_password.new_password}
            label={i18n.change_password.new_password}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            isPassword
            returnKeyType='next'
            textContentType='newPassword'
            autoComplete='new-password'
            error={error?.message}
          />
        )}
      />

      <View style={{ marginTop: spacing.md }}>
        <Controller
          control={control}
          name='confirmPassword'
          render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
            <AppTextInput
              nativeID={i18n.change_password.confirm_new_password}
              label={i18n.change_password.confirm_new_password}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              isPassword
              returnKeyType='done'
              onSubmitEditing={onSubmit}
              textContentType='newPassword'
              autoComplete='new-password'
              error={error?.message}
            />
          )}
        />
      </View>

      <View style={styles.errorContainer}>
        {!!errors.root && (
          <View style={styles.errorBubble}>
            <Text style={styles.errorText}>{errors.root.message}</Text>
          </View>
        )}
      </View>

      <AppButton
        label={i18n.change_password.change_password}
        loading={isSubmitting}
        disabled={!!errors.newPassword || !!errors.confirmPassword}
        onPress={onSubmit}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.purpleCard,
    borderRadius: radii.xl,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cardWide: {
    maxWidth: 420,
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.25,
    shadowRadius: 40,
  },
  cardHeader: {
    marginBottom: spacing.lg,
  },
  cardTitle: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.xl,
    color: colors.yellow,
  },
  cardSubtitle: {
    fontFamily: typography.fonts.light,
    fontSize: typography.sizes.md,
    color: colors.textLight,
    opacity: 0.75,
    marginTop: 4,
  },
  logoBlock: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logo: {
    width: 90,
    height: 90,
    borderRadius: radii.lg,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
  appName: {
    fontFamily: typography.fonts.medium,
    fontSize: 40,
    color: colors.yellow,
    letterSpacing: -0.5,
  },
  welcomeText: {
    fontFamily: typography.fonts.light,
    fontSize: typography.sizes.md,
    color: colors.textLight,
    marginTop: 4,
    opacity: 0.8,
  },
  errorContainer: {
    height: 52,
    justifyContent: 'center',
    marginVertical: spacing.sm,
  },
  errorBubble: {
    backgroundColor: colors.errorBg,
    borderRadius: radii.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.errorBorder,
  },
  errorText: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.md,
    color: colors.error,
    textAlign: 'center',
  },
});
