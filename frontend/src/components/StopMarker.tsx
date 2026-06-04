import type { Coordinates } from '@types';
import type { FC } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Marker } from 'react-native-maps';
import { MaterialIcons } from '@expo/vector-icons';
import { i18n } from '@/i18n';
import { colors } from '@theme';

export type StopMarkerProps = {
  coordinates: Coordinates;
  title: string;
  totalStops?: number;
};

const getStopNumber = (title?: string): string => {
  if (!title) return '?';
  const regex = new RegExp(`${i18n.rideForm.ride_stop} (\\d+)`);
  const match = title.match(regex);
  return (match && match[1]) || '?';
};

export const StopMarker: FC<StopMarkerProps> = ({ coordinates: [longitude, latitude], title, totalStops }) => {
  const stopNumber = getStopNumber(title);

  // 1. The first stop is the car (no need for another icon)
  if (stopNumber === '1') {
    return null;
  }

  // 2. The last stop: have another icon representing it's the end
  const isLast = totalStops && stopNumber === String(totalStops);
  if (isLast) {
    return (
      <Marker coordinate={{ latitude, longitude }} title={title} anchor={{ x: 0.5, y: 0.5 }} zIndex={100}>
        <View style={styles.endMarkerContainer}>
          <MaterialIcons name='flag' size={14} color={colors.purple} />
        </View>
      </Marker>
    );
  }

  // 3. Middle stops: location-like icon with the number
  return (
    <Marker coordinate={{ latitude, longitude }} title={title} anchor={{ x: 0.5, y: 1 }} zIndex={100}>
      <View style={styles.middleMarkerContainer}>
        <View style={styles.pinCircle}>
          <Text style={styles.stopMarkerText}>{stopNumber}</Text>
        </View>
        <View style={styles.pinTip} />
      </View>
    </Marker>
  );
};

const styles = StyleSheet.create({
  endMarkerContainer: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.yellow,
    borderWidth: 1.5,
    borderColor: colors.purple,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  middleMarkerContainer: {
    alignItems: 'center',
  },
  pinCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.purple,
    borderWidth: 1.5,
    borderColor: colors.yellow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinTip: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.purple,
    alignSelf: 'center',
    marginTop: -1.5,
  },
  stopMarkerText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});
