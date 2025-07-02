'use client'

import { Alchemy, Network, AlchemySettings } from 'alchemy-sdk'
import { ethers } from 'ethers'

export interface ChainConfig {
  chainId: number
  name: string
  network: Network
  rpcUrl: string
  symbol: string
  explorer: string
}

export interface WalletInfo {
  address: string
  privateKey: string
  chainId: number
  balance: string
  nonce: number
}

export interface TokenBalance {
  contractAddress: string
  name: string
  symbol: string
  decimals: number
  balance: string
  logo?: string
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
}

// Supported testnet chains
export const SUPPORTED_CHAINS: Record<string, ChainConfig> = {
  'eth-sepolia': {
    chainId: 11155111,
    name: 'Ethereum Sepolia',
    network: Network.ETH_SEPOLIA,
    rpcUrl: process.env.NEXT_PUBLIC_ETH_SEPOLIA_URL || '',
    symbol: 'ETH',
    explorer: 'https://sepolia.etherscan.io'
  },
  'arb-sepolia': {
    chainId: 421614,
    name: 'Arbitrum Sepolia',
    network: Network.ARB_SEPOLIA,
    rpcUrl: process.env.NEXT_PUBLIC_ARB_SEPOLIA_URL || '',
    symbol: 'ETH',
    explorer: 'https://sepolia.arbiscan.io'
  }
  // Note: Sonic testnet will be added when Alchemy supports it
}

class AlchemyService {
  private alchemyInstances: Record<string, Alchemy> = {}
  private providers: Record<string, ethers.JsonRpcProvider> = {}
  private isInitialized = false

  constructor() {
    this.initializeConnections()
  }

  private initializeConnections() {
    const apiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY

    if (!apiKey) {
      console.warn('Alchemy API key not found - using mock mode')
      this.isInitialized = false
      return
    }

    try {
      // Initialize Alchemy instances for each supported chain
      Object.entries(SUPPORTED_CHAINS).forEach(([chainKey, config]) => {
        const settings: AlchemySettings = {
          apiKey,
          network: config.network,
        }

        this.alchemyInstances[chainKey] = new Alchemy(settings)
        this.providers[chainKey] = new ethers.JsonRpcProvider(config.rpcUrl)
      })

      this.isInitialized = true
      console.log('✅ Alchemy service initialized for', Object.keys(SUPPORTED_CHAINS).length, 'chains')
    } catch (error) {
      console.error('❌ Failed to initialize Alchemy service:', error)
      this.isInitialized = false
    }
  }

  // Wallet Management
  async createWallet(chainKey: string = 'eth-sepolia'): Promise<WalletInfo | null> {
    try {
      const provider = this.providers[chainKey]
      if (!provider) {
        throw new Error(`Provider not found for chain: ${chainKey}`)
      }

      const wallet = ethers.Wallet.createRandom()
      const connectedWallet = wallet.connect(provider)
      
      const balance = await provider.getBalance(wallet.address)
      const nonce = await provider.getTransactionCount(wallet.address)
      
      return {
        address: wallet.address,
        privateKey: wallet.privateKey,
        chainId: SUPPORTED_CHAINS[chainKey].chainId,
        balance: ethers.formatEther(balance),
        nonce
      }
    } catch (error) {
      console.error('Error creating wallet:', error)
      return null
    }
  }

  async getWalletBalance(address: string, chainKey: string = 'eth-sepolia'): Promise<string> {
    try {
      const alchemy = this.alchemyInstances[chainKey]
      if (!alchemy) {
        throw new Error(`Alchemy instance not found for chain: ${chainKey}`)
      }

      const balance = await alchemy.core.getBalance(address)
      return ethers.formatEther(balance)
    } catch (error) {
      console.error('Error getting wallet balance:', error)
      return '0'
    }
  }

  async getTokenBalances(address: string, chainKey: string = 'eth-sepolia'): Promise<TokenBalance[]> {
    try {
      const alchemy = this.alchemyInstances[chainKey]
      if (!alchemy) {
        throw new Error(`Alchemy instance not found for chain: ${chainKey}`)
      }

      const balances = await alchemy.core.getTokenBalances(address)
      
      const tokenBalances: TokenBalance[] = []
      
      for (const balance of balances.tokenBalances) {
        if (balance.tokenBalance && balance.tokenBalance !== '0x0') {
          try {
            const metadata = await alchemy.core.getTokenMetadata(balance.contractAddress)
            
            tokenBalances.push({
              contractAddress: balance.contractAddress,
              name: metadata.name || 'Unknown',
              symbol: metadata.symbol || 'UNK',
              decimals: metadata.decimals || 18,
              balance: ethers.formatUnits(balance.tokenBalance, metadata.decimals || 18),
              logo: metadata.logo
            })
          } catch (metadataError) {
            console.warn('Could not get metadata for token:', balance.contractAddress)
          }
        }
      }

      return tokenBalances
    } catch (error) {
      console.error('Error getting token balances:', error)
      return []
    }
  }

  // Transaction History
  async getTransactionHistory(address: string, chainKey: string = 'eth-sepolia'): Promise<TransactionInfo[]> {
    try {
      const alchemy = this.alchemyInstances[chainKey]
      if (!alchemy) {
        throw new Error(`Alchemy instance not found for chain: ${chainKey}`)
      }

      const transfers = await alchemy.core.getAssetTransfers({
        fromAddress: address,
        category: ['external', 'erc20', 'erc721', 'erc1155'],
        maxCount: 50
      })

      const transactions: TransactionInfo[] = transfers.transfers.map(transfer => ({
        hash: transfer.hash || '',
        from: transfer.from || '',
        to: transfer.to || '',
        value: transfer.value?.toString() || '0',
        gasUsed: '0', // Will be filled from receipt if needed
        gasPrice: '0',
        blockNumber: parseInt(transfer.blockNum || '0', 16),
        timestamp: 0, // Will be filled from block data if needed
        status: 'success' as const
      }))

      return transactions
    } catch (error) {
      console.error('Error getting transaction history:', error)
      return []
    }
  }

  // Market Data Integration
  async getETHPrice(chainKey: string = 'eth-sepolia'): Promise<number> {
    try {
      // For testnets, we'll use mainnet price as reference
      // In real implementation, you might want to use a price oracle
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd')
      const data = await response.json()
      return data.ethereum?.usd || 0
    } catch (error) {
      console.error('Error getting ETH price:', error)
      return 0
    }
  }

  // Gas Fee Estimation
  async estimateGas(chainKey: string = 'eth-sepolia'): Promise<{ gasPrice: string; maxFeePerGas: string; maxPriorityFeePerGas: string }> {
    try {
      const provider = this.providers[chainKey]
      if (!provider) {
        throw new Error(`Provider not found for chain: ${chainKey}`)
      }

      const feeData = await provider.getFeeData()
      
      return {
        gasPrice: ethers.formatUnits(feeData.gasPrice || 0, 'gwei'),
        maxFeePerGas: ethers.formatUnits(feeData.maxFeePerGas || 0, 'gwei'),
        maxPriorityFeePerGas: ethers.formatUnits(feeData.maxPriorityFeePerGas || 0, 'gwei')
      }
    } catch (error) {
      console.error('Error estimating gas:', error)
      return {
        gasPrice: '0',
        maxFeePerGas: '0',
        maxPriorityFeePerGas: '0'
      }
    }
  }

  // Mock Data for Development
  generateMockWallet(chainKey: string = 'eth-sepolia'): WalletInfo {
    const mockAddress = ethers.Wallet.createRandom().address
    
    return {
      address: mockAddress,
      privateKey: '0x0000000000000000000000000000000000000000000000000000000000000000', // Never use in production
      chainId: SUPPORTED_CHAINS[chainKey]?.chainId || 11155111,
      balance: (Math.random() * 10).toFixed(4),
      nonce: Math.floor(Math.random() * 100)
    }
  }

  generateMockTokenBalances(): TokenBalance[] {
    return [
      {
        contractAddress: '0x...',
        name: 'USD Coin',
        symbol: 'USDC',
        decimals: 6,
        balance: (Math.random() * 1000).toFixed(2),
        logo: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png'
      },
      {
        contractAddress: '0x...',
        name: 'Chainlink',
        symbol: 'LINK',
        decimals: 18,
        balance: (Math.random() * 100).toFixed(4),
        logo: 'https://cryptologos.cc/logos/chainlink-link-logo.png'
      }
    ]
  }

  generateMockTransactions(): TransactionInfo[] {
    return Array.from({ length: 10 }, (_, i) => ({
      hash: `0x${Math.random().toString(16).substr(2, 64)}`,
      from: ethers.Wallet.createRandom().address,
      to: ethers.Wallet.createRandom().address,
      value: (Math.random() * 10).toFixed(4),
      gasUsed: (Math.random() * 100000).toFixed(0),
      gasPrice: (Math.random() * 50).toFixed(2),
      blockNumber: 5000000 - i,
      timestamp: Date.now() - (i * 3600000), // Hours ago
      status: Math.random() > 0.1 ? 'success' : 'failed'
    }))
  }

  // Utility Methods
  getAllChains(): ChainConfig[] {
    return Object.values(SUPPORTED_CHAINS)
  }

  getChainConfig(chainKey: string): ChainConfig | null {
    return SUPPORTED_CHAINS[chainKey] || null
  }

  isChainSupported(chainKey: string): boolean {
    return chainKey in SUPPORTED_CHAINS
  }

  get connected(): boolean {
    return this.isInitialized
  }

  get availableChains(): string[] {
    return Object.keys(SUPPORTED_CHAINS)
  }
}

// Export singleton instance
export const alchemyService = new AlchemyService()
export default alchemyService