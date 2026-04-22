import { User, UserRole } from '@/api/user';
import { i18n } from '@/i18n';
import { zodResolver } from '@hookform/resolvers/zod';
import { colors, popupStyles } from '@theme';
import React, { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as z from 'zod';
import { hrFormSchema, type HRFormData } from './hr.schema';

export type PopupMode = 'create' | 'update' | null;

interface HRActionsPopupProps {
  visible: boolean;
  mode: PopupMode;
  initialData?: User | null;
  onClose: () => void;
  onSubmit: (data: HRFormData) => void;
}

const HRActionsPopup: React.FC<HRActionsPopupProps> = ({ visible, mode, initialData, onClose, onSubmit }) => {
  const currentSchema =
    mode === 'create'
      ? hrFormSchema.extend({
          nationalId: z
            .string()
            .min(1, { message: i18n.hr_popup.validation_required })
            .regex(/^\d{9}$/, { message: i18n.hr_popup.validation_national_id_length }),
        })
      : hrFormSchema;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<HRFormData>({
    resolver: zodResolver(currentSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      nationalId: '',
      role: UserRole.BASIC_USER,
    },
  });

  useEffect(() => {
    if (visible) {
      if (mode === 'update' && initialData) {
        reset({
          firstName: initialData.firstName || '',
          lastName: initialData.lastName || '',
          email: initialData.email || '',
          role: initialData.role || UserRole.BASIC_USER,
          nationalId: '',
        });
      } else {
        reset({
          firstName: '',
          lastName: '',
          email: '',
          nationalId: '',
          role: UserRole.BASIC_USER,
        });
      }
    }
  }, [visible, mode, initialData, reset]);

  if (!visible) return null;

  const onFormSubmit = (data: HRFormData) => {
    onSubmit(data);
    onClose();
  };

  const title = mode === 'create' ? i18n.hr_popup.create_title : i18n.hr_popup.update_title;
  const submitText = mode === 'create' ? i18n.hr_popup.create : i18n.hr_popup.save;

  return (
    <Modal visible={visible} transparent animationType='fade' onRequestClose={onClose}>
      <View style={popupStyles.overlay}>
        <View style={popupStyles.container}>
          <Text style={popupStyles.title}>{title}</Text>

          <View style={popupStyles.inputGroup}>
            <Text style={popupStyles.label}>{i18n.hr_popup.first_name}</Text>
            <Controller
              control={control}
              name='firstName'
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={[popupStyles.input, errors.firstName && popupStyles.inputError]}
                  value={value}
                  placeholderTextColor={colors.textLight}
                  onChangeText={onChange}
                />
              )}
            />
            {errors.firstName && <Text style={popupStyles.errorText}>{errors.firstName.message}</Text>}
          </View>

          <View style={popupStyles.inputGroup}>
            <Text style={popupStyles.label}>{i18n.hr_popup.last_name}</Text>
            <Controller
              control={control}
              name='lastName'
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={[popupStyles.input, errors.lastName && popupStyles.inputError]}
                  value={value}
                  placeholderTextColor={colors.textLight}
                  onChangeText={onChange}
                />
              )}
            />
            {errors.lastName && <Text style={popupStyles.errorText}>{errors.lastName.message}</Text>}
          </View>

          <View style={popupStyles.inputGroup}>
            <Text style={popupStyles.label}>{i18n.hr_popup.email}</Text>
            <Controller
              control={control}
              name='email'
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={[popupStyles.input, errors.email && popupStyles.inputError]}
                  value={value}
                  placeholderTextColor={colors.textLight}
                  onChangeText={onChange}
                  keyboardType='email-address'
                  autoCapitalize='none'
                />
              )}
            />
            {errors.email && <Text style={popupStyles.errorText}>{errors.email.message}</Text>}
          </View>

          {mode === 'create' && (
            <View style={popupStyles.inputGroup}>
              <Text style={popupStyles.label}>{i18n.hr_popup.national_id}</Text>
              <Controller
                control={control}
                name='nationalId'
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={[popupStyles.input, errors.nationalId && popupStyles.inputError]}
                    value={value}
                    placeholderTextColor={colors.textLight}
                    onChangeText={onChange}
                    keyboardType='number-pad'
                  />
                )}
              />
              {errors.nationalId && <Text style={popupStyles.errorText}>{errors.nationalId.message}</Text>}
            </View>
          )}

          <View style={popupStyles.inputGroup}>
            <Text style={popupStyles.label}>{i18n.hr_popup.role}</Text>
            <Controller
              control={control}
              name='role'
              render={({ field: { onChange, value } }) => (
                <View style={styles.roleContainer}>
                  {Object.values(UserRole).map((r) => (
                    <TouchableOpacity
                      key={r}
                      style={[styles.roleButton, value === r && styles.roleButtonActive]}
                      onPress={() => onChange(r)}
                    >
                      <Text style={[styles.roleText, value === r && styles.roleTextActive]}>
                        {i18n.roles[r as keyof typeof i18n.roles] || r}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            />
          </View>

          <View style={popupStyles.actions}>
            <TouchableOpacity style={[popupStyles.button, popupStyles.cancelBtn]} onPress={onClose}>
              <Text style={popupStyles.cancelText}>{i18n.hr_popup.cancel}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[popupStyles.button, popupStyles.submitBtn]} onPress={handleSubmit(onFormSubmit)}>
              <Text style={popupStyles.submitText}>{submitText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = {
  roleContainer: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-start',
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
} as const;

export default HRActionsPopup;
