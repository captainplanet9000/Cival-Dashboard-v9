"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RefreshCw, TrendingUp, TrendingDown, Minus, Target, AlertTriangle } from 'lucide-react'
import { MarketPrediction } from '@/lib/services/ml-analytics-service'

interface MarketPredictionsProps {
  className?: string
}

export function MarketPredictions({ className = "" }: MarketPredictionsProps) {
  const [predictions, setPredictions] = useState<MarketPrediction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [symbols, setSymbols] = useState('BTC/USD,ETH/USD,AAPL,GOOGL,MSFT')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchPredictions = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/analytics/predictions?symbols=${encodeURIComponent(symbols)}`)
      const data = await response.json()
      
      if (data.success) {
        setPredictions(data.predictions)
        setLastUpdated(new Date())
      } else {
        setError(data.error || 'Failed to fetch predictions')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPredictions()
  }, [])

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'bullish': return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'bearish': return <TrendingDown className="h-4 w-4 text-red-600" />
      case 'neutral': return <Minus className="h-4 w-4 text-gray-600" />
      default: return <Minus className="h-4 w-4 text-gray-600" />
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'bullish': return 'bg-green-100 text-green-800 border-green-200'
      case 'bearish': return 'bg-red-100 text-red-800 border-red-200'
      case 'neutral': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600'
    if (confidence >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const calculateReturn = (current: number, predicted: number) => {
    return ((predicted - current) / current * 100).toFixed(2)
  }

  const formatPrice = (price: number, symbol: string) => {
    if (symbol.includes('USD')) {
      return `$${price.toLocaleString()}`
    }
    return `$${price.toFixed(2)}`
  }

  const handleRefresh = () => {
    fetchPredictions()
  }

  const handleSymbolsChange = (newSymbols: string) => {
    setSymbols(newSymbols)
  }

  const handleUpdateSymbols = () => {
    fetchPredictions()
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Market Predictions
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        
        <div className="flex gap-2">
          <Input
            placeholder="Enter symbols (comma-separated)"
            value={symbols}
            onChange={(e) => handleSymbolsChange(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleUpdateSymbols} size="sm">
            Update
          </Button>
        </div>
        
        {lastUpdated && (
          <p className="text-sm text-muted-foreground">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        )}
      </CardHeader>
      
      <CardContent>
        {error && (
          <div className="rounded-lg bg-red-50 p-4 border border-red-200 mb-4">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error Loading Predictions</h3>
                <p className="mt-2 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {loading && !error && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && predictions.length === 0 && (
          <div className="text-center py-8">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Predictions Available</h3>
            <p className="text-gray-500">
              Try different symbols or check back later.
            </p>
          </div>
        )}

        {!loading && !error && predictions.length > 0 && (
          <div className="space-y-4">
            {predictions.map((prediction) => (
              <div
                key={prediction.symbol}
                className="rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-lg">{prediction.symbol}</h3>
                    <Badge className={getTrendColor(prediction.trend)}>
                      <div className="flex items-center gap-1">
                        {getTrendIcon(prediction.trend)}
                        {prediction.trend}
                      </div>
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold">
                      {formatPrice(prediction.current_price, prediction.symbol)}
                    </div>
                    <div className="text-sm text-gray-500">Current Price</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {/* 1 Day Prediction */}
                  <div className="text-center p-3 rounded-lg bg-blue-50 border border-blue-200">
                    <div className="text-lg font-semibold text-blue-700">
                      {formatPrice(prediction.predicted_price_1d, prediction.symbol)}
                    </div>
                    <div className="text-sm text-blue-600">1 Day</div>
                    <div className={`text-sm font-medium ${
                      parseFloat(calculateReturn(prediction.current_price, prediction.predicted_price_1d)) >= 0 
                        ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {calculateReturn(prediction.current_price, prediction.predicted_price_1d)}%
                    </div>
                    <div className={`text-xs ${getConfidenceColor(prediction.confidence_1d)}`}>
                      {(prediction.confidence_1d * 100).toFixed(0)}% confidence
                    </div>
                  </div>

                  {/* 7 Day Prediction */}
                  <div className="text-center p-3 rounded-lg bg-green-50 border border-green-200">
                    <div className="text-lg font-semibold text-green-700">
                      {formatPrice(prediction.predicted_price_7d, prediction.symbol)}
                    </div>
                    <div className="text-sm text-green-600">7 Days</div>
                    <div className={`text-sm font-medium ${
                      parseFloat(calculateReturn(prediction.current_price, prediction.predicted_price_7d)) >= 0 
                        ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {calculateReturn(prediction.current_price, prediction.predicted_price_7d)}%
                    </div>
                    <div className={`text-xs ${getConfidenceColor(prediction.confidence_7d)}`}>
                      {(prediction.confidence_7d * 100).toFixed(0)}% confidence
                    </div>
                  </div>

                  {/* 30 Day Prediction */}
                  <div className="text-center p-3 rounded-lg bg-purple-50 border border-purple-200">
                    <div className="text-lg font-semibold text-purple-700">
                      {formatPrice(prediction.predicted_price_30d, prediction.symbol)}
                    </div>
                    <div className="text-sm text-purple-600">30 Days</div>
                    <div className={`text-sm font-medium ${
                      parseFloat(calculateReturn(prediction.current_price, prediction.predicted_price_30d)) >= 0 
                        ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {calculateReturn(prediction.current_price, prediction.predicted_price_30d)}%
                    </div>
                    <div className={`text-xs ${getConfidenceColor(prediction.confidence_30d)}`}>
                      {(prediction.confidence_30d * 100).toFixed(0)}% confidence
                    </div>
                  </div>
                </div>

                {/* Support and Resistance Levels */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Support Levels</h4>
                    <div className="flex flex-wrap gap-1">
                      {prediction.support_levels.map((level, index) => (
                        <Badge key={index} variant="outline" className="text-green-700 border-green-300">
                          {formatPrice(level, prediction.symbol)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Resistance Levels</h4>
                    <div className="flex flex-wrap gap-1">
                      {prediction.resistance_levels.map((level, index) => (
                        <Badge key={index} variant="outline" className="text-red-700 border-red-300">
                          {formatPrice(level, prediction.symbol)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Key Factors */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Key Factors</h4>
                  <div className="flex flex-wrap gap-1">
                    {prediction.key_factors.map((factor, index) => (
                      <Badge key={index} variant="secondary">
                        {factor}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Volatility Forecast */}
                <div className="mt-3 text-sm text-gray-600">
                  <span className="font-medium">Volatility Forecast:</span> {(prediction.volatility_forecast * 100).toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}