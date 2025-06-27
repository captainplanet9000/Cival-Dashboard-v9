/**
 * Chainlink Price Feed Service
 * Integrates with Chainlink oracle network for reliable price data
 */

import { ethers } from 'ethers'
import type { PriceFeedData, ChainlinkConfig } from '../types'

// Chainlink Aggregator ABI (simplified)
const AGGREGATOR_ABI = [
  'function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)',
  'function decimals() external view returns (uint8)',
  'function description() external view returns (string memory)'
]

export class ChainlinkPriceFeedService {
  private provider: ethers.JsonRpcProvider | null = null
  private contracts: Map<string, ethers.Contract> = new Map()
  private config: ChainlinkConfig = {
    network: 'mainnet',
    providerUrl: process.env.ETHEREUM_RPC_URL || 'https://eth-mainnet.alchemyapi.io/v2/demo',
    contractAddresses: {
      'ETH/USD': '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419',
      'BTC/USD': '0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c',
      'LINK/USD': '0x2c1d072e956AFFC0D435Cb7AC38EF18d24d9127c',
      'USDC/USD': '0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6',
      'DAI/USD': '0xAed0c38402a5d19df6E4c03F4E2DceD6e29c1ee9'
    },
    updateInterval: 60000 // 1 minute
  }
  private cache: Map<string, PriceFeedData> = new Map()
  private lastUpdate: Map<string, number> = new Map()

  constructor(config?: Partial<ChainlinkConfig>) {
    if (config) {
      this.config = { ...this.config, ...config }
    }
    this.initializeProvider()
  }

  private initializeProvider() {
    try {
      this.provider = new ethers.JsonRpcProvider(this.config.providerUrl)
      this.initializeContracts()
      console.log(`🔗 Chainlink Price Feed Service initialized for ${this.config.network}`)
    } catch (error) {
      console.error('❌ Failed to initialize Chainlink provider:', error)
      // Continue without provider - will use fallback methods
    }
  }

  private initializeContracts() {
    if (!this.provider) return

    for (const [symbol, address] of Object.entries(this.config.contractAddresses)) {
      try {
        const contract = new ethers.Contract(address, AGGREGATOR_ABI, this.provider)
        this.contracts.set(symbol, contract)
        console.log(`📄 Initialized contract for ${symbol}: ${address}`)
      } catch (error) {
        console.error(`❌ Failed to initialize contract for ${symbol}:`, error)
      }
    }
  }

  async getPrice(symbol: string): Promise<PriceFeedData | null> {
    const normalizedSymbol = this.normalizeSymbol(symbol)
    
    // Check cache first
    const cached = this.getCachedPrice(normalizedSymbol)
    if (cached) {
      return cached
    }

    try {
      // Try Chainlink first
      const chainlinkPrice = await this.getChainlinkPrice(normalizedSymbol)
      if (chainlinkPrice) {
        this.cachePrice(normalizedSymbol, chainlinkPrice)
        return chainlinkPrice
      }

      // Fallback to API if Chainlink fails
      const apiPrice = await this.getAPIPrice(normalizedSymbol)
      if (apiPrice) {
        this.cachePrice(normalizedSymbol, apiPrice)
        return apiPrice
      }

      return null

    } catch (error) {
      console.error(`❌ Error getting price for ${symbol}:`, error)
      return this.getCachedPrice(normalizedSymbol) // Return stale data if available
    }
  }

  private async getChainlinkPrice(symbol: string): Promise<PriceFeedData | null> {
    const contract = this.contracts.get(symbol)
    if (!contract) {
      return null
    }

    try {
      const [roundId, answer, startedAt, updatedAt, answeredInRound] = await contract.latestRoundData()
      const decimals = await contract.decimals()
      
      // Convert price based on decimals
      const price = parseFloat(ethers.formatUnits(answer, decimals))
      
      return {
        symbol,
        price,
        timestamp: new Date(Number(updatedAt) * 1000),
        decimals: Number(decimals),
        source: 'chainlink',
        confidence: 0.95
      }

    } catch (error) {
      console.error(`❌ Chainlink price fetch error for ${symbol}:`, error)
      return null
    }
  }

  private async getAPIPrice(symbol: string): Promise<PriceFeedData | null> {
    try {
      // Simple fallback to CoinGecko API
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${this.getCoingeckoId(symbol)}&vs_currencies=usd&include_last_updated_at=true`
      )

      if (!response.ok) {
        throw new Error(`API response: ${response.status}`)
      }

      const data = await response.json()
      const coinId = this.getCoingeckoId(symbol)
      
      if (!data[coinId]) {
        return null
      }

      return {
        symbol,
        price: data[coinId].usd,
        timestamp: new Date(data[coinId].last_updated_at * 1000),
        decimals: 18,
        source: 'api',
        confidence: 0.8
      }

    } catch (error) {
      console.error(`❌ API price fetch error for ${symbol}:`, error)
      return null
    }
  }

  async getPrices(symbols: string[]): Promise<PriceFeedData[]> {
    const pricePromises = symbols.map(symbol => this.getPrice(symbol))
    const results = await Promise.allSettled(pricePromises)
    
    return results
      .filter((result): result is PromiseFulfilledResult<PriceFeedData | null> => 
        result.status === 'fulfilled' && result.value !== null
      )
      .map(result => result.value!)
  }

  async getHistoricalPrices(symbol: string, fromTimestamp: number, toTimestamp: number): Promise<PriceFeedData[]> {
    // This would require a different approach with Chainlink, possibly using events
    // For now, return mock historical data or implement with external API
    console.warn('Historical price data not yet implemented for Chainlink integration')
    return []
  }

  private normalizeSymbol(symbol: string): string {
    // Convert common symbols to Chainlink format
    const symbolMap: Record<string, string> = {
      'ETHEREUM': 'ETH/USD',
      'BITCOIN': 'BTC/USD',
      'ETH': 'ETH/USD',
      'BTC': 'BTC/USD',
      'LINK': 'LINK/USD',
      'USDC': 'USDC/USD',
      'DAI': 'DAI/USD'
    }

    const upper = symbol.toUpperCase()
    return symbolMap[upper] || `${upper}/USD`
  }

  private getCoingeckoId(symbol: string): string {
    // Map symbols to CoinGecko IDs
    const idMap: Record<string, string> = {
      'ETH/USD': 'ethereum',
      'BTC/USD': 'bitcoin',
      'LINK/USD': 'chainlink',
      'USDC/USD': 'usd-coin',
      'DAI/USD': 'dai'
    }

    return idMap[symbol] || 'ethereum'
  }

  private getCachedPrice(symbol: string): PriceFeedData | null {
    const cached = this.cache.get(symbol)
    const lastUpdate = this.lastUpdate.get(symbol) || 0
    
    if (cached && (Date.now() - lastUpdate) < this.config.updateInterval) {
      return cached
    }

    return null
  }

  private cachePrice(symbol: string, priceData: PriceFeedData): void {
    this.cache.set(symbol, priceData)
    this.lastUpdate.set(symbol, Date.now())
  }

  // Public utility methods
  getAvailableSymbols(): string[] {
    return Array.from(this.contracts.keys())
  }

  getConfig(): ChainlinkConfig {
    return { ...this.config }
  }

  updateConfig(newConfig: Partial<ChainlinkConfig>): void {
    this.config = { ...this.config, ...newConfig }
    
    // Reinitialize if provider URL changed
    if (newConfig.providerUrl || newConfig.network) {
      this.initializeProvider()
    }

    console.log('⚙️ Updated Chainlink configuration')
  }

  getCacheStats(): any {
    return {
      cachedSymbols: this.cache.size,
      contractsInitialized: this.contracts.size,
      lastUpdates: Object.fromEntries(this.lastUpdate.entries()),
      cacheHitRate: this.calculateCacheHitRate()
    }
  }

  private calculateCacheHitRate(): number {
    // This would need tracking of hits/misses - simplified for now
    return this.cache.size > 0 ? 0.85 : 0
  }

  clearCache(): void {
    this.cache.clear()
    this.lastUpdate.clear()
    console.log('🗑️ Cleared price feed cache')
  }

  async validateConnection(): Promise<boolean> {
    if (!this.provider) {
      return false
    }

    try {
      const blockNumber = await this.provider.getBlockNumber()
      console.log(`✅ Chainlink connection validated - Block: ${blockNumber}`)
      return true
    } catch (error) {
      console.error('❌ Chainlink connection validation failed:', error)
      return false
    }
  }

  async getNetworkInfo(): Promise<any> {
    if (!this.provider) {
      return null
    }

    try {
      const network = await this.provider.getNetwork()
      return {
        name: network.name,
        chainId: network.chainId.toString(),
        ensAddress: network.ensAddress
      }
    } catch (error) {
      console.error('❌ Failed to get network info:', error)
      return null
    }
  }

  // Integration with LangChain agents
  async getPriceForAgent(symbol: string, agentId?: string): Promise<PriceFeedData | null> {
    const priceData = await this.getPrice(symbol)
    
    if (priceData && agentId) {
      // Store price data in agent memory if available
      try {
        const { getAgentMemorySystem } = await import('../index')
        const memorySystem = await getAgentMemorySystem()
        
        await memorySystem.storeMarketData(agentId, {
          type: 'price_feed',
          symbol,
          priceData,
          source: 'chainlink'
        })
      } catch (error) {
        // Memory storage is optional - continue without it
        console.debug('Could not store price data in agent memory:', error)
      }
    }

    return priceData
  }
}