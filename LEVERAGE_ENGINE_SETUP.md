# 🚀 Leverage Engine Setup Guide

## Overview
Complete 20x leverage engine implementation for the Cival Dashboard autonomous trading system. Provides advanced leverage management, real-time risk monitoring, and emergency protocols for all trading agents.

## ✅ Implementation Status: 100% Complete

### 🔧 Backend Components
- **Leverage Engine Service** (`leverage_engine_service.py`) - Core 20x leverage operations
- **Risk Management Enhancement** - Leverage-specific risk controls and monitoring
- **API Endpoints** (`leverage_routes.py`) - 8 RESTful endpoints for leverage operations
- **Database Schema** (`leverage_tables.sql`) - 5 tables with comprehensive leverage tracking
- **WebSocket Events** - Real-time leverage monitoring and alerts

### 🎨 Frontend Components
- **Leverage Control Panel** - Individual agent leverage controls with 1x-20x sliders
- **Leverage Monitoring Dashboard** - Real-time risk monitoring and analytics
- **Agent Coordination System** - Cross-agent leverage optimization
- **Main Leverage Page** (`/leverage`) - Complete dashboard integration

### 📊 Key Features Implemented

#### 1. Core Leverage Operations
- ✅ Up to 20x leverage for all agents
- ✅ Real-time margin monitoring
- ✅ Automatic liquidation price calculation
- ✅ Position sizing with leverage integration
- ✅ Cross-agent leverage coordination

#### 2. Risk Management Integration
- ✅ Leverage-specific VaR calculations
- ✅ Stress testing for leveraged portfolios
- ✅ Margin call thresholds (80%, 95%)
- ✅ Auto-deleveraging protocols
- ✅ Circuit breaker mechanisms

#### 3. Real-time Monitoring
- ✅ WebSocket leverage events
- ✅ Live margin usage tracking
- ✅ Liquidation risk warnings
- ✅ Portfolio-wide risk distribution
- ✅ Performance analytics

#### 4. Emergency Protocols
- ✅ One-click emergency deleveraging
- ✅ Automatic risk limit enforcement
- ✅ Margin call automation
- ✅ System-wide circuit breakers
- ✅ Real-time alert system

## 🚀 Quick Start

### 1. Database Setup
```bash
# Run the leverage database migration
psql -d your_database -f python-ai-services/database/migrations/leverage_tables.sql
```

### 2. Start Backend Services
```bash
cd python-ai-services
python main_consolidated.py
```

### 3. Start Frontend
```bash
cd cival-dashboard
npm run dev
```

### 4. Access Leverage Engine
Navigate to: `http://localhost:3000/leverage`

## 📡 API Endpoints

### Core Operations
- `POST /api/v1/leverage/set-agent-leverage` - Set agent leverage (1x-20x)
- `POST /api/v1/leverage/execute-leveraged-position` - Execute leveraged trade
- `POST /api/v1/leverage/emergency-delever` - Emergency deleveraging
- `GET /api/v1/leverage/agent-status/{agent_id}` - Agent leverage status

### Monitoring & Analytics
- `GET /api/v1/leverage/portfolio-exposure` - Portfolio-wide metrics
- `GET /api/v1/leverage/risk-metrics` - Comprehensive risk analysis
- `POST /api/v1/leverage/coordinate-agents` - Cross-agent optimization
- `GET /api/v1/leverage/health` - System health status

## 🔄 WebSocket Events

### Real-time Updates
- `leverage_update` - Agent leverage changes
- `margin_alert` - Margin usage warnings
- `liquidation_warning` - Liquidation risk alerts
- `position_update` - Position status changes
- `emergency_delever` - Emergency actions

### Usage Example
```typescript
import { useLeverageWebSocket } from '@/lib/websocket/leverage-events'

const { isConnected, setLeverage, emergencyDelever } = useLeverageWebSocket()

// Set agent leverage
setLeverage('agent_marcus_momentum', 'BTC', 15.0)

// Emergency delever
emergencyDelever('agent_alex_arbitrage')
```

## 📊 Database Schema

### Core Tables
- `agent_leverage_settings` - Agent leverage configuration
- `leverage_positions` - Active leveraged positions
- `leverage_risk_events` - Risk alerts and monitoring
- `leverage_coordination_history` - Cross-agent coordination
- `leverage_performance_metrics` - Performance tracking

### Key Views
- `active_agent_leverage_summary` - Real-time agent overview
- `portfolio_leverage_overview` - Portfolio-wide metrics
- `mv_leverage_dashboard_summary` - Optimized dashboard data

## 🛡️ Risk Controls

### Leverage Limits
- **Maximum Leverage:** 20x per position
- **Portfolio Leverage:** 10x average recommended
- **Single Position:** 15x maximum recommended
- **Margin Thresholds:** 80% warning, 95% liquidation

### Safety Features
- **Auto-deleveraging** when margin usage > 85%
- **Circuit breakers** for daily loss > 5%
- **Liquidation warnings** when risk > 90%
- **Emergency stops** for system-wide issues

## 🎯 Agent Integration

### Supported Agents
- **Marcus Momentum** - Trend-following with moderate leverage
- **Alex Arbitrage** - High-frequency with aggressive leverage
- **Sophia Reversion** - Mean reversion with conservative leverage
- **Riley Risk** - Risk management with minimal leverage

### Coordination Strategies
- **Conservative Risk Parity** - Equal risk distribution, low leverage
- **Balanced Optimization** - Performance-based allocation
- **Aggressive Growth** - Maximum leverage for top performers
- **Momentum Following** - Dynamic allocation based on performance

## 🔧 Configuration

### Environment Variables
```bash
# Database
DATABASE_URL="postgresql://user:pass@localhost/trading_db"

# Redis (optional)
REDIS_URL="redis://localhost:6379"

# API Configuration
LEVERAGE_MAX_RATIO=20.0
MARGIN_CALL_THRESHOLD=0.8
LIQUIDATION_THRESHOLD=0.95
```

### Agent Configuration
```python
# Example agent leverage settings
{
    "agent_id": "agent_marcus_momentum",
    "max_leverage": 20.0,
    "risk_tolerance": "moderate",
    "auto_delever_enabled": True,
    "margin_call_threshold": 0.8
}
```

## 📈 Performance Monitoring

### Key Metrics
- **Portfolio Leverage** - Weighted average across agents
- **Margin Utilization** - Percentage of available margin used
- **Risk Score** - 0-100 scale based on multiple factors
- **VaR Analysis** - Value at Risk with leverage amplification
- **Liquidation Risk** - Time-to-liquidation estimates

### Dashboard Features
- Real-time leverage adjustments (1x-20x sliders)
- Live margin usage monitoring
- Cross-agent risk coordination
- Emergency deleveraging controls
- Performance analytics and charts

## 🚨 Emergency Procedures

### Critical Margin Alerts
1. **Warning (80% margin)** - Yellow alert, monitor closely
2. **Critical (90% margin)** - Orange alert, consider reduction
3. **Emergency (95% margin)** - Red alert, auto-delever triggered

### Emergency Actions
- **Individual Agent:** Emergency delever button
- **Portfolio-wide:** Global emergency stop
- **Automatic:** System triggers based on risk thresholds
- **Manual Override:** Admin emergency controls

## 🔍 Troubleshooting

### Common Issues
1. **High Risk Alerts** - Check margin usage, reduce leverage
2. **WebSocket Disconnects** - Auto-reconnection implemented
3. **API Timeouts** - Graceful fallback to cached data
4. **Database Locks** - Concurrent access handled

### Debug Commands
```bash
# Check leverage system health
curl http://localhost:8000/api/v1/leverage/health

# Get agent status
curl http://localhost:8000/api/v1/leverage/agent-status/agent_marcus_momentum

# Portfolio exposure
curl http://localhost:8000/api/v1/leverage/portfolio-exposure
```

## 📚 Technical Architecture

### Service Dependencies
```
LeverageEngineService
├── RiskManagementService (enhanced)
├── PortfolioManagementService
├── MarketAnalysisService
└── SupabaseClient

Frontend Components
├── LeverageControlPanel
├── LeverageMonitoringDashboard
├── AgentLeverageCoordination
└── WebSocket Integration
```

### Data Flow
```
User Action → Frontend Component → WebSocket/API → Backend Service → Database
     ↓
Real-time Updates ← WebSocket Events ← Risk Monitoring ← Background Tasks
```

## 🏆 Production Readiness

### ✅ Completed Features
- [x] Core leverage engine (20x support)
- [x] Risk management integration
- [x] Real-time monitoring dashboard
- [x] Cross-agent coordination
- [x] Emergency protocols
- [x] Database schema and migrations
- [x] API endpoints and WebSocket events
- [x] Frontend UI components
- [x] Navigation integration

### 🔄 Ongoing Enhancements
- [ ] Machine learning risk optimization
- [ ] Advanced portfolio hedging
- [ ] Regulatory compliance reporting
- [ ] Enhanced stress testing scenarios

## 📞 Support

For questions or issues with the leverage engine:

1. **Check logs:** Both frontend console and backend logs
2. **Verify WebSocket:** Connection status in dashboard
3. **Database health:** Check table status and migrations
4. **API connectivity:** Test endpoints with curl/Postman

---

**Status:** 🚀 **PRODUCTION READY**  
**Last Updated:** December 2025  
**Version:** 1.0.0 - Complete Implementation  
**Maintainer:** Autonomous Trading System Team