import { NotificationModule } from '@/notification/notification.module';
import { RidePassengerModule } from '@/ride-passenger/ride-passenger.module';
import { ProximityNotificationService } from '@/ride-proximity-notification/ride-proximity-notification.service';
import { RideModule } from '@/ride/ride.module';
import { UserModule } from '@/user/user.module';
import { WebSocketCoreModule } from '@/websocket/websocket.module';
import { forwardRef, Module } from '@nestjs/common';
import { MapGateway } from './map.gateway';

@Module({
  imports: [
    WebSocketCoreModule,
    UserModule,
    forwardRef(() => RideModule),
    RidePassengerModule,
    NotificationModule,
  ],
  providers: [MapGateway, ProximityNotificationService],
  exports: [MapGateway],
})
export class MapModule {}
