/**
 * Request throttling and rate limiting utilities
 * Manages high-volume API requests to prevent overwhelming the backend
 */

interface ThrottleConfig {
  requestsPerSecond: number
  maxConcurrent: number
  retryAttempts: number
  retryDelay: number
}

interface QueuedRequest {
  id: string
  fn: () => Promise<any>
  resolve: (value: any) => void
  reject: (error: any) => void
  attempts: number
  priority: 'low' | 'medium' | 'high'
  timestamp: number
}

export class RequestThrottler {
  private config: ThrottleConfig
  private requestQueue: QueuedRequest[] = []
  private activeRequests = new Set<string>()
  private lastRequestTime = 0
  private requestCount = 0
  private resetTime = 0

  constructor(config: Partial<ThrottleConfig> = {}) {
    this.config = {
      requestsPerSecond: 10, // Limit to 10 requests per second
      maxConcurrent: 5, // Max 5 concurrent requests
      retryAttempts: 3,
      retryDelay: 1000,
      ...config
    }
    
    // Reset request count every second
    setInterval(() => {
      this.requestCount = 0
      this.resetTime = Date.now()
    }, 1000)

    // Process queue continuously
    this.processQueue()
  }

  /**
   * Add a request to the throttled queue
   */
  async throttledRequest<T>(
    requestFn: () => Promise<T>,
    options: {
      priority?: 'low' | 'medium' | 'high'
      timeout?: number
      cacheKey?: string
    } = {}
  ): Promise<T> {
    const { priority = 'medium', timeout = 30000 } = options

    // Check cache first if cache key provided
    if (options.cacheKey) {
      const cached = this.getFromCache(options.cacheKey)
      if (cached) {
        return cached
      }
    }

    return new Promise((resolve, reject) => {
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      const queuedRequest: QueuedRequest = {
        id: requestId,
        fn: requestFn,
        resolve: (value) => {
          if (options.cacheKey) {
            this.setCache(options.cacheKey, value)
          }
          resolve(value)
        },
        reject,
        attempts: 0,
        priority,
        timestamp: Date.now()
      }

      // Insert request based on priority
      this.insertByPriority(queuedRequest)

      // Set timeout
      setTimeout(() => {
        if (this.activeRequests.has(requestId)) {
          this.activeRequests.delete(requestId)
          reject(new Error('Request timeout'))
        }
      }, timeout)
    })
  }

  /**
   * Insert request into queue based on priority
   */
  private insertByPriority(request: QueuedRequest) {
    const priorityValues = { high: 3, medium: 2, low: 1 }
    const requestPriority = priorityValues[request.priority]

    let insertIndex = this.requestQueue.length
    for (let i = 0; i < this.requestQueue.length; i++) {
      const queuePriority = priorityValues[this.requestQueue[i].priority]
      if (requestPriority > queuePriority) {
        insertIndex = i
        break
      }
    }

    this.requestQueue.splice(insertIndex, 0, request)
  }

  /**
   * Process the request queue continuously
   */
  private async processQueue() {
    while (true) {
      try {
        if (this.canProcessNext()) {
          const request = this.requestQueue.shift()
          if (request) {
            this.executeRequest(request)
          }
        }
        
        // Wait a bit before checking again
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (error) {
        console.error('Error in request queue processor:', error)
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
  }

  /**
   * Check if we can process the next request
   */
  private canProcessNext(): boolean {
    // Check concurrent limit
    if (this.activeRequests.size >= this.config.maxConcurrent) {
      return false
    }

    // Check rate limit
    if (this.requestCount >= this.config.requestsPerSecond) {
      return false
    }

    // Check if there are requests to process
    return this.requestQueue.length > 0
  }

  /**
   * Execute a single request
   */
  private async executeRequest(request: QueuedRequest) {
    this.activeRequests.add(request.id)
    this.requestCount++
    this.lastRequestTime = Date.now()

    try {
      const result = await request.fn()
      this.activeRequests.delete(request.id)
      request.resolve(result)
    } catch (error) {
      this.activeRequests.delete(request.id)
      
      // Retry logic
      if (request.attempts < this.config.retryAttempts) {
        request.attempts++
        
        // Add back to queue with delay
        setTimeout(() => {
          this.insertByPriority(request)
        }, this.config.retryDelay * request.attempts)
        
        console.warn(`Request ${request.id} failed, retrying (attempt ${request.attempts}/${this.config.retryAttempts})`)
      } else {
        request.reject(error)
      }
    }
  }

  /**
   * Simple in-memory cache with TTL
   */
  private cache = new Map<string, { value: any; expires: number }>()

  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key)
    if (cached && cached.expires > Date.now()) {
      return cached.value
    }
    if (cached) {
      this.cache.delete(key)
    }
    return null
  }

  private setCache(key: string, value: any, ttl = 5000) {
    this.cache.set(key, {
      value,
      expires: Date.now() + ttl
    })
  }

  /**
   * Get current queue status
   */
  getStatus() {
    return {
      queueLength: this.requestQueue.length,
      activeRequests: this.activeRequests.size,
      requestsPerSecond: this.requestCount,
      maxConcurrent: this.config.maxConcurrent,
      isThrottling: this.requestQueue.length > 0 || this.activeRequests.size >= this.config.maxConcurrent
    }
  }

  /**
   * Clear the queue and reset
   */
  reset() {
    this.requestQueue.length = 0
    this.activeRequests.clear()
    this.requestCount = 0
    this.cache.clear()
  }
}

// Singleton instance with lazy initialization
let globalThrottlerInstance: RequestThrottler | null = null

export function getGlobalThrottler(): RequestThrottler {
  if (!globalThrottlerInstance) {
    globalThrottlerInstance = new RequestThrottler({
      requestsPerSecond: 8, // Conservative limit
      maxConcurrent: 3, // Limit concurrent requests
      retryAttempts: 2,
      retryDelay: 1500
    })
  }
  return globalThrottlerInstance
}

// For backward compatibility - but use getGlobalThrottler() instead
export const globalThrottler = {
  get instance() {
    return getGlobalThrottler()
  }
}

/**
 * Debounced function utility for frequent calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

/**
 * Throttled function utility for rate limiting
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0
  return (...args: Parameters<T>) => {
    const now = Date.now()
    if (now - lastCall >= delay) {
      lastCall = now
      func(...args)
    }
  }
}

/**
 * Batch requests together to reduce API calls
 */
export class RequestBatcher {
  private batches = new Map<string, {
    requests: Array<{ resolve: (value: any) => void; reject: (error: any) => void }>
    timeout: NodeJS.Timeout
  }>()

  /**
   * Add request to batch
   */
  batchRequest<T>(
    batchKey: string,
    batchedFn: () => Promise<T[]>,
    delay = 100
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      let batch = this.batches.get(batchKey)
      
      if (!batch) {
        batch = {
          requests: [],
          timeout: setTimeout(async () => {
            const currentBatch = this.batches.get(batchKey)
            if (currentBatch) {
              this.batches.delete(batchKey)
              
              try {
                const results = await batchedFn()
                currentBatch.requests.forEach((req, index) => {
                  if (results[index] !== undefined) {
                    req.resolve(results[index])
                  } else {
                    req.reject(new Error('No result for batched request'))
                  }
                })
              } catch (error) {
                currentBatch.requests.forEach(req => req.reject(error))
              }
            }
          }, delay)
        }
        this.batches.set(batchKey, batch)
      }

      batch.requests.push({ resolve, reject })
    })
  }
}

// Singleton instance with lazy initialization
let globalBatcherInstance: RequestBatcher | null = null

export function getGlobalBatcher(): RequestBatcher {
  if (!globalBatcherInstance) {
    globalBatcherInstance = new RequestBatcher()
  }
  return globalBatcherInstance
}

// For backward compatibility
export const globalBatcher = {
  get instance() {
    return getGlobalBatcher()
  }
}

/**
 * Smart polling with exponential backoff
 */
export class SmartPoller {
  private intervals = new Map<string, NodeJS.Timeout>()
  private backoffFactors = new Map<string, number>()

  startPolling(
    key: string,
    pollFn: () => Promise<any>,
    options: {
      initialInterval?: number
      maxInterval?: number
      backoffFactor?: number
      onSuccess?: (data: any) => void
      onError?: (error: any) => void
    } = {}
  ) {
    const {
      initialInterval = 5000,
      maxInterval = 60000,
      backoffFactor = 1.5,
      onSuccess,
      onError
    } = options

    this.stopPolling(key)
    this.backoffFactors.set(key, 1)

    const poll = async () => {
      try {
        const result = await getGlobalThrottler().throttledRequest(pollFn, {
          priority: 'low',
          cacheKey: `poll_${key}`
        })
        
        onSuccess?.(result)
        
        // Reset backoff on success
        this.backoffFactors.set(key, 1)
        
        // Schedule next poll
        const interval = Math.min(initialInterval, maxInterval)
        this.intervals.set(key, setTimeout(poll, interval))
        
      } catch (error) {
        onError?.(error)
        
        // Increase backoff
        const currentBackoff = this.backoffFactors.get(key) || 1
        const newBackoff = Math.min(currentBackoff * backoffFactor, maxInterval / initialInterval)
        this.backoffFactors.set(key, newBackoff)
        
        // Schedule retry with backoff
        const nextInterval = Math.min(initialInterval * newBackoff, maxInterval)
        this.intervals.set(key, setTimeout(poll, nextInterval))
      }
    }

    // Start immediately
    poll()
  }

  stopPolling(key: string) {
    const interval = this.intervals.get(key)
    if (interval) {
      clearTimeout(interval)
      this.intervals.delete(key)
      this.backoffFactors.delete(key)
    }
  }

  stopAll() {
    for (const key of this.intervals.keys()) {
      this.stopPolling(key)
    }
  }
}

// Singleton instance with lazy initialization
let globalPollerInstance: SmartPoller | null = null

export function getGlobalPoller(): SmartPoller {
  if (!globalPollerInstance) {
    globalPollerInstance = new SmartPoller()
  }
  return globalPollerInstance
}

// For backward compatibility
export const globalPoller = {
  get instance() {
    return getGlobalPoller()
  }
}