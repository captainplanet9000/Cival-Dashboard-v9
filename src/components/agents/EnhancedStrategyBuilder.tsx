'use client'

import React, { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { 
  Plus, X, Settings, Code, Play, Save, Download, 
  TrendingUp, BarChart3, Target, Zap, AlertTriangle
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface StrategyComponent {
  id: string
  type: 'indicator' | 'condition' | 'action' | 'risk_management'
  name: string
  description: string
  parameters: Record<string, any>
  category: string
}

interface StrategyRule {
  id: string
  type: 'entry' | 'exit' | 'risk'
  conditions: StrategyComponent[]
  actions: StrategyComponent[]
  logic: 'AND' | 'OR'
}

interface CustomStrategy {
  id: string
  name: string
  description: string
  rules: StrategyRule[]
  riskManagement: {
    stopLoss: number
    takeProfit: number
    maxPositionSize: number
    maxDrawdown: number
  }
  backtest: {
    enabled: boolean
    startDate: string
    endDate: string
    initialCapital: number
  }
  isActive: boolean
}

const availableComponents: StrategyComponent[] = [
  // Technical Indicators
  {
    id: 'sma',
    type: 'indicator',
    name: 'Simple Moving Average',
    description: 'Moving average over specified period',
    parameters: { period: 20 },
    category: 'Moving Averages'
  },
  {
    id: 'ema',
    type: 'indicator',
    name: 'Exponential Moving Average',
    description: 'Exponentially weighted moving average',
    parameters: { period: 20 },
    category: 'Moving Averages'
  },
  {
    id: 'rsi',
    type: 'indicator',
    name: 'RSI',
    description: 'Relative Strength Index',
    parameters: { period: 14, overbought: 70, oversold: 30 },
    category: 'Oscillators'
  },
  {
    id: 'macd',
    type: 'indicator',
    name: 'MACD',
    description: 'Moving Average Convergence Divergence',
    parameters: { fast: 12, slow: 26, signal: 9 },
    category: 'Oscillators'
  },
  {
    id: 'bollinger',
    type: 'indicator',
    name: 'Bollinger Bands',
    description: 'Price bands around moving average',
    parameters: { period: 20, deviation: 2 },
    category: 'Volatility'
  },
  {
    id: 'atr',
    type: 'indicator',
    name: 'Average True Range',
    description: 'Measure of volatility',
    parameters: { period: 14 },
    category: 'Volatility'
  },
  
  // Conditions
  {
    id: 'price_above',
    type: 'condition',
    name: 'Price Above',
    description: 'Price is above specified level',
    parameters: { value: 0, indicator: 'sma' },
    category: 'Price Conditions'
  },
  {
    id: 'price_below',
    type: 'condition',
    name: 'Price Below',
    description: 'Price is below specified level',
    parameters: { value: 0, indicator: 'sma' },
    category: 'Price Conditions'
  },
  {
    id: 'crossover',
    type: 'condition',
    name: 'Crossover',
    description: 'One indicator crosses above another',
    parameters: { indicator1: 'ema', indicator2: 'sma' },
    category: 'Cross Conditions'
  },
  {
    id: 'crossunder',
    type: 'condition',
    name: 'Crossunder',
    description: 'One indicator crosses below another',
    parameters: { indicator1: 'ema', indicator2: 'sma' },
    category: 'Cross Conditions'
  },
  
  // Actions
  {
    id: 'buy_market',
    type: 'action',
    name: 'Buy Market',
    description: 'Execute market buy order',
    parameters: { quantity: 100 },
    category: 'Entry Orders'
  },
  {
    id: 'sell_market',
    type: 'action',
    name: 'Sell Market',
    description: 'Execute market sell order',
    parameters: { quantity: 100 },
    category: 'Entry Orders'
  },
  {
    id: 'buy_limit',
    type: 'action',
    name: 'Buy Limit',
    description: 'Place limit buy order',
    parameters: { quantity: 100, price: 0 },
    category: 'Entry Orders'
  },
  {
    id: 'sell_limit',
    type: 'action',
    name: 'Sell Limit',
    description: 'Place limit sell order',
    parameters: { quantity: 100, price: 0 },
    category: 'Entry Orders'
  },
  
  // Risk Management
  {
    id: 'stop_loss',
    type: 'risk_management',
    name: 'Stop Loss',
    description: 'Close position at loss threshold',
    parameters: { percentage: 2 },
    category: 'Risk Management'
  },
  {
    id: 'take_profit',
    type: 'risk_management',
    name: 'Take Profit',
    description: 'Close position at profit target',
    parameters: { percentage: 4 },
    category: 'Risk Management'
  },
  {
    id: 'trailing_stop',
    type: 'risk_management',
    name: 'Trailing Stop',
    description: 'Dynamic stop loss that follows price',
    parameters: { percentage: 3 },
    category: 'Risk Management'
  }
]

export function EnhancedStrategyBuilder() {
  const [currentStrategy, setCurrentStrategy] = useState<CustomStrategy>({
    id: '',
    name: '',
    description: '',
    rules: [],
    riskManagement: {
      stopLoss: 2,
      takeProfit: 4,
      maxPositionSize: 1000,
      maxDrawdown: 10
    },
    backtest: {
      enabled: false,
      startDate: '2024-01-01',
      endDate: '2024-12-01',
      initialCapital: 10000
    },
    isActive: false
  })

  const [selectedTab, setSelectedTab] = useState('design')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const addRule = useCallback(() => {
    const newRule: StrategyRule = {
      id: `rule_${Date.now()}`,
      type: 'entry',
      conditions: [],
      actions: [],
      logic: 'AND'
    }
    
    setCurrentStrategy(prev => ({
      ...prev,
      rules: [...prev.rules, newRule]
    }))
  }, [])

  const removeRule = useCallback((ruleId: string) => {
    setCurrentStrategy(prev => ({
      ...prev,
      rules: prev.rules.filter(rule => rule.id !== ruleId)
    }))
  }, [])

  const addComponentToRule = useCallback((ruleId: string, component: StrategyComponent, type: 'conditions' | 'actions') => {
    setCurrentStrategy(prev => ({
      ...prev,
      rules: prev.rules.map(rule => 
        rule.id === ruleId 
          ? { ...rule, [type]: [...rule[type], { ...component, id: `${component.id}_${Date.now()}` }] }
          : rule
      )
    }))
  }, [])

  const removeComponentFromRule = useCallback((ruleId: string, componentId: string, type: 'conditions' | 'actions') => {
    setCurrentStrategy(prev => ({
      ...prev,
      rules: prev.rules.map(rule => 
        rule.id === ruleId 
          ? { ...rule, [type]: rule[type].filter(comp => comp.id !== componentId) }
          : rule
      )
    }))
  }, [])

  const updateRuleLogic = useCallback((ruleId: string, logic: 'AND' | 'OR') => {
    setCurrentStrategy(prev => ({
      ...prev,
      rules: prev.rules.map(rule => 
        rule.id === ruleId 
          ? { ...rule, logic }
          : rule
      )
    }))
  }, [])

  const updateComponentParameter = useCallback((ruleId: string, componentId: string, type: 'conditions' | 'actions', paramKey: string, value: any) => {
    setCurrentStrategy(prev => ({
      ...prev,
      rules: prev.rules.map(rule => 
        rule.id === ruleId 
          ? {
              ...rule,
              [type]: rule[type].map(comp => 
                comp.id === componentId 
                  ? { ...comp, parameters: { ...comp.parameters, [paramKey]: value } }
                  : comp
              )
            }
          : rule
      )
    }))
  }, [])

  const categories = ['all', ...new Set(availableComponents.map(c => c.category))]
  const filteredComponents = selectedCategory === 'all' 
    ? availableComponents 
    : availableComponents.filter(c => c.category === selectedCategory)

  const ComponentCard = ({ component }: { component: StrategyComponent }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      className="cursor-move"
    >
      <Card className="h-full">
        <CardContent className="p-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-medium text-sm">{component.name}</h4>
              <p className="text-xs text-muted-foreground mt-1">{component.description}</p>
              <Badge variant="outline" className="mt-2 text-xs">
                {component.type}
              </Badge>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="p-1 h-6 w-6"
              onClick={() => {
                // Add to currently selected rule - simplified for demo
                if (currentStrategy.rules.length > 0) {
                  const lastRule = currentStrategy.rules[currentStrategy.rules.length - 1]
                  const targetType = component.type === 'action' ? 'actions' : 'conditions'
                  addComponentToRule(lastRule.id, component, targetType)
                }
              }}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )

  const RuleEditor = ({ rule }: { rule: StrategyRule }) => (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant={rule.type === 'entry' ? 'default' : rule.type === 'exit' ? 'destructive' : 'secondary'}>
              {rule.type}
            </Badge>
            <Select value={rule.logic} onValueChange={(value: 'AND' | 'OR') => updateRuleLogic(rule.id, value)}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AND">AND</SelectItem>
                <SelectItem value="OR">OR</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button size="sm" variant="ghost" onClick={() => removeRule(rule.id)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Conditions */}
        <div>
          <Label className="text-sm font-medium">Conditions</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
            {rule.conditions.map((condition) => (
              <div key={condition.id} className="flex items-center gap-2 p-2 bg-muted rounded">
                <span className="text-sm flex-1">{condition.name}</span>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => removeComponentFromRule(rule.id, condition.id, 'conditions')}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div>
          <Label className="text-sm font-medium">Actions</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
            {rule.actions.map((action) => (
              <div key={action.id} className="flex items-center gap-2 p-2 bg-muted rounded">
                <span className="text-sm flex-1">{action.name}</span>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => removeComponentFromRule(rule.id, action.id, 'actions')}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const generateStrategyCode = () => {
    let code = `// Generated Strategy: ${currentStrategy.name}\n\n`
    code += `class ${currentStrategy.name.replace(/\s+/g, '')}Strategy {\n`
    code += `  constructor() {\n`
    code += `    this.name = "${currentStrategy.name}";\n`
    code += `    this.description = "${currentStrategy.description}";\n`
    code += `  }\n\n`
    
    code += `  shouldEnter(marketData) {\n`
    currentStrategy.rules.filter(r => r.type === 'entry').forEach(rule => {
      code += `    // ${rule.logic} rule\n`
      rule.conditions.forEach(condition => {
        code += `    // ${condition.name}: ${condition.description}\n`
      })
    })
    code += `    return false; // Implement logic\n`
    code += `  }\n\n`
    
    code += `  shouldExit(position, marketData) {\n`
    currentStrategy.rules.filter(r => r.type === 'exit').forEach(rule => {
      code += `    // ${rule.logic} rule\n`
      rule.conditions.forEach(condition => {
        code += `    // ${condition.name}: ${condition.description}\n`
      })
    })
    code += `    return false; // Implement logic\n`
    code += `  }\n\n`
    
    code += `  getRiskManagement() {\n`
    code += `    return {\n`
    code += `      stopLoss: ${currentStrategy.riskManagement.stopLoss},\n`
    code += `      takeProfit: ${currentStrategy.riskManagement.takeProfit},\n`
    code += `      maxPositionSize: ${currentStrategy.riskManagement.maxPositionSize}\n`
    code += `    };\n`
    code += `  }\n`
    code += `}\n`
    
    return code
  }

  return (
    <div className="space-y-6">
      {/* Strategy Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Strategy Builder</h2>
          <p className="text-muted-foreground">Build custom trading strategies with visual components</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => console.log('Save strategy', currentStrategy)}>
            <Save className="h-4 w-4 mr-2" />
            Save Strategy
          </Button>
          <Button onClick={() => console.log('Deploy strategy', currentStrategy)}>
            <Play className="h-4 w-4 mr-2" />
            Deploy
          </Button>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="design">Design</TabsTrigger>
          <TabsTrigger value="backtest">Backtest</TabsTrigger>
          <TabsTrigger value="code">Code</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Design Tab */}
        <TabsContent value="design" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Component Library */}
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Component Library</h3>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category === 'all' ? 'All Components' : category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto">
                {filteredComponents.map(component => (
                  <ComponentCard key={component.id} component={component} />
                ))}
              </div>
            </div>

            {/* Strategy Canvas */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Strategy Rules</h3>
                <Button onClick={addRule} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Rule
                </Button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Strategy Name</Label>
                    <Input
                      value={currentStrategy.name}
                      onChange={(e) => setCurrentStrategy(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="My Custom Strategy"
                    />
                  </div>
                  <div>
                    <Label>Type</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="momentum">Momentum</SelectItem>
                        <SelectItem value="mean_reversion">Mean Reversion</SelectItem>
                        <SelectItem value="breakout">Breakout</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={currentStrategy.description}
                    onChange={(e) => setCurrentStrategy(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your strategy..."
                  />
                </div>

                {/* Rules */}
                <div className="space-y-2">
                  <AnimatePresence>
                    {currentStrategy.rules.map(rule => (
                      <motion.div
                        key={rule.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                      >
                        <RuleEditor rule={rule} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {currentStrategy.rules.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No rules added yet. Click "Add Rule" to start building your strategy.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Backtest Tab */}
        <TabsContent value="backtest" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Backtest Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={currentStrategy.backtest.startDate}
                    onChange={(e) => setCurrentStrategy(prev => ({
                      ...prev,
                      backtest: { ...prev.backtest, startDate: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={currentStrategy.backtest.endDate}
                    onChange={(e) => setCurrentStrategy(prev => ({
                      ...prev,
                      backtest: { ...prev.backtest, endDate: e.target.value }
                    }))}
                  />
                </div>
              </div>
              
              <div>
                <Label>Initial Capital</Label>
                <Input
                  type="number"
                  value={currentStrategy.backtest.initialCapital}
                  onChange={(e) => setCurrentStrategy(prev => ({
                    ...prev,
                    backtest: { ...prev.backtest, initialCapital: parseFloat(e.target.value) || 0 }
                  }))}
                />
              </div>

              <Button className="w-full">
                <Play className="h-4 w-4 mr-2" />
                Run Backtest
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Code Tab */}
        <TabsContent value="code" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Generated Code</CardTitle>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">
                <code>{generateStrategyCode()}</code>
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Risk Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Stop Loss (%)</Label>
                  <Slider
                    value={[currentStrategy.riskManagement.stopLoss]}
                    onValueChange={(values) => setCurrentStrategy(prev => ({
                      ...prev,
                      riskManagement: { ...prev.riskManagement, stopLoss: values[0] }
                    }))}
                    max={10}
                    step={0.1}
                  />
                  <span className="text-sm text-muted-foreground">
                    {currentStrategy.riskManagement.stopLoss}%
                  </span>
                </div>
                
                <div>
                  <Label>Take Profit (%)</Label>
                  <Slider
                    value={[currentStrategy.riskManagement.takeProfit]}
                    onValueChange={(values) => setCurrentStrategy(prev => ({
                      ...prev,
                      riskManagement: { ...prev.riskManagement, takeProfit: values[0] }
                    }))}
                    max={20}
                    step={0.1}
                  />
                  <span className="text-sm text-muted-foreground">
                    {currentStrategy.riskManagement.takeProfit}%
                  </span>
                </div>
              </div>

              <div>
                <Label>Max Position Size</Label>
                <Input
                  type="number"
                  value={currentStrategy.riskManagement.maxPositionSize}
                  onChange={(e) => setCurrentStrategy(prev => ({
                    ...prev,
                    riskManagement: { ...prev.riskManagement, maxPositionSize: parseFloat(e.target.value) || 0 }
                  }))}
                />
              </div>

              <div>
                <Label>Max Drawdown (%)</Label>
                <Slider
                  value={[currentStrategy.riskManagement.maxDrawdown]}
                  onValueChange={(values) => setCurrentStrategy(prev => ({
                    ...prev,
                    riskManagement: { ...prev.riskManagement, maxDrawdown: values[0] }
                  }))}
                  max={50}
                  step={1}
                />
                <span className="text-sm text-muted-foreground">
                  {currentStrategy.riskManagement.maxDrawdown}%
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default EnhancedStrategyBuilder