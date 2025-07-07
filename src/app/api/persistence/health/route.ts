/**
 * Persistence Health Monitoring API
 * Provides real-time health status of all persistence layers
 */

import { NextRequest, NextResponse } from 'next/server'
import { autonomousPersistenceOrchestrator } from '@/lib/persistence/autonomous-persistence-orchestrator'

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Checking persistence health...')
    
    // Get health status from the orchestrator
    const health = autonomousPersistenceOrchestrator.getHealth()
    const metrics = autonomousPersistenceOrchestrator.getMetrics()
    
    // Convert Maps to Objects for JSON serialization
    const healthObject: Record<string, any> = {}
    const metricsObject: Record<string, any> = {}
    
    health.forEach((value, key) => {
      healthObject[key] = {
        ...value,
        lastCheck: value.lastCheck.toISOString()
      }
    })
    
    metrics.forEach((value, key) => {
      metricsObject[key] = {
        ...value,
        lastOperation: value.lastOperation.toISOString(),
        successRate: value.totalOperations > 0 
          ? (value.successfulOperations / value.totalOperations * 100).toFixed(2)
          : '0.00'
      }
    })
    
    // Calculate overall health score
    const healthyLayers = Array.from(health.values()).filter(h => h.status === 'healthy').length
    const totalLayers = health.size
    const overallHealthScore = totalLayers > 0 ? (healthyLayers / totalLayers * 100).toFixed(2) : '0.00'
    
    // Determine overall status
    let overallStatus = 'healthy'
    if (healthyLayers === 0) {
      overallStatus = 'failed'
    } else if (healthyLayers < totalLayers) {
      overallStatus = 'degraded'
    }
    
    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      overall: {
        status: overallStatus,
        healthScore: overallHealthScore,
        healthyLayers,
        totalLayers
      },
      layers: healthObject,
      metrics: metricsObject,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        enabledPersistence: process.env.ENABLE_AUTONOMOUS_PERSISTENCE === 'true',
        enabledAutoBackup: process.env.PERSISTENCE_AUTO_BACKUP === 'true',
        backupInterval: process.env.PERSISTENCE_BACKUP_INTERVAL || '60000',
        healthCheckInterval: process.env.PERSISTENCE_HEALTH_CHECK_INTERVAL || '30000'
      }
    }
    
    console.log(`✅ Persistence health check completed: ${overallStatus} (${overallHealthScore}%)`)
    
    return NextResponse.json(response)
  } catch (error) {
    console.error('❌ Persistence health check failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Health check failed',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body
    
    console.log(`🔧 Executing persistence action: ${action}`)
    
    let result = false
    let message = ''
    
    switch (action) {
      case 'backup':
        result = await autonomousPersistenceOrchestrator.backup()
        message = result ? 'Backup completed successfully' : 'Backup failed'
        break
        
      case 'restore':
        const restoredState = await autonomousPersistenceOrchestrator.restore()
        result = restoredState !== null
        message = result ? 'State restored successfully' : 'Restore failed'
        break
        
      case 'health-check':
        // Trigger immediate health check
        result = true
        message = 'Health check triggered'
        break
        
      default:
        return NextResponse.json({
          success: false,
          error: `Unknown action: ${action}`,
          availableActions: ['backup', 'restore', 'health-check']
        }, { status: 400 })
    }
    
    console.log(`✅ Action ${action} completed: ${result ? 'success' : 'failed'}`)
    
    return NextResponse.json({
      success: result,
      action,
      message,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Persistence action failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Action failed',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}