import type { RequestWithCookies } from '@/auth/types';
import { createParamDecorator } from '@nestjs/common';

export const RefreshToken = createParamDecorator(
  (_, context) =>
    context.switchToHttp().getRequest<RequestWithCookies>().cookies
      .refreshToken,
);
