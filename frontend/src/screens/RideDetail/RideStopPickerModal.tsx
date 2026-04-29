import type { FC } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { i18n } from '@/i18n';
import { colors, popupStyles } from '@/theme';

type Stop = {
  id: string;
  locationName: string;
  estimatedArrivalAt: string;
};

interface RideStopPickerModalProps {
  visible: boolean;
  mode: 'join' | 'edit';
  stops: Stop[];
  currentStopId?: string;
  onClose: () => void;
  onSelectStop: (stopId: string) => void;
}

export const RideStopPickerModal: FC<RideStopPickerModalProps> = ({
  visible,
  mode,
  stops,
  currentStopId,
  onClose,
  onSelectStop,
}) => (
  <Modal visible={visible} transparent animationType='fade' onRequestClose={onClose}>
    <View style={popupStyles.overlay}>
      <View style={popupStyles.container}>
        <Text style={popupStyles.title}>
          {mode === 'join' ? i18n.ride_detail.select_stop : i18n.ride_detail.edit_stop}
        </Text>
        <Text style={styles.subtitle}>{i18n.ride_detail.select_stop_subtitle}</Text>
        {stops.map((stop) => (
          <TouchableOpacity
            key={stop.id}
            style={[styles.option, currentStopId === stop.id && styles.optionSelected]}
            onPress={() => onSelectStop(stop.id)}
          >
            <Text style={styles.optionText}>{stop.locationName}</Text>
            <Text style={styles.optionTime}>{stop.estimatedArrivalAt}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
          <Text style={popupStyles.cancelText}>{i18n.general.cancel}</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  subtitle: {
    color: colors.textMuted,
    textAlign: 'right',
    marginBottom: 16,
    fontSize: 14,
  },
  option: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.purpleCard,
    marginBottom: 8,
  },
  optionSelected: {
    borderWidth: 2,
    borderColor: colors.yellow,
  },
  optionText: { color: colors.textPrimary, fontWeight: '600', fontSize: 15 },
  optionTime: { color: colors.textMuted, fontSize: 13 },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
});
