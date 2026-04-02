import { UseAccessAuth } from '@/auth/decorators';
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
} from '@nestjs/common';
import { LocationUpdatePayload } from './map.types';

@Controller('map')
export class MapController {
  private readonly logger = new Logger(MapController.name);

  @Post()
  @HttpCode(HttpStatus.OK)
  @UseAccessAuth()
  handleLocationUpdate(@Body() geoJSON: LocationUpdatePayload) {
    this.logger.log(`Received location update: ${JSON.stringify(geoJSON)}`);

    return {
      status: 'success',
      message: 'Location received',
      timestamp: new Date().toISOString(),
    };
  }
}
