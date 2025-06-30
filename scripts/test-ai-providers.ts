#!/usr/bin/env tsx

/**
 * AI Provider Testing Script
 * Tests all configured AI providers with actual API calls
 */

import { config } from 'dotenv'
import { existsSync } from 'fs'

// Load environment variables from multiple sources
config() // Load .env
if (existsSync('.env.local')) {
  config({ path: '.env.local' }) // Load .env.local
}

interface ProviderTest {
  name: string
  test: () => Promise<{ success: boolean; message: string; responseTime?: number }>
}

class AIProviderTester {
  private tests: ProviderTest[] = []

  constructor() {
    this.setupTests()
  }

  private setupTests() {
    // Gemini API Test
    this.tests.push({
      name: 'Gemini API',
      test: async () => {
        const key = process.env.NEXT_PUBLIC_GEMINI_API_KEY
        if (!key) {
          return { success: false, message: 'API key not configured' }
        }

        const startTime = Date.now()
        try {
          const fetch = (await import('node-fetch')).default
          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: 'Say "AI agent test successful" in exactly 4 words.' }] }]
            })
          })

          const responseTime = Date.now() - startTime
          
          if (response.ok) {
            const data = await response.json() as any
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response'
            return { 
              success: true, 
              message: `Response: "${text.trim()}"`, 
              responseTime 
            }
          } else {
            const error = await response.text()
            return { 
              success: false, 
              message: `HTTP ${response.status}: ${error}`,
              responseTime 
            }
          }
        } catch (error) {
          return { 
            success: false, 
            message: `Network error: ${error}`,
            responseTime: Date.now() - startTime
          }
        }
      }
    })

    // OpenAI API Test  
    this.tests.push({
      name: 'OpenAI API',
      test: async () => {
        const key = process.env.OPENAI_API_KEY
        if (!key) {
          return { success: false, message: 'API key not configured' }
        }

        const startTime = Date.now()
        try {
          const fetch = (await import('node-fetch')).default
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${key}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: 'gpt-3.5-turbo',
              messages: [{ role: 'user', content: 'Say "AI agent test successful" in exactly 4 words.' }],
              max_tokens: 10
            })
          })

          const responseTime = Date.now() - startTime
          
          if (response.ok) {
            const data = await response.json() as any
            const text = data.choices?.[0]?.message?.content || 'No response'
            return { 
              success: true, 
              message: `Response: "${text.trim()}"`, 
              responseTime 
            }
          } else {
            const error = await response.text()
            return { 
              success: false, 
              message: `HTTP ${response.status}: ${error}`,
              responseTime 
            }
          }
        } catch (error) {
          return { 
            success: false, 
            message: `Network error: ${error}`,
            responseTime: Date.now() - startTime
          }
        }
      }
    })

    // Anthropic API Test
    this.tests.push({
      name: 'Anthropic API',
      test: async () => {
        const key = process.env.ANTHROPIC_API_KEY
        if (!key) {
          return { success: false, message: 'API key not configured' }
        }

        const startTime = Date.now()
        try {
          const fetch = (await import('node-fetch')).default
          const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${key}`,
              'Content-Type': 'application/json',
              'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
              model: 'claude-3-haiku-20240307',
              max_tokens: 10,
              messages: [{ role: 'user', content: 'Say "AI agent test successful" in exactly 4 words.' }]
            })
          })

          const responseTime = Date.now() - startTime
          
          if (response.ok) {
            const data = await response.json() as any
            const text = data.content?.[0]?.text || 'No response'
            return { 
              success: true, 
              message: `Response: "${text.trim()}"`, 
              responseTime 
            }
          } else {
            const error = await response.text()
            return { 
              success: false, 
              message: `HTTP ${response.status}: ${error}`,
              responseTime 
            }
          }
        } catch (error) {
          return { 
            success: false, 
            message: `Network error: ${error}`,
            responseTime: Date.now() - startTime
          }
        }
      }
    })
  }

  async runAllTests(): Promise<void> {
    console.log('🤖 AI Provider Testing Suite\n')
    console.log('=' .repeat(60))
    
    let workingProviders = 0
    const results: Array<{ name: string; success: boolean; message: string; responseTime?: number }> = []
    
    for (const test of this.tests) {
      process.stdout.write(`Testing ${test.name}... `)
      
      try {
        const result = await test.test()
        results.push({ name: test.name, ...result })
        
        if (result.success) {
          console.log(`✅ PASS (${result.responseTime}ms)`)
          console.log(`   ${result.message}`)
          workingProviders++
        } else {
          console.log('❌ FAIL')
          console.log(`   ${result.message}`)
        }
        
      } catch (error) {
        console.log('💥 ERROR')
        console.log(`   ${error}`)
        results.push({ name: test.name, success: false, message: String(error) })
      }
      
      console.log('')
    }
    
    console.log('=' .repeat(60))
    console.log(`\n📊 Results: ${workingProviders}/${this.tests.length} providers working`)
    
    if (workingProviders > 0) {
      console.log('\n🎉 AI Agent System Ready!')
      console.log('✅ The unified LLM service will use working providers with intelligent fallbacks')
      
      const fastestProvider = results
        .filter(r => r.success && r.responseTime)
        .sort((a, b) => (a.responseTime || 0) - (b.responseTime || 0))[0]
      
      if (fastestProvider) {
        console.log(`⚡ Fastest provider: ${fastestProvider.name} (${fastestProvider.responseTime}ms)`)
      }
    } else {
      console.log('\n⚠️  No AI providers working - system will use local fallback only')
    }
    
    console.log('\n🚀 Next Steps:')
    console.log('1. Start dashboard: npm run dev')
    console.log('2. Go to /dashboard and test agent creation')
    console.log('3. Watch agent decision loops in real-time')
    console.log('4. Monitor performance in browser console')
    
    // Generate summary for Railway deployment
    console.log('\n📋 Railway Deployment Summary:')
    const workingKeys = results.filter(r => r.success).map(r => {
      if (r.name === 'Gemini API') return 'NEXT_PUBLIC_GEMINI_API_KEY'
      if (r.name === 'OpenAI API') return 'OPENAI_API_KEY'
      if (r.name === 'Anthropic API') return 'ANTHROPIC_API_KEY'
      return r.name
    })
    
    if (workingKeys.length > 0) {
      console.log(`✅ Working environment variables: ${workingKeys.join(', ')}`)
      console.log('🎯 Copy these variables to your Railway project settings')
    }
  }
}

// Run tests
const tester = new AIProviderTester()
tester.runAllTests().catch(console.error)