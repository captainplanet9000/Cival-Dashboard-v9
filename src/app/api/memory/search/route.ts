import { NextRequest, NextResponse } from 'next/server'
import { unifiedMemoryService } from '@/lib/memory/unified-memory-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      agentId,
      query,
      semantic = true,
      limit = 10
    } = body

    if (!agentId || !query) {
      return NextResponse.json(
        { error: 'Missing required fields: agentId, query' },
        { status: 400 }
      )
    }

    let memories
    if (semantic) {
      memories = await unifiedMemoryService.semanticSearch(agentId, query, limit)
    } else {
      memories = await unifiedMemoryService.retrieveMemories(agentId, {
        query,
        limit,
        sortBy: 'relevance'
      })
    }

    return NextResponse.json({
      success: true,
      memories,
      query,
      semantic,
      count: memories.length
    })

  } catch (error) {
    console.error('Error searching memories:', error)
    return NextResponse.json(
      { error: 'Failed to search memories' },
      { status: 500 }
    )
  }
}