import { NextRequest, NextResponse } from 'next/server'

// Market regime detection API endpoints
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
    switch (action) {
      case 'current':
        return NextResponse.json({
          success: true,
          data: {
            regime_id: 'regime-001',
            primary_regime: 'bull_market',
            secondary_regimes: ['trending', 'low_volatility'],
            confidence: 'high',
            probability_scores: {
              bull_market: 0.75,
              trending: 0.65,
              low_volatility: 0.55,
              bear_market: 0.15,
              high_volatility: 0.25,
              sideways: 0.30
            },
            market_conditions: {
              timestamp: new Date().toISOString(),
              volatility_1d: 0.025,
              volatility_7d: 0.018,
              volatility_30d: 0.022,
              trend_strength: 0.35,
              momentum: 0.12,
              volume_ratio: 1.15,
              correlation_breakdown: false,
              vix_level: 18.5,
              economic_indicators: {
                unemployment: 3.8,
                inflation: 2.3,
                interest_rate: 5.25,
                gdp_growth: 2.4
              },
              sector_rotation: {
                technology: 0.08,
                healthcare: 0.05,
                financials: -0.03,
                energy: 0.12,
                utilities: -0.02
              }
            },
            detected_at: new Date(Date.now() - 600000).toISOString(),
            expected_duration: 7776000,
            risk_level: 0.35,
            recommended_actions: ['increase_position', 'change_strategy'],
            metadata: {
              detection_model: 'rule_based_v1',
              data_points_used: 1000
            }
          }
        })
      
      case 'history':
        const limit = parseInt(searchParams.get('limit') || '10')
        
        return NextResponse.json({
          success: true,
          data: [
            {
              regime_id: 'regime-001',
              primary_regime: 'bull_market',
              secondary_regimes: ['trending', 'low_volatility'],
              confidence: 'high',
              detected_at: new Date(Date.now() - 600000).toISOString(),
              expected_duration: 7776000,
              risk_level: 0.35
            },
            {
              regime_id: 'regime-002',
              primary_regime: 'sideways',
              secondary_regimes: ['low_volatility'],
              confidence: 'medium',
              detected_at: new Date(Date.now() - 1800000).toISOString(),
              expected_duration: 2592000,
              risk_level: 0.25
            },
            {
              regime_id: 'regime-003',
              primary_regime: 'high_volatility',
              secondary_regimes: ['trending'],
              confidence: 'high',
              detected_at: new Date(Date.now() - 3600000).toISOString(),
              expected_duration: 86400,
              risk_level: 0.65
            }
          ].slice(0, limit)
        })
      
      case 'adaptations':
        return NextResponse.json({
          success: true,
          data: [
            {
              adaptation_id: 'adapt-001',
              target_strategy: 'momentum_strategy',
              current_allocation: 0.25,
              recommended_allocation: 0.35,
              adaptation_actions: ['increase_position', 'adjust_risk_params'],
              risk_adjustment: -0.05,
              expected_impact: {
                return_change: 0.02,
                risk_change: -0.05
              },
              implementation_priority: 1,
              rationale: 'Bull market regime favors momentum strategies with increased allocation',
              created_at: new Date(Date.now() - 300000).toISOString(),
              expires_at: new Date(Date.now() + 86400000).toISOString()
            },
            {
              adaptation_id: 'adapt-002',
              target_strategy: 'mean_reversion_strategy',
              current_allocation: 0.30,
              recommended_allocation: 0.20,
              adaptation_actions: ['decrease_position', 'adjust_risk_params'],
              risk_adjustment: 0.10,
              expected_impact: {
                return_change: -0.01,
                risk_change: 0.10
              },
              implementation_priority: 2,
              rationale: 'Bull market regime suggests reducing mean reversion exposure',
              created_at: new Date(Date.now() - 300000).toISOString(),
              expires_at: new Date(Date.now() + 86400000).toISOString()
            }
          ]
        })
      
      case 'transitions':
        return NextResponse.json({
          success: true,
          data: [
            {
              transition_id: 'trans-001',
              from_regime: 'sideways',
              to_regime: 'bull_market',
              transition_probability: 0.75,
              transition_speed: 0.8,
              impact_assessment: {
                portfolio_risk_change: -0.05,
                expected_return_change: 0.08,
                adaptation_urgency: 0.6
              },
              adaptation_triggers: ['increase_position', 'change_strategy'],
              occurred_at: new Date(Date.now() - 600000).toISOString()
            },
            {
              transition_id: 'trans-002',
              from_regime: 'high_volatility',
              to_regime: 'sideways',
              transition_probability: 0.68,
              transition_speed: 0.6,
              impact_assessment: {
                portfolio_risk_change: -0.15,
                expected_return_change: -0.02,
                adaptation_urgency: 0.4
              },
              adaptation_triggers: ['rebalance_portfolio', 'adjust_risk_params'],
              occurred_at: new Date(Date.now() - 1800000).toISOString()
            }
          ]
        })
      
      case 'status':
        return NextResponse.json({
          success: true,
          data: {
            active_adaptations: 2,
            adaptations_by_action: {
              increase_position: 1,
              decrease_position: 1,
              adjust_risk_params: 2,
              change_strategy: 1,
              rebalance_portfolio: 0
            },
            recent_transitions: 1,
            current_regime: 'bull_market'
          }
        })
      
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action parameter'
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Market regime API error:', error)
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
      case 'analyze_conditions':
        const { market_data } = body
        
        return NextResponse.json({
          success: true,
          message: 'Market conditions analyzed',
          data: {
            analysis_id: `analysis-${Date.now()}`,
            market_conditions: {
              timestamp: new Date().toISOString(),
              volatility_1d: market_data?.volatility_1d || 0.025,
              volatility_7d: market_data?.volatility_7d || 0.018,
              volatility_30d: market_data?.volatility_30d || 0.022,
              trend_strength: market_data?.trend_strength || 0.35,
              momentum: market_data?.momentum || 0.12,
              volume_ratio: market_data?.volume_ratio || 1.15,
              correlation_breakdown: market_data?.correlation_breakdown || false,
              vix_level: market_data?.vix_level || 18.5
            },
            regime_probabilities: {
              bull_market: 0.75,
              bear_market: 0.15,
              sideways: 0.30,
              high_volatility: 0.25,
              low_volatility: 0.55,
              trending: 0.65
            }
          }
        })
      
      case 'trigger_adaptation':
        const { strategy_name, new_allocation, rationale } = body
        
        return NextResponse.json({
          success: true,
          message: 'Strategy adaptation triggered',
          data: {
            adaptation_id: `adapt-${Date.now()}`,
            target_strategy: strategy_name,
            recommended_allocation: new_allocation,
            rationale,
            triggered_at: new Date().toISOString(),
            status: 'pending'
          }
        })
      
      case 'update_config':
        const { detection_config } = body
        
        return NextResponse.json({
          success: true,
          message: 'Configuration updated',
          data: {
            config_id: `config-${Date.now()}`,
            detection_config,
            updated_at: new Date().toISOString()
          }
        })
      
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Market regime API POST error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}