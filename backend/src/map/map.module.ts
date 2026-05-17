import { NotificationModule } from '@/notification/notification.module';
import { RidePassengerModule } from '@/ride-passenger/ride-passenger.module';
import { ProximityNotificationService } from '@/ride-proximity-notification/ride-proximity-notification.service';
import { RideModule } from '@/ride/ride.module';
import { UserModule } from '@/user/user.module';
import { WebSocketCoreModule } from '@/websocket/websocket.module';
import { Module } from '@nestjs/common';
import { MapGateway } from './map.gateway';

@Module({
  imports: [
    WebSocketCoreModule,
    UserModule,
    RideModule,
    RidePassengerModule,
    NotificationModule,
  ],
  providers: [MapGateway, ProximityNotificationService],
})
export class MapModule {}
