import { NextRequest, NextResponse } from 'next/server'
import { unifiedMemoryService } from '@/lib/memory/unified-memory-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      agentId,
      name,
      type,
      agentState,
      triggerEvent,
      strategyParameters,
      riskParameters,
      performanceMetrics
    } = body

    if (!agentId || !name || !type || !agentState) {
      return NextResponse.json(
        { error: 'Missing required fields: agentId, name, type, agentState' },
        { status: 400 }
      )
    }

    // Validate checkpoint type
    const validTypes = ['manual', 'automatic', 'pre_trade', 'post_trade', 'error_recovery', 'optimization']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid checkpoint type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    const checkpointId = await unifiedMemoryService.createCheckpoint(
      agentId,
      name,
      type,
      agentState,
      {
        triggerEvent,
        strategyParameters,
        riskParameters,
        performanceMetrics
      }
    )

    if (!checkpointId) {
      return NextResponse.json(
        { error: 'Failed to create checkpoint' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      checkpointId,
      message: 'Checkpoint created successfully'
    })

  } catch (error) {
    console.error('Error creating checkpoint:', error)
    return NextResponse.json(
      { error: 'Failed to create checkpoint' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    const { checkpointId } = body

    if (!checkpointId) {
      return NextResponse.json(
        { error: 'Missing required field: checkpointId' },
        { status: 400 }
      )
    }

    const success = await unifiedMemoryService.restoreCheckpoint(checkpointId)

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to restore checkpoint' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Checkpoint restored successfully'
    })

  } catch (error) {
    console.error('Error restoring checkpoint:', error)
    return NextResponse.json(
      { error: 'Failed to restore checkpoint' },
      { status: 500 }
    )
  }
}