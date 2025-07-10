import { NextRequest, NextResponse } from 'next/server'
import { unifiedMemoryService } from '@/lib/memory/unified-memory-service'

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

    const clusters = await unifiedMemoryService.getMemoryClusters(agentId)

    return NextResponse.json({
      success: true,
      clusters,
      count: clusters.length
    })

  } catch (error) {
    console.error('Error getting memory clusters:', error)
    return NextResponse.json(
      { error: 'Failed to get memory clusters' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      agentId,
      name,
      type,
      memoryIds,
      description
    } = body

    if (!agentId || !name || !type || !memoryIds?.length) {
      return NextResponse.json(
        { error: 'Missing required fields: agentId, name, type, memoryIds' },
        { status: 400 }
      )
    }

    // Validate cluster type
    const validTypes = ['pattern', 'strategy', 'outcome', 'temporal', 'market_condition']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid cluster type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    const clusterId = await unifiedMemoryService.createCluster(
      agentId,
      name,
      type,
      memoryIds,
      description
    )

    if (!clusterId) {
      return NextResponse.json(
        { error: 'Failed to create cluster' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      clusterId,
      message: 'Cluster created successfully'
    })

  } catch (error) {
    console.error('Error creating memory cluster:', error)
    return NextResponse.json(
      { error: 'Failed to create memory cluster' },
      { status: 500 }
    )
  }
}