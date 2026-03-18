import { AppTextInput } from '@components';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '@theme';
import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { type PlaceResult, useLocationSearch } from '../hooks/useLocationSearch';

export type { PlaceResult };

export type LocationInputProps = {
  label?: string;
  value: string;
  onChange: (value: string, place?: PlaceResult) => void;
  error?: string;
  placeholder?: string;
};

// ─── Skeleton row ─────────────────────────────────────────────────────────────

const SkeletonRow: FC = () => (
  <View style={styles.skeletonRow}>
    <View style={styles.skeletonIcon} />
    <View style={styles.skeletonLines}>
      <View style={[styles.skeletonLine, styles.skeletonMain]} />
      <View style={[styles.skeletonLine, styles.skeletonSub]} />
    </View>
  </View>
);

// ─── Component ───────────────────────────────────────────────────────────────

export const LocationInput: FC<LocationInputProps> = ({ label, value, onChange, error, placeholder }) => {
  const [localValue, setLocalValue] = useState(value);
  const [open, setOpen] = useState(false);

  const { results, isSearching, hasNoResults, fetchError, query, clear, toPlace } = useLocationSearch({});

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChangeText = (text: string) => {
    setLocalValue(text);
    onChange(text);
    query(text);
    setOpen(text.length >= 2);
  };

  const handleSelect = (item: (typeof results)[number]) => {
    const place = toPlace(item);
    setLocalValue(place.description);
    onChange(place.description, place);
    clear();
    setOpen(false);
  };

  const showDropdown = open && (isSearching || hasNoResults || !!fetchError || results.length > 0);

  return (
    <View style={styles.container}>
      <AppTextInput
        label={label ?? ''}
        value={localValue}
        onChangeText={handleChangeText}
        onFocus={() => (results.length > 0 || isSearching) && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder ?? label ?? ''}
        isError={!!error}
        helperText={error}
        rightIconName='location-outline'
        autoCorrect={false}
        autoComplete='off'
      />

      {showDropdown && (
        <View style={styles.dropdown}>
          {/* Loading skeletons */}
          {isSearching && (
            <View style={styles.stateContainer}>
              <SkeletonRow />
              <View style={styles.separator} />
              <SkeletonRow />
              <View style={styles.separator} />
              <SkeletonRow />
            </View>
          )}

          {/* No results */}
          {!isSearching && hasNoResults && (
            <View style={styles.stateContainer}>
              <Ionicons name='search-outline' size={20} color={colors.textMuted} />
              <Text style={styles.stateText}>לא נמצאו תוצאות</Text>
            </View>
          )}

          {/* Fetch error */}
          {!isSearching && !!fetchError && (
            <View style={styles.stateContainer}>
              <Ionicons name='alert-circle-outline' size={20} color={colors.error} />
              <Text style={[styles.stateText, styles.stateTextError]}>שגיאה בחיפוש, נסה שנית</Text>
            </View>
          )}

          {/* Results */}
          {!isSearching && results.length > 0 && (
            <FlatList
              data={results}
              keyExtractor={(item) => item.place_id}
              keyboardShouldPersistTaps='handled'
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              renderItem={({ item }) => {
                const parts = item.display_name.split(',');
                const main = parts[0] ?? '';
                const sub = parts.slice(1, 3).join(',').trim();
                return (
                  <Pressable style={styles.resultRow} onPress={() => handleSelect(item)}>
                    <Ionicons name='location-outline' size={14} color={colors.textMuted} />
                    <View style={styles.resultText}>
                      <Text style={styles.resultMain} numberOfLines={1}>
                        {main}
                      </Text>
                      {!!sub && (
                        <Text style={styles.resultSub} numberOfLines={1}>
                          {sub}
                        </Text>
                      )}
                    </View>
                  </Pressable>
                );
              }}
            />
          )}
        </View>
      )}
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    width: '100%',
    // zIndex: 10,
  },
  dropdown: {
    position: 'absolute',
    top: 75 + spacing.xs,
    left: 0,
    right: 0,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.purpleCard,
    // zIndex: 50,
    overflow: 'hidden',
    elevation: 8,
  },

  // ── State views (loading / empty / error) ──
  stateContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  stateText: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.md,
    color: colors.textMuted,
    textAlign: 'right',
  },
  stateTextError: {
    color: colors.error,
  },

  // ── Skeleton ──
  skeletonRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  skeletonIcon: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.inputBorder,
    opacity: 0.6,
  },
  skeletonLines: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 6,
  },
  skeletonLine: {
    borderRadius: 4,
    backgroundColor: colors.inputBorder,
    opacity: 0.6,
  },
  skeletonMain: {
    height: 12,
    width: '60%',
  },
  skeletonSub: {
    height: 10,
    width: '40%',
  },

  // ── Results ──
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  resultText: {
    flex: 1,
    alignItems: 'flex-start',
  },
  resultMain: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
    textAlign: 'right',
  },
  resultSub: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    textAlign: 'right',
  },
  separator: {
    height: 1,
    backgroundColor: colors.inputBorder,
    marginHorizontal: spacing.md,
  },
});
