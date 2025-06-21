# Cival Dashboard - Backend Structure Documentation

## 🏗️ Backend Architecture Overview

**Framework:** FastAPI with Python 3.11+  
**Architecture Pattern:** Microservices with Service Registry  
**Database:** PostgreSQL with Supabase  
**Caching:** Redis for session and data caching  
**Communication:** WebSocket for real-time updates  

## 📁 Directory Structure

```
python-ai-services/
├── main_consolidated.py           # Main FastAPI application entry point
├── core/                         # Core application infrastructure
│   ├── __init__.py
│   ├── service_registry.py       # Dependency injection container
│   ├── config.py                 # Configuration management
│   ├── exceptions.py             # Custom exception handlers
│   └── middleware.py             # Request/response middleware
├── services/                     # Business logic microservices
│   ├── __init__.py
│   ├── portfolio_service.py      # Portfolio management
│   ├── trading_service.py        # Order execution and management
│   ├── agent_service.py          # AI agent coordination
│   ├── market_data_service.py    # Market data aggregation
│   ├── risk_management_service.py # Risk analysis and alerts
│   ├── paper_trading_service.py  # Virtual trading engine
│   ├── strategy_service.py       # Trading strategy management
│   ├── notification_service.py   # Real-time notifications
│   ├── auth_service.py           # Authentication (disabled for solo mode)
│   ├── file_service.py           # File upload and management
│   ├── analytics_service.py      # Performance analytics
│   ├── websocket_service.py      # Real-time communication
│   ├── llm_service.py            # LLM integration service
│   ├── exchange_service.py       # Multi-exchange connectivity
│   └── backup_service.py         # Data backup and recovery
├── models/                       # Pydantic data models
│   ├── __init__.py
│   ├── agent.py                  # Agent-related models
│   ├── portfolio.py              # Portfolio and position models
│   ├── trading.py                # Trading order models
│   ├── market_data.py            # Market data models
│   ├── strategy.py               # Strategy configuration models
│   ├── user.py                   # User and authentication models
│   └── websocket.py              # WebSocket message models
├── database/                     # Database layer
│   ├── __init__.py
│   ├── connection.py             # Database connection management
│   ├── migrations/               # Database migration scripts
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_agent_system.sql
│   │   └── 003_paper_trading.sql
│   └── seeds/                    # Sample data for development
│       ├── agents.sql
│       ├── strategies.sql
│       └── test_data.sql
├── utils/                        # Utility functions
│   ├── __init__.py
│   ├── logger.py                 # Structured logging
│   ├── security.py               # Security utilities
│   ├── validators.py             # Data validation helpers
│   └── helpers.py                # General helper functions
└── tests/                        # Test suite
    ├── __init__.py
    ├── test_portfolio.py
    ├── test_trading.py
    ├── test_agents.py
    └── test_integration.py
```

## 🔧 Core Services Architecture

### 1. **Service Registry Pattern**
```python
# core/service_registry.py
class ServiceRegistry:
    def __init__(self):
        self._services = {}
    
    def register(self, service_name: str, service_instance):
        self._services[service_name] = service_instance
    
    def get(self, service_name: str):
        return self._services.get(service_name)

# Dependency injection for all services
registry = ServiceRegistry()
registry.register('portfolio', PortfolioService())
registry.register('trading', TradingService())
registry.register('agents', AgentService())
```

### 2. **FastAPI Application Structure**
```python
# main_consolidated.py
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Cival Trading Platform API",
    description="AI-Powered Autonomous Trading System",
    version="5.0.0"
)

# Middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "services": await get_service_status()
    }
```

## 📊 Database Schema

### Core Tables

#### **Agents System**
```sql
-- Agent definitions
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

-- Agent decision logging
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

#### **Paper Trading System**
```sql
-- Paper trading accounts
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

-- Paper trading transactions
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

#### **Portfolio Management**
```sql
-- Portfolio positions
CREATE TABLE agent_portfolios (
    id TEXT PRIMARY KEY,
    agent_id TEXT REFERENCES agents(id),
    account_id TEXT REFERENCES agent_paper_accounts(id),
    symbol TEXT NOT NULL,
    quantity DECIMAL(15,8) NOT NULL,
    avg_price DECIMAL(15,8) NOT NULL,
    current_price DECIMAL(15,8),
    market_value DECIMAL(15,2),
    unrealized_pnl DECIMAL(15,2) DEFAULT 0.00,
    realized_pnl DECIMAL(15,2) DEFAULT 0.00,
    last_trade_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(agent_id, account_id, symbol)
);
```

## 🚀 API Endpoints

### **Core System Endpoints**
```python
# Health and status
GET  /health                              # System health check
GET  /api/v1/services                     # Service registry status

# Portfolio management
GET  /api/v1/portfolio/summary            # Portfolio overview
GET  /api/v1/portfolio/positions          # Current positions
GET  /api/v1/portfolio/performance        # Performance metrics
POST /api/v1/portfolio/rebalance          # Trigger rebalancing
```

### **Agent Management Endpoints**
```python
# Agent operations
GET    /api/v1/agents                     # List all agents
POST   /api/v1/agents                     # Create new agent
GET    /api/v1/agents/{id}                # Agent details
PUT    /api/v1/agents/{id}                # Update agent
DELETE /api/v1/agents/{id}                # Delete agent

# Agent control
GET  /api/v1/agents/status                # Agent status overview
POST /api/v1/agents/{id}/start            # Start agent
POST /api/v1/agents/{id}/stop             # Stop agent
POST /api/v1/agents/{id}/execute-decision # Execute agent decision
GET  /api/v1/agents/{id}/decisions        # Agent decision history
POST /api/v1/agents/coordinate-decision   # Multi-agent coordination
```

### **Trading System Endpoints**
```python
# Strategy management
GET    /api/v1/strategies                 # List all strategies
POST   /api/v1/strategies                 # Create new strategy
GET    /api/v1/strategies/{id}            # Strategy details
PUT    /api/v1/strategies/{id}            # Update strategy
DELETE /api/v1/strategies/{id}            # Delete strategy

# Paper trading
POST /api/v1/trading/paper/order          # Create paper trade
GET  /api/v1/trading/paper/portfolio      # Paper portfolio status
GET  /api/v1/trading/paper/history        # Paper trading history
GET  /api/v1/trading/paper/metrics        # Performance metrics

# Live trading (future implementation)
POST /api/v1/trading/live/order           # Create live trade
GET  /api/v1/trading/live/positions       # Live positions
```

### **Market Data Endpoints**
```python
# Real-time data
GET  /api/v1/market/live-data/{symbol}    # Real-time market data
GET  /api/v1/market/watchlist             # Market watchlist
GET  /api/v1/market/historical/{symbol}   # Historical data
POST /api/v1/market/subscribe/{symbol}    # Subscribe to updates
```

### **Risk Management Endpoints**
```python
# Risk analysis
GET  /api/v1/risk/metrics                 # Comprehensive risk metrics
POST /api/v1/risk/stress-test             # Run stress test scenarios
GET  /api/v1/risk/alerts                  # Active risk alerts
POST /api/v1/risk/limits                  # Set risk limits
```

## 🔄 Real-Time Communication

### **WebSocket Implementation**
```python
# WebSocket connection management
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    
    try:
        while True:
            # Handle incoming messages
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Route message to appropriate handler
            await handle_websocket_message(websocket, message)
            
    except WebSocketDisconnect:
        await handle_disconnect(websocket)

# AG-UI Protocol v2 message handling
async def handle_websocket_message(websocket: WebSocket, message: dict):
    message_type = message.get('type')
    
    if message_type == 'subscribe':
        await subscribe_to_channel(websocket, message.get('channel'))
    elif message_type == 'agent_command':
        await execute_agent_command(message)
    elif message_type == 'market_data_request':
        await stream_market_data(websocket, message.get('symbol'))
```

### **Event Broadcasting System**
```python
# Event types for real-time updates
class EventType(str, Enum):
    PORTFOLIO_UPDATE = "portfolio_update"
    AGENT_DECISION = "agent_decision"
    MARKET_DATA = "market_data"
    TRADE_EXECUTION = "trade_execution"
    RISK_ALERT = "risk_alert"
    AGENT_STATUS = "agent_status"

# Broadcasting service
class WebSocketBroadcaster:
    def __init__(self):
        self.connections: List[WebSocket] = []
    
    async def broadcast(self, event_type: EventType, data: dict):
        message = {
            "type": event_type,
            "timestamp": datetime.utcnow().isoformat(),
            "data": data
        }
        
        # Send to all connected clients
        for connection in self.connections:
            try:
                await connection.send_text(json.dumps(message))
            except:
                # Remove disconnected clients
                self.connections.remove(connection)
```

## 🤖 LLM Integration Layer

### **LLM Service Architecture**
```python
# services/llm_service.py
class LLMService:
    def __init__(self):
        self.providers = {
            'openai': OpenAIProvider(),
            'anthropic': AnthropicProvider(),
            'openrouter': OpenRouterProvider()
        }
    
    async def generate_decision(self, agent_id: str, context: dict) -> AgentDecision:
        agent = await self.get_agent(agent_id)
        provider = self.providers[agent.llm_provider]
        
        prompt = self.build_trading_prompt(context, agent.personality)
        response = await provider.complete(prompt, agent.llm_model)
        
        return self.parse_decision_response(response, agent_id)
    
    def build_trading_prompt(self, context: dict, personality: dict) -> str:
        return f"""
        You are an AI trading agent with the following personality: {personality}
        
        Current market data: {context['market_data']}
        Portfolio status: {context['portfolio']}
        Risk parameters: {context['risk_limits']}
        
        Based on this information, make a trading decision and explain your reasoning.
        Respond in JSON format with: decision_type, symbol, reasoning, confidence_score
        """
```

### **Multi-Provider Support**
```python
# Abstract LLM provider interface
class LLMProvider(ABC):
    @abstractmethod
    async def complete(self, prompt: str, model: str) -> str:
        pass

# OpenAI implementation
class OpenAIProvider(LLMProvider):
    async def complete(self, prompt: str, model: str) -> str:
        response = await openai.ChatCompletion.acreate(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=1000
        )
        return response.choices[0].message.content

# Anthropic implementation
class AnthropicProvider(LLMProvider):
    async def complete(self, prompt: str, model: str) -> str:
        response = await anthropic.messages.create(
            model=model,
            max_tokens=1000,
            messages=[{"role": "user", "content": prompt}]
        )
        return response.content[0].text
```

## 📈 Performance & Monitoring

### **Logging System**
```python
# utils/logger.py
import structlog

logger = structlog.get_logger()

# Structured logging for all operations
async def log_trading_decision(agent_id: str, decision: dict):
    logger.info(
        "agent_decision_made",
        agent_id=agent_id,
        decision_type=decision['type'],
        symbol=decision.get('symbol'),
        confidence=decision.get('confidence_score'),
        reasoning_length=len(decision.get('reasoning', '')),
        timestamp=datetime.utcnow().isoformat()
    )
```

### **Metrics Collection**
```python
# Performance monitoring
class MetricsCollector:
    def __init__(self):
        self.redis_client = redis.Redis.from_url(REDIS_URL)
    
    async def record_api_call(self, endpoint: str, duration_ms: int):
        await self.redis_client.lpush(
            f"metrics:api:{endpoint}",
            json.dumps({
                "duration_ms": duration_ms,
                "timestamp": datetime.utcnow().isoformat()
            })
        )
    
    async def record_agent_decision(self, agent_id: str, execution_time_ms: int):
        await self.redis_client.lpush(
            f"metrics:agent:{agent_id}:decisions",
            json.dumps({
                "execution_time_ms": execution_time_ms,
                "timestamp": datetime.utcnow().isoformat()
            })
        )
```

## 🔐 Security Implementation

### **API Security**
```python
# Rate limiting middleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    # Apply rate limiting to all API endpoints
    try:
        response = await call_next(request)
        return response
    except RateLimitExceeded:
        return JSONResponse(
            status_code=429,
            content={"error": "Rate limit exceeded"}
        )
```

### **Input Validation**
```python
# Comprehensive request validation
class TradingOrderRequest(BaseModel):
    symbol: str = Field(..., regex=r'^[A-Z]{2,6}$')
    side: Literal['buy', 'sell']
    order_type: Literal['market', 'limit', 'stop']
    quantity: Decimal = Field(..., gt=0, le=1000000)
    price: Optional[Decimal] = Field(None, gt=0)
    
    @validator('price')
    def validate_price_for_limit_orders(cls, v, values):
        if values.get('order_type') == 'limit' and v is None:
            raise ValueError('Price required for limit orders')
        return v
```

## 🚀 Deployment Configuration

### **Production Settings**
```python
# core/config.py
class Settings(BaseSettings):
    # Database configuration
    DATABASE_URL: str
    REDIS_URL: str
    
    # API keys
    OPENAI_API_KEY: Optional[str] = None
    ANTHROPIC_API_KEY: Optional[str] = None
    ALPHA_VANTAGE_API_KEY: Optional[str] = None
    
    # Application settings
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"
    API_PREFIX: str = "/api/v1"
    
    # Security settings
    SECRET_KEY: str
    CORS_ORIGINS: List[str] = ["*"]
    
    class Config:
        env_file = ".env"

settings = Settings()
```

### **Docker Configuration**
```dockerfile
# Dockerfile for production deployment
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run application
CMD ["uvicorn", "main_consolidated:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

**Document Version:** 1.0  
**Last Updated:** December 2025  
**Maintained By:** Cival Development Team