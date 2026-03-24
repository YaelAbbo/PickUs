import React, { useState } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { IconButton, Chip, Card } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuth } from '@services';
import { useAvailableRides } from '@/services/ride/rideQueries';
import { AppTextInput } from '@/components/ui';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { colors } from '@/theme';
import type { Ride } from '@/services/ride/rideService';

const FILTERS = ['הכל', 'מועדפים', 'הלוך', 'חזור'];

export default function HomeScreen() {
  const router = useRouter();

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
    category: activeFilter === 'הכל' ? undefined : activeFilter,
  });

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
            backgroundColor: isActive ? colors.yellow : colors.transparent,
            borderColor: isActive ? colors.transparent : colors.purple,
          },
        ]}
        textStyle={{
          color: isActive ? colors.textDark : colors.purple,
          fontWeight: isActive ? 'bold' : 'normal',
        }}
        mode={isActive ? 'flat' : 'outlined'}
      >
        {item}
      </Chip>
    );
  };

  const renderRideCard = ({ item }: { item: Ride }) => (
    <Card style={styles.card} onPress={() => handleRidePress(item.id)}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <ThemedText type='defaultSemiBold' style={{ color: colors.purpleDark }}>
            {item.date}
          </ThemedText>
          <View style={styles.seatsContainer}>
            {Array.from({ length: item.availableSeats }).map((_, i) => (
              <IconButton
                key={i}
                icon='seat-passenger'
                size={16}
                iconColor={colors.yellowDark}
                style={styles.seatIcon}
              />
            ))}
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.routeContainer}>
            <ThemedText style={{ color: colors.textDark }}>{item.startDest}</ThemedText>
            <IconButton icon='arrow-left' size={16} iconColor={colors.purple} />
            <ThemedText style={{ color: colors.textDark }}>{item.endDest}</ThemedText>
          </View>

          <ThemedText style={{ color: colors.textMuted }}>
            {item.startTime} - {item.endTime}
          </ThemedText>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText type='title' style={[styles.greeting, { color: colors.purpleDark }]}>
          שלום, {user?.firstName || 'אורח'}! 👋
        </ThemedText>
        <View style={styles.headerActions}>
          <IconButton
            icon='bell-outline'
            size={28}
            iconColor={colors.purple}
            onPress={() => console.log('Notifications pressed')}
          />
          <IconButton icon='logout' size={24} iconColor={colors.error} onPress={() => logout()} />
        </View>
      </View>

      <View style={styles.searchContainer}>
        <AppTextInput
          placeholder='🔍 חיפוש נסיעות...'
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={{ borderColor: colors.inputBorder, backgroundColor: colors.white }}
        />
      </View>

      <View style={styles.filtersContainer}>
        <FlatList
          data={FILTERS}
          renderItem={renderFilter}
          keyExtractor={(item) => item}
          horizontal
          showsHorizontalScrollIndicator={false}
          inverted
        />
      </View>

      {isLoading ? (
        <ActivityIndicator size='large' color={colors.yellow} style={styles.loader} />
      ) : isError ? (
        <ThemedText style={[styles.errorText, { color: colors.error }]}>שגיאה בטעינת נסיעות. אנא נסה שוב.</ThemedText>
      ) : rides?.length === 0 ? (
        <ThemedText style={[styles.emptyText, { color: colors.textDark }]}>
          לא נמצאו נסיעות התואמות את החיפוש.
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
    paddingTop: 48,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greeting: {
    fontWeight: 'bold',
  },
  searchContainer: {
    marginBottom: 16,
  },
  filtersContainer: {
    marginBottom: 16,
  },
  filterChip: {
    marginRight: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  listContent: {
    paddingBottom: 24,
  },
  card: {
    marginBottom: 12,
    elevation: 2,
    backgroundColor: colors.white,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  seatsContainer: {
    flexDirection: 'row',
  },
  seatIcon: {
    margin: 0,
    padding: 0,
    width: 24,
    height: 24,
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
