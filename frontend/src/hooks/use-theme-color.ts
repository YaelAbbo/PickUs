import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemeColors } from '@/theme/theme';

export const useThemeColor = (
  props: { light?: string; dark?: string },
  colorName: keyof typeof ThemeColors.light & keyof typeof ThemeColors.dark,
) => {
  const theme = useColorScheme() ?? 'light';
  const colorFromProps = props[theme];

  if (colorFromProps) return colorFromProps;

  return ThemeColors[theme][colorName];
};
