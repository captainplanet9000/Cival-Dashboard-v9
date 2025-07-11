import { NextRequest, NextResponse } from 'next/server'

// Consensus decision API endpoints
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const decision_id = searchParams.get('decision_id')
    
    switch (action) {
      case 'decisions':
        return NextResponse.json({
          success: true,
          data: [
            {
              decision_id: 'decision-001',
              title: 'Implement Kelly Criterion for Position Sizing',
              description: 'Proposal to implement Kelly Criterion for optimal position sizing across all trading strategies.',
              decision_type: 'trading_strategy',
              options: [
                {
                  id: 'option-1',
                  title: 'Full Implementation',
                  description: 'Implement Kelly Criterion with 25% multiplier for all strategies'
                },
                {
                  id: 'option-2',
                  title: 'Gradual Rollout',
                  description: 'Start with momentum strategies, then expand to others'
                },
                {
                  id: 'option-3',
                  title: 'Reject Proposal',
                  description: 'Keep current position sizing method'
                }
              ],
              required_agents: ['marcus_momentum', 'alex_arbitrage', 'sophia_reversion', 'riley_risk'],
              optional_agents: [],
              consensus_algorithm: 'supermajority',
              consensus_threshold: 0.67,
              timeout_seconds: 1800,
              created_by: 'riley_risk',
              created_at: new Date(Date.now() - 600000).toISOString(),
              expires_at: new Date(Date.now() + 1200000).toISOString(),
              status: 'voting',
              priority: 'high',
              metadata: {
                impact: 'high',
                category: 'risk_management',
                estimated_improvement: '15%'
              }
            },
            {
              decision_id: 'decision-002',
              title: 'Emergency: Reduce Portfolio Risk',
              description: 'Market volatility has increased significantly. VaR breached 95% threshold.',
              decision_type: 'emergency_action',
              options: [
                {
                  id: 'option-1',
                  title: 'Immediate 30% Reduction',
                  description: 'Reduce all positions by 30% within next 10 minutes'
                },
                {
                  id: 'option-2',
                  title: 'Gradual Reduction',
                  description: 'Reduce positions by 30% over next 2 hours'
                }
              ],
              required_agents: ['marcus_momentum', 'alex_arbitrage', 'riley_risk'],
              optional_agents: ['sophia_reversion'],
              consensus_algorithm: 'simple_majority',
              consensus_threshold: 0.5,
              timeout_seconds: 300,
              created_by: 'riley_risk',
              created_at: new Date(Date.now() - 120000).toISOString(),
              expires_at: new Date(Date.now() + 180000).toISOString(),
              status: 'voting',
              priority: 'critical',
              metadata: {
                impact: 'critical',
                category: 'risk_management',
                current_var: '8.9%',
                threshold: '5%'
              }
            }
          ]
        })
      
      case 'status':
        if (!decision_id) {
          return NextResponse.json({
            success: false,
            error: 'decision_id parameter required'
          }, { status: 400 })
        }
        
        return NextResponse.json({
          success: true,
          data: {
            decision_id,
            title: 'Implement Kelly Criterion for Position Sizing',
            status: 'voting',
            decision_type: 'trading_strategy',
            consensus_algorithm: 'supermajority',
            total_votes: 2,
            required_votes: 3,
            vote_counts: { approve: 2, reject: 0, abstain: 0, conditional: 0 },
            weighted_votes: { approve: 2.5, reject: 0, abstain: 0, conditional: 0 },
            participation_rate: 0.5,
            voting_agents: ['alex_arbitrage', 'riley_risk'],
            non_voting_agents: ['marcus_momentum', 'sophia_reversion'],
            time_remaining: 1200,
            created_at: new Date(Date.now() - 600000).toISOString(),
            expires_at: new Date(Date.now() + 1200000).toISOString()
          }
        })
      
      case 'votes':
        if (!decision_id) {
          return NextResponse.json({
            success: false,
            error: 'decision_id parameter required'
          }, { status: 400 })
        }
        
        return NextResponse.json({
          success: true,
          data: [
            {
              vote_id: 'vote-001',
              decision_id,
              agent_id: 'alex_arbitrage',
              vote_type: 'approve',
              confidence: 0.85,
              reasoning: 'Kelly Criterion will improve risk-adjusted returns based on historical backtesting',
              metadata: { analysis_method: 'monte_carlo' },
              timestamp: new Date(Date.now() - 300000).toISOString(),
              weight: 1.3
            },
            {
              vote_id: 'vote-002',
              decision_id,
              agent_id: 'riley_risk',
              vote_type: 'approve',
              confidence: 0.72,
              reasoning: 'Supports better risk management, though implementation should be gradual',
              metadata: { risk_assessment: 'moderate' },
              timestamp: new Date(Date.now() - 180000).toISOString(),
              weight: 1.4
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
    console.error('Consensus API error:', error)
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
      case 'create_decision':
        const { title, description, decision_type, options, required_agents, consensus_algorithm, timeout_seconds } = body
        
        return NextResponse.json({
          success: true,
          message: 'Decision created successfully',
          data: {
            decision_id: `decision-${Date.now()}`,
            title,
            description,
            decision_type,
            options,
            required_agents,
            consensus_algorithm,
            timeout_seconds,
            created_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + (timeout_seconds * 1000)).toISOString(),
            status: 'voting'
          }
        })
      
      case 'cast_vote':
        const { decision_id, agent_id, vote_type, confidence, reasoning } = body
        
        return NextResponse.json({
          success: true,
          message: 'Vote cast successfully',
          data: {
            vote_id: `vote-${Date.now()}`,
            decision_id,
            agent_id,
            vote_type,
            confidence,
            reasoning,
            timestamp: new Date().toISOString(),
            weight: 1.0
          }
        })
      
      case 'resolve_decision':
        const { decision_id: resolve_id, final_decision, resolution_notes } = body
        
        return NextResponse.json({
          success: true,
          message: 'Decision resolved successfully',
          data: {
            decision_id: resolve_id,
            final_decision,
            resolution_notes,
            resolved_at: new Date().toISOString(),
            consensus_reached: true
          }
        })
      
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Consensus API POST error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}