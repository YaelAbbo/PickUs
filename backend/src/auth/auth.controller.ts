import type { User } from '@/database/entities';
import { Body, Controller, Get, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import {
  CurrentUserId,
  RefreshToken,
  UseAccessAuth,
  UseRefreshAuth,
} from './decorators';
import type { LoginDTO } from './types';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(
    @Body() loginDTO: LoginDTO,
    @Res({ passthrough: true }) response: Response,
  ) {
    const tokens = await this.authService.login({ ...loginDTO, response });

    return { accessToken: tokens.accessToken };
  }

  @UseAccessAuth()
  @Post('logout')
  async logout(
    @CurrentUserId() id: User['id'],
    @Res({ passthrough: true }) response: Response,
  ) {
    const message = this.authService.logout({ response, id });

    return message;
  }

  @UseAccessAuth()
  @Get('me')
  async findOne(@CurrentUserId() id: User['id']) {
    // TODO: Update this when the user.service.ts is created - use their findUserById instead

    return await this.authService.findUserById(id);
  }

  @UseRefreshAuth()
  @Post('refresh')
  async refresh(
    @CurrentUserId() id: User['id'],
    @RefreshToken() refreshToken: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const tokens = await this.authService.refreshTokens({
      id,
      refreshToken,
      response,
    });

    return { accessToken: tokens.accessToken };
  }
}
