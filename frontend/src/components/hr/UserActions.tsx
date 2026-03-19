import { i18n } from '@/i18n';
import { colors } from '@theme';
import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ActionItemProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  onPress: () => void;
  color: string;
  disabled?: boolean;
}

const ActionItem: React.FC<ActionItemProps> = ({ icon, label, onPress, color, disabled }) => (
  <TouchableOpacity
    style={[styles.actionButton, disabled && { opacity: 0.4 }]}
    onPress={onPress}
    activeOpacity={0.7}
    disabled={disabled}
  >
    <View style={[styles.iconContainer, { backgroundColor: colors.inputBg }]}>
      <MaterialIcons name={icon} size={28} color={disabled ? colors.textMuted : color} />
    </View>
    <Text style={[styles.actionLabel, disabled && { color: colors.textMuted }]}>{label}</Text>
  </TouchableOpacity>
);

interface UserActionsProps {
  onCreate?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onExport?: () => void;
  hasUsers?: boolean;
}

const UserActions: React.FC<UserActionsProps> = ({ onCreate, onEdit, onDelete, onExport, hasUsers = false }) => {
  const actions = [
    {
      id: '1',
      label: i18n.hr_actions.create_user,
      icon: 'person-add' as const,
      color: colors.yellow,
      onPress: () => onCreate?.(),
      disabled: false,
    },
    {
      id: '2',
      label: i18n.hr_actions.edit_user,
      icon: 'edit' as const,
      color: colors.white,
      onPress: () => onEdit?.(),
      disabled: !hasUsers,
    },
    {
      id: '3',
      label: i18n.hr_actions.delete_user,
      icon: 'delete' as const,
      color: colors.error,
      onPress: () => onDelete?.(),
      disabled: !hasUsers,
    },
    {
      id: '4',
      label: i18n.hr_actions.export_to_excel,
      icon: 'table-chart' as const,
      color: colors.yellowLight,
      onPress: () => onExport?.(),
      disabled: !hasUsers,
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>{i18n.hr_actions.title}</Text>
        <View style={styles.actionsGrid}>
          {actions.map((action) => (
            <ActionItem
              key={action.id}
              icon={action.icon}
              label={action.label}
              onPress={action.onPress}
              color={action.color}
              disabled={action.disabled}
            />
          ))}
        </View>
      </View>
    </View>
  );
};

const { width } = Dimensions.get('window');
const cardWidth = width - 32;

const styles = StyleSheet.create({
  container: {
    padding: 12,
    width: '100%',
  },
  card: {
    backgroundColor: colors.purpleCard,
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 20,
    textAlign: 'right',
  },
  actionsGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: (cardWidth - 64) / 4,
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textLight,
    textAlign: 'center',
  },
});

export default UserActions;
