/**
 * SerpAPI Service for Trading Intelligence
 * Provides web intelligence and market data through SerpAPI with proper rate limiting
 */

import { URLSearchParams } from 'url'

export interface SerpAPIRequest {
  query: string
  search_type?: 'search' | 'news' | 'shopping' | 'images' | 'videos'
  location?: string
  language?: string
  num_results?: number
  time_period?: 'hour' | 'day' | 'week' | 'month' | 'year'
  safe_search?: 'active' | 'moderate' | 'off'
  task_type?: 'financial_news' | 'sentiment_analysis' | 'company_research' | 'regulatory_updates' | 'market_events'
}

export interface SerpAPIResponse<T = any> {
  success: boolean
  data?: T
  organic_results?: any[]
  news_results?: any[]
  shopping_results?: any[]
  search_metadata?: any
  search_parameters?: any
  error?: string
  cost_estimate: number
  response_time: number
  cached: boolean
  timestamp: Date
}

export interface MarketNewsResult {
  title: string
  link: string
  snippet: string
  source: string
  date: string
  thumbnail?: string
  sentiment?: 'positive' | 'negative' | 'neutral'
  relevance_score?: number
}

export interface CompanyResearchResult {
  company_name: string
  ticker?: string
  description: string
  key_metrics: { [key: string]: any }
  recent_news: MarketNewsResult[]
  financial_data?: any
  analyst_ratings?: any
}

export interface MarketEventResult {
  event_type: string
  title: string
  description: string
  date: string
  impact_level: 'low' | 'medium' | 'high'
  affected_symbols: string[]
  source: string
  url: string
}

export class SerpAPIService {
  private readonly apiKey: string
  private readonly baseUrl = 'https://serpapi.com/search'
  private readonly costPerSearch = 0.01 // $0.01 per search (Production plan)
  
  // Rate limiting and caching
  private rateLimiter: Map<string, { count: number; resetTime: number }> = new Map()
  private requestCache: Map<string, { response: any; timestamp: number; ttl: number }> = new Map()
  private readonly MAX_REQUESTS_PER_MINUTE = 100
  private readonly MAX_REQUESTS_PER_HOUR = 5000
  private readonly MAX_DAILY_COST = 15.0 // $15 daily limit
  private dailyCostTracker: { date: string; totalCost: number } = { date: '', totalCost: 0 }
  
  // Intelligent caching TTL by task type
  private readonly CACHE_TTL = {
    'financial_news': 2 * 60 * 1000, // 2 minutes for news
    'sentiment_analysis': 5 * 60 * 1000, // 5 minutes for sentiment
    'company_research': 15 * 60 * 1000, // 15 minutes for company data
    'regulatory_updates': 30 * 60 * 1000, // 30 minutes for regulatory
    'market_events': 1 * 60 * 1000, // 1 minute for events
    'default': 10 * 60 * 1000 // 10 minutes default
  }

  constructor() {
    this.apiKey = process.env.SERPAPI_API_KEY || ''
    if (!this.apiKey) {
      console.warn('SERPAPI_API_KEY not found in environment variables')
    }
  }

  /**
   * Make a search request to SerpAPI with rate limiting and caching
   */
  public async search(params: SerpAPIRequest): Promise<SerpAPIResponse> {
    const startTime = Date.now()
    
    try {
      // Generate cache key
      const cacheKey = this.generateCacheKey(params)
      
      // Check cache first
      const cachedResponse = this.getCachedResponse(cacheKey, params.task_type)
      if (cachedResponse) {
        console.log(`SerpAPI cache hit for ${params.task_type}: ${params.query.substring(0, 50)}...`)
        return {
          ...cachedResponse,
          cached: true,
          timestamp: new Date()
        }
      }

      // Check rate limits
      const rateLimitCheck = this.checkRateLimit()
      if (!rateLimitCheck.allowed) {
        return {
          success: false,
          error: `Rate limit exceeded: ${rateLimitCheck.reason}`,
          cost_estimate: 0,
          response_time: Date.now() - startTime,
          cached: false,
          timestamp: new Date()
        }
      }

      // Check daily cost limit
      const dailyCostCheck = this.checkDailyCostLimit()
      if (!dailyCostCheck.allowed) {
        return {
          success: false,
          error: `Daily cost limit exceeded: $${this.dailyCostTracker.totalCost.toFixed(2)}`,
          cost_estimate: 0,
          response_time: Date.now() - startTime,
          cached: false,
          timestamp: new Date()
        }
      }

      // Build search parameters
      const searchParams = this.buildSearchParams(params)
      
      // Make the request
      const response = await fetch(`${this.baseUrl}?${searchParams}`)
      
      if (!response.ok) {
        throw new Error(`SerpAPI request failed: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      const responseTime = Date.now() - startTime

      // Update rate limiter and cost tracking
      this.updateRateLimit()
      this.trackCost(this.costPerSearch)

      const result: SerpAPIResponse = {
        success: true,
        data,
        organic_results: data.organic_results || [],
        news_results: data.news_results || [],
        shopping_results: data.shopping_results || [],
        search_metadata: data.search_metadata || {},
        search_parameters: data.search_parameters || {},
        cost_estimate: this.costPerSearch,
        response_time: responseTime,
        cached: false,
        timestamp: new Date()
      }

      // Cache the response
      this.cacheResponse(cacheKey, result, params.task_type)

      return result
    } catch (error) {
      const responseTime = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      return {
        success: false,
        error: errorMessage,
        cost_estimate: 0,
        response_time: responseTime,
        cached: false,
        timestamp: new Date()
      }
    }
  }

  /**
   * Search financial news for specific symbols or topics
   */
  public async searchFinancialNews(query: string, symbols?: string[]): Promise<SerpAPIResponse<MarketNewsResult[]>> {
    const searchQuery = symbols ? `${query} ${symbols.join(' OR ')}` : query
    
    const params: SerpAPIRequest = {
      query: `${searchQuery} finance news`,
      search_type: 'news',
      time_period: 'day',
      num_results: 20,
      task_type: 'financial_news'
    }

    const response = await this.search(params)
    
    if (response.success && response.news_results) {
      const processedResults = response.news_results.map(item => ({
        title: item.title || '',
        link: item.link || '',
        snippet: item.snippet || '',
        source: item.source || '',
        date: item.date || '',
        thumbnail: item.thumbnail,
        sentiment: this.analyzeSentiment(item.title + ' ' + item.snippet),
        relevance_score: this.calculateRelevanceScore(item, symbols)
      }))

      return {
        ...response,
        data: processedResults
      }
    }

    return response
  }

  /**
   * Search for company research and fundamentals
   */
  public async searchCompanyResearch(companyName: string, ticker?: string): Promise<SerpAPIResponse<CompanyResearchResult>> {
    const searchQuery = ticker ? `${companyName} ${ticker}` : companyName
    
    const params: SerpAPIRequest = {
      query: `${searchQuery} company profile financials earnings`,
      search_type: 'search',
      num_results: 10,
      task_type: 'company_research'
    }

    const response = await this.search(params)
    
    if (response.success && response.organic_results) {
      // Get recent news about the company
      const newsResponse = await this.searchFinancialNews(companyName, ticker ? [ticker] : undefined)
      
      const companyData: CompanyResearchResult = {
        company_name: companyName,
        ticker: ticker,
        description: this.extractCompanyDescription(response.organic_results),
        key_metrics: this.extractKeyMetrics(response.organic_results),
        recent_news: newsResponse.data || [],
        financial_data: this.extractFinancialData(response.organic_results),
        analyst_ratings: this.extractAnalystRatings(response.organic_results)
      }

      return {
        ...response,
        data: companyData
      }
    }

    return response
  }

  /**
   * Search for regulatory updates and SEC filings
   */
  public async searchRegulatoryUpdates(query: string): Promise<SerpAPIResponse<any[]>> {
    const params: SerpAPIRequest = {
      query: `${query} SEC filing regulatory update`,
      search_type: 'search',
      num_results: 15,
      task_type: 'regulatory_updates'
    }

    const response = await this.search(params)
    
    if (response.success && response.organic_results) {
      const processedResults = response.organic_results
        .filter(item => this.isRegulatorySource(item.source))
        .map(item => ({
          title: item.title,
          link: item.link,
          snippet: item.snippet,
          source: item.source,
          date: item.date,
          filing_type: this.extractFilingType(item.title),
          importance: this.assessRegulatoryImportance(item)
        }))

      return {
        ...response,
        data: processedResults
      }
    }

    return response
  }

  /**
   * Search for market events and breaking news
   */
  public async searchMarketEvents(query: string): Promise<SerpAPIResponse<MarketEventResult[]>> {
    const params: SerpAPIRequest = {
      query: `${query} market breaking news alert`,
      search_type: 'news',
      time_period: 'hour',
      num_results: 30,
      task_type: 'market_events'
    }

    const response = await this.search(params)
    
    if (response.success && response.news_results) {
      const processedResults = response.news_results
        .filter(item => this.isMarketEvent(item))
        .map(item => ({
          event_type: this.classifyEventType(item.title),
          title: item.title,
          description: item.snippet,
          date: item.date,
          impact_level: this.assessImpactLevel(item),
          affected_symbols: this.extractAffectedSymbols(item),
          source: item.source,
          url: item.link
        }))

      return {
        ...response,
        data: processedResults
      }
    }

    return response
  }

  /**
   * Monitor market sentiment from social media and news
   */
  public async monitorMarketSentiment(symbols: string[]): Promise<SerpAPIResponse<any>> {
    const searchQuery = symbols.map(symbol => `${symbol} sentiment`).join(' OR ')
    
    const params: SerpAPIRequest = {
      query: `${searchQuery} market sentiment social media`,
      search_type: 'search',
      num_results: 25,
      task_type: 'sentiment_analysis'
    }

    const response = await this.search(params)
    
    if (response.success && response.organic_results) {
      const sentimentData = this.analyzeBulkSentiment(response.organic_results, symbols)
      
      return {
        ...response,
        data: sentimentData
      }
    }

    return response
  }

  // Private helper methods

  private generateCacheKey(params: SerpAPIRequest): string {
    const keyData = {
      query: params.query,
      search_type: params.search_type,
      time_period: params.time_period,
      num_results: params.num_results,
      location: params.location
    }
    
    return Buffer.from(JSON.stringify(keyData)).toString('base64')
  }

  private getCachedResponse(cacheKey: string, taskType?: string): SerpAPIResponse | null {
    const cached = this.requestCache.get(cacheKey)
    if (!cached) return null

    const now = Date.now()
    const ttl = this.CACHE_TTL[taskType as keyof typeof this.CACHE_TTL] || this.CACHE_TTL.default

    if (now - cached.timestamp > ttl) {
      this.requestCache.delete(cacheKey)
      return null
    }

    return cached.response
  }

  private cacheResponse(cacheKey: string, response: SerpAPIResponse, taskType?: string): void {
    const ttl = this.CACHE_TTL[taskType as keyof typeof this.CACHE_TTL] || this.CACHE_TTL.default
    
    this.requestCache.set(cacheKey, {
      response,
      timestamp: Date.now(),
      ttl
    })

    // Clean up old cache entries
    this.cleanupCache()
  }

  private cleanupCache(): void {
    const now = Date.now()
    
    for (const [key, cached] of this.requestCache) {
      if (now - cached.timestamp > cached.ttl) {
        this.requestCache.delete(key)
      }
    }
  }

  private checkRateLimit(): { allowed: boolean; reason?: string } {
    const now = Date.now()
    const minuteWindow = 60 * 1000
    const hourWindow = 60 * 60 * 1000
    
    // Check minute limit
    const minuteKey = `minute_${Math.floor(now / minuteWindow)}`
    const minuteLimit = this.rateLimiter.get(minuteKey)
    if (minuteLimit && minuteLimit.count >= this.MAX_REQUESTS_PER_MINUTE) {
      return { allowed: false, reason: 'Minute limit exceeded' }
    }

    // Check hour limit
    const hourKey = `hour_${Math.floor(now / hourWindow)}`
    const hourLimit = this.rateLimiter.get(hourKey)
    if (hourLimit && hourLimit.count >= this.MAX_REQUESTS_PER_HOUR) {
      return { allowed: false, reason: 'Hour limit exceeded' }
    }

    return { allowed: true }
  }

  private updateRateLimit(): void {
    const now = Date.now()
    const minuteWindow = 60 * 1000
    const hourWindow = 60 * 60 * 1000
    
    // Update minute counter
    const minuteKey = `minute_${Math.floor(now / minuteWindow)}`
    const minuteLimit = this.rateLimiter.get(minuteKey) || { count: 0, resetTime: now + minuteWindow }
    minuteLimit.count++
    this.rateLimiter.set(minuteKey, minuteLimit)

    // Update hour counter
    const hourKey = `hour_${Math.floor(now / hourWindow)}`
    const hourLimit = this.rateLimiter.get(hourKey) || { count: 0, resetTime: now + hourWindow }
    hourLimit.count++
    this.rateLimiter.set(hourKey, hourLimit)

    // Clean up old rate limit entries
    this.cleanupRateLimiter()
  }

  private cleanupRateLimiter(): void {
    const now = Date.now()
    
    for (const [key, limit] of this.rateLimiter) {
      if (now > limit.resetTime) {
        this.rateLimiter.delete(key)
      }
    }
  }

  private checkDailyCostLimit(): { allowed: boolean; reason?: string } {
    const today = new Date().toISOString().split('T')[0]
    
    // Reset daily tracker if new day
    if (this.dailyCostTracker.date !== today) {
      this.dailyCostTracker = { date: today, totalCost: 0 }
    }

    if (this.dailyCostTracker.totalCost >= this.MAX_DAILY_COST) {
      return { allowed: false, reason: `Daily cost limit of $${this.MAX_DAILY_COST} exceeded` }
    }

    return { allowed: true }
  }

  private trackCost(cost: number): void {
    const today = new Date().toISOString().split('T')[0]
    
    // Reset daily tracker if new day
    if (this.dailyCostTracker.date !== today) {
      this.dailyCostTracker = { date: today, totalCost: 0 }
    }

    this.dailyCostTracker.totalCost += cost
  }

  private buildSearchParams(params: SerpAPIRequest): string {
    const searchParams = new URLSearchParams({
      api_key: this.apiKey,
      q: params.query,
      engine: 'google',
      num: (params.num_results || 10).toString()
    })

    if (params.search_type === 'news') {
      searchParams.set('tbm', 'nws')
    } else if (params.search_type === 'shopping') {
      searchParams.set('tbm', 'shop')
    } else if (params.search_type === 'images') {
      searchParams.set('tbm', 'isch')
    } else if (params.search_type === 'videos') {
      searchParams.set('tbm', 'vid')
    }

    if (params.location) {
      searchParams.set('location', params.location)
    }

    if (params.language) {
      searchParams.set('hl', params.language)
    }

    if (params.time_period) {
      const timeMap = {
        'hour': 'h',
        'day': 'd',
        'week': 'w',
        'month': 'm',
        'year': 'y'
      }
      searchParams.set('tbs', `qdr:${timeMap[params.time_period]}`)
    }

    if (params.safe_search) {
      searchParams.set('safe', params.safe_search)
    }

    return searchParams.toString()
  }

  // Content analysis helper methods

  private analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const positiveWords = ['gain', 'rise', 'up', 'bull', 'bullish', 'profit', 'growth', 'increase', 'strong', 'buy']
    const negativeWords = ['loss', 'fall', 'down', 'bear', 'bearish', 'decline', 'decrease', 'weak', 'sell', 'crash']
    
    const words = text.toLowerCase().split(/\s+/)
    const positiveCount = words.filter(word => positiveWords.includes(word)).length
    const negativeCount = words.filter(word => negativeWords.includes(word)).length
    
    if (positiveCount > negativeCount) return 'positive'
    if (negativeCount > positiveCount) return 'negative'
    return 'neutral'
  }

  private calculateRelevanceScore(item: any, symbols?: string[]): number {
    let score = 0.5 // Base score
    
    if (symbols) {
      const text = (item.title + ' ' + item.snippet).toLowerCase()
      const matchedSymbols = symbols.filter(symbol => text.includes(symbol.toLowerCase()))
      score += matchedSymbols.length * 0.2
    }
    
    // Boost score for financial sources
    const financialSources = ['bloomberg', 'reuters', 'cnbc', 'marketwatch', 'yahoo finance']
    if (financialSources.some(source => item.source?.toLowerCase().includes(source))) {
      score += 0.3
    }
    
    return Math.min(1.0, score)
  }

  private extractCompanyDescription(results: any[]): string {
    // Extract company description from search results
    const descriptions = results
      .filter(item => item.snippet && item.snippet.length > 50)
      .map(item => item.snippet)
      .slice(0, 3)
    
    return descriptions.join(' ').substring(0, 500)
  }

  private extractKeyMetrics(results: any[]): { [key: string]: any } {
    // Extract key financial metrics from search results
    return {
      market_cap: 'N/A',
      pe_ratio: 'N/A',
      revenue: 'N/A',
      // This would be more sophisticated in a real implementation
    }
  }

  private extractFinancialData(results: any[]): any {
    // Extract financial data from search results
    return {
      quarterly_earnings: 'N/A',
      revenue_growth: 'N/A',
      // This would be more sophisticated in a real implementation
    }
  }

  private extractAnalystRatings(results: any[]): any {
    // Extract analyst ratings from search results
    return {
      consensus_rating: 'N/A',
      price_target: 'N/A',
      // This would be more sophisticated in a real implementation
    }
  }

  private isRegulatorySource(source: string): boolean {
    const regulatorySources = ['sec.gov', 'finra.org', 'cftc.gov', 'federalreserve.gov']
    return regulatorySources.some(regSource => source.toLowerCase().includes(regSource))
  }

  private extractFilingType(title: string): string {
    const filingTypes = ['10-K', '10-Q', '8-K', '13F', 'S-1', 'Form 4']
    return filingTypes.find(type => title.includes(type)) || 'Other'
  }

  private assessRegulatoryImportance(item: any): 'low' | 'medium' | 'high' {
    const highImportanceWords = ['investigation', 'fine', 'penalty', 'violation', 'fraud']
    const mediumImportanceWords = ['filing', 'disclosure', 'report', 'amendment']
    
    const text = (item.title + ' ' + item.snippet).toLowerCase()
    
    if (highImportanceWords.some(word => text.includes(word))) return 'high'
    if (mediumImportanceWords.some(word => text.includes(word))) return 'medium'
    return 'low'
  }

  private isMarketEvent(item: any): boolean {
    const eventKeywords = ['breaking', 'alert', 'urgent', 'developing', 'just in']
    const text = (item.title + ' ' + item.snippet).toLowerCase()
    return eventKeywords.some(keyword => text.includes(keyword))
  }

  private classifyEventType(title: string): string {
    const eventTypes = {
      'earnings': ['earnings', 'eps', 'revenue', 'quarterly'],
      'merger': ['merger', 'acquisition', 'takeover', 'buyout'],
      'regulatory': ['sec', 'regulatory', 'investigation', 'fine'],
      'market': ['market', 'trading', 'volume', 'price'],
      'economic': ['fed', 'interest', 'inflation', 'gdp']
    }
    
    const lowerTitle = title.toLowerCase()
    for (const [type, keywords] of Object.entries(eventTypes)) {
      if (keywords.some(keyword => lowerTitle.includes(keyword))) {
        return type
      }
    }
    
    return 'general'
  }

  private assessImpactLevel(item: any): 'low' | 'medium' | 'high' {
    const highImpactWords = ['crash', 'surge', 'plunge', 'soar', 'breaking']
    const mediumImpactWords = ['rise', 'fall', 'gain', 'loss', 'change']
    
    const text = (item.title + ' ' + item.snippet).toLowerCase()
    
    if (highImpactWords.some(word => text.includes(word))) return 'high'
    if (mediumImpactWords.some(word => text.includes(word))) return 'medium'
    return 'low'
  }

  private extractAffectedSymbols(item: any): string[] {
    const text = (item.title + ' ' + item.snippet).toUpperCase()
    const symbolPattern = /\b[A-Z]{1,5}\b/g
    const matches = text.match(symbolPattern) || []
    
    // Filter out common non-symbol words
    const commonWords = ['THE', 'AND', 'FOR', 'ARE', 'BUT', 'NOT', 'YOU', 'ALL', 'CAN', 'NEW', 'TOP', 'GET', 'HOW', 'WHO', 'WHY', 'NOW', 'MAY', 'WAY', 'USE', 'ITS', 'OUR', 'OUT', 'DAY', 'HAS', 'HIS', 'HER', 'HAD', 'HIM', 'OLD', 'SEE', 'TWO', 'HOW', 'WHO', 'OIL', 'GAS', 'WAR', 'TAX', 'CEO', 'CFO', 'COO', 'IPO', 'ESG', 'AI', 'VR', 'AR', 'IT', 'US', 'UK', 'EU', 'GDP', 'CPI', 'FED', 'SEC', 'FDA', 'EPA', 'DOJ', 'FBI', 'CIA', 'NSA', 'IRS', 'LLC', 'INC', 'LTD', 'PLC', 'SA', 'NV', 'AG', 'SE', 'KG', 'CO', 'AB', 'AS', 'OY', 'SPA', 'BV', 'GV', 'CV', 'SL', 'SRL', 'SAS', 'SARL', 'EURL', 'SASU', 'SNC', 'SCS', 'SCA', 'SCM', 'GIE', 'EIG', 'GAEC', 'EARL', 'SCEA', 'SAOS', 'CUMA', 'SIRET', 'SIREN', 'APE', 'NAF', 'NACE', 'ISIC', 'NAICS', 'SIC', 'GICS', 'ICB', 'TRBC', 'BICS', 'FIGI', 'LEI', 'ISIN', 'CUSIP', 'SEDOL', 'RIC', 'FIGI', 'MIC', 'CFI', 'ANNA', 'ESMA', 'IOSCO', 'ISDA', 'FPML', 'XBRL', 'GLEIF', 'SWIFT', 'BIC', 'IBAN', 'ABA', 'ACH', 'WIRE', 'SEPA', 'TARGET', 'CHIPS', 'FEDWIRE', 'CHAPS', 'RTGS', 'LVTS', 'SPEI', 'CLS', 'EUREX', 'CME', 'CBOT', 'NYMEX', 'COMEX', 'ICE', 'LME', 'TOCOM', 'SGX', 'HKEX', 'LSE', 'EURONEXT', 'XETRA', 'SIX', 'OMX', 'MOEX', 'BSE', 'NSE', 'TSE', 'OSE', 'KRX', 'TWSE', 'SET', 'IDX', 'BM', 'BVMF', 'BYMA', 'BVC', 'BVL', 'BVPASA', 'EGX', 'JSE', 'NSX', 'ASX', 'NZX', 'PFTS', 'KASE', 'BCSE', 'BIST', 'TADAWUL', 'QE', 'ADX', 'DFM', 'MSM', 'BSE', 'CSE', 'DSE', 'COSE', 'GSE', 'MSE', 'USE', 'ZSE', 'BRVM', 'BVMT', 'CASE', 'DSE', 'EGS', 'FSE', 'GSE', 'HSE', 'LSE', 'MSE', 'NSE', 'RSE', 'SSE', 'TSE', 'USE', 'VSE', 'WSE', 'YSE', 'ZSE']
    
    return matches.filter(match => 
      match.length >= 2 && 
      match.length <= 5 && 
      !commonWords.includes(match)
    ).slice(0, 5) // Limit to 5 symbols
  }

  private analyzeBulkSentiment(results: any[], symbols: string[]): any {
    const sentimentData: { [symbol: string]: { positive: number; negative: number; neutral: number } } = {}
    
    for (const symbol of symbols) {
      sentimentData[symbol] = { positive: 0, negative: 0, neutral: 0 }
    }
    
    for (const item of results) {
      const text = item.title + ' ' + item.snippet
      const sentiment = this.analyzeSentiment(text)
      
      for (const symbol of symbols) {
        if (text.toLowerCase().includes(symbol.toLowerCase())) {
          sentimentData[symbol][sentiment]++
        }
      }
    }
    
    return sentimentData
  }

  /**
   * Get rate limit status
   */
  public getRateLimitStatus(): {
    minute: { current: number; limit: number; remaining: number }
    hour: { current: number; limit: number; remaining: number }
    daily_cost: { current: number; limit: number; remaining: number }
  } {
    const now = Date.now()
    const minuteWindow = 60 * 1000
    const hourWindow = 60 * 60 * 1000
    
    const minuteKey = `minute_${Math.floor(now / minuteWindow)}`
    const hourKey = `hour_${Math.floor(now / hourWindow)}`
    
    const minuteLimit = this.rateLimiter.get(minuteKey)
    const hourLimit = this.rateLimiter.get(hourKey)
    
    const minuteCurrent = minuteLimit ? minuteLimit.count : 0
    const hourCurrent = hourLimit ? hourLimit.count : 0
    
    // Check daily cost
    const today = new Date().toISOString().split('T')[0]
    const dailyCost = this.dailyCostTracker.date === today ? this.dailyCostTracker.totalCost : 0
    
    return {
      minute: {
        current: minuteCurrent,
        limit: this.MAX_REQUESTS_PER_MINUTE,
        remaining: this.MAX_REQUESTS_PER_MINUTE - minuteCurrent
      },
      hour: {
        current: hourCurrent,
        limit: this.MAX_REQUESTS_PER_HOUR,
        remaining: this.MAX_REQUESTS_PER_HOUR - hourCurrent
      },
      daily_cost: {
        current: dailyCost,
        limit: this.MAX_DAILY_COST,
        remaining: this.MAX_DAILY_COST - dailyCost
      }
    }
  }

  /**
   * Get cache statistics
   */
  public getCacheStatistics(): {
    total_entries: number
    cache_hit_rate: number
    cache_size_mb: number
    entries_by_type: { [key: string]: number }
  } {
    const totalEntries = this.requestCache.size
    const cacheSizeEstimate = JSON.stringify(Array.from(this.requestCache.entries())).length / (1024 * 1024)
    
    return {
      total_entries: totalEntries,
      cache_hit_rate: 0.65, // Would be calculated from actual metrics
      cache_size_mb: cacheSizeEstimate,
      entries_by_type: {} // Would be calculated from actual cache data
    }
  }

  /**
   * Clear cache manually
   */
  public clearCache(): void {
    this.requestCache.clear()
    console.log('SerpAPI cache cleared')
  }

  /**
   * Health check for the service
   */
  public async healthCheck(): Promise<{ healthy: boolean; details: any }> {
    try {
      const testQuery = 'test market news'
      const testResponse = await this.search({
        query: testQuery,
        search_type: 'news',
        num_results: 1
      })

      const rateLimitStatus = this.getRateLimitStatus()
      const cacheStats = this.getCacheStatistics()

      return {
        healthy: testResponse.success,
        details: {
          api_key_configured: !!this.apiKey,
          test_response: testResponse.success,
          rate_limits: rateLimitStatus,
          cache_stats: cacheStats,
          daily_cost_limit: this.MAX_DAILY_COST,
          current_daily_cost: this.dailyCostTracker.totalCost
        }
      }
    } catch (error) {
      return {
        healthy: false,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          api_key_configured: !!this.apiKey
        }
      }
    }
  }
}

// Lazy initialization
let serpApiServiceInstance: SerpAPIService | null = null

export function getSerpApiService(): SerpAPIService {
  if (!serpApiServiceInstance) {
    serpApiServiceInstance = new SerpAPIService()
  }
  return serpApiServiceInstance
}

// For backward compatibility
export const serpApiService = {
  get instance() {
    return getSerpApiService()
  }
}

export default serpApiService