import type { Response } from 'express';

export type WithResponse<T> = T & { response: Response };
