"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { OptimizationRequest, OptimizationResult } from '@/lib/services/ml-analytics-service'
import { TrendingUp, Target, Shield, BarChart3, AlertTriangle } from 'lucide-react'

interface PortfolioOptimizerProps {
  portfolioId?: string
  className?: string
}

export function PortfolioOptimizer({ portfolioId = 'default', className = "" }: PortfolioOptimizerProps) {
  const [optimizationRequest, setOptimizationRequest] = useState<OptimizationRequest>({
    portfolio_id: portfolioId,
    objective: 'max_sharpe',
    risk_model: 'covariance',
    lookback_days: 252,
    max_position_size: 0.4
  })
  
  const [result, setResult] = useState<OptimizationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleOptimize = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/analytics/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(optimizationRequest)
      })
      
      const data = await response.json()
      
      if (data.success) {
        setResult(data.optimization)
      } else {
        setError(data.error || 'Optimization failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const formatPercentage = (value: number) => `${(value * 100).toFixed(2)}%`
  const formatCurrency = (value: number) => `$${value.toLocaleString()}`

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Configuration Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Portfolio Optimization
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Optimization Objective */}
            <div className="space-y-2">
              <Label htmlFor="objective">Objective</Label>
              <Select
                value={optimizationRequest.objective}
                onValueChange={(value: any) => setOptimizationRequest(prev => ({ ...prev, objective: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="max_sharpe">Maximize Sharpe Ratio</SelectItem>
                  <SelectItem value="min_volatility">Minimize Volatility</SelectItem>
                  <SelectItem value="max_return">Maximize Return</SelectItem>
                  <SelectItem value="risk_parity">Risk Parity</SelectItem>
                  <SelectItem value="black_litterman">Black-Litterman</SelectItem>
                  <SelectItem value="ml_ensemble">ML Ensemble</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Risk Model */}
            <div className="space-y-2">
              <Label htmlFor="risk_model">Risk Model</Label>
              <Select
                value={optimizationRequest.risk_model}
                onValueChange={(value: any) => setOptimizationRequest(prev => ({ ...prev, risk_model: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="covariance">Sample Covariance</SelectItem>
                  <SelectItem value="factor_model">Factor Model</SelectItem>
                  <SelectItem value="shrinkage">Shrinkage</SelectItem>
                  <SelectItem value="robust">Robust</SelectItem>
                  <SelectItem value="lstm_var">LSTM VaR</SelectItem>
                  <SelectItem value="garch">GARCH</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Lookback Days */}
            <div className="space-y-2">
              <Label htmlFor="lookback">Lookback Days</Label>
              <Input
                type="number"
                value={optimizationRequest.lookback_days}
                onChange={(e) => setOptimizationRequest(prev => ({ 
                  ...prev, 
                  lookback_days: parseInt(e.target.value) || 252 
                }))}
                min="30"
                max="1000"
              />
            </div>

            {/* Max Position Size */}
            <div className="space-y-2">
              <Label htmlFor="max_position">Max Position Size</Label>
              <Input
                type="number"
                step="0.05"
                value={optimizationRequest.max_position_size}
                onChange={(e) => setOptimizationRequest(prev => ({ 
                  ...prev, 
                  max_position_size: parseFloat(e.target.value) || 0.4 
                }))}
                min="0.05"
                max="1.0"
              />
            </div>

            {/* Target Return */}
            <div className="space-y-2">
              <Label htmlFor="target_return">Target Return (optional)</Label>
              <Input
                type="number"
                step="0.01"
                value={optimizationRequest.target_return || ''}
                onChange={(e) => setOptimizationRequest(prev => ({ 
                  ...prev, 
                  target_return: e.target.value ? parseFloat(e.target.value) : undefined 
                }))}
                placeholder="0.15"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleOptimize}
              disabled={loading}
              className="min-w-32"
            >
              {loading ? 'Optimizing...' : 'Run Optimization'}
            </Button>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-4 border border-red-200">
              <div className="flex">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Optimization Error</h3>
                  <p className="mt-2 text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Panel */}
      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 rounded-lg bg-green-50 border border-green-200">
                  <div className="text-2xl font-bold text-green-700">
                    {formatPercentage(result.expected_return)}
                  </div>
                  <div className="text-sm text-green-600">Expected Return</div>
                </div>
                
                <div className="text-center p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <div className="text-2xl font-bold text-blue-700">
                    {formatPercentage(result.expected_volatility)}
                  </div>
                  <div className="text-sm text-blue-600">Volatility</div>
                </div>
                
                <div className="text-center p-3 rounded-lg bg-purple-50 border border-purple-200">
                  <div className="text-2xl font-bold text-purple-700">
                    {result.sharpe_ratio.toFixed(3)}
                  </div>
                  <div className="text-sm text-purple-600">Sharpe Ratio</div>
                </div>
                
                <div className="text-center p-3 rounded-lg bg-orange-50 border border-orange-200">
                  <div className="text-2xl font-bold text-orange-700">
                    {formatPercentage(result.max_drawdown)}
                  </div>
                  <div className="text-sm text-orange-600">Max Drawdown</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">95% VaR:</span>
                  <span className="text-sm font-medium">{formatPercentage(result.var_95)}</span>
                </div>
                {Object.entries(result.performance_metrics).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-sm text-gray-600 capitalize">{key.replace('_', ' ')}:</span>
                    <span className="text-sm font-medium">
                      {typeof value === 'number' ? formatPercentage(value) : value}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Optimal Weights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Optimal Asset Allocation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(result.optimal_weights)
                  .sort(([,a], [,b]) => b - a)
                  .map(([asset, weight]) => (
                    <div key={asset} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{asset}</span>
                        <span className="text-sm">{formatPercentage(weight)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${weight * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Risk Attribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Risk Attribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(result.risk_attribution)
                  .sort(([,a], [,b]) => b - a)
                  .map(([asset, contribution]) => (
                    <div key={asset} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{asset}</span>
                        <span className="text-sm">{formatPercentage(contribution)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-red-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${contribution * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {result.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-blue-800">{rec}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}