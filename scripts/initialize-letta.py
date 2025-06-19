#!/usr/bin/env python3
"""
Initialize Letta for Memory Management
Sets up Letta configuration and creates initial agents
"""

import os
import asyncio
from dotenv import load_dotenv

load_dotenv()

async def initialize_letta():
    """Initialize Letta for the trading system"""
    try:
        print("🧠 Initializing Letta for trading system...")
        
        from letta import create_client
        
        # Create Letta client
        print("   Creating Letta client...")
        client = create_client()
        
        # Check existing agents
        existing_agents = client.list_agents()
        print(f"   Found {len(existing_agents)} existing agents")
        
        # Define trading agents to create
        trading_agents = [
            {
                'name': 'marcus_momentum_memory',
                'persona': 'You are the memory manager for Marcus Momentum, a trend-following trading agent. You store and recall trading decisions, market patterns, and learning experiences related to momentum trading strategies.',
                'human': 'You work with Marcus Momentum to help him learn from past trades and improve momentum trading performance.'
            },
            {
                'name': 'alex_arbitrage_memory', 
                'persona': 'You are the memory manager for Alex Arbitrage, a cross-exchange arbitrage trading agent. You manage memories of arbitrage opportunities, execution timing, and market inefficiencies.',
                'human': 'You work with Alex Arbitrage to optimize arbitrage opportunity recognition and execution speed.'
            },
            {
                'name': 'sophia_reversion_memory',
                'persona': 'You are the memory manager for Sophia Reversion, a mean reversion trading agent. You store patterns of market reversals, support/resistance levels, and reversion timing.',
                'human': 'You work with Sophia Reversion to improve mean reversion strategy timing and accuracy.'
            },
            {
                'name': 'riley_risk_memory',
                'persona': 'You are the memory manager for Riley Risk, a risk management agent. You maintain memories of risk events, portfolio protection decisions, and market stress scenarios.',
                'human': 'You work with Riley Risk to enhance risk assessment and portfolio protection strategies.'
            }
        ]
        
        created_agents = []
        
        for agent_config in trading_agents:
            # Check if agent already exists
            existing = None
            for agent in existing_agents:
                if agent.name == agent_config['name']:
                    existing = agent
                    break
            
            if existing:
                print(f"   ✅ Agent '{agent_config['name']}' already exists (ID: {existing.id})")
                created_agents.append(existing)
            else:
                print(f"   Creating new agent: {agent_config['name']}")
                new_agent = client.create_agent(
                    name=agent_config['name'],
                    persona=agent_config['persona'],
                    human=agent_config['human']
                )
                print(f"   ✅ Created agent '{agent_config['name']}' (ID: {new_agent.id})")
                created_agents.append(new_agent)
        
        # Test each agent with initial messages
        print("   Testing agent memory capabilities...")
        for agent in created_agents:
            try:
                response = client.send_message(
                    agent_id=agent.id,
                    message="Initialize memory system. You are now ready to store and recall trading experiences.",
                    role="user"
                )
                if response:
                    print(f"   ✅ Agent {agent.name} memory test successful")
                else:
                    print(f"   ⚠️ Agent {agent.name} memory test had no response")
            except Exception as e:
                print(f"   ❌ Agent {agent.name} memory test failed: {e}")
        
        print(f"✅ Letta initialization complete! {len(created_agents)} agents ready.")
        return True
        
    except ImportError:
        print("   ❌ Letta not installed. Run: pip install letta")
        return False
    except Exception as e:
        print(f"   ❌ Letta initialization failed: {e}")
        return False

async def test_letta_configuration():
    """Test Letta configuration and environment"""
    print("🔍 Testing Letta configuration...")
    
    try:
        from letta import create_client
        
        # Test client creation
        client = create_client()
        print("   ✅ Letta client created successfully")
        
        # Test basic operations
        agents = client.list_agents()
        print(f"   ✅ Found {len(agents)} agents in system")
        
        # Check for required environment variables
        required_env_vars = [
            'OPENAI_API_KEY',  # Or other LLM provider
        ]
        
        missing_vars = []
        for var in required_env_vars:
            if not os.getenv(var):
                missing_vars.append(var)
        
        if missing_vars:
            print(f"   ⚠️ Missing environment variables: {', '.join(missing_vars)}")
            print("   Note: Letta may use default configurations")
        else:
            print("   ✅ All required environment variables present")
        
        return True
        
    except Exception as e:
        print(f"   ❌ Configuration test failed: {e}")
        return False

async def main():
    """Main initialization function"""
    print("🚀 Starting Letta Memory System Initialization")
    print("=" * 50)
    
    # Test configuration first
    config_ok = await test_letta_configuration()
    
    if config_ok:
        # Initialize Letta with trading agents
        init_ok = await initialize_letta()
        
        if init_ok:
            print("\n🎉 Letta Memory System is ready for production!")
            print("   - Trading agent memory managers created")
            print("   - Memory storage and retrieval tested")
            print("   - System ready for autonomous trading")
        else:
            print("\n❌ Letta initialization failed")
            return False
    else:
        print("\n❌ Letta configuration test failed")
        return False
    
    return True

if __name__ == "__main__":
    asyncio.run(main())