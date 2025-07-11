/**
 * ML Analytics Service
 * Integrates with ML Portfolio Optimizer for advanced analytics and insights
 */

import { redisService } from './redis-service'

export interface OptimizationObjective {
  MAX_SHARPE: "max_sharpe"
  MIN_VOLATILITY: "min_volatility"
  MAX_RETURN: "max_return"
  RISK_PARITY: "risk_parity"
  BLACK_LITTERMAN: "black_litterman"
  MEAN_REVERSION: "mean_reversion"
  MOMENTUM: "momentum"
  ML_ENSEMBLE: "ml_ensemble"
}

export interface RiskModel {
  COVARIANCE: "covariance"
  FACTOR_MODEL: "factor_model"
  SHRINKAGE: "shrinkage"
  ROBUST: "robust"
  LSTM_VAR: "lstm_var"
  GARCH: "garch"
}

export interface OptimizationRequest {
  portfolio_id: string
  objective: keyof OptimizationObjective
  risk_model?: keyof RiskModel
  lookback_days?: number
  target_return?: number
  max_position_size?: number
  constraints?: Array<Record<string, any>>
}

export interface OptimizationResult {
  id: string
  portfolio_id: string
  objective: string
  risk_model: string
  timestamp: string
  optimal_weights: Record<string, number>
  expected_return: number
  expected_volatility: number
  sharpe_ratio: number
  max_drawdown: number
  var_95: number
  performance_metrics: Record<string, number>
  risk_attribution: Record<string, number>
  constraints_met: Record<string, boolean>
  optimization_details: Record<string, any>
  recommendations: string[]
}

export interface BacktestRequest {
  strategy_config: Record<string, any>
  universe: string[]
  start_date: string
  end_date: string
  initial_capital?: number
  transaction_cost?: number
  benchmark?: string
}

export interface BacktestResult {
  id: string
  strategy_name: string
  start_date: string
  end_date: string
  total_return: number
  annual_return: number
  volatility: number
  sharpe_ratio: number
  sortino_ratio: number
  max_drawdown: number
  calmar_ratio: number
  var_95: number
  win_rate: number
  turnover: number
  transaction_costs: number
  performance_attribution: Record<string, number>
  risk_metrics: Record<string, number>
}

export interface MLInsight {
  id: string
  type: 'portfolio_optimization' | 'risk_analysis' | 'market_prediction' | 'asset_allocation'
  title: string
  description: string
  confidence: number
  impact: 'high' | 'medium' | 'low'
  recommendation: string
  data: Record<string, any>
  timestamp: string
}

export interface MarketPrediction {
  symbol: string
  current_price: number
  predicted_price_1d: number
  predicted_price_7d: number
  predicted_price_30d: number
  confidence_1d: number
  confidence_7d: number
  confidence_30d: number
  trend: 'bullish' | 'bearish' | 'neutral'
  volatility_forecast: number
  support_levels: number[]
  resistance_levels: number[]
  key_factors: string[]
}

export interface RiskAnalysis {
  portfolio_id: string
  total_risk: number
  systematic_risk: number
  idiosyncratic_risk: number
  var_95_1d: number
  var_95_7d: number
  var_99_1d: number
  expected_shortfall: number
  risk_contribution: Record<string, number>
  correlation_matrix: Record<string, Record<string, number>>
  stress_test_results: Record<string, number>
  risk_alerts: Array<{
    severity: 'high' | 'medium' | 'low'
    message: string
    recommendation: string
  }>
}

class MLAnalyticsService {
  private mlServerUrl: string
  private isServerSide: boolean = typeof window === 'undefined'

  constructor() {
    // ML Portfolio Optimizer runs on port 8001 by default
    this.mlServerUrl = process.env.ML_OPTIMIZER_URL || 'http://localhost:8001'
  }

  // Portfolio Optimization
  async optimizePortfolio(request: OptimizationRequest): Promise<OptimizationResult> {
    try {
      // Check cache first
      const cacheKey = `ml:optimization:${request.portfolio_id}:${request.objective}`
      const cached = await redisService.getCached<OptimizationResult>(cacheKey)
      
      if (cached) {
        console.log('🎯 Returning cached optimization result')
        return cached
      }

      // Make request to ML service
      const response = await fetch(`${this.mlServerUrl}/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        throw new Error(`ML optimization failed: ${response.statusText}`)
      }

      const result: OptimizationResult = await response.json()
      
      // Cache result for 5 minutes
      await redisService.cache(cacheKey, result, 300)
      
      return result
    } catch (error) {
      console.error('❌ Portfolio optimization failed:', error)
      return this.generateMockOptimizationResult(request)
    }
  }

  // Backtesting
  async runBacktest(request: BacktestRequest): Promise<BacktestResult> {
    try {
      const cacheKey = `ml:backtest:${JSON.stringify(request).slice(0, 50)}`
      const cached = await redisService.getCached<BacktestResult>(cacheKey)
      
      if (cached) {
        console.log('📊 Returning cached backtest result')
        return cached
      }

      const response = await fetch(`${this.mlServerUrl}/backtest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        throw new Error(`Backtest failed: ${response.statusText}`)
      }

      const result: BacktestResult = await response.json()
      
      // Cache result for 1 hour
      await redisService.cache(cacheKey, result, 3600)
      
      return result
    } catch (error) {
      console.error('❌ Backtest failed:', error)
      return this.generateMockBacktestResult(request)
    }
  }

  // Risk Analysis
  async analyzeRisk(portfolioId: string): Promise<RiskAnalysis> {
    try {
      const cacheKey = `ml:risk:${portfolioId}`
      const cached = await redisService.getCached<RiskAnalysis>(cacheKey)
      
      if (cached) {
        console.log('🛡️ Returning cached risk analysis')
        return cached
      }

      const response = await fetch(`${this.mlServerUrl}/risk-analysis/${portfolioId}`)
      
      if (!response.ok) {
        throw new Error(`Risk analysis failed: ${response.statusText}`)
      }

      const result: RiskAnalysis = await response.json()
      
      // Cache result for 2 minutes (risk changes frequently)
      await redisService.cache(cacheKey, result, 120)
      
      return result
    } catch (error) {
      console.error('❌ Risk analysis failed:', error)
      return this.generateMockRiskAnalysis(portfolioId)
    }
  }

  // Market Predictions
  async getMarketPredictions(symbols: string[]): Promise<MarketPrediction[]> {
    try {
      const predictions: MarketPrediction[] = []
      
      for (const symbol of symbols) {
        const cacheKey = `ml:prediction:${symbol}`
        let prediction = await redisService.getCached<MarketPrediction>(cacheKey)
        
        if (!prediction) {
          const response = await fetch(`${this.mlServerUrl}/predict/${symbol}`)
          
          if (response.ok) {
            prediction = await response.json()
            // Cache predictions for 1 hour
            await redisService.cache(cacheKey, prediction, 3600)
          } else {
            prediction = this.generateMockPrediction(symbol)
          }
        }
        
        predictions.push(prediction)
      }
      
      return predictions
    } catch (error) {
      console.error('❌ Market predictions failed:', error)
      return symbols.map(symbol => this.generateMockPrediction(symbol))
    }
  }

  // ML Insights Generation
  async generateInsights(portfolioId?: string): Promise<MLInsight[]> {
    try {
      const cacheKey = `ml:insights:${portfolioId || 'global'}`
      const cached = await redisService.getCached<MLInsight[]>(cacheKey)
      
      if (cached) {
        console.log('💡 Returning cached ML insights')
        return cached
      }

      // Combine multiple ML analyses for insights
      const [optimization, risk, predictions] = await Promise.all([
        portfolioId ? this.optimizePortfolio({
          portfolio_id: portfolioId,
          objective: 'max_sharpe'
        }) : null,
        portfolioId ? this.analyzeRisk(portfolioId) : null,
        this.getMarketPredictions(['BTC/USD', 'ETH/USD', 'AAPL', 'GOOGL'])
      ])

      const insights: MLInsight[] = []

      // Portfolio optimization insights
      if (optimization) {
        insights.push({
          id: `insight_opt_${Date.now()}`,
          type: 'portfolio_optimization',
          title: 'Portfolio Optimization Opportunity',
          description: `Current portfolio can be optimized to achieve ${(optimization.expected_return * 100).toFixed(1)}% expected return with ${(optimization.expected_volatility * 100).toFixed(1)}% volatility`,
          confidence: 0.85,
          impact: optimization.sharpe_ratio > 1.5 ? 'high' : 'medium',
          recommendation: optimization.recommendations[0] || 'Consider rebalancing based on optimization results',
          data: {
            current_sharpe: optimization.sharpe_ratio,
            expected_return: optimization.expected_return,
            optimal_weights: optimization.optimal_weights
          },
          timestamp: new Date().toISOString()
        })
      }

      // Risk insights
      if (risk) {
        const highRiskAssets = Object.entries(risk.risk_contribution)
          .filter(([, contribution]) => contribution > 0.3)
          .map(([asset]) => asset)

        if (highRiskAssets.length > 0) {
          insights.push({
            id: `insight_risk_${Date.now()}`,
            type: 'risk_analysis',
            title: 'High Risk Concentration Detected',
            description: `Assets ${highRiskAssets.join(', ')} contribute >30% to portfolio risk`,
            confidence: 0.92,
            impact: 'high',
            recommendation: 'Consider diversifying to reduce concentration risk',
            data: {
              high_risk_assets: highRiskAssets,
              total_risk: risk.total_risk,
              var_95: risk.var_95_1d
            },
            timestamp: new Date().toISOString()
          })
        }
      }

      // Market prediction insights
      const bullishAssets = predictions.filter(p => p.trend === 'bullish' && p.confidence_7d > 0.7)
      if (bullishAssets.length > 0) {
        insights.push({
          id: `insight_market_${Date.now()}`,
          type: 'market_prediction',
          title: 'Strong Bullish Signals Detected',
          description: `${bullishAssets.length} assets showing strong bullish momentum with >70% confidence`,
          confidence: Math.max(...bullishAssets.map(a => a.confidence_7d)),
          impact: 'medium',
          recommendation: 'Consider increasing allocation to assets with strong bullish signals',
          data: {
            bullish_assets: bullishAssets.map(a => ({
              symbol: a.symbol,
              predicted_return: ((a.predicted_price_7d - a.current_price) / a.current_price * 100).toFixed(1),
              confidence: a.confidence_7d
            }))
          },
          timestamp: new Date().toISOString()
        })
      }

      // Cache insights for 10 minutes
      await redisService.cache(cacheKey, insights, 600)
      
      return insights
    } catch (error) {
      console.error('❌ Insights generation failed:', error)
      return this.generateMockInsights()
    }
  }

  // Mock data generators for fallback
  private generateMockOptimizationResult(request: OptimizationRequest): OptimizationResult {
    return {
      id: `opt_${Date.now()}`,
      portfolio_id: request.portfolio_id,
      objective: request.objective,
      risk_model: request.risk_model || 'covariance',
      timestamp: new Date().toISOString(),
      optimal_weights: {
        'BTC/USD': 0.4,
        'ETH/USD': 0.3,
        'AAPL': 0.2,
        'GOOGL': 0.1
      },
      expected_return: 0.15,
      expected_volatility: 0.22,
      sharpe_ratio: 0.68,
      max_drawdown: 0.18,
      var_95: 0.045,
      performance_metrics: {
        annual_return: 0.15,
        volatility: 0.22,
        sortino_ratio: 0.75
      },
      risk_attribution: {
        'BTC/USD': 0.45,
        'ETH/USD': 0.35,
        'AAPL': 0.15,
        'GOOGL': 0.05
      },
      constraints_met: {
        max_position_size: true,
        target_return: true
      },
      optimization_details: {
        iterations: 150,
        convergence: true,
        solver: 'SLSQP'
      },
      recommendations: [
        'Increase BTC allocation for better risk-adjusted returns',
        'Consider reducing correlation between crypto assets',
        'Monitor volatility levels closely'
      ]
    }
  }

  private generateMockBacktestResult(request: BacktestRequest): BacktestResult {
    return {
      id: `backtest_${Date.now()}`,
      strategy_name: request.strategy_config.name || 'ML Strategy',
      start_date: request.start_date,
      end_date: request.end_date,
      total_return: 0.285,
      annual_return: 0.156,
      volatility: 0.198,
      sharpe_ratio: 0.789,
      sortino_ratio: 1.045,
      max_drawdown: 0.142,
      calmar_ratio: 1.099,
      var_95: 0.032,
      win_rate: 0.634,
      turnover: 0.445,
      transaction_costs: 0.012,
      performance_attribution: {
        asset_selection: 0.089,
        timing: 0.034,
        interaction: 0.012
      },
      risk_metrics: {
        beta: 0.78,
        alpha: 0.034,
        tracking_error: 0.045
      }
    }
  }

  private generateMockRiskAnalysis(portfolioId: string): RiskAnalysis {
    return {
      portfolio_id: portfolioId,
      total_risk: 0.195,
      systematic_risk: 0.134,
      idiosyncratic_risk: 0.061,
      var_95_1d: 0.028,
      var_95_7d: 0.074,
      var_99_1d: 0.041,
      expected_shortfall: 0.036,
      risk_contribution: {
        'BTC/USD': 0.42,
        'ETH/USD': 0.31,
        'AAPL': 0.18,
        'GOOGL': 0.09
      },
      correlation_matrix: {
        'BTC/USD': { 'BTC/USD': 1.0, 'ETH/USD': 0.78, 'AAPL': 0.23, 'GOOGL': 0.19 },
        'ETH/USD': { 'BTC/USD': 0.78, 'ETH/USD': 1.0, 'AAPL': 0.21, 'GOOGL': 0.17 },
        'AAPL': { 'BTC/USD': 0.23, 'ETH/USD': 0.21, 'AAPL': 1.0, 'GOOGL': 0.67 },
        'GOOGL': { 'BTC/USD': 0.19, 'ETH/USD': 0.17, 'AAPL': 0.67, 'GOOGL': 1.0 }
      },
      stress_test_results: {
        market_crash: -0.234,
        crypto_winter: -0.445,
        tech_selloff: -0.167
      },
      risk_alerts: [
        {
          severity: 'medium',
          message: 'High crypto correlation detected',
          recommendation: 'Consider diversifying beyond crypto assets'
        }
      ]
    }
  }

  private generateMockPrediction(symbol: string): MarketPrediction {
    const currentPrice = symbol.includes('BTC') ? 117000 : 
                        symbol.includes('ETH') ? 3800 :
                        symbol === 'AAPL' ? 195 : 145

    return {
      symbol,
      current_price: currentPrice,
      predicted_price_1d: currentPrice * (1 + (Math.random() - 0.5) * 0.03),
      predicted_price_7d: currentPrice * (1 + (Math.random() - 0.5) * 0.12),
      predicted_price_30d: currentPrice * (1 + (Math.random() - 0.5) * 0.25),
      confidence_1d: 0.7 + Math.random() * 0.25,
      confidence_7d: 0.6 + Math.random() * 0.3,
      confidence_30d: 0.4 + Math.random() * 0.4,
      trend: Math.random() > 0.5 ? 'bullish' : Math.random() > 0.3 ? 'bearish' : 'neutral',
      volatility_forecast: 0.15 + Math.random() * 0.2,
      support_levels: [currentPrice * 0.95, currentPrice * 0.9, currentPrice * 0.85],
      resistance_levels: [currentPrice * 1.05, currentPrice * 1.1, currentPrice * 1.15],
      key_factors: ['Market sentiment', 'Technical indicators', 'Volume analysis']
    }
  }

  private generateMockInsights(): MLInsight[] {
    return [
      {
        id: `insight_mock_${Date.now()}`,
        type: 'portfolio_optimization',
        title: 'Portfolio Rebalancing Opportunity',
        description: 'Current allocation deviates significantly from optimal weights',
        confidence: 0.82,
        impact: 'high',
        recommendation: 'Rebalance portfolio to improve risk-adjusted returns',
        data: { potential_improvement: '12.5%' },
        timestamp: new Date().toISOString()
      },
      {
        id: `insight_mock_${Date.now() + 1}`,
        type: 'risk_analysis',
        title: 'Volatility Spike Expected',
        description: 'ML models predict increased volatility in the next 7 days',
        confidence: 0.74,
        impact: 'medium',
        recommendation: 'Consider reducing position sizes or adding hedges',
        data: { expected_volatility: '28.5%' },
        timestamp: new Date().toISOString()
      }
    ]
  }
}

// Singleton export
export const mlAnalyticsService = new MLAnalyticsService()
export default mlAnalyticsService