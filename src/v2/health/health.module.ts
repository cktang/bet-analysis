import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { SystemHealthService } from './system-health.service';

@Module({
  controllers: [HealthController],
  providers: [SystemHealthService],
  exports: [SystemHealthService],
})
export class HealthModule {}