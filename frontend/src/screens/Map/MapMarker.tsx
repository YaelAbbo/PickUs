import { RideEntityType, type RideEntityLocationPayloadWithDetails } from '@/services/ride/rideService';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '@theme';
import type { FC } from 'react';
import { StyleSheet, View } from 'react-native';
import { Marker } from 'react-native-maps';
import { StopMarker } from './StopMarker';

export type MapMarkerProps = RideEntityLocationPayloadWithDetails & { totalStops?: number };

export const MapMarker: FC<MapMarkerProps> = ({ type, location: { coordinates }, name, totalStops }) => {
  if (type === RideEntityType.STOP)
    return <StopMarker coordinates={coordinates} title={name} totalStops={totalStops} />;

  const [longitude, latitude] = coordinates;

  return (
    <Marker
      coordinate={{ latitude, longitude }}
      title={name}
      tracksViewChanges={false}
      anchor={{ x: 0.5, y: 1 }}
      zIndex={100}
    >
      {type === RideEntityType.DRIVER ? (
        <View style={styles.driverMarkerContainer}>
          <View style={styles.driverCircle}>
            <MaterialIcons name='directions-car' size={18} color='#fff' />
          </View>
          <View style={styles.driverPinTip} />
        </View>
      ) : (
        <View style={styles.passengerMarkerContainer}>
          <View style={styles.passengerCircle}>
            <MaterialIcons name='person' size={16} color={colors.purple} />
          </View>
          <View style={styles.passengerPinTip} />
        </View>
      )}
    </Marker>
  );
};

const styles = StyleSheet.create({
  driverMarkerContainer: {
    alignItems: 'center',
  },
  driverCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.purple,
    borderWidth: 2,
    borderColor: colors.yellow,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  driverPinTip: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.purple,
    alignSelf: 'center',
    marginTop: -1.5,
  },
  passengerMarkerContainer: {
    alignItems: 'center',
  },
  passengerCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.yellow,
    borderWidth: 2,
    borderColor: colors.purple,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  passengerPinTip: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.yellow,
    alignSelf: 'center',
    marginTop: -1.5,
  },
});
