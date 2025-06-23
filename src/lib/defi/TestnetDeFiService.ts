/**
 * Testnet DeFi Service
 * Provides DeFi functionality on testnets for agents
 */

import { ethers } from 'ethers'

export interface TestnetWallet {
  id: string
  address: string
  privateKey: string
  network: string
  balance: string
  tokens: TokenBalance[]
  createdAt: number
}

export interface TokenBalance {
  symbol: string
  address: string
  balance: string
  decimals: number
  usdValue: number
}

export interface DeFiPosition {
  id: string
  protocol: string
  type: 'liquidity' | 'lending' | 'farming' | 'staking'
  tokens: string[]
  amounts: string[]
  apy: number
  usdValue: number
  timestamp: number
}

export interface TestnetTransaction {
  id: string
  hash: string
  from: string
  to: string
  value: string
  gasUsed: string
  gasPrice: string
  status: 'pending' | 'success' | 'failed'
  timestamp: number
  type: 'transfer' | 'swap' | 'liquidity' | 'stake'
}

// Testnet configurations
const TESTNETS = {
  sepolia: {
    name: 'Sepolia',
    chainId: 11155111,
    rpcUrl: 'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161', // Free Infura endpoint
    currency: 'SepoliaETH',
    faucet: 'https://sepoliafaucet.com/',
    explorer: 'https://sepolia.etherscan.io'
  },
  polygon_mumbai: {
    name: 'Polygon Mumbai',
    chainId: 80001,
    rpcUrl: 'https://rpc-mumbai.maticvigil.com/',
    currency: 'MATIC',
    faucet: 'https://faucet.polygon.technology/',
    explorer: 'https://mumbai.polygonscan.com'
  },
  bsc_testnet: {
    name: 'BSC Testnet',
    chainId: 97,
    rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
    currency: 'tBNB',
    faucet: 'https://testnet.bnbchain.org/faucet-smart',
    explorer: 'https://testnet.bscscan.com'
  }
}

// Mock DeFi protocols for testnet
const TESTNET_PROTOCOLS = {
  uniswap_v3: {
    name: 'Uniswap V3 (Testnet)',
    router: '0x1F98431c8aD98523631AE4a59f267346ea31F984', // Mock address
    factory: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
    pools: [
      { pair: 'ETH/USDC', address: '0x...', fee: 3000 },
      { pair: 'WBTC/ETH', address: '0x...', fee: 3000 }
    ]
  },
  aave: {
    name: 'Aave (Testnet)',
    lendingPool: '0x...', // Mock address
    tokens: [
      { symbol: 'aETH', address: '0x...', apy: 2.5 },
      { symbol: 'aUSDC', address: '0x...', apy: 4.2 }
    ]
  },
  compound: {
    name: 'Compound (Testnet)',
    comptroller: '0x...',
    tokens: [
      { symbol: 'cETH', address: '0x...', apy: 3.1 },
      { symbol: 'cUSDC', address: '0x...', apy: 3.8 }
    ]
  }
}

class TestnetDeFiService {
  private providers: Map<string, ethers.JsonRpcProvider> = new Map()
  private wallets: Map<string, TestnetWallet> = new Map()
  private positions: Map<string, DeFiPosition[]> = new Map()
  private transactions: TestnetTransaction[] = []
  
  constructor() {
    this.initializeProviders()
    this.loadPersistedData()
  }

  // Initialize providers for different testnets
  private initializeProviders(): void {
    Object.entries(TESTNETS).forEach(([network, config]) => {
      try {
        const provider = new ethers.JsonRpcProvider(config.rpcUrl)
        this.providers.set(network, provider)
        console.log(`Initialized ${network} provider`)
      } catch (error) {
        console.error(`Failed to initialize ${network} provider:`, error)
      }
    })
  }

  // Wallet management
  async createTestnetWallet(network: string = 'sepolia'): Promise<TestnetWallet> {
    if (!TESTNETS[network]) {
      throw new Error(`Unsupported network: ${network}`)
    }

    // Generate new wallet
    const wallet = ethers.Wallet.createRandom()
    const provider = this.providers.get(network)

    let balance = '0'
    try {
      if (provider) {
        const balanceWei = await provider.getBalance(wallet.address)
        balance = ethers.formatEther(balanceWei)
      }
    } catch (error) {
      console.warn('Could not fetch balance:', error)
    }

    const testnetWallet: TestnetWallet = {
      id: `wallet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      address: wallet.address,
      privateKey: wallet.privateKey,
      network,
      balance,
      tokens: [],
      createdAt: Date.now()
    }

    this.wallets.set(testnetWallet.id, testnetWallet)
    this.persistData()

    return testnetWallet
  }

  async getWalletBalance(walletId: string): Promise<TokenBalance[]> {
    const wallet = this.wallets.get(walletId)
    if (!wallet) {
      throw new Error(`Wallet not found: ${walletId}`)
    }

    const provider = this.providers.get(wallet.network)
    if (!provider) {
      throw new Error(`Provider not available for ${wallet.network}`)
    }

    try {
      // Get native token balance
      const balanceWei = await provider.getBalance(wallet.address)
      const balance = ethers.formatEther(balanceWei)
      
      const testnetConfig = TESTNETS[wallet.network]
      const balances: TokenBalance[] = [
        {
          symbol: testnetConfig.currency,
          address: '0x0000000000000000000000000000000000000000', // Native token
          balance,
          decimals: 18,
          usdValue: parseFloat(balance) * 1800 // Mock USD value
        }
      ]

      // Mock some ERC20 token balances for testing
      if (wallet.network === 'sepolia') {
        balances.push(
          {
            symbol: 'USDC',
            address: '0x07865c6E87B9F70255377e024ace6630C1Eaa37F', // USDC on Sepolia
            balance: (Math.random() * 1000).toFixed(2),
            decimals: 6,
            usdValue: parseFloat(balances[balances.length - 1]?.balance || '0')
          },
          {
            symbol: 'DAI',
            address: '0x3e622317f8C93f7328350cF0B56d9eD4C620C5d6', // DAI on Sepolia
            balance: (Math.random() * 500).toFixed(2),
            decimals: 18,
            usdValue: parseFloat(balances[balances.length - 1]?.balance || '0')
          }
        )
      }

      // Update wallet
      wallet.tokens = balances
      wallet.balance = balance
      this.persistData()

      return balances

    } catch (error) {
      console.error('Failed to get wallet balance:', error)
      return wallet.tokens
    }
  }

  // DeFi Protocol Interactions
  async provideLiquidity(
    walletId: string,
    protocol: string,
    tokenA: string,
    tokenB: string,
    amountA: string,
    amountB: string
  ): Promise<DeFiPosition> {
    const wallet = this.wallets.get(walletId)
    if (!wallet) {
      throw new Error(`Wallet not found: ${walletId}`)
    }

    // Simulate liquidity provision (testnet)
    const position: DeFiPosition = {
      id: `lp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      protocol,
      type: 'liquidity',
      tokens: [tokenA, tokenB],
      amounts: [amountA, amountB],
      apy: 5 + Math.random() * 15, // 5-20% APY
      usdValue: (parseFloat(amountA) + parseFloat(amountB)) * 1800, // Mock USD value
      timestamp: Date.now()
    }

    // Add to positions
    if (!this.positions.has(walletId)) {
      this.positions.set(walletId, [])
    }
    this.positions.get(walletId)!.push(position)

    // Create mock transaction
    const transaction: TestnetTransaction = {
      id: `tx_${Date.now()}`,
      hash: `0x${Math.random().toString(16).substr(2, 64)}`,
      from: wallet.address,
      to: TESTNET_PROTOCOLS[protocol]?.router || '0x...',
      value: '0',
      gasUsed: '150000',
      gasPrice: '20000000000',
      status: 'success',
      timestamp: Date.now(),
      type: 'liquidity'
    }

    this.transactions.push(transaction)
    this.persistData()

    return position
  }

  async stake(
    walletId: string,
    protocol: string,
    token: string,
    amount: string
  ): Promise<DeFiPosition> {
    const wallet = this.wallets.get(walletId)
    if (!wallet) {
      throw new Error(`Wallet not found: ${walletId}`)
    }

    const position: DeFiPosition = {
      id: `stake_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      protocol,
      type: 'staking',
      tokens: [token],
      amounts: [amount],
      apy: 8 + Math.random() * 12, // 8-20% APY for staking
      usdValue: parseFloat(amount) * 1800,
      timestamp: Date.now()
    }

    if (!this.positions.has(walletId)) {
      this.positions.set(walletId, [])
    }
    this.positions.get(walletId)!.push(position)

    const transaction: TestnetTransaction = {
      id: `tx_${Date.now()}`,
      hash: `0x${Math.random().toString(16).substr(2, 64)}`,
      from: wallet.address,
      to: TESTNET_PROTOCOLS[protocol]?.comptroller || '0x...',
      value: amount,
      gasUsed: '100000',
      gasPrice: '20000000000',
      status: 'success',
      timestamp: Date.now(),
      type: 'stake'
    }

    this.transactions.push(transaction)
    this.persistData()

    return position
  }

  async lend(
    walletId: string,
    protocol: string,
    token: string,
    amount: string
  ): Promise<DeFiPosition> {
    const wallet = this.wallets.get(walletId)
    if (!wallet) {
      throw new Error(`Wallet not found: ${walletId}`)
    }

    const position: DeFiPosition = {
      id: `lend_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      protocol,
      type: 'lending',
      tokens: [token],
      amounts: [amount],
      apy: 3 + Math.random() * 8, // 3-11% APY for lending
      usdValue: parseFloat(amount) * 1800,
      timestamp: Date.now()
    }

    if (!this.positions.has(walletId)) {
      this.positions.set(walletId, [])
    }
    this.positions.get(walletId)!.push(position)

    const transaction: TestnetTransaction = {
      id: `tx_${Date.now()}`,
      hash: `0x${Math.random().toString(16).substr(2, 64)}`,
      from: wallet.address,
      to: TESTNET_PROTOCOLS[protocol]?.lendingPool || '0x...',
      value: amount,
      gasUsed: '120000',
      gasPrice: '20000000000',
      status: 'success',
      timestamp: Date.now(),
      type: 'transfer'
    }

    this.transactions.push(transaction)
    this.persistData()

    return position
  }

  async swapTokens(
    walletId: string,
    tokenIn: string,
    tokenOut: string,
    amountIn: string,
    slippage: number = 0.5
  ): Promise<TestnetTransaction> {
    const wallet = this.wallets.get(walletId)
    if (!wallet) {
      throw new Error(`Wallet not found: ${walletId}`)
    }

    // Simulate swap with slippage
    const expectedOut = parseFloat(amountIn) * (0.95 + Math.random() * 0.1) // Random rate
    const actualOut = expectedOut * (1 - slippage / 100)

    const transaction: TestnetTransaction = {
      id: `tx_${Date.now()}`,
      hash: `0x${Math.random().toString(16).substr(2, 64)}`,
      from: wallet.address,
      to: TESTNET_PROTOCOLS.uniswap_v3.router,
      value: amountIn,
      gasUsed: '180000',
      gasPrice: '25000000000',
      status: 'success',
      timestamp: Date.now(),
      type: 'swap'
    }

    this.transactions.push(transaction)
    this.persistData()

    return transaction
  }

  // Portfolio analysis
  getWalletPositions(walletId: string): DeFiPosition[] {
    return this.positions.get(walletId) || []
  }

  getWalletTransactions(walletId: string): TestnetTransaction[] {
    const wallet = this.wallets.get(walletId)
    if (!wallet) return []

    return this.transactions.filter(tx => 
      tx.from === wallet.address || tx.to === wallet.address
    )
  }

  getTotalPortfolioValue(walletId: string): number {
    const positions = this.getWalletPositions(walletId)
    return positions.reduce((total, position) => total + position.usdValue, 0)
  }

  getAverageAPY(walletId: string): number {
    const positions = this.getWalletPositions(walletId)
    if (positions.length === 0) return 0

    const weightedAPY = positions.reduce((total, position) => {
      return total + (position.apy * position.usdValue)
    }, 0)

    const totalValue = positions.reduce((total, position) => total + position.usdValue, 0)
    return totalValue > 0 ? weightedAPY / totalValue : 0
  }

  // Data management
  getAllWallets(): TestnetWallet[] {
    return Array.from(this.wallets.values())
  }

  getWallet(walletId: string): TestnetWallet | null {
    return this.wallets.get(walletId) || null
  }

  getAvailableNetworks(): Array<{ id: string, name: string, chainId: number }> {
    return Object.entries(TESTNETS).map(([id, config]) => ({
      id,
      name: config.name,
      chainId: config.chainId
    }))
  }

  getAvailableProtocols(): Array<{ id: string, name: string, types: string[] }> {
    return Object.entries(TESTNET_PROTOCOLS).map(([id, config]) => ({
      id,
      name: config.name,
      types: ['liquidity', 'lending', 'staking']
    }))
  }

  // Persistence
  private persistData(): void {
    try {
      const data = {
        wallets: Object.fromEntries(this.wallets),
        positions: Object.fromEntries(this.positions),
        transactions: this.transactions.slice(-1000) // Keep last 1000 transactions
      }
      localStorage.setItem('testnet_defi_data', JSON.stringify(data))
    } catch (error) {
      console.error('Failed to persist DeFi data:', error)
    }
  }

  private loadPersistedData(): void {
    try {
      const stored = localStorage.getItem('testnet_defi_data')
      if (stored) {
        const data = JSON.parse(stored)
        
        if (data.wallets) {
          this.wallets = new Map(Object.entries(data.wallets))
        }
        
        if (data.positions) {
          this.positions = new Map(Object.entries(data.positions))
        }
        
        if (data.transactions) {
          this.transactions = data.transactions
        }
        
        console.log('Loaded testnet DeFi data')
      }
    } catch (error) {
      console.error('Failed to load testnet DeFi data:', error)
    }
  }

  // Utilities
  async requestTestnetTokens(walletId: string): Promise<{ success: boolean, message: string }> {
    const wallet = this.wallets.get(walletId)
    if (!wallet) {
      return { success: false, message: 'Wallet not found' }
    }

    const testnetConfig = TESTNETS[wallet.network]
    
    // Simulate faucet request
    return {
      success: true,
      message: `Please visit ${testnetConfig.faucet} to request testnet tokens for ${wallet.address}`
    }
  }

  getNetworkExplorerUrl(network: string, txHash?: string): string {
    const testnetConfig = TESTNETS[network]
    if (!testnetConfig) return ''
    
    return txHash 
      ? `${testnetConfig.explorer}/tx/${txHash}`
      : testnetConfig.explorer
  }
}

// Singleton instance
export const testnetDeFiService = new TestnetDeFiService()

export default TestnetDeFiService