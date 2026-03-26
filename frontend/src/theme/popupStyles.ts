import { StyleSheet } from 'react-native';
import { colors } from './colors';

export const popupStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 24,
  },
  container: {
    backgroundColor: colors.purpleDark,
    borderRadius: 28,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.3,
    shadowRadius: 48,
    elevation: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 24,
    textAlign: 'center',
    color: colors.textPrimary,
  },
  actions: {
    flexDirection: 'row-reverse',
    justifyContent: 'flex-start',
    marginTop: 32,
    gap: 12,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 100,
  },
  cancelBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  cancelText: {
    color: colors.textLight,
    fontWeight: '600',
    fontSize: 14,
  },
  submitBtn: {
    backgroundColor: colors.yellow,
  },
  submitText: {
    color: colors.textDark,
    fontWeight: '700',
    fontSize: 14,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: 4,
    textAlign: 'left',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textLight,
    marginBottom: 6,
    textAlign: 'left',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    textAlign: 'right',
    backgroundColor: colors.inputBg,
    color: colors.textPrimary,
  },
  inputError: {
    borderColor: colors.error,
  },
});
