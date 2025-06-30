#!/usr/bin/env tsx

/**
 * Railway Configuration Verification Script
 * Tests all environment variables and connections for the AI Agent Trading Dashboard
 */

import { config } from 'dotenv'
import fetch from 'node-fetch'

// Load environment variables
config()

interface ConfigTest {
  name: string
  required: boolean
  test: () => Promise<boolean>
  description: string
}

class RailwayConfigVerifier {
  private tests: ConfigTest[] = []

  constructor() {
    this.setupTests()
  }

  private setupTests() {
    // Core Database Tests
    this.tests.push({
      name: 'DATABASE_URL',
      required: true,
      description: 'PostgreSQL database connection',
      test: async () => {
        const url = process.env.DATABASE_URL
        if (!url) return false
        
        try {
          // Basic URL validation
          new URL(url)
          return url.includes('postgresql://') && url.includes('supabase')
        } catch {
          return false
        }
      }
    })

    this.tests.push({
      name: 'REDIS_URL',
      required: true,
      description: 'Redis cache connection',
      test: async () => {
        const url = process.env.REDIS_URL
        return !!(url && url.startsWith('redis://'))
      }
    })

    // AI Provider Tests
    this.tests.push({
      name: 'OPENAI_API_KEY',
      required: false,
      description: 'OpenAI GPT models',
      test: async () => {
        const key = process.env.OPENAI_API_KEY
        if (!key || !key.startsWith('sk-')) return false
        
        try {
          const response = await fetch('https://api.openai.com/v1/models', {
            headers: { 'Authorization': `Bearer ${key}` }
          })
          return response.ok
        } catch {
          return false
        }
      }
    })

    this.tests.push({
      name: 'ANTHROPIC_API_KEY',
      required: false,
      description: 'Anthropic Claude models',
      test: async () => {
        const key = process.env.ANTHROPIC_API_KEY
        if (!key || !key.startsWith('sk-ant-')) return false
        
        try {
          const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${key}`,
              'Content-Type': 'application/json',
              'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
              model: 'claude-3-haiku-20240307',
              max_tokens: 1,
              messages: [{ role: 'user', content: 'test' }]
            })
          })
          return response.status !== 401
        } catch {
          return false
        }
      }
    })

    this.tests.push({
      name: 'NEXT_PUBLIC_GEMINI_API_KEY',
      required: false,
      description: 'Google Gemini models (free tier)',
      test: async () => {
        const key = process.env.NEXT_PUBLIC_GEMINI_API_KEY
        if (!key) return false
        
        try {
          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`)
          return response.ok
        } catch {
          return false
        }
      }
    })

    // Trading API Tests
    this.tests.push({
      name: 'BINANCE_API_KEY',
      required: false,
      description: 'Binance trading API',
      test: async () => {
        const key = process.env.BINANCE_API_KEY
        const secret = process.env.BINANCE_SECRET_KEY
        return !!(key && secret && key.length > 10)
      }
    })

    this.tests.push({
      name: 'COINBASE_API_KEY',
      required: false,
      description: 'Coinbase Pro trading API',
      test: async () => {
        const key = process.env.COINBASE_API_KEY
        const secret = process.env.COINBASE_SECRET_KEY
        return !!(key && secret && key.length > 10)
      }
    })

    // Frontend Configuration
    this.tests.push({
      name: 'NEXT_PUBLIC_API_URL',
      required: true,
      description: 'Backend API URL',
      test: async () => {
        const url = process.env.NEXT_PUBLIC_API_URL
        if (!url) return false
        
        try {
          const response = await fetch(`${url}/health`)
          return response.ok
        } catch {
          return false
        }
      }
    })

    this.tests.push({
      name: 'NEXT_PUBLIC_WS_URL',
      required: true,
      description: 'WebSocket URL for real-time updates',
      test: async () => {
        const url = process.env.NEXT_PUBLIC_WS_URL
        return !!(url && (url.startsWith('ws://') || url.startsWith('wss://')))
      }
    })
  }

  async runAllTests(): Promise<void> {
    console.log('🚀 Railway Configuration Verification\n')
    console.log('=' .repeat(60))
    
    let passedTests = 0
    let requiredPassed = 0
    let requiredTotal = 0
    
    for (const test of this.tests) {
      process.stdout.write(`Testing ${test.name}... `)
      
      if (test.required) requiredTotal++
      
      try {
        const result = await test.test()
        
        if (result) {
          console.log('✅ PASS')
          passedTests++
          if (test.required) requiredPassed++
        } else {
          console.log('❌ FAIL')
        }
        
        console.log(`   ${test.description}`)
        
        if (!result && test.required) {
          console.log(`   ⚠️  Required for core functionality`)
        }
        
      } catch (error) {
        console.log('💥 ERROR')
        console.log(`   ${error}`)
      }
      
      console.log('')
    }
    
    console.log('=' .repeat(60))
    console.log(`\n📊 Results: ${passedTests}/${this.tests.length} tests passed`)
    console.log(`🔧 Required: ${requiredPassed}/${requiredTotal} critical tests passed`)
    
    if (requiredPassed === requiredTotal) {
      console.log('\n🎉 All required configuration verified! System ready for deployment.')
    } else {
      console.log('\n⚠️  Missing required configuration. Please check failed tests above.')
    }
    
    // AI Provider Summary
    console.log('\n🤖 AI Provider Status:')
    const aiProviders = ['OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'NEXT_PUBLIC_GEMINI_API_KEY']
    const workingProviders = []
    
    for (const provider of aiProviders) {
      const test = this.tests.find(t => t.name === provider)
      if (test) {
        const result = await test.test()
        if (result) {
          workingProviders.push(provider.replace('_API_KEY', '').replace('NEXT_PUBLIC_', ''))
        }
      }
    }
    
    if (workingProviders.length > 0) {
      console.log(`✅ Working providers: ${workingProviders.join(', ')}`)
      console.log('🎯 AI agents will use these providers with intelligent fallbacks')
    } else {
      console.log('❌ No AI providers configured - agents will use local fallback only')
    }
    
    console.log('\n📝 Next Steps:')
    console.log('1. Fix any failed required tests')
    console.log('2. Run: npm run dev (frontend)')
    console.log('3. Run: python python-ai-services/main_consolidated.py (backend)')
    console.log('4. Test agent decision loops in dashboard')
    console.log('5. Deploy to Railway: railway deploy')
  }
}

// Run verification
const verifier = new RailwayConfigVerifier()
verifier.runAllTests().catch(console.error)