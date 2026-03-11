import { IsNotEmpty, IsString } from 'class-validator';

export type AuthConfig = {
  jwtAccessSecret: string;
  jwtRefreshSecret: string;
  jwtAccessExpiration: string;
  jwtRefreshExpiration: string;
  bcryptSaltRounds: number;
  refreshTokenCookieKey: string;
};

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
