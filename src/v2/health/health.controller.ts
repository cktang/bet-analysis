import { Controller, Get, Post, Query } from '@nestjs/common';
import { SystemHealthService } from './system-health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly systemHealthService: SystemHealthService) {}

  @Get('/')
  getOverallHealth() {
    return this.systemHealthService.getSystemSummary();
  }

  @Get('metrics')
  getDetailedMetrics() {
    return this.systemHealthService.getHealthMetrics();
  }

  @Get('services')
  getServiceHealth(@Query('service') serviceName?: string) {
    return this.systemHealthService.getServiceHealth(serviceName);
  }

  @Get('alerts')
  getAlerts(@Query('severity') severity?: string) {
    return this.systemHealthService.getAlerts(severity);
  }

  @Get('system')
  getSystemHealth() {
    const metrics = this.systemHealthService.getHealthMetrics();
    return {
      cpu: metrics.system.cpuUsage,
      memory: metrics.system.memoryUsage,
      disk: metrics.system.diskUsage,
      uptime: metrics.system.uptime,
      timestamp: metrics.timestamp
    };
  }

  @Post('check')
  async manualHealthCheck() {
    await this.systemHealthService.manualHealthCheck();
    return { message: 'Manual health check completed' };
  }

  @Get('status')
  getHealthStatus() {
    return {
      service: 'System Health Service',
      status: 'operational',
      timestamp: Date.now()
    };
  }
}