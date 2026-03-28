import { getTomorrowAt, getTomorrowAt8AM } from '@helpers';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthContext } from '@services';
import { useMutation } from '@tanstack/react-query';
import { addMinutes, setHours, setMilliseconds, setMinutes, setSeconds } from 'date-fns';
import { useRouter } from 'expo-router';
import { first, last } from 'lodash';
import { useFieldArray, useForm } from 'react-hook-form';
import { postCreateRide } from '../api';
import { createRideSchema, type CreateRideDto, type CreateRideFormValues, type CreateRideStopDto } from '../schema';

/** Merge the calendar date from `date` with the clock time from `time` */
const mergeDateAndTime = (date: Date, time: Date) => {
  let result = setHours(date, time.getHours());

  result = setMinutes(result, time.getMinutes());
  result = setSeconds(result, time.getSeconds());

  return setMilliseconds(result, 0);
};

const convertCreateRideFormToCreateRideDTO = ({ rideDate, stops, seats, driverId, orgId }: CreateRideFormValues) => {
  const rideStops: CreateRideStopDto[] = stops.map((stop, orderIndex) => ({
    location: stop.locationPoint,
    locationName: stop.locationName,
    estimatedArrivalAt: mergeDateAndTime(rideDate, stop.time),
    orderIndex,
  }));

  const firstStop = first(rideStops);
  const lastStop = last(rideStops);

  if (!firstStop || !lastStop) return;

  const createRideDTO = {
    orgId,
    driverId,
    startsAt: firstStop.estimatedArrivalAt,
    estimatedEndsAt: lastStop.estimatedArrivalAt,
    maxSeatsAmount: seats,
    rideStops,
  } satisfies CreateRideDto;

  return createRideDTO;
};

const createEmptyStop = (time: Date) => ({
  locationName: '',
  locationPoint: { type: 'Point' as const, coordinates: [0, 0] as [number, number] },
  time,
});

export type UseCreateRideFormContent = ReturnType<typeof useCreateRideForm>;

export const useCreateRideForm = () => {
  const router = useRouter();
  const { user } = useAuthContext();

  const form = useForm<CreateRideFormValues>({
    resolver: zodResolver(createRideSchema),
    defaultValues: {
      rideDate: getTomorrowAt8AM(),
      seats: 3,
      isReturnTrip: false,
      orgId: user?.orgId,
      driverId: user?.id,
      stops: [createEmptyStop(getTomorrowAt8AM()), createEmptyStop(getTomorrowAt(9))],
    },
    mode: 'onChange',
  });

  const stopsArray = useFieldArray<CreateRideFormValues, 'stops'>({ control: form.control, name: 'stops' });

  const onExit = () => {
    router.back();

    resetMutation();
    setTimeout(() => reset(), 100);
  };

  const {
    mutate,
    isPending,
    error: mutationError,
    reset: resetMutation,
  } = useMutation({
    mutationFn: postCreateRide,
    onSuccess: onExit,
    onError: () => form.setError('root', { message: 'קרתה שגיאה ביצירת הנסיעה' }),
  });

  const [stops] = form.watch(['stops']);

  const onSubmit = form.handleSubmit(
    (values) => {
      const createRideDTO = convertCreateRideFormToCreateRideDTO(values);

      if (createRideDTO) mutate(createRideDTO);
    },
    (errors) => {
      console.log(errors);
    },
  );

  // Waypoints are everything except stops[0] (origin) and stops[last] (destination)
  const waypointFields = stopsArray.fields.slice(1, -1);

  const addWaypoint = () => {
    const prevStop = stops[stops.length - 2]; // stop before destination
    const nextTime = addMinutes(prevStop?.time ?? getTomorrowAt8AM(), 15);

    // Insert before last stop (destination)
    stopsArray.insert(stops.length - 1, createEmptyStop(nextTime));
  };

  const removeWaypoint = (waypointIndex: number) => {
    // waypointIndex 0 = stops[1], so add 1 to get the real stops index
    stopsArray.remove(waypointIndex + 1);

    form.trigger('stops');
  };

  const reset = () => form.reset();

  return {
    form,
    waypointFields,
    waypointCount: waypointFields.length,
    addWaypoint,
    removeWaypoint,
    onSubmit,
    isPending,
    mutationError,
    onExit,
  };
};
