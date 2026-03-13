import { REQUIRED } from '@constants';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@services';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const DEFAULT_ERROR = 'תעודת זהות או סיסמה שגויים';

const schema = z.object({
  nationalId: z.string().nonempty(REQUIRED).max(9, 'תעודת זהות בעלת 9 ספרות'),
  password: z.string().nonempty(REQUIRED),
});

export type LoginFormValues = z.infer<typeof schema>;

export type UseLoginFormArgs = { onLoginSuccess: VoidFunction; startShake: VoidFunction };

export type UseLoginFormContent = ReturnType<typeof useLoginForm>;

export const useLoginForm = ({ onLoginSuccess, startShake }: UseLoginFormArgs) => {
  const { login } = useAuth();

  const {
    handleSubmit,
    setError,
    formState: { isSubmitting, errors },
    control,
    watch,
    clearErrors,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nationalId: '', password: '' },
    mode: 'onChange',
  });

  useEffect(() => {
    // ? Clear root errors when changing field values

    const subscription = watch(() => clearErrors('root'));

    return () => subscription.unsubscribe();
  }, [watch, clearErrors]);

  const onSubmit = handleSubmit(
    (formValues) =>
      login(formValues, {
        onSuccess: onLoginSuccess,
        onError: () => {
          setError('root', { message: DEFAULT_ERROR });

          startShake();
        },
      }).catch(() => {}),
    startShake,
  );

  return { control, onSubmit, isSubmitting, errors };
};
