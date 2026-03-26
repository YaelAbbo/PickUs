import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, I18nManager, StyleSheet, View } from 'react-native';
import { Card, Chip, IconButton } from 'react-native-paper';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppTextInput } from '@/components/ui';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { i18n } from '@/i18n';
import { useAvailableRides } from '@/services/ride/rideQueries';
import type { Ride } from '@/services/ride/rideService';
import { colors } from '@/theme';
import { useAuth } from '@services';

const FILTERS = [i18n.available_rides_screen.filter_all];
export const MAX_SEATS = 4;

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('הכל');

  const {
    data: rides,
    isLoading,
    isError,
    refetch,
  } = useAvailableRides({
    search: searchQuery,
    category: activeFilter === i18n.available_rides_screen.filter_all ? undefined : activeFilter,
  });

  const themeStyles = {
    background: isDark ? '#121212' : '#F7F8FA',
    cardSurface: isDark ? colors.purple : colors.yellowLight,
    textPrimary: isDark ? '#FFFFFF' : '#11181C',
    textSecondary: isDark ? '#A0A0A0' : '#687076',
    searchContainerBg: 'transparent',
    searchInputBg: isDark ? '#333333' : '#F0F0F0',
    searchPlaceholder: isDark ? '#A0A0A0' : '#888888',
    chipUnselectedBg: isDark ? '#1E1E1E' : colors.white,
    chipUnselectedBorder: isDark ? '#333333' : '#E0E0E0',
    seatInactive: isDark ? '#333333' : '#BDBDBD',
    accentDynamic: isDark ? colors.yellow : colors.purple,
  };

  const handleRidePress = (rideId: string) => {
    router.push({ pathname: '/modal', params: { rideId } });
  };

  const renderFilter = ({ item }: { item: string }) => {
    const isActive = activeFilter === item;
    return (
      <Chip
        selected={isActive}
        onPress={() => setActiveFilter(item)}
        style={[
          styles.filterChip,
          {
            backgroundColor: isActive ? colors.purple : themeStyles.chipUnselectedBg,
            borderColor: isActive ? colors.purple : themeStyles.chipUnselectedBorder,
          },
        ]}
        textStyle={{
          color: isActive ? colors.white : themeStyles.textSecondary,
          fontWeight: isActive ? 'bold' : 'normal',
        }}
        mode='flat'
      >
        {item}
      </Chip>
    );
  };

  const renderRideCard = ({ item }: { item: Ride }) => (
    <Card
      style={[
        styles.card,
        {
          backgroundColor: themeStyles.cardSurface,
          borderWidth: 1,
          borderColor: themeStyles.accentDynamic,
        },
      ]}
      onPress={() => handleRidePress(item.id)}
    >
      <Card.Content style={styles.cardContentPadding}>
        <View style={styles.cardRow}>
          <View style={styles.routeContainer}>
            <ThemedText style={{ color: themeStyles.accentDynamic, fontSize: 18, fontWeight: 'bold' }}>
              {item.startDest}
            </ThemedText>

            <IconButton icon='arrow-left' size={18} iconColor={themeStyles.accentDynamic} style={styles.routeArrow} />

            <ThemedText style={{ color: themeStyles.accentDynamic, fontSize: 18, fontWeight: 'bold' }}>
              {item.endDest}
            </ThemedText>
          </View>

          <View style={styles.seatsContainer}>
            {Array.from({ length: MAX_SEATS }).map((_, i) => {
              const isAvailable = i < item.availableSeats;
              return (
                <IconButton
                  key={i}
                  icon='account'
                  size={18}
                  iconColor={isAvailable ? themeStyles.accentDynamic : themeStyles.seatInactive}
                  style={styles.seatIcon}
                />
              );
            })}
          </View>
        </View>

        <View style={styles.cardRow}>
          <ThemedText type='defaultSemiBold' style={{ color: themeStyles.accentDynamic, fontSize: 15 }}>
            {item.date}
          </ThemedText>

          <ThemedText style={{ color: themeStyles.accentDynamic, fontSize: 14 }}>
            {item.startTime} - {item.endTime}
          </ThemedText>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <ThemedView style={[styles.container, { backgroundColor: themeStyles.background }]}>
      <View style={styles.header}>
        <ThemedText type='title' style={[styles.greeting, { color: themeStyles.accentDynamic }]}>
          {i18n.available_rides_screen.greeting} {user?.firstName || i18n.available_rides_screen.default_guest_name}
        </ThemedText>
        <View style={styles.headerActions}>
          <IconButton
            icon='bell-outline'
            size={28}
            iconColor={themeStyles.accentDynamic}
            onPress={() => console.log('Notifications pressed')}
          />
          <IconButton icon='logout' size={24} iconColor={colors.error} onPress={() => logout()} />
        </View>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: themeStyles.searchContainerBg }]}>
        <AppTextInput
          placeholder={i18n.available_rides_screen.rides_search_placeholder}
          placeholderTextColor={themeStyles.searchPlaceholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
          textColor={themeStyles.searchPlaceholder}
          style={[
            styles.searchInput,
            {
              backgroundColor: themeStyles.searchInputBg,
              color: themeStyles.searchPlaceholder,
            },
          ]}
        />
      </View>

      <View style={styles.filtersContainer}>
        <FlatList
          data={FILTERS}
          renderItem={renderFilter}
          keyExtractor={(item) => item}
          horizontal
          showsHorizontalScrollIndicator={false}
          inverted={!I18nManager.isRTL}
          contentContainerStyle={styles.filtersListContent}
        />
      </View>

      {isLoading ? (
        <ActivityIndicator size='large' color={colors.purple} style={styles.loader} />
      ) : isError ? (
        <ThemedText style={[styles.errorText, { color: colors.error }]}>
          {i18n.available_rides_screen.error_loading_rides}
        </ThemedText>
      ) : rides?.length === 0 ? (
        <ThemedText style={[styles.emptyText, { color: themeStyles.textSecondary }]}>
          {i18n.available_rides_screen.no_rides_found_for_search}
        </ThemedText>
      ) : (
        <FlatList
          data={rides}
          renderItem={renderRideCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={isLoading}
          onRefresh={refetch}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 56,
  },
  header: {
    flexDirection: 'row',
    direction: 'rtl',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
  },
  headerActions: {
    flexDirection: 'row',
    direction: 'rtl',
    alignItems: 'center',
  },
  greeting: {
    fontWeight: 'bold',
    fontSize: 32,
    paddingHorizontal: 0,
    textAlign: 'right',
  },
  searchContainer: {
    marginBottom: 0,
  },
  searchInput: {
    borderRadius: 12,
    borderWidth: 0,
    elevation: 0,
    paddingHorizontal: 16,
    height: 50,
  },
  filtersContainer: {
    marginBottom: 20,
  },
  filtersListContent: {
    paddingLeft: 4,
  },
  filterChip: {
    marginLeft: 10,
    borderRadius: 24,
    borderWidth: 1,
  },
  listContent: {
    paddingBottom: 32,
  },
  card: {
    marginBottom: 16,
    borderRadius: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardContentPadding: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  cardRow: {
    flexDirection: 'row',
    direction: 'rtl',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  routeContainer: {
    flexDirection: 'row',
    direction: 'rtl',
    alignItems: 'center',
  },
  routeArrow: {
    marginHorizontal: -4,
  },
  seatsContainer: {
    flexDirection: 'row',
    direction: 'rtl',
  },
  seatIcon: {
    margin: -4,
    padding: 0,
    width: 24,
    height: 24,
  },
  loader: {
    marginTop: 50,
  },
  errorText: {
    textAlign: 'center',
    marginTop: 50,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
  },
});
