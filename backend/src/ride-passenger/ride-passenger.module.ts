import { RidePassenger } from '@/database/entities';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RidePassengerController } from './ride-passenger.controller';
import { RidePassengerService } from './ride-passenger.service';

@Module({
  imports: [TypeOrmModule.forFeature([RidePassenger])],
  controllers: [RidePassengerController],
  providers: [RidePassengerService],
  exports: [RidePassengerService],
})
export class RidePassengerModule {}
