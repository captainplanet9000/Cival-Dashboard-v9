'use client'

import CryptoJS from 'crypto-js'

/**
 * Secure API Key Management System
 * Handles encrypted storage, rotation, and validation of exchange API credentials
 */

export interface ExchangeCredentials {
  exchangeId: string
  apiKey: string
  apiSecret: string
  passphrase?: string
  testnet?: boolean
  permissions?: string[]
  lastUsed?: Date
  status: 'active' | 'inactive' | 'expired' | 'rotating'
}

export interface CredentialHealth {
  exchangeId: string
  isValid: boolean
  permissions: string[]
  lastCheck: Date
  rateLimit: {
    current: number
    limit: number
    resetTime: Date
  }
  latency: number
  errorCount: number
}

class SecureAPIManager {
  private static instance: SecureAPIManager
  private credentials: Map<string, ExchangeCredentials> = new Map()
  private encryptionKey: string
  private healthMonitor: Map<string, CredentialHealth> = new Map()
  private rotationSchedule: Map<string, NodeJS.Timeout> = new Map()

  private constructor() {
    this.encryptionKey = this.getEncryptionKey()
    this.loadStoredCredentials()
    this.startHealthMonitoring()
  }

  static getInstance(): SecureAPIManager {
    if (!SecureAPIManager.instance) {
      SecureAPIManager.instance = new SecureAPIManager()
    }
    return SecureAPIManager.instance
  }

  private getEncryptionKey(): string {
    // In production, this should come from environment variables or secure key management
    const key = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'cival-trading-platform-secret-key-2025'
    return CryptoJS.SHA256(key).toString()
  }

  /**
   * Encrypt sensitive credential data
   */
  private encrypt(data: string): string {
    try {
      return CryptoJS.AES.encrypt(data, this.encryptionKey).toString()
    } catch (error) {
      console.error('Encryption failed:', error)
      throw new Error('Failed to encrypt credentials')
    }
  }

  /**
   * Decrypt sensitive credential data
   */
  private decrypt(encryptedData: string): string {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey)
      return bytes.toString(CryptoJS.enc.Utf8)
    } catch (error) {
      console.error('Decryption failed:', error)
      throw new Error('Failed to decrypt credentials')
    }
  }

  /**
   * Store exchange credentials securely
   */
  async storeCredentials(credentials: Omit<ExchangeCredentials, 'status'>): Promise<boolean> {
    try {
      const secureCredentials: ExchangeCredentials = {
        ...credentials,
        apiKey: this.encrypt(credentials.apiKey),
        apiSecret: this.encrypt(credentials.apiSecret),
        passphrase: credentials.passphrase ? this.encrypt(credentials.passphrase) : undefined,
        status: 'active',
        lastUsed: new Date()
      }

      this.credentials.set(credentials.exchangeId, secureCredentials)
      await this.persistCredentials()
      
      // Start health monitoring for this exchange
      await this.validateCredentials(credentials.exchangeId)
      
      console.log(`✅ Stored credentials for ${credentials.exchangeId}`)
      return true
    } catch (error) {
      console.error('Failed to store credentials:', error)
      return false
    }
  }

  /**
   * Retrieve and decrypt credentials for an exchange
   */
  async getCredentials(exchangeId: string): Promise<ExchangeCredentials | null> {
    try {
      const stored = this.credentials.get(exchangeId)
      if (!stored) {
        return null
      }

      // Return decrypted credentials
      return {
        ...stored,
        apiKey: this.decrypt(stored.apiKey),
        apiSecret: this.decrypt(stored.apiSecret),
        passphrase: stored.passphrase ? this.decrypt(stored.passphrase) : undefined
      }
    } catch (error) {
      console.error('Failed to retrieve credentials:', error)
      return null
    }
  }

  /**
   * Validate credentials by testing exchange connection
   */
  async validateCredentials(exchangeId: string): Promise<CredentialHealth> {
    const startTime = Date.now()
    
    try {
      const credentials = await this.getCredentials(exchangeId)
      if (!credentials) {
        throw new Error('Credentials not found')
      }

      // Import exchange-specific validation
      let healthResult: CredentialHealth

      switch (exchangeId) {
        case 'binance':
          healthResult = await this.validateBinanceCredentials(credentials)
          break
        case 'coinbase':
          healthResult = await this.validateCoinbaseCredentials(credentials)
          break
        case 'hyperliquid':
          healthResult = await this.validateHyperliquidCredentials(credentials)
          break
        default:
          throw new Error(`Exchange ${exchangeId} not supported`)
      }

      healthResult.latency = Date.now() - startTime
      this.healthMonitor.set(exchangeId, healthResult)
      
      return healthResult
    } catch (error) {
      const errorHealth: CredentialHealth = {
        exchangeId,
        isValid: false,
        permissions: [],
        lastCheck: new Date(),
        rateLimit: { current: 0, limit: 0, resetTime: new Date() },
        latency: Date.now() - startTime,
        errorCount: (this.healthMonitor.get(exchangeId)?.errorCount || 0) + 1
      }
      
      this.healthMonitor.set(exchangeId, errorHealth)
      console.error(`❌ Credential validation failed for ${exchangeId}:`, error)
      return errorHealth
    }
  }

  /**
   * Validate Binance credentials
   */
  private async validateBinanceCredentials(credentials: ExchangeCredentials): Promise<CredentialHealth> {
    const baseUrl = credentials.testnet ? 'https://testnet.binance.vision' : 'https://api.binance.com'
    
    const timestamp = Date.now()
    const queryString = `timestamp=${timestamp}`
    
    // Create signature
    const signature = CryptoJS.HmacSHA256(queryString, credentials.apiSecret).toString()
    
    const response = await fetch(`${baseUrl}/api/v3/account?${queryString}&signature=${signature}`, {
      headers: {
        'X-MBX-APIKEY': credentials.apiKey
      }
    })

    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status}`)
    }

    const accountData = await response.json()
    
    return {
      exchangeId: 'binance',
      isValid: true,
      permissions: accountData.permissions || ['SPOT'],
      lastCheck: new Date(),
      rateLimit: {
        current: parseInt(response.headers.get('X-MBX-USED-WEIGHT') || '0'),
        limit: parseInt(response.headers.get('X-MBX-USED-WEIGHT-1M') || '1200'),
        resetTime: new Date(Date.now() + 60000)
      },
      latency: 0, // Will be set by caller
      errorCount: 0
    }
  }

  /**
   * Validate Coinbase credentials
   */
  private async validateCoinbaseCredentials(credentials: ExchangeCredentials): Promise<CredentialHealth> {
    const baseUrl = credentials.testnet ? 'https://api-public.sandbox.exchange.coinbase.com' : 'https://api.exchange.coinbase.com'
    
    const timestamp = Math.floor(Date.now() / 1000)
    const method = 'GET'
    const path = '/accounts'
    const body = ''
    
    const message = timestamp + method + path + body
    const signature = CryptoJS.HmacSHA256(message, CryptoJS.enc.Base64.parse(credentials.apiSecret)).toString(CryptoJS.enc.Base64)
    
    const response = await fetch(`${baseUrl}${path}`, {
      headers: {
        'CB-ACCESS-KEY': credentials.apiKey,
        'CB-ACCESS-SIGN': signature,
        'CB-ACCESS-TIMESTAMP': timestamp.toString(),
        'CB-ACCESS-PASSPHRASE': credentials.passphrase || ''
      }
    })

    if (!response.ok) {
      throw new Error(`Coinbase API error: ${response.status}`)
    }

    const accounts = await response.json()
    
    return {
      exchangeId: 'coinbase',
      isValid: true,
      permissions: ['trade', 'view'], // Coinbase doesn't return explicit permissions
      lastCheck: new Date(),
      rateLimit: {
        current: 0, // Coinbase doesn't expose current usage in headers
        limit: 10000, // Default Coinbase limit
        resetTime: new Date(Date.now() + 3600000) // 1 hour
      },
      latency: 0,
      errorCount: 0
    }
  }

  /**
   * Validate Hyperliquid credentials
   */
  private async validateHyperliquidCredentials(credentials: ExchangeCredentials): Promise<CredentialHealth> {
    // Hyperliquid uses a different authentication mechanism
    const baseUrl = credentials.testnet ? 'https://api.hyperliquid-testnet.xyz' : 'https://api.hyperliquid.xyz'
    
    const response = await fetch(`${baseUrl}/info`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'clearinghouseState',
        user: credentials.apiKey // In Hyperliquid, apiKey is the wallet address
      })
    })

    if (!response.ok) {
      throw new Error(`Hyperliquid API error: ${response.status}`)
    }

    const data = await response.json()
    
    return {
      exchangeId: 'hyperliquid',
      isValid: true,
      permissions: ['trade', 'view'],
      lastCheck: new Date(),
      rateLimit: {
        current: 0,
        limit: 1200,
        resetTime: new Date(Date.now() + 60000)
      },
      latency: 0,
      errorCount: 0
    }
  }

  /**
   * Get health status for all exchanges
   */
  getHealthStatus(): Map<string, CredentialHealth> {
    return new Map(this.healthMonitor)
  }

  /**
   * Start automatic health monitoring
   */
  private startHealthMonitoring(): void {
    setInterval(async () => {
      for (const exchangeId of this.credentials.keys()) {
        await this.validateCredentials(exchangeId)
      }
    }, 300000) // Check every 5 minutes
  }

  /**
   * Rotate API keys (placeholder for future implementation)
   */
  async rotateCredentials(exchangeId: string): Promise<boolean> {
    // This would integrate with exchange APIs that support key rotation
    console.log(`🔄 Key rotation requested for ${exchangeId}`)
    return true
  }

  /**
   * Remove credentials
   */
  async removeCredentials(exchangeId: string): Promise<boolean> {
    try {
      this.credentials.delete(exchangeId)
      this.healthMonitor.delete(exchangeId)
      
      if (this.rotationSchedule.has(exchangeId)) {
        clearTimeout(this.rotationSchedule.get(exchangeId)!)
        this.rotationSchedule.delete(exchangeId)
      }
      
      await this.persistCredentials()
      console.log(`🗑️ Removed credentials for ${exchangeId}`)
      return true
    } catch (error) {
      console.error('Failed to remove credentials:', error)
      return false
    }
  }

  /**
   * Load stored credentials from secure storage
   */
  private async loadStoredCredentials(): Promise<void> {
    try {
      // Skip localStorage access during SSR/build
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return
      }
      
      const stored = localStorage.getItem('cival_encrypted_credentials')
      if (stored) {
        const decryptedData = this.decrypt(stored)
        const credentialsArray = JSON.parse(decryptedData)
        
        for (const cred of credentialsArray) {
          this.credentials.set(cred.exchangeId, cred)
        }
        
        console.log(`📂 Loaded credentials for ${this.credentials.size} exchanges`)
      }
    } catch (error) {
      console.error('Failed to load stored credentials:', error)
    }
  }

  /**
   * Persist credentials to secure storage
   */
  private async persistCredentials(): Promise<void> {
    try {
      // Skip localStorage access during SSR/build
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return
      }
      
      const credentialsArray = Array.from(this.credentials.values())
      const jsonData = JSON.stringify(credentialsArray)
      const encryptedData = this.encrypt(jsonData)
      
      localStorage.setItem('cival_encrypted_credentials', encryptedData)
      console.log('💾 Credentials persisted securely')
    } catch (error) {
      console.error('Failed to persist credentials:', error)
    }
  }

  /**
   * Get list of configured exchanges
   */
  getConfiguredExchanges(): string[] {
    return Array.from(this.credentials.keys())
  }

  /**
   * Check if exchange credentials are valid and ready
   */
  isExchangeReady(exchangeId: string): boolean {
    const health = this.healthMonitor.get(exchangeId)
    return health ? health.isValid && health.errorCount < 5 : false
  }
}

export const secureAPIManager = SecureAPIManager.getInstance()
export default secureAPIManager