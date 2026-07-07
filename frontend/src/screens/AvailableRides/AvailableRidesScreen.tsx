import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { FC } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AppBackground, AppTextInput } from '@/components/ui';
import { i18n } from '@/i18n';
import { colors, spacing } from '@/theme';

import { FILTERS, useAvailableRidesLogic } from '../../hooks/rides/useAvailableRidesLogic';
import { RideCard } from './RideCard';

export const AvailableRidesScreen: FC = () => {
  const {
    user,
    logout,
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    rides,
    isLoading,
    isError,
    refetch,
    handleRidePress,
  } = useAvailableRidesLogic();

  return (
    <AppBackground>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.greeting}>
            {i18n.available_rides_screen.greeting} {user?.firstName || i18n.available_rides_screen.default_guest_name}
          </Text>
          <TouchableOpacity onPress={() => logout()} style={styles.logoutBtn}>
            <MaterialCommunityIcons name='logout' size={22} color={colors.error} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <AppTextInput
            placeholder={i18n.available_rides_screen.rides_search_placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
            rightIconName='search'
          />
        </View>

        <View style={styles.filtersContainer}>
          <View style={styles.filtersRow}>
            {FILTERS.map((filter) => {
              const isActive = activeFilter === filter;
              return (
                <TouchableOpacity
                  key={filter}
                  onPress={() => setActiveFilter(filter)}
                  style={[styles.filterChip, isActive && styles.filterChipActive]}
                >
                  <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>{filter}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <FlatList
          data={rides}
          renderItem={({ item }) => <RideCard item={item} onPress={() => handleRidePress(item.id)} />}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: spacing.xxl }}
          showsVerticalScrollIndicator={false}
          refreshing={isLoading}
          onRefresh={refetch}
          ListEmptyComponent={
            isLoading ? (
              <ActivityIndicator size='large' color={colors.yellow} style={{ marginTop: 50 }} />
            ) : isError ? (
              <Text style={styles.centerText}>{i18n.available_rides_screen.error_loading_rides}</Text>
            ) : rides?.length === 0 ? (
              <Text style={styles.centerText}>{i18n.available_rides_screen.no_rides_found_for_search}</Text>
            ) : null
          }
        />
      </View>
    </AppBackground>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacing.md, paddingTop: spacing.xl },
  header: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  greeting: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.yellow,
    textAlign: 'right',
    flex: 1,
    paddingBottom: spacing.md,
  },
  logoutBtn: { padding: 8, paddingBottom: spacing.md },
  searchContainer: { marginBottom: spacing.sm },
  filtersContainer: { marginBottom: spacing.md },
  filtersRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', paddingRight: 4 },
  filterChip: {
    marginLeft: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.inputBg,
    paddingHorizontal: 16,
    paddingVertical: 3,
    height: 32,
  },
  filterChipActive: { backgroundColor: colors.yellow, borderColor: colors.yellow },
  filterChipText: { color: colors.textMuted, fontWeight: '500', fontSize: 14 },
  filterChipTextActive: { color: colors.textDark, fontWeight: '700', fontSize: 16 },
  centerText: { textAlign: 'center', color: colors.textMuted, marginTop: 50, fontSize: 16 },
});
