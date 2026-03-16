import { createParamDecorator } from '@nestjs/common';
import type { Request } from 'express';

export const CurrentUserId = createParamDecorator(
  (_, context) => context.switchToHttp().getRequest<Request>().user.sub,
);
