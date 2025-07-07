import { NextRequest, NextResponse } from 'next/server'

// In-memory storage for risk settings (in production, would use database)
let riskSettings = {
  maxPortfolioVar: 5.0,
  maxPositionSize: 10.0,
  maxConcentration: 25.0,
  maxDrawdown: 15.0,
  minLiquidity: 3.0,
  maxCorrelation: 0.8,
  alertsEnabled: true,
  autoStopLoss: true,
  emergencyStopEnabled: true,
  riskToleranceLevel: 'moderate' as 'conservative' | 'moderate' | 'aggressive',
  stopLossPercentage: 5.0,
  takeProfitPercentage: 10.0,
  maxDailyLoss: 2000,
  maxLeverage: 3.0,
  marginCallThreshold: 80.0,
  lastUpdated: Date.now()
}

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json(riskSettings)
  } catch (error) {
    console.error('Error fetching risk settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch risk settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const updates = await request.json()
    
    // Validate risk settings
    const validatedSettings = validateRiskSettings(updates)
    
    // Update settings
    riskSettings = {
      ...riskSettings,
      ...validatedSettings,
      lastUpdated: Date.now()
    }
    
    // Broadcast settings update via WebSocket
    try {
      const { broadcastRiskEvent } = await import('@/lib/websocket/risk-broadcaster')
      await broadcastRiskEvent('settings_updated', {
        settings: riskSettings,
        updatedBy: 'user', // In production, would use actual user ID
        timestamp: Date.now()
      })
    } catch (error) {
      console.error('Error broadcasting settings update:', error)
    }
    
    return NextResponse.json({
      success: true,
      settings: riskSettings
    })
    
  } catch (error) {
    console.error('Error updating risk settings:', error)
    return NextResponse.json(
      { error: 'Failed to update risk settings' },
      { status: 500 }
    )
  }
}

function validateRiskSettings(settings: any): any {
  const validated: any = {}
  
  // Validate numeric ranges
  if (typeof settings.maxPortfolioVar === 'number') {
    validated.maxPortfolioVar = Math.max(0.1, Math.min(50, settings.maxPortfolioVar))
  }
  
  if (typeof settings.maxPositionSize === 'number') {
    validated.maxPositionSize = Math.max(1, Math.min(100, settings.maxPositionSize))
  }
  
  if (typeof settings.maxConcentration === 'number') {
    validated.maxConcentration = Math.max(5, Math.min(100, settings.maxConcentration))
  }
  
  if (typeof settings.maxDrawdown === 'number') {
    validated.maxDrawdown = Math.max(1, Math.min(50, settings.maxDrawdown))
  }
  
  if (typeof settings.minLiquidity === 'number') {
    validated.minLiquidity = Math.max(1, Math.min(10, settings.minLiquidity))
  }
  
  if (typeof settings.maxCorrelation === 'number') {
    validated.maxCorrelation = Math.max(0.1, Math.min(1.0, settings.maxCorrelation))
  }
  
  if (typeof settings.stopLossPercentage === 'number') {
    validated.stopLossPercentage = Math.max(0.1, Math.min(50, settings.stopLossPercentage))
  }
  
  if (typeof settings.takeProfitPercentage === 'number') {
    validated.takeProfitPercentage = Math.max(0.1, Math.min(100, settings.takeProfitPercentage))
  }
  
  if (typeof settings.maxDailyLoss === 'number') {
    validated.maxDailyLoss = Math.max(100, Math.min(100000, settings.maxDailyLoss))
  }
  
  if (typeof settings.maxLeverage === 'number') {
    validated.maxLeverage = Math.max(1, Math.min(10, settings.maxLeverage))
  }
  
  if (typeof settings.marginCallThreshold === 'number') {
    validated.marginCallThreshold = Math.max(50, Math.min(95, settings.marginCallThreshold))
  }
  
  // Validate boolean settings
  if (typeof settings.alertsEnabled === 'boolean') {
    validated.alertsEnabled = settings.alertsEnabled
  }
  
  if (typeof settings.autoStopLoss === 'boolean') {
    validated.autoStopLoss = settings.autoStopLoss
  }
  
  if (typeof settings.emergencyStopEnabled === 'boolean') {
    validated.emergencyStopEnabled = settings.emergencyStopEnabled
  }
  
  // Validate risk tolerance level
  if (['conservative', 'moderate', 'aggressive'].includes(settings.riskToleranceLevel)) {
    validated.riskToleranceLevel = settings.riskToleranceLevel
    
    // Adjust other settings based on risk tolerance
    if (settings.riskToleranceLevel === 'conservative') {
      validated.maxPositionSize = Math.min(validated.maxPositionSize || riskSettings.maxPositionSize, 5)
      validated.maxDrawdown = Math.min(validated.maxDrawdown || riskSettings.maxDrawdown, 10)
      validated.maxLeverage = Math.min(validated.maxLeverage || riskSettings.maxLeverage, 2)
    } else if (settings.riskToleranceLevel === 'aggressive') {
      validated.maxPositionSize = Math.max(validated.maxPositionSize || riskSettings.maxPositionSize, 15)
      validated.maxDrawdown = Math.max(validated.maxDrawdown || riskSettings.maxDrawdown, 25)
      validated.maxLeverage = Math.max(validated.maxLeverage || riskSettings.maxLeverage, 5)
    }
  }
  
  return validated
}