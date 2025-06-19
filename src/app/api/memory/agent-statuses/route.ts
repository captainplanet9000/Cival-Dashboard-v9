/**
 * Agent Memory Status API Endpoint
 * Provides individual agent memory status information
 */

import { NextRequest, NextResponse } from 'next/server'

interface AgentMemoryStatus {
  agent_id: string
  agent_name: string
  memory_size_mb: number
  efficiency: number
  last_cleanup: string
  needs_optimization: boolean
  status: 'healthy' | 'warning' | 'critical'
  memory_breakdown: {
    decision_history: number
    trading_experience: number
    learned_patterns: number
    configuration: number
    other: number
  }
  performance_metrics: {
    access_speed_ms: number
    retrieval_success_rate: number
    learning_rate: number
  }
}

// Mock agent memory status service
class MockAgentMemoryStatusService {
  private agentConfigs = [
    { id: 'marcus_momentum', name: 'Marcus Momentum', baseMemory: 20 },
    { id: 'alex_arbitrage', name: 'Alex Arbitrage', baseMemory: 25 },
    { id: 'sophia_reversion', name: 'Sophia Reversion', baseMemory: 18 },
    { id: 'riley_risk', name: 'Riley Risk', baseMemory: 22 },
    { id: 'echo_scalping', name: 'Echo Scalping', baseMemory: 15 },
    { id: 'nova_grid', name: 'Nova Grid', baseMemory: 28 }
  ]
  
  async getAgentMemoryStatuses(): Promise<AgentMemoryStatus[]> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 150))
    
    return this.agentConfigs.map(config => this.generateAgentStatus(config))
  }
  
  private generateAgentStatus(config: { id: string, name: string, baseMemory: number }): AgentMemoryStatus {
    const memoryVariation = 0.8 + Math.random() * 0.4 // ±20% variation
    const memorySize = config.baseMemory * memoryVariation
    
    const efficiency = 0.6 + Math.random() * 0.35 // 60-95% efficiency
    const daysSinceCleanup = Math.floor(Math.random() * 14) // 0-14 days
    
    // Determine status based on efficiency and cleanup age
    let status: 'healthy' | 'warning' | 'critical'
    let needsOptimization = false
    
    if (efficiency > 0.8 && daysSinceCleanup < 7) {
      status = 'healthy'
    } else if (efficiency > 0.7 && daysSinceCleanup < 10) {
      status = 'warning'
      needsOptimization = daysSinceCleanup > 7
    } else {
      status = 'critical'
      needsOptimization = true
    }
    
    // Generate last cleanup date
    const lastCleanup = new Date()
    lastCleanup.setDate(lastCleanup.getDate() - daysSinceCleanup)
    lastCleanup.setHours(lastCleanup.getHours() - Math.floor(Math.random() * 24))
    
    return {
      agent_id: config.id,
      agent_name: config.name,
      memory_size_mb: Math.round(memorySize * 100) / 100,
      efficiency: Math.round(efficiency * 100) / 100,
      last_cleanup: lastCleanup.toISOString(),
      needs_optimization: needsOptimization,
      status,
      memory_breakdown: {
        decision_history: Math.round(memorySize * 0.35 * 100) / 100, // ~35%
        trading_experience: Math.round(memorySize * 0.25 * 100) / 100, // ~25%
        learned_patterns: Math.round(memorySize * 0.20 * 100) / 100, // ~20%
        configuration: Math.round(memorySize * 0.10 * 100) / 100, // ~10%
        other: Math.round(memorySize * 0.10 * 100) / 100 // ~10%
      },
      performance_metrics: {
        access_speed_ms: Math.round((10 + Math.random() * 40) * 100) / 100, // 10-50ms
        retrieval_success_rate: Math.round((0.85 + Math.random() * 0.14) * 100) / 100, // 85-99%
        learning_rate: Math.round((0.05 + Math.random() * 0.10) * 100) / 100 // 5-15%
      }
    }
  }
}

const mockService = new MockAgentMemoryStatusService()

export async function GET(request: NextRequest) {
  try {
    // Get agent memory statuses
    const statuses = await mockService.getAgentMemoryStatuses()
    
    return NextResponse.json(statuses)
    
  } catch (error) {
    console.error('Error in agent memory status API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}