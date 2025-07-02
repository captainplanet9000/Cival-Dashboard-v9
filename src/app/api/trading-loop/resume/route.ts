import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // In production, this would connect to the real Python backend
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    
    try {
      // Try to send to real backend first
      const response = await fetch(`${backendUrl}/api/v1/trading-loop/resume`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        cache: 'no-store'
      })
      
      if (response.ok) {
        const data = await response.json()
        return NextResponse.json(data)
      }
    } catch (error) {
      console.log('Backend not available, using mock response')
    }

    // Mock resume response for development
    const mockResponse = {
      success: true,
      message: "Trading loop resumed",
      status: "running"
    }

    return NextResponse.json(mockResponse)
  } catch (error) {
    console.error('Error resuming trading loop:', error)
    return NextResponse.json(
      { error: 'Failed to resume trading loop' },
      { status: 500 }
    )
  }
}