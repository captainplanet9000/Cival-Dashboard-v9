# Backend Setup Guide

## Overview
The AI Trading Dashboard uses a Python FastAPI backend that provides:
- Real-time trading data and execution
- AI agent coordination and decision-making
- Portfolio management and risk analytics
- WebSocket connections for live updates

## Quick Start

### Option 1: Using npm scripts (Recommended)
```bash
# Start both frontend and backend together
npm run dev:full

# Or start them separately:
# Terminal 1: Start backend
npm run backend:start

# Terminal 2: Start frontend
npm run dev

# Check if backend is healthy
npm run backend:check
```

### Option 2: Using Docker Compose
```bash
# Start all services (frontend, backend, redis, postgres)
npm run docker:dev

# Stop all services
npm run docker:down
```

### Option 3: Manual setup
```bash
# Navigate to backend directory
cd python-ai-services

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the backend
python main_consolidated.py
```

## Environment Variables

The backend requires these environment variables (already configured in .env.local):

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=your-api-key
```

## API Endpoints

Once running, the backend provides these key endpoints:

- `GET /health` - System health check
- `GET /api/v1/portfolio/summary` - Portfolio overview
- `GET /api/v1/agents/status` - Agent status
- `GET /api/v1/strategies` - Trading strategies
- `WS /ws` - WebSocket for real-time updates

## Troubleshooting

### Backend won't start
1. Check Python version: `python3 --version` (needs 3.11+)
2. Check if port 8000 is available: `lsof -i :8000`
3. Check logs: `tail -f python-ai-services/logs/app.log`

### Connection refused errors
1. Verify backend is running: `npm run backend:check`
2. Check NEXT_PUBLIC_API_URL in .env.local
3. Ensure no firewall blocking port 8000

### Database connection issues
1. For development, the backend uses mock data by default
2. To use real database, update DATABASE_URL in .env
3. Run migrations: `cd python-ai-services && python database/run_migration.py`

## Development Tips

1. **Hot Reload**: The backend automatically reloads on code changes
2. **API Docs**: Visit http://localhost:8000/docs for interactive API documentation
3. **Logs**: Check `python-ai-services/logs/` for detailed logs
4. **Mock Mode**: Backend runs in mock mode without external dependencies

## Architecture

```
Frontend (Next.js:3000) <---> Backend (FastAPI:8000)
                               |
                               ├── Redis (Cache:6379)
                               ├── PostgreSQL (DB:5432)
                               └── AI Services (OpenAI/Claude)
```

## Next Steps

1. Set up real database credentials in .env
2. Configure AI API keys for trading intelligence
3. Enable WebSocket connections for real-time updates
4. Deploy to production using Railway or Docker