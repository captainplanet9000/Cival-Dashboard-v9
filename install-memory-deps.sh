#!/bin/bash

# Memory System Dependency Installation Script
# This script installs all required Python packages for the memory system

echo "🧠 Installing Memory System Dependencies..."
echo "==========================================="

# Change to project directory
cd /home/anthony/cival-dashboard-clean

# Install Python packages
echo "📦 Installing Letta (formerly MemGPT)..."
pip3 install letta || python3 -m pip install letta || python -m pip install letta

echo "📦 Installing Redis client..."
pip3 install redis aioredis || python3 -m pip install redis aioredis || python -m pip install redis aioredis

echo ""
echo "✅ Installation complete!"
echo ""
echo "🧪 Now testing Redis connection..."
python3 test-redis-simple.py

echo ""
echo "🚀 Next steps:"
echo "1. Initialize Letta agents: python3 scripts/initialize-letta.py"
echo "2. Create memory schema: python3 scripts/create-memory-schema.py"
echo "3. Test all connections: python3 scripts/test-memory-connections.py"