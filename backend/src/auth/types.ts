export type AuthConfig = {
  jwtAccessSecret: string;
  jwtRefreshSecret: string;
  jwtAccessExpiration: string;
  jwtRefreshExpiration: string;
  bcryptSaltRounds: number;
  refreshTokenCookieKey: string;
};

export type LoginDto = {
  id: string;
  password: string;
};
