import { RideModule } from '@/ride/ride.module';
import { UserModule } from '@/user/user.module';
import { WebSocketCoreModule } from '@/websocket/websocket.module';
import { Module } from '@nestjs/common';
import { MapGateway } from './map.gateway';

@Module({
  imports: [WebSocketCoreModule, UserModule, RideModule],
  providers: [MapGateway],
})
export class MapModule {}
