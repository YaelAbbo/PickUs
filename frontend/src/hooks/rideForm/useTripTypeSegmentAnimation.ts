import { useNativeDriver } from '@constants';
import { useEffect, useRef, useState } from 'react';
import { Animated, type LayoutChangeEvent } from 'react-native';

const PADDING = 3;
const GAP = 3;

export type UseTripTypeSegmentAnimationArgs = { activeIndex: number; segmentCount?: number };

export type UseTripTypeSegmentAnimationContent = ReturnType<typeof useTripTypeSegmentAnimation>;

export const useTripTypeSegmentAnimation = ({ activeIndex, segmentCount = 2 }: UseTripTypeSegmentAnimationArgs) => {
  const [trackWidth, setTrackWidth] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;

  const pillWidth = trackWidth > 0 ? (trackWidth - PADDING * 2 - GAP * segmentCount) / segmentCount : 0;

  useEffect(() => {
    if (pillWidth === 0) return;

    const reversedIndex = segmentCount - 1 - activeIndex;
    const toValue = reversedIndex * (pillWidth + GAP + 1);

    Animated.spring(translateX, { toValue, useNativeDriver, speed: 22, bounciness: 5 }).start();
  }, [activeIndex, pillWidth, segmentCount, translateX]);

  const handleLayout = ({ nativeEvent }: LayoutChangeEvent) => setTrackWidth(nativeEvent.layout.width);

  return { translateX, pillWidth, handleLayout };
};
