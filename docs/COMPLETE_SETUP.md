# Complete Setup Guide - AI Trading Dashboard

## 🚀 Quick Start (5 minutes)

```bash
# 1. Clone and install
git clone <your-repo>
cd cival-dashboard
npm install

# 2. Setup environment
cp env.template .env.local

# 3. Start everything
npm run dev:full

# Visit http://localhost:3000
```

## 📋 Full Setup Guide

### Prerequisites
- Node.js 18+ 
- Python 3.11+
- Docker (optional but recommended)
- Git

### Step 1: Environment Setup

```bash
# Copy template
cp env.template .env.local

# Edit .env.local and add your keys (optional):
# - NEXT_PUBLIC_SUPABASE_URL=your-url
# - NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
# - OPENAI_API_KEY=your-key
# - DATABASE_URL=your-database-url
```

### Step 2: Database Setup (Optional)

The app works with mock data by default. To use a real database:

```bash
# Check database options
npm run db:setup

# If using Supabase:
# 1. Create account at https://supabase.com
# 2. Add credentials to .env.local
# 3. Run migrations:
npm run db:migrate

# If using local PostgreSQL:
docker run -d --name postgres-trading \
  -p 5432:5432 \
  -e POSTGRES_PASSWORD=password \
  postgres:16
```

### Step 3: Start Services

#### Option A: Full Stack (Recommended)
```bash
# Start frontend + backend together
npm run dev:full
```

#### Option B: Separate Terminals
```bash
# Terminal 1: Backend
npm run backend:start

# Terminal 2: Frontend
npm run dev
```

#### Option C: Docker
```bash
# Start all services
npm run docker:dev
```

### Step 4: Verify Installation

```bash
# Check backend health
npm run backend:check

# Test API connectivity
curl http://localhost:8000/health

# Visit dashboard
open http://localhost:3000
```

## 🏗️ Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Next.js App   │────▶│  FastAPI Backend │────▶│   PostgreSQL    │
│   Port: 3000    │     │   Port: 8000    │     │   Port: 5432    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                       │                         │
         └───────────────────────┴─────────────────────────┘
                             WebSocket
                          (Real-time data)
```

## 🔧 Configuration

### Frontend (.env.local)
```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000

# Database (Optional)
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# AI Services (Optional)
NEXT_PUBLIC_GEMINI_API_KEY=your-key
```

### Backend (python-ai-services/.env)
```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/trading

# Redis
REDIS_URL=redis://localhost:6379

# AI Services
OPENAI_API_KEY=your-key
ANTHROPIC_API_KEY=your-key
```

## 📱 Features Available

### With Mock Data (Default)
- ✅ Full dashboard UI
- ✅ Paper trading simulation
- ✅ Agent management
- ✅ Portfolio tracking
- ✅ Strategy creation
- ✅ Risk analytics

### With Database Connected
- ✅ Data persistence
- ✅ Real-time sync
- ✅ Multi-user support
- ✅ Historical data
- ✅ Advanced analytics

### With AI Services
- ✅ Intelligent agents
- ✅ Market predictions
- ✅ Strategy optimization
- ✅ Natural language queries

## 🐛 Troubleshooting

### Common Issues

**Backend won't start**
```bash
# Check Python version
python3 --version  # Should be 3.11+

# Install dependencies manually
cd python-ai-services
pip install -r requirements.txt
```

**Database connection failed**
```bash
# The app works without a database!
# It will use mock data automatically

# To setup database:
npm run db:setup
```

**Port already in use**
```bash
# Kill processes on ports
lsof -ti:3000 | xargs kill -9  # Frontend
lsof -ti:8000 | xargs kill -9  # Backend
```

**TypeScript errors**
```bash
# These are non-blocking
# Run type check:
npm run type-check

# Fix errors:
npm run lint:fix
```

## 📚 Next Steps

1. **Explore the Dashboard**
   - Visit http://localhost:3000
   - Try paper trading features
   - Create AI agents
   - Test strategies

2. **Connect Real Services**
   - Add Supabase for persistence
   - Add OpenAI for intelligent agents
   - Connect trading exchanges

3. **Deploy to Production**
   - Use Railway: `railway up`
   - Or Vercel: `vercel deploy`
   - Or Docker: `docker-compose up`

## 🆘 Getting Help

- Check logs: `tail -f logs/*.log`
- API docs: http://localhost:8000/docs
- GitHub Issues: Report bugs
- Documentation: `/docs` folder

## 🎉 Success Checklist

- [ ] Frontend running on port 3000
- [ ] Backend running on port 8000
- [ ] Can access dashboard
- [ ] Can create paper trades
- [ ] Can manage agents
- [ ] WebSocket connected

Congratulations! Your AI Trading Dashboard is ready! 🚀