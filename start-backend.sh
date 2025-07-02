#!/bin/bash

# Start Backend Services for AI Trading Dashboard

echo "🚀 Starting Python Backend Services..."

cd python-ai-services

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies if needed
if [ ! -f ".deps_installed" ]; then
    echo "📦 Installing Python dependencies..."
    pip install --upgrade pip
    pip install -r requirements.txt
    touch .deps_installed
fi

# Set environment variables
export DATABASE_URL=${DATABASE_URL:-"postgresql://mock:mock@localhost:5432/mock"}
export REDIS_URL=${REDIS_URL:-"redis://localhost:6379"}
export OPENAI_API_KEY=${OPENAI_API_KEY:-"sk-mock-key"}
export NODE_ENV=${NODE_ENV:-"development"}

# Start the FastAPI server
echo "🎯 Starting FastAPI server on http://localhost:8000"
python main_consolidated.py

# Note: Use Ctrl+C to stop the server