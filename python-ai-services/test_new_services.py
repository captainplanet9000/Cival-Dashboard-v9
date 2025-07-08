#!/usr/bin/env python3
"""
Test script for new services: APScheduler, Universal Trading Mode, and Blockchain
"""

import asyncio
import sys
import os
sys.path.append(os.path.dirname(__file__))

async def test_apscheduler_service():
    """Test APScheduler agent service"""
    try:
        from services.apscheduler_agent_service import APSchedulerAgentService, TaskPriority
        
        print("🧪 Testing APScheduler Agent Service...")
        
        service = APSchedulerAgentService()
        
        # Test service initialization (without full dependencies)
        print("✅ APScheduler service created successfully")
        
        # Test schedule configuration creation
        schedule_config = {
            'type': 'interval',
            'minutes': 5
        }
        
        task_config = {
            'strategy_type': 'momentum',
            'symbol': 'BTC/USD',
            'allocation': 0.1
        }
        
        print("✅ Schedule configurations created")
        
        # Test service status
        status = await service.get_service_status()
        print(f"✅ Service status: {status}")
        
        return True
        
    except Exception as e:
        print(f"❌ APScheduler test failed: {e}")
        return False

async def test_universal_trading_mode():
    """Test Universal Trading Mode service"""
    try:
        from services.universal_trading_mode_service import UniversalTradingModeService, TradingMode, ComponentType
        
        print("🧪 Testing Universal Trading Mode Service...")
        
        service = UniversalTradingModeService()
        
        # Test initial mode
        current_mode = await service.get_trading_mode()
        print(f"✅ Current mode: {current_mode.value}")
        
        # Test mode configuration
        config = await service.get_mode_config()
        print(f"✅ Mode config: {config.mode.value}")
        
        # Test component registration
        success = await service.register_component("test_component", ComponentType.DASHBOARD)
        print(f"✅ Component registration: {success}")
        
        # Test service status
        status = await service.get_service_status()
        print(f"✅ Service status: {status}")
        
        return True
        
    except Exception as e:
        print(f"❌ Universal Trading Mode test failed: {e}")
        return False

async def test_blockchain_provider():
    """Test Blockchain Provider service"""
    try:
        from services.blockchain_provider_service import BlockchainProviderService, NetworkType
        
        print("🧪 Testing Blockchain Provider Service...")
        
        service = BlockchainProviderService()
        
        # Test service creation
        print("✅ Blockchain provider service created")
        
        # Test service status
        status = await service.get_service_status()
        print(f"✅ Service status: {status}")
        
        return True
        
    except Exception as e:
        print(f"❌ Blockchain Provider test failed: {e}")
        return False

async def test_enhanced_wallet_service():
    """Test Enhanced Agent Wallet service"""
    try:
        from services.enhanced_agent_wallet_service import EnhancedAgentWalletService, WalletType
        
        print("🧪 Testing Enhanced Agent Wallet Service...")
        
        service = EnhancedAgentWalletService()
        
        # Test service creation
        print("✅ Enhanced wallet service created")
        
        # Test service status
        status = await service.get_service_status()
        print(f"✅ Service status: {status}")
        
        return True
        
    except Exception as e:
        print(f"❌ Enhanced Wallet test failed: {e}")
        return False

async def test_autonomous_persistence():
    """Test Autonomous State Persistence service"""
    try:
        from services.autonomous_state_persistence import AutonomousStatePersistence, StateType
        
        print("🧪 Testing Autonomous State Persistence Service...")
        
        service = AutonomousStatePersistence()
        
        # Test service creation
        print("✅ Autonomous persistence service created")
        
        # Test service status
        status = await service.get_service_status()
        print(f"✅ Service status: {status}")
        
        return True
        
    except Exception as e:
        print(f"❌ Autonomous Persistence test failed: {e}")
        return False

async def main():
    """Run all tests"""
    print("🚀 Starting New Services Test Suite\n")
    
    tests = [
        ("APScheduler Agent Service", test_apscheduler_service),
        ("Universal Trading Mode", test_universal_trading_mode),
        ("Blockchain Provider", test_blockchain_provider),
        ("Enhanced Wallet Service", test_enhanced_wallet_service),
        ("Autonomous Persistence", test_autonomous_persistence),
    ]
    
    results = []
    
    for test_name, test_func in tests:
        print(f"\n{'='*50}")
        print(f"🧪 {test_name}")
        print('='*50)
        
        try:
            result = await test_func()
            results.append((test_name, result))
            
            if result:
                print(f"✅ {test_name} PASSED")
            else:
                print(f"❌ {test_name} FAILED")
                
        except Exception as e:
            print(f"💥 {test_name} CRASHED: {e}")
            results.append((test_name, False))
    
    print(f"\n{'='*50}")
    print("📊 TEST SUMMARY")
    print('='*50)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} {test_name}")
    
    print(f"\n🎯 Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 ALL TESTS PASSED!")
        return 0
    else:
        print("⚠️  Some tests failed")
        return 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)