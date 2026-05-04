import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { WsJwtGuard } from './ws-jwt.guard';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET || 'ACCESS_TOKEN_SECRET',
    }),
  ],
  providers: [WsJwtGuard],
  exports: [JwtModule, WsJwtGuard],
})
export class WebSocketCoreModule {}
