import { Redirect, Tabs } from 'expo-router';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/services/auth/AuthContext';
import { Colors } from '@/theme/theme';
import { SplashScreen } from '@components';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { isUserLoading, user } = useAuth();

  if (isUserLoading) return <SplashScreen />;

  if (!user) return <Redirect href='/(auth)/login' />;

  return (
    <Tabs
      initialRouteName='home'
      screenOptions={{
        title: 'PickUs',
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name='home'
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name='house.fill' color={color} />,
        }}
      />

      <Tabs.Screen
        name='second-tab'
        options={{
          title: 'TODO',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name='paperplane.fill' color={color} />,
        }}
      />
    </Tabs>
  );
}
