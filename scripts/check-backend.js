#!/usr/bin/env node

/**
 * Backend Health Check Script
 * Verifies that the Python FastAPI backend is running and accessible
 */

const http = require('http');

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

console.log('🔍 Checking backend health at:', BACKEND_URL);

// Parse URL
const url = new URL(BACKEND_URL);

const options = {
  hostname: url.hostname,
  port: url.port || 8000,
  path: '/health',
  method: 'GET',
  timeout: 5000
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('✅ Backend is healthy!');
      console.log('📊 Response:', data);
      
      // Try to parse JSON response
      try {
        const health = JSON.parse(data);
        console.log('\n🔧 Service Status:');
        if (health.services) {
          Object.entries(health.services).forEach(([service, status]) => {
            console.log(`  - ${service}: ${status}`);
          });
        }
      } catch (e) {
        // Not JSON, that's okay
      }
      
      process.exit(0);
    } else {
      console.error('❌ Backend returned status:', res.statusCode);
      console.error('Response:', data);
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Failed to connect to backend:', error.message);
  console.log('\n💡 Make sure the backend is running:');
  console.log('   cd python-ai-services');
  console.log('   python main_consolidated.py');
  console.log('\nOr use Docker Compose:');
  console.log('   docker-compose -f docker-compose.dev.yml up');
  process.exit(1);
});

req.on('timeout', () => {
  console.error('❌ Request timed out after 5 seconds');
  req.destroy();
  process.exit(1);
});

req.end();