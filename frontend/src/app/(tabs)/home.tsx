import { HelloWave } from '@/components/hello-wave';
import { ParallaxScrollView } from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppButton, PageHead } from '@components';
import { useAuth } from '@services';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

export default function HomeScreen() {
  const { logout } = useAuth();
  const [apiStatus, setApiStatus] = useState('Connecting...');

  useEffect(() => {
    fetch(`${process.env.EXPO_PUBLIC_API_URL}/health`)
      .then((response) => response.json())
      .then(({ status }) => setApiStatus(`✅ ${status}`))
      .catch(() => setApiStatus('❌ Backend unreachable'));
  }, []);

  return (
    <>
      <PageHead />

      <ParallaxScrollView
        headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
        headerImage={<Image source={require('@/assets/images/partial-react-logo.png')} style={styles.reactLogo} />}
      >
        <ThemedView style={styles.titleContainer}>
          <ThemedText type='title'>Hello PickUs Frontend!</ThemedText>
          <HelloWave />
        </ThemedView>

        <Text style={styles.subtitle}>API Status: {apiStatus}</Text>

        <AppButton label='Logout' onPress={() => logout()} style={{ minWidth: 10 }} />
      </ParallaxScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
  },
});
