import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { postCreateRide } from '../api';
import { createRideSchema, type CreateRideFormValues } from '../schema';

export type UseCreateRideFormContent = ReturnType<typeof useCreateRideForm>;

export const useCreateRideForm = () => {
  const router = useRouter();

  const form = useForm<CreateRideFormValues>({
    resolver: zodResolver(createRideSchema),
    defaultValues: {
      startTime: '08:00',
      origin: '',
      endTime: '09:00',
      destination: '',
      seats: 3,
      isReturnTrip: false,
      stops: [],
    },
  });

  const stopsArray = useFieldArray<CreateRideFormValues, 'stops'>({
    control: form.control,
    name: 'stops',
  });

  const {
    mutate,
    isPending,
    error: mutationError,
  } = useMutation({
    mutationFn: postCreateRide,
    onSuccess: () => router.back(),
  });

  const onSubmit = useCallback((values: CreateRideFormValues) => mutate(values), [mutate]);

  const addStop = useCallback(() => stopsArray.append({ time: '08:00', location: '' }), [stopsArray]);

  const removeStop = useCallback((index: number) => stopsArray.remove(index), [stopsArray]);

  return {
    form,
    stops: stopsArray.fields,
    addStop,
    removeStop,
    onSubmit: form.handleSubmit(onSubmit),
    isPending,
    mutationError,
  };
};
