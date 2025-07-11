import { NextRequest, NextResponse } from 'next/server'
import { redisService } from '@/lib/services/redis-service'

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing Redis connection...')
    
    // Get connection info
    const connectionInfo = redisService.getConnectionInfo()
    console.log('📋 Connection info:', connectionInfo)
    
    // Test basic connectivity
    const isHealthy = redisService.isHealthy()
    console.log('💚 Is healthy:', isHealthy)
    
    // Try to ping Redis
    const pingResult = await redisService.ping()
    console.log('🏓 Ping result:', pingResult)
    
    // Try to set and get a test value
    const testKey = 'test:redis:connection'
    const testValue = `test-${Date.now()}`
    
    const setResult = await redisService.set(testKey, testValue, 60) // 60 seconds TTL
    console.log('✍️ Set result:', setResult)
    
    const getValue = await redisService.get(testKey)
    console.log('📖 Get result:', getValue)
    
    // Test JSON operations
    const jsonTestKey = 'test:redis:json'
    const jsonTestValue = { 
      timestamp: Date.now(), 
      status: 'testing',
      data: [1, 2, 3]
    }
    
    const jsonSetResult = await redisService.setJSON(jsonTestKey, jsonTestValue, 60)
    console.log('✍️ JSON set result:', jsonSetResult)
    
    const jsonGetResult = await redisService.getJSON(jsonTestKey)
    console.log('📖 JSON get result:', jsonGetResult)
    
    // Test cache-specific methods
    const cacheTestData = { marketPrice: 117000, timestamp: Date.now() }
    const cacheResult = await redisService.cacheMarketData('BTC/USD', cacheTestData, 30)
    console.log('📦 Cache result:', cacheResult)
    
    const cachedData = await redisService.getCachedMarketData('BTC/USD')
    console.log('📦 Cached data:', cachedData)
    
    // Clean up test data
    await redisService.del(testKey)
    await redisService.del(jsonTestKey)
    
    return NextResponse.json({
      status: 'success',
      redis: {
        connectionInfo,
        isHealthy,
        pingResult,
        basicOperations: {
          set: setResult,
          get: getValue,
          match: getValue === testValue
        },
        jsonOperations: {
          set: jsonSetResult,
          get: jsonGetResult,
          match: JSON.stringify(jsonGetResult) === JSON.stringify(jsonTestValue)
        },
        cacheOperations: {
          cache: cacheResult,
          retrieve: cachedData,
          match: JSON.stringify(cachedData) === JSON.stringify(cacheTestData)
        }
      }
    })

  } catch (error) {
    console.error('❌ Redis test failed:', error)
    return NextResponse.json({ 
      status: 'error',
      error: error instanceof Error ? error.message : String(error),
      redis: {
        connectionInfo: redisService.getConnectionInfo(),
        isHealthy: redisService.isHealthy()
      }
    }, { status: 500 })
  }
}