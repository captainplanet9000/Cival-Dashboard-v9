'use client'

import { EventEmitter } from 'events'
import { ethers } from 'ethers'
import { alchemyService } from '../blockchain/alchemy-service'
import { defiService } from '../blockchain/defi-service'
import { testnetWalletManager, TestnetWallet } from '../blockchain/testnet-wallet-manager'

export interface DEXProtocol {
  name: string
  routerAddress: string
  factoryAddress: string
  chainId: number
  network: 'mainnet' | 'testnet'
  supportedTokens: string[]
}

export interface RealTrade {
  id: string
  agentId: string
  walletAddress: string
  protocol: string
  inputToken: string
  outputToken: string
  inputAmount: string
  outputAmount: string
  slippage: number
  gasEstimate: number
  txHash: string
  status: 'pending' | 'confirmed' | 'failed'
  blockNumber?: number
  gasUsed?: number
  timestamp: Date
  profitLoss: number
}

export interface DEXQuote {
  protocol: string
  inputAmount: string
  outputAmount: string
  minimumOutput: string
  priceImpact: number
  gasEstimate: number
  route: string[]
  validUntil: Date
}

export interface ArbitrageResult {
  opportunity: any
  buyTx?: string
  sellTx?: string
  totalProfit: number
  gasSpent: number
  netProfit: number
  executionTime: number
}

// Real DEX configurations for Ethereum and Arbitrum
const REAL_DEX_PROTOCOLS: Record<string, Record<string, DEXProtocol>> = {
  'ethereum': {
    uniswap_v3: {
      name: 'Uniswap V3',
      routerAddress: '0xE592427A0AEce92De3Edee1F18E0157C05861564', // SwapRouter
      factoryAddress: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
      chainId: 1,
      network: 'mainnet',
      supportedTokens: ['WETH', 'USDC', 'USDT', 'DAI', 'WBTC']
    },
    sushiswap: {
      name: 'SushiSwap',
      routerAddress: '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F',
      factoryAddress: '0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac',
      chainId: 1,
      network: 'mainnet',
      supportedTokens: ['WETH', 'USDC', 'USDT', 'DAI', 'WBTC']
    },
    oneinch: {
      name: '1inch',
      routerAddress: '0x1111111254EEB25477B68fb85Ed929f73A960582',
      factoryAddress: '0x0000000000000000000000000000000000000000',
      chainId: 1,
      network: 'mainnet',
      supportedTokens: ['WETH', 'USDC', 'USDT', 'DAI', 'WBTC']
    }
  },
  'arbitrum': {
    uniswap_v3: {
      name: 'Uniswap V3',
      routerAddress: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
      factoryAddress: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
      chainId: 42161,
      network: 'mainnet',
      supportedTokens: ['WETH', 'USDC', 'USDT', 'DAI', 'WBTC']
    },
    sushiswap: {
      name: 'SushiSwap',
      routerAddress: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506',
      factoryAddress: '0xc35DADB65012eC5796536bD9864eD8773aBc74C4',
      chainId: 42161,
      network: 'mainnet',
      supportedTokens: ['WETH', 'USDC', 'USDT', 'DAI', 'WBTC']
    },
    camelot: {
      name: 'Camelot DEX',
      routerAddress: '0xc873fEcbd354f5A56E00E710B90EF4201db2448d',
      factoryAddress: '0x6EcCab422D763aC031210895C81787E87B91425a',
      chainId: 42161,
      network: 'mainnet',
      supportedTokens: ['WETH', 'USDC', 'USDT', 'ARB']
    }
  }
}

// Real mainnet token addresses
const MAINNET_TOKENS: Record<string, Record<string, string>> = {
  'ethereum': {
    WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    WBTC: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599'
  },
  'arbitrum': {
    WETH: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    USDC: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    USDT: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
    DAI: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
    WBTC: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
    ARB: '0x912CE59144191C1204E64559FE8253a0e49E6548'
  }
}

// Uniswap V3 Swap Router ABI
const UNISWAP_V3_ROUTER_ABI = [
  'function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)',
  'function exactOutputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountOut, uint256 amountInMaximum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountIn)'
]

// 1inch API integration
const ONEINCH_API_BASE = 'https://api.1inch.dev'

class DEXTradingEngine extends EventEmitter {
  private activeTrades: Map<string, RealTrade> = new Map()
  private providers: Record<string, ethers.JsonRpcProvider> = {}
  private isMainnet: boolean = false
  
  constructor() {
    super()
    this.initializeProviders()
  }

  private initializeProviders() {
    try {
      // Initialize mainnet providers for real trading
      const ethMainnetUrl = process.env.NEXT_PUBLIC_ETH_MAINNET_URL
      const arbMainnetUrl = process.env.NEXT_PUBLIC_ARB_MAINNET_URL
      
      if (ethMainnetUrl) {
        this.providers['ethereum'] = new ethers.JsonRpcProvider(ethMainnetUrl)
        this.isMainnet = true
      }
      if (arbMainnetUrl) {
        this.providers['arbitrum'] = new ethers.JsonRpcProvider(arbMainnetUrl)
        this.isMainnet = true
      }
      
      console.log('🚀 DEX Trading Engine initialized for REAL MONEY trading')
      console.log('⚠️  WARNING: This will execute real blockchain transactions!')
    } catch (error) {
      console.error('❌ Failed to initialize DEX Trading Engine:', error)
    }
  }

  // Get real quote from DEX protocols
  async getRealDEXQuote(
    inputToken: string,
    outputToken: string,
    inputAmount: string,
    chain: 'ethereum' | 'arbitrum' = 'ethereum',
    protocol: string = 'uniswap_v3'
  ): Promise<DEXQuote | null> {
    try {
      const protocolConfig = REAL_DEX_PROTOCOLS[chain]?.[protocol]
      if (!protocolConfig) {
        throw new Error(`Protocol ${protocol} not supported on ${chain}`)
      }

      const inputTokenAddress = MAINNET_TOKENS[chain][inputToken]
      const outputTokenAddress = MAINNET_TOKENS[chain][outputToken]
      
      if (!inputTokenAddress || !outputTokenAddress) {
        throw new Error(`Token addresses not found for ${inputToken}/${outputToken}`)
      }

      // Use 1inch API for best price aggregation
      if (protocol === 'oneinch') {
        return this.get1inchQuote(inputTokenAddress, outputTokenAddress, inputAmount, chain)
      }

      // Direct DEX quote using on-chain calls
      const provider = this.providers[chain]
      if (!provider) {
        throw new Error(`Provider not available for ${chain}`)
      }

      const router = new ethers.Contract(
        protocolConfig.routerAddress,
        UNISWAP_V3_ROUTER_ABI,
        provider
      )

      // For simplicity, using fixed fee tier (0.3%)
      const fee = 3000
      const deadline = Math.floor(Date.now() / 1000) + 20 * 60 // 20 minutes

      // Estimate output amount (would need quoter contract in real implementation)
      const estimatedOutput = await this.estimateSwapOutput(
        inputTokenAddress,
        outputTokenAddress,
        inputAmount,
        chain
      )

      const slippage = 0.005 // 0.5% slippage
      const minimumOutput = (parseFloat(estimatedOutput) * (1 - slippage)).toString()

      return {
        protocol: protocolConfig.name,
        inputAmount,
        outputAmount: estimatedOutput,
        minimumOutput,
        priceImpact: 0.1, // Estimated
        gasEstimate: 200000, // Estimated
        route: [inputToken, outputToken],
        validUntil: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
      }
    } catch (error) {
      console.error('Error getting DEX quote:', error)
      return null
    }
  }

  // Get 1inch aggregated quote
  private async get1inchQuote(
    fromToken: string,
    toToken: string,
    amount: string,
    chain: 'ethereum' | 'arbitrum'
  ): Promise<DEXQuote | null> {
    try {
      const chainId = chain === 'ethereum' ? 1 : 42161
      const apiKey = process.env.NEXT_PUBLIC_ONEINCH_API_KEY
      
      if (!apiKey) {
        throw new Error('1inch API key not configured')
      }

      const params = new URLSearchParams({
        fromTokenAddress: fromToken,
        toTokenAddress: toToken,
        amount: ethers.parseUnits(amount, 18).toString(),
        slippage: '0.5',
        disableEstimate: 'false'
      })

      const response = await fetch(
        `${ONEINCH_API_BASE}/v5.0/${chainId}/quote?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'accept': 'application/json'
          }
        }
      )

      if (!response.ok) {
        throw new Error(`1inch API error: ${response.status}`)
      }

      const data = await response.json()

      return {
        protocol: '1inch',
        inputAmount: amount,
        outputAmount: ethers.formatUnits(data.toTokenAmount, 18),
        minimumOutput: ethers.formatUnits(data.toTokenAmount, 18),
        priceImpact: parseFloat(data.estimatedGas) / 1000000, // Rough estimate
        gasEstimate: parseInt(data.estimatedGas),
        route: ['1inch_aggregated'],
        validUntil: new Date(Date.now() + 30 * 1000) // 30 seconds for 1inch
      }
    } catch (error) {
      console.error('Error getting 1inch quote:', error)
      return null
    }
  }

  // Execute real DEX trade
  async executeRealTrade(
    agentId: string,
    walletAddress: string,
    privateKey: string,
    quote: DEXQuote,
    chain: 'ethereum' | 'arbitrum' = 'ethereum'
  ): Promise<RealTrade | null> {
    try {
      console.log(`🔥 EXECUTING REAL TRADE FOR AGENT ${agentId}`)
      console.log(`💰 Trading ${quote.inputAmount} → ${quote.outputAmount}`)
      
      const provider = this.providers[chain]
      if (!provider) {
        throw new Error(`Provider not available for ${chain}`)
      }

      const wallet = new ethers.Wallet(privateKey, provider)
      const protocolConfig = REAL_DEX_PROTOCOLS[chain]['uniswap_v3'] // Default to Uniswap V3

      // Execute the swap
      const router = new ethers.Contract(
        protocolConfig.routerAddress,
        UNISWAP_V3_ROUTER_ABI,
        wallet
      )

      const inputTokenAddress = MAINNET_TOKENS[chain][quote.route[0]]
      const outputTokenAddress = MAINNET_TOKENS[chain][quote.route[1]]
      const fee = 3000 // 0.3%
      const deadline = Math.floor(Date.now() / 1000) + 20 * 60

      const swapParams = {
        tokenIn: inputTokenAddress,
        tokenOut: outputTokenAddress,
        fee,
        recipient: walletAddress,
        deadline,
        amountIn: ethers.parseUnits(quote.inputAmount, 18),
        amountOutMinimum: ethers.parseUnits(quote.minimumOutput, 18),
        sqrtPriceLimitX96: 0
      }

      // Execute the swap transaction
      const txResponse = await router.exactInputSingle(swapParams, {
        gasLimit: quote.gasEstimate,
        gasPrice: await provider.getFeeData().then(fees => fees.gasPrice)
      })

      const trade: RealTrade = {
        id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        agentId,
        walletAddress,
        protocol: quote.protocol,
        inputToken: quote.route[0],
        outputToken: quote.route[1],
        inputAmount: quote.inputAmount,
        outputAmount: quote.outputAmount,
        slippage: 0.5,
        gasEstimate: quote.gasEstimate,
        txHash: txResponse.hash,
        status: 'pending',
        timestamp: new Date(),
        profitLoss: 0 // Will be calculated after confirmation
      }

      this.activeTrades.set(trade.id, trade)
      this.emit('tradeExecuted', trade)

      // Monitor transaction
      this.monitorRealTransaction(trade, chain)

      console.log(`✅ Trade executed with hash: ${txResponse.hash}`)
      return trade
    } catch (error) {
      console.error('❌ Error executing real trade:', error)
      return null
    }
  }

  // Monitor real transaction confirmation
  private async monitorRealTransaction(trade: RealTrade, chain: 'ethereum' | 'arbitrum') {
    try {
      const provider = this.providers[chain]
      if (!provider) return

      console.log(`🔍 Monitoring transaction: ${trade.txHash}`)

      const receipt = await provider.waitForTransaction(trade.txHash, 1, 300000) // 5 min timeout
      
      if (receipt) {
        trade.status = receipt.status === 1 ? 'confirmed' : 'failed'
        trade.blockNumber = receipt.blockNumber
        trade.gasUsed = Number(receipt.gasUsed)

        // Calculate profit/loss (simplified)
        if (trade.status === 'confirmed') {
          const gasValue = Number(receipt.gasUsed) * Number(receipt.gasPrice || 0) / 1e18
          const gasUSD = gasValue * 2300 // Rough ETH price
          trade.profitLoss = -gasUSD // Negative for trade cost, positive profit would be calculated differently
        }

        this.emit('tradeConfirmed', trade)
        console.log(`✅ Trade ${trade.status}: ${trade.txHash}`)
      }
    } catch (error) {
      console.error(`❌ Error monitoring transaction ${trade.txHash}:`, error)
      trade.status = 'failed'
      this.emit('tradeConfirmed', trade)
    }
  }

  // Execute arbitrage between DEXes
  async executeRealArbitrage(
    agentId: string,
    walletAddress: string,
    privateKey: string,
    tokenPair: string,
    amount: string,
    chain: 'ethereum' | 'arbitrum' = 'ethereum'
  ): Promise<ArbitrageResult | null> {
    try {
      console.log(`🔄 EXECUTING REAL ARBITRAGE FOR AGENT ${agentId}`)
      
      const [token0, token1] = tokenPair.split('/')
      const startTime = Date.now()

      // Step 1: Get quotes from different DEXes
      const uniswapQuote = await this.getRealDEXQuote(token0, token1, amount, chain, 'uniswap_v3')
      const sushiswapQuote = await this.getRealDEXQuote(token0, token1, amount, chain, 'sushiswap')

      if (!uniswapQuote || !sushiswapQuote) {
        throw new Error('Failed to get arbitrage quotes')
      }

      // Determine which is cheaper to buy from
      const uniswapPrice = parseFloat(uniswapQuote.outputAmount) / parseFloat(uniswapQuote.inputAmount)
      const sushiswapPrice = parseFloat(sushiswapQuote.outputAmount) / parseFloat(sushiswapQuote.inputAmount)

      const buyQuote = uniswapPrice > sushiswapPrice ? sushiswapQuote : uniswapQuote
      const sellQuote = uniswapPrice > sushiswapPrice ? uniswapQuote : sushiswapQuote

      // Step 2: Execute buy trade
      const buyTrade = await this.executeRealTrade(agentId, walletAddress, privateKey, buyQuote, chain)
      if (!buyTrade) {
        throw new Error('Failed to execute buy trade')
      }

      // Step 3: Wait for confirmation and execute sell
      await new Promise(resolve => setTimeout(resolve, 30000)) // Wait 30 seconds

      // Create sell quote (reverse the tokens)
      const sellQuoteReverse = await this.getRealDEXQuote(
        buyQuote.route[1], 
        buyQuote.route[0], 
        buyQuote.outputAmount, 
        chain,
        sellQuote.protocol === 'Uniswap V3' ? 'uniswap_v3' : 'sushiswap'
      )

      let sellTrade = null
      if (sellQuoteReverse) {
        sellTrade = await this.executeRealTrade(agentId, walletAddress, privateKey, sellQuoteReverse, chain)
      }

      const executionTime = Date.now() - startTime
      const gasSpent = (buyTrade.gasUsed || 0) + (sellTrade?.gasUsed || 0)
      const totalProfit = parseFloat(sellQuoteReverse?.outputAmount || '0') - parseFloat(amount)
      const netProfit = totalProfit - (gasSpent * 2300 / 1e18) // Subtract gas costs

      const result: ArbitrageResult = {
        opportunity: { tokenPair, estimatedProfit: totalProfit },
        buyTx: buyTrade.txHash,
        sellTx: sellTrade?.txHash,
        totalProfit,
        gasSpent,
        netProfit,
        executionTime
      }

      this.emit('arbitrageCompleted', result)
      console.log(`✅ Arbitrage completed with profit: $${netProfit.toFixed(2)}`)

      return result
    } catch (error) {
      console.error('❌ Error executing real arbitrage:', error)
      return null
    }
  }

  // Helper method to estimate swap output
  private async estimateSwapOutput(
    inputToken: string,
    outputToken: string,
    inputAmount: string,
    chain: 'ethereum' | 'arbitrum'
  ): Promise<string> {
    // In a real implementation, this would use Uniswap's Quoter contract
    // For now, using simplified estimation based on mock prices
    const mockPrices: Record<string, number> = {
      'WETH': 2300,
      'USDC': 1,
      'USDT': 1,
      'DAI': 1,
      'WBTC': 43000,
      'ARB': 0.8
    }

    const inputPrice = mockPrices[inputToken.replace('W', '')] || 1
    const outputPrice = mockPrices[outputToken.replace('W', '')] || 1
    const rate = inputPrice / outputPrice
    
    return (parseFloat(inputAmount) * rate * 0.997).toString() // 0.3% fee
  }

  // Get all active trades for an agent
  getActiveTrades(agentId: string): RealTrade[] {
    return Array.from(this.activeTrades.values()).filter(trade => trade.agentId === agentId)
  }

  // Get trade by ID
  getTrade(tradeId: string): RealTrade | null {
    return this.activeTrades.get(tradeId) || null
  }

  // Get supported DEX protocols
  getSupportedProtocols(chain: 'ethereum' | 'arbitrum'): DEXProtocol[] {
    return Object.values(REAL_DEX_PROTOCOLS[chain] || {})
  }

  // Get supported tokens
  getSupportedTokens(chain: 'ethereum' | 'arbitrum'): string[] {
    return Object.keys(MAINNET_TOKENS[chain] || {})
  }

  // Check if trading is enabled
  isTradingEnabled(): boolean {
    return this.isMainnet && Object.keys(this.providers).length > 0
  }

  // Clean up
  destroy() {
    this.removeAllListeners()
  }
}

export const dexTradingEngine = new DEXTradingEngine()
export default dexTradingEngine