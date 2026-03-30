import { UserRole } from '@/api/user';
import { HapticTab } from '@/components/haptic-tab';
import { WebAppCard } from '@/components/WebAppCard';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/services/auth/AuthContext';
import { ThemeColors } from '@/theme/theme';
import { SplashScreen } from '@components';
import { APP_NAME } from '@constants';
import { AntDesign } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

type AntDesignIconName = ComponentProps<typeof AntDesign>['name'];
type TabScreenConfig = { name: string; title: string; icon: AntDesignIconName; role?: UserRole };

const tabScreensConfigs: TabScreenConfig[] = [
  { name: 'home', title: 'Home', icon: 'home' },
  { name: 'create-ride', title: 'Create Ride', icon: 'car' },
  { name: 'hr', title: 'HR', icon: 'user', role: UserRole.HR_MANAGER },
  { name: 'map', title: 'Map', icon: 'compass' },
];

const tabBarBackground = () => (
  <View style={styles.tabBarBackground}>
    <View style={styles.divider} />
  </View>
);

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const { isUserLoading, user } = useAuth();

  if (isUserLoading) return <SplashScreen />;

  if (!user) return <Redirect href={'/(auth)/login'} />;

  if (user.isTempPassword) return <Redirect href={'/(auth)/change-password'} />;

  return (
    <WebAppCard>
      <Tabs
        initialRouteName='home'
        screenOptions={{
          title: APP_NAME,
          tabBarActiveTintColor: ThemeColors[colorScheme].tint,
          headerShown: false,
          tabBarButton: HapticTab,
          animation: 'shift',
          tabBarBackground,
        }}
      >
        {tabScreensConfigs.map(({ icon, name, title, role }) => (
          <Tabs.Screen
            key={name}
            name={name}
            options={{
              title,
              tabBarIcon: ({ color, size }) => <AntDesign {...{ color, size, name: icon }} />,
              href: role && user?.role !== role ? null : undefined,
            }}
          />
        ))}
      </Tabs>
    </WebAppCard>
  );
}

const styles = StyleSheet.create({
  tabBarBackground: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    height: '60%',
    backgroundColor: '#ccc',
  },
});
