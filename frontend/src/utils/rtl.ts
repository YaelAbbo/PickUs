import { I18nManager } from 'react-native';

/**
 * Global RTL setup for the app.
 *
 * This app is always in Hebrew → layout is always RTL regardless of device locale.
 *
 * IMPORTANT: We DISABLE React Native's automatic RTL mirroring by calling
 * forceRTL(false). This prevents double-mirroring on devices already set to
 * RTL languages (Hebrew/Arabic). Instead, we use EXPLICIT 'row-reverse' styling
 * everywhere to ensure consistent RTL layout across all devices.
 *
 * Why this works:
 * - English device: isRTL becomes false, no auto-mirroring, our 'row-reverse' = RTL ✓
 * - Hebrew device: isRTL becomes false (was true), no auto-mirroring, our 'row-reverse' = RTL ✓
 *
 * On web, `I18nManager` has no effect – layout is handled via `direction: ltr` in `globals.css`.
 */

// DISABLE auto-mirroring to prevent double-flip on RTL devices
I18nManager.allowRTL(false);
I18nManager.forceRTL(false);

/**
 * Always `true` – the app is always RTL
 */
export const isRTL = true;

/**
 * The correct `flexDirection` for a horizontal row in RTL layout.
 *
 * We ALWAYS use 'row-reverse' to ensure RTL layout regardless of device
 * language settings or I18nManager state. This guarantees RTL behavior
 * without requiring app restart or reinstall.
 */
export const rtlRow = 'row-reverse' as const;

/**
 * Helpers for positioning icons inside a `react-native-paper` `TextInput`.
 *
 * Since we ALWAYS use RTL layout regardless of device settings, the icon
 * positions are fixed: start = right, end = left.
 *
 * @example
 * ```tsx
 * <TextInput
 *   right={<TextInput.Icon icon="search" />}  // appears on reading-start (right)
 *   left={<TextInput.Icon icon="clear" />}    // appears on reading-end (left)
 * />
 * ```
 */
export const rtlInputIcon = {
  /** Prop name for the reading-start side (right edge in RTL). */
  start: 'right' as const,
  /** Prop name for the reading-end side (left edge in RTL). */
  end: 'left' as const,
};
