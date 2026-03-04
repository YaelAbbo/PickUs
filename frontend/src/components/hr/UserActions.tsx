import { i18n } from '@/i18n';
import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ActionItemProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  onPress: () => void;
  color: string;
}

const ActionItem: React.FC<ActionItemProps> = ({ icon, label, onPress, color }) => (
  <TouchableOpacity style={styles.actionButton} onPress={onPress} activeOpacity={0.7}>
    <View style={[styles.iconContainer, { backgroundColor: actionColorVariants[color] || '#F0F4F8' }]}>
      <MaterialIcons name={icon} size={28} color={color} />
    </View>
    <Text style={styles.actionLabel}>{label}</Text>
  </TouchableOpacity>
);

const actionColorVariants: Record<string, string> = {
  '#1A73E8': '#E8F0FE', // Google Blue
  '#188038': '#E6F4EA', // Google Green
  '#D93025': '#FCE8E6', // Google Red
  '#F29900': '#FEF7E0', // Google Yellow
};

interface UserActionsProps {
  onCreate?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onExport?: () => void;
}

const UserActions: React.FC<UserActionsProps> = ({ onCreate, onEdit, onDelete, onExport }) => {
  const actions = [
    {
      id: '1',
      label: i18n.hr_actions.create_user,
      icon: 'person-add' as const,
      color: '#1A73E8', // Google Blue
      onPress: () => onCreate?.(),
    },
    {
      id: '2',
      label: i18n.hr_actions.edit_user,
      icon: 'edit' as const,
      color: '#188038', // Google Green
      onPress: () => onEdit?.(),
    },
    {
      id: '3',
      label: i18n.hr_actions.delete_user,
      icon: 'delete' as const,
      color: '#D93025', // Google Red
      onPress: () => onDelete?.(),
    },
    {
      id: '4',
      label: i18n.hr_actions.export_to_excel,
      icon: 'table-chart' as const,
      color: '#F29900', // Google Yellow
      onPress: () => onExport?.(),
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
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#202124', // Google Dark Gray
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
    width: 56,
    height: 56,
    borderRadius: 28, // fully rounded like FABs
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#3C4043',
    textAlign: 'center',
  },
});

export default UserActions;
