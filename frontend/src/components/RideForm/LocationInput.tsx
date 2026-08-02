import { AppTextInput } from '@/components/ui/AppTextInput';
import { i18n } from '@/i18n';
import { Ionicons } from '@expo/vector-icons';
import { convertNominatimResultToPlaceResult, useLocationSearch, type NominatimResult, type PlaceResult } from '@hooks';
import { colors, radii, spacing, typography } from '@theme';
import type { FC } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
  type LayoutRectangle,
} from 'react-native';
import { Portal } from 'react-native-paper';

export type LocationInputProps = {
  label?: string;
  value: string;
  onChange: (value: string, place?: PlaceResult) => void;
  error?: string;
  placeholder?: string;
};

const SkeletonRow: FC = () => (
  <View style={styles.skeletonRow}>
    <View style={styles.skeletonLines}>
      <View style={[styles.skeletonLine, styles.skeletonMain]} />
      <View style={[styles.skeletonLine, styles.skeletonSub]} />
    </View>

    <View style={styles.skeletonIcon} />
  </View>
);

export const LocationInput: FC<LocationInputProps> = ({ label, value, onChange, error, placeholder }) => {
  const [localValue, setLocalValue] = useState(value);
  const [open, setOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState<LayoutRectangle | null>(null);
  const containerRef = useRef<View>(null);

  const { results, isSearching, hasNoResults, fetchError, query, clear } = useLocationSearch({});

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const measureAnchor = useCallback(() => {
    setTimeout(() => {
      containerRef.current?.measureInWindow((x, y, width, height) => {
        setAnchorRect({ x, y, width, height });
      });
    }, 50);
  }, []);

  useEffect(() => {
    const keyboardEmitterSubscription = Keyboard.addListener('keyboardDidShow', measureAnchor);

    return () => keyboardEmitterSubscription.remove();
  }, [measureAnchor]);

  const handleChangeText = (text: string) => {
    setLocalValue(text);
    onChange(text);
    query(text);

    if (text.length >= 2) {
      measureAnchor();
      setOpen(true);
    } else {
      setOpen(false);
    }
  };

  const handleSelect = (nominatimResult: NominatimResult) => {
    const place = convertNominatimResultToPlaceResult(nominatimResult);

    setLocalValue(place.description);
    onChange(place.description, place);
    clear();
    setOpen(false);
  };

  const handleClose = () => {
    setOpen(false);
    clear();
  };

  const showDropdown = open && (isSearching || hasNoResults || !!fetchError || results.length > 0);

  const dropdownTop = anchorRect ? anchorRect.y + anchorRect.height + (error ? spacing.xl : spacing.md) : 0;
  const dropdownLeft = anchorRect?.x ?? 0;
  const dropdownWidth = anchorRect?.width ?? 0;

  return (
    <View ref={containerRef} style={styles.container} onLayout={measureAnchor}>
      <AppTextInput
        label={label ?? ''}
        value={localValue}
        onChangeText={handleChangeText}
        onFocus={() => {
          measureAnchor();

          if (results.length > 0 || isSearching) setOpen(true);
        }}
        placeholder={placeholder ?? label ?? ''}
        error={error}
        rightIconName='location-outline'
        autoCorrect={false}
        autoComplete='off'
      />

      {showDropdown && (
        <Portal>
          <TouchableWithoutFeedback onPress={handleClose}>
            <View style={styles.backdrop}>
              <TouchableWithoutFeedback onPress={() => {}}>
                <View style={[styles.dropdown, { top: dropdownTop, left: dropdownLeft, width: dropdownWidth }]}>
                  {isSearching && (
                    <View style={{ ...styles.stateContainer, flexDirection: 'column' }}>
                      <SkeletonRow />
                      <View style={styles.separator} />
                      <SkeletonRow />
                      <View style={styles.separator} />
                      <SkeletonRow />
                    </View>
                  )}

                  {!isSearching && hasNoResults && (
                    <View style={styles.stateContainer}>
                      <Text style={styles.stateText}>{i18n.general.no_results_found}</Text>

                      <Ionicons name='search-outline' size={20} color={colors.textMuted} />
                    </View>
                  )}

                  {!isSearching && !!fetchError && (
                    <View style={styles.stateContainer}>
                      <Text style={[styles.stateText, styles.stateTextError]}>
                        {i18n.general.search_error_please_try_again}
                      </Text>

                      <Ionicons name='alert-circle-outline' size={20} color={colors.error} />
                    </View>
                  )}

                  {!isSearching && results.length > 0 && (
                    <FlatList
                      data={results}
                      keyExtractor={(item) => item.place_id}
                      keyboardShouldPersistTaps='always'
                      scrollEnabled={false}
                      ItemSeparatorComponent={() => <View style={styles.separator} />}
                      renderItem={({ item }) => {
                        const parts = item.display_name.split(',');
                        const main = parts[0] ?? '';
                        const sub = parts.slice(1, 3).join(',').trim();

                        return (
                          <Pressable style={styles.resultRow} onPress={() => handleSelect(item)}>
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

                            <Ionicons name='location-outline' size={14} color={colors.textMuted} />
                          </Pressable>
                        );
                      }}
                    />
                  )}
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Portal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  dropdown: {
    position: 'absolute',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.purpleCard,
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    textAlign: 'right',
  },
  stateContainer: {
    flexDirection: 'row',
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
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    width: '100%',
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
    width: '100%',
  },
  resultSub: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    textAlign: 'right',
    width: '100%',
  },
  separator: {
    height: 1,
    backgroundColor: colors.inputBorder,
    marginHorizontal: spacing.md,
    width: '100%',
  },
});
