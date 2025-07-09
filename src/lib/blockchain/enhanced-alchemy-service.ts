'use client'

import { Alchemy, Network, AlchemySettings } from 'alchemy-sdk'
import { ethers } from 'ethers'

export interface MultiChainConfig {
  chainId: number
  name: string
  network: Network | string
  rpcUrl: string
  alchemyNetwork?: Network
  symbol: string
  explorer: string
  nativeCurrency: string
  isTestnet: boolean
  bridgeSupport: boolean
  dexSupport: string[]
}

export interface TokenBalance {
  contractAddress: string
  name: string
  symbol: string
  decimals: number
  balance: string
  logo?: string
  usdValue?: number
  chain: string
}

export interface TransactionInfo {
  hash: string
  from: string
  to: string
  value: string
  gasUsed: string
  gasPrice: string
  blockNumber: number
  timestamp: number
  status: 'success' | 'failed' | 'pending'
  chain: string
}

export interface CrossChainBridge {
  fromChain: string
  toChain: string
  fromToken: string
  toToken: string
  amount: string
  estimatedTime: number
  fees: string
  provider: string
}

// Enhanced multi-chain configuration with user's Alchemy URLs
export const MULTI_CHAIN_CONFIG: Record<string, MultiChainConfig> = {
  'ethereum': {
    chainId: 1,
    name: 'Ethereum Mainnet',
    network: Network.ETH_MAINNET,
    rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/vNg5BFKZV1TJcvFtMANru',
    alchemyNetwork: Network.ETH_MAINNET,
    symbol: 'ETH',
    explorer: 'https://etherscan.io',
    nativeCurrency: 'ETH',
    isTestnet: false,
    bridgeSupport: true,
    dexSupport: ['uniswap', 'sushiswap', '1inch', 'curve']
  },
  'arbitrum': {
    chainId: 42161,
    name: 'Arbitrum One',
    network: Network.ARB_MAINNET,
    rpcUrl: process.env.NEXT_PUBLIC_ARB_MAINNET_URL || '',
    alchemyNetwork: Network.ARB_MAINNET,
    symbol: 'ETH',
    explorer: 'https://arbiscan.io',
    nativeCurrency: 'ETH',
    isTestnet: false,
    bridgeSupport: true,
    dexSupport: ['uniswap', 'sushiswap', 'camelot', 'gmx']
  },
  'base': {
    chainId: 8453,
    name: 'Base Mainnet',
    network: Network.BASE_MAINNET,
    rpcUrl: 'https://base-mainnet.g.alchemy.com/v2/vNg5BFKZV1TJcvFtMANru',
    alchemyNetwork: Network.BASE_MAINNET,
    symbol: 'ETH',
    explorer: 'https://basescan.org',
    nativeCurrency: 'ETH',
    isTestnet: false,
    bridgeSupport: true,
    dexSupport: ['uniswap', 'sushiswap', 'baseswap', 'aerodrome']
  },
  'sonic': {
    chainId: 146, // Sonic mainnet chain ID
    name: 'Sonic Mainnet',
    network: 'sonic-mainnet',
    rpcUrl: 'https://sonic-mainnet.g.alchemy.com/v2/vNg5BFKZV1TJcvFtMANru',
    symbol: 'S',
    explorer: 'https://sonicscan.org',
    nativeCurrency: 'S',
    isTestnet: false,
    bridgeSupport: true,
    dexSupport: ['sonicswap', 'sonicdefi', 'velocity']
  },
  'solana': {
    chainId: 101, // Solana mainnet
    name: 'Solana Mainnet',
    network: 'solana-mainnet',
    rpcUrl: 'https://solana-mainnet.g.alchemy.com/v2/vNg5BFKZV1TJcvFtMANru',
    symbol: 'SOL',
    explorer: 'https://solscan.io',
    nativeCurrency: 'SOL',
    isTestnet: false,
    bridgeSupport: true,
    dexSupport: ['jupiter', 'raydium', 'orca', 'serum']
  },
  'berachain': {
    chainId: 80084, // Berachain mainnet
    name: 'Berachain Mainnet',
    network: 'berachain-mainnet',
    rpcUrl: 'https://berachain-mainnet.g.alchemy.com/v2/vNg5BFKZV1TJcvFtMANru',
    symbol: 'BERA',
    explorer: 'https://berascan.com',
    nativeCurrency: 'BERA',
    isTestnet: false,
    bridgeSupport: true,
    dexSupport: ['beraswap', 'honeyswap', 'kodiak']
  },
  'bitcoin': {
    chainId: 0, // Bitcoin mainnet
    name: 'Bitcoin Mainnet',
    network: 'bitcoin-mainnet',
    rpcUrl: 'https://bitcoin-mainnet.g.alchemy.com/v2/vNg5BFKZV1TJcvFtMANru',
    symbol: 'BTC',
    explorer: 'https://blockstream.info',
    nativeCurrency: 'BTC',
    isTestnet: false,
    bridgeSupport: true,
    dexSupport: ['liquidswap', 'thorchain']
  },
  'monad': {
    chainId: 41455, // Monad testnet
    name: 'Monad Testnet',
    network: 'monad-testnet',
    rpcUrl: 'https://monad-testnet.g.alchemy.com/v2/vNg5BFKZV1TJcvFtMANru',
    symbol: 'MON',
    explorer: 'https://monadscan.io',
    nativeCurrency: 'MON',
    isTestnet: true,
    bridgeSupport: true,
    dexSupport: ['monadswap', 'monadex']
  },
  'sui': {
    chainId: 101, // Sui mainnet
    name: 'Sui Mainnet',
    network: 'sui-mainnet',
    rpcUrl: 'https://fullnode.mainnet.sui.io',
    symbol: 'SUI',
    explorer: 'https://suiscan.xyz',
    nativeCurrency: 'SUI',
    isTestnet: false,
    bridgeSupport: true,
    dexSupport: ['cetus', 'turbos', 'suiswap']
  }
}

// Token configurations for each chain
export const CHAIN_TOKENS: Record<string, Record<string, any>> = {
  'ethereum': {
    'WETH': { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', decimals: 18 },
    'USDC': { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6 },
    'USDT': { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 },
    'DAI': { address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', decimals: 18 },
    'WBTC': { address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', decimals: 8 }
  },
  'arbitrum': {
    'WETH': { address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', decimals: 18 },
    'USDC': { address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', decimals: 6 },
    'USDT': { address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', decimals: 6 },
    'DAI': { address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', decimals: 18 },
    'WBTC': { address: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f', decimals: 8 },
    'ARB': { address: '0x912CE59144191C1204E64559FE8253a0e49E6548', decimals: 18 }
  },
  'base': {
    'WETH': { address: '0x4200000000000000000000000000000000000006', decimals: 18 },
    'USDC': { address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', decimals: 6 },
    'USDT': { address: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2', decimals: 6 },
    'DAI': { address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', decimals: 18 },
    'WBTC': { address: '0x1C9A2d6b33B4826757273D47ebEe0e2DddcD978B', decimals: 8 },
    'cbETH': { address: '0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22', decimals: 18 }
  },
  'sonic': {
    'WS': { address: '0x0000000000000000000000000000000000000001', decimals: 18 },
    'USDC': { address: '0x0000000000000000000000000000000000000002', decimals: 6 },
    'USDT': { address: '0x0000000000000000000000000000000000000003', decimals: 6 },
    'WETH': { address: '0x0000000000000000000000000000000000000004', decimals: 18 },
    'WBTC': { address: '0x0000000000000000000000000000000000000005', decimals: 8 }
  },
  'solana': {
    'SOL': { address: 'So11111111111111111111111111111111111111112', decimals: 9 },
    'USDC': { address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', decimals: 6 },
    'USDT': { address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', decimals: 6 },
    'WETH': { address: '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs', decimals: 8 },
    'WBTC': { address: '9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E', decimals: 6 },
    'RAY': { address: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R', decimals: 6 },
    'ORCA': { address: 'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE', decimals: 6 }
  },
  'berachain': {
    'BERA': { address: '0x0000000000000000000000000000000000000000', decimals: 18 },
    'HONEY': { address: '0x0000000000000000000000000000000000000001', decimals: 18 },
    'WBERA': { address: '0x0000000000000000000000000000000000000002', decimals: 18 },
    'USDC': { address: '0x0000000000000000000000000000000000000003', decimals: 6 },
    'USDT': { address: '0x0000000000000000000000000000000000000004', decimals: 6 },
    'WETH': { address: '0x0000000000000000000000000000000000000005', decimals: 18 },
    'WBTC': { address: '0x0000000000000000000000000000000000000006', decimals: 8 }
  },
  'bitcoin': {
    'BTC': { address: 'native', decimals: 8 },
    'WBTC': { address: 'wrapped', decimals: 8 }
  },
  'monad': {
    'MON': { address: '0x0000000000000000000000000000000000000000', decimals: 18 },
    'WMON': { address: '0x0000000000000000000000000000000000000001', decimals: 18 },
    'USDC': { address: '0x0000000000000000000000000000000000000002', decimals: 6 },
    'USDT': { address: '0x0000000000000000000000000000000000000003', decimals: 6 },
    'WETH': { address: '0x0000000000000000000000000000000000000004', decimals: 18 },
    'WBTC': { address: '0x0000000000000000000000000000000000000005', decimals: 8 }
  },
  'sui': {
    'SUI': { address: '0x0000000000000000000000000000000000000002::sui::SUI', decimals: 9 },
    'USDC': { address: '0x0000000000000000000000000000000000000006::coin::COIN', decimals: 6 },
    'USDT': { address: '0x0000000000000000000000000000000000000007::coin::COIN', decimals: 6 },
    'WETH': { address: '0x0000000000000000000000000000000000000008::coin::COIN', decimals: 8 },
    'WBTC': { address: '0x0000000000000000000000000000000000000009::coin::COIN', decimals: 8 }
  }
}

class EnhancedAlchemyService {
  private alchemyInstances: Map<string, Alchemy> = new Map()
  private providers: Map<string, ethers.JsonRpcProvider> = new Map()
  private suiProviders: Map<string, any> = new Map()
  private isInitialized = false
  private priceCache: Map<string, { price: number; timestamp: number }> = new Map()

  constructor() {
    this.initializeConnections()
  }

  private initializeConnections() {
    const apiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY

    if (!apiKey) {
      console.warn('🟡 Alchemy API key not found - using RPC providers only')
      this.initializeRPCProviders()
      return
    }

    try {
      // Initialize Alchemy instances for EVM chains
      Object.entries(MULTI_CHAIN_CONFIG).forEach(([chainKey, config]) => {
        if (config.alchemyNetwork) {
          // Standard Alchemy networks
          const settings: AlchemySettings = {
            apiKey,
            network: config.alchemyNetwork,
          }
          this.alchemyInstances.set(chainKey, new Alchemy(settings))
        } else if (chainKey === 'sonic') {
          // Sonic uses custom Alchemy RPC
          this.providers.set(chainKey, new ethers.JsonRpcProvider(config.rpcUrl))
        } else if (chainKey === 'sui') {
          // Sui uses different SDK
          this.initializeSuiProvider(chainKey, config)
        }

        // Initialize RPC providers for all chains
        if (config.rpcUrl) {
          this.providers.set(chainKey, new ethers.JsonRpcProvider(config.rpcUrl))
        }
      })

      this.isInitialized = true
      console.log('✅ Enhanced Alchemy service initialized for', Object.keys(MULTI_CHAIN_CONFIG).length, 'chains')
      console.log('🔗 Supported chains:', Object.keys(this.providers))
    } catch (error) {
      console.error('❌ Failed to initialize Enhanced Alchemy service:', error)
      this.initializeRPCProviders()
    }
  }

  private initializeRPCProviders() {
    // Fallback to RPC providers only
    Object.entries(MULTI_CHAIN_CONFIG).forEach(([chainKey, config]) => {
      if (config.rpcUrl && chainKey !== 'sui') {
        this.providers.set(chainKey, new ethers.JsonRpcProvider(config.rpcUrl))
      }
    })
    this.isInitialized = true
  }

  private initializeSuiProvider(chainKey: string, config: MultiChainConfig) {
    // For Sui, we would use @mysten/sui.js
    // This is a placeholder for Sui integration
    console.log(`📋 Sui provider initialization for ${chainKey} (placeholder)`)
  }

  // Multi-chain wallet management
  async createMultiChainWallet(): Promise<{
    address: string
    privateKey: string
    chains: Record<string, { address: string; balance: string }>
  } | null> {
    try {
      const wallet = ethers.Wallet.createRandom()
      const chains: Record<string, { address: string; balance: string }> = {}

      // Get balances across all EVM chains
      for (const chainKey of Object.keys(MULTI_CHAIN_CONFIG)) {
        if (chainKey === 'sui') continue // Skip Sui for now

        const provider = this.providers.get(chainKey)
        if (provider) {
          const balance = await provider.getBalance(wallet.address)
          chains[chainKey] = {
            address: wallet.address,
            balance: ethers.formatEther(balance)
          }
        }
      }

      return {
        address: wallet.address,
        privateKey: wallet.privateKey,
        chains
      }
    } catch (error) {
      console.error('Error creating multi-chain wallet:', error)
      return null
    }
  }

  // Get balances across all chains
  async getMultiChainBalances(address: string): Promise<Record<string, TokenBalance[]>> {
    const balances: Record<string, TokenBalance[]> = {}

    for (const [chainKey, config] of Object.entries(MULTI_CHAIN_CONFIG)) {
      if (chainKey === 'sui') continue // Skip Sui for now

      try {
        const chainBalances = await this.getChainBalances(address, chainKey)
        balances[chainKey] = chainBalances
      } catch (error) {
        console.error(`Error getting balances for ${chainKey}:`, error)
        balances[chainKey] = []
      }
    }

    return balances
  }

  async getChainBalances(address: string, chainKey: string): Promise<TokenBalance[]> {
    const balances: TokenBalance[] = []
    const config = MULTI_CHAIN_CONFIG[chainKey]
    
    if (!config) return balances

    try {
      const provider = this.providers.get(chainKey)
      if (!provider) return balances

      // Get native token balance
      const nativeBalance = await provider.getBalance(address)
      const nativePrice = await this.getTokenPrice(config.nativeCurrency)
      
      balances.push({
        contractAddress: ethers.ZeroAddress,
        name: config.nativeCurrency,
        symbol: config.nativeCurrency,
        decimals: 18,
        balance: ethers.formatEther(nativeBalance),
        usdValue: parseFloat(ethers.formatEther(nativeBalance)) * nativePrice,
        chain: chainKey
      })

      // Get ERC20 token balances
      const tokens = CHAIN_TOKENS[chainKey] || {}
      for (const [symbol, tokenInfo] of Object.entries(tokens)) {
        try {
          const balance = await this.getTokenBalance(address, tokenInfo.address, tokenInfo.decimals, chainKey)
          if (parseFloat(balance) > 0) {
            const price = await this.getTokenPrice(symbol)
            
            balances.push({
              contractAddress: tokenInfo.address,
              name: symbol,
              symbol,
              decimals: tokenInfo.decimals,
              balance,
              usdValue: parseFloat(balance) * price,
              chain: chainKey
            })
          }
        } catch (error) {
          console.error(`Error getting ${symbol} balance on ${chainKey}:`, error)
        }
      }

      return balances
    } catch (error) {
      console.error(`Error getting balances for ${chainKey}:`, error)
      return balances
    }
  }

  async getTokenBalance(address: string, tokenAddress: string, decimals: number, chainKey: string): Promise<string> {
    const provider = this.providers.get(chainKey)
    if (!provider) return '0'

    try {
      const contract = new ethers.Contract(
        tokenAddress,
        ['function balanceOf(address) view returns (uint256)'],
        provider
      )

      const balance = await contract.balanceOf(address)
      return ethers.formatUnits(balance, decimals)
    } catch (error) {
      console.error(`Error getting token balance:`, error)
      return '0'
    }
  }

  // Cross-chain transaction execution
  async executeTransaction(
    privateKey: string,
    to: string,
    amount: string,
    chainKey: string,
    tokenAddress?: string
  ): Promise<TransactionInfo | null> {
    try {
      const provider = this.providers.get(chainKey)
      if (!provider) {
        throw new Error(`Provider not found for chain: ${chainKey}`)
      }

      const wallet = new ethers.Wallet(privateKey, provider)
      
      let txResponse
      if (tokenAddress) {
        // ERC20 transfer
        const contract = new ethers.Contract(
          tokenAddress,
          ['function transfer(address to, uint256 amount) external returns (bool)'],
          wallet
        )
        
        const tokenInfo = Object.values(CHAIN_TOKENS[chainKey] || {}).find(
          (t: any) => t.address.toLowerCase() === tokenAddress.toLowerCase()
        )
        const decimals = tokenInfo?.decimals || 18
        
        txResponse = await contract.transfer(to, ethers.parseUnits(amount, decimals))
      } else {
        // Native token transfer
        txResponse = await wallet.sendTransaction({
          to,
          value: ethers.parseEther(amount)
        })
      }

      return {
        hash: txResponse.hash,
        from: wallet.address,
        to,
        value: amount,
        gasUsed: '0', // Will be filled after confirmation
        gasPrice: '0',
        blockNumber: 0,
        timestamp: Date.now(),
        status: 'pending',
        chain: chainKey
      }
    } catch (error) {
      console.error('Error executing transaction:', error)
      return null
    }
  }

  // Cross-chain bridge detection
  async findCrossChainBridges(
    fromChain: string,
    toChain: string,
    token: string,
    amount: string
  ): Promise<CrossChainBridge[]> {
    const bridges: CrossChainBridge[] = []

    // Mock bridge implementations - in production, integrate with real bridge APIs
    const bridgeProviders = [
      {
        provider: 'LayerZero',
        estimatedTime: 300, // 5 minutes
        fees: '0.001'
      },
      {
        provider: 'Wormhole',
        estimatedTime: 600, // 10 minutes
        fees: '0.002'
      },
      {
        provider: 'Stargate',
        estimatedTime: 180, // 3 minutes
        fees: '0.0015'
      }
    ]

    for (const bridge of bridgeProviders) {
      bridges.push({
        fromChain,
        toChain,
        fromToken: token,
        toToken: token, // Assuming same token
        amount,
        estimatedTime: bridge.estimatedTime,
        fees: bridge.fees,
        provider: bridge.provider
      })
    }

    return bridges
  }

  // Price aggregation across chains
  async getTokenPrice(symbol: string): Promise<number> {
    const cached = this.priceCache.get(symbol)
    if (cached && Date.now() - cached.timestamp < 60000) {
      return cached.price
    }

    try {
      // Mock price data - in production, use real price APIs
      const prices: Record<string, number> = {
        'ETH': 2300,
        'WETH': 2300,
        'BTC': 43000,
        'WBTC': 43000,
        'USDC': 1,
        'USDT': 1,
        'DAI': 1,
        'ARB': 0.8,
        'S': 1.5, // Sonic token
        'SUI': 0.65
      }

      const price = prices[symbol.toUpperCase()] || 1
      this.priceCache.set(symbol, { price, timestamp: Date.now() })
      return price
    } catch (error) {
      console.error(`Error getting price for ${symbol}:`, error)
      return 0
    }
  }

  // Multi-chain transaction monitoring
  async monitorTransaction(hash: string, chainKey: string): Promise<TransactionInfo | null> {
    try {
      const provider = this.providers.get(chainKey)
      if (!provider) return null

      const receipt = await provider.waitForTransaction(hash)
      if (!receipt) return null

      return {
        hash,
        from: receipt.from,
        to: receipt.to || '',
        value: '0',
        gasUsed: receipt.gasUsed.toString(),
        gasPrice: receipt.gasPrice?.toString() || '0',
        blockNumber: receipt.blockNumber,
        timestamp: Date.now(),
        status: receipt.status === 1 ? 'success' : 'failed',
        chain: chainKey
      }
    } catch (error) {
      console.error('Error monitoring transaction:', error)
      return null
    }
  }

  // Get optimal chain for transaction
  async getOptimalChain(operation: 'swap' | 'bridge' | 'transfer', amount: number): Promise<string> {
    // Mock logic for optimal chain selection
    const chainScores = {
      'ethereum': { gasPrice: 50, liquidity: 100, speed: 30 },
      'arbitrum': { gasPrice: 10, liquidity: 80, speed: 90 },
      'sonic': { gasPrice: 5, liquidity: 60, speed: 95 },
      'sui': { gasPrice: 2, liquidity: 40, speed: 85 }
    }

    let bestChain = 'ethereum'
    let bestScore = 0

    for (const [chain, metrics] of Object.entries(chainScores)) {
      const score = (metrics.speed * 0.4) + (metrics.liquidity * 0.4) + ((100 - metrics.gasPrice) * 0.2)
      if (score > bestScore) {
        bestScore = score
        bestChain = chain
      }
    }

    return bestChain
  }

  // Portfolio aggregation across chains
  async getAggregatedPortfolio(address: string): Promise<{
    totalValue: number
    chainDistribution: Record<string, number>
    tokenDistribution: Record<string, number>
    topHoldings: Array<{ symbol: string; value: number; chain: string }>
  }> {
    const balances = await this.getMultiChainBalances(address)
    let totalValue = 0
    const chainDistribution: Record<string, number> = {}
    const tokenDistribution: Record<string, number> = {}
    const allHoldings: Array<{ symbol: string; value: number; chain: string }> = []

    for (const [chainKey, chainBalances] of Object.entries(balances)) {
      let chainValue = 0
      
      for (const balance of chainBalances) {
        const value = balance.usdValue || 0
        chainValue += value
        totalValue += value
        
        tokenDistribution[balance.symbol] = (tokenDistribution[balance.symbol] || 0) + value
        allHoldings.push({
          symbol: balance.symbol,
          value,
          chain: chainKey
        })
      }
      
      chainDistribution[chainKey] = chainValue
    }

    const topHoldings = allHoldings
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)

    return {
      totalValue,
      chainDistribution,
      tokenDistribution,
      topHoldings
    }
  }

  // Gas estimation across chains
  async estimateGasAcrossChains(
    operation: 'transfer' | 'swap' | 'bridge',
    amount: string,
    fromChain?: string,
    toChain?: string
  ): Promise<Record<string, { gasLimit: string; gasPrice: string; totalCost: string }>> {
    const gasEstimates: Record<string, { gasLimit: string; gasPrice: string; totalCost: string }> = {}

    for (const chainKey of Object.keys(MULTI_CHAIN_CONFIG)) {
      if (chainKey === 'sui') continue // Skip Sui for now

      try {
        const provider = this.providers.get(chainKey)
        if (!provider) continue

        const gasPrice = await provider.getFeeData()
        const gasLimit = operation === 'transfer' ? 21000 : operation === 'swap' ? 150000 : 300000
        const totalCost = BigInt(gasLimit) * (gasPrice.gasPrice || BigInt(0))

        gasEstimates[chainKey] = {
          gasLimit: gasLimit.toString(),
          gasPrice: ethers.formatUnits(gasPrice.gasPrice || 0, 'gwei'),
          totalCost: ethers.formatEther(totalCost)
        }
      } catch (error) {
        console.error(`Error estimating gas for ${chainKey}:`, error)
      }
    }

    return gasEstimates
  }

  // Health check for all chains
  async getMultiChainHealth(): Promise<Record<string, { 
    status: 'online' | 'offline' | 'degraded'
    latency: number
    blockNumber: number
  }>> {
    const healthStatus: Record<string, { status: 'online' | 'offline' | 'degraded'; latency: number; blockNumber: number }> = {}

    for (const chainKey of Object.keys(MULTI_CHAIN_CONFIG)) {
      if (chainKey === 'sui') continue // Skip Sui for now

      try {
        const provider = this.providers.get(chainKey)
        if (!provider) {
          healthStatus[chainKey] = { status: 'offline', latency: 0, blockNumber: 0 }
          continue
        }

        const startTime = Date.now()
        const blockNumber = await provider.getBlockNumber()
        const latency = Date.now() - startTime

        healthStatus[chainKey] = {
          status: latency < 1000 ? 'online' : 'degraded',
          latency,
          blockNumber
        }
      } catch (error) {
        healthStatus[chainKey] = { status: 'offline', latency: 0, blockNumber: 0 }
      }
    }

    return healthStatus
  }

  // Utility methods
  getSupportedChains(): string[] {
    return Object.keys(MULTI_CHAIN_CONFIG)
  }

  getChainConfig(chainKey: string): MultiChainConfig | null {
    return MULTI_CHAIN_CONFIG[chainKey] || null
  }

  isChainSupported(chainKey: string): boolean {
    return chainKey in MULTI_CHAIN_CONFIG
  }

  get connected(): boolean {
    return this.isInitialized
  }
}

// Export singleton instance
export const enhancedAlchemyService = new EnhancedAlchemyService()
export default enhancedAlchemyService