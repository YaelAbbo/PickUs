import { AppButton } from '@components';
import { IS_WEB } from '@constants';
import { colors, spacing, typography } from '@theme';
import { useRouter } from 'expo-router';
import type { FC } from 'react';
import { Controller } from 'react-hook-form';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { AddStopButton, DateInput, LocationRow, ReturnTripToggle, SeatsSlider, SectionCard } from './components';
import { useCreateRideForm } from './hooks/useCreateRideForm';

export const CreateRideScreen: FC = () => {
  const router = useRouter();
  const {
    form: {
      control,
      watch,
      formState: { errors },
    },
    stops,
    addStop,
    removeStop,
    onSubmit,
    isPending,
    mutationError,
  } = useCreateRideForm();

  const seats = watch('seats');

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps='handled'>
      <View style={styles.inner}>
        <Text style={styles.screenTitle}>יצירת נסיעה</Text>

        {/* ── General Details ── */}
        <SectionCard title='פרטים כלליים' style={{ zIndex: 20 }}>
          <Controller
            control={control}
            name='rideDate'
            render={({ field }) => (
              <DateInput
                label='תאריך נסיעה'
                value={field.value}
                onChange={field.onChange}
                error={errors.rideDate?.message}
                minimumDate={new Date()}
              />
            )}
          />

          <Controller
            control={control}
            name='startTime'
            render={({ field: timeField }) => (
              <Controller
                control={control}
                name='origin'
                render={({ field: locField }) => (
                  <LocationRow
                    label='התחלה'
                    timeValue={timeField.value}
                    onTimeChange={timeField.onChange}
                    timeError={errors.startTime?.message}
                    locationValue={locField.value}
                    onLocationChange={(text) => locField.onChange(text)}
                    locationError={errors.origin?.message}
                  />
                )}
              />
            )}
          />

          <Controller
            control={control}
            name='endTime'
            render={({ field: timeField }) => (
              <Controller
                control={control}
                name='destination'
                render={({ field: locField }) => (
                  <LocationRow
                    label='סיום'
                    timeValue={timeField.value}
                    onTimeChange={timeField.onChange}
                    timeError={errors.endTime?.message}
                    locationValue={locField.value}
                    onLocationChange={(text) => locField.onChange(text)}
                    locationError={errors.destination?.message}
                  />
                )}
              />
            )}
          />

          <Controller
            control={control}
            name='seats'
            render={({ field }) => <SeatsSlider value={seats} onChange={field.onChange} />}
          />

          <Controller
            control={control}
            name='isReturnTrip'
            render={({ field }) => <ReturnTripToggle value={field.value} onChange={field.onChange} />}
          />
        </SectionCard>

        {/* ── Stops ── */}
        <SectionCard title='תחנות עצירה'>
          {stops.map((stop, index) => (
            <Controller
              key={stop.id}
              control={control}
              name={`stops.${index}.time`}
              render={({ field: timeField }) => (
                <Controller
                  control={control}
                  name={`stops.${index}.location`}
                  render={({ field: locField }) => (
                    <LocationRow
                      label={`תחנה ${index + 1}`}
                      timeValue={timeField.value}
                      onTimeChange={timeField.onChange}
                      timeError={errors.stops?.[index]?.time?.message}
                      locationValue={locField.value}
                      onLocationChange={(text) => locField.onChange(text)}
                      locationError={errors.stops?.[index]?.location?.message}
                      onRemove={() => removeStop(index)}
                    />
                  )}
                />
              )}
            />
          ))}

          <AddStopButton onPress={addStop} />
        </SectionCard>

        {/* ── Mutation error ── */}
        {mutationError instanceof Error && <Text style={styles.mutationError}>{mutationError.message}</Text>}

        {/* ── Actions ── */}
        <View style={styles.actions}>
          <AppButton label='אישור' onPress={onSubmit} loading={isPending} style={styles.confirmBtn} />

          <AppButton
            label='ביטול'
            onPress={() => router.back()}
            disabled={isPending}
            style={styles.cancelBtn}
            labelStyle={{ color: colors.textPrimary }}
          />
        </View>
      </View>
    </ScrollView>
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
  },
  screenTitle: {
    fontFamily: typography.fonts.bold,
    fontSize: IS_WEB ? typography.sizes.xxl : typography.sizes.xl,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: IS_WEB ? spacing.xl : spacing.lg,
    marginTop: IS_WEB ? spacing.lg : spacing.sm,
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
