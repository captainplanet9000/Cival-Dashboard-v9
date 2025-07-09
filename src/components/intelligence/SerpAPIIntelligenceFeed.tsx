'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Search, 
  Globe, 
  Clock, 
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  RefreshCw,
  Filter,
  DollarSign,
  Activity
} from 'lucide-react'
import { serpApiService } from '@/lib/services/serpapi-service'

interface NewsItem {
  title: string
  link: string
  snippet: string
  source: string
  date: string
  thumbnail?: string
  sentiment?: 'positive' | 'negative' | 'neutral'
  relevance_score?: number
}

interface MarketEvent {
  event_type: string
  title: string
  description: string
  date: string
  impact_level: 'low' | 'medium' | 'high'
  affected_symbols: string[]
  source: string
  url: string
}

interface SerpAPIIntelligenceFeedProps {
  symbols?: string[]
  refreshInterval?: number
  autoRefresh?: boolean
}

export function SerpAPIIntelligenceFeed({ 
  symbols = ['BTC', 'ETH', 'SPY'], 
  refreshInterval = 60000,
  autoRefresh = true 
}: SerpAPIIntelligenceFeedProps) {
  const [newsResults, setNewsResults] = useState<NewsItem[]>([])
  const [marketEvents, setMarketEvents] = useState<MarketEvent[]>([])
  const [sentimentData, setSentimentData] = useState<any>({})
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>(symbols)
  const [timeFilter, setTimeFilter] = useState<'hour' | 'day' | 'week' | 'month'>('day')
  const [sentimentFilter, setSentimentFilter] = useState<'all' | 'positive' | 'negative' | 'neutral'>('all')
  const [rateLimitStatus, setRateLimitStatus] = useState<any>({})

  useEffect(() => {
    loadIntelligenceData()
    
    if (autoRefresh) {
      const interval = setInterval(loadIntelligenceData, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [selectedSymbols, timeFilter, autoRefresh, refreshInterval])

  const loadIntelligenceData = async () => {
    try {
      setIsLoading(true)
      
      // Load all data in parallel
      const [
        newsResponse,
        eventsResponse,
        sentimentResponse,
        rateLimits
      ] = await Promise.all([
        serpApiService.searchFinancialNews('market news', selectedSymbols),
        serpApiService.searchMarketEvents('market events'),
        serpApiService.monitorMarketSentiment(selectedSymbols),
        serpApiService.getRateLimitStatus()
      ])

      if (newsResponse.success && newsResponse.data) {
        setNewsResults(newsResponse.data)
      }

      if (eventsResponse.success && eventsResponse.data) {
        setMarketEvents(eventsResponse.data)
      }

      if (sentimentResponse.success && sentimentResponse.data) {
        setSentimentData(sentimentResponse.data)
      }

      setRateLimitStatus(rateLimits)
      
    } catch (error) {
      console.error('Failed to load intelligence data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    
    setIsLoading(true)
    try {
      const response = await serpApiService.searchFinancialNews(searchQuery, selectedSymbols)
      if (response.success && response.data) {
        setNewsResults(response.data)
      }
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSymbolToggle = (symbol: string) => {
    setSelectedSymbols(prev => 
      prev.includes(symbol) 
        ? prev.filter(s => s !== symbol)
        : [...prev, symbol]
    )
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600'
      case 'negative': return 'text-red-600'
      case 'neutral': return 'text-gray-600'
      default: return 'text-gray-600'
    }
  }

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return <TrendingUp className="w-4 h-4" />
      case 'negative': return <TrendingDown className="w-4 h-4" />
      case 'neutral': return <Activity className="w-4 h-4" />
      default: return <Activity className="w-4 h-4" />
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredNews = newsResults.filter(item => {
    if (sentimentFilter === 'all') return true
    return item.sentiment === sentimentFilter
  })

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffDays > 0) return `${diffDays}d ago`
    if (diffHours > 0) return `${diffHours}h ago`
    if (diffMins > 0) return `${diffMins}m ago`
    return 'Just now'
  }

  if (isLoading && newsResults.length === 0) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-300 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-300 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center">
            <Globe className="w-6 h-6 mr-2 text-blue-600" />
            SerpAPI Intelligence Feed
          </h2>
          <p className="text-gray-600">Real-time market intelligence and web analysis</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadIntelligenceData}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => serpApiService.clearCache()}
          >
            Clear Cache
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="w-5 h-5 mr-2" />
            Search & Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex gap-2">
              <Input
                placeholder="Search financial news..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch} disabled={isLoading}>
                <Search className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Time Filter</label>
                <select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="hour">Last Hour</option>
                  <option value="day">Last Day</option>
                  <option value="week">Last Week</option>
                  <option value="month">Last Month</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Sentiment Filter</label>
                <select
                  value={sentimentFilter}
                  onChange={(e) => setSentimentFilter(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="all">All Sentiment</option>
                  <option value="positive">Positive</option>
                  <option value="negative">Negative</option>
                  <option value="neutral">Neutral</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Symbols</label>
                <div className="flex flex-wrap gap-1">
                  {['BTC', 'ETH', 'SPY', 'AAPL', 'TSLA', 'GOOGL'].map(symbol => (
                    <Badge
                      key={symbol}
                      variant={selectedSymbols.includes(symbol) ? "default" : "outline"}
                      className="cursor-pointer text-xs"
                      onClick={() => handleSymbolToggle(symbol)}
                    >
                      {symbol}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rate Limit Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="w-5 h-5 mr-2" />
            Usage Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Requests/Hour</p>
              <p className="text-2xl font-bold">
                {rateLimitStatus.hour?.current || 0} / {rateLimitStatus.hour?.limit || 5000}
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ 
                    width: `${((rateLimitStatus.hour?.current || 0) / (rateLimitStatus.hour?.limit || 5000)) * 100}%` 
                  }}
                ></div>
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-600">Daily Cost</p>
              <p className="text-2xl font-bold">
                ${(rateLimitStatus.daily_cost?.current || 0).toFixed(2)} / ${rateLimitStatus.daily_cost?.limit || 15}
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{ 
                    width: `${((rateLimitStatus.daily_cost?.current || 0) / (rateLimitStatus.daily_cost?.limit || 15)) * 100}%` 
                  }}
                ></div>
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-600">Cache Hit Rate</p>
              <p className="text-2xl font-bold">65%</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div className="bg-purple-600 h-2 rounded-full" style={{ width: '65%' }}></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Market Events */}
      {marketEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              Market Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {marketEvents.slice(0, 5).map((event, index) => (
                <div key={index} className="border rounded-lg p-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {event.event_type}
                      </Badge>
                      <Badge className={`text-xs ${getImpactColor(event.impact_level)}`}>
                        {event.impact_level} impact
                      </Badge>
                    </div>
                    <span className="text-xs text-gray-500">{formatTimeAgo(event.date)}</span>
                  </div>
                  
                  <h4 className="font-medium text-sm mb-1">{event.title}</h4>
                  <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Symbols:</span>
                      <div className="flex gap-1">
                        {event.affected_symbols.slice(0, 3).map(symbol => (
                          <Badge key={symbol} variant="outline" className="text-xs">
                            {symbol}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <a 
                      href={event.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-xs flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      {event.source}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sentiment Overview */}
      {Object.keys(sentimentData).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Sentiment Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(sentimentData).map(([symbol, data]: [string, any]) => (
                <div key={symbol} className="text-center p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">{symbol}</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-green-600">Positive</span>
                      <span className="text-sm font-medium">{data.positive}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-red-600">Negative</span>
                      <span className="text-sm font-medium">{data.negative}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Neutral</span>
                      <span className="text-sm font-medium">{data.neutral}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* News Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Globe className="w-5 h-5 mr-2" />
            Financial News Feed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredNews.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No news found matching your filters</p>
                <p className="text-sm">Try adjusting your search or filters</p>
              </div>
            ) : (
              filteredNews.map((item, index) => (
                <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`flex items-center gap-1 ${getSentimentColor(item.sentiment || 'neutral')}`}>
                        {getSentimentIcon(item.sentiment || 'neutral')}
                        <span className="text-xs capitalize">{item.sentiment || 'neutral'}</span>
                      </div>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-gray-500">{formatTimeAgo(item.date)}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {item.source}
                    </Badge>
                  </div>
                  
                  <h3 className="font-medium mb-2 hover:text-blue-600 cursor-pointer">
                    <a href={item.link} target="_blank" rel="noopener noreferrer">
                      {item.title}
                    </a>
                  </h3>
                  
                  <p className="text-sm text-gray-600 mb-3">{item.snippet}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {item.relevance_score && (
                        <Badge variant="secondary" className="text-xs">
                          {Math.round(item.relevance_score * 100)}% relevant
                        </Badge>
                      )}
                    </div>
                    <a 
                      href={item.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-xs flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Read more
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}