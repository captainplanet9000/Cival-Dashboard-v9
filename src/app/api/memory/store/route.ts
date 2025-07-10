import { NextRequest, NextResponse } from 'next/server'
import { getUnifiedMemoryService } from '@/lib/memory/unified-memory-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      agentId,
      content,
      memoryType,
      context = {},
      importance,
      category,
      symbols,
      strategy,
      tradeOutcome,
      tags,
      generateEmbedding = true
    } = body

    // Validate required fields
    if (!agentId || !content || !memoryType) {
      return NextResponse.json(
        { error: 'Missing required fields: agentId, content, memoryType' },
        { status: 400 }
      )
    }

    // Validate memoryType
    const validTypes = ['trade_decision', 'market_insight', 'strategy_learning', 'risk_observation', 'pattern_recognition', 'performance_feedback']
    if (!validTypes.includes(memoryType)) {
      return NextResponse.json(
        { error: `Invalid memoryType. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    const memoryService = getUnifiedMemoryService()
    const memoryId = await memoryService.storeMemory(
      agentId,
      content,
      memoryType,
      context,
      {
        importance,
        category,
        symbols,
        strategy,
        tradeOutcome,
        tags,
        generateEmbedding
      }
    )

    return NextResponse.json({
      success: true,
      memoryId,
      message: 'Memory stored successfully'
    })

  } catch (error) {
    console.error('Error storing memory:', error)
    return NextResponse.json(
      { error: 'Failed to store memory' },
      { status: 500 }
    )
  }
}

// Get memories for an agent
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

    const options = {
      query: searchParams.get('query') || undefined,
      memoryTypes: searchParams.get('types')?.split(',') || undefined,
      symbols: searchParams.get('symbols')?.split(',') || undefined,
      importanceMin: searchParams.get('importanceMin') ? parseFloat(searchParams.get('importanceMin')!) : undefined,
      importanceMax: searchParams.get('importanceMax') ? parseFloat(searchParams.get('importanceMax')!) : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
      sortBy: (searchParams.get('sortBy') as any) || 'importance',
      includeArchived: searchParams.get('includeArchived') === 'true'
    }

    const memoryService = getUnifiedMemoryService()
    const memories = await memoryService.retrieveMemories(agentId, options)

    return NextResponse.json({
      success: true,
      memories,
      count: memories.length
    })

  } catch (error) {
    console.error('Error retrieving memories:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve memories' },
      { status: 500 }
    )
  }
}