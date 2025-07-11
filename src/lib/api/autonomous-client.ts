/**
 * Autonomous Services API Client
 * Centralized client for all autonomous system API calls
 */

// Health monitoring types
export interface HealthStatus {
  overall_health: string
  services: {
    total: number
    healthy: number
    unhealthy: number
  }
  alerts: {
    active: number
    critical: number
    warning: number
  }
  resources: {
    cpu_percent: number
    memory_percent: number
    memory_available_mb: number
    disk_percent: number
    disk_free_gb: number
  }
  recovery: {
    auto_recovery_enabled: boolean
    total_recovery_attempts: number
    successful_recoveries: number
  }
  monitoring: {
    monitored_services: number
    check_interval_seconds: number
    uptime_seconds: number
  }
}

export interface ServiceStatus {
  service_name: string
  health: string
  uptime_seconds: number
  response_time_ms: number
  error_count: number
  last_error?: string
  metrics: Record<string, any>
  dependencies: string[]
  auto_recovery_enabled: boolean
  restart_count: number
  last_restart?: string
}

export interface SystemAlert {
  alert_id: string
  service_name: string
  severity: string
  message: string
  details: any
  recovery_action?: string
  created_at: string
  resolved_at?: string
  auto_resolved: boolean
}

// Communication types
export interface AgentMessage {
  message_id: string
  conversation_id: string
  from_agent_id: string
  to_agent_id?: string
  message_type: string
  priority: string
  subject: string
  content: string
  metadata: any
  timestamp: string
  read: boolean
  processed: boolean
  response_required: boolean
}

export interface AgentConversation {
  conversation_id: string
  participants: string[]
  topic: string
  status: string
  created_at: string
  updated_at: string
  message_count: number
  last_message_id?: string
}

export interface CommunicationMetrics {
  total_messages: number
  messages_by_type: Record<string, number>
  active_conversations: number
  registered_agents: number
  agent_participation: Record<string, number>
  message_success_rate: number
  recent_activity: {
    last_hour: number
    last_day: number
  }
}

// Consensus types
export interface DecisionContext {
  decision_id: string
  title: string
  description: string
  decision_type: string
  options: Array<{
    id: string
    title: string
    description: string
  }>
  required_agents: string[]
  optional_agents: string[]
  consensus_algorithm: string
  consensus_threshold: number
  timeout_seconds: number
  created_by: string
  created_at: string
  expires_at: string
  status: string
  priority: string
  metadata: any
}

export interface DecisionStatus {
  decision_id: string
  title: string
  status: string
  decision_type: string
  consensus_algorithm: string
  total_votes: number
  required_votes: number
  vote_counts: Record<string, number>
  weighted_votes: Record<string, number>
  participation_rate: number
  voting_agents: string[]
  non_voting_agents: string[]
  time_remaining: number
  created_at: string
  expires_at: string
}

export interface AgentVote {
  vote_id: string
  decision_id: string
  agent_id: string
  vote_type: string
  confidence: number
  reasoning: string
  metadata: any
  timestamp: string
  weight: number
}

// Market regime types
export interface MarketConditions {
  timestamp: string
  volatility_1d: number
  volatility_7d: number
  volatility_30d: number
  trend_strength: number
  momentum: number
  volume_ratio: number
  correlation_breakdown: boolean
  vix_level: number
  economic_indicators: Record<string, number>
  sector_rotation: Record<string, number>
}

export interface RegimeDetection {
  regime_id: string
  primary_regime: string
  secondary_regimes: string[]
  confidence: string
  probability_scores: Record<string, number>
  market_conditions: MarketConditions
  detected_at: string
  expected_duration?: number
  risk_level: number
  recommended_actions: string[]
  metadata: any
}

export interface StrategyAdaptation {
  adaptation_id: string
  target_strategy: string
  current_allocation: number
  recommended_allocation: number
  adaptation_actions: string[]
  risk_adjustment: number
  expected_impact: Record<string, number>
  implementation_priority: number
  rationale: string
  created_at: string
  expires_at?: string
}

export interface RegimeTransition {
  transition_id: string
  from_regime: string
  to_regime: string
  transition_probability: number
  transition_speed: number
  impact_assessment: Record<string, number>
  adaptation_triggers: string[]
  occurred_at: string
}

// Emergency types
export interface EmergencyStatus {
  emergency_mode_active: boolean
  system_halted: boolean
  autonomous_mode_suspended: boolean
  active_emergencies: number
  active_emergency_details: Array<{
    event_id: string
    type: string
    severity: string
    triggered_at: string
    duration_seconds: number
  }>
  circuit_breakers_active: number
  emergency_conditions_monitored: number
  metrics: {
    total_emergencies: number
    emergencies_today: number
    circuit_breaker_triggers: number
    auto_recoveries: number
    manual_interventions: number
    system_downtime_seconds: number
    average_response_time: number
  }
  last_health_check: string
}

export interface EmergencyEvent {
  event_id: string
  emergency_type: string
  severity: string
  trigger_condition: string
  triggered_at: string
  resolved_at?: string
  actions_taken: string[]
  impact_assessment: Record<string, any>
  resolution_notes: string
  auto_resolved: boolean
  metadata: Record<string, any>
}

export interface CircuitBreaker {
  breaker_id: string
  breaker_type: string
  threshold: number
  cooldown_seconds: number
  max_triggers_per_day: number
  enabled: boolean
  last_triggered?: string
  triggers_today: number
  recovery_conditions: string[]
  emergency_actions: string[]
}

export interface EmergencyCondition {
  condition_id: string
  emergency_type: string
  severity: string
  trigger_threshold: number
  current_value: number
  description: string
  enabled: boolean
  last_checked: string
  breach_count: number
}

class AutonomousApiClient {
  private baseUrl: string
  
  constructor(baseUrl: string = '/api/autonomous') {
    this.baseUrl = baseUrl
  }
  
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Request failed')
      }
      
      return result
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
  
  // Health monitoring methods
  async getHealthStatus(): Promise<{ success: boolean; data?: HealthStatus; error?: string }> {
    return this.makeRequest<HealthStatus>('/health?action=status')
  }
  
  async getServiceStatuses(): Promise<{ success: boolean; data?: ServiceStatus[]; error?: string }> {
    return this.makeRequest<ServiceStatus[]>('/health?action=services')
  }
  
  async getSystemAlerts(): Promise<{ success: boolean; data?: SystemAlert[]; error?: string }> {
    return this.makeRequest<SystemAlert[]>('/health?action=alerts')
  }
  
  async restartService(serviceName: string): Promise<{ success: boolean; data?: any; error?: string }> {
    return this.makeRequest('/health', {
      method: 'POST',
      body: JSON.stringify({
        action: 'restart_service',
        service_name: serviceName
      })
    })
  }
  
  async updateServiceConfig(serviceName: string, config: any): Promise<{ success: boolean; data?: any; error?: string }> {
    return this.makeRequest('/health', {
      method: 'POST',
      body: JSON.stringify({
        action: 'update_config',
        service_name: serviceName,
        config
      })
    })
  }
  
  // Communication methods
  async getAgentMessages(agentId?: string): Promise<{ success: boolean; data?: AgentMessage[]; error?: string }> {
    const params = agentId ? `?action=messages&agent_id=${agentId}` : '?action=messages'
    return this.makeRequest<AgentMessage[]>(`/communication${params}`)
  }
  
  async getAgentConversations(agentId?: string): Promise<{ success: boolean; data?: AgentConversation[]; error?: string }> {
    const params = agentId ? `?action=conversations&agent_id=${agentId}` : '?action=conversations'
    return this.makeRequest<AgentConversation[]>(`/communication${params}`)
  }
  
  async getCommunicationMetrics(): Promise<{ success: boolean; data?: CommunicationMetrics; error?: string }> {
    return this.makeRequest<CommunicationMetrics>('/communication?action=metrics')
  }
  
  async sendAgentMessage(
    fromAgentId: string,
    toAgentId: string,
    messageType: string,
    subject: string,
    content: string,
    priority: string = 'medium',
    responseRequired: boolean = false
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    return this.makeRequest('/communication', {
      method: 'POST',
      body: JSON.stringify({
        action: 'send_message',
        from_agent_id: fromAgentId,
        to_agent_id: toAgentId,
        message_type: messageType,
        subject,
        content,
        priority,
        response_required: responseRequired
      })
    })
  }
  
  async markMessageAsRead(messageId: string, agentId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    return this.makeRequest('/communication', {
      method: 'POST',
      body: JSON.stringify({
        action: 'mark_read',
        message_id: messageId,
        agent_id: agentId
      })
    })
  }
  
  async createConversation(agentIds: string[], topic: string): Promise<{ success: boolean; data?: any; error?: string }> {
    return this.makeRequest('/communication', {
      method: 'POST',
      body: JSON.stringify({
        action: 'create_conversation',
        agent_ids: agentIds,
        topic
      })
    })
  }
  
  // Consensus methods
  async getActiveDecisions(): Promise<{ success: boolean; data?: DecisionContext[]; error?: string }> {
    return this.makeRequest<DecisionContext[]>('/consensus?action=decisions')
  }
  
  async getDecisionStatus(decisionId: string): Promise<{ success: boolean; data?: DecisionStatus; error?: string }> {
    return this.makeRequest<DecisionStatus>(`/consensus?action=status&decision_id=${decisionId}`)
  }
  
  async getDecisionVotes(decisionId: string): Promise<{ success: boolean; data?: AgentVote[]; error?: string }> {
    return this.makeRequest<AgentVote[]>(`/consensus?action=votes&decision_id=${decisionId}`)
  }
  
  async createDecision(
    title: string,
    description: string,
    decisionType: string,
    options: Array<{ id: string; title: string; description: string }>,
    requiredAgents: string[],
    consensusAlgorithm: string,
    timeoutSeconds: number
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    return this.makeRequest('/consensus', {
      method: 'POST',
      body: JSON.stringify({
        action: 'create_decision',
        title,
        description,
        decision_type: decisionType,
        options,
        required_agents: requiredAgents,
        consensus_algorithm: consensusAlgorithm,
        timeout_seconds: timeoutSeconds
      })
    })
  }
  
  async castVote(
    decisionId: string,
    agentId: string,
    voteType: string,
    confidence: number,
    reasoning: string
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    return this.makeRequest('/consensus', {
      method: 'POST',
      body: JSON.stringify({
        action: 'cast_vote',
        decision_id: decisionId,
        agent_id: agentId,
        vote_type: voteType,
        confidence,
        reasoning
      })
    })
  }
  
  async resolveDecision(
    decisionId: string,
    finalDecision: string,
    resolutionNotes: string
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    return this.makeRequest('/consensus', {
      method: 'POST',
      body: JSON.stringify({
        action: 'resolve_decision',
        decision_id: decisionId,
        final_decision: finalDecision,
        resolution_notes: resolutionNotes
      })
    })
  }
  
  // Market regime methods
  async getCurrentRegime(): Promise<{ success: boolean; data?: RegimeDetection; error?: string }> {
    return this.makeRequest<RegimeDetection>('/market-regime?action=current')
  }
  
  async getRegimeHistory(limit: number = 10): Promise<{ success: boolean; data?: RegimeDetection[]; error?: string }> {
    return this.makeRequest<RegimeDetection[]>(`/market-regime?action=history&limit=${limit}`)
  }
  
  async getStrategyAdaptations(): Promise<{ success: boolean; data?: StrategyAdaptation[]; error?: string }> {
    return this.makeRequest<StrategyAdaptation[]>('/market-regime?action=adaptations')
  }
  
  async getRegimeTransitions(): Promise<{ success: boolean; data?: RegimeTransition[]; error?: string }> {
    return this.makeRequest<RegimeTransition[]>('/market-regime?action=transitions')
  }
  
  async getRegimeStatus(): Promise<{ success: boolean; data?: any; error?: string }> {
    return this.makeRequest('/market-regime?action=status')
  }
  
  async analyzeMarketConditions(marketData: any): Promise<{ success: boolean; data?: any; error?: string }> {
    return this.makeRequest('/market-regime', {
      method: 'POST',
      body: JSON.stringify({
        action: 'analyze_conditions',
        market_data: marketData
      })
    })
  }
  
  async triggerStrategyAdaptation(
    strategyName: string,
    newAllocation: number,
    rationale: string
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    return this.makeRequest('/market-regime', {
      method: 'POST',
      body: JSON.stringify({
        action: 'trigger_adaptation',
        strategy_name: strategyName,
        new_allocation: newAllocation,
        rationale
      })
    })
  }
  
  // Emergency methods
  async getEmergencyStatus(): Promise<{ success: boolean; data?: EmergencyStatus; error?: string }> {
    return this.makeRequest<EmergencyStatus>('/emergency?action=status')
  }
  
  async getEmergencyHistory(limit: number = 10): Promise<{ success: boolean; data?: EmergencyEvent[]; error?: string }> {
    return this.makeRequest<EmergencyEvent[]>(`/emergency?action=history&limit=${limit}`)
  }
  
  async getCircuitBreakers(): Promise<{ success: boolean; data?: CircuitBreaker[]; error?: string }> {
    return this.makeRequest<CircuitBreaker[]>('/emergency?action=circuit_breakers')
  }
  
  async getEmergencyConditions(): Promise<{ success: boolean; data?: EmergencyCondition[]; error?: string }> {
    return this.makeRequest<EmergencyCondition[]>('/emergency?action=conditions')
  }
  
  async triggerEmergency(
    emergencyType: string,
    severity: string,
    triggerCondition: string,
    metadata?: any
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    return this.makeRequest('/emergency', {
      method: 'POST',
      body: JSON.stringify({
        action: 'trigger_emergency',
        emergency_type: emergencyType,
        severity,
        trigger_condition: triggerCondition,
        metadata
      })
    })
  }
  
  async resolveEmergency(
    eventId: string,
    resolutionNotes: string
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    return this.makeRequest('/emergency', {
      method: 'POST',
      body: JSON.stringify({
        action: 'resolve_emergency',
        event_id: eventId,
        resolution_notes: resolutionNotes
      })
    })
  }
  
  async haltSystem(reason: string): Promise<{ success: boolean; data?: any; error?: string }> {
    return this.makeRequest('/emergency', {
      method: 'POST',
      body: JSON.stringify({
        action: 'halt_system',
        reason
      })
    })
  }
  
  async resumeSystem(reason: string): Promise<{ success: boolean; data?: any; error?: string }> {
    return this.makeRequest('/emergency', {
      method: 'POST',
      body: JSON.stringify({
        action: 'resume_system',
        resume_reason: reason
      })
    })
  }
  
  async activateCircuitBreaker(
    breakerType: string,
    currentValue: number,
    metadata?: any
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    return this.makeRequest('/emergency', {
      method: 'POST',
      body: JSON.stringify({
        action: 'activate_circuit_breaker',
        breaker_type: breakerType,
        current_value: currentValue,
        breaker_metadata: metadata
      })
    })
  }
  
  async updateCircuitBreaker(
    breakerId: string,
    enabled: boolean,
    threshold?: number,
    cooldownSeconds?: number
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    return this.makeRequest('/emergency', {
      method: 'POST',
      body: JSON.stringify({
        action: 'update_circuit_breaker',
        breaker_id: breakerId,
        enabled,
        threshold,
        cooldown_seconds: cooldownSeconds
      })
    })
  }
  
  async backupSystemState(): Promise<{ success: boolean; data?: any; error?: string }> {
    return this.makeRequest('/emergency', {
      method: 'POST',
      body: JSON.stringify({
        action: 'backup_state'
      })
    })
  }
}

// Export singleton instance
export const autonomousApi = new AutonomousApiClient()

// Export types for external use
export type {
  HealthStatus,
  ServiceStatus,
  SystemAlert,
  AgentMessage,
  AgentConversation,
  CommunicationMetrics,
  DecisionContext,
  DecisionStatus,
  AgentVote,
  MarketConditions,
  RegimeDetection,
  StrategyAdaptation,
  RegimeTransition,
  EmergencyStatus,
  EmergencyEvent,
  CircuitBreaker,
  EmergencyCondition
}