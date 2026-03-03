import { Body, Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { AccessTokenGuard } from './accessToken.guard';
import { AuthService } from './auth.service';
import { RefreshTokenGuard } from './refreshToken.guard';

class LoginDto {
  id: string;
  password: string;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.login(body.id, body.password);
    this.authService.setCookies(res, tokens.refresh_token);
    return { access_token: tokens.access_token };
  }

  @UseGuards(AccessTokenGuard)
  @Post('logout')
  async logout(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    const userId = req.user?.sub;
    this.authService.clearCookies(res);
    return this.authService.logout(userId);
  }

  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  async refresh(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    const userId = req.user?.sub;
    const refreshToken = req.user?.refreshToken;
    const tokens = await this.authService.refreshTokens(userId, refreshToken);
    this.authService.setCookies(res, tokens.refresh_token);
    return { access_token: tokens.access_token };
  }
}
