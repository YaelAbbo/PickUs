import { REQUIRED } from '@constants';
import { zodResolver } from '@hookform/resolvers/zod';
import { userSchema } from '@schemas';
import { useAuth } from '@services';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { i18n } from '@/i18n';

const DEFAULT_ERROR = i18n.login.error_invalid_credentials;

const schema = userSchema.pick({ nationalId: true }).extend({ password: z.string().nonempty(REQUIRED) });

export type LoginFormValues = z.infer<typeof schema>;

export type UseLoginFormArgs = {
  startShake: VoidFunction;
};

export type UseLoginFormContent = ReturnType<typeof useLoginForm>;

export const useLoginForm = ({ startShake }: UseLoginFormArgs) => {
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
    mode: 'onTouched',
  });

  useEffect(() => {
    // ? Clear root errors when changing field values

    const subscription = watch(() => clearErrors('root'));

    return () => subscription.unsubscribe();
  }, [watch, clearErrors]);

  const onSubmit = handleSubmit(
    (formValues) =>
      login(formValues, {
        onError: () => {
          setError('root', { message: DEFAULT_ERROR });

          startShake();
        },
      }).catch(() => {}),
    startShake,
  );

  return { control, onSubmit, isSubmitting, errors };
};
