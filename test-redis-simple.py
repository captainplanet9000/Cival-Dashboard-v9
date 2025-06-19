#!/usr/bin/env python3
"""
Simple Redis Cloud Connection Test
Tests the Redis Cloud connection without external dependencies
"""

try:
    import redis
    print("✅ Redis library is available")
except ImportError:
    print("❌ Redis library not installed. Run: python3 -m pip install redis")
    exit(1)

# Redis Cloud connection details
redis_config = {
    'host': 'redis-13924.c256.us-east-1-2.ec2.redns.redis-cloud.com',
    'port': 13924,
    'decode_responses': True,
    'username': 'default',
    'password': '6kGX8jsHE6gsDrW2XYh3p2wU0iLEQWga',
}

def test_redis_connection():
    """Test Redis Cloud connection"""
    print("🔍 Testing Redis Cloud connection...")
    print(f"   Host: {redis_config['host']}")
    print(f"   Port: {redis_config['port']}")
    
    try:
        # Create Redis connection
        r = redis.Redis(**redis_config)
        
        # Test ping
        result = r.ping()
        if result:
            print("   ✅ Redis ping successful")
        else:
            print("   ❌ Redis ping failed")
            return False
        
        # Test basic operations
        test_key = 'cival_test_key'
        test_value = 'cival_test_value'
        
        # Set value
        r.set(test_key, test_value, ex=60)  # Expire in 60 seconds
        print(f"   ✅ Set key '{test_key}' = '{test_value}'")
        
        # Get value
        retrieved_value = r.get(test_key)
        if retrieved_value == test_value:
            print(f"   ✅ Retrieved value: '{retrieved_value}'")
        else:
            print(f"   ❌ Value mismatch. Expected: '{test_value}', Got: '{retrieved_value}'")
            return False
        
        # Delete key
        r.delete(test_key)
        print(f"   ✅ Deleted test key")
        
        # Verify deletion
        deleted_value = r.get(test_key)
        if deleted_value is None:
            print("   ✅ Key deletion verified")
        else:
            print(f"   ⚠️ Key still exists after deletion: '{deleted_value}'")
        
        print("🎉 Redis Cloud connection test PASSED!")
        return True
        
    except redis.ConnectionError as e:
        print(f"   ❌ Redis connection error: {e}")
        return False
    except redis.AuthenticationError as e:
        print(f"   ❌ Redis authentication error: {e}")
        return False
    except Exception as e:
        print(f"   ❌ Unexpected error: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Redis Cloud Connection Test")
    print("=" * 40)
    
    success = test_redis_connection()
    
    if success:
        print("\n✅ All tests passed! Redis Cloud is ready for production.")
    else:
        print("\n❌ Tests failed. Please check Redis Cloud configuration.")
        exit(1)