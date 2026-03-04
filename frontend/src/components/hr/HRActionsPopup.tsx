import { UserRole } from '@/api/user.api';
import { i18n } from '@/i18n';
import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export type PopupMode = 'create' | 'update' | null;

interface HRActionsPopupProps {
  visible: boolean;
  mode: PopupMode;
  initialData?: any;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

const HRActionsPopup: React.FC<HRActionsPopupProps> = ({ visible, mode, initialData, onClose, onSubmit }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.BASIC_USER);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (visible && mode === 'update' && initialData) {
      setFirstName(initialData.firstName || '');
      setLastName(initialData.lastName || '');
      setRole(initialData.role || UserRole.BASIC_USER);
    } else if (visible && mode === 'create') {
      setFirstName('');
      setLastName('');
      setNationalId('');
      setRole(UserRole.BASIC_USER);
    }
    setErrors({});
  }, [visible, mode, initialData]);

  if (!visible) return null;

  const handleSubmit = () => {
    let newErrors: { [key: string]: string } = {};

    if (!firstName.trim()) newErrors.firstName = i18n.hr_popup.validation_required;
    else if (firstName.length > 20) newErrors.firstName = i18n.hr_popup.validation_name_length;

    if (!lastName.trim()) newErrors.lastName = i18n.hr_popup.validation_required;
    else if (lastName.length > 20) newErrors.lastName = i18n.hr_popup.validation_name_length;

    if (mode === 'create') {
      if (!nationalId.trim()) newErrors.nationalId = i18n.hr_popup.validation_required;
      else if (nationalId.length !== 9 || !/^\d+$/.test(nationalId))
        newErrors.nationalId = i18n.hr_popup.validation_national_id_length;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (mode === 'create') {
      onSubmit({ firstName, lastName, nationalId, role });
    } else {
      onSubmit({ firstName, lastName, role });
    }
    onClose();
  };

  const title = mode === 'create' ? i18n.hr_popup.create_title : i18n.hr_popup.update_title;
  const submitText = mode === 'create' ? i18n.hr_popup.create : i18n.hr_popup.save;

  return (
    <Modal visible={visible} transparent animationType='fade' onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>{title}</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{i18n.hr_popup.first_name}</Text>
            <TextInput
              style={[styles.input, errors.firstName && styles.inputError]}
              value={firstName}
              onChangeText={(text) => {
                setFirstName(text);
                setErrors((prev) => ({ ...prev, firstName: '' }));
              }}
            />
            {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{i18n.hr_popup.last_name}</Text>
            <TextInput
              style={[styles.input, errors.lastName && styles.inputError]}
              value={lastName}
              onChangeText={(text) => {
                setLastName(text);
                setErrors((prev) => ({ ...prev, lastName: '' }));
              }}
            />
            {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}
          </View>

          {mode === 'create' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{i18n.hr_popup.national_id}</Text>
              <TextInput
                style={[styles.input, errors.nationalId && styles.inputError]}
                value={nationalId}
                onChangeText={(text) => {
                  setNationalId(text);
                  setErrors((prev) => ({ ...prev, nationalId: '' }));
                }}
                keyboardType='number-pad'
              />
              {errors.nationalId && <Text style={styles.errorText}>{errors.nationalId}</Text>}
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{i18n.hr_popup.role}</Text>
            <View style={styles.roleContainer}>
              {Object.values(UserRole).map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.roleButton, role === r && styles.roleButtonActive]}
                  onPress={() => setRole(r)}
                >
                  <Text style={[styles.roleText, role === r && styles.roleTextActive]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={[styles.button, styles.cancelBtn]} onPress={onClose}>
              <Text style={styles.cancelText}>{i18n.hr_popup.cancel}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.submitBtn]} onPress={handleSubmit}>
              <Text style={styles.submitText}>{submitText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '400',
    marginBottom: 24,
    textAlign: 'right',
    color: '#1F1F1F',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: '#444746',
    marginBottom: 4,
    textAlign: 'right',
  },
  input: {
    borderWidth: 1,
    borderColor: '#747775',
    borderRadius: 4,
    padding: 14,
    fontSize: 16,
    textAlign: 'right',
    backgroundColor: '#FFFFFF',
    color: '#1F1F1F',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'right',
  },
  roleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-end',
  },
  roleButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#747775',
    backgroundColor: '#FFFFFF',
  },
  roleButtonActive: {
    borderColor: 'transparent',
    backgroundColor: '#D3E3FD', // M3 Secondary Container (Google Blue tinted)
  },
  roleText: {
    fontSize: 14,
    color: '#444746',
    fontWeight: '500',
  },
  roleTextActive: {
    color: '#041E49', // M3 On-Secondary Container
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-start', // In left-to-right flex, this pushes them to the left (which is correct for RTL actions)
    marginTop: 32,
    gap: 8,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 100, // Pill shape
    alignItems: 'center',
    minWidth: 80,
  },
  cancelBtn: {
    backgroundColor: 'transparent',
  },
  submitBtn: {
    backgroundColor: '#1A73E8', // Google Blue
  },
  cancelText: {
    color: '#1A73E8',
    fontWeight: '500',
    fontSize: 14,
  },
  submitText: {
    color: '#FFF',
    fontWeight: '500',
    fontSize: 14,
  },
});

export default HRActionsPopup;
