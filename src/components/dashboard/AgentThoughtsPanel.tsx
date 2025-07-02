'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Brain, Zap, TrendingUp, AlertCircle, Info, Target } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import { motion, AnimatePresence } from 'framer-motion'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

export interface AgentThought {
  id: string
  agent_id: string
  thought_type: 'analysis' | 'decision' | 'learning' | 'strategy' | 'risk'
  content: string
  reasoning: string
  confidence: number
  market_context?: {
    symbol: string
    price: number
    trend: string
    volatility: number
  }
  technical_signals?: {
    signal: string
    strength: number
    indicators: string[]
  }
  timestamp: string
}

interface AgentThoughtsPanelProps {
  agentId?: string
  className?: string
}

export function AgentThoughtsPanel({ agentId, className }: AgentThoughtsPanelProps) {
  const [thoughts, setThoughts] = useState<AgentThought[]>([])
  const [loading, setLoading] = useState(true)
  const [isRealTime, setIsRealTime] = useState(false)

  useEffect(() => {
    if (!agentId) {
      loadMockThoughts()
      return
    }

    loadAgentThoughts(agentId)
    
    // Subscribe to real-time thoughts if Supabase is available
    if (supabase) {
      const channel = supabase
        .channel(`agent_thoughts_${agentId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'agent_thoughts',
            filter: `agent_id=eq.${agentId}`
          },
          (payload) => {
            setThoughts(prev => [payload.new as AgentThought, ...prev].slice(0, 50))
            setIsRealTime(true)
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [agentId])

  const loadAgentThoughts = async (agentId: string) => {
    if (!supabase) {
      loadMockThoughts()
      return
    }

    try {
      const { data, error } = await supabase
        .from('agent_thoughts')
        .select('*')
        .eq('agent_id', agentId)
        .order('timestamp', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Error loading thoughts:', error)
        loadMockThoughts()
        return
      }

      setThoughts(data || [])
      setLoading(false)
    } catch (error) {
      console.error('Failed to load thoughts:', error)
      loadMockThoughts()
    }
  }

  const loadMockThoughts = () => {
    const mockThoughts: AgentThought[] = [
      {
        id: '1',
        agent_id: 'agent_1',
        thought_type: 'analysis',
        content: 'Detecting strong bullish momentum in BTC/USD',
        reasoning: 'Multiple technical indicators showing convergence: RSI above 60, MACD crossing above signal line, and price breaking above 20-day EMA',
        confidence: 0.85,
        market_context: {
          symbol: 'BTC/USD',
          price: 45250,
          trend: 'bullish',
          volatility: 0.24
        },
        technical_signals: {
          signal: 'buy',
          strength: 0.78,
          indicators: ['RSI', 'MACD', 'EMA']
        },
        timestamp: new Date().toISOString()
      },
      {
        id: '2',
        agent_id: 'agent_1',
        thought_type: 'decision',
        content: 'Initiating long position on BTC/USD',
        reasoning: 'Strong technical setup combined with positive market sentiment. Risk-reward ratio of 1:3 is favorable',
        confidence: 0.82,
        timestamp: new Date(Date.now() - 60000).toISOString()
      },
      {
        id: '3',
        agent_id: 'agent_1',
        thought_type: 'learning',
        content: 'Pattern recognition: Bullish flag formation successful 73% of the time',
        reasoning: 'Historical analysis of 150 similar patterns shows consistent breakout behavior after consolidation period',
        confidence: 0.91,
        timestamp: new Date(Date.now() - 120000).toISOString()
      },
      {
        id: '4',
        agent_id: 'agent_1',
        thought_type: 'risk',
        content: 'Adjusting position size due to increased volatility',
        reasoning: 'Market volatility has increased by 35% in the last hour. Reducing position size to maintain risk parameters',
        confidence: 0.88,
        timestamp: new Date(Date.now() - 180000).toISOString()
      },
      {
        id: '5',
        agent_id: 'agent_1',
        thought_type: 'strategy',
        content: 'Darvas Box breakout confirmed on ETH/USD',
        reasoning: 'Price has broken above the box high with volume 2.3x average. Historical win rate for this setup is 89%',
        confidence: 0.94,
        market_context: {
          symbol: 'ETH/USD',
          price: 2850,
          trend: 'bullish',
          volatility: 0.28
        },
        timestamp: new Date(Date.now() - 240000).toISOString()
      }
    ]

    setThoughts(mockThoughts)
    setLoading(false)
  }

  const getThoughtIcon = (type: AgentThought['thought_type']) => {
    switch (type) {
      case 'analysis':
        return <Brain className="h-4 w-4" />
      case 'decision':
        return <Target className="h-4 w-4" />
      case 'learning':
        return <Zap className="h-4 w-4" />
      case 'risk':
        return <AlertCircle className="h-4 w-4" />
      case 'strategy':
        return <TrendingUp className="h-4 w-4" />
      default:
        return <Info className="h-4 w-4" />
    }
  }

  const getThoughtColor = (type: AgentThought['thought_type']) => {
    switch (type) {
      case 'analysis':
        return 'text-blue-600 bg-blue-50'
      case 'decision':
        return 'text-green-600 bg-green-50'
      case 'learning':
        return 'text-purple-600 bg-purple-50'
      case 'risk':
        return 'text-red-600 bg-red-50'
      case 'strategy':
        return 'text-orange-600 bg-orange-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Agent Thoughts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            Loading agent thoughts...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Agent Thoughts & Reasoning
          </CardTitle>
          {isRealTime && (
            <Badge variant="default" className="animate-pulse">
              Live
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <AnimatePresence mode="popLayout">
            {thoughts.map((thought, index) => (
              <motion.div
                key={thought.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                className="mb-4"
              >
                <div className="space-y-2">
                  {/* Thought Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-lg ${getThoughtColor(thought.thought_type)}`}>
                        {getThoughtIcon(thought.thought_type)}
                      </div>
                      <div>
                        <div className="font-medium capitalize">{thought.thought_type}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatTimestamp(thought.timestamp)}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline">
                      {(thought.confidence * 100).toFixed(0)}% confidence
                    </Badge>
                  </div>

                  {/* Thought Content */}
                  <div className="pl-12">
                    <p className="font-medium text-sm">{thought.content}</p>
                    <p className="text-sm text-muted-foreground mt-1">{thought.reasoning}</p>

                    {/* Market Context */}
                    {thought.market_context && (
                      <div className="mt-2 p-2 bg-muted/50 rounded-lg text-xs">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-muted-foreground">Symbol:</span>{' '}
                            <span className="font-medium">{thought.market_context.symbol}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Price:</span>{' '}
                            <span className="font-medium">${thought.market_context.price.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Trend:</span>{' '}
                            <Badge variant="secondary" className="text-xs">
                              {thought.market_context.trend}
                            </Badge>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Volatility:</span>{' '}
                            <span className="font-medium">{(thought.market_context.volatility * 100).toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Technical Signals */}
                    {thought.technical_signals && (
                      <div className="mt-2 flex items-center gap-2">
                        <Badge 
                          variant={thought.technical_signals.signal === 'buy' ? 'default' : 'destructive'}
                          className="text-xs"
                        >
                          {thought.technical_signals.signal.toUpperCase()}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Strength: {(thought.technical_signals.strength * 100).toFixed(0)}%
                        </span>
                        <div className="flex gap-1">
                          {thought.technical_signals.indicators.map((indicator) => (
                            <Badge key={indicator} variant="outline" className="text-xs">
                              {indicator}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {index < thoughts.length - 1 && <Separator className="mt-4" />}
              </motion.div>
            ))}
          </AnimatePresence>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

export default AgentThoughtsPanel