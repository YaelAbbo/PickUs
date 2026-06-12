import { Ride } from '@/database/entities';
import { NotificationModule } from '@/notification/notification.module';
import { RidePassengerModule } from '@/ride-passenger/ride-passenger.module';
import { ProximityNotificationService } from '@/ride-proximity-notification/ride-proximity-notification.service';
import { UserModule } from '@/user/user.module';
import { WebSocketCoreModule } from '@/websocket/websocket.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MapGateway } from './map.gateway';

@Module({
  imports: [
    WebSocketCoreModule,
    UserModule,
    TypeOrmModule.forFeature([Ride]),
    RidePassengerModule,
    NotificationModule,
  ],
  providers: [MapGateway, ProximityNotificationService],
  exports: [MapGateway],
})
export class MapModule {}
