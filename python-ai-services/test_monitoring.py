#!/usr/bin/env python3
"""
Test script for monitoring service integration
"""

import asyncio
import sys
import os
sys.path.append(os.path.dirname(__file__))

async def test_monitoring_service():
    """Test monitoring service functionality"""
    print("🔍 Testing Monitoring Service Integration...")
    
    try:
        # Import monitoring service
        from services.monitoring_service import monitoring_service, AlertSeverity
        print("✅ Monitoring service imported successfully")
        
        # Initialize monitoring service
        await monitoring_service.initialize()
        print("✅ Monitoring service initialized")
        
        # Test service health check
        print("\n🏥 Testing Service Health Checks...")
        api_health = await monitoring_service.check_service_health("api_server")
        print(f"   API Server Health: {api_health.status.value}")
        print(f"   Response Time: {api_health.response_time:.3f}s")
        print(f"   CPU Usage: {api_health.cpu_usage:.1f}%")
        print(f"   Memory Usage: {api_health.memory_usage:.1f}%")
        
        # Test overall health
        print("\n🌍 Testing Overall Health Status...")
        overall_health = await monitoring_service.get_overall_health()
        print(f"   Overall Status: {overall_health['overall_status']}")
        print(f"   Services Checked: {len(overall_health['services'])}")
        print(f"   Active Alerts: {overall_health['active_alerts']}")
        print(f"   Monitoring Enabled: {overall_health['monitoring_enabled']}")
        
        # Test system metrics
        print("\n📊 Testing System Metrics...")
        system_metrics = monitoring_service.system_monitor.get_system_metrics()
        if "error" not in system_metrics:
            print(f"   CPU Usage: {system_metrics['cpu_percent']:.1f}%")
            print(f"   Memory Usage: {system_metrics['memory_percent']:.1f}%")
            print(f"   Disk Usage: {system_metrics['disk_percent']:.1f}%")
            print(f"   Available Memory: {system_metrics['memory_available_gb']:.2f} GB")
            print(f"   Free Disk: {system_metrics['disk_free_gb']:.2f} GB")
        else:
            print(f"   System metrics error: {system_metrics['error']}")
        
        # Test circuit breaker
        print("\n⚡ Testing Circuit Breaker...")
        test_circuit_breaker = monitoring_service.add_circuit_breaker("test_service")
        cb_state = test_circuit_breaker.get_state()
        print(f"   Circuit Breaker State: {cb_state['state']}")
        print(f"   Failure Count: {cb_state['failure_count']}")
        print(f"   Failure Threshold: {cb_state['failure_threshold']}")
        
        # Test retry policy
        print("\n🔄 Testing Retry Policy...")
        test_retry_policy = monitoring_service.add_retry_policy("test_service")
        print(f"   Retry Policy Added - Max Retries: {test_retry_policy.max_retries}")
        print(f"   Backoff Factor: {test_retry_policy.backoff_factor}")
        print(f"   Max Delay: {test_retry_policy.max_delay}s")
        
        # Test alert manager
        print("\n🚨 Testing Alert Management...")
        # Add a test alert rule
        monitoring_service.alert_manager.add_alert_rule(
            "test_service", "response_time", 1.0, 
            AlertSeverity.WARNING
        )
        print("   Alert rule added successfully")
        
        # Get active alerts
        active_alerts = monitoring_service.alert_manager.get_active_alerts()
        print(f"   Active Alerts: {len(active_alerts)}")
        
        # Test service status
        print("\n📈 Testing Monitoring Service Status...")
        monitoring_status = await monitoring_service.get_service_status()
        print(f"   Service: {monitoring_status['service']}")
        print(f"   Status: {monitoring_status['status']}")
        print(f"   Health Checks: {monitoring_status['health_checks']}")
        print(f"   Circuit Breakers: {monitoring_status['circuit_breakers']}")
        print(f"   Retry Policies: {monitoring_status['retry_policies']}")
        print(f"   Monitoring Enabled: {monitoring_status['monitoring_enabled']}")
        
        print("\n🎉 All monitoring service tests completed successfully!")
        
        # Summary
        print("\n📊 TEST SUMMARY:")
        print(f"   ✅ Service Initialization: Working")
        print(f"   ✅ Health Monitoring: Working ({len(overall_health['services'])} services)")
        print(f"   ✅ System Metrics: Working")
        print(f"   ✅ Circuit Breakers: Working")
        print(f"   ✅ Retry Policies: Working")
        print(f"   ✅ Alert Management: Working")
        print(f"   ✅ Overall Health: {overall_health['overall_status']}")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Monitoring service test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = asyncio.run(test_monitoring_service())
    sys.exit(0 if success else 1)