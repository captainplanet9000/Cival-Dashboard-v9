'use client'

import { EventEmitter } from 'events'

export interface ServiceHealth {
  name: string
  status: 'healthy' | 'degraded' | 'down'
  uptime: number
  lastHealthCheck: Date
  responseTime: number
  errorRate: number
  memoryUsage?: number
  cpuUsage?: number
}

export interface SystemMetrics {
  totalUptime: number
  activeServices: number
  totalServices: number
  alertsLast24h: number
  tradesLast24h: number
  avgResponseTime: number
  errorRate: number
  memoryUsage: number
  timestamp: Date
}

export interface OperationalAlert {
  id: string
  severity: 'info' | 'warning' | 'critical' | 'emergency'
  service: string
  message: string
  timestamp: Date
  resolved: boolean
  resolvedAt?: Date
}

export interface BackupStatus {
  lastBackup: Date
  nextScheduled: Date
  status: 'success' | 'failed' | 'in_progress'
  size: number
  location: string
}

export interface FailoverConfig {
  enabled: boolean
  primaryRegion: string
  secondaryRegions: string[]
  autoFailover: boolean
  healthCheckInterval: number
  failoverThreshold: number
}

export class OperationalManager extends EventEmitter {
  private services = new Map<string, ServiceHealth>()
  private alerts = new Map<string, OperationalAlert>()
  private metrics: SystemMetrics
  private backupStatus: BackupStatus
  private failoverConfig: FailoverConfig
  private isOperational = false
  private healthCheckInterval?: NodeJS.Timeout
  private metricsCollectionInterval?: NodeJS.Timeout
  private backupInterval?: NodeJS.Timeout
  private startTime: Date

  constructor() {
    super()
    this.startTime = new Date()
    this.initializeServices()
    this.initializeMetrics()
    this.initializeBackupStatus()
    this.initializeFailover()
    this.startOperationalMonitoring()
  }

  private initializeServices() {
    const serviceNames = [
      'trading-engine',
      'market-data',
      'risk-manager',
      'database',
      'redis-cache',
      'websocket-server',
      'api-gateway',
      'agent-coordinator',
      'portfolio-service',
      'notification-service'
    ]

    serviceNames.forEach(name => {
      this.services.set(name, {
        name,
        status: 'healthy',
        uptime: 0,
        lastHealthCheck: new Date(),
        responseTime: 0,
        errorRate: 0
      })
    })
  }

  private initializeMetrics() {
    this.metrics = {
      totalUptime: 0,
      activeServices: this.services.size,
      totalServices: this.services.size,
      alertsLast24h: 0,
      tradesLast24h: 0,
      avgResponseTime: 0,
      errorRate: 0,
      memoryUsage: 0,
      timestamp: new Date()
    }
  }

  private initializeBackupStatus() {
    this.backupStatus = {
      lastBackup: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
      nextScheduled: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      status: 'success',
      size: 0,
      location: 'cloud-backup-primary'
    }
  }

  private initializeFailover() {
    this.failoverConfig = {
      enabled: true,
      primaryRegion: 'us-east-1',
      secondaryRegions: ['us-west-2', 'eu-west-1'],
      autoFailover: true,
      healthCheckInterval: 30000, // 30 seconds
      failoverThreshold: 3 // 3 failed checks trigger failover
    }
  }

  private startOperationalMonitoring() {
    console.log('🚀 Operational Manager: Starting 24/7 monitoring')

    // Health checks every 30 seconds
    this.healthCheckInterval = setInterval(() => {
      this.performHealthChecks()
    }, 30000)

    // Metrics collection every 60 seconds
    this.metricsCollectionInterval = setInterval(() => {
      this.collectMetrics()
    }, 60000)

    // Backup checks every hour
    this.backupInterval = setInterval(() => {
      this.checkBackupSchedule()
    }, 60 * 60 * 1000)

    this.isOperational = true
    this.emit('systemStarted')
  }

  // Health monitoring
  private async performHealthChecks() {
    try {
      const healthPromises = Array.from(this.services.keys()).map(async (serviceName) => {
        const startTime = Date.now()
        const isHealthy = await this.checkServiceHealth(serviceName)
        const responseTime = Date.now() - startTime

        const service = this.services.get(serviceName)!
        service.responseTime = responseTime
        service.lastHealthCheck = new Date()
        
        if (isHealthy) {
          if (service.status === 'down') {
            this.createAlert('info', serviceName, `Service ${serviceName} is back online`)
          }
          service.status = responseTime > 5000 ? 'degraded' : 'healthy'
          service.uptime = Date.now() - this.startTime.getTime()
        } else {
          if (service.status === 'healthy') {
            this.createAlert('critical', serviceName, `Service ${serviceName} is down`)
          }
          service.status = 'down'
          
          // Auto-restart attempt
          if (this.failoverConfig.autoFailover) {
            await this.attemptServiceRestart(serviceName)
          }
        }

        this.services.set(serviceName, service)
      })

      await Promise.all(healthPromises)
      this.updateSystemStatus()

    } catch (error) {
      console.error('Health check error:', error)
      this.createAlert('critical', 'health-monitor', 'Health monitoring system error')
    }
  }

  private async checkServiceHealth(serviceName: string): Promise<boolean> {
    // Mock health checks - in production would make actual HTTP calls
    try {
      switch (serviceName) {
        case 'database':
          // Check database connectivity
          return await this.checkDatabase()
        
        case 'redis-cache':
          // Check Redis connectivity
          return await this.checkRedis()
        
        case 'trading-engine':
          // Check trading engine status
          return await this.checkTradingEngine()
        
        case 'market-data':
          // Check market data feeds
          return await this.checkMarketData()
        
        default:
          // Generic service check
          const random = Math.random()
          return random > 0.05 // 95% uptime simulation
      }
    } catch (error) {
      return false
    }
  }

  private async checkDatabase(): Promise<boolean> {
    // Mock database check
    return new Promise(resolve => {
      setTimeout(() => resolve(Math.random() > 0.02), 100) // 98% uptime
    })
  }

  private async checkRedis(): Promise<boolean> {
    // Mock Redis check
    return new Promise(resolve => {
      setTimeout(() => resolve(Math.random() > 0.01), 50) // 99% uptime
    })
  }

  private async checkTradingEngine(): Promise<boolean> {
    // Mock trading engine check
    return new Promise(resolve => {
      setTimeout(() => resolve(Math.random() > 0.03), 200) // 97% uptime
    })
  }

  private async checkMarketData(): Promise<boolean> {
    // Mock market data check
    return new Promise(resolve => {
      setTimeout(() => resolve(Math.random() > 0.05), 150) // 95% uptime
    })
  }

  private async attemptServiceRestart(serviceName: string) {
    console.log(`🔄 Attempting to restart service: ${serviceName}`)
    
    try {
      // Mock restart logic
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const success = Math.random() > 0.3 // 70% restart success rate
      
      if (success) {
        console.log(`✅ Service ${serviceName} restarted successfully`)
        this.createAlert('info', serviceName, `Service ${serviceName} restarted automatically`)
      } else {
        console.log(`❌ Failed to restart service: ${serviceName}`)
        this.createAlert('critical', serviceName, `Failed to restart ${serviceName} - manual intervention required`)
      }
      
      return success
    } catch (error) {
      console.error(`Error restarting ${serviceName}:`, error)
      return false
    }
  }

  // Metrics collection
  private collectMetrics() {
    try {
      const healthyServices = Array.from(this.services.values()).filter(s => s.status === 'healthy').length
      const totalResponseTime = Array.from(this.services.values()).reduce((sum, s) => sum + s.responseTime, 0)
      const avgResponseTime = totalResponseTime / this.services.size

      // Mock additional metrics
      const memoryUsage = typeof window !== 'undefined' && (performance as any).memory ? 
        (performance as any).memory.usedJSHeapSize / (performance as any).memory.jsHeapSizeLimit : 
        Math.random() * 0.8 // Mock memory usage

      this.metrics = {
        totalUptime: Date.now() - this.startTime.getTime(),
        activeServices: healthyServices,
        totalServices: this.services.size,
        alertsLast24h: this.getAlertsCount(24),
        tradesLast24h: Math.floor(Math.random() * 10000), // Mock trades
        avgResponseTime,
        errorRate: ((this.services.size - healthyServices) / this.services.size) * 100,
        memoryUsage: memoryUsage * 100,
        timestamp: new Date()
      }

      this.emit('metricsUpdated', this.metrics)

    } catch (error) {
      console.error('Metrics collection error:', error)
    }
  }

  // Backup management
  private checkBackupSchedule() {
    const now = new Date()
    
    if (now >= this.backupStatus.nextScheduled) {
      this.performBackup()
    }
  }

  private async performBackup() {
    console.log('💾 Starting automated backup...')
    
    this.backupStatus.status = 'in_progress'
    
    try {
      // Mock backup process
      await new Promise(resolve => setTimeout(resolve, 5000))
      
      const success = Math.random() > 0.05 // 95% backup success rate
      
      if (success) {
        this.backupStatus = {
          lastBackup: new Date(),
          nextScheduled: new Date(Date.now() + 24 * 60 * 60 * 1000),
          status: 'success',
          size: Math.floor(Math.random() * 1000000000), // Random size in bytes
          location: this.backupStatus.location
        }
        
        console.log('✅ Backup completed successfully')
        this.createAlert('info', 'backup-service', 'Automated backup completed successfully')
      } else {
        this.backupStatus.status = 'failed'
        console.log('❌ Backup failed')
        this.createAlert('warning', 'backup-service', 'Automated backup failed - retrying in 1 hour')
        
        // Retry in 1 hour
        this.backupStatus.nextScheduled = new Date(Date.now() + 60 * 60 * 1000)
      }
      
    } catch (error) {
      console.error('Backup error:', error)
      this.backupStatus.status = 'failed'
      this.createAlert('critical', 'backup-service', 'Backup system error')
    }
  }

  // Alert management
  private createAlert(
    severity: OperationalAlert['severity'],
    service: string,
    message: string
  ) {
    const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const alert: OperationalAlert = {
      id: alertId,
      severity,
      service,
      message,
      timestamp: new Date(),
      resolved: false
    }
    
    this.alerts.set(alertId, alert)
    this.emit('operationalAlert', alert)
    
    console.log(`🚨 [${severity.toUpperCase()}] ${service}: ${message}`)
  }

  private updateSystemStatus() {
    const healthyServices = Array.from(this.services.values()).filter(s => s.status === 'healthy').length
    const criticalServices = Array.from(this.services.values()).filter(s => s.status === 'down').length
    
    if (criticalServices > 0) {
      this.emit('systemDegraded', { healthyServices, criticalServices })
    }
    
    if (criticalServices >= this.services.size * 0.5) {
      this.createAlert('emergency', 'system', 'System-wide failure detected - immediate attention required')
      this.emit('systemFailure', { healthyServices, criticalServices })
    }
  }

  private getAlertsCount(hours: number): number {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000)
    return Array.from(this.alerts.values()).filter(a => a.timestamp >= cutoff).length
  }

  // Failover management
  async triggerFailover(targetRegion?: string) {
    const region = targetRegion || this.failoverConfig.secondaryRegions[0]
    
    console.log(`🔄 Triggering failover to region: ${region}`)
    this.createAlert('warning', 'failover', `Initiating failover to ${region}`)
    
    try {
      // Mock failover process
      await new Promise(resolve => setTimeout(resolve, 10000))
      
      this.failoverConfig.primaryRegion = region
      console.log(`✅ Failover to ${region} completed`)
      this.createAlert('info', 'failover', `Failover to ${region} completed successfully`)
      
      this.emit('failoverCompleted', region)
      return true
      
    } catch (error) {
      console.error('Failover failed:', error)
      this.createAlert('critical', 'failover', 'Failover failed - manual intervention required')
      return false
    }
  }

  // Public API methods
  getSystemMetrics(): SystemMetrics {
    return this.metrics
  }

  getServiceHealth(): ServiceHealth[] {
    return Array.from(this.services.values())
  }

  getActiveAlerts(): OperationalAlert[] {
    return Array.from(this.alerts.values()).filter(a => !a.resolved)
  }

  resolveAlert(alertId: string) {
    const alert = this.alerts.get(alertId)
    if (alert) {
      alert.resolved = true
      alert.resolvedAt = new Date()
      this.alerts.set(alertId, alert)
      this.emit('alertResolved', alert)
    }
  }

  getBackupStatus(): BackupStatus {
    return this.backupStatus
  }

  getFailoverConfig(): FailoverConfig {
    return this.failoverConfig
  }

  updateFailoverConfig(config: Partial<FailoverConfig>) {
    this.failoverConfig = { ...this.failoverConfig, ...config }
    console.log('🔧 Failover configuration updated')
  }

  // Force backup
  async forceBackup(): Promise<boolean> {
    console.log('💾 Manual backup triggered')
    await this.performBackup()
    return this.backupStatus.status === 'success'
  }

  // System control
  isSystemOperational(): boolean {
    return this.isOperational && this.metrics.activeServices >= this.metrics.totalServices * 0.7
  }

  getUptime(): number {
    return Date.now() - this.startTime.getTime()
  }

  // Cleanup
  stop() {
    this.isOperational = false
    
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
    }
    if (this.metricsCollectionInterval) {
      clearInterval(this.metricsCollectionInterval)
    }
    if (this.backupInterval) {
      clearInterval(this.backupInterval)
    }
    
    console.log('🛑 Operational Manager stopped')
    this.emit('systemStopped')
  }
}

// Singleton instance
export const operationalManager = new OperationalManager()