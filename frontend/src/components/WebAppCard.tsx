import { IS_MOBILE } from '@constants';
import { colors } from '@theme';
import type { FC, PropsWithChildren } from 'react';
import { StyleSheet, View, type DimensionValue } from 'react-native';

export const WebAppCard: FC<PropsWithChildren> = ({ children }) => {
  if (IS_MOBILE) return <>{children}</>;

  return (
    <View style={styles.bg}>
      <View style={styles.card}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    minHeight: '100vh' as DimensionValue,
    backgroundColor: '#13112b',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  card: {
    width: '100%',
    maxWidth: 430,
    minHeight: 'calc(100vh - 48px)' as DimensionValue,
    alignSelf: 'center',
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: colors.purple,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.5,
    shadowRadius: 80,
  },
});
