/**
 * Vault Integration Service
 * Comprehensive vault and wallet management integrated with agents
 */

import { EventEmitter } from 'events'
import type { TestnetWallet } from '@/lib/defi/TestnetDeFiService'

// Lazy load all services to prevent circular dependencies
const getTestnetDeFiService = () => import('@/lib/defi/TestnetDeFiService').then(m => m.testnetDeFiService)
const getAgentPersistenceService = () => import('@/lib/agents/AgentPersistenceService').then(m => m.agentPersistenceService)
const getPersistentTradingEngine = () => import('@/lib/paper-trading/PersistentTradingEngine').then(m => m.persistentTradingEngine)

export interface VaultConfig {
  id: string
  name: string
  description: string
  type: 'hot' | 'cold' | 'multisig' | 'defi'
  network: string
  
  // Security Settings
  requireApproval: boolean
  approvalThreshold: number
  multiSigRequired: boolean
  timelock: number // in seconds
  
  // Access Control
  authorizedAgents: string[]
  authorizedUsers: string[]
  permissions: {
    read: string[]
    withdraw: string[]
    deposit: string[]
    trade: string[]
    defi: string[]
  }
  
  // Allocation Settings
  maxAllocation: number // per agent/user
  maxDailyWithdrawal: number
  emergencyFreezeEnabled: boolean
  
  // Auto-management
  autoRebalance: boolean
  rebalanceThreshold: number
  autoCompound: boolean
  yieldFarming: boolean
  
  createdAt: number
  updatedAt: number
}

export interface VaultAsset {
  symbol: string
  name: string
  address: string
  decimals: number
  balance: string
  usdValue: number
  allocation: number // percentage
  lockedAmount: string
  availableAmount: string
  
  // Yield Information
  apy: number
  stakingRewards: string
  liquidityRewards: string
  
  // Risk Metrics
  volatility: number
  riskScore: number
  correlationScore: number
}

export interface VaultTransaction {
  id: string
  vaultId: string
  agentId?: string
  userId?: string
  type: 'deposit' | 'withdraw' | 'trade' | 'stake' | 'unstake' | 'compound'
  asset: string
  amount: string
  usdValue: number
  fee: string
  gasUsed: string
  txHash?: string
  status: 'pending' | 'confirmed' | 'failed' | 'cancelled'
  timestamp: number
  
  // Approval workflow
  requiresApproval: boolean
  approvedBy: string[]
  approvalStatus: 'pending' | 'approved' | 'rejected'
  
  // Additional metadata
  reason?: string
  notes?: string
  relatedTxId?: string
}

export interface VaultStats {
  totalValue: number
  totalAssets: number
  dailyVolume: number
  totalYield: number
  apy: number
  sharpeRatio: number
  maxDrawdown: number
  
  // Agent allocation breakdown
  agentAllocations: Record<string, number>
  assetDistribution: Record<string, number>
  
  // Performance metrics
  performance24h: number
  performance7d: number
  performance30d: number
  performance1y: number
}

export interface VaultAlert {
  id: string
  vaultId: string
  type: 'security' | 'balance' | 'performance' | 'approval' | 'system'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  message: string
  timestamp: number
  acknowledged: boolean
  acknowledgedBy?: string
  resolvedAt?: number
}

class VaultIntegrationService extends EventEmitter {
  private vaults: Map<string, VaultConfig> = new Map()
  private vaultAssets: Map<string, VaultAsset[]> = new Map() // vaultId -> assets
  private vaultTransactions: Map<string, VaultTransaction[]> = new Map() // vaultId -> transactions
  private vaultAlerts: Map<string, VaultAlert[]> = new Map() // vaultId -> alerts
  private agentWalletMappings: Map<string, string[]> = new Map() // agentId -> vaultIds
  
  // Lazy loaded services
  private testnetDeFiService: any = null
  private agentPersistenceService: any = null
  private persistentTradingEngine: any = null
  
  constructor() {
    super()
    this.initializeAsync()
  }
  
  private async initializeAsync() {
    try {
      // Load services lazily
      this.testnetDeFiService = await getTestnetDeFiService()
      this.agentPersistenceService = await getAgentPersistenceService()
      this.persistentTradingEngine = await getPersistentTradingEngine()
      
      this.loadPersistedData()
      this.setupEventListeners()
      this.startMonitoring()
    } catch (error) {
      console.error('Failed to initialize VaultIntegrationService:', error)
    }
  }

  // Vault Management
  async createVault(config: Omit<VaultConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const vaultId = `vault_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const vaultConfig: VaultConfig = {
      ...config,
      id: vaultId,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    this.vaults.set(vaultId, vaultConfig)
    this.vaultAssets.set(vaultId, [])
    this.vaultTransactions.set(vaultId, [])
    this.vaultAlerts.set(vaultId, [])

    // Create underlying wallets based on vault type
    if (config.type === 'defi') {
      await this.createDeFiWallets(vaultId, config.network)
    }

    this.persistData()
    this.emit('vaultCreated', { vaultId, config: vaultConfig })
    
    return vaultId
  }

  async updateVault(vaultId: string, updates: Partial<VaultConfig>): Promise<boolean> {
    const vault = this.vaults.get(vaultId)
    if (!vault) return false

    const updatedVault = {
      ...vault,
      ...updates,
      updatedAt: Date.now()
    }

    this.vaults.set(vaultId, updatedVault)
    this.persistData()
    
    this.emit('vaultUpdated', { vaultId, vault: updatedVault, updates })
    return true
  }

  async deleteVault(vaultId: string): Promise<boolean> {
    const vault = this.vaults.get(vaultId)
    if (!vault) return false

    // Remove from agent mappings
    for (const [agentId, vaultIds] of this.agentWalletMappings.entries()) {
      const index = vaultIds.indexOf(vaultId)
      if (index !== -1) {
        vaultIds.splice(index, 1)
        if (vaultIds.length === 0) {
          this.agentWalletMappings.delete(agentId)
        }
      }
    }

    // Cleanup all vault data
    this.vaults.delete(vaultId)
    this.vaultAssets.delete(vaultId)
    this.vaultTransactions.delete(vaultId)
    this.vaultAlerts.delete(vaultId)

    this.persistData()
    this.emit('vaultDeleted', { vaultId })
    
    return true
  }

  // Agent Integration
  async assignVaultToAgent(agentId: string, vaultId: string): Promise<boolean> {
    const vault = this.vaults.get(vaultId)
    if (!vault) return false

    // Check if agent is authorized
    if (!vault.authorizedAgents.includes(agentId)) {
      vault.authorizedAgents.push(agentId)
      await this.updateVault(vaultId, { authorizedAgents: vault.authorizedAgents })
    }

    // Add to agent mappings
    if (!this.agentWalletMappings.has(agentId)) {
      this.agentWalletMappings.set(agentId, [])
    }
    
    const agentVaults = this.agentWalletMappings.get(agentId)!
    if (!agentVaults.includes(vaultId)) {
      agentVaults.push(vaultId)
    }

    // Update agent persistence service
    const agent = this.agentPersistenceService?.getAgent(agentId)
    if (agent) {
      agent.walletIds = agentVaults
      this.persistData()
    }

    this.emit('vaultAssigned', { agentId, vaultId })
    return true
  }

  async removeVaultFromAgent(agentId: string, vaultId: string): Promise<boolean> {
    const agentVaults = this.agentWalletMappings.get(agentId)
    if (!agentVaults) return false

    const index = agentVaults.indexOf(vaultId)
    if (index !== -1) {
      agentVaults.splice(index, 1)
      
      // Update vault permissions
      const vault = this.vaults.get(vaultId)
      if (vault) {
        const agentIndex = vault.authorizedAgents.indexOf(agentId)
        if (agentIndex !== -1) {
          vault.authorizedAgents.splice(agentIndex, 1)
          await this.updateVault(vaultId, { authorizedAgents: vault.authorizedAgents })
        }
      }

      this.persistData()
      this.emit('vaultRemoved', { agentId, vaultId })
      return true
    }

    return false
  }

  getAgentVaults(agentId: string): VaultConfig[] {
    const vaultIds = this.agentWalletMappings.get(agentId) || []
    return vaultIds.map(id => this.vaults.get(id)).filter(Boolean) as VaultConfig[]
  }

  // Wallet Operations
  async deposit(vaultId: string, asset: string, amount: string, agentId?: string): Promise<string> {
    const vault = this.vaults.get(vaultId)
    if (!vault) throw new Error('Vault not found')

    if (agentId && !vault.authorizedAgents.includes(agentId)) {
      throw new Error('Agent not authorized for this vault')
    }

    const txId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const transaction: VaultTransaction = {
      id: txId,
      vaultId,
      agentId,
      type: 'deposit',
      asset,
      amount,
      usdValue: await this.calculateUSDValue(asset, amount),
      fee: '0',
      gasUsed: '0',
      status: 'pending',
      timestamp: Date.now(),
      requiresApproval: vault.requireApproval,
      approvedBy: [],
      approvalStatus: vault.requireApproval ? 'pending' : 'approved'
    }

    if (!this.vaultTransactions.has(vaultId)) {
      this.vaultTransactions.set(vaultId, [])
    }
    this.vaultTransactions.get(vaultId)!.push(transaction)

    if (!vault.requireApproval) {
      await this.processDeposit(vaultId, transaction)
    }

    this.persistData()
    this.emit('depositInitiated', { vaultId, transaction })
    
    return txId
  }

  async withdraw(vaultId: string, asset: string, amount: string, agentId?: string): Promise<string> {
    const vault = this.vaults.get(vaultId)
    if (!vault) throw new Error('Vault not found')

    if (agentId && !vault.authorizedAgents.includes(agentId)) {
      throw new Error('Agent not authorized for this vault')
    }

    // Check availability
    const assets = this.vaultAssets.get(vaultId) || []
    const assetData = assets.find(a => a.symbol === asset)
    if (!assetData || parseFloat(assetData.availableAmount) < parseFloat(amount)) {
      throw new Error('Insufficient available balance')
    }

    // Check daily withdrawal limit
    const todayWithdrawals = this.getTodayWithdrawals(vaultId, agentId)
    const usdValue = await this.calculateUSDValue(asset, amount)
    if (todayWithdrawals + usdValue > vault.maxDailyWithdrawal) {
      throw new Error('Daily withdrawal limit exceeded')
    }

    const txId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const transaction: VaultTransaction = {
      id: txId,
      vaultId,
      agentId,
      type: 'withdraw',
      asset,
      amount,
      usdValue,
      fee: '0',
      gasUsed: '0',
      status: 'pending',
      timestamp: Date.now(),
      requiresApproval: vault.requireApproval,
      approvedBy: [],
      approvalStatus: vault.requireApproval ? 'pending' : 'approved'
    }

    if (!this.vaultTransactions.has(vaultId)) {
      this.vaultTransactions.set(vaultId, [])
    }
    this.vaultTransactions.get(vaultId)!.push(transaction)

    if (!vault.requireApproval) {
      await this.processWithdrawal(vaultId, transaction)
    }

    this.persistData()
    this.emit('withdrawalInitiated', { vaultId, transaction })
    
    return txId
  }

  // DeFi Operations
  async stakeToDeFi(vaultId: string, protocol: string, asset: string, amount: string, agentId?: string): Promise<string> {
    const vault = this.vaults.get(vaultId)
    if (!vault || vault.type !== 'defi') {
      throw new Error('Invalid vault for DeFi operations')
    }

    // Get DeFi wallet for this vault
    const wallets = this.testnetDeFiService?.getAllWallets()
    const vaultWallet = wallets.find(w => w.id.includes(vaultId))
    
    if (!vaultWallet) {
      throw new Error('DeFi wallet not found for vault')
    }

    try {
      const position = await this.testnetDeFiService?.stake(vaultWallet.id, protocol, asset, amount)
      
      const txId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const transaction: VaultTransaction = {
        id: txId,
        vaultId,
        agentId,
        type: 'stake',
        asset,
        amount,
        usdValue: position.usdValue,
        fee: '0.001', // Mock fee
        gasUsed: '50000',
        status: 'confirmed',
        timestamp: Date.now(),
        requiresApproval: false,
        approvedBy: [],
        approvalStatus: 'approved',
        notes: `Staked to ${protocol} - Position ID: ${position.id}`
      }

      if (!this.vaultTransactions.has(vaultId)) {
        this.vaultTransactions.set(vaultId, [])
      }
      this.vaultTransactions.get(vaultId)!.push(transaction)

      // Update vault assets
      await this.updateVaultAssets(vaultId)

      this.persistData()
      this.emit('defiStakeCompleted', { vaultId, transaction, position })
      
      return txId
    } catch (error) {
      throw new Error(`DeFi staking failed: ${error}`)
    }
  }

  async provideLiquidity(
    vaultId: string, 
    protocol: string, 
    tokenA: string, 
    tokenB: string, 
    amountA: string, 
    amountB: string, 
    agentId?: string
  ): Promise<string> {
    const vault = this.vaults.get(vaultId)
    if (!vault || vault.type !== 'defi') {
      throw new Error('Invalid vault for DeFi operations')
    }

    const wallets = this.testnetDeFiService?.getAllWallets()
    const vaultWallet = wallets.find(w => w.id.includes(vaultId))
    
    if (!vaultWallet) {
      throw new Error('DeFi wallet not found for vault')
    }

    try {
      const position = await this.testnetDeFiService?.provideLiquidity(
        vaultWallet.id, protocol, tokenA, tokenB, amountA, amountB
      )
      
      const txId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const transaction: VaultTransaction = {
        id: txId,
        vaultId,
        agentId,
        type: 'stake', // Liquidity provision is a type of staking
        asset: `${tokenA}/${tokenB}`,
        amount: `${amountA}+${amountB}`,
        usdValue: position.usdValue,
        fee: '0.002', // Mock fee
        gasUsed: '80000',
        status: 'confirmed',
        timestamp: Date.now(),
        requiresApproval: false,
        approvedBy: [],
        approvalStatus: 'approved',
        notes: `Liquidity provided to ${protocol} - Position ID: ${position.id}`
      }

      if (!this.vaultTransactions.has(vaultId)) {
        this.vaultTransactions.set(vaultId, [])
      }
      this.vaultTransactions.get(vaultId)!.push(transaction)

      await this.updateVaultAssets(vaultId)

      this.persistData()
      this.emit('liquidityProvided', { vaultId, transaction, position })
      
      return txId
    } catch (error) {
      throw new Error(`Liquidity provision failed: ${error}`)
    }
  }

  // Auto-management features
  async enableAutoCompound(vaultId: string): Promise<boolean> {
    const vault = this.vaults.get(vaultId)
    if (!vault) return false

    vault.autoCompound = true
    vault.updatedAt = Date.now()

    this.persistData()
    this.emit('autoCompoundEnabled', { vaultId })
    
    return true
  }

  async rebalanceVault(vaultId: string): Promise<boolean> {
    const vault = this.vaults.get(vaultId)
    if (!vault) return false

    const assets = this.vaultAssets.get(vaultId) || []
    const totalValue = assets.reduce((sum, asset) => sum + asset.usdValue, 0)

    // Simple rebalancing logic - equal allocation
    const targetAllocation = 100 / assets.length
    const threshold = vault.rebalanceThreshold || 5 // 5% threshold

    let rebalanceNeeded = false
    const rebalanceActions: any[] = []

    for (const asset of assets) {
      const currentAllocation = (asset.usdValue / totalValue) * 100
      const deviation = Math.abs(currentAllocation - targetAllocation)

      if (deviation > threshold) {
        rebalanceNeeded = true
        rebalanceActions.push({
          asset: asset.symbol,
          currentAllocation,
          targetAllocation,
          action: currentAllocation > targetAllocation ? 'sell' : 'buy',
          amount: Math.abs(currentAllocation - targetAllocation) * totalValue / 100
        })
      }
    }

    if (rebalanceNeeded) {
      // Execute rebalancing (mock implementation)
      for (const action of rebalanceActions) {
        console.log(`Rebalancing ${vaultId}: ${action.action} ${action.amount} USD of ${action.asset}`)
      }

      this.emit('vaultRebalanced', { vaultId, actions: rebalanceActions })
      return true
    }

    return false
  }

  // Analytics and Reporting
  getVaultStats(vaultId: string): VaultStats | null {
    const vault = this.vaults.get(vaultId)
    const assets = this.vaultAssets.get(vaultId) || []
    const transactions = this.vaultTransactions.get(vaultId) || []

    if (!vault) return null

    const totalValue = assets.reduce((sum, asset) => sum + asset.usdValue, 0)
    const dailyVolume = transactions
      .filter(tx => tx.timestamp > Date.now() - 24 * 60 * 60 * 1000)
      .reduce((sum, tx) => sum + tx.usdValue, 0)

    const totalYield = assets.reduce((sum, asset) => sum + parseFloat(asset.stakingRewards || '0'), 0)
    const avgApy = assets.length > 0 ? assets.reduce((sum, asset) => sum + asset.apy, 0) / assets.length : 0

    // Calculate agent allocations
    const agentAllocations: Record<string, number> = {}
    vault.authorizedAgents.forEach(agentId => {
      agentAllocations[agentId] = totalValue * vault.maxAllocation // Simplified calculation
    })

    // Calculate asset distribution
    const assetDistribution: Record<string, number> = {}
    assets.forEach(asset => {
      assetDistribution[asset.symbol] = asset.allocation
    })

    return {
      totalValue,
      totalAssets: assets.length,
      dailyVolume,
      totalYield,
      apy: avgApy,
      sharpeRatio: 1.2, // Mock calculation
      maxDrawdown: 0.05, // Mock calculation
      agentAllocations,
      assetDistribution,
      performance24h: 0.02, // Mock 2% daily performance
      performance7d: 0.12, // Mock 12% weekly performance
      performance30d: 0.45, // Mock 45% monthly performance
      performance1y: 2.1 // Mock 210% yearly performance
    }
  }

  getAllVaults(): VaultConfig[] {
    return Array.from(this.vaults.values())
  }

  getVault(vaultId: string): VaultConfig | null {
    return this.vaults.get(vaultId) || null
  }

  getVaultAssets(vaultId: string): VaultAsset[] {
    return this.vaultAssets.get(vaultId) || []
  }

  getVaultTransactions(vaultId: string): VaultTransaction[] {
    return this.vaultTransactions.get(vaultId) || []
  }

  getVaultAlerts(vaultId: string): VaultAlert[] {
    return this.vaultAlerts.get(vaultId) || []
  }

  // Private helper methods
  private async createDeFiWallets(vaultId: string, network: string): Promise<void> {
    try {
      const wallet = await this.testnetDeFiService?.createTestnetWallet(network)
      // Associate wallet with vault (simplified - store vaultId in wallet metadata)
      console.log(`Created DeFi wallet ${wallet.id} for vault ${vaultId}`)
    } catch (error) {
      console.error('Failed to create DeFi wallet:', error)
    }
  }

  private async calculateUSDValue(asset: string, amount: string): Promise<number> {
    // Mock price calculation - in real implementation, fetch from price oracle
    const mockPrices: Record<string, number> = {
      'ETH': 3000,
      'BTC': 45000,
      'USDC': 1,
      'DAI': 1,
      'SOL': 100,
      'MATIC': 1.5
    }

    const price = mockPrices[asset] || 1
    return parseFloat(amount) * price
  }

  private getTodayWithdrawals(vaultId: string, agentId?: string): number {
    const transactions = this.vaultTransactions.get(vaultId) || []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return transactions
      .filter(tx => 
        tx.type === 'withdraw' && 
        tx.timestamp >= today.getTime() &&
        (!agentId || tx.agentId === agentId)
      )
      .reduce((sum, tx) => sum + tx.usdValue, 0)
  }

  private async processDeposit(vaultId: string, transaction: VaultTransaction): Promise<void> {
    // Update vault assets
    const assets = this.vaultAssets.get(vaultId) || []
    const existingAsset = assets.find(a => a.symbol === transaction.asset)

    if (existingAsset) {
      existingAsset.balance = (parseFloat(existingAsset.balance) + parseFloat(transaction.amount)).toString()
      existingAsset.availableAmount = existingAsset.balance
      existingAsset.usdValue += transaction.usdValue
    } else {
      const newAsset: VaultAsset = {
        symbol: transaction.asset,
        name: transaction.asset,
        address: '0x...',
        decimals: 18,
        balance: transaction.amount,
        usdValue: transaction.usdValue,
        allocation: 0,
        lockedAmount: '0',
        availableAmount: transaction.amount,
        apy: 0,
        stakingRewards: '0',
        liquidityRewards: '0',
        volatility: 0.1,
        riskScore: 5,
        correlationScore: 0.5
      }
      assets.push(newAsset)
    }

    this.vaultAssets.set(vaultId, assets)
    transaction.status = 'confirmed'
  }

  private async processWithdrawal(vaultId: string, transaction: VaultTransaction): Promise<void> {
    const assets = this.vaultAssets.get(vaultId) || []
    const assetIndex = assets.findIndex(a => a.symbol === transaction.asset)

    if (assetIndex !== -1) {
      const asset = assets[assetIndex]
      asset.balance = (parseFloat(asset.balance) - parseFloat(transaction.amount)).toString()
      asset.availableAmount = asset.balance
      asset.usdValue -= transaction.usdValue

      if (parseFloat(asset.balance) <= 0) {
        assets.splice(assetIndex, 1)
      }
    }

    this.vaultAssets.set(vaultId, assets)
    transaction.status = 'confirmed'
  }

  private async updateVaultAssets(vaultId: string): Promise<void> {
    // Sync with DeFi service to get latest balances
    const vault = this.vaults.get(vaultId)
    if (!vault || vault.type !== 'defi') return

    const wallets = this.testnetDeFiService?.getAllWallets()
    const vaultWallet = wallets.find(w => w.id.includes(vaultId))
    
    if (vaultWallet) {
      const balances = await this.testnetDeFiService?.getWalletBalance(vaultWallet.id)
      const assets: VaultAsset[] = balances.map(balance => ({
        symbol: balance.symbol,
        name: balance.symbol,
        address: balance.address,
        decimals: balance.decimals,
        balance: balance.balance,
        usdValue: balance.usdValue,
        allocation: 0, // Calculate based on total portfolio
        lockedAmount: '0',
        availableAmount: balance.balance,
        apy: Math.random() * 10, // Mock APY
        stakingRewards: '0',
        liquidityRewards: '0',
        volatility: Math.random() * 0.3,
        riskScore: Math.floor(Math.random() * 10) + 1,
        correlationScore: Math.random()
      }))

      this.vaultAssets.set(vaultId, assets)
    }
  }

  private setupEventListeners(): void {
    // Listen to agent persistence service events
    this.agentPersistenceService?.on('agentCreated', (data) => {
      this.handleAgentCreated(data.agentId, data.agent)
    })

    this.agentPersistenceService?.on('agentDeleted', (data) => {
      this.handleAgentDeleted(data.agentId)
    })
  }

  private handleAgentCreated(agentId: string, agent: any): void {
    // Auto-create vault for agent if needed
    if (agent.config.enableDeFi && agent.walletIds.length === 0) {
      this.createDefaultVaultForAgent(agentId, agent.config)
    }
  }

  private handleAgentDeleted(agentId: string): void {
    // Remove agent from all vault permissions
    for (const vault of this.vaults.values()) {
      const index = vault.authorizedAgents.indexOf(agentId)
      if (index !== -1) {
        vault.authorizedAgents.splice(index, 1)
        vault.updatedAt = Date.now()
      }
    }
    
    this.agentWalletMappings.delete(agentId)
    this.persistData()
  }

  private async createDefaultVaultForAgent(agentId: string, agentConfig: any): Promise<void> {
    try {
      const vaultId = await this.createVault({
        name: `${agentConfig.name} Vault`,
        description: `Auto-created vault for agent ${agentConfig.name}`,
        type: 'defi',
        network: 'sepolia',
        requireApproval: false,
        approvalThreshold: 1,
        multiSigRequired: false,
        timelock: 0,
        authorizedAgents: [agentId],
        authorizedUsers: [],
        permissions: {
          read: [agentId],
          withdraw: [agentId],
          deposit: [agentId],
          trade: [agentId],
          defi: [agentId]
        },
        maxAllocation: agentConfig.maxPositionSize || 0.2,
        maxDailyWithdrawal: agentConfig.initialCapital * 0.1, // 10% of initial capital
        emergencyFreezeEnabled: true,
        autoRebalance: agentConfig.autoRebalance || false,
        rebalanceThreshold: 5,
        autoCompound: agentConfig.autoCompound || false,
        yieldFarming: agentConfig.liquidityMining || false
      })

      await this.assignVaultToAgent(agentId, vaultId)
      console.log(`Created default vault ${vaultId} for agent ${agentId}`)
    } catch (error) {
      console.error('Failed to create default vault for agent:', error)
    }
  }

  private startMonitoring(): void {
    // Monitor vault health and generate alerts
    setInterval(() => {
      this.monitorVaults()
    }, 60000) // Every minute

    // Auto-compound check
    setInterval(() => {
      this.processAutoCompound()
    }, 3600000) // Every hour

    // Rebalance check
    setInterval(() => {
      this.processAutoRebalance()
    }, 21600000) // Every 6 hours
  }

  private async monitorVaults(): Promise<void> {
    for (const vault of this.vaults.values()) {
      // Check vault health
      const stats = this.getVaultStats(vault.id)
      if (!stats) continue

      // Generate alerts based on performance and risk
      if (stats.performance24h < -0.1) { // -10% daily loss
        this.createAlert(vault.id, {
          type: 'performance',
          severity: 'high',
          title: 'High Daily Loss',
          message: `Vault has lost ${(stats.performance24h * 100).toFixed(2)}% in the last 24 hours`
        })
      }

      if (stats.totalValue < 1000) { // Low balance
        this.createAlert(vault.id, {
          type: 'balance',
          severity: 'medium',
          title: 'Low Vault Balance',
          message: `Vault balance is below $1,000 threshold`
        })
      }
    }
  }

  private async processAutoCompound(): Promise<void> {
    for (const vault of this.vaults.values()) {
      if (!vault.autoCompound) continue

      // Check for pending rewards to compound
      const assets = this.vaultAssets.get(vault.id) || []
      for (const asset of assets) {
        if (parseFloat(asset.stakingRewards) > 0) {
          // Compound the rewards (mock implementation)
          console.log(`Auto-compounding ${asset.stakingRewards} ${asset.symbol} for vault ${vault.id}`)
          
          // Reset rewards after compounding
          asset.stakingRewards = '0'
          asset.balance = (parseFloat(asset.balance) + parseFloat(asset.stakingRewards)).toString()
        }
      }
    }
  }

  private async processAutoRebalance(): Promise<void> {
    for (const vault of this.vaults.values()) {
      if (!vault.autoRebalance) continue
      await this.rebalanceVault(vault.id)
    }
  }

  private createAlert(vaultId: string, alertData: Omit<VaultAlert, 'id' | 'vaultId' | 'timestamp' | 'acknowledged'>): void {
    const alert: VaultAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      vaultId,
      timestamp: Date.now(),
      acknowledged: false,
      ...alertData
    }

    if (!this.vaultAlerts.has(vaultId)) {
      this.vaultAlerts.set(vaultId, [])
    }
    this.vaultAlerts.get(vaultId)!.push(alert)

    this.emit('alertCreated', { vaultId, alert })
  }

  private persistData(): void {
    try {
      const data = {
        vaults: Object.fromEntries(this.vaults),
        vaultAssets: Object.fromEntries(this.vaultAssets),
        vaultTransactions: Object.fromEntries(this.vaultTransactions),
        vaultAlerts: Object.fromEntries(this.vaultAlerts),
        agentWalletMappings: Object.fromEntries(this.agentWalletMappings),
        version: '1.0.0',
        lastUpdate: Date.now()
      }
      localStorage.setItem('vault_integration_service', JSON.stringify(data))
    } catch (error) {
      console.error('Failed to persist vault data:', error)
    }
  }

  private loadPersistedData(): void {
    try {
      const stored = localStorage.getItem('vault_integration_service')
      if (stored) {
        const data = JSON.parse(stored)
        
        if (data.vaults) {
          this.vaults = new Map(Object.entries(data.vaults))
        }
        
        if (data.vaultAssets) {
          this.vaultAssets = new Map(Object.entries(data.vaultAssets))
        }
        
        if (data.vaultTransactions) {
          this.vaultTransactions = new Map(Object.entries(data.vaultTransactions))
        }
        
        if (data.vaultAlerts) {
          this.vaultAlerts = new Map(Object.entries(data.vaultAlerts))
        }
        
        if (data.agentWalletMappings) {
          this.agentWalletMappings = new Map(Object.entries(data.agentWalletMappings))
        }
        
        console.log('Loaded vault integration data')
      }
    } catch (error) {
      console.error('Failed to load vault integration data:', error)
    }
  }
}

// Export lazy singleton to prevent circular dependencies
let _vaultIntegrationService: VaultIntegrationService | null = null

export function getVaultIntegrationService(): VaultIntegrationService {
  if (!_vaultIntegrationService) {
    _vaultIntegrationService = new VaultIntegrationService()
  }
  return _vaultIntegrationService
}

// Keep the old export for backward compatibility but make it lazy
// Using a function instead of Proxy to prevent circular dependency issues
export const vaultIntegrationService = {
  get: () => getVaultIntegrationService()
}

export default VaultIntegrationService