export const colors = {
  // Brand
  purple: '#5C52C8',
  purpleDark: '#3E3699',
  purpleCard: '#7268D8',
  yellow: '#F5C842',
  yellowDark: '#C9A020',
  yellowLight: '#FDE27A',

  // Text
  textPrimary: '#FFFFFF',
  textLight: '#EDE9FF',
  textMuted: 'rgba(255,255,255,0.5)',
  textDark: '#2C2470',

  // Feedback
  error: '#FF7B7B',
  errorBg: 'rgba(255,123,123,0.15)',
  errorBorder: 'rgba(255,123,123,0.3)',

  // Input
  inputBg: 'rgba(255,255,255,0.15)',
  inputBorder: 'rgba(255,255,255,0.25)',
  inputFocusBg: 'rgba(245,200,66,0.08)',

  // Misc
  white: '#FFFFFF',
  transparent: 'transparent',
} as const;

export type Colors = typeof colors;
