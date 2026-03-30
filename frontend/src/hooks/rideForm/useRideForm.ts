import { createRide, updateRide } from '@/api/rideForm';
import { i18n } from '@/i18n';
import { getTomorrowAt, getTomorrowAt8AM } from '@helpers';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@services';
import { useMutation } from '@tanstack/react-query';
import { addMinutes, setHours, setMilliseconds, setMinutes, setSeconds } from 'date-fns';
import { useRouter } from 'expo-router';
import { first, last } from 'lodash';
import { useFieldArray, useForm, type DefaultValues } from 'react-hook-form';
import { rideFormSchema, type CreateRideDto, type RideFormValues, type RideStopDto } from '../../schemas/rideForm';

const applyTimeToDate = (baseDate: Date, timeSource: Date) => {
  let result = setHours(baseDate, timeSource.getHours());

  result = setMinutes(result, timeSource.getMinutes());
  result = setSeconds(result, timeSource.getSeconds());

  return setMilliseconds(result, 0);
};

const mapFormValuesToPayload = (values: RideFormValues) => {
  const { rideDate, stops, seats, driverId, orgId } = values;

  const rideStops: RideStopDto[] = stops.map((stop, index) => ({
    location: stop.locationPoint,
    locationName: stop.locationName,
    estimatedArrivalAt: applyTimeToDate(rideDate, stop.time),
    orderIndex: index,
  }));

  const origin = first(rideStops);
  const destination = last(rideStops);

  if (!origin || !destination) return undefined;

  const createRideDTO = {
    orgId,
    driverId,
    startsAt: origin.estimatedArrivalAt,
    estimatedEndsAt: destination.estimatedArrivalAt,
    maxSeatsAmount: seats,
    rideStops,
  } satisfies CreateRideDto;

  return createRideDTO;
};

const createInitialStop = (time: Date) => ({
  locationName: '',
  locationPoint: { type: 'Point' as const, coordinates: [0, 0] as [number, number] } as const,
  time,
});

export type UseRideFormArgs = { defaultValues?: DefaultValues<RideFormValues> };

export type UseRideFormContent = ReturnType<typeof useRideForm>;

export const useRideForm = ({ defaultValues }: UseRideFormArgs) => {
  const router = useRouter();
  const { user } = useAuth();

  const form = useForm<RideFormValues>({
    resolver: zodResolver(rideFormSchema),
    defaultValues: {
      rideDate: getTomorrowAt8AM(),
      seats: 3,
      isReturnTrip: false,
      orgId: user?.orgId,
      driverId: user?.id,
      stops: [createInitialStop(getTomorrowAt8AM()), createInitialStop(getTomorrowAt(9))],
      ...defaultValues,
    },
    mode: 'onChange',
  });

  const { control, handleSubmit, reset: resetForm, watch, setError, trigger } = form;

  const stopsFieldArray = useFieldArray({ control, name: 'stops' });

  const clearFormAndExit = () => {
    router.back();

    resetMutations();
    setTimeout(() => resetForm(), 100);
  };

  const {
    mutate: createRideMutation,
    isPending: isCreateRideSubmitting,
    error: createRideSubmissionError,
    reset: resetCreateRideMutation,
  } = useMutation({
    mutationFn: createRide,
    onSuccess: clearFormAndExit,
    onError: () => setError('root', { message: i18n.rideForm.create_ride_error_happened }),
  });

  const {
    mutate: updateRideMutation,
    isPending: isUpdateRideSubmitting,
    error: updateRideSubmissionError,
    reset: resetUpdateRideMutation,
  } = useMutation({
    mutationFn: updateRide,
    onSuccess: clearFormAndExit,
    onError: () => setError('root', { message: i18n.rideForm.update_ride_error_happened }),
  });

  const isSubmitting = isCreateRideSubmitting || isUpdateRideSubmitting;
  const mutationError = createRideSubmissionError ?? updateRideSubmissionError;
  const resetMutations = () => {
    resetCreateRideMutation();
    resetUpdateRideMutation();
  };

  const currentStops = watch('stops');
  const waypointFields = stopsFieldArray.fields.slice(1, -1);

  const handleFormSubmit = handleSubmit(
    (values) => {
      const payload = mapFormValuesToPayload(values);

      if (!payload) return trigger();

      const rideId = defaultValues?.id;

      if (rideId) return updateRideMutation({ rideId, ...payload });

      createRideMutation(payload);
    },
    (validationErrors) => {
      console.error('Validation Failed:', validationErrors);
    },
  );

  const addNewWaypoint = () => {
    const destinationIndex = currentStops.length - 1;
    const stopBeforeDestination = currentStops[destinationIndex - 1];

    const startTime = stopBeforeDestination?.time ?? getTomorrowAt8AM();
    const waypointTime = addMinutes(startTime, 15);

    stopsFieldArray.insert(destinationIndex, createInitialStop(waypointTime));
  };

  const removeWaypointAt = (waypointIndex: number) => {
    const actualStopsIndex = waypointIndex + 1;
    stopsFieldArray.remove(actualStopsIndex);

    trigger('stops');
  };

  return {
    form,
    waypointFields,
    waypointCount: waypointFields.length,
    addWaypoint: addNewWaypoint,
    removeWaypoint: removeWaypointAt,
    onSubmit: handleFormSubmit,
    isPending: isSubmitting,
    mutationError,
    onExit: clearFormAndExit,
  };
};
