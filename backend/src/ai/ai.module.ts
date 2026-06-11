import { BullModule } from '@nestjs/bull';
import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RidePassenger } from '../database/entities/ride-passenger.entity';
import { RideStop } from '../database/entities/ride-stop.entity';
import { Ride } from '../database/entities/ride.entity';
import { User } from '../database/entities/user.entity';
import { AiProcessor } from './ai.processor';
import { AiProducer } from './ai.producer';
import { AiService } from './ai.service';
import { EMBEDDING_QUEUE } from './types';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Ride, RideStop, RidePassenger]),

    BullModule.registerQueueAsync({
      name: EMBEDDING_QUEUE,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
        },
      }),
      inject: [ConfigService],
    }),

    // ── Embedding cache (in-memory LRU; swap the `store` to a Redis
    //    adapter such as `cache-manager-ioredis-yet` for cross-instance
    //    deduplication in a multi-worker deployment) ──────────────────────
    CacheModule.register({
      ttl: 60 * 60 * 1000, // 1 hour in ms
      max: 1000,
    }),
  ],
  providers: [AiService, AiProducer, AiProcessor],
  exports: [AiService, AiProducer, BullModule],
})
export class AiModule {}
