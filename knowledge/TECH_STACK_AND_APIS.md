# Cival Dashboard - Tech Stack & APIs Documentation

## 🛠️ Technology Stack Overview

### Frontend Technologies
```
Next.js 15          - React framework with App Router
React 18           - UI library with hooks and Suspense  
TypeScript 5       - Type safety and developer experience
Tailwind CSS 3.4   - Utility-first CSS framework
Shadcn/UI          - Premium component library
Framer Motion      - Animation and transition library
Socket.IO Client   - Real-time communication
Recharts          - Data visualization and charting
React Hook Form    - Form management with validation
Zustand           - State management
```

### Backend Technologies
```
FastAPI           - High-performance Python API framework
Pydantic v2       - Data validation and serialization
SQLAlchemy        - Database ORM with async support
AsyncIO           - Asynchronous programming
WebSocket         - Real-time bidirectional communication
Redis             - Caching and session management
Celery            - Task queue for background jobs
```

### Database & Storage
```
PostgreSQL        - Primary relational database
Supabase          - Database hosting with real-time features
Redis Cloud       - Distributed caching layer
Supabase Storage  - File storage for agent data
```

### Infrastructure & Deployment
```
Railway           - Cloud deployment platform
Docker            - Containerization and orchestration
GitHub Actions    - CI/CD pipeline automation
Vercel            - Alternative frontend deployment
```

## 🔌 API Integrations

### Trading & Market Data APIs

#### **Alpha Vantage** (Stock Market Data)
```typescript
// Configuration
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key

// Usage
GET https://www.alphavantage.co/query
Parameters:
- function: TIME_SERIES_DAILY
- symbol: AAPL
- apikey: ${ALPHA_VANTAGE_API_KEY}
```

#### **Marketstack** (Real-time Market Data)
```typescript
// Configuration  
MARKETSTACK_API_KEY=your_marketstack_key

// Usage
GET http://api.marketstack.com/v1/eod
Parameters:
- access_key: ${MARKETSTACK_API_KEY}
- symbols: AAPL,GOOGL,MSFT
```

#### **CoinMarketCap** (Cryptocurrency Data)
```typescript
// Configuration
COINMARKETCAP_API_KEY=your_coinmarketcap_key

// Usage
GET https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest
Headers:
- X-CMC_PRO_API_KEY: ${COINMARKETCAP_API_KEY}
Parameters:
- symbol: BTC,ETH,BNB
```

#### **Polygon.io** (Financial Market Data)
```typescript
// Configuration
POLYGON_API_KEY=your_polygon_key

// Usage
GET https://api.polygon.io/v2/aggs/ticker/AAPL/range/1/day/2023-01-01/2023-12-31
Parameters:
- apikey: ${POLYGON_API_KEY}
```

#### **Finnhub** (Stock Market Data)
```typescript
// Configuration
FINNHUB_API_KEY=your_finnhub_key

// Usage
GET https://finnhub.io/api/v1/quote
Parameters:
- symbol: AAPL
- token: ${FINNHUB_API_KEY}
```

#### **Twelve Data** (Market Data)
```typescript
// Configuration
TWELVE_DATA_API_KEY=your_twelve_data_key

// Usage
GET https://api.twelvedata.com/time_series
Parameters:
- symbol: AAPL
- interval: 1min
- apikey: ${TWELVE_DATA_API_KEY}
```

### Blockchain & DeFi APIs

#### **Etherscan** (Ethereum Blockchain Data)
```typescript
// Configuration
ETHERSCAN_API_KEY=your_etherscan_key

// Usage
GET https://api.etherscan.io/api
Parameters:
- module: account
- action: balance
- address: 0x...
- tag: latest
- apikey: ${ETHERSCAN_API_KEY}
```

#### **Hyperliquid** (DEX Trading)
```typescript
// Configuration
HYPERLIQUID_WALLET_ADDRESS=your_wallet_address
HYPERLIQUID_PRIVATE_KEY=your_private_key
HYPERLIQUID_TESTNET=true

// Usage (Paper Trading)
POST https://api.hyperliquid-testnet.xyz/exchange
Body: {
  "action": "order",
  "nonce": timestamp,
  "signature": signed_message
}
```

### AI & LLM APIs

#### **OpenAI** (GPT-4, GPT-3.5)
```typescript
// Configuration
OPENAI_API_KEY=sk-your_openai_key
OPENAI_MAX_TOKENS=4000
OPENAI_TEMPERATURE=0.7

// Usage
POST https://api.openai.com/v1/chat/completions
Headers:
- Authorization: Bearer ${OPENAI_API_KEY}
Body: {
  "model": "gpt-4",
  "messages": [...],
  "temperature": 0.7
}
```

#### **Anthropic Claude** (Claude-3.5)
```typescript
// Configuration
ANTHROPIC_API_KEY=sk-ant-your_anthropic_key
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022

// Usage
POST https://api.anthropic.com/v1/messages
Headers:
- x-api-key: ${ANTHROPIC_API_KEY}
- anthropic-version: 2023-06-01
Body: {
  "model": "claude-3-5-sonnet-20241022",
  "messages": [...],
  "max_tokens": 4000
}
```

#### **OpenRouter** (Multi-LLM Gateway)
```typescript
// Configuration
OPENROUTER_API_KEY=sk-or-your_openrouter_key
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

// Usage
POST https://openrouter.ai/api/v1/chat/completions
Headers:
- Authorization: Bearer ${OPENROUTER_API_KEY}
Body: {
  "model": "anthropic/claude-3.5-sonnet",
  "messages": [...]
}
```

## 🗄️ Database Schema

### Core Tables Structure

#### **Agents Table**
```sql
CREATE TABLE agents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT CHECK (status IN ('active', 'inactive', 'paused', 'error')),
    personality JSONB DEFAULT '{}',
    strategies TEXT[] DEFAULT ARRAY[]::TEXT[],
    paper_balance DECIMAL(15,2) DEFAULT 100.00,
    total_pnl DECIMAL(15,2) DEFAULT 0.00,
    win_rate DECIMAL(5,2) DEFAULT 0.00,
    trades_count INTEGER DEFAULT 0,
    risk_tolerance DECIMAL(3,2) DEFAULT 0.50,
    max_position_size DECIMAL(5,2) DEFAULT 10.00,
    llm_provider TEXT DEFAULT 'openai',
    llm_model TEXT DEFAULT 'gpt-4',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **Agent Decisions Table**
```sql
CREATE TABLE agent_decisions (
    id TEXT PRIMARY KEY,
    agent_id TEXT REFERENCES agents(id),
    decision_type TEXT CHECK (decision_type IN ('trade', 'hold', 'rebalance', 'analysis', 'risk_check')),
    symbol TEXT,
    reasoning TEXT NOT NULL,
    confidence_score DECIMAL(3,2),
    market_data JSONB DEFAULT '{}',
    action_taken BOOLEAN DEFAULT false,
    result JSONB DEFAULT '{}',
    execution_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **Paper Trading Tables**
```sql
CREATE TABLE agent_paper_accounts (
    id TEXT PRIMARY KEY,
    agent_id TEXT REFERENCES agents(id),
    account_name TEXT NOT NULL,
    initial_balance DECIMAL(15,2) DEFAULT 100.00,
    current_balance DECIMAL(15,2) DEFAULT 100.00,
    total_pnl DECIMAL(15,2) DEFAULT 0.00,
    realized_pnl DECIMAL(15,2) DEFAULT 0.00,
    unrealized_pnl DECIMAL(15,2) DEFAULT 0.00,
    total_trades INTEGER DEFAULT 0,
    winning_trades INTEGER DEFAULT 0,
    losing_trades INTEGER DEFAULT 0,
    max_drawdown DECIMAL(15,2) DEFAULT 0.00,
    sharpe_ratio DECIMAL(8,4) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE agent_paper_trades (
    id TEXT PRIMARY KEY,
    agent_id TEXT REFERENCES agents(id),
    account_id TEXT REFERENCES agent_paper_accounts(id),
    symbol TEXT NOT NULL,
    side TEXT CHECK (side IN ('buy', 'sell')),
    order_type TEXT CHECK (order_type IN ('market', 'limit', 'stop', 'stop_limit')),
    quantity DECIMAL(15,8) NOT NULL,
    price DECIMAL(15,8) NOT NULL,
    executed_price DECIMAL(15,8),
    executed_quantity DECIMAL(15,8),
    executed_at TIMESTAMP WITH TIME ZONE,
    status TEXT CHECK (status IN ('pending', 'partial', 'filled', 'cancelled', 'rejected')),
    strategy TEXT,
    reasoning TEXT,
    pnl DECIMAL(15,2) DEFAULT 0.00,
    commission DECIMAL(15,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔄 Real-Time Communication

### WebSocket Implementation
```typescript
// Client-side connection
const socket = io(process.env.NEXT_PUBLIC_WS_URL, {
  transports: ['websocket'],
  upgrade: true
});

// Event subscriptions
socket.on('agent_decision', (data) => {
  // Handle new agent decision
});

socket.on('portfolio_update', (data) => {
  // Handle portfolio changes
});

socket.on('market_data', (data) => {
  // Handle real-time price updates
});
```

### AG-UI Protocol v2
```typescript
// Agent Communication Protocol
interface AGUIMessage {
  type: 'agent_status' | 'trade_signal' | 'portfolio_update' | 'risk_alert';
  agentId: string;
  timestamp: string;
  data: Record<string, any>;
}

// Usage
const agui = new AGUIClient({
  wsUrl: 'wss://your-backend.railway.app/ws',
  channels: ['agents', 'trading', 'portfolio']
});
```

## 📁 File Management System

### Supabase Storage Configuration
```typescript
// Storage bucket setup
const { data, error } = await supabase.storage
  .from('agent-files')
  .upload(`agent-data/${fileId}/${fileName}`, file, {
    cacheControl: '3600',
    upsert: false
  });

// File metadata storage
await supabase
  .from('agent_files')
  .insert({
    id: fileId,
    name: fileName,
    size: file.size,
    type: file.type,
    url: publicUrl,
    agent_ingested: false
  });
```

## 🔧 Development Tools

### Build & Development
```bash
# Frontend development
npm run dev              # Start Next.js dev server
npm run build           # Production build
npm run type-check      # TypeScript validation
npm run lint           # ESLint checks

# Backend development
cd python-ai-services
python main_consolidated.py  # Start FastAPI server
python -m pytest tests/     # Run test suite
```

### Environment Configuration
```bash
# Frontend (.env.local)
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
NEXT_PUBLIC_WS_URL=wss://your-backend.railway.app/ws
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Backend (.env)
DATABASE_URL=postgresql://user:pass@host:port/db
REDIS_URL=redis://user:pass@host:port
OPENAI_API_KEY=sk-your_openai_key
ANTHROPIC_API_KEY=sk-ant-your_anthropic_key
```

## 📊 Performance Monitoring

### Metrics Collection
```typescript
// Performance tracking
interface PerformanceMetric {
  metricType: string;
  metricName: string;
  value: number;
  unit: string;
  timestamp: string;
}

// Usage
await supabase
  .from('system_metrics')
  .insert({
    metric_type: 'api_response_time',
    metric_name: 'trading_order_placement',
    value: responseTimeMs,
    unit: 'milliseconds'
  });
```

### Health Checks
```typescript
// API health endpoint
GET /api/health
Response: {
  status: 'healthy',
  timestamp: '2025-01-01T00:00:00Z',
  services: {
    database: 'connected',
    redis: 'connected',
    websocket: 'active'
  }
}
```

---

**Document Version:** 1.0  
**Last Updated:** December 2025  
**Maintained By:** Cival Development Team