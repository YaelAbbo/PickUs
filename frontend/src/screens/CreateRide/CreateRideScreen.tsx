import { AppButton } from '@components';
import { IS_WEB } from '@constants';
import { colors, spacing, typography } from '@theme';
import { useRouter } from 'expo-router';
import type { FC } from 'react';
import { Controller } from 'react-hook-form';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { AddStopButton, DateInput, LocationRow, SeatsCounter, SectionCard, TripTypeSegment } from './components';
import { useCreateRideForm } from './hooks';

export const CreateRideScreen: FC = () => {
  const router = useRouter();
  const {
    form: { control, reset },
    stops,
    addStop,
    removeStop,
    onSubmit,
    isPending,
    mutationError,
  } = useCreateRideForm();

  const onExit = () => {
    router.back();

    setTimeout(() => reset(), 100);
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps='handled'>
      <View style={styles.inner}>
        <Text style={styles.screenTitle}>יצירת נסיעה</Text>

        <SectionCard title='פרטים כלליים' style={{ zIndex: 20 }}>
          <View style={{ gap: spacing.md }}>
            <Controller
              control={control}
              name='rideDate'
              render={({ field, fieldState: { error } }) => (
                <DateInput label='תאריך נסיעה' {...field} error={error?.message} />
              )}
            />

            <Controller
              control={control}
              name='startTime'
              render={({ field: startTimeField, fieldState: { error: startTimeError } }) => (
                <Controller
                  control={control}
                  name='origin'
                  render={({ field: originField, fieldState: { error: locationError } }) => (
                    <LocationRow
                      label='התחלה'
                      timeValue={startTimeField.value}
                      onTimeChange={startTimeField.onChange}
                      timeError={startTimeError?.message}
                      locationValue={originField.value}
                      onLocationChange={originField.onChange}
                      locationError={locationError?.message}
                    />
                  )}
                />
              )}
            />

            <Controller
              control={control}
              name='endTime'
              render={({ field: endTimeField, fieldState: { error: endTimeError } }) => (
                <Controller
                  control={control}
                  name='destination'
                  render={({ field: destinationField, fieldState: { error: destinationError } }) => (
                    <LocationRow
                      label='סיום'
                      timeValue={endTimeField.value}
                      onTimeChange={endTimeField.onChange}
                      timeError={endTimeError?.message}
                      locationValue={destinationField.value}
                      onLocationChange={destinationField.onChange}
                      locationError={destinationError?.message}
                    />
                  )}
                />
              )}
            />
          </View>

          <View>
            <Controller control={control} name='seats' render={({ field }) => <SeatsCounter {...field} />} />

            <Controller control={control} name='isReturnTrip' render={({ field }) => <TripTypeSegment {...field} />} />
          </View>
        </SectionCard>

        <SectionCard title='תחנות עצירה'>
          <View style={{ gap: spacing.md }}>
            {stops.map((stop, index) => (
              <Controller
                key={stop.id}
                control={control}
                name={`stops.${index}.time`}
                render={({ field: timeField, fieldState: { error: timeError } }) => (
                  <Controller
                    control={control}
                    name={`stops.${index}.location`}
                    render={({ field: locationField, fieldState: { error: locationError } }) => (
                      <LocationRow
                        label={`תחנה ${index + 1}`}
                        timeValue={timeField.value}
                        onTimeChange={timeField.onChange}
                        timeError={timeError?.message}
                        locationValue={locationField.value}
                        onLocationChange={(text) => locationField.onChange(text)}
                        locationError={locationError?.message}
                        onRemove={() => removeStop(index)}
                      />
                    )}
                  />
                )}
              />
            ))}

            <AddStopButton onPress={addStop} />
          </View>
        </SectionCard>

        {mutationError instanceof Error && <Text style={styles.mutationError}>{mutationError.message}</Text>}

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
