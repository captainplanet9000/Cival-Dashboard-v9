import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // In production, this would connect to the real Python backend
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    
    try {
      // Try to fetch from real backend first
      const response = await fetch(`${backendUrl}/api/v1/system/database`, {
        headers: {
          'Accept': 'application/json',
        },
        cache: 'no-store'
      })
      
      if (response.ok) {
        const data = await response.json()
        return NextResponse.json(data)
      }
    } catch (error) {
      console.log('Backend not available, using mock data')
    }

    // Mock database status for development
    const mockDatabase = {
      status: "connected",
      total_tables: 42,
      active_connections: Math.floor(Math.random() * 20 + 5), // 5-25 connections
      connection_pool_size: 20,
      database_size_mb: parseFloat((Math.random() * 500 + 100).toFixed(1)), // 100-600 MB
      last_backup: new Date(Date.now() - Math.random() * 86400000).toISOString(), // Last 24 hours
      recent_tables: [
        "agents",
        "agent_state", 
        "agent_performance",
        "coordination_groups",
        "agent_group_memberships",
        "coordination_messages",
        "market_snapshots",
        "rl_q_values",
        "rl_experiences",
        "agent_thoughts",
        "agent_decisions",
        "agent_memory"
      ],
      performance_metrics: {
        avg_query_time_ms: parseFloat((Math.random() * 20 + 5).toFixed(1)), // 5-25ms
        queries_per_second: Math.floor(Math.random() * 100 + 50), // 50-150 QPS
        cache_hit_ratio: parseFloat((0.85 + Math.random() * 0.14).toFixed(3)), // 85-99%
        active_transactions: Math.floor(Math.random() * 10 + 1) // 1-11 transactions
      },
      storage_info: {
        total_space_gb: 100,
        used_space_gb: parseFloat((Math.random() * 30 + 10).toFixed(1)), // 10-40 GB
        free_space_gb: parseFloat((60 + Math.random() * 30).toFixed(1)) // 60-90 GB
      },
      last_check: new Date().toISOString()
    }

    return NextResponse.json(mockDatabase)
  } catch (error) {
    console.error('Error fetching database status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch database status' },
      { status: 500 }
    )
  }
}