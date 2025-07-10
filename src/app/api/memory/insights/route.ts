import { NextRequest, NextResponse } from 'next/server'
import { getUnifiedMemoryService } from '@/lib/memory/unified-memory-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get('agentId')

    if (!agentId) {
      return NextResponse.json(
        { error: 'Missing agentId parameter' },
        { status: 400 }
      )
    }

    const insights = await getUnifiedMemoryService().getMemoryInsights(agentId)

    return NextResponse.json({
      success: true,
      insights,
      count: insights.length
    })

  } catch (error) {
    console.error('Error getting memory insights:', error)
    return NextResponse.json(
      { error: 'Failed to get memory insights' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      agentId,
      memoryId,
      outcome
    } = body

    if (!agentId || !memoryId || !outcome) {
      return NextResponse.json(
        { error: 'Missing required fields: agentId, memoryId, outcome' },
        { status: 400 }
      )
    }

    await getUnifiedMemoryService().recordTradeOutcome(agentId, memoryId, outcome)

    return NextResponse.json({
      success: true,
      message: 'Trade outcome recorded successfully'
    })

  } catch (error) {
    console.error('Error recording trade outcome:', error)
    return NextResponse.json(
      { error: 'Failed to record trade outcome' },
      { status: 500 }
    )
  }
}