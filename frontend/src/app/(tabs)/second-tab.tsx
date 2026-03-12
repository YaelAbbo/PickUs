import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts } from '@/theme/theme';
import { PageHead, ParallaxScrollView, ThemedText, ThemedView } from '@components';
import { StyleSheet } from 'react-native';

export default function TabTwoScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
      headerImage={
        <IconSymbol
          size={310}
          color='#808080'
          name='chevron.left.forwardslash.chevron.right'
          style={styles.headerImage}
        />
      }
    >
      <PageHead title='TODO' />

      <ThemedView style={styles.titleContainer}>
        <ThemedText
          type='title'
          style={{
            fontFamily: Fonts.rounded,
          }}
        >
          TODO
        </ThemedText>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
});
