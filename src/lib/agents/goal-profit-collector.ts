'use client'

import { EventEmitter } from 'events'
import GoalsService, { Goal } from '../goals/goals-service'
import { bankMasterAgent } from './bank-master-agent'
import { enhancedAlchemyService } from '../blockchain/enhanced-alchemy-service'
import { masterWalletManager } from '../blockchain/master-wallet-manager'

export interface GoalProfitMapping {
  goalId: string
  goalName: string
  goalType: string
  completedAt: Date
  profitAmount: number
  profitToken: string
  profitChain: string
  sourceAgentId?: string
  sourceFarmId?: string
  collectionStatus: 'pending' | 'collecting' | 'completed' | 'failed'
  collectionTxHash?: string
  collectionTimestamp?: Date
  vaultAddress: string
  collectionReason: string
}

export interface ProfitCollectionRule {
  id: string
  name: string
  goalType: string
  triggerCondition: 'immediate' | 'threshold' | 'percentage' | 'time_based'
  triggerValue?: number
  collectionPercentage: number // What percentage of profits to collect
  preferredChain: string
  isActive: boolean
  priority: number
  createdAt: Date
  updatedAt: Date
}

export interface ProfitCollectionEvent {
  id: string
  type: 'goal_completed' | 'threshold_reached' | 'manual_trigger' | 'emergency_collection'
  goalId: string
  goalName: string
  profitAmount: number
  collectionAmount: number
  timestamp: Date
  success: boolean
  error?: string
  executionTime: number
}

class GoalProfitCollector extends EventEmitter {
  private goalMappings: Map<string, GoalProfitMapping> = new Map()
  private collectionRules: Map<string, ProfitCollectionRule> = new Map()
  private collectionEvents: Map<string, ProfitCollectionEvent> = new Map()
  private monitoringInterval?: NodeJS.Timeout
  private isActive = false
  private readonly STORAGE_KEY = 'goal_profit_collector'

  constructor() {
    super()
    this.initializeCollector()
  }

  private async initializeCollector() {
    try {
      this.loadFromStorage()
      this.setupDefaultCollectionRules()
      this.setupEventListeners()
      
      console.log('🎯 Goal Profit Collector initialized')
    } catch (error) {
      console.error('Failed to initialize Goal Profit Collector:', error)
    }
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (stored) {
        const data = JSON.parse(stored)
        
        // Restore mappings
        data.mappings?.forEach((mapping: any) => {
          mapping.completedAt = new Date(mapping.completedAt)
          mapping.collectionTimestamp = mapping.collectionTimestamp ? new Date(mapping.collectionTimestamp) : undefined
          this.goalMappings.set(mapping.goalId, mapping)
        })
        
        // Restore rules
        data.rules?.forEach((rule: any) => {
          rule.createdAt = new Date(rule.createdAt)
          rule.updatedAt = new Date(rule.updatedAt)
          this.collectionRules.set(rule.id, rule)
        })
        
        // Restore events
        data.events?.forEach((event: any) => {
          event.timestamp = new Date(event.timestamp)
          this.collectionEvents.set(event.id, event)
        })
      }
    } catch (error) {
      console.error('Error loading Goal Profit Collector data:', error)
    }
  }

  private saveToStorage() {
    try {
      const data = {
        mappings: Array.from(this.goalMappings.values()),
        rules: Array.from(this.collectionRules.values()),
        events: Array.from(this.collectionEvents.values())
      }
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data))
    } catch (error) {
      console.error('Error saving Goal Profit Collector data:', error)
    }
  }

  private setupDefaultCollectionRules() {
    const defaultRules: ProfitCollectionRule[] = [
      {
        id: 'profit_goal_immediate',
        name: 'Immediate Profit Collection',
        goalType: 'profit',
        triggerCondition: 'immediate',
        collectionPercentage: 100,
        preferredChain: 'ethereum',
        isActive: true,
        priority: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'trading_goal_threshold',
        name: 'Trading Goal Threshold Collection',
        goalType: 'trades',
        triggerCondition: 'threshold',
        triggerValue: 100,
        collectionPercentage: 75,
        preferredChain: 'arbitrum',
        isActive: true,
        priority: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'winrate_goal_percentage',
        name: 'Win Rate Goal Percentage Collection',
        goalType: 'winRate',
        triggerCondition: 'percentage',
        triggerValue: 85,
        collectionPercentage: 50,
        preferredChain: 'base',
        isActive: true,
        priority: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'farm_goal_performance',
        name: 'Farm Performance Collection',
        goalType: 'farm',
        triggerCondition: 'immediate',
        collectionPercentage: 80,
        preferredChain: 'sonic',
        isActive: true,
        priority: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    defaultRules.forEach(rule => {
      if (!this.collectionRules.has(rule.id)) {
        this.collectionRules.set(rule.id, rule)
      }
    })

    this.saveToStorage()
  }

  private setupEventListeners() {
    // Listen for goal status changes
    const goalsService = GoalsService.getInstance()
    
    // Monitor goal completions
    goalsService.subscribe(() => {
      this.checkForGoalCompletions()
    })

    // Listen for Bank Master events
    bankMasterAgent.on('profitCollected', this.handleProfitCollected.bind(this))
    bankMasterAgent.on('profitCollectionFailed', this.handleProfitCollectionFailed.bind(this))
  }

  async activate(): Promise<boolean> {
    try {
      if (this.isActive) return true

      this.isActive = true
      this.startMonitoring()
      
      // Perform initial goal analysis
      await this.analyzeExistingGoals()
      
      this.emit('activated')
      console.log('🚀 Goal Profit Collector activated')
      
      return true
    } catch (error) {
      console.error('Failed to activate Goal Profit Collector:', error)
      this.isActive = false
      return false
    }
  }

  async deactivate(): Promise<boolean> {
    try {
      this.isActive = false
      
      if (this.monitoringInterval) {
        clearInterval(this.monitoringInterval)
      }
      
      this.emit('deactivated')
      console.log('⏹️ Goal Profit Collector deactivated')
      
      return true
    } catch (error) {
      console.error('Failed to deactivate Goal Profit Collector:', error)
      return false
    }
  }

  private startMonitoring() {
    this.monitoringInterval = setInterval(async () => {
      await this.performMonitoringCycle()
    }, 15000) // Check every 15 seconds
  }

  private async performMonitoringCycle() {
    try {
      if (!this.isActive) return

      // Check for new goal completions
      await this.checkForGoalCompletions()
      
      // Check for threshold-based triggers
      await this.checkThresholdTriggers()
      
      // Process pending collections
      await this.processPendingCollections()
      
      this.emit('monitoringCycleCompleted')
    } catch (error) {
      console.error('Error in monitoring cycle:', error)
    }
  }

  private async analyzeExistingGoals() {
    try {
      const goals = GoalsService.getInstance().getAllGoals()
      
      for (const goal of goals) {
        if (goal.status === 'completed' && !this.goalMappings.has(goal.id)) {
          await this.processGoalCompletion(goal)
        }
      }
    } catch (error) {
      console.error('Error analyzing existing goals:', error)
    }
  }

  private async checkForGoalCompletions() {
    try {
      const goals = GoalsService.getInstance().getAllGoals()
      const completedGoals = goals.filter(g => g.status === 'completed')
      
      for (const goal of completedGoals) {
        if (!this.goalMappings.has(goal.id)) {
          await this.processGoalCompletion(goal)
        }
      }
    } catch (error) {
      console.error('Error checking goal completions:', error)
    }
  }

  private async processGoalCompletion(goal: Goal) {
    try {
      const rule = this.findApplicableRule(goal)
      if (!rule) {
        console.log(`No applicable rule found for goal ${goal.name}`)
        return
      }

      const profitAmount = this.calculateProfitAmount(goal)
      const collectionAmount = (profitAmount * rule.collectionPercentage) / 100

      const mapping: GoalProfitMapping = {
        goalId: goal.id,
        goalName: goal.name,
        goalType: goal.type,
        completedAt: new Date(goal.completedAt || Date.now()),
        profitAmount,
        profitToken: 'USDC',
        profitChain: rule.preferredChain,
        sourceAgentId: goal.agentId,
        sourceFarmId: goal.farmId,
        collectionStatus: 'pending',
        vaultAddress: this.getVaultAddress(rule.preferredChain),
        collectionReason: `Goal completion: ${goal.name}`
      }

      this.goalMappings.set(goal.id, mapping)
      
      // Trigger collection based on rule
      if (rule.triggerCondition === 'immediate') {
        await this.triggerProfitCollection(mapping, collectionAmount)
      }
      
      this.saveToStorage()
      this.emit('goalMappingCreated', mapping)
      
      console.log(`🎯 Goal completion mapped: ${goal.name} -> $${profitAmount.toFixed(2)}`)
    } catch (error) {
      console.error('Error processing goal completion:', error)
    }
  }

  private findApplicableRule(goal: Goal): ProfitCollectionRule | null {
    const rules = Array.from(this.collectionRules.values())
      .filter(r => r.isActive && r.goalType === goal.type)
      .sort((a, b) => a.priority - b.priority)
    
    return rules[0] || null
  }

  private calculateProfitAmount(goal: Goal): number {
    // Calculate profit based on goal type and value
    switch (goal.type) {
      case 'profit':
        return goal.current || goal.target || 0
      case 'trades':
        return (goal.current || 0) * 0.1 // $0.10 per trade
      case 'winRate':
        return goal.target * 10 // $10 per percentage point
      case 'farm':
        return goal.target || 100 // Default $100
      default:
        return goal.target || 50 // Default $50
    }
  }

  private getVaultAddress(chain: string): string {
    // Get vault address from Bank Master
    const vaultBalances = bankMasterAgent.getVaultBalances()
    return Object.keys(vaultBalances)[0] || '0x0000000000000000000000000000000000000000'
  }

  private async triggerProfitCollection(mapping: GoalProfitMapping, collectionAmount: number) {
    try {
      mapping.collectionStatus = 'collecting'
      
      const startTime = Date.now()
      
      // Trigger Bank Master to collect profits
      const success = await bankMasterAgent.triggerProfitCollection(
        'goal',
        mapping.goalId,
        mapping.goalName,
        collectionAmount,
        mapping.collectionReason
      )
      
      const executionTime = Date.now() - startTime
      
      const event: ProfitCollectionEvent = {
        id: `event_${Date.now()}`,
        type: 'goal_completed',
        goalId: mapping.goalId,
        goalName: mapping.goalName,
        profitAmount: mapping.profitAmount,
        collectionAmount,
        timestamp: new Date(),
        success,
        executionTime
      }
      
      if (!success) {
        event.error = 'Bank Master collection failed'
        mapping.collectionStatus = 'failed'
      }
      
      this.collectionEvents.set(event.id, event)
      this.saveToStorage()
      
      this.emit('profitCollectionTriggered', { mapping, event })
      console.log(`💰 Profit collection triggered for goal ${mapping.goalName}: $${collectionAmount.toFixed(2)}`)
    } catch (error) {
      console.error('Error triggering profit collection:', error)
      mapping.collectionStatus = 'failed'
    }
  }

  private async checkThresholdTriggers() {
    try {
      const goals = GoalsService.getInstance().getAllGoals()
      
      for (const goal of goals) {
        if (goal.status === 'active') {
          const rule = this.findApplicableRule(goal)
          if (rule && rule.triggerCondition === 'threshold' && rule.triggerValue) {
            
            if (goal.current >= rule.triggerValue) {
              const existingMapping = this.goalMappings.get(goal.id)
              if (!existingMapping) {
                // Create temporary mapping for threshold trigger
                const profitAmount = this.calculateProfitAmount(goal)
                const collectionAmount = (profitAmount * rule.collectionPercentage) / 100
                
                const mapping: GoalProfitMapping = {
                  goalId: goal.id,
                  goalName: goal.name,
                  goalType: goal.type,
                  completedAt: new Date(),
                  profitAmount,
                  profitToken: 'USDC',
                  profitChain: rule.preferredChain,
                  sourceAgentId: goal.agentId,
                  sourceFarmId: goal.farmId,
                  collectionStatus: 'pending',
                  vaultAddress: this.getVaultAddress(rule.preferredChain),
                  collectionReason: `Threshold reached: ${goal.name}`
                }
                
                this.goalMappings.set(goal.id, mapping)
                await this.triggerProfitCollection(mapping, collectionAmount)
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking threshold triggers:', error)
    }
  }

  private async processPendingCollections() {
    try {
      const pendingMappings = Array.from(this.goalMappings.values())
        .filter(m => m.collectionStatus === 'pending')
      
      for (const mapping of pendingMappings) {
        const rule = Array.from(this.collectionRules.values())
          .find(r => r.goalType === mapping.goalType && r.isActive)
        
        if (rule) {
          const collectionAmount = (mapping.profitAmount * rule.collectionPercentage) / 100
          await this.triggerProfitCollection(mapping, collectionAmount)
        }
      }
    } catch (error) {
      console.error('Error processing pending collections:', error)
    }
  }

  // Event handlers
  private handleProfitCollected(data: any) {
    if (data.source === 'goal') {
      const mapping = this.goalMappings.get(data.sourceId)
      if (mapping) {
        mapping.collectionStatus = 'completed'
        mapping.collectionTimestamp = new Date()
        mapping.collectionTxHash = data.txHash
        
        this.saveToStorage()
        this.emit('goalProfitCollected', mapping)
        
        console.log(`✅ Goal profit collected: ${mapping.goalName}`)
      }
    }
  }

  private handleProfitCollectionFailed(data: any) {
    if (data.source === 'goal') {
      const mapping = this.goalMappings.get(data.sourceId)
      if (mapping) {
        mapping.collectionStatus = 'failed'
        
        this.saveToStorage()
        this.emit('goalProfitCollectionFailed', mapping)
        
        console.log(`❌ Goal profit collection failed: ${mapping.goalName}`)
      }
    }
  }

  // Management methods
  async createCollectionRule(rule: Omit<ProfitCollectionRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const ruleId = `rule_${Date.now()}`
    
    const newRule: ProfitCollectionRule = {
      ...rule,
      id: ruleId,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    this.collectionRules.set(ruleId, newRule)
    this.saveToStorage()
    
    this.emit('ruleCreated', newRule)
    return ruleId
  }

  async updateCollectionRule(ruleId: string, updates: Partial<ProfitCollectionRule>): Promise<boolean> {
    const rule = this.collectionRules.get(ruleId)
    if (!rule) return false
    
    Object.assign(rule, updates, { updatedAt: new Date() })
    this.saveToStorage()
    
    this.emit('ruleUpdated', rule)
    return true
  }

  async deleteCollectionRule(ruleId: string): Promise<boolean> {
    const deleted = this.collectionRules.delete(ruleId)
    if (deleted) {
      this.saveToStorage()
      this.emit('ruleDeleted', ruleId)
    }
    return deleted
  }

  async manualTriggerCollection(goalId: string, collectionPercentage: number = 100): Promise<boolean> {
    try {
      const mapping = this.goalMappings.get(goalId)
      if (!mapping) return false
      
      const collectionAmount = (mapping.profitAmount * collectionPercentage) / 100
      await this.triggerProfitCollection(mapping, collectionAmount)
      
      return true
    } catch (error) {
      console.error('Error in manual trigger:', error)
      return false
    }
  }

  async emergencyCollectAll(): Promise<boolean> {
    try {
      const mappings = Array.from(this.goalMappings.values())
        .filter(m => m.collectionStatus === 'pending')
      
      for (const mapping of mappings) {
        await this.triggerProfitCollection(mapping, mapping.profitAmount)
      }
      
      this.emit('emergencyCollectionTriggered')
      return true
    } catch (error) {
      console.error('Error in emergency collection:', error)
      return false
    }
  }

  // Getters
  getGoalMappings(): GoalProfitMapping[] {
    return Array.from(this.goalMappings.values())
  }

  getCollectionRules(): ProfitCollectionRule[] {
    return Array.from(this.collectionRules.values())
  }

  getCollectionEvents(): ProfitCollectionEvent[] {
    return Array.from(this.collectionEvents.values())
  }

  getGoalMapping(goalId: string): GoalProfitMapping | undefined {
    return this.goalMappings.get(goalId)
  }

  getCollectionRule(ruleId: string): ProfitCollectionRule | undefined {
    return this.collectionRules.get(ruleId)
  }

  getCollectionStats() {
    const mappings = Array.from(this.goalMappings.values())
    const events = Array.from(this.collectionEvents.values())
    
    return {
      totalMappings: mappings.length,
      completedCollections: mappings.filter(m => m.collectionStatus === 'completed').length,
      pendingCollections: mappings.filter(m => m.collectionStatus === 'pending').length,
      failedCollections: mappings.filter(m => m.collectionStatus === 'failed').length,
      totalProfitAmount: mappings.reduce((sum, m) => sum + m.profitAmount, 0),
      totalCollectedAmount: events.filter(e => e.success).reduce((sum, e) => sum + e.collectionAmount, 0),
      averageExecutionTime: events.length > 0 ? events.reduce((sum, e) => sum + e.executionTime, 0) / events.length : 0,
      successRate: events.length > 0 ? (events.filter(e => e.success).length / events.length) * 100 : 0
    }
  }

  isActiveStatus(): boolean {
    return this.isActive
  }

  // Cleanup
  destroy() {
    this.deactivate()
    this.removeAllListeners()
  }
}

export const goalProfitCollector = new GoalProfitCollector()
export default goalProfitCollector