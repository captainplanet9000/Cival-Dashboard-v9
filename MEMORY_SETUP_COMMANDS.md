# 🧠 Memory System Setup Commands

Run these commands in your local environment to complete the memory system setup:

## 1. Install Python Dependencies

```bash
# Install Letta (formerly MemGPT), Redis, and aioredis
pip install letta redis aioredis

# Or if using pip3
pip3 install letta redis aioredis

# Or using Python module
python3 -m pip install letta redis aioredis
```

## 2. Test Redis Cloud Connection

```bash
# Test the Redis Cloud connection with your credentials
python3 test-redis-simple.py
```

Expected output:
```
✅ Redis Cloud connection successful!
✅ Set operation successful
✅ Get operation successful: Hello from Redis Cloud!
✅ Cleanup successful
```

## 3. Initialize Letta for Trading Agents

```bash
# Create Letta agents for each trading strategy
python3 scripts/initialize-letta.py
```

This will create memory managers for:
- Marcus Momentum Memory
- Alex Arbitrage Memory
- Sophia Reversion Memory
- Riley Risk Memory

## 4. Create Supabase Memory Schema

```bash
# Set up the memory-specific database tables
python3 scripts/create-memory-schema.py
```

This creates:
- Memory embeddings table with vector search
- Memory analytics table
- Memory optimization logs

## 5. Test All Memory Connections

```bash
# Comprehensive test of all memory systems
python3 scripts/test-memory-connections.py
```

This tests:
- ✅ Redis Cloud connection
- ✅ Supabase connection
- ✅ Letta initialization
- ✅ Memory operations
- ✅ Multi-tier caching

## 6. Verify Dashboard

```bash
# Start the development server
npm run dev
```

Then navigate to:
- http://localhost:3000/dashboard
- Click on "Memory Analytics" tab
- Verify the memory dashboard loads with analytics

## 🚀 Quick One-Liner Setup

For quick setup, run all commands in sequence:

```bash
pip3 install letta redis aioredis && \
python3 test-redis-simple.py && \
python3 scripts/initialize-letta.py && \
python3 scripts/create-memory-schema.py && \
python3 scripts/test-memory-connections.py && \
echo "✅ Memory system ready for production!"
```

## 📋 Troubleshooting

### If pip is not found:
```bash
# Install pip first
python3 -m ensurepip --upgrade
# Or
curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py
python3 get-pip.py
```

### If Redis connection fails:
- Check the Redis Cloud credentials in `.env.local`
- Ensure no firewall is blocking port 13924
- Try the connection string directly:
  ```bash
  redis-cli -u redis://default:6kGX8jsHE6gsDrW2XYh3p2wU0iLEQWga@redis-13924.c256.us-east-1-2.ec2.redns.redis-cloud.com:13924
  ```

### If Letta initialization fails:
- Ensure OPENAI_API_KEY is set in environment
- Check Python version is 3.8 or higher
- Try installing with specific version: `pip install letta==0.2.12`

## ✅ Success Indicators

You'll know the setup is successful when:
1. Redis test shows "✅ Redis Cloud connection successful!"
2. Letta initialization creates 4 agent memory managers
3. Memory dashboard shows real-time analytics
4. No errors in the console logs

## 🎯 Next Steps

After successful setup:
1. Navigate to Memory Analytics dashboard
2. Monitor agent memory usage
3. Run optimization when needed
4. Check memory efficiency metrics