import { pointSchema, type coordinatesSchema } from '@/schemas/genericSchemas';
import type { ViewStyle } from 'react-native';
import { z } from 'zod';

export type WithStyle<T = unknown> = T & { style?: ViewStyle };

export type Coordinates = z.infer<typeof coordinatesSchema>;

export type Point = z.infer<typeof pointSchema>;
