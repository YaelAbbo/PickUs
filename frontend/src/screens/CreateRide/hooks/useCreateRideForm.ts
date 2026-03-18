import { getTomorrowAt, getTomorrowAt8AM } from '@helpers';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { addHours, subHours } from 'date-fns';
import { useRouter } from 'expo-router';
import { last } from 'lodash';
import { useFieldArray, useForm } from 'react-hook-form';
import { postCreateRide } from '../api';
import { createRideSchema, type CreateRideFormValues } from '../schema';

export type UseCreateRideFormContent = ReturnType<typeof useCreateRideForm>;

export const useCreateRideForm = () => {
  const router = useRouter();

  const form = useForm<CreateRideFormValues>({
    resolver: zodResolver(createRideSchema),
    defaultValues: {
      rideDate: getTomorrowAt8AM(),
      startTime: getTomorrowAt8AM(),
      endTime: getTomorrowAt(9),
      origin: '',
      destination: '',
      seats: 3,
      isReturnTrip: false,
      stops: [],
    },
    mode: 'onChange',
  });

  const stopsArray = useFieldArray<CreateRideFormValues, 'stops'>({ control: form.control, name: 'stops' });

  const {
    mutateAsync,
    isPending,
    error: mutationError,
  } = useMutation({
    mutationFn: postCreateRide,
    onSuccess: router.back,
    onError: () => form.setError('root', { message: 'קרתה שגיאה ביצירת הנסיעה' }),
  });

  const [stops, startTime] = form.watch(['stops', 'startTime']);

  const onSubmit = form.handleSubmit((values: CreateRideFormValues) => mutateAsync(values));

  const addStop = () => {
    const lastStopTime = last(stops)?.time ?? subHours(startTime, 1);
    const nextStopTime = addHours(lastStopTime, 1);

    stopsArray.append({ time: nextStopTime, location: '' });
  };

  const removeStop = (index: number) => {
    stopsArray.remove(index);

    form.trigger('stops');
  };

  return { form, stops: stopsArray.fields, addStop, removeStop, onSubmit, isPending, mutationError };
};
