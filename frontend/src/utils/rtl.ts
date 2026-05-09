import { I18nManager, Platform } from 'react-native';

/**
 * Global RTL setup for the app.
 *
 * This app is always in Hebrew → layout is always RTL regardless of device locale.
 *
 * - `allowRTL` opts in to RTL support.
 * - `forceRTL` overrides the device locale setting.
 *
 * On native, the change is persisted and takes full effect on the next app
 * launch (React Native limitation). A fresh install on an LTR device will
 * appear LTR on the very first cold-start only; every subsequent launch will
 * be RTL.
 *
 * On web, `I18nManager` has no effect on CSS – RTL is handled via
 * `direction: rtl` in `globals.css`.
 */
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

/**
 * Always `true` – use this constant instead of `I18nManager.isRTL` to avoid
 * stale reads that can occur before the persisted RTL flag propagates on
 * first launch.
 */
export const isRTL = true;

/**
 * The correct `flexDirection` for a horizontal row in RTL layout.
 *
 * - **Native**: `I18nManager.forceRTL` makes React Native automatically mirror
 *   `'row'` so items flow right-to-left. Use `'row'` and the framework handles it.
 * - **Web**: `react-native-web` does NOT mirror `'row'` based on `I18nManager`,
 *   so we must supply `'row-reverse'` explicitly.
 */
export const rtlRow: 'row' | 'row-reverse' = Platform.OS === 'web' ? 'row-reverse' : 'row';

/**
 * Helpers for positioning icons inside a `react-native-paper` `TextInput`.
 *
 * The `left` / `right` props in Paper refer to **physical** screen positions.
 * On native with `I18nManager` RTL the component layout is already mirrored, so
 * the "start" icon (password toggle / search) must go into the `left` prop to
 * appear on the visual right (reading-start). On web there is no auto-mirroring,
 * so the same icon must go into the `right` prop.
 *
 * @example
 * ```tsx
 * <TextInput
 *   right={rtlInput[rtlInput.end](clearIcon)}  // always the "end" side
 *   left={rtlInput[rtlInput.start](startIcon)} // always the "start" side
 * />
 * ```
 */
export const rtlInputIcon = {
  /** Prop name for the reading-start side (right edge in RTL). */
  start: (Platform.OS === 'web' ? 'right' : 'left') as 'left' | 'right',
  /** Prop name for the reading-end side (left edge in RTL). */
  end: (Platform.OS === 'web' ? 'left' : 'right') as 'left' | 'right',
};
