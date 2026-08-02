import { UserRole } from '@/api/user';
import { HapticTab } from '@/components/haptic-tab';
import { WebAppCard } from '@/components/WebAppCard';
import { UserLocationProvider } from '@/contexts';
import { useDriverMessageNotifications } from '@/hooks/notifications/useDriverMessageNotifications';
import { useDriverNearStopNotifications } from '@/hooks/notifications/useDriverNearStopNotifications';
import { useLiveRideUpdates } from '@/hooks/liveUpdates/useLiveRideUpdates';
import { useLiveUserUpdates } from '@/hooks/liveUpdates/useLiveUserUpdates';
import { useRideStartedNotifications } from '@/hooks/notifications/useRideStartedNotifications';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { i18n } from '@/i18n';
import { useAuth } from '@/services/auth/AuthContext';
import { ThemeColors } from '@/theme/theme';
import { SplashScreen } from '@components';
import { APP_NAME, IS_WEB } from '@constants';
import { AntDesign } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { StyleSheet } from 'react-native';

type AntDesignIconName = ComponentProps<typeof AntDesign>['name'];
type TabScreenConfig = {
  name: string;
  title: string;
  icon: AntDesignIconName;
  role?: UserRole;
  hideFromTabBar?: boolean;
};

const tabScreensConfigs: TabScreenConfig[] = [
  { name: 'profile', title: i18n.screens.profile, icon: 'user' },
  { name: 'home', title: i18n.screens.home, icon: 'home' },
  { name: 'create-ride', title: i18n.rideForm.create_ride, icon: 'car' },
  { name: 'map', title: i18n.screens.map, icon: 'compass', hideFromTabBar: true },
  { name: 'notifications', title: i18n.screens.notifications, icon: 'bell' },
  { name: 'hr', title: i18n.screens.hr, icon: 'team', role: UserRole.HR_MANAGER },
];

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const { isUserLoading, user } = useAuth();

  useDriverNearStopNotifications();
  useRideStartedNotifications();
  useDriverMessageNotifications();
  useLiveRideUpdates();
  useLiveUserUpdates();

  if (isUserLoading) return <SplashScreen />;

  if (!user) return <Redirect href={'/(auth)/login'} />;

  if (user.isTempPassword) return <Redirect href={'/(auth)/change-password'} />;

  return (
    <UserLocationProvider>
      <WebAppCard>
        <Tabs
          initialRouteName='home'
          screenOptions={{
            title: APP_NAME,
            tabBarActiveTintColor: ThemeColors[colorScheme].tint,
            headerShown: false,
            tabBarButton: HapticTab,
            animation: 'shift',
            tabBarItemStyle: styles.tabBarItem,
          }}
        >
          {tabScreensConfigs.map(({ icon, name, title, role, hideFromTabBar = role && user.role !== role }) => (
            <Tabs.Screen
              key={name}
              name={name}
              options={{
                title,
                tabBarIcon: ({ color, size }) => <AntDesign {...{ color, size, name: icon }} />,
                href: hideFromTabBar ? null : undefined,
              }}
            />
          ))}
        </Tabs>
      </WebAppCard>
    </UserLocationProvider>
  );
}

const styles = StyleSheet.create({
  tabBarItem: {
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: '#ccc',
    height: IS_WEB ? '100%' : '90%',
    alignSelf: 'center',
  },
});
