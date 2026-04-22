import type { User } from '@/database/entities';
import { UserService } from '@/user/user.service';
import { Body, Controller, Get, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import {
  CurrentUserId,
  RefreshToken,
  UseAccessAuth,
  UseRefreshAuth,
} from './decorators';
import { LoginDto } from './types';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private userService: UserService,
  ) {}

  @Post('login')
  async login(
    @Body() loginDTO: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { accessToken, isTempPassword } = await this.authService.login({
      ...loginDTO,
      response,
    });

    return { accessToken, isTempPassword };
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
    return await this.userService.getUserById(id);
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
