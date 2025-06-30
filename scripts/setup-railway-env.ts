#!/usr/bin/env tsx

/**
 * Railway Environment Setup Script
 * Guides through setting up environment variables for the AI Trading Dashboard
 */

import { writeFileSync, existsSync } from 'fs'
import { config } from 'dotenv'

// Load existing environment
config()

interface EnvVariable {
  key: string
  description: string
  required: boolean
  example?: string
  current?: string
}

class RailwayEnvSetup {
  private envVars: EnvVariable[] = []

  constructor() {
    this.setupEnvVars()
  }

  private setupEnvVars() {
    // Core System Variables
    this.envVars.push({
      key: 'DATABASE_URL',
      description: 'PostgreSQL database connection string from Supabase',
      required: true,
      example: 'postgresql://postgres:password@db.supabase.co:5432/postgres',
      current: process.env.DATABASE_URL
    })

    this.envVars.push({
      key: 'REDIS_URL',
      description: 'Redis connection string for caching and sessions',
      required: true,
      example: 'redis://localhost:6379',
      current: process.env.REDIS_URL
    })

    // Frontend API Configuration
    this.envVars.push({
      key: 'NEXT_PUBLIC_API_URL',
      description: 'Backend API URL (Railway backend service URL)',
      required: true,
      example: 'https://your-backend.railway.app',
      current: process.env.NEXT_PUBLIC_API_URL
    })

    this.envVars.push({
      key: 'NEXT_PUBLIC_WS_URL',
      description: 'WebSocket URL for real-time updates',
      required: true,
      example: 'wss://your-backend.railway.app',
      current: process.env.NEXT_PUBLIC_WS_URL
    })

    // AI Provider API Keys
    this.envVars.push({
      key: 'NEXT_PUBLIC_GEMINI_API_KEY',
      description: 'Google Gemini API key (FREE tier available)',
      required: false,
      example: 'AIzaSyA...',
      current: process.env.NEXT_PUBLIC_GEMINI_API_KEY
    })

    this.envVars.push({
      key: 'OPENAI_API_KEY',
      description: 'OpenAI API key for GPT models',
      required: false,
      example: 'sk-...',
      current: process.env.OPENAI_API_KEY
    })

    this.envVars.push({
      key: 'ANTHROPIC_API_KEY',
      description: 'Anthropic API key for Claude models',
      required: false,
      example: 'sk-ant-...',
      current: process.env.ANTHROPIC_API_KEY
    })

    // Trading APIs (Optional)
    this.envVars.push({
      key: 'BINANCE_API_KEY',
      description: 'Binance trading API key (for live trading)',
      required: false,
      example: 'your-binance-api-key',
      current: process.env.BINANCE_API_KEY
    })

    this.envVars.push({
      key: 'BINANCE_SECRET_KEY',
      description: 'Binance trading API secret',
      required: false,
      example: 'your-binance-secret',
      current: process.env.BINANCE_SECRET_KEY
    })

    this.envVars.push({
      key: 'COINBASE_API_KEY',
      description: 'Coinbase Pro API key (for live trading)',
      required: false,
      example: 'your-coinbase-api-key',
      current: process.env.COINBASE_API_KEY
    })

    this.envVars.push({
      key: 'COINBASE_SECRET_KEY',
      description: 'Coinbase Pro API secret',
      required: false,
      example: 'your-coinbase-secret',
      current: process.env.COINBASE_SECRET_KEY
    })

    // Additional Configuration
    this.envVars.push({
      key: 'NODE_ENV',
      description: 'Node environment',
      required: true,
      example: 'production',
      current: process.env.NODE_ENV || 'development'
    })

    this.envVars.push({
      key: 'NEXTAUTH_SECRET',
      description: 'NextAuth secret for session encryption',
      required: false,
      example: 'your-secret-key',
      current: process.env.NEXTAUTH_SECRET
    })
  }

  generateRailwayEnvFile(): void {
    console.log('🚀 Railway Environment Configuration Generator\n')
    console.log('=' .repeat(60))
    
    let envContent = '# Railway Environment Variables for AI Trading Dashboard\n'
    envContent += '# Generated on ' + new Date().toISOString() + '\n\n'

    console.log('📋 Current Environment Variable Status:\n')

    for (const envVar of this.envVars) {
      const hasValue = !!(envVar.current && envVar.current.length > 0)
      const status = hasValue ? '✅ SET' : (envVar.required ? '❌ MISSING (REQUIRED)' : '⚪ NOT SET (OPTIONAL)')
      
      console.log(`${envVar.key}: ${status}`)
      if (envVar.description) {
        console.log(`   ${envVar.description}`)
      }
      if (!hasValue && envVar.example) {
        console.log(`   Example: ${envVar.example}`)
      }
      console.log('')

      // Add to env file
      envContent += `# ${envVar.description}\n`
      if (envVar.required && !hasValue) {
        envContent += `# REQUIRED - Please set this value\n`
      }
      envContent += `${envVar.key}=${envVar.current || (envVar.example || '')}\n\n`
    }

    // Write .env.railway file
    const railwayEnvPath = '.env.railway'
    writeFileSync(railwayEnvPath, envContent)
    
    console.log('=' .repeat(60))
    console.log(`\n📄 Environment file generated: ${railwayEnvPath}`)
    console.log('\n🔧 Next Steps:')
    console.log('1. Review and update values in .env.railway')
    console.log('2. Copy variables to Railway dashboard')
    console.log('3. Run: npm run verify:config')
    console.log('4. Test AI agents: npm run dev')
    console.log('5. Deploy: railway deploy')

    // AI Provider Recommendations
    console.log('\n🤖 AI Provider Setup Recommendations:')
    console.log('• Gemini API (FREE): https://makersuite.google.com/app/apikey')
    console.log('• OpenAI API: https://platform.openai.com/api-keys')
    console.log('• Anthropic API: https://console.anthropic.com/')
    
    // Check for potential issues
    this.checkForIssues()
  }

  private checkForIssues(): void {
    console.log('\n🔍 Configuration Health Check:')
    
    const requiredMissing = this.envVars
      .filter(v => v.required && !v.current)
      .map(v => v.key)
    
    if (requiredMissing.length > 0) {
      console.log(`❌ Missing required variables: ${requiredMissing.join(', ')}`)
    } else {
      console.log('✅ All required variables are set')
    }
    
    const aiProviders = this.envVars
      .filter(v => v.key.includes('API_KEY') && v.key.includes('GEMINI') || v.key.includes('OPENAI') || v.key.includes('ANTHROPIC'))
      .filter(v => v.current)
      .length
    
    if (aiProviders === 0) {
      console.log('⚠️  No AI providers configured - agents will use local fallback only')
    } else {
      console.log(`✅ ${aiProviders} AI provider(s) configured`)
    }
    
    // Database check
    const hasDatabase = !!(process.env.DATABASE_URL && process.env.DATABASE_URL.includes('postgresql'))
    if (!hasDatabase) {
      console.log('❌ Database URL not configured or invalid')
    } else {
      console.log('✅ Database URL configured')
    }
    
    console.log('\n💡 Pro Tips:')
    console.log('• Use Supabase for free PostgreSQL hosting')
    console.log('• Upstash Redis offers free Redis hosting')
    console.log('• Start with Gemini API (free) for AI features')
    console.log('• Test paper trading before enabling live APIs')
  }
}

// Run setup
const setup = new RailwayEnvSetup()
setup.generateRailwayEnvFile()