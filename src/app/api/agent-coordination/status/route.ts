import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // In production, this would connect to the real Python backend
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    
    try {
      // Try to fetch from real backend first
      const response = await fetch(`${backendUrl}/api/v1/agent-coordination/status`, {
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

    // Mock data for development
    const mockData = {
      service_status: "online",
      framework_status: {
        crewai: {
          status: "online",
          last_check: new Date().toISOString(),
          details: {
            note: "CrewAI framework operational",
            agents_active: 4,
            last_analysis: new Date(Date.now() - 30000).toISOString()
          }
        },
        autogen: {
          status: "online", 
          last_check: new Date().toISOString(),
          details: {
            system_status: "online",
            conversation_groups: 2,
            last_consensus: new Date(Date.now() - 45000).toISOString()
          }
        }
      },
      active_tasks: 3,
      completed_tasks: 47,
      cached_analyses: 12,
      configuration: {
        default_timeout: 120,
        consensus_threshold: 0.7,
        max_concurrent_tasks: 10
      },
      last_status_check: new Date().toISOString()
    }

    return NextResponse.json(mockData)
  } catch (error) {
    console.error('Error fetching agent coordination status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch coordination status' },
      { status: 500 }
    )
  }
}