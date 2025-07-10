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

    const metrics = await getUnifiedMemoryService().getLearningMetrics(agentId)

    return NextResponse.json({
      success: true,
      metrics,
      agentId
    })

  } catch (error) {
    console.error('Error getting memory analytics:', error)
    return NextResponse.json(
      { error: 'Failed to get memory analytics' },
      { status: 500 }
    )
  }
}