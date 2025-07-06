'use client'

import { ethers } from 'ethers'
import { alchemyService } from './alchemy-service'

export interface DeFiProtocol {
  name: string
  routerAddress: string
  factoryAddress: string
  chainId: number
  version: string
}

export interface TokenInfo {
  address: string
  symbol: string
  name: string
  decimals: number
  logoURI?: string
}

export interface SwapQuote {
  protocol: string
  inputToken: TokenInfo
  outputToken: TokenInfo
  inputAmount: string
  outputAmount: string
  priceImpact: number
  gasEstimate: number
  route: string[]
  executionPrice: number
  minimumAmountOut: string
}

export interface ArbitrageOpportunity {
  tokenPair: string
  buyProtocol: string
  sellProtocol: string
  buyPrice: number
  sellPrice: number
  priceSpread: number
  estimatedProfit: number
  minimumAmount: number
  gasEstimate: number
  executionTime: number
  confidence: number
}

export interface LiquidityPool {
  protocol: string
  address: string
  token0: TokenInfo
  token1: TokenInfo
  reserve0: string
  reserve1: string
  totalSupply: string
  apr: number
  volume24h: number
  fees24h: number
}

// Testnet DeFi Protocol Configurations
const TESTNET_PROTOCOLS: Record<string, Record<string, DeFiProtocol>> = {
  'eth-sepolia': {
    uniswap: {
      name: 'Uniswap V3',
      routerAddress: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45', // SwapRouter02
      factoryAddress: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
      chainId: 11155111,
      version: 'v3'
    },
    sushiswap: {
      name: 'SushiSwap',
      routerAddress: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506', // SushiSwap Router
      factoryAddress: '0xc35DADB65012eC5796536bD9864eD8773aBc74C4',
      chainId: 11155111,
      version: 'v2'
    }
  },
  'arb-sepolia': {
    uniswap: {
      name: 'Uniswap V3',
      routerAddress: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45', // SwapRouter02
      factoryAddress: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
      chainId: 421614,
      version: 'v3'
    },
    sushiswap: {
      name: 'SushiSwap',
      routerAddress: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506', // SushiSwap Router
      factoryAddress: '0xc35DADB65012eC5796536bD9864eD8773aBc74C4',
      chainId: 421614,
      version: 'v2'
    }
  }
}

// Common testnet tokens
const TESTNET_TOKENS: Record<string, Record<string, TokenInfo>> = {
  'eth-sepolia': {
    WETH: {
      address: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14',
      symbol: 'WETH',
      name: 'Wrapped Ether',
      decimals: 18
    },
    USDC: {
      address: '0xA0b86a33E6417c8Aba6b1f0e9F6b4b8d1d9e4d6F',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6
    },
    USDT: {
      address: '0xB1c9a33E6417c8Aba6b1f0e9F6b4b8d1d9e4d6F',
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 6
    },
    WBTC: {
      address: '0xC2d8a33E6417c8Aba6b1f0e9F6b4b8d1d9e4d6F',
      symbol: 'WBTC',
      name: 'Wrapped Bitcoin',
      decimals: 8
    }
  },
  'arb-sepolia': {
    WETH: {
      address: '0xe39Ab88f8A4777030A534146A9Ca3B52bd5D43A3',
      symbol: 'WETH',
      name: 'Wrapped Ether',
      decimals: 18
    },
    USDC: {
      address: '0xD3c9a33E6417c8Aba6b1f0e9F6b4b8d1d9e4d6F',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6
    },
    USDT: {
      address: '0xE4e0a33E6417c8Aba6b1f0e9F6b4b8d1d9e4d6F',
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 6
    },
    WBTC: {
      address: '0xF5f1a33E6417c8Aba6b1f0e9F6b4b8d1d9e4d6F',
      symbol: 'WBTC',
      name: 'Wrapped Bitcoin',
      decimals: 8
    }
  }
}

// Uniswap V2 Router ABI (minimal)
const UNISWAP_V2_ROUTER_ABI = [
  'function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)',
  'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
  'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
  'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
  'function addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB, uint liquidity)',
  'function removeLiquidity(address tokenA, address tokenB, uint liquidity, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB)'
]

// ERC20 ABI (minimal)
const ERC20_ABI = [
  'function balanceOf(address account) external view returns (uint256)',
  'function transfer(address to, uint256 amount) external returns (bool)',
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function decimals() external view returns (uint8)',
  'function symbol() external view returns (string)',
  'function name() external view returns (string)'
]

class DeFiService {
  private providers: Record<string, ethers.JsonRpcProvider> = {}
  private isInitialized = false

  constructor() {
    this.initializeProviders()
  }

  private initializeProviders() {
    try {
      // Use the same providers as AlchemyService
      const ethSepoliaUrl = process.env.NEXT_PUBLIC_ETH_SEPOLIA_URL
      const arbSepoliaUrl = process.env.NEXT_PUBLIC_ARB_SEPOLIA_URL

      if (ethSepoliaUrl) {
        this.providers['eth-sepolia'] = new ethers.JsonRpcProvider(ethSepoliaUrl)
      }
      if (arbSepoliaUrl) {
        this.providers['arb-sepolia'] = new ethers.JsonRpcProvider(arbSepoliaUrl)
      }

      this.isInitialized = true
      console.log('🔄 DeFi service initialized for testnets')
    } catch (error) {
      console.error('❌ Failed to initialize DeFi service:', error)
      this.isInitialized = false
    }
  }

  // Get swap quote from protocol
  async getSwapQuote(
    inputToken: string,
    outputToken: string,
    inputAmount: string,
    protocol: string = 'uniswap',
    chainKey: string = 'eth-sepolia'
  ): Promise<SwapQuote | null> {
    try {
      const provider = this.providers[chainKey]
      const protocolConfig = TESTNET_PROTOCOLS[chainKey]?.[protocol]
      
      if (!provider || !protocolConfig) {
        throw new Error(`Provider or protocol not found for ${chainKey}/${protocol}`)
      }

      const inputTokenInfo = TESTNET_TOKENS[chainKey][inputToken]
      const outputTokenInfo = TESTNET_TOKENS[chainKey][outputToken]

      if (!inputTokenInfo || !outputTokenInfo) {
        throw new Error(`Token info not found for ${inputToken} or ${outputToken}`)
      }

      const router = new ethers.Contract(protocolConfig.routerAddress, UNISWAP_V2_ROUTER_ABI, provider)
      const path = [inputTokenInfo.address, outputTokenInfo.address]
      const amountIn = ethers.parseUnits(inputAmount, inputTokenInfo.decimals)

      const amounts = await router.getAmountsOut(amountIn, path)
      const outputAmount = ethers.formatUnits(amounts[1], outputTokenInfo.decimals)

      const executionPrice = parseFloat(outputAmount) / parseFloat(inputAmount)
      const priceImpact = this.calculatePriceImpact(parseFloat(inputAmount), parseFloat(outputAmount))

      return {
        protocol: protocolConfig.name,
        inputToken: inputTokenInfo,
        outputToken: outputTokenInfo,
        inputAmount,
        outputAmount,
        priceImpact,
        gasEstimate: 150000, // Estimated gas for swap
        route: [inputToken, outputToken],
        executionPrice,
        minimumAmountOut: (parseFloat(outputAmount) * 0.95).toString() // 5% slippage tolerance
      }
    } catch (error) {
      console.error('Error getting swap quote:', error)
      return null
    }
  }

  // Execute swap transaction
  async executeSwap(
    privateKey: string,
    swapQuote: SwapQuote,
    protocol: string = 'uniswap',
    chainKey: string = 'eth-sepolia'
  ): Promise<string | null> {
    try {
      const provider = this.providers[chainKey]
      const protocolConfig = TESTNET_PROTOCOLS[chainKey]?.[protocol]
      
      if (!provider || !protocolConfig) {
        throw new Error(`Provider or protocol not found for ${chainKey}/${protocol}`)
      }

      const wallet = new ethers.Wallet(privateKey, provider)
      const router = new ethers.Contract(protocolConfig.routerAddress, UNISWAP_V2_ROUTER_ABI, wallet)

      // Approve token spending if needed
      if (swapQuote.inputToken.symbol !== 'ETH') {
        await this.approveToken(
          privateKey,
          swapQuote.inputToken.address,
          protocolConfig.routerAddress,
          swapQuote.inputAmount,
          chainKey
        )
      }

      const path = [swapQuote.inputToken.address, swapQuote.outputToken.address]
      const amountIn = ethers.parseUnits(swapQuote.inputAmount, swapQuote.inputToken.decimals)
      const amountOutMin = ethers.parseUnits(swapQuote.minimumAmountOut, swapQuote.outputToken.decimals)
      const deadline = Math.floor(Date.now() / 1000) + 20 * 60 // 20 minutes

      let txResponse
      
      if (swapQuote.inputToken.symbol === 'ETH') {
        // ETH to Token swap
        txResponse = await router.swapExactETHForTokens(
          amountOutMin,
          path,
          wallet.address,
          deadline,
          { value: amountIn }
        )
      } else if (swapQuote.outputToken.symbol === 'ETH') {
        // Token to ETH swap
        txResponse = await router.swapExactTokensForETH(
          amountIn,
          amountOutMin,
          path,
          wallet.address,
          deadline
        )
      } else {
        // Token to Token swap
        txResponse = await router.swapExactTokensForTokens(
          amountIn,
          amountOutMin,
          path,
          wallet.address,
          deadline
        )
      }

      return txResponse.hash
    } catch (error) {
      console.error('Error executing swap:', error)
      return null
    }
  }

  // Approve token spending
  async approveToken(
    privateKey: string,
    tokenAddress: string,
    spenderAddress: string,
    amount: string,
    chainKey: string = 'eth-sepolia'
  ): Promise<string | null> {
    try {
      const provider = this.providers[chainKey]
      if (!provider) {
        throw new Error(`Provider not found for ${chainKey}`)
      }

      const wallet = new ethers.Wallet(privateKey, provider)
      const token = new ethers.Contract(tokenAddress, ERC20_ABI, wallet)
      const decimals = await token.decimals()
      const amountInWei = ethers.parseUnits(amount, decimals)

      const txResponse = await token.approve(spenderAddress, amountInWei)
      return txResponse.hash
    } catch (error) {
      console.error('Error approving token:', error)
      return null
    }
  }

  // Find arbitrage opportunities
  async findArbitrageOpportunities(
    tokenPair: string,
    chainKey: string = 'eth-sepolia'
  ): Promise<ArbitrageOpportunity[]> {
    try {
      const [token0, token1] = tokenPair.split('/')
      const opportunities: ArbitrageOpportunity[] = []

      // Get quotes from different protocols
      const uniswapQuote = await this.getSwapQuote(token0, token1, '1000', 'uniswap', chainKey)
      const sushiswapQuote = await this.getSwapQuote(token0, token1, '1000', 'sushiswap', chainKey)

      if (uniswapQuote && sushiswapQuote) {
        const uniswapPrice = parseFloat(uniswapQuote.outputAmount) / parseFloat(uniswapQuote.inputAmount)
        const sushiswapPrice = parseFloat(sushiswapQuote.outputAmount) / parseFloat(sushiswapQuote.inputAmount)

        const priceSpread = Math.abs(uniswapPrice - sushiswapPrice)
        const spreadPercent = (priceSpread / Math.max(uniswapPrice, sushiswapPrice)) * 100

        if (spreadPercent > 0.5) { // 0.5% minimum spread
          const buyProtocol = uniswapPrice > sushiswapPrice ? 'sushiswap' : 'uniswap'
          const sellProtocol = uniswapPrice > sushiswapPrice ? 'uniswap' : 'sushiswap'
          const buyPrice = Math.min(uniswapPrice, sushiswapPrice)
          const sellPrice = Math.max(uniswapPrice, sushiswapPrice)

          opportunities.push({
            tokenPair,
            buyProtocol,
            sellProtocol,
            buyPrice,
            sellPrice,
            priceSpread: spreadPercent,
            estimatedProfit: (sellPrice - buyPrice) * 1000 - 50, // Assuming $50 gas costs
            minimumAmount: 1000,
            gasEstimate: 300000, // Estimated gas for arbitrage
            executionTime: 30, // 30 seconds
            confidence: spreadPercent > 1 ? 85 : 70
          })
        }
      }

      return opportunities
    } catch (error) {
      console.error('Error finding arbitrage opportunities:', error)
      return []
    }
  }

  // Execute arbitrage
  async executeArbitrage(
    privateKey: string,
    opportunity: ArbitrageOpportunity,
    amount: string,
    chainKey: string = 'eth-sepolia'
  ): Promise<{ buyTx: string | null; sellTx: string | null }> {
    try {
      const [token0, token1] = opportunity.tokenPair.split('/')

      // Step 1: Buy from cheaper protocol
      const buyQuote = await this.getSwapQuote(token0, token1, amount, opportunity.buyProtocol, chainKey)
      if (!buyQuote) {
        throw new Error('Failed to get buy quote')
      }

      const buyTx = await this.executeSwap(privateKey, buyQuote, opportunity.buyProtocol, chainKey)
      if (!buyTx) {
        throw new Error('Failed to execute buy transaction')
      }

      // Wait for buy transaction to confirm
      await new Promise(resolve => setTimeout(resolve, 5000))

      // Step 2: Sell to more expensive protocol
      const sellQuote = await this.getSwapQuote(token1, token0, buyQuote.outputAmount, opportunity.sellProtocol, chainKey)
      if (!sellQuote) {
        throw new Error('Failed to get sell quote')
      }

      const sellTx = await this.executeSwap(privateKey, sellQuote, opportunity.sellProtocol, chainKey)

      return { buyTx, sellTx }
    } catch (error) {
      console.error('Error executing arbitrage:', error)
      return { buyTx: null, sellTx: null }
    }
  }

  // Get liquidity pools
  async getLiquidityPools(chainKey: string = 'eth-sepolia'): Promise<LiquidityPool[]> {
    try {
      // Mock liquidity pools for testnet
      const pools: LiquidityPool[] = [
        {
          protocol: 'Uniswap V3',
          address: '0x1234567890123456789012345678901234567890',
          token0: TESTNET_TOKENS[chainKey]['WETH'],
          token1: TESTNET_TOKENS[chainKey]['USDC'],
          reserve0: '1000',
          reserve1: '2300000',
          totalSupply: '15000',
          apr: 12.5,
          volume24h: 850000,
          fees24h: 2500
        },
        {
          protocol: 'SushiSwap',
          address: '0x2345678901234567890123456789012345678901',
          token0: TESTNET_TOKENS[chainKey]['WETH'],
          token1: TESTNET_TOKENS[chainKey]['USDT'],
          reserve0: '800',
          reserve1: '1840000',
          totalSupply: '12000',
          apr: 15.2,
          volume24h: 650000,
          fees24h: 1950
        }
      ]

      return pools
    } catch (error) {
      console.error('Error getting liquidity pools:', error)
      return []
    }
  }

  // Utility functions
  private calculatePriceImpact(inputAmount: number, outputAmount: number): number {
    // Simplified price impact calculation
    return Math.min(inputAmount / 10000, 5) // Max 5% impact
  }

  getAvailableTokens(chainKey: string = 'eth-sepolia'): TokenInfo[] {
    return Object.values(TESTNET_TOKENS[chainKey] || {})
  }

  getAvailableProtocols(chainKey: string = 'eth-sepolia'): DeFiProtocol[] {
    return Object.values(TESTNET_PROTOCOLS[chainKey] || {})
  }

  isInitialized(): boolean {
    return this.isInitialized
  }
}

export const defiService = new DeFiService()
export default defiService