'use client'

import { EventEmitter } from 'events'

export interface DEXPrice {
  dex: string
  symbol: string
  price: number
  liquidity: number
  gasEstimate: number
  timestamp: Date
}

export interface ArbitrageOpportunity {
  id: string
  symbol: string
  buyDEX: string
  sellDEX: string
  buyPrice: number
  sellPrice: number
  priceSpread: number
  profitUSD: number
  profitPercent: number
  gasEstimate: number
  netProfit: number
  confidence: number
  liquidityScore: number
  executionRisk: 'low' | 'medium' | 'high'
  timestamp: Date
  estimatedExecutionTime: number
}

export interface DEXConfig {
  name: string
  chain: 'ethereum' | 'arbitrum' | 'polygon'
  testnet: boolean
  routerAddress: string
  factoryAddress: string
  gasMultiplier: number
  minLiquidity: number
}

class DEXArbitrageEngine extends EventEmitter {
  private prices: Map<string, DEXPrice[]> = new Map()
  private opportunities: ArbitrageOpportunity[] = []
  private isRunning = false
  private priceUpdateInterval?: NodeJS.Timeout
  private arbitrageScanInterval?: NodeJS.Timeout

  private readonly DEX_CONFIGS: DEXConfig[] = [
    {
      name: 'Uniswap V3',
      chain: 'ethereum',
      testnet: true,
      routerAddress: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
      factoryAddress: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
      gasMultiplier: 1.2,
      minLiquidity: 1000
    },
    {
      name: 'SushiSwap',
      chain: 'ethereum',
      testnet: true,
      routerAddress: '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F',
      factoryAddress: '0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac',
      gasMultiplier: 1.1,
      minLiquidity: 500
    },
    {
      name: 'Uniswap V3 Arbitrum',
      chain: 'arbitrum',
      testnet: true,
      routerAddress: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
      factoryAddress: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
      gasMultiplier: 0.1, // Much lower gas on Arbitrum
      minLiquidity: 1000
    }
  ]

  private readonly SUPPORTED_PAIRS = [
    'WETH/USDC',
    'WBTC/USDC', 
    'WETH/USDT',
    'UNI/USDC',
    'LINK/USDC',
    'AAVE/USDC'
  ]

  constructor() {
    super()
    this.initializeMockData()
  }

  start() {
    if (this.isRunning) return

    this.isRunning = true
    console.log('🔄 Starting DEX Arbitrage Engine...')

    // Update prices every 10 seconds
    this.priceUpdateInterval = setInterval(() => {
      this.updatePrices()
    }, 10000)

    // Scan for arbitrage every 15 seconds
    this.arbitrageScanInterval = setInterval(() => {
      this.scanForArbitrage()
    }, 15000)

    // Initial updates
    this.updatePrices()
    setTimeout(() => this.scanForArbitrage(), 2000)
  }

  stop() {
    if (!this.isRunning) return

    this.isRunning = false
    console.log('⏹️ Stopping DEX Arbitrage Engine...')

    if (this.priceUpdateInterval) {
      clearInterval(this.priceUpdateInterval)
      this.priceUpdateInterval = undefined
    }

    if (this.arbitrageScanInterval) {
      clearInterval(this.arbitrageScanInterval)
      this.arbitrageScanInterval = undefined
    }
  }

  private initializeMockData() {
    // Initialize with mock prices for testing
    for (const pair of this.SUPPORTED_PAIRS) {
      const prices: DEXPrice[] = []
      
      for (const dex of this.DEX_CONFIGS) {
        prices.push({
          dex: dex.name,
          symbol: pair,
          price: this.generateMockPrice(pair),
          liquidity: Math.random() * 50000 + 10000,
          gasEstimate: Math.random() * 20 + 10,
          timestamp: new Date()
        })
      }
      
      this.prices.set(pair, prices)
    }
  }

  private generateMockPrice(pair: string): number {
    const basePrices = {
      'WETH/USDC': 2300,
      'WBTC/USDC': 43000,
      'WETH/USDT': 2305,
      'UNI/USDC': 7.2,
      'LINK/USDC': 14.5,
      'AAVE/USDC': 95
    }

    const basePrice = basePrices[pair as keyof typeof basePrices] || 100
    // Add some random variation (±2%)
    const variation = (Math.random() - 0.5) * 0.04
    return basePrice * (1 + variation)
  }

  private updatePrices() {
    for (const pair of this.SUPPORTED_PAIRS) {
      const currentPrices = this.prices.get(pair) || []
      
      // Update each DEX price with slight variation
      for (const priceData of currentPrices) {
        // Add random walk (±0.1%)
        const change = (Math.random() - 0.5) * 0.002
        priceData.price *= (1 + change)
        priceData.timestamp = new Date()
        priceData.liquidity = Math.max(1000, priceData.liquidity + (Math.random() - 0.5) * 1000)
        priceData.gasEstimate = Math.max(5, Math.random() * 25 + 8)
      }
      
      this.prices.set(pair, currentPrices)
    }

    this.emit('pricesUpdated', this.getAllPrices())
  }

  private scanForArbitrage() {
    const newOpportunities: ArbitrageOpportunity[] = []

    for (const pair of this.SUPPORTED_PAIRS) {
      const prices = this.prices.get(pair) || []
      
      // Find arbitrage opportunities between all DEX pairs
      for (let i = 0; i < prices.length; i++) {
        for (let j = i + 1; j < prices.length; j++) {
          const buyDEX = prices[i]
          const sellDEX = prices[j]
          
          // Check both directions
          const opp1 = this.calculateArbitrage(buyDEX, sellDEX, pair)
          const opp2 = this.calculateArbitrage(sellDEX, buyDEX, pair)
          
          if (opp1 && opp1.profitPercent > 0.5) newOpportunities.push(opp1)
          if (opp2 && opp2.profitPercent > 0.5) newOpportunities.push(opp2)
        }
      }
    }

    // Sort by profitability
    newOpportunities.sort((a, b) => b.netProfit - a.netProfit)

    // Keep top 20 opportunities
    this.opportunities = newOpportunities.slice(0, 20)

    if (this.opportunities.length > 0) {
      this.emit('arbitrageFound', this.opportunities)
    }
  }

  private calculateArbitrage(
    buyDEX: DEXPrice, 
    sellDEX: DEXPrice, 
    pair: string
  ): ArbitrageOpportunity | null {
    if (buyDEX.price >= sellDEX.price) return null

    const tradeAmount = 1000 // $1000 trade size
    const buyQuantity = tradeAmount / buyDEX.price
    const sellRevenue = buyQuantity * sellDEX.price
    
    const priceSpread = sellDEX.price - buyDEX.price
    const grossProfit = sellRevenue - tradeAmount
    
    // Calculate gas costs (higher for cross-chain)
    const totalGasCost = buyDEX.gasEstimate + sellDEX.gasEstimate
    const isCrossChain = this.getDEXChain(buyDEX.dex) !== this.getDEXChain(sellDEX.dex)
    const gasCostMultiplier = isCrossChain ? 2.5 : 1.0
    const estimatedGasCost = totalGasCost * gasCostMultiplier

    const netProfit = grossProfit - estimatedGasCost
    const profitPercent = (netProfit / tradeAmount) * 100

    // Calculate risk and confidence
    const liquidityScore = Math.min(buyDEX.liquidity, sellDEX.liquidity) / 10000
    const priceStability = 1 - Math.abs(priceSpread / buyDEX.price)
    const confidence = (liquidityScore * 0.6 + priceStability * 0.4) * 100

    let executionRisk: 'low' | 'medium' | 'high' = 'low'
    if (isCrossChain || estimatedGasCost > 50) executionRisk = 'high'
    else if (profitPercent < 2 || liquidityScore < 0.5) executionRisk = 'medium'

    return {
      id: `arb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      symbol: pair,
      buyDEX: buyDEX.dex,
      sellDEX: sellDEX.dex,
      buyPrice: buyDEX.price,
      sellPrice: sellDEX.price,
      priceSpread,
      profitUSD: netProfit,
      profitPercent,
      gasEstimate: estimatedGasCost,
      netProfit,
      confidence,
      liquidityScore,
      executionRisk,
      timestamp: new Date(),
      estimatedExecutionTime: isCrossChain ? 180 : 30 // seconds
    }
  }

  private getDEXChain(dexName: string): string {
    const config = this.DEX_CONFIGS.find(d => d.name === dexName)
    return config?.chain || 'ethereum'
  }

  // Public methods
  getAllPrices(): Record<string, DEXPrice[]> {
    const result: Record<string, DEXPrice[]> = {}
    for (const [pair, prices] of this.prices.entries()) {
      result[pair] = prices
    }
    return result
  }

  getArbitrageOpportunities(): ArbitrageOpportunity[] {
    return [...this.opportunities]
  }

  getTopOpportunities(limit: number = 10): ArbitrageOpportunity[] {
    return this.opportunities.slice(0, limit)
  }

  async executeArbitrage(opportunityId: string): Promise<boolean> {
    const opportunity = this.opportunities.find(o => o.id === opportunityId)
    if (!opportunity) return false

    console.log(`🔄 Executing arbitrage: ${opportunity.symbol} - Buy ${opportunity.buyDEX}, Sell ${opportunity.sellDEX}`)
    console.log(`Expected profit: $${opportunity.netProfit.toFixed(2)} (${opportunity.profitPercent.toFixed(2)}%)`)

    // Simulate execution time
    await new Promise(resolve => setTimeout(resolve, opportunity.estimatedExecutionTime * 1000))

    // Remove executed opportunity
    this.opportunities = this.opportunities.filter(o => o.id !== opportunityId)

    this.emit('arbitrageExecuted', {
      opportunity,
      success: Math.random() > 0.15, // 85% success rate
      actualProfit: opportunity.netProfit * (0.8 + Math.random() * 0.4), // 80-120% of expected
      executionTime: opportunity.estimatedExecutionTime
    })

    return true
  }

  getDEXConfigs(): DEXConfig[] {
    return [...this.DEX_CONFIGS]
  }
}

// Lazy initialization
let dexArbitrageEngineInstance: DEXArbitrageEngine | null = null

export function getDexArbitrageEngine(): DEXArbitrageEngine {
  if (!dexArbitrageEngineInstance) {
    dexArbitrageEngineInstance = new DEXArbitrageEngine()
  }
  return dexArbitrageEngineInstance
}

// For backward compatibility
export const dexArbitrageEngine = {
  get instance() {
    return getDexArbitrageEngine()
  }
}

export default dexArbitrageEngine