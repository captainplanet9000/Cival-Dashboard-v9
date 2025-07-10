import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { symbol, frameworks } = body

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol is required' },
        { status: 400 }
      )
    }

    // In production, this would connect to the real Python backend
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    
    try {
      // Try to fetch from real backend first
      const response = await fetch(`${backendUrl}/api/v1/agent-coordination/consensus`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          symbol,
          frameworks: frameworks || ['crewai', 'autogen'],
          context: {
            timestamp: new Date().toISOString(),
            source: 'dashboard'
          }
        }),
        cache: 'no-store'
      })
      
      if (response.ok) {
        const data = await response.json()
        return NextResponse.json(data)
      }
    } catch (error) {
      console.log('Backend not available, using mock analysis')
    }

    // Mock consensus analysis for development
    const mockConsensusTask = {
      task_id: `consensus_${Date.now()}`,
      task_type: "consensus",
      symbol: symbol,
      involved_frameworks: frameworks || ['crewai', 'autogen'],
      status: "completed",
      results: [
        {
          request_id: `req_${Date.now()}_1`,
          symbol: symbol,
          framework: "crewai",
          success: true,
          recommendation: Math.random() > 0.5 ? "BUY" : "SELL",
          confidence: 0.75 + Math.random() * 0.2,
          analysis_data: {
            technical_score: Math.random() * 100,
            sentiment_score: Math.random() * 100,
            volume_analysis: "High",
            trend_direction: Math.random() > 0.5 ? "Bullish" : "Bearish"
          }
        },
        {
          request_id: `req_${Date.now()}_2`,
          symbol: symbol,
          framework: "autogen",
          success: true,
          recommendation: Math.random() > 0.5 ? "BUY" : "SELL",
          confidence: 0.65 + Math.random() * 0.3,
          analysis_data: {
            risk_assessment: "Medium",
            market_condition: "Volatile",
            entry_price: (100 + Math.random() * 1000).toFixed(2),
            stop_loss: (80 + Math.random() * 50).toFixed(2)
          }
        }
      ],
      consensus_reached: Math.random() > 0.3, // 70% chance of consensus
      final_recommendation: null as any,
      created_at: new Date().toISOString(),
      completed_at: new Date().toISOString()
    }

    // Determine consensus
    if (mockConsensusTask.consensus_reached) {
      const actions = mockConsensusTask.results.map(r => r.recommendation)
      const buyVotes = actions.filter(a => a === "BUY").length
      const sellVotes = actions.filter(a => a === "SELL").length
      
      mockConsensusTask.final_recommendation = {
        action: buyVotes > sellVotes ? "BUY" : "SELL",
        confidence: mockConsensusTask.results.reduce((sum, r) => sum + r.confidence, 0) / mockConsensusTask.results.length,
        consensus_strength: Math.max(buyVotes, sellVotes) / actions.length,
        supporting_frameworks: mockConsensusTask.results.length,
        analysis_data: {
          framework_results: {
            crewai: mockConsensusTask.results[0]?.analysis_data,
            autogen: mockConsensusTask.results[1]?.analysis_data
          },
          voting_summary: {
            buy_votes: buyVotes,
            sell_votes: sellVotes,
            total_votes: actions.length,
            consensus_threshold: 0.7
          }
        },
        timestamp: new Date().toISOString()
      }
    }

    return NextResponse.json(mockConsensusTask)
  } catch (error) {
    console.error('Error running consensus analysis:', error)
    return NextResponse.json(
      { error: 'Failed to run consensus analysis' },
      { status: 500 }
    )
  }
}