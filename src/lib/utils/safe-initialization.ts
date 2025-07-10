'use client'

/**
 * Safe Initialization Utilities
 * Prevents "Cannot access before initialization" errors
 */

// Safe EventEmitter initialization
export function createSafeEventEmitter() {
  try {
    // Use dynamic import to avoid require()
    if (typeof window === 'undefined') {
      // Node.js environment
      return new (eval('require')('events').EventEmitter)()
    } else {
      // Browser environment - return fallback
      return {
        on: (event: string, listener: (...args: any[]) => void) => {},
        emit: (event: string, ...args: any[]) => {},
        off: (event: string, listener: (...args: any[]) => void) => {},
        removeAllListeners: (event?: string) => {},
        setMaxListeners: (n: number) => {}
      }
    }
  } catch (error) {
    console.warn('EventEmitter not available, using fallback')
    // Return a simple event emitter fallback
    return {
      on: (event: string, listener: (...args: any[]) => void) => {},
      emit: (event: string, ...args: any[]) => {},
      off: (event: string, listener: (...args: any[]) => void) => {},
      removeAllListeners: (event?: string) => {},
      setMaxListeners: (n: number) => {}
    }
  }
}

// Safe service initialization with retry
export async function safeServiceInit<T>(
  initFn: () => Promise<T> | T,
  fallback: T,
  retries = 3
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await initFn()
      return result
    } catch (error) {
      console.warn(`Service initialization attempt ${i + 1} failed:`, error)
      if (i === retries - 1) {
        console.warn('Using fallback service')
        return fallback
      }
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
    }
  }
  return fallback
}

// Safe singleton pattern
export function createSafeSingleton<T>(createFn: () => T): () => T {
  let instance: T | null = null
  let isInitializing = false
  
  return () => {
    if (instance) return instance
    if (isInitializing) {
      // Return a placeholder during initialization
      return {} as T
    }
    
    try {
      isInitializing = true
      instance = createFn()
      isInitializing = false
      return instance
    } catch (error) {
      isInitializing = false
      console.error('Singleton creation failed:', error)
      // Return empty object as fallback
      return {} as T
    }
  }
}

// Safe import with fallback
export async function safeImport<T>(
  importPath: string,
  fallback: T
): Promise<T> {
  try {
    const moduleResult = await import(importPath)
    return moduleResult.default || moduleResult
  } catch (error) {
    console.warn(`Failed to import ${importPath}, using fallback:`, error)
    return fallback
  }
}

// Safe localStorage operations
export const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window === 'undefined') return null
      return localStorage.getItem(key)
    } catch {
      return null
    }
  },
  
  setItem: (key: string, value: string): boolean => {
    try {
      if (typeof window === 'undefined') return false
      localStorage.setItem(key, value)
      return true
    } catch {
      return false
    }
  },
  
  removeItem: (key: string): boolean => {
    try {
      if (typeof window === 'undefined') return false
      localStorage.removeItem(key)
      return true
    } catch {
      return false
    }
  }
}

// Safe browser environment checks
export const isBrowser = typeof window !== 'undefined'
export const isNode = typeof process !== 'undefined' && process.versions?.node

// Safe feature detection
export function hasFeature(feature: string): boolean {
  try {
    switch (feature) {
      case 'localStorage':
        return typeof Storage !== 'undefined' && 'localStorage' in window
      case 'websocket':
        return typeof WebSocket !== 'undefined'
      case 'eventSource':
        return typeof EventSource !== 'undefined'
      case 'serviceWorker':
        return 'serviceWorker' in navigator
      default:
        return false
    }
  } catch {
    return false
  }
}