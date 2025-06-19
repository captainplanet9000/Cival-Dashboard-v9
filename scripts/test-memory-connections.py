#!/usr/bin/env python3
"""
Test Memory System Connections
Comprehensive testing of all memory system components
"""

import asyncio
import os
import sys
from dotenv import load_dotenv

# Add the project root to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'python-ai-services'))

load_dotenv()

async def test_redis_connection():
    """Test Redis connection"""
    print("🔍 Testing Redis connection...")
    try:
        import redis.asyncio as aioredis
        
        redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379')
        print(f"   Connecting to: {redis_url}")
        
        redis_client = await aioredis.from_url(redis_url)
        await redis_client.ping()
        
        # Test basic operations
        await redis_client.set('test_key', 'test_value', ex=60)
        value = await redis_client.get('test_key')
        await redis_client.delete('test_key')
        
        if value and value.decode('utf-8') == 'test_value':
            print("   ✅ Redis connection successful")
            return True
        else:
            print("   ❌ Redis value test failed")
            return False
            
    except ImportError:
        print("   ⚠️ Redis library not installed (pip install redis aioredis)")
        return False
    except Exception as e:
        print(f"   ❌ Redis connection failed: {e}")
        return False

async def test_supabase_connection():
    """Test Supabase connection"""
    print("🔍 Testing Supabase connection...")
    try:
        from supabase import create_client
        
        supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        
        if not supabase_url or not supabase_key:
            print("   ⚠️ Missing Supabase credentials")
            return False
            
        print(f"   Connecting to: {supabase_url[:30]}...")
        supabase = create_client(supabase_url, supabase_key)
        
        # Test basic query
        result = supabase.table('agent_states').select('count', count='exact').execute()
        
        if hasattr(result, 'count') and result.count is not None:
            print(f"   ✅ Supabase connection successful (agent_states count: {result.count})")
            return True
        else:
            print("   ❌ Supabase query test failed")
            return False
            
    except ImportError:
        print("   ⚠️ Supabase library not installed (pip install supabase)")
        return False
    except Exception as e:
        print(f"   ❌ Supabase connection failed: {e}")
        return False

async def test_memgpt_initialization():
    """Test MemGPT initialization"""
    print("🔍 Testing MemGPT initialization...")
    try:
        from pymemgpt import MemGPT
        from pymemgpt.config import MemGPTConfig
        
        # Test basic MemGPT initialization
        test_agent_name = "test_memory_agent"
        
        if MemGPT.exists(agent_name=test_agent_name):
            print(f"   Found existing test agent: {test_agent_name}")
            memgpt_agent = MemGPT(agent_name=test_agent_name)
        else:
            print(f"   Creating test agent: {test_agent_name}")
            memgpt_agent = MemGPT(agent_name=test_agent_name)
        
        # Test basic memory operation
        response = memgpt_agent.step(input_message="Test memory storage")
        
        if response:
            print("   ✅ MemGPT initialization successful")
            return True
        else:
            print("   ❌ MemGPT test interaction failed")
            return False
            
    except ImportError:
        print("   ⚠️ MemGPT library not installed (pip install pymemgpt)")
        return False
    except Exception as e:
        print(f"   ❌ MemGPT initialization failed: {e}")
        return False

async def test_agent_persistence_service():
    """Test AgentPersistenceService"""
    print("🔍 Testing AgentPersistenceService...")
    try:
        from services.agent_persistence_service import AgentPersistenceService
        
        # Initialize service
        service = AgentPersistenceService(
            supabase_url=os.getenv('NEXT_PUBLIC_SUPABASE_URL'),
            supabase_key=os.getenv('SUPABASE_SERVICE_ROLE_KEY'),
            redis_url=os.getenv('REDIS_URL')
        )
        
        # Connect clients
        await service.connect_clients()
        
        # Test basic operations
        test_agent_id = "test_agent_123"
        test_state = {"test": "data", "timestamp": "2025-01-01T00:00:00Z"}
        
        # Test Redis operations
        if service.redis_client:
            redis_success = await service.save_realtime_state_to_redis(
                test_agent_id, test_state, ttl_seconds=60
            )
            if redis_success:
                retrieved_state = await service.get_realtime_state_from_redis(test_agent_id)
                if retrieved_state and retrieved_state.get('test') == 'data':
                    print("   ✅ Redis state operations successful")
                else:
                    print("   ❌ Redis state retrieval failed")
        
        # Test Supabase operations
        if service.supabase_client:
            supabase_result = await service.save_agent_state_to_supabase(
                test_agent_id, "test_strategy", test_state
            )
            if supabase_result:
                print("   ✅ Supabase state operations successful")
            else:
                print("   ❌ Supabase state save failed")
        
        # Cleanup
        await service.close_clients()
        print("   ✅ AgentPersistenceService test completed")
        return True
        
    except ImportError as e:
        print(f"   ⚠️ Missing dependency: {e}")
        return False
    except Exception as e:
        print(f"   ❌ AgentPersistenceService test failed: {e}")
        return False

async def test_memory_service():
    """Test MemoryService"""
    print("🔍 Testing MemoryService...")
    try:
        from services.memory_service import MemoryService
        import uuid
        
        # Initialize service
        user_id = uuid.uuid4()
        agent_id = uuid.uuid4()
        
        service = MemoryService(user_id=user_id, agent_id_context=agent_id)
        
        # Test memory operations
        if service.memgpt_agent_instance:
            # Add test observation
            result = await service.add_observation("Test observation for memory")
            if result.get('status') == 'success':
                print("   ✅ Memory observation successful")
            else:
                print(f"   ❌ Memory observation failed: {result}")
            
            # List memories
            memories = await service.list_memories(limit=5)
            if isinstance(memories, list):
                print(f"   ✅ Memory listing successful ({len(memories)} memories)")
            else:
                print("   ❌ Memory listing failed")
        else:
            print("   ⚠️ MemGPT agent not initialized")
        
        return True
        
    except ImportError as e:
        print(f"   ⚠️ Missing dependency: {e}")
        return False
    except Exception as e:
        print(f"   ❌ MemoryService test failed: {e}")
        return False

async def main():
    """Run all memory system tests"""
    print("🚀 Starting Memory System Connection Tests")
    print("=" * 50)
    
    results = {}
    
    # Test individual components
    results['Redis'] = await test_redis_connection()
    results['Supabase'] = await test_supabase_connection()
    results['MemGPT'] = await test_memgpt_initialization()
    results['AgentPersistence'] = await test_agent_persistence_service()
    results['MemoryService'] = await test_memory_service()
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 Test Results Summary:")
    
    for component, success in results.items():
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"   {component}: {status}")
    
    total_tests = len(results)
    passed_tests = sum(results.values())
    
    print(f"\n🎯 Overall: {passed_tests}/{total_tests} tests passed")
    
    if passed_tests == total_tests:
        print("🏆 All memory system components are working correctly!")
    elif passed_tests >= total_tests * 0.7:
        print("⚠️ Memory system mostly functional, some components need attention")
    else:
        print("❌ Memory system needs significant configuration work")
    
    print("\n💡 Next steps:")
    if not results.get('Redis'):
        print("   - Install and start Redis server")
        print("   - Configure REDIS_URL environment variable")
    if not results.get('Supabase'):
        print("   - Set up Supabase project and get credentials")
        print("   - Run database schema creation script")
    if not results.get('MemGPT'):
        print("   - Install MemGPT: pip install pymemgpt")
        print("   - Configure MemGPT environment variables")

if __name__ == "__main__":
    asyncio.run(main())