import { i18n } from '@/i18n';
import { AppButton } from '@components';
import { IS_WEB } from '@constants';
import { colors, spacing, typography } from '@theme';
import type { FC } from 'react';
import { Controller, useWatch, type FieldErrors } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AddStopButton, DateInput, LocationRow, SeatsCounter, SectionCard, TripTypeSegment } from './components';
import { useRideForm, type PlaceResult, type UseRideFormArgs } from './hooks';
import type { RideFormValues } from './schema';

type StopError = FieldErrors<RideFormValues['stops'][number]>;

const createLocationChangeHandler =
  (currentStop: RideFormValues['stops'][number], onChange: (value: RideFormValues['stops'][number]) => void) =>
  (locationName: string, place?: PlaceResult) =>
    onChange({
      ...currentStop,
      locationName,
      ...(place && { locationPoint: { type: 'Point', coordinates: [place.lng, place.lat] } }),
    });

export type RideFormProps = UseRideFormArgs;

export const RideForm: FC<RideFormProps> = (useRideFormArgs) => {
  const {
    form: { control },
    waypointFields,
    addWaypoint,
    removeWaypoint,
    onSubmit,
    isPending,
    mutationError,
    onExit,
  } = useRideForm(useRideFormArgs);

  const stops = useWatch({ control, name: 'stops' });
  const destinationIndex = stops.length - 1;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={styles.root} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps='handled'>
        <View style={styles.inner}>
          <Text style={styles.screenTitle}>{i18n.rideForm.create_ride}</Text>

          <SectionCard title={i18n.rideForm.general_details} style={{ zIndex: 30 }}>
            <View style={{ gap: spacing.md }}>
              <Controller
                control={control}
                name='rideDate'
                render={({ field, fieldState: { error } }) => (
                  <DateInput label={i18n.rideForm.ride_date} {...field} error={error?.message} />
                )}
              />

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

              <Controller
                control={control}
                name={`stops.${destinationIndex}`}
                render={({ field, fieldState: { error } }) => (
                  <LocationRow
                    label={i18n.rideForm.general_details}
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

          <SectionCard title={i18n.rideForm.stops_in_the_way} style={{ zIndex: 10 }}>
            <View style={{ gap: spacing.md }}>
              {waypointFields.map((waypoint, index) => {
                const stopIndex = index + 1;

                return (
                  <Controller
                    key={waypoint.id}
                    control={control}
                    name={`stops.${stopIndex}`}
                    render={({ field, fieldState: { error } }) => (
                      <LocationRow
                        label={`${i18n.rideForm.ride_stop} ${stopIndex}`}
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

          {mutationError instanceof Error && <Text style={styles.mutationError}>{mutationError.message}</Text>}

          <View style={styles.actions}>
            <AppButton label={i18n.general.accept} onPress={onSubmit} loading={isPending} style={styles.confirmBtn} />

            <AppButton
              label={i18n.general.cancel}
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
