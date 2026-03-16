import { colors } from '@theme';
import type { WithStyle } from '@types';
import type { FC, PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

export type AppBackgroundProps = WithStyle<PropsWithChildren>;

export const AppBackground: FC<AppBackgroundProps> = ({ children, style }) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.blob1} />
      <View style={styles.blob2} />

      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.purple,
    overflow: 'hidden',
  },
  blob1: {
    position: 'absolute',
    width: 380,
    height: 380,
    borderRadius: 190,
    backgroundColor: colors.purpleDark,
    top: -140,
    right: -110,
    opacity: 0.7,
  },
  blob2: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: colors.yellow,
    bottom: -90,
    left: -70,
    opacity: 0.4,
  },
});
