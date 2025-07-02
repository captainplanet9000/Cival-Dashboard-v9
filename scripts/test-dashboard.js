#!/usr/bin/env node

/**
 * Dashboard Functionality Test Script
 * Verifies all major features are working correctly
 */

const http = require('http');
const https = require('https');

console.log('🧪 Testing AI Trading Dashboard Functionality...\n');

const tests = [
  {
    name: 'Frontend Server',
    url: 'http://localhost:3000',
    path: '/',
    expected: 200,
    description: 'Next.js server is running'
  },
  {
    name: 'Dashboard Page',
    url: 'http://localhost:3000',
    path: '/dashboard',
    expected: 200,
    description: 'Main dashboard is accessible'
  },
  {
    name: 'Trading Page',
    url: 'http://localhost:3000',
    path: '/trading',
    expected: 200,
    description: 'Trading interface is accessible'
  },
  {
    name: 'Agents Page',
    url: 'http://localhost:3000',
    path: '/agents',
    expected: 200,
    description: 'Agent management is accessible'
  },
  {
    name: 'Portfolio Page',
    url: 'http://localhost:3000',
    path: '/portfolio',
    expected: 200,
    description: 'Portfolio overview is accessible'
  },
  {
    name: 'Analytics Page',
    url: 'http://localhost:3000',
    path: '/analytics',
    expected: 200,
    description: 'Analytics dashboard is accessible'
  },
  {
    name: 'Backend API',
    url: 'http://localhost:8000',
    path: '/health',
    expected: 200,
    description: 'Backend API is running',
    optional: true
  },
  {
    name: 'API Test Endpoint',
    url: 'http://localhost:3000',
    path: '/api/test-backend',
    expected: [200, 503],
    description: 'Backend connectivity test'
  }
];

let passed = 0;
let failed = 0;

async function testEndpoint(test) {
  return new Promise((resolve) => {
    const url = new URL(test.url);
    const client = url.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: test.path,
      method: 'GET',
      timeout: 5000,
      headers: {
        'User-Agent': 'Dashboard-Test-Script'
      }
    };

    const req = client.request(options, (res) => {
      const expectedCodes = Array.isArray(test.expected) ? test.expected : [test.expected];
      const success = expectedCodes.includes(res.statusCode);
      
      if (success) {
        console.log(`✅ ${test.name}: ${test.description}`);
        console.log(`   Status: ${res.statusCode}`);
        passed++;
      } else {
        console.log(`❌ ${test.name}: Expected ${test.expected}, got ${res.statusCode}`);
        if (!test.optional) failed++;
      }
      
      resolve(success);
    });

    req.on('error', (error) => {
      if (test.optional) {
        console.log(`⚠️  ${test.name}: ${error.message} (optional - skipping)`);
      } else {
        console.log(`❌ ${test.name}: ${error.message}`);
        failed++;
      }
      resolve(false);
    });

    req.on('timeout', () => {
      console.log(`⏱️  ${test.name}: Request timed out`);
      if (!test.optional) failed++;
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

async function runTests() {
  console.log('Running dashboard tests...\n');
  
  for (const test of tests) {
    await testEndpoint(test);
    await new Promise(resolve => setTimeout(resolve, 100)); // Small delay between tests
  }
  
  console.log('\n📊 Test Results:');
  console.log(`   Passed: ${passed}`);
  console.log(`   Failed: ${failed}`);
  
  if (failed === 0) {
    console.log('\n✨ All tests passed! Dashboard is working correctly.');
    console.log('\n🎯 Next steps:');
    console.log('   1. Visit http://localhost:3000/dashboard');
    console.log('   2. Try creating paper trades');
    console.log('   3. Set up AI agents');
    console.log('   4. Test trading strategies');
  } else {
    console.log('\n⚠️  Some tests failed. Check:');
    console.log('   1. Is the frontend running? npm run dev');
    console.log('   2. Is the backend running? npm run backend:start');
    console.log('   3. Check logs for errors');
  }
  
  process.exit(failed > 0 ? 1 : 0);
}

// Check if services are likely running
console.log('📍 Checking service ports...\n');
runTests();