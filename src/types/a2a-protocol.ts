/**
 * A2A (Agent-to-Agent) Protocol Types
 * Based on Google's A2A Project specification for agent interoperability
 * https://a2aproject.github.io/A2A/latest/
 */

// Core A2A Message Structure
export interface A2AMessage {
  id: string
  sender: string
  receiver: string | 'broadcast'
  type: A2AMessageType
  payload: any
  timestamp: string
  priority: A2APriority
  security: A2ASecurityLevel
  signature?: string
  metadata: A2AMessageMetadata
}

export type A2AMessageType = 
  | 'direct'           // Direct agent-to-agent communication
  | 'broadcast'        // Broadcast to all agents
  | 'consensus'        // Consensus building message
  | 'negotiation'      // Contract negotiation
  | 'coordination'     // Task coordination
  | 'discovery'        // Agent discovery
  | 'handshake'        // Initial connection
  | 'heartbeat'        // Keep-alive message
  | 'error'            // Error handling
  | 'ack'              // Acknowledgment

export type A2APriority = 'low' | 'medium' | 'high' | 'critical'

export type A2ASecurityLevel = 'none' | 'basic' | 'advanced' | 'enterprise'

export interface A2AMessageMetadata {
  version: string
  encoding: string
  compression?: string
  ttl?: number
  correlation_id?: string
  parent_message_id?: string
  routing_path?: string[]
  protocol_version: string
  capabilities?: string[]
}

// A2A Agent Definition
export interface A2AAgent {
  id: string
  name: string
  type: A2AAgentType
  capabilities: A2ACapability[]
  trust_level: number
  communication: A2ACommunicationConfig
  status: A2AAgentStatus
  metadata: A2AAgentMetadata
  interoperability: A2AInteroperabilityConfig
}

export type A2AAgentType = 
  | 'trading'          // Trading specialist
  | 'risk'             // Risk management
  | 'analysis'         // Market analysis
  | 'coordination'     // Multi-agent coordination
  | 'arbitrage'        // Arbitrage specialist
  | 'portfolio'        // Portfolio management
  | 'compliance'       // Regulatory compliance
  | 'execution'        // Order execution
  | 'general'          // General purpose

export interface A2ACapability {
  name: string
  version: string
  description: string
  parameters: { [key: string]: any }
  supported_protocols: string[]
  performance_metrics: {
    latency: number
    throughput: number
    reliability: number
  }
}

export type A2AAgentStatus = 
  | 'active'           // Currently active and available
  | 'inactive'         // Temporarily inactive
  | 'busy'             // Processing requests
  | 'error'            // Error state
  | 'maintenance'      // Under maintenance
  | 'disconnected'     // Not connected to network

export interface A2AAgentMetadata {
  created_at: string
  updated_at: string
  version: string
  environment: string
  resource_usage: {
    cpu: number
    memory: number
    network: number
  }
  performance_stats: {
    messages_sent: number
    messages_received: number
    success_rate: number
    average_response_time: number
  }
}

export interface A2ACommunicationConfig {
  protocols: string[]
  max_message_size: number
  timeout: number
  retry_policy: A2ARetryPolicy
  security_preferences: A2ASecurityPreferences
  rate_limits: A2ARateLimits
}

export interface A2AInteroperabilityConfig {
  supported_standards: string[]
  compatibility_mode: boolean
  bridge_protocols: string[]
  translation_rules: { [key: string]: any }
}

export interface A2ARetryPolicy {
  max_attempts: number
  initial_delay: number
  max_delay: number
  backoff_factor: number
  jitter: boolean
}

export interface A2ASecurityPreferences {
  encryption_required: boolean
  signature_required: boolean
  trusted_agents: string[]
  blacklisted_agents: string[]
  certificate_validation: boolean
}

export interface A2ARateLimits {
  messages_per_minute: number
  bytes_per_minute: number
  burst_limit: number
  cooldown_period: number
}

// A2A Consensus System
export interface A2AConsensusProposal {
  id: string
  proposer: string
  type: A2AConsensusType
  proposal: any
  participants: string[]
  timeout: number
  created_at: string
  metadata: {
    required_votes: number
    consensus_threshold: number
    voting_method: A2AVotingMethod
  }
}

export type A2AConsensusType = 
  | 'simple_majority'  // Simple majority voting
  | 'weighted_voting'  // Weighted based on trust/performance
  | 'unanimous'        // Requires all participants
  | 'quorum'           // Requires minimum participation
  | 'byzantine_ft'     // Byzantine fault tolerance

export type A2AVotingMethod = 
  | 'direct'           // Direct voting
  | 'delegate'         // Delegated voting
  | 'liquid'           // Liquid democracy
  | 'ranked'           // Ranked choice voting

export interface A2AConsensusVote {
  voter: string
  proposal_id: string
  vote: A2AVoteType
  weight: number
  reasoning?: string
  timestamp: string
  signature: string
}

export type A2AVoteType = 'approve' | 'reject' | 'abstain'

export interface A2AConsensusResult {
  proposal_id: string
  status: A2AConsensusStatus
  votes: A2AConsensusVote[]
  result: any
  execution_plan?: A2AExecutionPlan
  timestamp: string
  participants: string[]
  metadata: {
    total_votes: number
    approval_percentage: number
    consensus_reached: boolean
    execution_status: string
  }
}

export type A2AConsensusStatus = 
  | 'pending'          // Voting in progress
  | 'approved'         // Consensus reached, approved
  | 'rejected'         // Consensus reached, rejected
  | 'timeout'          // Voting timeout
  | 'executed'         // Approved and executed
  | 'failed'           // Execution failed

export interface A2AExecutionPlan {
  id: string
  actions: A2AAction[]
  dependencies: string[]
  timeline: A2ATimeline
  rollback_plan?: A2ARollbackPlan
}

export interface A2AAction {
  id: string
  type: string
  agent: string
  parameters: any
  timeout: number
  retry_policy: A2ARetryPolicy
}

export interface A2ATimeline {
  start_time: string
  estimated_duration: number
  checkpoints: A2ACheckpoint[]
}

export interface A2ACheckpoint {
  id: string
  time: string
  condition: string
  action: string
}

export interface A2ARollbackPlan {
  steps: A2ARollbackStep[]
  timeout: number
  recovery_strategy: string
}

export interface A2ARollbackStep {
  id: string
  action: string
  agent: string
  parameters: any
}

// A2A Contract System
export interface A2AContract {
  id: string
  parties: string[]
  terms: A2AContractTerms
  status: A2AContractStatus
  created_at: string
  expires_at?: string
  signatures: A2AContractSignature[]
  execution_history: A2AContractExecution[]
  metadata: {
    contract_type: string
    jurisdiction: string
    version: string
    amendments: number
  }
}

export interface A2AContractTerms {
  obligations: A2AContractObligation[]
  payments: A2AContractPayment[]
  conditions: A2AContractCondition[]
  penalties: A2AContractPenalty[]
  dispute_resolution: A2ADisputeResolution
}

export interface A2AContractObligation {
  party: string
  description: string
  deliverables: string[]
  deadline: string
  dependencies: string[]
}

export interface A2AContractPayment {
  payer: string
  payee: string
  amount: number
  currency: string
  schedule: string
  conditions: string[]
}

export interface A2AContractCondition {
  id: string
  type: 'precondition' | 'postcondition' | 'invariant'
  description: string
  validation_method: string
  parameters: any
}

export interface A2AContractPenalty {
  trigger: string
  penalty_type: 'financial' | 'reputation' | 'suspension'
  amount?: number
  duration?: number
  description: string
}

export interface A2ADisputeResolution {
  method: 'arbitration' | 'mediation' | 'court'
  arbitrator?: string
  jurisdiction: string
  escalation_path: string[]
}

export type A2AContractStatus = 
  | 'draft'            // Being negotiated
  | 'pending'          // Awaiting signatures
  | 'active'           // In effect
  | 'completed'        // Successfully completed
  | 'breached'         // Terms violated
  | 'disputed'         // Under dispute
  | 'terminated'       // Terminated early
  | 'expired'          // Expired

export interface A2AContractSignature {
  party: string
  signature: string
  timestamp: string
  certificate: string
}

export interface A2AContractExecution {
  id: string
  action: string
  executor: string
  timestamp: string
  status: 'success' | 'failure' | 'pending'
  result: any
  evidence: string[]
}

export interface A2AContractResult {
  contract_id: string
  success: boolean
  execution_details: A2AContractExecution[]
  violations: A2AContractViolation[]
  dispute_log: A2ADisputeLog[]
  metadata: {
    completion_percentage: number
    penalty_applied: boolean
    satisfaction_score: number
  }
}

export interface A2AContractViolation {
  id: string
  type: string
  party: string
  description: string
  evidence: string[]
  severity: 'minor' | 'major' | 'critical'
  timestamp: string
}

export interface A2ADisputeLog {
  id: string
  dispute_type: string
  parties: string[]
  status: 'open' | 'resolved' | 'escalated'
  resolution: string
  timestamp: string
}

// A2A Network and Discovery
export interface A2ANetwork {
  id: string
  name: string
  type: A2ANetworkType
  agents: A2AAgent[]
  topology: A2ANetworkTopology
  governance: A2ANetworkGovernance
  security: A2ANetworkSecurity
  metadata: {
    created_at: string
    version: string
    total_agents: number
    active_agents: number
    network_health: number
  }
}

export type A2ANetworkType = 
  | 'mesh'             // Fully connected mesh
  | 'star'             // Star topology with central hub
  | 'ring'             // Ring topology
  | 'hierarchical'     // Hierarchical structure
  | 'federated'        // Federated networks
  | 'hybrid'           // Hybrid topology

export interface A2ANetworkTopology {
  type: A2ANetworkType
  connections: A2AConnection[]
  routing_table: A2ARoutingTable
  load_balancing: A2ALoadBalancing
}

export interface A2AConnection {
  from: string
  to: string
  type: 'direct' | 'relay' | 'bridge'
  quality: number
  latency: number
  bandwidth: number
  reliability: number
}

export interface A2ARoutingTable {
  routes: A2ARoute[]
  default_gateway?: string
  backup_routes: A2ARoute[]
}

export interface A2ARoute {
  destination: string
  next_hop: string
  cost: number
  metric: number
  interface: string
}

export interface A2ALoadBalancing {
  algorithm: 'round_robin' | 'least_connections' | 'weighted' | 'hash'
  weights: { [agent: string]: number }
  health_checks: A2AHealthCheck[]
}

export interface A2AHealthCheck {
  target: string
  interval: number
  timeout: number
  retries: number
  success_threshold: number
  failure_threshold: number
}

export interface A2ANetworkGovernance {
  policies: A2APolicy[]
  roles: A2ARole[]
  permissions: A2APermission[]
  audit_log: A2AAuditEntry[]
}

export interface A2APolicy {
  id: string
  name: string
  description: string
  rules: A2ARule[]
  enforcement: A2AEnforcement
  exceptions: A2AException[]
}

export interface A2ARule {
  id: string
  condition: string
  action: string
  parameters: any
  priority: number
}

export interface A2AEnforcement {
  method: 'automatic' | 'manual' | 'hybrid'
  severity: 'warning' | 'error' | 'critical'
  actions: string[]
}

export interface A2AException {
  id: string
  condition: string
  override: string
  approver: string
  expires_at?: string
}

export interface A2ARole {
  id: string
  name: string
  description: string
  permissions: string[]
  hierarchy_level: number
  assignment_rules: string[]
}

export interface A2APermission {
  id: string
  name: string
  description: string
  resource: string
  actions: string[]
  conditions: string[]
}

export interface A2AAuditEntry {
  id: string
  timestamp: string
  agent: string
  action: string
  resource: string
  result: 'success' | 'failure'
  details: any
}

export interface A2ANetworkSecurity {
  encryption: A2AEncryption
  authentication: A2AAuthentication
  authorization: A2AAuthorization
  monitoring: A2ASecurityMonitoring
}

export interface A2AEncryption {
  algorithm: string
  key_size: number
  key_rotation: boolean
  rotation_interval: number
}

export interface A2AAuthentication {
  methods: string[]
  certificates: A2ACertificate[]
  multi_factor: boolean
  session_timeout: number
}

export interface A2ACertificate {
  id: string
  issuer: string
  subject: string
  valid_from: string
  valid_to: string
  public_key: string
  signature: string
}

export interface A2AAuthorization {
  model: 'rbac' | 'abac' | 'dac'
  policies: A2AAuthPolicy[]
  delegation: boolean
  temporary_grants: A2ATemporaryGrant[]
}

export interface A2AAuthPolicy {
  id: string
  subject: string
  resource: string
  action: string
  condition: string
  effect: 'allow' | 'deny'
}

export interface A2ATemporaryGrant {
  id: string
  grantee: string
  permissions: string[]
  expires_at: string
  granted_by: string
}

export interface A2ASecurityMonitoring {
  intrusion_detection: boolean
  anomaly_detection: boolean
  threat_intelligence: boolean
  incident_response: A2AIncidentResponse
}

export interface A2AIncidentResponse {
  escalation_path: string[]
  response_time: number
  containment_actions: string[]
  recovery_procedures: string[]
}

// A2A Service Responses
export interface A2AResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  metadata: {
    timestamp: string
    duration: number
    agent: string
    correlation_id: string
  }
}

export interface A2AHealthStatus {
  agent: string
  status: A2AAgentStatus
  last_seen: string
  network_connectivity: boolean
  service_availability: boolean
  resource_usage: {
    cpu: number
    memory: number
    network: number
  }
  performance_metrics: {
    latency: number
    throughput: number
    error_rate: number
  }
}

export interface A2ANetworkMetrics {
  total_agents: number
  active_agents: number
  total_messages: number
  messages_per_second: number
  average_latency: number
  network_health: number
  consensus_success_rate: number
  contract_success_rate: number
}

// A2A Event System
export interface A2AEvent {
  id: string
  type: A2AEventType
  source: string
  target?: string
  payload: any
  timestamp: string
  correlation_id?: string
  metadata: {
    version: string
    priority: A2APriority
    ttl?: number
  }
}

export type A2AEventType = 
  | 'agent_joined'
  | 'agent_left'
  | 'message_sent'
  | 'message_received'
  | 'consensus_started'
  | 'consensus_completed'
  | 'contract_created'
  | 'contract_executed'
  | 'error_occurred'
  | 'network_partition'
  | 'network_recovery'
  | 'security_alert'
  | 'performance_alert'

export interface A2AEventSubscription {
  id: string
  subscriber: string
  event_types: A2AEventType[]
  filters: { [key: string]: any }
  callback: string
  created_at: string
  expires_at?: string
}

// A2A Trading-Specific Types
export interface A2ATradingMessage extends A2AMessage {
  trading_data: {
    symbol: string
    action: 'buy' | 'sell' | 'hold'
    quantity: number
    price?: number
    strategy: string
    confidence: number
    risk_level: number
    timeframe: string
    reasoning: string
  }
}

export interface A2ATradingConsensus extends A2AConsensusProposal {
  trading_proposal: {
    type: 'position' | 'strategy' | 'risk_adjustment'
    symbols: string[]
    action: string
    parameters: any
    expected_return: number
    risk_assessment: any
    impact_analysis: any
  }
}

export interface A2ATradingContract extends A2AContract {
  trading_terms: {
    strategy_sharing: boolean
    profit_sharing: number
    risk_limits: any
    execution_rules: any
    performance_benchmarks: any
  }
}

// Export all types for easy importing
export * from './a2a-protocol'