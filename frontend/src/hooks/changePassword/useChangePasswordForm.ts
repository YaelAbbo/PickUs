import { useUpdateUser } from '@/api/user.api';
import { i18n } from '@/i18n';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@services';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const schema = z
  .object({
    newPassword: z.string().min(8, i18n.change_password.validation_password_length),
    confirmPassword: z.string().nonempty(i18n.change_password.validation_required),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: i18n.change_password.passwords_do_not_match,
    path: ['confirmPassword'],
  });

export type ChangePasswordFormValues = z.infer<typeof schema>;

export type UseChangePasswordFormArgs = {
  onSuccess: VoidFunction;
  startShake: VoidFunction;
};

export type UseChangePasswordFormContent = ReturnType<typeof useChangePasswordForm>;

export const useChangePasswordForm = ({ onSuccess, startShake }: UseChangePasswordFormArgs) => {
  const { user, refreshUser } = useAuth();
  const { mutateAsync: updateUser } = useUpdateUser();

  const {
    handleSubmit,
    setError,
    formState: { isSubmitting, errors },
    control,
    watch,
    clearErrors,
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { newPassword: '', confirmPassword: '' },
    mode: 'onTouched',
  });

  useEffect(() => {
    const subscription = watch(() => clearErrors('root'));

    return () => subscription.unsubscribe();
  }, [watch, clearErrors]);

  const onSubmit = handleSubmit(
    ({ newPassword }) =>
      updateUser(
        { id: user!.id, password: newPassword },
        {
          onSuccess: async () => {
            await refreshUser();
            onSuccess();
          },
          onError: () => {
            setError('root', { message: i18n.change_password.change_password_error });

            startShake();
          },
        },
      ).catch(() => {}),
    startShake,
  );

  return { control, onSubmit, isSubmitting, errors };
};
