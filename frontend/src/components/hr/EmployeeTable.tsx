import { User } from '@/api/user';
import { i18n } from '@/i18n';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '@theme';
import React from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export const TableHeader: React.FC = () => (
  <View style={styles.tableHeader}>
    <Text style={[styles.headerCell, { width: 100 }]}>{i18n.hr_table.first_name || 'First Name'}</Text>
    <Text style={[styles.headerCell, { width: 100 }]}>{i18n.hr_table.last_name || 'Last Name'}</Text>
    <Text style={[styles.headerCell, { width: 180 }]}>{i18n.hr_table.email || 'Email'}</Text>
    <Text style={[styles.headerCell, { width: 120 }]}>{i18n.hr_table.role || 'Role'}</Text>
    <Text style={[styles.headerCell, { width: 150 }]}>{i18n.hr_table.org_id || 'Organization ID'}</Text>
    <Text style={[styles.headerCell, { width: 150 }]}>{i18n.hr_table.created_at || 'Created At'}</Text>
  </View>
);

const UserRow: React.FC<{ item: User; onPress?: () => void; isActionMode?: boolean }> = ({
  item,
  onPress,
  isActionMode,
}) => (
  <TouchableOpacity
    style={styles.tableRow}
    onPress={onPress}
    disabled={!onPress}
    activeOpacity={isActionMode ? 0.5 : 1}
  >
    <Text style={[styles.cell, { width: 100, fontWeight: '600', color: colors.textPrimary }]} numberOfLines={1}>{item.firstName}</Text>
    <Text style={[styles.cell, { width: 100, color: colors.textLight }]} numberOfLines={1}>{item.lastName}</Text>
    <Text style={[styles.cell, { width: 180, color: colors.textLight }]} numberOfLines={1}>{item.email}</Text>
    <Text style={[styles.cell, { width: 120, color: colors.textLight }]}>
      {i18n.roles[item.role as keyof typeof i18n.roles] || item.role}
    </Text>
    <Text style={[styles.cell, { width: 150, color: colors.textMuted }]} numberOfLines={1}>
      {item.organization?.name || item.orgId}
    </Text>
    <Text style={[styles.cell, { width: 150, color: colors.textMuted }]}>{new Date(item.createdAt).toLocaleDateString()}</Text>
  </TouchableOpacity>
);

interface UserTableProps {
  users: User[];
  onSearch: (text: string) => void;
  actionMode?: 'idle' | 'edit' | 'delete';
  onUserTap?: (user: User) => void;
}

const EmployeeTable: React.FC<UserTableProps> = ({ users, onSearch, actionMode = 'idle', onUserTap }) => {
  const [localSearch, setLocalSearch] = React.useState('');

  const handleSubmit = () => {
    onSearch(localSearch);
  };

  const handleClear = () => {
    setLocalSearch('');
    onSearch('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{i18n.hr_table.title}</Text>

      <View style={styles.searchContainer}>
        <TouchableOpacity onPress={handleSubmit}>
          <MaterialIcons name='search' size={24} color={colors.textLight} />
        </TouchableOpacity>
        <TextInput
          style={styles.searchInput}
          placeholder={i18n.hr_table.search_placeholder}
          placeholderTextColor={colors.textMuted}
          value={localSearch}
          onChangeText={setLocalSearch}
          returnKeyType='search'
          onSubmitEditing={handleSubmit}
        />
        {localSearch.length > 0 && (
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <MaterialIcons name='close' size={20} color={colors.textLight} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView 
        horizontal 
        persistentScrollbar 
        contentContainerStyle={{ justifyContent: 'center', minWidth: '100%' }}
      >
        <View style={{ alignItems: 'center' }}>
          <TableHeader />
          {users.map((user) => (
            <UserRow
              key={user.id}
              item={user}
              onPress={actionMode !== 'idle' ? () => onUserTap?.(user) : undefined}
              isActionMode={actionMode !== 'idle'}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: colors.purpleCard,
    borderRadius: 24,
    marginHorizontal: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 20,
    textAlign: 'center',
    width: '100%',
  },
  searchContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: colors.inputBg,
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 24,
    height: 48,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  searchInput: {
    flex: 1,
    textAlign: 'right',
    fontSize: 16,
    color: colors.textPrimary,
    marginRight: 12,
  },
  tableHeader: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.inputBorder,
    flexDirection: 'row',
  },
  headerCell: {
    paddingHorizontal: 12,
    fontSize: 13,
    fontWeight: '700',
    color: colors.yellow,
    textAlign: 'center',
  },
  tableRow: {
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    flexDirection: 'row',
  },
  cell: {
    paddingHorizontal: 12,
    fontSize: 14,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
});

export default EmployeeTable;
