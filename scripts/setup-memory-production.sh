#!/bin/bash
# Production Memory System Setup Script
set -e

echo "🚀 Setting up Production Memory System..."

# 1. Install Python dependencies
echo "📦 Installing Python memory dependencies..."
cd python-ai-services
pip install pymemgpt redis[hiredis] aioredis psycopg2-binary sqlalchemy

# 2. Install Node.js dependencies
echo "📦 Installing Node.js memory dependencies..."
cd ../
npm install @supabase/supabase-js ioredis

# 3. Create memory database tables
echo "🗄️ Setting up Supabase memory schema..."
python scripts/create-memory-schema.py

# 4. Test memory connections
echo "🔍 Testing memory system connections..."
python scripts/test-memory-connections.py

# 5. Initialize MemGPT
echo "🧠 Initializing MemGPT..."
python scripts/initialize-memgpt.py

echo "✅ Production Memory System setup complete!"