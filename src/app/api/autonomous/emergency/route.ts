import { NextRequest, NextResponse } from 'next/server'

// Emergency protocols API endpoints
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
    switch (action) {
      case 'status':
        return NextResponse.json({
          success: true,
          data: {
            emergency_mode_active: false,
            system_halted: false,
            autonomous_mode_suspended: false,
            active_emergencies: 0,
            active_emergency_details: [],
            circuit_breakers_active: 4,
            emergency_conditions_monitored: 4,
            metrics: {
              total_emergencies: 12,
              emergencies_today: 0,
              circuit_breaker_triggers: 3,
              auto_recoveries: 8,
              manual_interventions: 4,
              system_downtime_seconds: 0,
              average_response_time: 2.3
            },
            last_health_check: new Date().toISOString()
          }
        })
      
      case 'history':
        const limit = parseInt(searchParams.get('limit') || '10')
        
        return NextResponse.json({
          success: true,
          data: [
            {
              event_id: 'event-001',
              emergency_type: 'risk_breach',
              severity: 'high',
              trigger_condition: 'Portfolio loss exceeded 4.2% threshold',
              triggered_at: new Date(Date.now() - 3600000).toISOString(),
              resolved_at: new Date(Date.now() - 3300000).toISOString(),
              actions_taken: ['reduce_positions', 'pause_agents', 'notify_operators'],
              impact_assessment: {
                portfolio_impact: -0.042,
                recovery_time: 300,
                financial_impact: -15000
              },
              resolution_notes: 'Auto-recovery: positions reduced by 30%, risk normalized',
              auto_resolved: true,
              metadata: {
                trigger_value: 0.042,
                threshold: 0.04
              }
            },
            {
              event_id: 'event-002',
              emergency_type: 'market_crash',
              severity: 'critical',
              trigger_condition: 'Volatility spike detected at 6.8%',
              triggered_at: new Date(Date.now() - 7200000).toISOString(),
              resolved_at: new Date(Date.now() - 6900000).toISOString(),
              actions_taken: ['halt_all_trading', 'emergency_hedge', 'notify_operators'],
              impact_assessment: {
                portfolio_impact: -0.018,
                recovery_time: 180,
                financial_impact: -8500
              },
              resolution_notes: 'Manual intervention: trading resumed after market stabilization',
              auto_resolved: false,
              metadata: {
                volatility_level: 0.068,
                market_conditions: 'extreme'
              }
            }
          ].slice(0, limit)
        })
      
      case 'circuit_breakers':
        return NextResponse.json({
          success: true,
          data: [
            {
              breaker_id: 'portfolio_loss_breaker',
              breaker_type: 'portfolio_loss',
              threshold: 0.05,
              cooldown_seconds: 300,
              max_triggers_per_day: 3,
              enabled: true,
              last_triggered: new Date(Date.now() - 3600000).toISOString(),
              triggers_today: 1,
              recovery_conditions: ['portfolio_stabilized', 'manual_override'],
              emergency_actions: ['halt_all_trading', 'notify_operators']
            },
            {
              breaker_id: 'daily_drawdown_breaker',
              breaker_type: 'daily_drawdown',
              threshold: 0.03,
              cooldown_seconds: 600,
              max_triggers_per_day: 5,
              enabled: true,
              triggers_today: 0,
              recovery_conditions: ['drawdown_recovered'],
              emergency_actions: ['reduce_positions', 'pause_agents']
            },
            {
              breaker_id: 'volatility_spike_breaker',
              breaker_type: 'volatility_spike',
              threshold: 0.05,
              cooldown_seconds: 180,
              max_triggers_per_day: 10,
              enabled: true,
              last_triggered: new Date(Date.now() - 7200000).toISOString(),
              triggers_today: 1,
              recovery_conditions: ['volatility_normalized'],
              emergency_actions: ['reduce_positions', 'emergency_hedge']
            },
            {
              breaker_id: 'agent_error_rate_breaker',
              breaker_type: 'agent_error_rate',
              threshold: 0.10,
              cooldown_seconds: 900,
              max_triggers_per_day: 3,
              enabled: true,
              last_triggered: new Date(Date.now() - 10800000).toISOString(),
              triggers_today: 1,
              recovery_conditions: ['agent_errors_resolved'],
              emergency_actions: ['pause_agents', 'switch_to_manual']
            }
          ]
        })
      
      case 'conditions':
        return NextResponse.json({
          success: true,
          data: [
            {
              condition_id: 'portfolio_loss',
              emergency_type: 'risk_breach',
              severity: 'high',
              trigger_threshold: 0.05,
              current_value: 0.02,
              description: 'Portfolio total loss threshold',
              enabled: true,
              last_checked: new Date().toISOString(),
              breach_count: 1
            },
            {
              condition_id: 'daily_drawdown',
              emergency_type: 'risk_breach',
              severity: 'medium',
              trigger_threshold: 0.03,
              current_value: 0.01,
              description: 'Daily drawdown threshold',
              enabled: true,
              last_checked: new Date().toISOString(),
              breach_count: 0
            },
            {
              condition_id: 'volatility_spike',
              emergency_type: 'market_crash',
              severity: 'high',
              trigger_threshold: 0.05,
              current_value: 0.025,
              description: 'Market volatility spike threshold',
              enabled: true,
              last_checked: new Date().toISOString(),
              breach_count: 1
            },
            {
              condition_id: 'agent_error_rate',
              emergency_type: 'agent_malfunction',
              severity: 'medium',
              trigger_threshold: 0.10,
              current_value: 0.03,
              description: 'Agent error rate threshold',
              enabled: true,
              last_checked: new Date().toISOString(),
              breach_count: 1
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
    console.error('Emergency API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body
    
    switch (action) {
      case 'trigger_emergency':
        const { emergency_type, severity, trigger_condition, metadata } = body
        
        return NextResponse.json({
          success: true,
          message: 'Emergency triggered successfully',
          data: {
            event_id: `event-${Date.now()}`,
            emergency_type,
            severity,
            trigger_condition,
            triggered_at: new Date().toISOString(),
            actions_taken: [],
            manual_trigger: true,
            metadata: metadata || {}
          }
        })
      
      case 'resolve_emergency':
        const { event_id, resolution_notes } = body
        
        return NextResponse.json({
          success: true,
          message: 'Emergency resolved successfully',
          data: {
            event_id,
            resolution_notes,
            resolved_at: new Date().toISOString(),
            auto_resolved: false
          }
        })
      
      case 'halt_system':
        const { reason } = body
        
        return NextResponse.json({
          success: true,
          message: 'System halted successfully',
          data: {
            action: 'halt_system',
            reason: reason || 'Manual emergency halt',
            halted_at: new Date().toISOString(),
            system_halted: true
          }
        })
      
      case 'resume_system':
        const { resume_reason } = body
        
        return NextResponse.json({
          success: true,
          message: 'System resumed successfully',
          data: {
            action: 'resume_system',
            reason: resume_reason || 'Manual system resume',
            resumed_at: new Date().toISOString(),
            system_halted: false
          }
        })
      
      case 'activate_circuit_breaker':
        const { breaker_type, current_value, breaker_metadata } = body
        
        return NextResponse.json({
          success: true,
          message: 'Circuit breaker activated',
          data: {
            activation_id: `activation-${Date.now()}`,
            breaker_type,
            current_value,
            activated_at: new Date().toISOString(),
            metadata: breaker_metadata || {}
          }
        })
      
      case 'update_circuit_breaker':
        const { breaker_id, enabled, threshold, cooldown_seconds } = body
        
        return NextResponse.json({
          success: true,
          message: 'Circuit breaker updated',
          data: {
            breaker_id,
            enabled,
            threshold,
            cooldown_seconds,
            updated_at: new Date().toISOString()
          }
        })
      
      case 'backup_state':
        return NextResponse.json({
          success: true,
          message: 'System state backed up',
          data: {
            backup_id: `backup-${Date.now()}`,
            backup_type: 'emergency_manual',
            backed_up_at: new Date().toISOString(),
            size_mb: 15.7
          }
        })
      
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Emergency API POST error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}