import { Controller, Get } from '@nestjs/common';
import {
  DiskHealthIndicator,
  HealthCheck,
  HealthCheckService,
  MemoryHealthIndicator,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      // 1. Database: Ensure Postgres is responding
      () => this.db.pingCheck('database'),

      // 2. Memory (Heap): Ensure the app isn't leaking memory
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024), // Threshold is 150MB

      // 3. Memory (RSS): Total memory allocated to the process
      () => this.memory.checkRSS('memory_rss', 300 * 1024 * 1024),

      // 4. Disk: Ensure the container has at least 10% free space (max 90% used)
      () =>
        this.disk.checkStorage('storage', { path: '/', thresholdPercent: 0.9 }),
    ]);
  }
}
