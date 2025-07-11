'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Slider } from '@/components/ui/slider'
import {
  CheckCircle, XCircle, Clock, Vote, Users, AlertCircle, 
  TrendingUp, Shield, Zap, Target, Brain, MessageSquare,
  ThumbsUp, ThumbsDown, Minus, Calendar, Timer
} from 'lucide-react'

// Types matching the backend consensus engine
interface DecisionContext {
  decision_id: string
  title: string
  description: string
  decision_type: string
  options: Array<{
    id: string
    title: string
    description: string
    metadata?: any
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

interface AgentVote {
  vote_id: string
  decision_id: string
  agent_id: string
  vote_type: 'approve' | 'reject' | 'abstain' | 'conditional'
  confidence: number
  reasoning: string
  metadata: any
  timestamp: string
  weight: number
}

interface DecisionStatus {
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
  options: any[]
  metadata: any
}

interface Agent {
  id: string
  name: string
  type: string
  reputation: number
  weight: number
}

export default function DecisionVoting() {
  const [activeDecisions, setActiveDecisions] = useState<DecisionContext[]>([])
  const [decisionStatuses, setDecisionStatuses] = useState<Record<string, DecisionStatus>>({})
  const [agents, setAgents] = useState<Agent[]>([])
  const [currentAgent, setCurrentAgent] = useState<string>('marcus_momentum')
  const [selectedDecision, setSelectedDecision] = useState<string | null>(null)
  const [voteType, setVoteType] = useState<string>('approve')
  const [confidence, setConfidence] = useState<number[]>([80])
  const [reasoning, setReasoning] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [votingInProgress, setVotingInProgress] = useState(false)

  // Mock data initialization
  useEffect(() => {
    const mockAgents: Agent[] = [
      {
        id: 'marcus_momentum',
        name: 'Marcus Momentum',
        type: 'Trend Following',
        reputation: 0.85,
        weight: 1.2
      },
      {
        id: 'alex_arbitrage',
        name: 'Alex Arbitrage',
        type: 'Cross-Exchange',
        reputation: 0.92,
        weight: 1.3
      },
      {
        id: 'sophia_reversion',
        name: 'Sophia Reversion',
        type: 'Mean Reversion',
        reputation: 0.78,
        weight: 1.1
      },
      {
        id: 'riley_risk',
        name: 'Riley Risk',
        type: 'Risk Manager',
        reputation: 0.89,
        weight: 1.4
      }
    ]

    const mockDecisions: DecisionContext[] = [
      {
        decision_id: 'decision-001',
        title: 'Implement Kelly Criterion for Position Sizing',
        description: 'Proposal to implement Kelly Criterion for optimal position sizing across all trading strategies. This would replace the current fixed percentage method with a dynamic approach based on win rate and average win/loss ratios.',
        decision_type: 'trading_strategy',
        options: [
          {
            id: 'option-1',
            title: 'Full Implementation',
            description: 'Implement Kelly Criterion with 25% multiplier for all strategies'
          },
          {
            id: 'option-2',
            title: 'Gradual Rollout',
            description: 'Start with momentum strategies, then expand to others'
          },
          {
            id: 'option-3',
            title: 'Reject Proposal',
            description: 'Keep current position sizing method'
          }
        ],
        required_agents: ['marcus_momentum', 'alex_arbitrage', 'sophia_reversion', 'riley_risk'],
        optional_agents: [],
        consensus_algorithm: 'supermajority',
        consensus_threshold: 0.67,
        timeout_seconds: 1800,
        created_by: 'riley_risk',
        created_at: new Date(Date.now() - 600000).toISOString(),
        expires_at: new Date(Date.now() + 1200000).toISOString(),
        status: 'voting',
        priority: 'high',
        metadata: {
          impact: 'high',
          category: 'risk_management',
          estimated_improvement: '15%'
        }
      },
      {
        decision_id: 'decision-002',
        title: 'Emergency: Reduce Portfolio Risk',
        description: 'Market volatility has increased significantly. VaR breached 95% threshold. Immediate action required to reduce portfolio risk by 30%.',
        decision_type: 'emergency_action',
        options: [
          {
            id: 'option-1',
            title: 'Immediate 30% Reduction',
            description: 'Reduce all positions by 30% within next 10 minutes'
          },
          {
            id: 'option-2',
            title: 'Gradual Reduction',
            description: 'Reduce positions by 30% over next 2 hours'
          },
          {
            id: 'option-3',
            title: 'Selective Reduction',
            description: 'Only reduce high-risk positions by 50%'
          }
        ],
        required_agents: ['marcus_momentum', 'alex_arbitrage', 'riley_risk'],
        optional_agents: ['sophia_reversion'],
        consensus_algorithm: 'simple_majority',
        consensus_threshold: 0.5,
        timeout_seconds: 300,
        created_by: 'riley_risk',
        created_at: new Date(Date.now() - 120000).toISOString(),
        expires_at: new Date(Date.now() + 180000).toISOString(),
        status: 'voting',
        priority: 'critical',
        metadata: {
          impact: 'critical',
          category: 'risk_management',
          current_var: '8.9%',
          threshold: '5%'
        }
      },
      {
        decision_id: 'decision-003',
        title: 'Allocate Additional Capital to Arbitrage',
        description: 'Arbitrage opportunities have increased 40% this week. Proposal to allocate additional $50K to arbitrage strategies.',
        decision_type: 'resource_allocation',
        options: [
          {
            id: 'option-1',
            title: 'Allocate $50K',
            description: 'Full requested allocation'
          },
          {
            id: 'option-2',
            title: 'Allocate $25K',
            description: 'Conservative allocation'
          },
          {
            id: 'option-3',
            title: 'No Additional Allocation',
            description: 'Maintain current capital allocation'
          }
        ],
        required_agents: ['alex_arbitrage', 'riley_risk'],
        optional_agents: ['marcus_momentum', 'sophia_reversion'],
        consensus_algorithm: 'weighted_majority',
        consensus_threshold: 0.6,
        timeout_seconds: 900,
        created_by: 'alex_arbitrage',
        created_at: new Date(Date.now() - 300000).toISOString(),
        expires_at: new Date(Date.now() + 600000).toISOString(),
        status: 'voting',
        priority: 'medium',
        metadata: {
          impact: 'medium',
          category: 'resource_allocation',
          current_allocation: '$100K',
          expected_return: '12%'
        }
      }
    ]

    const mockStatuses: Record<string, DecisionStatus> = {
      'decision-001': {
        decision_id: 'decision-001',
        title: 'Implement Kelly Criterion for Position Sizing',
        status: 'voting',
        decision_type: 'trading_strategy',
        consensus_algorithm: 'supermajority',
        total_votes: 2,
        required_votes: 3,
        vote_counts: { approve: 2, reject: 0, abstain: 0, conditional: 0 },
        weighted_votes: { approve: 2.5, reject: 0, abstain: 0, conditional: 0 },
        participation_rate: 0.5,
        voting_agents: ['alex_arbitrage', 'riley_risk'],
        non_voting_agents: ['marcus_momentum', 'sophia_reversion'],
        time_remaining: 1200,
        created_at: new Date(Date.now() - 600000).toISOString(),
        expires_at: new Date(Date.now() + 1200000).toISOString(),
        options: mockDecisions[0].options,
        metadata: mockDecisions[0].metadata
      },
      'decision-002': {
        decision_id: 'decision-002',
        title: 'Emergency: Reduce Portfolio Risk',
        status: 'voting',
        decision_type: 'emergency_action',
        consensus_algorithm: 'simple_majority',
        total_votes: 2,
        required_votes: 2,
        vote_counts: { approve: 1, reject: 0, abstain: 0, conditional: 1 },
        weighted_votes: { approve: 1.2, reject: 0, abstain: 0, conditional: 1.4 },
        participation_rate: 0.67,
        voting_agents: ['marcus_momentum', 'riley_risk'],
        non_voting_agents: ['alex_arbitrage'],
        time_remaining: 180,
        created_at: new Date(Date.now() - 120000).toISOString(),
        expires_at: new Date(Date.now() + 180000).toISOString(),
        options: mockDecisions[1].options,
        metadata: mockDecisions[1].metadata
      },
      'decision-003': {
        decision_id: 'decision-003',
        title: 'Allocate Additional Capital to Arbitrage',
        status: 'voting',
        decision_type: 'resource_allocation',
        consensus_algorithm: 'weighted_majority',
        total_votes: 1,
        required_votes: 2,
        vote_counts: { approve: 1, reject: 0, abstain: 0, conditional: 0 },
        weighted_votes: { approve: 1.4, reject: 0, abstain: 0, conditional: 0 },
        participation_rate: 0.25,
        voting_agents: ['riley_risk'],
        non_voting_agents: ['alex_arbitrage', 'marcus_momentum', 'sophia_reversion'],
        time_remaining: 600,
        created_at: new Date(Date.now() - 300000).toISOString(),
        expires_at: new Date(Date.now() + 600000).toISOString(),
        options: mockDecisions[2].options,
        metadata: mockDecisions[2].metadata
      }
    }

    setAgents(mockAgents)
    setActiveDecisions(mockDecisions)
    setDecisionStatuses(mockStatuses)
    setIsLoading(false)
  }, [])

  // Update time remaining
  useEffect(() => {
    const interval = setInterval(() => {
      setDecisionStatuses(prev => {
        const updated = { ...prev }
        Object.keys(updated).forEach(decisionId => {
          const timeRemaining = Math.max(0, 
            (new Date(updated[decisionId].expires_at).getTime() - Date.now()) / 1000
          )
          updated[decisionId] = {
            ...updated[decisionId],
            time_remaining: timeRemaining
          }
        })
        return updated
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const getDecisionTypeIcon = (type: string) => {
    switch (type) {
      case 'trading_strategy': return <TrendingUp className="h-4 w-4" />
      case 'emergency_action': return <AlertCircle className="h-4 w-4" />
      case 'resource_allocation': return <Target className="h-4 w-4" />
      case 'risk_management': return <Shield className="h-4 w-4" />
      case 'agent_coordination': return <Users className="h-4 w-4" />
      default: return <Vote className="h-4 w-4" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200'
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'medium': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'low': return 'text-gray-600 bg-gray-50 border-gray-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getVoteTypeIcon = (voteType: string) => {
    switch (voteType) {
      case 'approve': return <ThumbsUp className="h-4 w-4 text-green-600" />
      case 'reject': return <ThumbsDown className="h-4 w-4 text-red-600" />
      case 'abstain': return <Minus className="h-4 w-4 text-gray-600" />
      case 'conditional': return <MessageSquare className="h-4 w-4 text-yellow-600" />
      default: return <Vote className="h-4 w-4" />
    }
  }

  const formatTimeRemaining = (seconds: number) => {
    if (seconds < 60) return `${Math.floor(seconds)}s`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.floor(seconds % 60)}s`
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
  }

  const canVote = (decision: DecisionContext) => {
    const status = decisionStatuses[decision.decision_id]
    if (!status) return false
    
    return (
      decision.status === 'voting' &&
      status.time_remaining > 0 &&
      (decision.required_agents.includes(currentAgent) || decision.optional_agents.includes(currentAgent)) &&
      !status.voting_agents.includes(currentAgent)
    )
  }

  const hasVoted = (decision: DecisionContext) => {
    const status = decisionStatuses[decision.decision_id]
    return status?.voting_agents.includes(currentAgent) || false
  }

  const handleVote = async () => {
    if (!selectedDecision || !reasoning.trim()) return

    setVotingInProgress(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Update local state
      setDecisionStatuses(prev => {
        const updated = { ...prev }
        const status = updated[selectedDecision]
        if (status) {
          // Add vote
          status.total_votes += 1
          status.vote_counts[voteType] = (status.vote_counts[voteType] || 0) + 1
          
          // Add to voting agents
          if (!status.voting_agents.includes(currentAgent)) {
            status.voting_agents.push(currentAgent)
            status.non_voting_agents = status.non_voting_agents.filter(a => a !== currentAgent)
          }
          
          // Update participation rate
          const totalAgents = status.voting_agents.length + status.non_voting_agents.length
          status.participation_rate = status.voting_agents.length / totalAgents
        }
        return updated
      })

      // Clear form
      setReasoning('')
      setConfidence([80])
      setSelectedDecision(null)
      
      console.log('Vote cast:', {
        decision_id: selectedDecision,
        agent_id: currentAgent,
        vote_type: voteType,
        confidence: confidence[0],
        reasoning
      })
      
    } catch (error) {
      console.error('Failed to cast vote:', error)
    } finally {
      setVotingInProgress(false)
    }
  }

  const getConsensusProgress = (status: DecisionStatus) => {
    const approveWeight = status.weighted_votes.approve || 0
    const rejectWeight = status.weighted_votes.reject || 0
    const totalWeight = approveWeight + rejectWeight + (status.weighted_votes.abstain || 0) + (status.weighted_votes.conditional || 0)
    
    if (totalWeight === 0) return 0
    
    return (approveWeight / totalWeight) * 100
  }

  const getAgentName = (agentId: string) => {
    const agent = agents.find(a => a.id === agentId)
    return agent ? agent.name : agentId
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading decisions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Consensus Decision Voting</h2>
          <p className="text-muted-foreground">
            Participate in multi-agent consensus decisions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {activeDecisions.length} Active Decisions
          </Badge>
          <Select value={currentAgent} onValueChange={setCurrentAgent}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {agents.map(agent => (
                <SelectItem key={agent.id} value={agent.id}>
                  <div className="flex items-center gap-2">
                    <span>{agent.name}</span>
                    <Badge variant="outline" className="text-xs">
                      Weight: {agent.weight.toFixed(1)}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Active Decisions */}
      <div className="grid grid-cols-1 gap-4">
        {activeDecisions.map(decision => {
          const status = decisionStatuses[decision.decision_id]
          const progress = status ? getConsensusProgress(status) : 0
          
          return (
            <Card key={decision.decision_id} className={`${getPriorityColor(decision.priority)} border-2`}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getDecisionTypeIcon(decision.decision_type)}
                    <span>{decision.title}</span>
                    <Badge variant="outline" className="capitalize">
                      {decision.decision_type.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={decision.priority === 'critical' ? 'destructive' : 'secondary'}>
                      {decision.priority}
                    </Badge>
                    {status && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Timer className="h-3 w-3" />
                        {formatTimeRemaining(status.time_remaining)}
                      </Badge>
                    )}
                  </div>
                </CardTitle>
                <CardDescription>{decision.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Voting Status */}
                  {status && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Consensus Progress</span>
                        <span>{progress.toFixed(1)}% approval</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Votes: {status.total_votes}/{status.required_votes} required</span>
                        <span>Algorithm: {status.consensus_algorithm.replace('_', ' ')}</span>
                      </div>
                    </div>
                  )}

                  {/* Options */}
                  <div className="space-y-2">
                    <h4 className="font-medium">Options:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      {decision.options.map(option => (
                        <div key={option.id} className="p-2 border rounded text-sm">
                          <div className="font-medium">{option.title}</div>
                          <div className="text-muted-foreground">{option.description}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Vote Counts */}
                  {status && (
                    <div className="grid grid-cols-4 gap-2">
                      {Object.entries(status.vote_counts).map(([voteType, count]) => (
                        <div key={voteType} className="flex items-center gap-1 text-sm">
                          {getVoteTypeIcon(voteType)}
                          <span className="capitalize">{voteType}:</span>
                          <span className="font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Voting Agents */}
                  {status && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Voted:</span>
                        <div className="flex gap-1">
                          {status.voting_agents.map(agentId => (
                            <Badge key={agentId} variant="outline" className="text-xs">
                              {getAgentName(agentId)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      {status.non_voting_agents.length > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Pending:</span>
                          <div className="flex gap-1">
                            {status.non_voting_agents.map(agentId => (
                              <Badge key={agentId} variant="secondary" className="text-xs">
                                {getAgentName(agentId)}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Voting Interface */}
                  {canVote(decision) && (
                    <Card className="border-blue-200 bg-blue-50">
                      <CardContent className="pt-4">
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <Vote className="h-4 w-4 text-blue-600" />
                            <span className="font-medium">Cast Your Vote</span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium">Vote Type</label>
                              <Select value={voteType} onValueChange={setVoteType}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="approve">
                                    <div className="flex items-center gap-2">
                                      <ThumbsUp className="h-4 w-4 text-green-600" />
                                      Approve
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="reject">
                                    <div className="flex items-center gap-2">
                                      <ThumbsDown className="h-4 w-4 text-red-600" />
                                      Reject
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="abstain">
                                    <div className="flex items-center gap-2">
                                      <Minus className="h-4 w-4 text-gray-600" />
                                      Abstain
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="conditional">
                                    <div className="flex items-center gap-2">
                                      <MessageSquare className="h-4 w-4 text-yellow-600" />
                                      Conditional
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div>
                              <label className="text-sm font-medium">
                                Confidence: {confidence[0]}%
                              </label>
                              <Slider
                                value={confidence}
                                onValueChange={setConfidence}
                                max={100}
                                min={0}
                                step={5}
                                className="mt-2"
                              />
                            </div>
                          </div>
                          
                          <div>
                            <label className="text-sm font-medium">Reasoning (required)</label>
                            <Textarea
                              value={reasoning}
                              onChange={(e) => setReasoning(e.target.value)}
                              placeholder="Explain your vote and reasoning..."
                              className="mt-1"
                              rows={3}
                            />
                          </div>
                          
                          <div className="flex gap-2">
                            <Button 
                              onClick={() => {
                                setSelectedDecision(decision.decision_id)
                                handleVote()
                              }}
                              disabled={!reasoning.trim() || votingInProgress}
                              className="flex-1"
                            >
                              {votingInProgress ? (
                                <div className="flex items-center gap-2">
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                  Submitting...
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <Vote className="h-4 w-4" />
                                  Cast Vote
                                </div>
                              )}
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={() => {
                                setReasoning('')
                                setConfidence([80])
                                setVoteType('approve')
                              }}
                            >
                              Clear
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Already Voted */}
                  {hasVoted(decision) && (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        You have already voted on this decision. Thank you for your participation!
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Cannot Vote */}
                  {!canVote(decision) && !hasVoted(decision) && status && status.time_remaining > 0 && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        You are not eligible to vote on this decision.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Expired */}
                  {status && status.time_remaining <= 0 && (
                    <Alert>
                      <Clock className="h-4 w-4" />
                      <AlertDescription>
                        This decision has expired. Final outcome will be determined by received votes.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Empty State */}
      {activeDecisions.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <Vote className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">No Active Decisions</h3>
            <p className="text-muted-foreground">
              There are currently no decisions requiring consensus. New decisions will appear here.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}