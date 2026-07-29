import { Ride } from '@/database/entities';
import { NotificationModule } from '@/notification/notification.module';
import { RidePassengerModule } from '@/ride-passenger/ride-passenger.module';
import { ProximityNotificationService } from '@/ride-proximity-notification/ride-proximity-notification.service';
import { UserModule } from '@/user/user.module';
import { LiveUpdatesService } from '@/websocket/live-updates.service';
import { WebSocketCoreModule } from '@/websocket/websocket.module';
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MapGateway } from './map.gateway';

@Module({
  imports: [
    WebSocketCoreModule,
    forwardRef(() => UserModule),
    TypeOrmModule.forFeature([Ride]),
    forwardRef(() => RidePassengerModule),
    NotificationModule,
  ],
  providers: [MapGateway, ProximityNotificationService, LiveUpdatesService],
  exports: [MapGateway, LiveUpdatesService],
})
export class MapModule {}
