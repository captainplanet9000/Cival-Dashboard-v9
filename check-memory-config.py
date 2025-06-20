#!/usr/bin/env python3
"""
Check Memory System Configuration
Shows what's configured and ready for the memory system
"""

import os
from pathlib import Path

def check_config():
    print("🧠 Memory System Configuration Check")
    print("=" * 50)
    
    # Check .env.local file
    env_file = Path(".env.local")
    if env_file.exists():
        print("✅ Environment file found: .env.local")
        
        # Read and check for Redis configuration
        with open(env_file, 'r') as f:
            content = f.read()
            
        if "REDIS_URL=" in content and "redis-13924.c256.us-east-1-2.ec2.redns.redis-cloud.com" in content:
            print("✅ Redis Cloud URL configured correctly")
            print("   Host: redis-13924.c256.us-east-1-2.ec2.redns.redis-cloud.com")
            print("   Port: 13924")
        else:
            print("❌ Redis configuration not found")
            
        if "OPENAI_API_KEY=" in content:
            has_key = "your_openai_api_key_here" not in content
            if has_key:
                print("✅ OpenAI API key configured (required for Letta)")
            else:
                print("⚠️  OpenAI API key placeholder found - needs real key for Letta")
        else:
            print("❌ OpenAI API key not configured")
    else:
        print("❌ Environment file not found")
    
    print("\n📦 Required Python Packages:")
    print("   - letta (formerly MemGPT)")
    print("   - redis")
    print("   - aioredis")
    
    print("\n📁 Memory System Files Ready:")
    
    # Check key files
    files_to_check = [
        ("test-redis-simple.py", "Redis connection test"),
        ("scripts/initialize-letta.py", "Letta agent initialization"),
        ("scripts/create-memory-schema.py", "Database schema creation"),
        ("scripts/test-memory-connections.py", "Full system test"),
        ("python-ai-services/services/memory_service.py", "Memory service implementation"),
        ("src/components/memory/MemoryAnalyticsDashboard.tsx", "Memory analytics UI")
    ]
    
    for file_path, description in files_to_check:
        if Path(file_path).exists():
            print(f"   ✅ {file_path} - {description}")
        else:
            print(f"   ❌ {file_path} - {description}")
    
    print("\n🚀 Next Steps:")
    print("1. Install Python packages: pip install letta redis aioredis")
    print("2. Test Redis: python3 test-redis-simple.py")
    print("3. Initialize Letta: python3 scripts/initialize-letta.py")
    print("4. Start dashboard: npm run dev")
    print("5. Navigate to Memory Analytics tab")
    
    print("\n💡 Alternative: Install all dependencies at once:")
    print("   pip install -r python-ai-services/requirements_consolidated.txt")

if __name__ == "__main__":
    check_config()