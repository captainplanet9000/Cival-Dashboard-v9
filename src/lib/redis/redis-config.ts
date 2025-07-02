/**
 * Redis Configuration for Premium Trading Components
 * Centralized Redis client setup with caching and real-time data management
 */

export interface RedisConfig {
  url: string;
  password?: string;
  database?: number;
  retryDelayOnFailover?: number;
  maxRetriesPerRequest?: number;
  lazyConnect?: boolean;
}

export interface CacheConfig {
  defaultTTL: number; // Time to live in seconds
  keyPrefix: string;
  enableCompression?: boolean;
}

export interface RealtimeConfig {
  channels: {
    portfolio: string;
    market: string;
    agents: string;
    trading: string;
    notifications: string;
  };
  heartbeatInterval: number;
  reconnectInterval: number;
}

export const defaultRedisConfig: RedisConfig = {
  url: process.env.REDIS_URL || process.env.NEXT_PUBLIC_REDIS_URL || 'redis://localhost:6379',
  database: 0,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
};

export const defaultCacheConfig: CacheConfig = {
  defaultTTL: 300, // 5 minutes
  keyPrefix: 'cival:premium:',
  enableCompression: true,
};

export const defaultRealtimeConfig: RealtimeConfig = {
  channels: {
    portfolio: 'premium:portfolio:updates',
    market: 'premium:market:data',
    agents: 'premium:agents:status',
    trading: 'premium:trading:orders',
    notifications: 'premium:notifications:alerts',
  },
  heartbeatInterval: 30000, // 30 seconds
  reconnectInterval: 5000,  // 5 seconds
};

// Cache key generators for premium components
export const cacheKeys = {
  // Portfolio
  portfolioSummary: (userId?: string) => `${defaultCacheConfig.keyPrefix}portfolio:summary:${userId || 'default'}`,
  portfolioPositions: (userId?: string) => `${defaultCacheConfig.keyPrefix}portfolio:positions:${userId || 'default'}`,
  portfolioAnalytics: (timeframe: string, userId?: string) => `${defaultCacheConfig.keyPrefix}portfolio:analytics:${timeframe}:${userId || 'default'}`,
  
  // Trading
  orderBook: (symbol: string) => `${defaultCacheConfig.keyPrefix}trading:orderbook:${symbol}`,
  marketData: (symbol: string) => `${defaultCacheConfig.keyPrefix}market:data:${symbol}`,
  technicalIndicators: (symbol: string, indicators: string) => `${defaultCacheConfig.keyPrefix}technical:${symbol}:${indicators}`,
  
  // Agents
  agentStatus: (agentId: string) => `${defaultCacheConfig.keyPrefix}agent:status:${agentId}`,
  agentPerformance: (agentId: string) => `${defaultCacheConfig.keyPrefix}agent:performance:${agentId}`,
  agentDecisions: (agentId: string) => `${defaultCacheConfig.keyPrefix}agent:decisions:${agentId}`,
  
  // Charts
  chartData: (symbol: string, timeframe: string) => `${defaultCacheConfig.keyPrefix}chart:data:${symbol}:${timeframe}`,
  
  // Risk
  riskMetrics: (portfolioId?: string) => `${defaultCacheConfig.keyPrefix}risk:metrics:${portfolioId || 'default'}`,
  
  // Strategies
  strategies: (userId?: string) => `${defaultCacheConfig.keyPrefix}strategies:${userId || 'default'}`,
  strategyPerformance: (strategyId: string) => `${defaultCacheConfig.keyPrefix}strategy:performance:${strategyId}`,
  
  // Notifications
  notifications: (userId?: string) => `${defaultCacheConfig.keyPrefix}notifications:${userId || 'default'}`,
  
  // Performance
  componentMetrics: () => `${defaultCacheConfig.keyPrefix}performance:components`,
  systemMetrics: () => `${defaultCacheConfig.keyPrefix}performance:system`,
};

// Redis-based feature flags for premium components
export const featureFlags = {
  // Component features
  enableAdvancedCharts: 'premium:feature:advanced_charts',
  enableRealTimeUpdates: 'premium:feature:realtime_updates',
  enableAdvancedRisk: 'premium:feature:advanced_risk',
  enableAgentOrchestration: 'premium:feature:agent_orchestration',
  enableVisualStrategyBuilder: 'premium:feature:visual_strategy_builder',
  
  // Performance features
  enableComponentCaching: 'premium:feature:component_caching',
  enablePerformanceMonitoring: 'premium:feature:performance_monitoring',
  enableAutoOptimization: 'premium:feature:auto_optimization',
};

// Cache TTL configurations for different data types
export const cacheTTL = {
  // Fast-changing data (short TTL)
  marketData: 10,        // 10 seconds
  orderBook: 5,          // 5 seconds
  agentStatus: 15,       // 15 seconds
  
  // Medium-changing data (medium TTL)
  portfolioSummary: 60,   // 1 minute
  portfolioPositions: 30, // 30 seconds
  technicalIndicators: 120, // 2 minutes
  
  // Slow-changing data (long TTL)
  agentPerformance: 300,  // 5 minutes
  strategies: 600,        // 10 minutes
  riskMetrics: 180,      // 3 minutes
  chartData: 300,        // 5 minutes
  
  // Very slow-changing data (very long TTL)
  systemConfig: 3600,    // 1 hour
  featureFlags: 1800,    // 30 minutes
  componentMetrics: 900, // 15 minutes
};

// Queue configurations for background processing
export const queueConfig = {
  portfolioUpdates: {
    name: 'premium:portfolio:updates',
    maxConcurrency: 5,
    defaultJobOptions: {
      attempts: 3,
      backoff: 'exponential',
      delay: 1000,
    },
  },
  marketDataProcessing: {
    name: 'premium:market:processing',
    maxConcurrency: 10,
    defaultJobOptions: {
      attempts: 2,
      backoff: 'fixed',
      delay: 500,
    },
  },
  agentDecisions: {
    name: 'premium:agent:decisions',
    maxConcurrency: 3,
    defaultJobOptions: {
      attempts: 5,
      backoff: 'exponential',
      delay: 2000,
    },
  },
  notifications: {
    name: 'premium:notifications',
    maxConcurrency: 8,
    defaultJobOptions: {
      attempts: 3,
      backoff: 'fixed',
      delay: 1000,
    },
  },
};

// Performance monitoring thresholds
export const performanceThresholds = {
  componentRenderTime: 100,    // milliseconds
  apiResponseTime: 500,        // milliseconds
  cacheHitRate: 0.8,          // 80%
  memoryUsage: 0.85,          // 85%
  errorRate: 0.05,            // 5%
};

// WebSocket event types for premium components
export const wsEventTypes = {
  // Portfolio events
  PORTFOLIO_UPDATED: 'portfolio:updated',
  POSITION_CHANGED: 'position:changed',
  PORTFOLIO_RISK_ALERT: 'portfolio:risk:alert',
  
  // Trading events
  ORDER_PLACED: 'order:placed',
  ORDER_FILLED: 'order:filled',
  ORDER_CANCELLED: 'order:cancelled',
  MARKET_DATA_UPDATE: 'market:data:update',
  
  // Agent events
  AGENT_STATUS_CHANGED: 'agent:status:changed',
  AGENT_DECISION_MADE: 'agent:decision:made',
  AGENT_PERFORMANCE_UPDATE: 'agent:performance:update',
  
  // System events
  SYSTEM_ALERT: 'system:alert',
  PERFORMANCE_WARNING: 'performance:warning',
  FEATURE_FLAG_UPDATED: 'feature:flag:updated',
  
  // Chart events
  CHART_DATA_UPDATE: 'chart:data:update',
  TECHNICAL_INDICATOR_UPDATE: 'technical:indicator:update',
  
  // Notification events
  NOTIFICATION_CREATED: 'notification:created',
  ALERT_TRIGGERED: 'alert:triggered',
};

// Export configuration validator
export const validateRedisConfig = (config: Partial<RedisConfig>): boolean => {
  try {
    if (!config.url) {
      console.warn('Redis URL not provided, using default');
      return false;
    }
    
    // Basic URL validation
    const url = new URL(config.url);
    if (!['redis:', 'rediss:'].includes(url.protocol)) {
      console.error('Invalid Redis URL protocol');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Invalid Redis configuration:', error);
    return false;
  }
};

// Health check configuration
export const healthCheckConfig = {
  interval: 30000, // 30 seconds
  timeout: 5000,   // 5 seconds
  retries: 3,
  commands: ['ping', 'info'],
};

export default {
  redis: defaultRedisConfig,
  cache: defaultCacheConfig,
  realtime: defaultRealtimeConfig,
  cacheKeys,
  featureFlags,
  cacheTTL,
  queueConfig,
  performanceThresholds,
  wsEventTypes,
  validateRedisConfig,
  healthCheckConfig,
};