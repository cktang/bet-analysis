import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface HealthMetrics {
  timestamp: number;
  system: {
    cpuUsage: number;
    memoryUsage: {
      used: number;
      total: number;
      percentage: number;
    };
    diskUsage: {
      used: number;
      total: number;
      percentage: number;
      status?: string; // 🎯 BETTING: Track data directory accessibility
    };
    uptime: number;
  };
  services: {
    [serviceName: string]: {
      status: 'healthy' | 'warning' | 'error';
      lastActivity: number;
      errorCount: number;
      responseTime?: number;
    };
  };
  alerts: Array<{
    id: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
    message: string;
    timestamp: number;
    service?: string;
  }>;
}

@Injectable()
export class SystemHealthService {
  private healthMetrics: HealthMetrics;
  private serviceHealthChecks: Map<string, any> = new Map();
  private alerts: Array<any> = [];
  private errorCounts: Map<string, number> = new Map();

  constructor() {
    this.healthMetrics = {
      timestamp: Date.now(),
      system: {
        cpuUsage: 0,
        memoryUsage: { used: 0, total: 0, percentage: 0 },
        diskUsage: { used: 0, total: 0, percentage: 0 },
        uptime: 0
      },
      services: {},
      alerts: []
    };
  }

  async onModuleInit() {
    console.log('🏥 System Health Service initialized');
    // Don't await this to prevent blocking startup
    this.collectHealthMetrics().catch(error => {
      console.warn('⚠️ Initial health check failed:', error.message);
    });
  }

  @Cron('0 */5 * * * *') // Every 5 minutes
  async scheduledHealthCheck() {
    await this.collectHealthMetrics();
    await this.checkServiceHealth();
    await this.checkAlerts();
    await this.saveHealthMetrics();
  }

  async collectHealthMetrics(): Promise<void> {
    try {
      // System metrics
      const cpus = os.cpus();
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;
      
      // Simple data directory access check (no intensive scanning)
      const diskStats = await this.getSimpleDiskCheck();
      
      this.healthMetrics = {
        timestamp: Date.now(),
        system: {
          cpuUsage: await this.getCPUUsage(),
          memoryUsage: {
            used: usedMem,
            total: totalMem,
            percentage: (usedMem / totalMem) * 100
          },
          diskUsage: diskStats,
          uptime: os.uptime()
        },
        services: { ...this.healthMetrics.services },
        alerts: this.alerts.slice(-50) // Keep last 50 alerts
      };
      
      console.log(`🏥 Health metrics updated - CPU: ${this.healthMetrics.system.cpuUsage.toFixed(1)}%, Memory: ${this.healthMetrics.system.memoryUsage.percentage.toFixed(1)}%`);
    } catch (error) {
      console.error('❌ Error collecting health metrics:', error);
      this.addAlert('error', 'Failed to collect system health metrics', 'HealthService');
    }
  }

  private async getCPUUsage(): Promise<number> {
    return new Promise((resolve) => {
      const startMeasures = this.cpuAverage();
      
      setTimeout(() => {
        const endMeasures = this.cpuAverage();
        const idleDifference = endMeasures.idle - startMeasures.idle;
        const totalDifference = endMeasures.total - startMeasures.total;
        const percentageCPU = 100 - ~~(100 * idleDifference / totalDifference);
        resolve(percentageCPU);
      }, 1000);
    });
  }

  private cpuAverage(): { idle: number; total: number } {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;
    
    for (const cpu of cpus) {
      for (const type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    }
    
    return { idle: totalIdle / cpus.length, total: totalTick / cpus.length };
  }

  private async getSimpleDiskCheck(): Promise<any> {
    try {
      // 🎯 BETTING FOCUS: Just verify data directory is accessible
      const dataDir = path.join(process.cwd(), 'data');
      await fs.promises.access(dataDir, fs.constants.R_OK | fs.constants.W_OK);
      
      // Return minimal info - we only care about accessibility for betting
      return { 
        used: 0,
        total: 1, 
        percentage: 0, // No scanning = no meaningful percentage
        status: 'accessible'
      };
    } catch (error) {
      console.warn(`🚨 Data directory access failed: ${(error as Error).message}`);
      return { used: 0, total: 1, percentage: 100, status: 'inaccessible' };
    }
  }

  async checkServiceHealth(): Promise<void> {
    // Define health checks for each service
    const healthChecks = [
      { name: 'DataCollection', check: () => this.checkDataCollectionHealth() },
      { name: 'DataProcessing', check: () => this.checkDataProcessingHealth() },
      { name: 'Analysis', check: () => this.checkAnalysisHealth() },
      { name: 'LiveTrading', check: () => this.checkLiveTradingHealth() },
      { name: 'Database', check: () => this.checkDatabaseHealth() }
    ];
    
    for (const healthCheck of healthChecks) {
      try {
        const result = await healthCheck.check();
        this.healthMetrics.services[healthCheck.name] = {
          status: result.status,
          lastActivity: result.lastActivity || Date.now(),
          errorCount: this.errorCounts.get(healthCheck.name) || 0,
          responseTime: result.responseTime
        };
        
        // Reset error count on successful check
        if (result.status === 'healthy') {
          this.errorCounts.set(healthCheck.name, 0);
        }
      } catch (error: any) {
        const errorCount = (this.errorCounts.get(healthCheck.name) || 0) + 1;
        this.errorCounts.set(healthCheck.name, errorCount);
        
        this.healthMetrics.services[healthCheck.name] = {
          status: 'error',
          lastActivity: Date.now(),
          errorCount
        };
        
        this.addAlert('error', `Health check failed for ${healthCheck.name}: ${error.message}`, healthCheck.name);
      }
    }
  }

  private async checkDataCollectionHealth(): Promise<any> {
    const startTime = Date.now();
    
    // Check if recent odds data exists
    const oddsDir = path.join(process.cwd(), 'data', 'odds-movement');
    if (!fs.existsSync(oddsDir)) {
      return { status: 'warning', lastActivity: 0, responseTime: Date.now() - startTime };
    }
    
    const files = fs.readdirSync(oddsDir);
    const recentFiles = files.filter(file => {
      const timestamp = parseInt(file.replace('.json', ''));
      return Date.now() - timestamp < 2 * 60 * 60 * 1000; // 2 hours
    });
    
    const status = recentFiles.length > 0 ? 'healthy' : 'warning';
    const lastActivity = recentFiles.length > 0 ? 
      Math.max(...recentFiles.map(f => parseInt(f.replace('.json', '')))) : 0;
    
    return { status, lastActivity, responseTime: Date.now() - startTime };
  }

  private async checkDataProcessingHealth(): Promise<any> {
    const startTime = Date.now();
    
    // Check if processed data exists and is recent
    const processedDir = path.join(process.cwd(), 'data', 'processed');
    if (!fs.existsSync(processedDir)) {
      return { status: 'warning', lastActivity: 0, responseTime: Date.now() - startTime };
    }
    
    const files = fs.readdirSync(processedDir);
    const currentSeason = this.getCurrentSeason();
    const seasonFile = files.find(f => f.includes(currentSeason));
    
    const status = seasonFile ? 'healthy' : 'warning';
    const lastActivity = seasonFile ? 
      fs.statSync(path.join(processedDir, seasonFile)).mtime.getTime() : 0;
    
    return { status, lastActivity, responseTime: Date.now() - startTime };
  }

  private async checkAnalysisHealth(): Promise<any> {
    const startTime = Date.now();
    
    try {
      // Check if strategy and factor files exist
      const strategyFile = path.join(process.cwd(), 'src', 'pattern-discovery', 'strategy.json');
      const factorFile = path.join(process.cwd(), 'src', 'pattern-discovery', 'factor_definitions.json');
      
      const strategyExists = fs.existsSync(strategyFile);
      const factorExists = fs.existsSync(factorFile);
      
      const status = (strategyExists && factorExists) ? 'healthy' : 'warning';
      const lastActivity = strategyExists ? 
        fs.statSync(strategyFile).mtime.getTime() : 0;
      
      return { status, lastActivity, responseTime: Date.now() - startTime };
    } catch (error) {
      return { status: 'warning', lastActivity: 0, responseTime: Date.now() - startTime };
    }
  }

  private async checkLiveTradingHealth(): Promise<any> {
    const startTime = Date.now();
    
    // Check if trading results directory exists and has recent activity
    const resultsDir = path.join(process.cwd(), 'data', 'results');
    if (!fs.existsSync(resultsDir)) {
      return { status: 'healthy', lastActivity: 0, responseTime: Date.now() - startTime };
    }
    
    const summaryFile = path.join(resultsDir, 'system_summary.json');
    const status = fs.existsSync(summaryFile) ? 'healthy' : 'warning';
    const lastActivity = fs.existsSync(summaryFile) ? 
      fs.statSync(summaryFile).mtime.getTime() : 0;
    
    return { status, lastActivity, responseTime: Date.now() - startTime };
  }

  private async checkDatabaseHealth(): Promise<any> {
    const startTime = Date.now();
    
    // Check data directory accessibility
    const dataDir = path.join(process.cwd(), 'data');
    try {
      await fs.promises.access(dataDir, fs.constants.R_OK | fs.constants.W_OK);
      return { status: 'healthy', lastActivity: Date.now(), responseTime: Date.now() - startTime };
    } catch (error) {
      return { status: 'error', lastActivity: 0, responseTime: Date.now() - startTime };
    }
  }

  async checkAlerts(): Promise<void> {
    // Check system resource alerts
    if (this.healthMetrics.system.memoryUsage.percentage > 90) {
      this.addAlert('critical', `High memory usage: ${this.healthMetrics.system.memoryUsage.percentage.toFixed(1)}%`, 'System');
    } else if (this.healthMetrics.system.memoryUsage.percentage > 80) {
      this.addAlert('warning', `Memory usage: ${this.healthMetrics.system.memoryUsage.percentage.toFixed(1)}%`, 'System');
    }
    
    if (this.healthMetrics.system.cpuUsage > 90) {
      this.addAlert('critical', `High CPU usage: ${this.healthMetrics.system.cpuUsage.toFixed(1)}%`, 'System');
    } else if (this.healthMetrics.system.cpuUsage > 80) {
      this.addAlert('warning', `CPU usage: ${this.healthMetrics.system.cpuUsage.toFixed(1)}%`, 'System');
    }
    
    // 🎯 BETTING FOCUS: Only alert if data directory is inaccessible
    if (this.healthMetrics.system.diskUsage.status === 'inaccessible') {
      this.addAlert('critical', 'Cannot access data directory for betting operations', 'System');
    }
    
    // Check service alerts
    Object.entries(this.healthMetrics.services).forEach(([serviceName, serviceHealth]) => {
      if (serviceHealth.status === 'error') {
        if (serviceHealth.errorCount >= 5) {
          this.addAlert('critical', `Service ${serviceName} has failed ${serviceHealth.errorCount} consecutive health checks`, serviceName);
        } else if (serviceHealth.errorCount >= 3) {
          this.addAlert('warning', `Service ${serviceName} has failed ${serviceHealth.errorCount} health checks`, serviceName);
        }
      }
      
      // Check for stale services (no activity in 6 hours)
      const sixHoursAgo = Date.now() - 6 * 60 * 60 * 1000;
      if (serviceHealth.lastActivity < sixHoursAgo) {
        this.addAlert('warning', `Service ${serviceName} has been inactive for over 6 hours`, serviceName);
      }
    });
  }

  private addAlert(severity: string, message: string, service?: string): void {
    const alertId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Check if similar alert already exists in last hour
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const recentSimilarAlert = this.alerts.find(alert => 
      alert.message === message && 
      alert.service === service && 
      alert.timestamp > oneHourAgo
    );
    
    if (recentSimilarAlert) {
      return; // Don't duplicate recent alerts
    }
    
    const alert = {
      id: alertId,
      severity,
      message,
      timestamp: Date.now(),
      service
    };
    
    this.alerts.push(alert);
    console.log(`🚨 Health Alert [${severity.toUpperCase()}] ${service ? `[${service}] ` : ''}${message}`);
    
    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }
  }

  private async saveHealthMetrics(): Promise<void> {
    try {
      const healthDir = path.join(process.cwd(), 'data', 'health');
      if (!fs.existsSync(healthDir)) {
        fs.mkdirSync(healthDir, { recursive: true });
      }
      
      // Save current metrics
      const metricsPath = path.join(healthDir, 'current_metrics.json');
      await fs.promises.writeFile(metricsPath, JSON.stringify(this.healthMetrics, null, 2));
      
      // Save historical metrics (daily summary)
      const today = new Date().toISOString().split('T')[0];
      const historicalPath = path.join(healthDir, `metrics_${today}.json`);
      
      let historicalData = [];
      if (fs.existsSync(historicalPath)) {
        historicalData = JSON.parse(fs.readFileSync(historicalPath, 'utf8'));
      }
      
      historicalData.push({
        timestamp: this.healthMetrics.timestamp,
        cpuUsage: this.healthMetrics.system.cpuUsage,
        memoryUsage: this.healthMetrics.system.memoryUsage.percentage,
        diskUsage: this.healthMetrics.system.diskUsage.percentage,
        serviceHealth: Object.fromEntries(
          Object.entries(this.healthMetrics.services).map(([name, health]) => [name, health.status])
        )
      });
      
      // Keep only last 24 hours of data points
      if (historicalData.length > 288) { // 24 hours * 12 (5-minute intervals)
        historicalData = historicalData.slice(-288);
      }
      
      await fs.promises.writeFile(historicalPath, JSON.stringify(historicalData, null, 2));
    } catch (error) {
      console.error('❌ Error saving health metrics:', error);
    }
  }

  private getCurrentSeason(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    if (month >= 7) {
      return `${year}-${year + 1}`;
    } else {
      return `${year - 1}-${year}`;
    }
  }

  getHealthMetrics(): HealthMetrics {
    return this.healthMetrics;
  }

  getServiceHealth(serviceName?: string): any {
    if (serviceName) {
      return this.healthMetrics.services[serviceName] || null;
    }
    return this.healthMetrics.services;
  }

  getAlerts(severityFilter?: string): Array<any> {
    if (severityFilter) {
      return this.alerts.filter(alert => alert.severity === severityFilter);
    }
    return this.alerts;
  }

  getSystemSummary(): any {
    const now = Date.now();
    const recentAlerts = this.alerts.filter(alert => now - alert.timestamp < 24 * 60 * 60 * 1000);
    const criticalAlerts = recentAlerts.filter(alert => alert.severity === 'critical');
    const warningAlerts = recentAlerts.filter(alert => alert.severity === 'warning');
    
    const healthyServices = Object.values(this.healthMetrics.services).filter(s => s.status === 'healthy').length;
    const totalServices = Object.keys(this.healthMetrics.services).length;
    
    return {
      overallStatus: criticalAlerts.length > 0 ? 'critical' : 
                    warningAlerts.length > 0 ? 'warning' : 'healthy',
      systemHealth: {
        cpu: this.healthMetrics.system.cpuUsage,
        memory: this.healthMetrics.system.memoryUsage.percentage,
        disk: this.healthMetrics.system.diskUsage.percentage,
        uptime: this.healthMetrics.system.uptime
      },
      serviceHealth: {
        healthy: healthyServices,
        total: totalServices,
        percentage: totalServices > 0 ? (healthyServices / totalServices) * 100 : 0
      },
      alerts: {
        critical: criticalAlerts.length,
        warning: warningAlerts.length,
        total: recentAlerts.length
      },
      lastUpdated: this.healthMetrics.timestamp
    };
  }

  async manualHealthCheck(): Promise<void> {
    console.log('🏥 Manual health check triggered');
    await this.collectHealthMetrics();
    await this.checkServiceHealth();
    await this.checkAlerts();
    await this.saveHealthMetrics();
  }
}