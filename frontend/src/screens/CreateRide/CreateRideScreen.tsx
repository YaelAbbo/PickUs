import { AppButton } from '@components';
import { IS_WEB } from '@constants';
import { colors, spacing, typography } from '@theme';
import type { FC } from 'react';
import { Controller, useWatch, type FieldErrors } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AddStopButton, DateInput, LocationRow, SeatsCounter, SectionCard, TripTypeSegment } from './components';
import { useCreateRideForm, type PlaceResult } from './hooks';
import type { CreateRideFormValues } from './schema';

type StopError = FieldErrors<CreateRideFormValues['stops'][number]>;

/**
 * Updates both locationName (display) and locationPoint (GeoJSON) atomically.
 */
const createLocationChangeHandler =
  (
    currentStop: CreateRideFormValues['stops'][number],
    onChange: (value: CreateRideFormValues['stops'][number]) => void,
  ) =>
  (locationName: string, place?: PlaceResult) => {
    onChange({
      ...currentStop,
      locationName,
      ...(place && {
        locationPoint: {
          type: 'Point',
          coordinates: [place.lng, place.lat],
        },
      }),
    });
  };

export const CreateRideScreen: FC = () => {
  const {
    form: { control },
    waypointFields,
    addWaypoint,
    removeWaypoint,
    onSubmit,
    isPending,
    mutationError,
    onExit,
  } = useCreateRideForm();

  const stops = useWatch({ control, name: 'stops' });
  const destinationIndex = stops.length - 1;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={styles.root} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps='handled'>
        <View style={styles.inner}>
          <Text style={styles.screenTitle}>יצירת נסיעה</Text>

          {/* ── General details ── */}
          <SectionCard title='פרטים כלליים' style={{ zIndex: 30 }}>
            <View style={{ gap: spacing.md }}>
              <Controller
                control={control}
                name='rideDate'
                render={({ field, fieldState: { error } }) => (
                  <DateInput label='תאריך נסיעה' {...field} error={error?.message} />
                )}
              />

              {/* Origin — stops[0] */}
              <Controller
                control={control}
                name='stops.0'
                render={({ field, fieldState: { error } }) => (
                  <LocationRow
                    label='מוצא'
                    timeValue={field.value.time}
                    onTimeChange={(time) => field.onChange({ ...field.value, time })}
                    timeError={(error as StopError)?.time?.message}
                    locationValue={field.value.locationName}
                    onLocationChange={createLocationChangeHandler(field.value, field.onChange)}
                    locationError={(error as StopError)?.locationName?.message}
                  />
                )}
              />

              {/* Destination — The last stop in the array */}
              <Controller
                control={control}
                name={`stops.${destinationIndex}`}
                render={({ field, fieldState: { error } }) => (
                  <LocationRow
                    label='יעד'
                    timeValue={field.value.time}
                    onTimeChange={(time) => field.onChange({ ...field.value, time })}
                    timeError={(error as StopError)?.time?.message}
                    locationValue={field.value.locationName}
                    onLocationChange={createLocationChangeHandler(field.value, field.onChange)}
                    locationError={(error as StopError)?.locationName?.message}
                  />
                )}
              />
            </View>

            <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
              <Controller control={control} name='seats' render={({ field }) => <SeatsCounter {...field} />} />
              <Controller
                control={control}
                name='isReturnTrip'
                render={({ field }) => <TripTypeSegment {...field} />}
              />
            </View>
          </SectionCard>

          {/* ── Waypoints ── */}
          <SectionCard title='תחנות בדרך' style={{ zIndex: 10 }}>
            <View style={{ gap: spacing.md }}>
              {waypointFields.map((waypoint, index) => {
                // Waypoint UI index 0 corresponds to stops[1]
                const stopIndex = index + 1;

                return (
                  <Controller
                    key={waypoint.id}
                    control={control}
                    name={`stops.${stopIndex}`}
                    render={({ field, fieldState: { error } }) => (
                      <LocationRow
                        label={`תחנה ${stopIndex}`}
                        timeValue={field.value.time}
                        onTimeChange={(time) => field.onChange({ ...field.value, time })}
                        timeError={(error as StopError)?.time?.message}
                        locationValue={field.value.locationName}
                        onLocationChange={createLocationChangeHandler(field.value, field.onChange)}
                        locationError={(error as StopError)?.locationName?.message}
                        onRemove={() => removeWaypoint(index)}
                      />
                    )}
                  />
                );
              })}

              <AddStopButton onPress={addWaypoint} />
            </View>
          </SectionCard>

          {/* ── Errors ── */}
          {mutationError instanceof Error && <Text style={styles.mutationError}>{mutationError.message}</Text>}

          {/* ── Actions ── */}
          <View style={styles.actions}>
            <AppButton label='אישור' onPress={onSubmit} loading={isPending} style={styles.confirmBtn} />
            <AppButton
              label='ביטול'
              onPress={onExit}
              disabled={isPending}
              style={styles.cancelBtn}
              labelStyle={{ color: colors.textPrimary }}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.purple,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: IS_WEB ? spacing.xl : spacing.md,
    paddingHorizontal: IS_WEB ? spacing.xl : spacing.md,
  },
  inner: {
    width: '100%',
    maxWidth: IS_WEB ? 560 : undefined,
    marginTop: spacing.lg,
  },
  screenTitle: {
    fontFamily: typography.fonts.bold,
    fontSize: IS_WEB ? typography.sizes.xxl : typography.sizes.xl,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  mutationError: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.sm,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  actions: {
    flexDirection: 'row-reverse',
    gap: spacing.sm,
    marginTop: IS_WEB ? spacing.md : spacing.xs,
    marginBottom: IS_WEB ? spacing.xl : spacing.md,
  },
  confirmBtn: {
    flex: 1,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
});
