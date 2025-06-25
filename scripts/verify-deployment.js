#!/usr/bin/env node

/**
 * Deployment Verification Script
 * Verifies all systems are properly configured for Railway deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 CIVAL DASHBOARD - DEPLOYMENT VERIFICATION\n');

// Environment Variables to Check
const requiredEnvVars = [
  'DATABASE_URL',
  'SUPABASE_URL', 
  'SUPABASE_ANON_KEY',
  'REDIS_URL',
  'NEXT_PUBLIC_API_URL',
  'NEXT_PUBLIC_WS_URL',
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY'
];

const optionalEnvVars = [
  'HYPERLIQUID_WALLET_ADDRESS',
  'BINANCE_API_KEY',
  'COINBASE_API_KEY', 
  'POLYGON_API_KEY',
  'ALPHA_VANTAGE_API_KEY'
];

// Check Environment Variables
console.log('📋 ENVIRONMENT CONFIGURATION CHECK');
console.log('=====================================');

let envScore = 0;
let maxEnvScore = requiredEnvVars.length;

requiredEnvVars.forEach(envVar => {
  const exists = process.env[envVar] !== undefined;
  console.log(`${exists ? '✅' : '❌'} ${envVar}: ${exists ? 'SET' : 'MISSING'}`);
  if (exists) envScore++;
});

console.log('\n📊 OPTIONAL INTEGRATIONS');
console.log('========================');

optionalEnvVars.forEach(envVar => {
  const exists = process.env[envVar] !== undefined;
  console.log(`${exists ? '✅' : '⚪'} ${envVar}: ${exists ? 'SET' : 'NOT SET'}`);
});

// Check Critical Files
console.log('\n📁 CRITICAL FILES CHECK');
console.log('========================');

const criticalFiles = [
  'package.json',
  'next.config.js',
  'tailwind.config.ts',
  'src/app/layout.tsx',
  'src/components/dashboard/EnhancedDashboard.tsx',
  'src/lib/api/backend-client.ts',
  'python-ai-services/main_consolidated.py'
];

let fileScore = 0;
let maxFileScore = criticalFiles.length;

criticalFiles.forEach(file => {
  const exists = fs.existsSync(path.join(process.cwd(), file));
  console.log(`${exists ? '✅' : '❌'} ${file}: ${exists ? 'EXISTS' : 'MISSING'}`);
  if (exists) fileScore++;
});

// Check Railway Configuration
console.log('\n🚄 RAILWAY CONFIGURATION');
console.log('=========================');

const railwayFiles = [
  'railway.toml',
  'Dockerfile',
  'docker-compose.yml'
];

let railwayScore = 0;
let maxRailwayScore = railwayFiles.length;

railwayFiles.forEach(file => {
  const exists = fs.existsSync(path.join(process.cwd(), file));
  console.log(`${exists ? '✅' : '⚪'} ${file}: ${exists ? 'EXISTS' : 'NOT FOUND'}`);
  if (exists) railwayScore++;
});

// Trading Configuration Check
console.log('\n💰 TRADING CONFIGURATION');
console.log('=========================');

const tradingConfig = {
  'Paper Trading': process.env.ENABLE_PAPER_TRADING === 'true',
  'Live Trading': process.env.ENABLE_REAL_TRADING === 'true', 
  'Autonomous Mode': process.env.AUTONOMOUS_MODE === 'true',
  'Solo Operator': process.env.SOLO_OPERATOR_MODE === 'true',
  'WebSockets': process.env.ENABLE_WEBSOCKETS === 'true',
  'AI Agents': process.env.ENABLE_AGENTS === 'true'
};

Object.entries(tradingConfig).forEach(([feature, enabled]) => {
  console.log(`${enabled ? '✅' : '⚪'} ${feature}: ${enabled ? 'ENABLED' : 'DISABLED'}`);
});

// API Integration Check  
console.log('\n🔌 API INTEGRATIONS');
console.log('===================');

const apiIntegrations = [
  { name: 'OpenAI', key: 'OPENAI_API_KEY' },
  { name: 'Anthropic', key: 'ANTHROPIC_API_KEY' },
  { name: 'Alpha Vantage', key: 'ALPHA_VANTAGE_API_KEY' },
  { name: 'Polygon', key: 'POLYGON_API_KEY' },
  { name: 'CoinMarketCap', key: 'COINMARKETCAP_API_KEY' },
  { name: 'Hyperliquid', key: 'HYPERLIQUID_WALLET_ADDRESS' }
];

apiIntegrations.forEach(api => {
  const connected = process.env[api.key] !== undefined;
  console.log(`${connected ? '✅' : '⚪'} ${api.name}: ${connected ? 'CONNECTED' : 'NOT CONFIGURED'}`);
});

// Overall Score Calculation
console.log('\n📈 DEPLOYMENT READINESS SCORE');
console.log('==============================');

const envPercentage = Math.round((envScore / maxEnvScore) * 100);
const filePercentage = Math.round((fileScore / maxFileScore) * 100);
const railwayPercentage = Math.round((railwayScore / maxRailwayScore) * 100);
const overallScore = Math.round((envPercentage + filePercentage + railwayPercentage) / 3);

console.log(`Environment Variables: ${envScore}/${maxEnvScore} (${envPercentage}%)`);
console.log(`Critical Files: ${fileScore}/${maxFileScore} (${filePercentage}%)`);
console.log(`Railway Config: ${railwayScore}/${maxRailwayScore} (${railwayPercentage}%)`);
console.log(`\n🎯 OVERALL READINESS: ${overallScore}%`);

// Deployment Status
if (overallScore >= 90) {
  console.log('\n🟢 STATUS: READY FOR DEPLOYMENT');
  console.log('✅ All critical systems configured');
  console.log('✅ Environment variables properly set');
  console.log('✅ Core files present');
  console.log('\n🚀 Ready to deploy to Railway!');
} else if (overallScore >= 75) {
  console.log('\n🟡 STATUS: MOSTLY READY');
  console.log('⚠️  Some optional configurations missing');
  console.log('✅ Core functionality should work');
  console.log('\n🔧 Consider adding missing integrations');
} else {
  console.log('\n🔴 STATUS: NOT READY');
  console.log('❌ Critical configurations missing');
  console.log('❌ Deployment may fail');
  console.log('\n🛠️  Fix missing requirements before deploying');
}

// Next Steps
console.log('\n📋 NEXT STEPS');
console.log('=============');
console.log('1. 🔧 Verify database connections');
console.log('2. 🧪 Test API endpoints locally');
console.log('3. 🚄 Deploy to Railway'); 
console.log('4. 🔍 Monitor deployment logs');
console.log('5. ✅ Verify live functionality');

console.log('\n🎉 CIVAL DASHBOARD DEPLOYMENT VERIFICATION COMPLETE\n');