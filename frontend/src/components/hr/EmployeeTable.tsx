import { User } from '@/api/user.api';
import { i18n } from '@/i18n';
import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View, TouchableOpacity } from 'react-native';

export const TableHeader: React.FC = () => (
  <View style={styles.tableHeader}>
    <Text style={[styles.headerCell, { width: 100 }]}>{i18n.hr_table.first_name || 'First Name'}</Text>
    <Text style={[styles.headerCell, { width: 100 }]}>{i18n.hr_table.last_name || 'Last Name'}</Text>
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
    <Text style={[styles.cell, { width: 100, fontWeight: '500', color: '#202124' }]}>{item.firstName}</Text>
    <Text style={[styles.cell, { width: 100, color: '#3C4043' }]}>{item.lastName}</Text>
    <Text style={[styles.cell, { width: 120, color: '#5F6368' }]}>{item.role}</Text>
    <Text style={[styles.cell, { width: 150, color: '#5F6368' }]}>{item.organizationId}</Text>
    <Text style={[styles.cell, { width: 150, color: '#5F6368' }]}>{new Date(item.createdAt).toLocaleDateString()}</Text>
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
    // Only search if empty (reset) or length >= 3
    if (localSearch.length === 0 || localSearch.length >= 3) {
      onSearch(localSearch);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{i18n.hr_table.title}</Text>

      <View style={styles.searchContainer}>
        <MaterialIcons name='search' size={24} color='#5F6368' />
        <TextInput
          style={styles.searchInput}
          placeholder={i18n.hr_table.search_placeholder}
          placeholderTextColor='#5F6368'
          value={localSearch}
          onChangeText={setLocalSearch}
          returnKeyType='search'
          onSubmitEditing={handleSubmit}
        />
      </View>

      <ScrollView horizontal persistentScrollbar>
        <View>
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
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginHorizontal: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: '500',
    color: '#202124',
    marginBottom: 20,
    textAlign: 'right',
  },
  searchContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#F1F3F4',
    borderRadius: 28,
    paddingHorizontal: 16,
    marginBottom: 24,
    height: 56,
  },
  searchInput: {
    flex: 1,
    textAlign: 'right',
    fontSize: 16,
    color: '#202124',
    marginRight: 12,
  },
  tableHeader: {
    flexDirection: 'row-reverse',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerCell: {
    paddingHorizontal: 12,
    fontSize: 13,
    fontWeight: '600',
    color: '#5F6368',
    textAlign: 'right',
  },
  tableRow: {
    flexDirection: 'row-reverse',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    alignItems: 'center',
  },
  cell: {
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#3C4043',
    textAlign: 'right',
  },
});

export default EmployeeTable;
