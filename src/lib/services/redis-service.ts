// Only import Redis in server environment
let Redis: any = null
if (typeof window === 'undefined') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    Redis = require('ioredis')
  } catch (error) {
    console.warn('ioredis not available, Redis functionality disabled')
  }
}

class RedisService {
  private client: any;
  private isConnected: boolean = false;
  private isServerSide: boolean = typeof window === 'undefined';

  constructor() {
    // Only initialize Redis on server side
    if (!this.isServerSide || !Redis) {
      console.log('🟡 Redis: Client-side mode, using in-memory fallback')
      this.client = null
      this.isConnected = false
      return
    }

    // Use Redis Cloud URL from environment or fallback to local
    const redisUrl = process.env.REDIS_URL || process.env.NEXT_PUBLIC_REDIS_URL
    
    if (redisUrl) {
      // Parse Redis Cloud URL: redis://default:password@host:port
      this.client = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        retryDelayOnFailover: 100,
        enableReadyCheck: false,
        connectTimeout: 10000,
        commandTimeout: 5000,
      })
      console.log('🔧 Redis: Configured with Redis Cloud URL')
    } else {
      // Fallback to local Redis
      this.client = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      })
      console.log('🔧 Redis: Configured for local development')
    }

    if (this.client) {
      this.client.on('connect', () => {
        console.log('Redis connected');
        this.isConnected = true;
      });

      this.client.on('error', (error) => {
        console.error('Redis connection error:', error);
        this.isConnected = false;
      });

      this.client.on('close', () => {
        console.log('Redis connection closed');
        this.isConnected = false;
      });
    }
  }

  async connect(): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.connect();
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.client) return;
    await this.client.quit();
  }

  // Basic operations
  async get(key: string): Promise<string | null> {
    if (!this.client) return null;
    try {
      return await this.client.get(key);
    } catch (error) {
      console.error(`Redis GET error for key ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<boolean> {
    if (!this.client) return false;
    try {
      if (ttl) {
        await this.client.setex(key, ttl, value);
      } else {
        await this.client.set(key, value);
      }
      return true;
    } catch (error) {
      console.error(`Redis SET error for key ${key}:`, error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    if (!this.client) return false;
    try {
      const result = await this.client.del(key);
      return result > 0;
    } catch (error) {
      console.error(`Redis DEL error for key ${key}:`, error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.client) return false;
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Redis EXISTS error for key ${key}:`, error);
      return false;
    }
  }

  // JSON operations
  async setJSON(key: string, value: any, ttl?: number): Promise<boolean> {
    try {
      const json = JSON.stringify(value);
      return await this.set(key, json, ttl);
    } catch (error) {
      console.error(`Redis setJSON error for key ${key}:`, error);
      return false;
    }
  }

  async getJSON<T>(key: string): Promise<T | null> {
    try {
      const value = await this.get(key);
      if (value === null) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`Redis getJSON error for key ${key}:`, error);
      return null;
    }
  }

  // Hash operations
  async hset(key: string, field: string, value: string): Promise<boolean> {
    try {
      await this.client.hset(key, field, value);
      return true;
    } catch (error) {
      console.error(`Redis HSET error for key ${key}, field ${field}:`, error);
      return false;
    }
  }

  async hget(key: string, field: string): Promise<string | null> {
    try {
      return await this.client.hget(key, field);
    } catch (error) {
      console.error(`Redis HGET error for key ${key}, field ${field}:`, error);
      return null;
    }
  }

  async hgetall(key: string): Promise<Record<string, string> | null> {
    try {
      const result = await this.client.hgetall(key);
      return Object.keys(result).length > 0 ? result : null;
    } catch (error) {
      console.error(`Redis HGETALL error for key ${key}:`, error);
      return null;
    }
  }

  async hdel(key: string, field: string): Promise<boolean> {
    try {
      const result = await this.client.hdel(key, field);
      return result > 0;
    } catch (error) {
      console.error(`Redis HDEL error for key ${key}, field ${field}:`, error);
      return false;
    }
  }

  // List operations
  async lpush(key: string, value: string): Promise<boolean> {
    try {
      await this.client.lpush(key, value);
      return true;
    } catch (error) {
      console.error(`Redis LPUSH error for key ${key}:`, error);
      return false;
    }
  }

  async rpush(key: string, value: string): Promise<boolean> {
    try {
      await this.client.rpush(key, value);
      return true;
    } catch (error) {
      console.error(`Redis RPUSH error for key ${key}:`, error);
      return false;
    }
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    try {
      return await this.client.lrange(key, start, stop);
    } catch (error) {
      console.error(`Redis LRANGE error for key ${key}:`, error);
      return [];
    }
  }

  async ltrim(key: string, start: number, stop: number): Promise<boolean> {
    try {
      await this.client.ltrim(key, start, stop);
      return true;
    } catch (error) {
      console.error(`Redis LTRIM error for key ${key}:`, error);
      return false;
    }
  }

  // Set operations
  async sadd(key: string, member: string): Promise<boolean> {
    try {
      const result = await this.client.sadd(key, member);
      return result > 0;
    } catch (error) {
      console.error(`Redis SADD error for key ${key}:`, error);
      return false;
    }
  }

  async smembers(key: string): Promise<string[]> {
    try {
      return await this.client.smembers(key);
    } catch (error) {
      console.error(`Redis SMEMBERS error for key ${key}:`, error);
      return [];
    }
  }

  async srem(key: string, member: string): Promise<boolean> {
    try {
      const result = await this.client.srem(key, member);
      return result > 0;
    } catch (error) {
      console.error(`Redis SREM error for key ${key}:`, error);
      return false;
    }
  }

  // Cache operations with TTL
  async cache<T>(key: string, data: T, ttl: number = 3600): Promise<boolean> {
    return await this.setJSON(key, data, ttl);
  }

  async getCached<T>(key: string): Promise<T | null> {
    return await this.getJSON<T>(key);
  }

  // Bulk operations
  async mget(keys: string[]): Promise<(string | null)[]> {
    try {
      return await this.client.mget(keys);
    } catch (error) {
      console.error('Redis MGET error:', error);
      return new Array(keys.length).fill(null);
    }
  }

  async mset(keyValues: Record<string, string>): Promise<boolean> {
    try {
      await this.client.mset(keyValues);
      return true;
    } catch (error) {
      console.error('Redis MSET error:', error);
      return false;
    }
  }

  // Pattern operations
  async keys(pattern: string): Promise<string[]> {
    if (!this.client) return [];
    try {
      return await this.client.keys(pattern);
    } catch (error) {
      console.error(`Redis KEYS error for pattern ${pattern}:`, error);
      return [];
    }
  }

  async scan(cursor: number = 0, pattern?: string, count?: number): Promise<{ cursor: number; keys: string[] }> {
    try {
      const args: any[] = [cursor];
      if (pattern) {
        args.push('MATCH', pattern);
      }
      if (count) {
        args.push('COUNT', count);
      }
      
      const result = await this.client.scan(cursor, 'MATCH', pattern || '*', 'COUNT', count || 10);
      return {
        cursor: parseInt(result[0]),
        keys: result[1]
      };
    } catch (error) {
      console.error('Redis SCAN error:', error);
      return { cursor: 0, keys: [] };
    }
  }

  // Utility methods
  async ping(): Promise<boolean> {
    if (!this.client) return false;
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      console.error('Redis PING error:', error);
      return false;
    }
  }

  async flushall(): Promise<boolean> {
    try {
      await this.client.flushall();
      return true;
    } catch (error) {
      console.error('Redis FLUSHALL error:', error);
      return false;
    }
  }

  async info(): Promise<string | null> {
    try {
      return await this.client.info();
    } catch (error) {
      console.error('Redis INFO error:', error);
      return null;
    }
  }

  // Connection status
  isHealthy(): boolean {
    return this.client ? (this.isConnected && this.client.status === 'ready') : false;
  }

  getConnectionInfo() {
    if (!this.client) {
      return {
        status: 'disconnected',
        connected: false,
        host: 'n/a',
        port: 'n/a',
        mode: 'client-side'
      };
    }
    
    return {
      status: this.client.status,
      connected: this.isConnected,
      host: this.client.options?.host || 'unknown',
      port: this.client.options?.port || 'unknown',
      mode: 'server-side'
    };
  }

  // Farm-specific cache methods
  async cacheFarmData(farmId: string, data: any, ttl: number = 300): Promise<boolean> {
    const key = `farm:${farmId}:data`
    return await this.setJSON(key, data, ttl)
  }

  async getCachedFarmData<T = any>(farmId: string): Promise<T | null> {
    const key = `farm:${farmId}:data`
    return await this.getJSON<T>(key)
  }

  async cacheFarmPerformance(farmId: string, performance: any, ttl: number = 60): Promise<boolean> {
    const key = `farm:${farmId}:performance`
    return await this.setJSON(key, performance, ttl)
  }

  async getCachedFarmPerformance<T = any>(farmId: string): Promise<T | null> {
    const key = `farm:${farmId}:performance`
    return await this.getJSON<T>(key)
  }

  async invalidateFarmCache(farmId?: string): Promise<number> {
    const pattern = farmId ? `farm:${farmId}:*` : 'farm:*'
    const keys = await this.keys(pattern)
    let deleted = 0
    
    for (const key of keys) {
      if (await this.del(key)) {
        deleted++
      }
    }
    
    return deleted
  }

  // Goal-specific cache methods
  async cacheGoalData(goalId: string, data: any, ttl: number = 300): Promise<boolean> {
    const key = `goal:${goalId}:data`
    return await this.setJSON(key, data, ttl)
  }

  async getCachedGoalData<T = any>(goalId: string): Promise<T | null> {
    const key = `goal:${goalId}:data`
    return await this.getJSON<T>(key)
  }

  async cacheGoalProgress(goalId: string, progress: any, ttl: number = 60): Promise<boolean> {
    const key = `goal:${goalId}:progress`
    return await this.setJSON(key, progress, ttl)
  }

  async getCachedGoalProgress<T = any>(goalId: string): Promise<T | null> {
    const key = `goal:${goalId}:progress`
    return await this.getJSON<T>(key)
  }

  async invalidateGoalCache(goalId?: string): Promise<number> {
    const pattern = goalId ? `goal:${goalId}:*` : 'goal:*'
    const keys = await this.keys(pattern)
    let deleted = 0
    
    for (const key of keys) {
      if (await this.del(key)) {
        deleted++
      }
    }
    
    return deleted
  }

  // Performance metrics cache
  async cachePerformanceMetrics(type: 'farms' | 'goals', data: any, ttl: number = 60): Promise<boolean> {
    const key = `performance:${type}:metrics`
    return await this.setJSON(key, data, ttl)
  }

  async getCachedPerformanceMetrics<T = any>(type: 'farms' | 'goals'): Promise<T | null> {
    const key = `performance:${type}:metrics`
    return await this.getJSON<T>(key)
  }

  // Market data cache
  async cacheMarketData(symbol: string, data: any, ttl: number = 30): Promise<boolean> {
    const key = `market:${symbol}:data`
    return await this.setJSON(key, data, ttl)
  }

  async getCachedMarketData<T = any>(symbol: string): Promise<T | null> {
    const key = `market:${symbol}:data`
    return await this.getJSON<T>(key)
  }

  // Real-time data streams cache
  async cacheStreamData(streamId: string, data: any, ttl: number = 10): Promise<boolean> {
    const key = `stream:${streamId}:data`
    return await this.setJSON(key, data, ttl)
  }

  async getCachedStreamData<T = any>(streamId: string): Promise<T | null> {
    const key = `stream:${streamId}:data`
    return await this.getJSON<T>(key)
  }

  // Dashboard aggregations cache
  async cacheDashboardStats(data: any, ttl: number = 120): Promise<boolean> {
    const key = 'dashboard:stats'
    return await this.setJSON(key, data, ttl)
  }

  async getCachedDashboardStats<T = any>(): Promise<T | null> {
    const key = 'dashboard:stats'
    return await this.getJSON<T>(key)
  }
}

// Singleton instance
// Create and export singleton instance with lazy initialization
let _redisServiceInstance: RedisService | null = null;

export const redisService = {
  get instance(): RedisService {
    if (!_redisServiceInstance) {
      _redisServiceInstance = new RedisService();
    }
    return _redisServiceInstance;
  },
  
  // Proxy all methods
  connect: () => redisService.instance.connect(),
  disconnect: () => redisService.instance.disconnect(),
  get: (key: string) => redisService.instance.get(key),
  set: (key: string, value: string, ttl?: number) => redisService.instance.set(key, value, ttl),
  del: (key: string) => redisService.instance.del(key),
  exists: (key: string) => redisService.instance.exists(key),
  keys: (pattern: string) => redisService.instance.keys(pattern),
  flushall: () => redisService.instance.flushall(),
  ping: () => redisService.instance.ping(),
  isHealthy: () => redisService.instance.isHealthy(),
  getConnectionInfo: () => redisService.instance.getConnectionInfo(),
  
  // JSON operations
  setJSON: <T>(key: string, value: T, ttl?: number) => redisService.instance.setJSON(key, value, ttl),
  getJSON: <T>(key: string) => redisService.instance.getJSON<T>(key),
  
  // Farm cache methods
  cacheFarmData: (farmId: string, data: any, ttl?: number) => redisService.instance.cacheFarmData(farmId, data, ttl),
  getCachedFarmData: <T = any>(farmId: string) => redisService.instance.getCachedFarmData<T>(farmId),
  cacheFarmPerformance: (farmId: string, performance: any, ttl?: number) => redisService.instance.cacheFarmPerformance(farmId, performance, ttl),
  getCachedFarmPerformance: <T = any>(farmId: string) => redisService.instance.getCachedFarmPerformance<T>(farmId),
  invalidateFarmCache: (farmId?: string) => redisService.instance.invalidateFarmCache(farmId),
  
  // Goal cache methods
  cacheGoalData: (goalId: string, data: any, ttl?: number) => redisService.instance.cacheGoalData(goalId, data, ttl),
  getCachedGoalData: <T = any>(goalId: string) => redisService.instance.getCachedGoalData<T>(goalId),
  cacheGoalProgress: (goalId: string, progress: any, ttl?: number) => redisService.instance.cacheGoalProgress(goalId, progress, ttl),
  getCachedGoalProgress: <T = any>(goalId: string) => redisService.instance.getCachedGoalProgress<T>(goalId),
  invalidateGoalCache: (goalId?: string) => redisService.instance.invalidateGoalCache(goalId),
  
  // Performance metrics cache
  cachePerformanceMetrics: (type: 'farms' | 'goals', data: any, ttl?: number) => redisService.instance.cachePerformanceMetrics(type, data, ttl),
  getCachedPerformanceMetrics: <T = any>(type: 'farms' | 'goals') => redisService.instance.getCachedPerformanceMetrics<T>(type),
  
  // Market data cache
  cacheMarketData: (symbol: string, data: any, ttl?: number) => redisService.instance.cacheMarketData(symbol, data, ttl),
  getCachedMarketData: <T = any>(symbol: string) => redisService.instance.getCachedMarketData<T>(symbol),
  
  // Dashboard cache
  cacheDashboardStats: (data: any, ttl?: number) => redisService.instance.cacheDashboardStats(data, ttl),
  getCachedDashboardStats: <T = any>() => redisService.instance.getCachedDashboardStats<T>()
};
export default redisService; 