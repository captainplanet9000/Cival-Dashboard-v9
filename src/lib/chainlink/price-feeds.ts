'use client'

// Dynamic import of ethers to prevent circular dependencies
let ethers: any = null

async function getEthers() {
  if (!ethers) {
    ethers = await import('ethers')
  }
  return ethers
}

// Chainlink Price Feed ABI (minimal interface for price reading)
const PRICE_FEED_ABI = [
  {
    "inputs": [],
    "name": "latestRoundData",
    "outputs": [
      {"internalType": "uint80", "name": "roundId", "type": "uint80"},
      {"internalType": "int256", "name": "price", "type": "int256"},
      {"internalType": "uint256", "name": "startedAt", "type": "uint256"},
      {"internalType": "uint256", "name": "updatedAt", "type": "uint256"},
      {"internalType": "uint80", "name": "answeredInRound", "type": "uint80"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [{"internalType": "uint8", "name": "", "type": "uint8"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "description",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  }
]

// Chainlink Price Feed Contract Addresses (Ethereum Mainnet)
export const CHAINLINK_FEEDS = {
  'ETH/USD': '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419',
  'BTC/USD': '0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c',
  'LINK/USD': '0x2c1d072e956AFFC0D435Cb7AC38EF18d24d9127c',
  'UNI/USD': '0x553303d460EE0afB37EdFf9bE42922D8FF63220e',
  'AAVE/USD': '0x547a514d5e3769682Ce22B9E98cDD4F3e8c29eA3',
  'MATIC/USD': '0x7bAC85A8a13A4BcD8abb3eB7d6b4d632c5a57676',
  'COMP/USD': '0xdbd020CAeF83eFd542f4De03e3cF0C28A4428bd5',
  'CRV/USD': '0xCd627aA160A6fA45Eb793D19Ef54f5062F20f33f',
  'MKR/USD': '0xec1D1B3b0443256cc3860e24a46F108e699484Aa',
  'SNX/USD': '0xDC3EA94CD0AC27d9A86C180091e7f78C683d3699'
}

// Testnet feeds (Sepolia) for development
export const CHAINLINK_TESTNET_FEEDS = {
  'ETH/USD': '0x694AA1769357215DE4FAC081bf1f309aDC325306',
  'BTC/USD': '0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43',
  'LINK/USD': '0xc59E3633BAAC79493d908e63626716e204A45EdF',
  'UNI/USD': '0x96EaB2b5AC78a7b73c7f04A2b4C0Eb24Fe68431B'
}

export interface ChainlinkPriceData {
  symbol: string
  price: number
  decimals: number
  updatedAt: Date
  roundId: string
  source: 'chainlink-mainnet' | 'chainlink-testnet' | 'fallback'
}

export class ChainlinkPriceFeedService {
  private provider: any = null
  private useTestnet: boolean = true // Start with testnet for development
  
  constructor() {
    this.initializeProvider()
  }

  private async initializeProvider() {
    try {
      const ethersLib = await getEthers()
      
      // Try to connect to a public RPC endpoint
      if (this.useTestnet) {
        // Sepolia testnet
        this.provider = new ethersLib.JsonRpcProvider('https://ethereum-sepolia.publicnode.com')
      } else {
        // Ethereum mainnet (requires API key for production)
        this.provider = new ethersLib.JsonRpcProvider('https://ethereum.publicnode.com')
      }
      
      // Test the connection
      await this.provider.getBlockNumber()
      console.log('✅ Chainlink provider initialized successfully')
    } catch (error) {
      console.warn('⚠️ Failed to initialize Chainlink provider:', error)
      this.provider = null
    }
  }

  async getPriceData(symbol: string): Promise<ChainlinkPriceData | null> {
    if (!this.provider) {
      console.warn('Chainlink provider not available, using fallback data')
      return this.getFallbackPrice(symbol)
    }

    try {
      const feedAddress = this.useTestnet 
        ? CHAINLINK_TESTNET_FEEDS[symbol as keyof typeof CHAINLINK_TESTNET_FEEDS]
        : CHAINLINK_FEEDS[symbol as keyof typeof CHAINLINK_FEEDS]

      if (!feedAddress) {
        console.warn(`No Chainlink feed available for ${symbol}`)
        return this.getFallbackPrice(symbol)
      }

      const ethersLib = await getEthers()
      const contract = new ethersLib.Contract(feedAddress, PRICE_FEED_ABI, this.provider)
      
      // Get latest price data
      const [roundId, price, startedAt, updatedAt, answeredInRound] = await contract.latestRoundData()
      const decimals = await contract.decimals()
      
      // Convert price to human-readable format
      const priceValue = Number(price) / Math.pow(10, decimals)
      
      return {
        symbol,
        price: priceValue,
        decimals: decimals,
        updatedAt: new Date(Number(updatedAt) * 1000),
        roundId: roundId.toString(),
        source: this.useTestnet ? 'chainlink-testnet' : 'chainlink-mainnet'
      }
    } catch (error) {
      console.error(`Error fetching Chainlink price for ${symbol}:`, error)
      return this.getFallbackPrice(symbol)
    }
  }

  private getFallbackPrice(symbol: string): ChainlinkPriceData {
    // Fallback prices for development/demo purposes
    const fallbackPrices: Record<string, number> = {
      'ETH/USD': 2500 + (Math.random() - 0.5) * 100,
      'BTC/USD': 45000 + (Math.random() - 0.5) * 2000,
      'LINK/USD': 15 + (Math.random() - 0.5) * 2,
      'UNI/USD': 8 + (Math.random() - 0.5) * 1,
      'AAVE/USD': 120 + (Math.random() - 0.5) * 10,
      'MATIC/USD': 0.85 + (Math.random() - 0.5) * 0.1,
      'COMP/USD': 80 + (Math.random() - 0.5) * 8,
      'CRV/USD': 1.2 + (Math.random() - 0.5) * 0.2,
      'MKR/USD': 1800 + (Math.random() - 0.5) * 100,
      'SNX/USD': 3.5 + (Math.random() - 0.5) * 0.5
    }

    return {
      symbol,
      price: fallbackPrices[symbol] || 100,
      decimals: 8,
      updatedAt: new Date(),
      roundId: `fallback-${Date.now()}`,
      source: 'fallback'
    }
  }

  async getMultiplePrices(symbols: string[]): Promise<ChainlinkPriceData[]> {
    const pricePromises = symbols.map(symbol => this.getPriceData(symbol))
    const results = await Promise.allSettled(pricePromises)
    
    return results
      .filter((result): result is PromiseFulfilledResult<ChainlinkPriceData | null> => 
        result.status === 'fulfilled' && result.value !== null
      )
      .map(result => result.value!)
  }

  // Method to switch between testnet and mainnet
  switchNetwork(useTestnet: boolean) {
    this.useTestnet = useTestnet
    this.initializeProvider()
  }

  // Get real-time price stream (simulated for now)
  subscribeToPriceUpdates(symbols: string[], callback: (prices: ChainlinkPriceData[]) => void) {
    const updateInterval = setInterval(async () => {
      const prices = await this.getMultiplePrices(symbols)
      callback(prices)
    }, 10000) // Update every 10 seconds

    return () => clearInterval(updateInterval)
  }
}

// Export lazy singleton to prevent circular dependencies
let _chainlinkService: ChainlinkPriceFeedService | null = null

export function getChainlinkService(): ChainlinkPriceFeedService {
  if (!_chainlinkService) {
    _chainlinkService = new ChainlinkPriceFeedService()
  }
  return _chainlinkService
}

// Keep the old export for backward compatibility but make it lazy
// Using a function instead of Proxy to prevent circular dependency issues
export const chainlinkService = {
  get: () => getChainlinkService()
}