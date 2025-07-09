/**
 * Agent Market Data Service
 * Provides market data access specifically for AI trading agents
 * Integrates with the global market data manager and agent todo system
 */

import {
  MarketPrice,
  HistoricalPrice,
  MarketAnalysis,
  TradingSignal,
  AgentMarketAccess,
  AgentTradingContext,
  AgentMarketDataRequest,
  MarketEvent,
  MarketDataResponse
} from '@/types/market-data'
import { globalMarketDataManager } from '@/lib/market/global-market-data-manager'
import { marketDataPersistence } from '@/lib/market/market-data-persistence'
import agentTodoService from '@/lib/agents/agent-todo-service'
import { CreateTodoRequest } from '@/types/agent-todos'
import { supabase } from '@/lib/supabase/client'
import { agentStrategyIntegration, StrategySignal } from '@/lib/agents/agent-strategy-integration'
import { strategyService, StrategyType, STRATEGY_TYPES } from '@/lib/supabase/strategy-service'
import { strategyPerformanceAnalytics } from '@/lib/analytics/strategy-performance-analytics'

class AgentMarketDataService {
  private agentAccess: Map<string, AgentMarketAccess> = new Map()
  private tradingContexts: Map<string, AgentTradingContext> = new Map()
  private activeSignals: Map<string, TradingSignal[]> = new Map()
  private alertSubscriptions: Map<string, MarketEvent[]> = new Map()

  constructor() {
    this.initializeService()
  }

  private async initializeService(): Promise<void> {
    try {
      // Subscribe to global market data updates
      globalMarketDataManager.subscribe({
        symbols: [], // All symbols
        callback: this.handleMarketUpdate.bind(this),
        interval: 5000, // 5 seconds
        active: true,
        lastUpdate: new Date()
      })

      console.log('Agent Market Data Service initialized')
    } catch (error) {
      console.error('Failed to initialize Agent Market Data Service:', error)
    }
  }

  // ===== AGENT REGISTRATION =====

  public async registerAgent(
    agentId: string, 
    subscribedSymbols: string[] = [],
    permissions: Partial<AgentMarketAccess['permissions']> = {}
  ): Promise<MarketDataResponse<AgentMarketAccess>> {
    try {
      const access: AgentMarketAccess = {
        agentId,
        subscribedSymbols,
        analysisHistory: [],
        alerts: [],
        tradingSignals: [],
        permissions: {
          canCreateAlerts: true,
          canAccessHistorical: true,
          canPerformAnalysis: true,
          maxSymbols: 50,
          ...permissions
        }
      }

      this.agentAccess.set(agentId, access)

      // Create initial trading context
      await this.updateTradingContext(agentId)

      // Create welcome todo for agent
      await agentTodoService.createTodo({
        agentId,
        title: 'Market Data Access Configured',
        description: `Your market data access has been configured with ${subscribedSymbols.length} subscribed symbols. You can now access real-time prices, historical data, and market analysis.`,
        priority: 'low',
        category: 'system',
        assignedBy: 'system',
        hierarchyLevel: 'individual'
      })

      return {
        success: true,
        data: access,
        message: 'Agent registered successfully for market data access',
        timestamp: new Date()
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to register agent',
        timestamp: new Date()
      }
    }
  }

  public async updateAgentSubscriptions(
    agentId: string, 
    newSymbols: string[]
  ): Promise<MarketDataResponse<string[]>> {
    try {
      const access = this.agentAccess.get(agentId)
      if (!access) {
        throw new Error('Agent not registered for market data access')
      }

      // Check permissions
      if (newSymbols.length > access.permissions.maxSymbols) {
        throw new Error(`Cannot subscribe to more than ${access.permissions.maxSymbols} symbols`)
      }

      access.subscribedSymbols = newSymbols
      this.agentAccess.set(agentId, access)

      // Update trading context with new symbols
      await this.updateTradingContext(agentId)

      return {
        success: true,
        data: newSymbols,
        message: `Updated subscriptions to ${newSymbols.length} symbols`,
        timestamp: new Date()
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update subscriptions',
        timestamp: new Date()
      }
    }
  }

  // ===== MARKET DATA ACCESS =====

  public async getCurrentPrices(
    agentId: string, 
    symbols?: string[]
  ): Promise<MarketDataResponse<MarketPrice[]>> {
    try {
      const access = this.agentAccess.get(agentId)
      if (!access) {
        throw new Error('Agent not registered for market data access')
      }

      const requestedSymbols = symbols || access.subscribedSymbols
      const response = await globalMarketDataManager.getCurrentPrices(requestedSymbols)

      if (response.success && response.data) {
        // Log access for analytics
        await this.logMarketDataAccess(agentId, 'current_prices', requestedSymbols)
      }

      return response
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get current prices',
        timestamp: new Date()
      }
    }
  }

  public async getHistoricalData(
    agentId: string,
    symbol: string,
    timeframe: string = '1h',
    limit: number = 100
  ): Promise<MarketDataResponse<HistoricalPrice[]>> {
    try {
      const access = this.agentAccess.get(agentId)
      if (!access) {
        throw new Error('Agent not registered for market data access')
      }

      if (!access.permissions.canAccessHistorical) {
        throw new Error('Agent does not have permission to access historical data')
      }

      const to = new Date()
      const from = new Date(to.getTime() - this.getTimeframeMs(timeframe) * limit)

      const data = await marketDataPersistence.getHistorical(symbol, from, to, timeframe)

      // Log access
      await this.logMarketDataAccess(agentId, 'historical_data', [symbol])

      return {
        success: true,
        data,
        message: `Retrieved ${data.length} historical data points for ${symbol}`,
        timestamp: new Date()
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get historical data',
        timestamp: new Date()
      }
    }
  }

  // ===== MARKET ANALYSIS =====

  public async requestMarketAnalysis(
    request: AgentMarketDataRequest
  ): Promise<MarketDataResponse<MarketAnalysis>> {
    try {
      const access = this.agentAccess.get(request.agentId)
      if (!access) {
        throw new Error('Agent not registered for market data access')
      }

      if (!access.permissions.canPerformAnalysis) {
        throw new Error('Agent does not have permission to perform market analysis')
      }

      // Get current price data for analysis
      const priceResponse = await this.getCurrentPrices(request.agentId, request.symbols)
      if (!priceResponse.success || !priceResponse.data) {
        throw new Error('Failed to get market data for analysis')
      }

      const prices = priceResponse.data
      const primarySymbol = request.symbols[0]
      const primaryPrice = prices.find(p => p.symbol === primarySymbol)

      if (!primaryPrice) {
        throw new Error(`No data available for symbol ${primarySymbol}`)
      }

      // Generate market analysis
      const analysis = await this.generateMarketAnalysis(
        primarySymbol,
        primaryPrice,
        request.analysisType,
        request.parameters || {}
      )

      // Store analysis in agent's history
      access.analysisHistory.push(analysis)
      if (access.analysisHistory.length > 50) {
        access.analysisHistory = access.analysisHistory.slice(-50) // Keep last 50
      }

      // Store in persistence layer
      await marketDataPersistence.storeAnalysis(analysis)

      // Create todo for agent if analysis suggests action
      if (analysis.signals.buy > 70 || analysis.signals.sell > 70) {
        await agentTodoService.createTodo({
          agentId: request.agentId,
          title: `Market Analysis Signal: ${primarySymbol}`,
          description: `Analysis indicates ${analysis.signals.buy > 70 ? 'BUY' : 'SELL'} signal for ${primarySymbol}. Confidence: ${Math.max(analysis.signals.buy, analysis.signals.sell)}%. ${analysis.analysis}`,
          priority: analysis.confidence > 80 ? 'high' : 'medium',
          category: 'trading',
          assignedBy: 'system',
          hierarchyLevel: 'individual',
          context: {
            marketAnalysis: analysis,
            symbol: primarySymbol,
            signal: analysis.signals.buy > 70 ? 'buy' : 'sell'
          }
        })
      }

      // Execute callback if provided
      if (request.callback) {
        request.callback(analysis)
      }

      return {
        success: true,
        data: analysis,
        message: `Market analysis completed for ${primarySymbol}`,
        timestamp: new Date()
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to perform market analysis',
        timestamp: new Date()
      }
    }
  }

  private async generateMarketAnalysis(
    symbol: string,
    price: MarketPrice,
    analysisType: string,
    parameters: Record<string, any>
  ): Promise<MarketAnalysis> {
    // Get historical data for technical analysis
    const historicalResponse = await this.getHistoricalData(
      'system', // Use system access for analysis
      symbol,
      '1h',
      50
    )

    const historical = historicalResponse.data || []
    
    // Calculate technical indicators
    const indicators = this.calculateTechnicalIndicators(historical, price)
    
    // Determine trend and strength
    const trend = this.determineTrend(historical, indicators)
    const strength = this.calculateTrendStrength(historical, indicators)
    
    // Generate trading signals
    const signals = this.generateTradingSignals(indicators, trend, strength)
    
    // Find support and resistance levels
    const { supportLevels, resistanceLevels } = this.findSupportResistance(historical)
    
    // Generate analysis text
    const analysisText = this.generateAnalysisText(symbol, trend, strength, signals, indicators)
    
    // Calculate confidence
    const confidence = this.calculateAnalysisConfidence(signals, indicators, historical.length)

    return {
      symbol,
      timestamp: new Date(),
      trend,
      strength,
      indicators,
      signals,
      supportLevels,
      resistanceLevels,
      analysis: analysisText,
      confidence
    }
  }

  private calculateTechnicalIndicators(historical: HistoricalPrice[], currentPrice: MarketPrice) {
    if (historical.length < 20) {
      // Not enough data for technical analysis
      return {
        rsi: 50,
        macd: 0,
        sma20: currentPrice.price,
        sma50: currentPrice.price,
        bollingerPosition: 0,
        volumeProfile: 'normal' as const
      }
    }

    const closes = historical.map(h => h.close)
    const volumes = historical.map(h => h.volume)
    
    // Simple Moving Averages
    const sma20 = this.calculateSMA(closes.slice(-20))
    const sma50 = this.calculateSMA(closes.slice(-50))
    
    // RSI calculation
    const rsi = this.calculateRSI(closes.slice(-14))
    
    // MACD calculation
    const macd = this.calculateMACD(closes)
    
    // Bollinger Bands position
    const bollingerPosition = this.calculateBollingerPosition(closes.slice(-20), currentPrice.price)
    
    // Volume profile
    const avgVolume = volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length
    const volumeProfile = currentPrice.volume24h > avgVolume * 1.5 ? 'high' :
                         currentPrice.volume24h < avgVolume * 0.5 ? 'low' : 'normal'

    return {
      rsi,
      macd,
      sma20,
      sma50,
      bollingerPosition,
      volumeProfile
    }
  }

  private calculateSMA(prices: number[]): number {
    return prices.reduce((sum, price) => sum + price, 0) / prices.length
  }

  private calculateRSI(prices: number[]): number {
    if (prices.length < 14) return 50

    let gains = 0
    let losses = 0
    
    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1]
      if (change > 0) gains += change
      else losses -= change
    }
    
    const avgGain = gains / 13
    const avgLoss = losses / 13
    
    if (avgLoss === 0) return 100
    const rs = avgGain / avgLoss
    return 100 - (100 / (1 + rs))
  }

  private calculateMACD(prices: number[]): number {
    if (prices.length < 26) return 0
    
    const ema12 = this.calculateEMA(prices.slice(-12), 12)
    const ema26 = this.calculateEMA(prices.slice(-26), 26)
    
    return ema12 - ema26
  }

  private calculateEMA(prices: number[], period: number): number {
    if (prices.length === 0) return 0
    
    const multiplier = 2 / (period + 1)
    let ema = prices[0]
    
    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] * multiplier) + (ema * (1 - multiplier))
    }
    
    return ema
  }

  private calculateBollingerPosition(prices: number[], currentPrice: number): number {
    const sma = this.calculateSMA(prices)
    const variance = prices.reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / prices.length
    const stdDev = Math.sqrt(variance)
    
    const upperBand = sma + (2 * stdDev)
    const lowerBand = sma - (2 * stdDev)
    
    if (upperBand === lowerBand) return 0
    
    return (currentPrice - lowerBand) / (upperBand - lowerBand) * 2 - 1 // -1 to 1
  }

  private determineTrend(historical: HistoricalPrice[], indicators: any): 'bullish' | 'bearish' | 'neutral' {
    const { sma20, sma50, rsi, macd } = indicators
    
    let bullishScore = 0
    let bearishScore = 0
    
    // Price vs Moving Averages
    if (historical.length > 0) {
      const currentPrice = historical[historical.length - 1].close
      if (currentPrice > sma20) bullishScore++
      else bearishScore++
      
      if (currentPrice > sma50) bullishScore++
      else bearishScore++
    }
    
    // SMA relationship
    if (sma20 > sma50) bullishScore++
    else bearishScore++
    
    // RSI
    if (rsi > 50) bullishScore++
    else bearishScore++
    
    // MACD
    if (macd > 0) bullishScore++
    else bearishScore++
    
    if (bullishScore > bearishScore + 1) return 'bullish'
    if (bearishScore > bullishScore + 1) return 'bearish'
    return 'neutral'
  }

  private calculateTrendStrength(historical: HistoricalPrice[], indicators: any): number {
    const { rsi, macd } = indicators
    
    // Calculate price momentum
    if (historical.length < 10) return 50
    
    const recentPrices = historical.slice(-10).map(h => h.close)
    const momentum = (recentPrices[recentPrices.length - 1] - recentPrices[0]) / recentPrices[0] * 100
    
    // Combine momentum with indicators
    let strength = 50 + momentum * 10 // Base strength on momentum
    
    // Adjust based on RSI extremes
    if (rsi > 70) strength += 10
    else if (rsi < 30) strength += 10
    
    // Adjust based on MACD
    strength += Math.abs(macd) * 5
    
    return Math.max(0, Math.min(100, strength))
  }

  private generateTradingSignals(indicators: any, trend: string, strength: number) {
    const { rsi, macd, bollingerPosition } = indicators
    
    let buySignal = 0
    let sellSignal = 0
    let holdSignal = 0
    
    // Trend-based signals
    if (trend === 'bullish') {
      buySignal += 30
      holdSignal += 20
    } else if (trend === 'bearish') {
      sellSignal += 30
      holdSignal += 20
    } else {
      holdSignal += 40
    }
    
    // RSI signals
    if (rsi < 30) buySignal += 25 // Oversold
    else if (rsi > 70) sellSignal += 25 // Overbought
    else holdSignal += 10
    
    // MACD signals
    if (macd > 0.5) buySignal += 15
    else if (macd < -0.5) sellSignal += 15
    else holdSignal += 5
    
    // Bollinger position
    if (bollingerPosition < -0.8) buySignal += 10 // Near lower band
    else if (bollingerPosition > 0.8) sellSignal += 10 // Near upper band
    
    // Strength adjustment
    const strengthMultiplier = strength / 100
    buySignal *= strengthMultiplier
    sellSignal *= strengthMultiplier
    
    // Normalize to 100
    const total = buySignal + sellSignal + holdSignal
    if (total > 0) {
      buySignal = (buySignal / total) * 100
      sellSignal = (sellSignal / total) * 100
      holdSignal = (holdSignal / total) * 100
    }
    
    return { buy: buySignal, sell: sellSignal, hold: holdSignal }
  }

  private findSupportResistance(historical: HistoricalPrice[]): { supportLevels: number[], resistanceLevels: number[] } {
    if (historical.length < 20) {
      return { supportLevels: [], resistanceLevels: [] }
    }
    
    const highs = historical.map(h => h.high)
    const lows = historical.map(h => h.low)
    
    // Simple support/resistance calculation
    const sortedLows = [...lows].sort((a, b) => a - b)
    const sortedHighs = [...highs].sort((a, b) => b - a)
    
    const supportLevels = sortedLows.slice(0, 3) // Bottom 3 lows
    const resistanceLevels = sortedHighs.slice(0, 3) // Top 3 highs
    
    return { supportLevels, resistanceLevels }
  }

  private generateAnalysisText(
    symbol: string,
    trend: string,
    strength: number,
    signals: any,
    indicators: any
  ): string {
    const { rsi, macd, sma20, sma50 } = indicators
    
    let analysis = `Market analysis for ${symbol}: `
    
    // Trend description
    analysis += `The current trend is ${trend} with ${strength.toFixed(0)}% strength. `
    
    // RSI analysis
    if (rsi > 70) {
      analysis += `RSI is overbought at ${rsi.toFixed(1)}, suggesting potential downward pressure. `
    } else if (rsi < 30) {
      analysis += `RSI is oversold at ${rsi.toFixed(1)}, suggesting potential upward momentum. `
    } else {
      analysis += `RSI is neutral at ${rsi.toFixed(1)}. `
    }
    
    // Moving average analysis
    if (sma20 > sma50) {
      analysis += `Short-term MA is above long-term MA, indicating bullish momentum. `
    } else {
      analysis += `Short-term MA is below long-term MA, indicating bearish momentum. `
    }
    
    // MACD analysis
    if (macd > 0) {
      analysis += `MACD is positive, confirming upward momentum. `
    } else {
      analysis += `MACD is negative, confirming downward momentum. `
    }
    
    // Signal summary
    const topSignal = Math.max(signals.buy, signals.sell, signals.hold)
    if (signals.buy === topSignal) {
      analysis += `Overall recommendation: BUY with ${signals.buy.toFixed(1)}% confidence.`
    } else if (signals.sell === topSignal) {
      analysis += `Overall recommendation: SELL with ${signals.sell.toFixed(1)}% confidence.`
    } else {
      analysis += `Overall recommendation: HOLD with ${signals.hold.toFixed(1)}% confidence.`
    }
    
    return analysis
  }

  private calculateAnalysisConfidence(signals: any, indicators: any, dataPoints: number): number {
    // Base confidence on data availability
    let confidence = Math.min(100, (dataPoints / 50) * 100)
    
    // Reduce confidence for conflicting signals
    const signalSpread = Math.max(signals.buy, signals.sell, signals.hold) - 
                        Math.min(signals.buy, signals.sell, signals.hold)
    confidence *= (signalSpread / 100)
    
    // Adjust for indicator extremes (higher confidence at extremes)
    if (indicators.rsi > 70 || indicators.rsi < 30) {
      confidence *= 1.2
    }
    
    return Math.max(0, Math.min(100, confidence))
  }

  // ===== TRADING CONTEXT =====

  private async updateTradingContext(agentId: string): Promise<void> {
    try {
      const access = this.agentAccess.get(agentId)
      if (!access) return

      // Get current market data
      const priceResponse = await this.getCurrentPrices(agentId)
      const marketData = priceResponse.data || []

      // Get recent analysis
      const recentAnalysis = access.analysisHistory.slice(-10)

      // Get active signals
      const activeSignals = this.activeSignals.get(agentId) || []

      const context: AgentTradingContext = {
        agentId,
        strategy: 'adaptive', // This would come from agent configuration
        marketData,
        analysis: recentAnalysis,
        sentiment: [], // Would be populated from sentiment analysis
        correlations: [], // Would be calculated from market data
        activeSignals,
        riskLimits: {
          maxPositionSize: 10000,
          maxDailyLoss: 1000,
          maxDrawdown: 0.1
        }
      }

      this.tradingContexts.set(agentId, context)
    } catch (error) {
      console.error(`Failed to update trading context for agent ${agentId}:`, error)
    }
  }

  public getTradingContext(agentId: string): AgentTradingContext | null {
    return this.tradingContexts.get(agentId) || null
  }

  // ===== EVENT HANDLING =====

  private async handleMarketUpdate(prices: MarketPrice[]): Promise<void> {
    // Update all agent contexts with new market data
    for (const [agentId, access] of this.agentAccess) {
      const relevantPrices = prices.filter(p => access.subscribedSymbols.includes(p.symbol))
      if (relevantPrices.length > 0) {
        await this.updateTradingContext(agentId)
        
        // Check for alert conditions
        await this.checkAlertConditions(agentId, relevantPrices)
        
        // Execute strategy analysis on market updates
        await this.executeStrategyAnalysisOnUpdate(agentId, relevantPrices)
      }
    }
  }

  /**
   * Execute strategy analysis when market data updates
   */
  private async executeStrategyAnalysisOnUpdate(agentId: string, prices: MarketPrice[]): Promise<void> {
    try {
      // Get agent's assigned strategies
      const agentPerformance = await agentStrategyIntegration.getAgentStrategyPerformance(agentId)
      if (!agentPerformance.success) {
        console.warn(`Agent ${agentId} not registered for strategy access`)
        return
      }

      // Execute strategy analysis for each relevant price update
      for (const price of prices) {
        // Get agent's preferred strategies for this symbol
        const strategies = await this.getAgentStrategiesForSymbol(agentId, price.symbol)
        
        for (const strategyType of strategies) {
          try {
            // Execute strategy analysis
            const analysisResult = await agentStrategyIntegration.executeStrategyAnalysis(
              agentId,
              strategyType,
              price.symbol,
              price
            )

            if (analysisResult.success && analysisResult.analysis) {
              // Check if analysis indicates a strong signal
              const signalStrength = analysisResult.analysis.analysis?.signal_strength || 0
              const signalType = analysisResult.analysis.analysis?.signal_type || 'hold'
              const confidence = analysisResult.analysis.analysis?.confidence || 0

              // Generate trading signal if criteria met
              if (signalStrength > 70 && confidence > 60 && signalType !== 'hold') {
                await this.generateTradingSignalFromAnalysis(
                  agentId,
                  strategyType,
                  price.symbol,
                  price,
                  analysisResult.analysis
                )
              }
            }
          } catch (error) {
            console.error(`Strategy analysis failed for ${agentId}/${strategyType}/${price.symbol}:`, error)
          }
        }
      }
    } catch (error) {
      console.error(`Strategy execution on market update failed for ${agentId}:`, error)
    }
  }

  /**
   * Generate trading signal from strategy analysis
   */
  private async generateTradingSignalFromAnalysis(
    agentId: string,
    strategyType: StrategyType,
    symbol: string,
    price: MarketPrice,
    analysis: any
  ): Promise<void> {
    try {
      const signalResult = await agentStrategyIntegration.generateStrategySignals(
        agentId,
        strategyType,
        symbol,
        price
      )

      if (signalResult.success && signalResult.signals) {
        const signal = signalResult.signals[0]
        
        // Create todo for agent about the signal
        await agentTodoService.createTodo({
          agentId,
          title: `Strategy Signal: ${strategyType} - ${symbol}`,
          description: `${signal.recommendation} Entry: $${signal.entryPrice.toFixed(2)}, Confidence: ${signal.confidence.toFixed(1)}%`,
          priority: signal.confidence > 80 ? 'high' : signal.confidence > 60 ? 'medium' : 'low',
          category: 'trading',
          assignedBy: 'strategy_system',
          hierarchyLevel: 'individual',
          context: {
            strategySignal: signal,
            marketData: {
              symbol,
              price: price.price,
              change24h: price.change24h,
              volume: price.volume24h
            }
          }
        })

        // Log the signal generation
        console.log(`📊 Strategy Signal Generated: ${agentId}/${strategyType}/${symbol} - ${signal.signalType.toUpperCase()} (${signal.confidence.toFixed(1)}% confidence)`)

        // Track strategy execution for performance analytics
        await this.trackStrategyExecution(
          agentId,
          strategyType,
          symbol,
          signal,
          analysis
        )
      }
    } catch (error) {
      console.error(`Failed to generate trading signal for ${agentId}:`, error)
    }
  }

  /**
   * Get agent's strategies for a specific symbol
   */
  private async getAgentStrategiesForSymbol(agentId: string, symbol: string): Promise<StrategyType[]> {
    try {
      // Get agent's performance data to determine assigned strategies
      const performanceResult = await agentStrategyIntegration.getAgentStrategyPerformance(agentId)
      if (!performanceResult.success) {
        return []
      }

      // For now, return all strategies - in a real implementation, 
      // this would filter based on agent preferences and symbol compatibility
      return Object.values(STRATEGY_TYPES).slice(0, 3) // Limit to 3 strategies per update
    } catch (error) {
      console.error(`Failed to get strategies for ${agentId}/${symbol}:`, error)
      return []
    }
  }

  private async checkAlertConditions(agentId: string, prices: MarketPrice[]): Promise<void> {
    const access = this.agentAccess.get(agentId)
    if (!access) return

    for (const price of prices) {
      // Check for significant price movements
      if (Math.abs(price.changePercent24h) > 10) {
        const event: MarketEvent = {
          id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'price_alert',
          symbol: price.symbol,
          timestamp: new Date(),
          description: `${price.symbol} has moved ${price.changePercent24h.toFixed(2)}% in 24h`,
          severity: Math.abs(price.changePercent24h) > 20 ? 'high' : 'medium',
          data: { price, changePercent: price.changePercent24h },
          triggered: true,
          agentNotified: false
        }

        // Store event
        access.alerts.push(event)
        await marketDataPersistence.storeEvent(event)

        // Create todo for agent
        await agentTodoService.createTodo({
          agentId,
          title: `Price Alert: ${price.symbol}`,
          description: event.description,
          priority: event.severity === 'high' ? 'high' : 'medium',
          category: 'trading',
          assignedBy: 'system',
          hierarchyLevel: 'individual',
          context: {
            marketEvent: event,
            symbol: price.symbol,
            priceChange: price.changePercent24h
          }
        })

        event.agentNotified = true
      }
    }
  }

  // ===== STRATEGY PERFORMANCE TRACKING =====

  /**
   * Track strategy execution for performance analytics
   */
  private async trackStrategyExecution(
    agentId: string,
    strategyType: StrategyType,
    symbol: string,
    signal: any,
    analysis: any
  ): Promise<void> {
    try {
      // Log strategy execution to database
      const { error } = await supabase
        .from('strategy_executions')
        .insert([
          {
            agent_id: agentId,
            strategy_type: strategyType,
            symbol: symbol,
            signal_type: signal.signalType,
            entry_price: signal.entryPrice,
            confidence: signal.confidence,
            market_conditions: {
              price: signal.entryPrice,
              volume: analysis.volume || 0,
              volatility: analysis.volatility || 0,
              trend: analysis.trend || 'neutral',
              indicators: analysis.indicators || {}
            },
            analysis_data: {
              signal_strength: analysis.signal_strength || 0,
              market_context: analysis.market_context || {},
              parameters: analysis.parameters || {}
            },
            executed_at: new Date().toISOString(),
            status: 'pending'
          }
        ])

      if (error) {
        console.error('Failed to log strategy execution:', error)
      }
    } catch (error) {
      console.error('Error tracking strategy execution:', error)
    }
  }

  /**
   * Get strategy performance analytics for an agent
   */
  public async getStrategyPerformanceAnalytics(
    agentId: string,
    strategyType?: StrategyType,
    timeframe?: string
  ): Promise<MarketDataResponse<any>> {
    try {
      if (strategyType) {
        // Get performance for specific strategy
        const metrics = await strategyPerformanceAnalytics.calculateStrategyPerformance(
          strategyType,
          agentId,
          timeframe
        )

        const suggestions = await strategyPerformanceAnalytics.generateOptimizationSuggestions(
          strategyType,
          agentId
        )

        return {
          success: true,
          data: {
            metrics,
            suggestions,
            strategyType
          },
          message: `Performance analytics retrieved for ${strategyType}`,
          timestamp: new Date()
        }
      } else {
        // Get comparison across all strategies
        const comparison = await strategyPerformanceAnalytics.compareStrategies(
          Object.values(STRATEGY_TYPES),
          timeframe || '30d',
          agentId
        )

        return {
          success: true,
          data: { comparison },
          message: 'Strategy comparison analytics retrieved',
          timestamp: new Date()
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get performance analytics',
        timestamp: new Date()
      }
    }
  }

  /**
   * Track strategy learning and adaptation
   */
  public async trackStrategyLearning(
    agentId: string,
    strategyType: StrategyType,
    marketCondition: string,
    adaptationMade: string,
    performanceImpact: number,
    confidence: number
  ): Promise<MarketDataResponse<void>> {
    try {
      await strategyPerformanceAnalytics.trackStrategyLearning(
        strategyType,
        agentId,
        {
          marketCondition,
          adaptationMade,
          performanceImpact,
          confidence
        }
      )

      return {
        success: true,
        message: 'Strategy learning tracked successfully',
        timestamp: new Date()
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to track strategy learning',
        timestamp: new Date()
      }
    }
  }

  /**
   * Get strategy performance trends
   */
  public async getStrategyTrends(
    agentId: string,
    strategyType: StrategyType,
    periods: string[] = ['7d', '30d', '90d']
  ): Promise<MarketDataResponse<any>> {
    try {
      const trends = await strategyPerformanceAnalytics.getPerformanceTrends(
        strategyType,
        agentId,
        periods
      )

      return {
        success: true,
        data: { trends, strategyType },
        message: `Performance trends retrieved for ${strategyType}`,
        timestamp: new Date()
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get strategy trends',
        timestamp: new Date()
      }
    }
  }

  /**
   * Update strategy execution result
   */
  public async updateStrategyExecutionResult(
    agentId: string,
    executionId: string,
    result: {
      status: 'completed' | 'failed' | 'cancelled'
      return_amount?: number
      return_percent?: number
      exit_price?: number
      hold_time_hours?: number
      notes?: string
    }
  ): Promise<MarketDataResponse<void>> {
    try {
      const { error } = await supabase
        .from('strategy_executions')
        .update({
          status: result.status,
          result: {
            return_amount: result.return_amount || 0,
            return_percent: result.return_percent || 0,
            exit_price: result.exit_price || 0,
            hold_time_hours: result.hold_time_hours || 0,
            notes: result.notes || ''
          },
          completed_at: new Date().toISOString()
        })
        .eq('id', executionId)
        .eq('agent_id', agentId)

      if (error) throw error

      return {
        success: true,
        message: 'Strategy execution result updated',
        timestamp: new Date()
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update execution result',
        timestamp: new Date()
      }
    }
  }

  // ===== UTILITY METHODS =====

  private getTimeframeMs(timeframe: string): number {
    const unit = timeframe.slice(-1)
    const value = parseInt(timeframe.slice(0, -1))
    
    switch (unit) {
      case 'm': return value * 60 * 1000
      case 'h': return value * 60 * 60 * 1000
      case 'd': return value * 24 * 60 * 60 * 1000
      default: return 60 * 60 * 1000 // default 1 hour
    }
  }

  private async logMarketDataAccess(
    agentId: string,
    accessType: string,
    symbols: string[]
  ): Promise<void> {
    try {
      // Log access for analytics (could be stored in database)
      console.log(`Agent ${agentId} accessed ${accessType} for symbols: ${symbols.join(', ')}`)
    } catch (error) {
      console.warn('Failed to log market data access:', error)
    }
  }

  // ===== PUBLIC API =====

  public getAgentAccess(agentId: string): AgentMarketAccess | null {
    return this.agentAccess.get(agentId) || null
  }

  public getActiveSignals(agentId: string): TradingSignal[] {
    return this.activeSignals.get(agentId) || []
  }

  public async createTradingSignal(
    agentId: string,
    symbol: string,
    type: 'buy' | 'sell' | 'hold',
    confidence: number,
    reasoning: string,
    analysis: MarketAnalysis
  ): Promise<MarketDataResponse<TradingSignal>> {
    try {
      const access = this.agentAccess.get(agentId)
      if (!access) {
        throw new Error('Agent not registered for market data access')
      }

      const priceResponse = await this.getCurrentPrices(agentId, [symbol])
      if (!priceResponse.success || !priceResponse.data) {
        throw new Error('Failed to get current price for signal')
      }

      const currentPrice = priceResponse.data[0]
      
      const signal: TradingSignal = {
        id: `signal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        agentId,
        symbol,
        type,
        confidence,
        price: currentPrice.price,
        timestamp: new Date(),
        reasoning,
        marketAnalysis: analysis,
        executed: false
      }

      // Store signal
      access.tradingSignals.push(signal)
      let agentSignals = this.activeSignals.get(agentId) || []
      agentSignals.push(signal)
      this.activeSignals.set(agentId, agentSignals)

      // Create todo for signal execution
      await agentTodoService.createTodo({
        agentId,
        title: `Trading Signal: ${type.toUpperCase()} ${symbol}`,
        description: `${reasoning} Confidence: ${confidence}%. Current price: $${currentPrice.price.toFixed(2)}`,
        priority: confidence > 80 ? 'high' : 'medium',
        category: 'trading',
        assignedBy: 'system',
        hierarchyLevel: 'individual',
        context: {
          tradingSignal: signal,
          symbol,
          type,
          confidence
        }
      })

      return {
        success: true,
        data: signal,
        message: `Trading signal created for ${symbol}`,
        timestamp: new Date()
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create trading signal',
        timestamp: new Date()
      }
    }
  }

  public async executeSignal(signalId: string, executedPrice: number): Promise<void> {
    for (const [agentId, signals] of this.activeSignals) {
      const signal = signals.find(s => s.id === signalId)
      if (signal) {
        signal.executed = true
        signal.result = {
          executedPrice,
          pnl: (executedPrice - signal.price) * (signal.type === 'buy' ? 1 : -1),
          executedAt: new Date()
        }

        // Update agent access
        const access = this.agentAccess.get(agentId)
        if (access) {
          const accessSignal = access.tradingSignals.find(s => s.id === signalId)
          if (accessSignal) {
            accessSignal.executed = true
            accessSignal.result = signal.result
          }
        }
        break
      }
    }
  }
}

// Export singleton instance
export const agentMarketDataService = new AgentMarketDataService()
export default agentMarketDataService