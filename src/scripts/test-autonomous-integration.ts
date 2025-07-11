#!/usr/bin/env node

/**
 * Autonomous System Integration Test Script
 * This script validates that all autonomous components are properly integrated
 */

import { AutonomousWebSocketClient } from '@/lib/websocket/autonomous-events'
import { autonomousClient } from '@/lib/api/autonomous-client'

// Terminal colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
}

// Test results tracker
interface TestResult {
  component: string
  test: string
  passed: boolean
  message: string
  duration?: number
}

const testResults: TestResult[] = []

// Helper function to log test results
function logTest(component: string, test: string, passed: boolean, message: string, duration?: number) {
  const status = passed ? `${colors.green}✓${colors.reset}` : `${colors.red}✗${colors.reset}`
  const color = passed ? colors.green : colors.red
  console.log(`${status} ${colors.cyan}[${component}]${colors.reset} ${test}: ${color}${message}${colors.reset}${duration ? ` (${duration}ms)` : ''}`)
  
  testResults.push({ component, test, passed, message, duration })
}

// Test WebSocket connectivity
async function testWebSocketConnection(): Promise<void> {
  console.log(`\n${colors.blue}Testing WebSocket Connection...${colors.reset}`)
  
  const client = new AutonomousWebSocketClient()
  const startTime = Date.now()
  
  try {
    await client.connect()
    const duration = Date.now() - startTime
    
    if (client.connected) {
      logTest('WebSocket', 'Connection', true, 'Connected successfully', duration)
      
      // Test event subscription
      let eventReceived = false
      const unsubscribe = client.subscribe('autonomous_system.status_update', (data) => {
        eventReceived = true
      })
      
      // Emit test event
      client.emit('autonomous_system.status_update', {
        system_health: 'healthy',
        active_agents: 4,
        emergency_mode: false,
        timestamp: new Date().toISOString()
      })
      
      // Wait for event
      await new Promise(resolve => setTimeout(resolve, 100))
      
      logTest('WebSocket', 'Event Subscription', eventReceived, eventReceived ? 'Events working' : 'Events not received')
      
      unsubscribe()
      client.disconnect()
    } else {
      logTest('WebSocket', 'Connection', false, 'Failed to connect')
    }
  } catch (error) {
    logTest('WebSocket', 'Connection', false, `Error: ${error.message}`)
  }
}

// Test API endpoints
async function testAPIEndpoints(): Promise<void> {
  console.log(`\n${colors.blue}Testing API Endpoints...${colors.reset}`)
  
  // Test Health Monitor API
  try {
    const startTime = Date.now()
    const healthStatus = await autonomousClient.getHealthStatus()
    const duration = Date.now() - startTime
    
    if (healthStatus?.overall_health) {
      logTest('API', 'Health Monitor', true, `Health: ${healthStatus.overall_health}`, duration)
    } else {
      logTest('API', 'Health Monitor', false, 'Invalid response format')
    }
  } catch (error) {
    logTest('API', 'Health Monitor', false, `Error: ${error.message}`)
  }
  
  // Test Communication API
  try {
    const messages = await autonomousClient.getAgentMessages()
    logTest('API', 'Agent Communication', true, `${messages.length} messages found`)
  } catch (error) {
    logTest('API', 'Agent Communication', false, `Error: ${error.message}`)
  }
  
  // Test Consensus API
  try {
    const decisions = await autonomousClient.getPendingDecisions()
    logTest('API', 'Consensus Decisions', true, `${decisions.length} pending decisions`)
  } catch (error) {
    logTest('API', 'Consensus Decisions', false, `Error: ${error.message}`)
  }
  
  // Test Market Regime API
  try {
    const regime = await autonomousClient.getCurrentMarketRegime()
    logTest('API', 'Market Regime', true, `Current regime: ${regime?.primary_regime || 'unknown'}`)
  } catch (error) {
    logTest('API', 'Market Regime', false, `Error: ${error.message}`)
  }
  
  // Test Emergency API
  try {
    const emergencies = await autonomousClient.getActiveEmergencies()
    logTest('API', 'Emergency Protocols', true, `${emergencies.length} active emergencies`)
  } catch (error) {
    logTest('API', 'Emergency Protocols', false, `Error: ${error.message}`)
  }
}

// Test component imports
async function testComponentImports(): Promise<void> {
  console.log(`\n${colors.blue}Testing Component Imports...${colors.reset}`)
  
  const components = [
    { name: 'AutonomousControlCenter', path: '@/components/autonomous/AutonomousControlCenter' },
    { name: 'HealthMonitorDashboard', path: '@/components/autonomous/HealthMonitorDashboard' },
    { name: 'AgentCommunicationHub', path: '@/components/autonomous/AgentCommunicationHub' },
    { name: 'ConsensusVotingInterface', path: '@/components/autonomous/ConsensusVotingInterface' },
    { name: 'MarketRegimeMonitor', path: '@/components/autonomous/MarketRegimeMonitor' },
    { name: 'EmergencyControlPanel', path: '@/components/autonomous/EmergencyControlPanel' }
  ]
  
  for (const component of components) {
    try {
      const mod = await import(component.path)
      if (mod.default || mod[component.name]) {
        logTest('Components', component.name, true, 'Import successful')
      } else {
        logTest('Components', component.name, false, 'Component not exported')
      }
    } catch (error) {
      logTest('Components', component.name, false, `Import failed: ${error.message}`)
    }
  }
}

// Test service integrations
async function testServiceIntegrations(): Promise<void> {
  console.log(`\n${colors.blue}Testing Service Integrations...${colors.reset}`)
  
  // Test sending a message between agents
  try {
    const result = await autonomousClient.sendAgentMessage(
      'test-agent-1',
      'test-agent-2',
      'test',
      'normal',
      'Integration Test',
      'This is a test message'
    )
    logTest('Integration', 'Agent Messaging', true, 'Message sent successfully')
  } catch (error) {
    logTest('Integration', 'Agent Messaging', false, `Error: ${error.message}`)
  }
  
  // Test creating a decision
  try {
    const decision = await autonomousClient.createDecision({
      title: 'Test Decision',
      description: 'Integration test decision',
      decision_type: 'test',
      options: ['approve', 'reject'],
      required_agents: ['test-agent-1', 'test-agent-2'],
      consensus_algorithm: 'simple_majority'
    })
    logTest('Integration', 'Decision Creation', true, `Decision ID: ${decision.decision_id}`)
  } catch (error) {
    logTest('Integration', 'Decision Creation', false, `Error: ${error.message}`)
  }
  
  // Test market regime detection
  try {
    const regime = await autonomousClient.detectMarketRegime({
      volatility_1d: 0.15,
      volatility_7d: 0.18,
      trend_strength: 0.65,
      volume_ratio: 1.2
    })
    logTest('Integration', 'Market Regime Detection', true, `Detected: ${regime.primary_regime}`)
  } catch (error) {
    logTest('Integration', 'Market Regime Detection', false, `Error: ${error.message}`)
  }
}

// Test data flow
async function testDataFlow(): Promise<void> {
  console.log(`\n${colors.blue}Testing Data Flow...${colors.reset}`)
  
  // Test WebSocket to UI flow
  const client = new AutonomousWebSocketClient()
  let uiUpdateReceived = false
  
  try {
    await client.connect()
    
    // Subscribe to health updates
    client.subscribe('health_monitor.service_status_change', (data) => {
      uiUpdateReceived = true
    })
    
    // Simulate health status change
    client.emit('health_monitor.service_status_change', {
      service_name: 'test-service',
      old_status: 'healthy',
      new_status: 'degraded',
      timestamp: new Date().toISOString(),
      metrics: {}
    })
    
    await new Promise(resolve => setTimeout(resolve, 500))
    
    logTest('Data Flow', 'WebSocket to UI', uiUpdateReceived, uiUpdateReceived ? 'Updates flowing' : 'No updates received')
    
    client.disconnect()
  } catch (error) {
    logTest('Data Flow', 'WebSocket to UI', false, `Error: ${error.message}`)
  }
  
  // Test API to WebSocket flow
  try {
    // This would normally trigger a WebSocket event from the backend
    await autonomousClient.triggerRecovery('test-service', 'restart')
    logTest('Data Flow', 'API to WebSocket', true, 'Recovery triggered')
  } catch (error) {
    logTest('Data Flow', 'API to WebSocket', false, `Error: ${error.message}`)
  }
}

// Generate test report
function generateReport(): void {
  console.log(`\n${colors.blue}═══════════════════════════════════════════════════════${colors.reset}`)
  console.log(`${colors.yellow}AUTONOMOUS SYSTEM INTEGRATION TEST REPORT${colors.reset}`)
  console.log(`${colors.blue}═══════════════════════════════════════════════════════${colors.reset}\n`)
  
  const totalTests = testResults.length
  const passedTests = testResults.filter(r => r.passed).length
  const failedTests = totalTests - passedTests
  const passRate = ((passedTests / totalTests) * 100).toFixed(1)
  
  console.log(`Total Tests: ${totalTests}`)
  console.log(`${colors.green}Passed: ${passedTests}${colors.reset}`)
  console.log(`${colors.red}Failed: ${failedTests}${colors.reset}`)
  console.log(`Pass Rate: ${passRate}%\n`)
  
  // Group results by component
  const componentResults = testResults.reduce((acc, result) => {
    if (!acc[result.component]) {
      acc[result.component] = { passed: 0, failed: 0 }
    }
    if (result.passed) {
      acc[result.component].passed++
    } else {
      acc[result.component].failed++
    }
    return acc
  }, {} as Record<string, { passed: number; failed: number }>)
  
  console.log('Component Summary:')
  Object.entries(componentResults).forEach(([component, stats]) => {
    const componentPassRate = ((stats.passed / (stats.passed + stats.failed)) * 100).toFixed(0)
    const status = stats.failed === 0 ? colors.green : colors.red
    console.log(`  ${component}: ${status}${componentPassRate}%${colors.reset} (${stats.passed}/${stats.passed + stats.failed})`)
  })
  
  // List failed tests
  if (failedTests > 0) {
    console.log(`\n${colors.red}Failed Tests:${colors.reset}`)
    testResults.filter(r => !r.passed).forEach(result => {
      console.log(`  - [${result.component}] ${result.test}: ${result.message}`)
    })
  }
  
  // Overall status
  console.log(`\n${colors.blue}═══════════════════════════════════════════════════════${colors.reset}`)
  if (passRate === '100.0') {
    console.log(`${colors.green}✓ ALL TESTS PASSED - AUTONOMOUS SYSTEM READY${colors.reset}`)
  } else if (parseFloat(passRate) >= 80) {
    console.log(`${colors.yellow}⚠ MOSTLY PASSING - Some issues need attention${colors.reset}`)
  } else {
    console.log(`${colors.red}✗ CRITICAL ISSUES - System not ready for production${colors.reset}`)
  }
  console.log(`${colors.blue}═══════════════════════════════════════════════════════${colors.reset}\n`)
}

// Main test runner
async function runTests(): Promise<void> {
  console.log(`${colors.cyan}Starting Autonomous System Integration Tests...${colors.reset}`)
  console.log(`${colors.cyan}Testing environment: ${process.env.NODE_ENV || 'development'}${colors.reset}`)
  
  try {
    // Run all test suites
    await testWebSocketConnection()
    await testAPIEndpoints()
    await testComponentImports()
    await testServiceIntegrations()
    await testDataFlow()
    
    // Generate final report
    generateReport()
  } catch (error) {
    console.error(`${colors.red}Test runner error: ${error.message}${colors.reset}`)
    process.exit(1)
  }
}

// Run tests if executed directly
if (require.main === module) {
  runTests().catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
}

export { runTests, testResults }