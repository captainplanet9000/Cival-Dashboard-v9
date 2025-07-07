'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Bot, Plus, Sparkles, TrendingUp, Target, Brain, Shield,
  Users, Activity, BarChart3, Settings, Zap, Star, ArrowRight
} from 'lucide-react'
import { EnhancedAgentCreationWizard } from './EnhancedAgentCreationWizard'

/**
 * Agent Creation Integration Component
 * Provides seamless integration between existing agent management and enhanced creation wizard
 * Features strategy templates, quick setup options, and guided creation flow
 */

interface AgentTemplate {
  id: string
  name: string
  description: string
  strategies: string[]
  riskLevel: 'conservative' | 'moderate' | 'aggressive'
  expectedReturn: number
  minCapital: number
  complexity: 'beginner' | 'intermediate' | 'advanced'
  popularity: number
  icon: React.ComponentType<any>
}

const AGENT_TEMPLATES: AgentTemplate[] = [
  {
    id: 'conservative-trader',
    name: 'Conservative Trader',
    description: 'Low-risk strategy focused on capital preservation with steady returns',
    strategies: ['heikin_ashi', 'renko_breakout'],
    riskLevel: 'conservative',
    expectedReturn: 12.5,
    minCapital: 5000,
    complexity: 'beginner',
    popularity: 92,
    icon: Shield
  },
  {
    id: 'momentum-hunter',
    name: 'Momentum Hunter',
    description: 'High-performance agent targeting trending markets and momentum plays',
    strategies: ['darvas_box', 'williams_alligator'],
    riskLevel: 'moderate',
    expectedReturn: 24.8,
    minCapital: 10000,
    complexity: 'intermediate',
    popularity: 88,
    icon: TrendingUp
  },
  {
    id: 'pattern-master',
    name: 'Pattern Master',
    description: 'Advanced pattern recognition with Elliott Wave and technical analysis',
    strategies: ['elliott_wave', 'darvas_box', 'heikin_ashi'],
    riskLevel: 'aggressive',
    expectedReturn: 35.2,
    minCapital: 25000,
    complexity: 'advanced',
    popularity: 76,
    icon: Target
  },
  {
    id: 'ai-powerhouse',
    name: 'AI Powerhouse',
    description: 'Full AI capabilities with all strategies and maximum learning potential',
    strategies: ['darvas_box', 'williams_alligator', 'renko_breakout', 'heikin_ashi', 'elliott_wave'],
    riskLevel: 'moderate',
    expectedReturn: 28.6,
    minCapital: 15000,
    complexity: 'intermediate',
    popularity: 94,
    icon: Brain
  }
]

interface QuickSetupOption {
  id: string
  title: string
  description: string
  time: string
  steps: number
  icon: React.ComponentType<any>
}

const QUICK_SETUP_OPTIONS: QuickSetupOption[] = [
  {
    id: 'template',
    title: 'Use Template',
    description: 'Start with a pre-configured agent template',
    time: '2 minutes',
    steps: 3,
    icon: Zap
  },
  {
    id: 'guided',
    title: 'Guided Setup',
    description: 'Step-by-step configuration with recommendations',
    time: '5 minutes',
    steps: 6,
    icon: Settings
  },
  {
    id: 'custom',
    title: 'Custom Build',
    description: 'Full customization with advanced options',
    time: '10 minutes',
    steps: 8,
    icon: Bot
  }
]

interface AgentCreationIntegrationProps {
  onAgentCreated?: (agent: any) => void
  onClose?: () => void
  className?: string
}

export function AgentCreationIntegration({
  onAgentCreated,
  onClose,
  className = ''
}: AgentCreationIntegrationProps) {
  const [showWizard, setShowWizard] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<AgentTemplate | null>(null)
  const [quickSetupMode, setQuickSetupMode] = useState<string | null>(null)

  const handleTemplateSelect = (template: AgentTemplate) => {
    setSelectedTemplate(template)
    setShowWizard(true)
  }

  const handleQuickSetup = (mode: string) => {
    setQuickSetupMode(mode)
    setShowWizard(true)
  }

  const handleAgentCreated = (agent: any) => {
    setShowWizard(false)
    setSelectedTemplate(null)
    setQuickSetupMode(null)
    onAgentCreated?.(agent)
  }

  if (showWizard) {
    return (
      <EnhancedAgentCreationWizard
        onAgentCreated={handleAgentCreated}
        onClose={() => {
          setShowWizard(false)
          setSelectedTemplate(null)
          setQuickSetupMode(null)
        }}
        className={className}
      />
    )
  }

  return (
    <div className={`max-w-7xl mx-auto p-6 ${className}`}>
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center mb-4"
        >
          <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
            <Bot className="w-8 h-8 text-white" />
          </div>
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-3xl font-bold text-gray-900 mb-2"
        >
          Create Your Trading Agent
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg text-gray-600 max-w-2xl mx-auto"
        >
          Deploy advanced AI agents with sophisticated trading strategies, risk management, and autonomous learning capabilities
        </motion.p>
      </div>

      {/* Quick Setup Options */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-12"
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
          How would you like to get started?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {QUICK_SETUP_OPTIONS.map((option, index) => (
            <motion.div
              key={option.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
            >
              <Card 
                className="cursor-pointer hover:shadow-lg transition-all group"
                onClick={() => handleQuickSetup(option.id)}
              >
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <option.icon className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {option.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {option.description}
                  </p>
                  <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
                    <div className="flex items-center">
                      <Activity className="w-3 h-3 mr-1" />
                      {option.time}
                    </div>
                    <div className="flex items-center">
                      <BarChart3 className="w-3 h-3 mr-1" />
                      {option.steps} steps
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Agent Templates */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mb-12"
      >
        <div className="text-center mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Or start with a proven template
          </h2>
          <p className="text-gray-600">
            Pre-configured agents with optimized strategies and settings
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {AGENT_TEMPLATES.map((template, index) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + index * 0.1 }}
            >
              <Card className="cursor-pointer hover:shadow-lg transition-all group">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="p-3 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg group-hover:scale-110 transition-transform">
                        <template.icon className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-1">{template.name}</CardTitle>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {template.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm font-medium">{template.popularity}%</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-lg font-bold text-green-600">
                        {template.expectedReturn}%
                      </div>
                      <div className="text-xs text-green-700">Expected Return</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-lg font-bold text-blue-600">
                        ${template.minCapital.toLocaleString()}
                      </div>
                      <div className="text-xs text-blue-700">Min Capital</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant="outline" 
                        className={`
                          ${template.riskLevel === 'conservative' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                          ${template.riskLevel === 'moderate' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : ''}
                          ${template.riskLevel === 'aggressive' ? 'bg-red-50 text-red-700 border-red-200' : ''}
                        `}
                      >
                        {template.riskLevel}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {template.complexity}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      {template.strategies.length} strategies
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="text-sm font-medium text-gray-700 mb-2">
                      Included Strategies:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {template.strategies.map(strategy => (
                        <Badge key={strategy} variant="secondary" className="text-xs">
                          {strategy.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Button 
                    onClick={() => handleTemplateSelect(template)}
                    className="w-full group-hover:bg-blue-600 transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Use This Template
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Features Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
        className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-8"
      >
        <div className="text-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Advanced AI Trading Features
          </h3>
          <p className="text-gray-600">
            Every agent comes with enterprise-grade capabilities
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: Brain,
              title: 'Machine Learning',
              description: 'Adaptive strategies that improve over time'
            },
            {
              icon: Shield,
              title: 'Risk Management',
              description: 'Advanced risk controls and position sizing'
            },
            {
              icon: Target,
              title: 'Strategy Engine',
              description: 'Multiple trading strategies working in harmony'
            },
            {
              icon: Activity,
              title: 'Real-time Analytics',
              description: 'Live performance monitoring and insights'
            }
          ].map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1 + index * 0.1 }}
              className="text-center"
            >
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mx-auto mb-3 shadow-sm">
                <feature.icon className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-1">{feature.title}</h4>
              <p className="text-sm text-gray-600">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* CTA Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        className="text-center mt-12"
      >
        <Button
          size="lg"
          onClick={() => handleQuickSetup('guided')}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3"
        >
          <Sparkles className="w-5 h-5 mr-2" />
          Start Building Your Agent
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
        <p className="text-sm text-gray-600 mt-2">
          Join thousands of traders using AI-powered agents
        </p>
      </motion.div>
    </div>
  )
}