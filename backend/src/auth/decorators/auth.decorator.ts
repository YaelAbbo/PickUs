import { applyDecorators, UseGuards } from '@nestjs/common';
import { AccessTokenGuard } from '../accessToken.guard';
import { RefreshTokenGuard } from '../refreshToken.guard';

export function UseAccessAuth() {
  return applyDecorators(UseGuards(AccessTokenGuard));
}

export function UseRefreshAuth() {
  return applyDecorators(UseGuards(RefreshTokenGuard));
}
