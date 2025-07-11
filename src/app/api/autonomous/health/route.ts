import { NextRequest, NextResponse } from 'next/server'

// Health monitoring API endpoints
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
    switch (action) {
      case 'status':
        return NextResponse.json({
          success: true,
          data: {
            overall_health: 'healthy',
            services: {
              total: 6,
              healthy: 5,
              unhealthy: 1
            },
            alerts: {
              active: 2,
              critical: 0,
              warning: 2
            },
            resources: {
              cpu_percent: 45.2,
              memory_percent: 67.8,
              memory_available_mb: 2048,
              disk_percent: 23.4,
              disk_free_gb: 125
            },
            recovery: {
              auto_recovery_enabled: true,
              total_recovery_attempts: 8,
              successful_recoveries: 7
            },
            monitoring: {
              monitored_services: 6,
              check_interval_seconds: 30,
              uptime_seconds: 634800
            }
          }
        })
      
      case 'services':
        return NextResponse.json({
          success: true,
          data: [
            {
              service_name: 'autonomous_health_monitor',
              health: 'healthy',
              uptime_seconds: 634800,
              response_time_ms: 45,
              error_count: 0,
              metrics: {
                response_time: {
                  value: 45,
                  threshold: 5000,
                  status: 'healthy'
                }
              },
              dependencies: ['enhanced_database_service'],
              auto_recovery_enabled: true,
              restart_count: 0
            },
            {
              service_name: 'autonomous_agent_coordinator',
              health: 'healthy',
              uptime_seconds: 634567,
              response_time_ms: 78,
              error_count: 1,
              last_error: 'Minor coordination timeout (recovered)',
              dependencies: ['autonomous_state_persistence'],
              auto_recovery_enabled: true,
              restart_count: 0
            }
          ]
        })
      
      case 'alerts':
        return NextResponse.json({
          success: true,
          data: [
            {
              alert_id: 'alert-001',
              service_name: 'autonomous_state_persistence',
              severity: 'warning',
              message: 'Response time above threshold (156ms)',
              details: { response_time: 156, threshold: 100 },
              recovery_action: 'restart_service',
              created_at: new Date(Date.now() - 120000).toISOString(),
              auto_resolved: false
            }
          ]
        })
      
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action parameter'
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Health API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, service_name } = body
    
    switch (action) {
      case 'restart_service':
        // Simulate service restart
        return NextResponse.json({
          success: true,
          message: `Service ${service_name} restart initiated`,
          data: {
            service_name,
            action: 'restart',
            timestamp: new Date().toISOString()
          }
        })
      
      case 'update_config':
        // Simulate configuration update
        return NextResponse.json({
          success: true,
          message: `Service ${service_name} configuration updated`,
          data: {
            service_name,
            action: 'config_update',
            timestamp: new Date().toISOString()
          }
        })
      
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Health API POST error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}