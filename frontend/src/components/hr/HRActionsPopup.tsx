import { UserRole } from '@/api/user.api';
import { i18n } from '@/i18n';
import { colors } from '@theme';
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
              placeholderTextColor={colors.textLight}
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
              placeholderTextColor={colors.textLight}
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
                placeholderTextColor={colors.textLight}
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
                  <Text style={[styles.roleText, role === r && styles.roleTextActive]}>
                    {i18n.roles[r as keyof typeof i18n.roles] || r}
                  </Text>
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
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: colors.purpleDark,
    borderRadius: 28,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.3,
    shadowRadius: 48,
    elevation: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 24,
    textAlign: 'right',
    color: colors.textPrimary,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textLight,
    marginBottom: 6,
    textAlign: 'right',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    textAlign: 'right',
    backgroundColor: colors.inputBg,
    color: colors.textPrimary,
  },
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    color: colors.error,
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
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.inputBg,
  },
  roleButtonActive: {
    borderColor: colors.yellow,
    backgroundColor: 'rgba(245, 200, 66, 0.15)',
  },
  roleText: {
    fontSize: 14,
    color: colors.textLight,
    fontWeight: '500',
  },
  roleTextActive: {
    color: colors.yellow,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 32,
    gap: 12,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 100,
  },
  cancelBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  submitBtn: {
    backgroundColor: colors.yellow,
  },
  cancelText: {
    color: colors.textLight,
    fontWeight: '600',
    fontSize: 14,
  },
  submitText: {
    color: colors.textDark,
    fontWeight: '700',
    fontSize: 14,
  },
});

export default HRActionsPopup;
