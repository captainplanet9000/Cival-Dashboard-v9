#!/usr/bin/env node

// Script to reset dashboard data with working mock data
// Run this with: node reset-dashboard-data.js

console.log('Resetting dashboard data with working mock data...')

// Mock farm data with all required properties
const mockFarms = [
  {
    id: 'farm_1',
    name: 'Momentum Trading Farm',
    description: 'Multi-agent momentum trading strategy',
    totalValue: 75000,
    totalPnL: 5250,
    agentCount: 3,
    coordinationMode: 'collaborative',
    status: 'active',
    createdAt: new Date().toISOString(),
    performance: {
      totalValue: 75000,
      totalPnL: 5250,
      winRate: 68,
      dailyReturn: 2.5
    },
    agents: ['agent_1', 'agent_2', 'agent_3']
  },
  {
    id: 'farm_2', 
    name: 'Arbitrage Farm',
    description: 'Cross-exchange arbitrage opportunities',
    totalValue: 120000,
    totalPnL: 8900,
    agentCount: 2,
    coordinationMode: 'independent',
    status: 'active',
    createdAt: new Date().toISOString(),
    performance: {
      totalValue: 120000,
      totalPnL: 8900,
      winRate: 85,
      dailyReturn: 1.8
    },
    agents: ['agent_4', 'agent_5']
  }
]

// Mock goals data with all required properties
const mockGoals = [
  {
    id: 'goal_1',
    name: 'Reach $10,000 Profit',
    description: 'Achieve $10,000 in total trading profit',
    type: 'profit',
    target: 10000,
    current: 5250,
    progress: 52.5,
    priority: 'high',
    status: 'active',
    category: 'trading',
    createdAt: new Date().toISOString(),
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    reward: 'Upgrade to premium strategy package'
  },
  {
    id: 'goal_2',
    name: '75% Win Rate',
    description: 'Maintain a 75% win rate across all trades',
    type: 'winRate',
    target: 75,
    current: 68,
    progress: 90.7,
    priority: 'medium',
    status: 'active',
    category: 'performance',
    createdAt: new Date().toISOString(),
    reward: 'Achievement badge'
  }
]

// Mock agent data
const mockAgents = [
  {
    id: 'agent_1',
    name: 'Marcus Momentum',
    strategy: 'momentum',
    status: 'active',
    portfolio: {
      totalValue: 25000,
      cash: 5000,
      positions: [
        { symbol: 'BTCUSD', quantity: 0.5, value: 20000 }
      ]
    },
    performance: {
      totalPnL: 2500,
      winRate: 65,
      totalTrades: 45,
      activePositions: 1
    }
  },
  {
    id: 'agent_2',
    name: 'Alex Arbitrage',
    strategy: 'arbitrage',
    status: 'active', 
    portfolio: {
      totalValue: 60000,
      cash: 10000,
      positions: [
        { symbol: 'ETHUSD', quantity: 15, value: 50000 }
      ]
    },
    performance: {
      totalPnL: 4200,
      winRate: 82,
      totalTrades: 123,
      activePositions: 1
    }
  }
]

if (typeof localStorage !== 'undefined') {
  localStorage.setItem('trading_farms', JSON.stringify(mockFarms))
  localStorage.setItem('trading_goals', JSON.stringify(mockGoals))
  localStorage.setItem('trading_agents', JSON.stringify(mockAgents))
  console.log('✅ Dashboard data reset successfully')
} else {
  console.log('📝 Mock data ready for browser localStorage:')
  console.log('trading_farms:', JSON.stringify(mockFarms, null, 2))
  console.log('trading_goals:', JSON.stringify(mockGoals, null, 2))
  console.log('trading_agents:', JSON.stringify(mockAgents, null, 2))
}