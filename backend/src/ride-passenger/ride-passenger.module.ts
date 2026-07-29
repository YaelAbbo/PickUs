import { RidePassenger } from '@/database/entities';
import { MapModule } from '@/map/map.module';
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RidePassengerController } from './ride-passenger.controller';
import { RidePassengerService } from './ride-passenger.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([RidePassenger]),
    forwardRef(() => MapModule),
  ],
  controllers: [RidePassengerController],
  providers: [RidePassengerService],
  exports: [RidePassengerService],
})
export class RidePassengerModule {}
