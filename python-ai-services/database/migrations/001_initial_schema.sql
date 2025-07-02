-- AI Trading Dashboard - Initial Database Schema
-- Version: 1.0.0

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create schemas
CREATE SCHEMA IF NOT EXISTS trading;
CREATE SCHEMA IF NOT EXISTS agents;
CREATE SCHEMA IF NOT EXISTS portfolio;

-- Set search path
SET search_path TO trading, agents, portfolio, public;

-- =====================================================
-- PORTFOLIO SCHEMA
-- =====================================================

-- Master portfolios table
CREATE TABLE IF NOT EXISTS portfolio.portfolios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    initial_balance DECIMAL(20, 8) DEFAULT 10000,
    current_balance DECIMAL(20, 8) DEFAULT 10000,
    currency VARCHAR(10) DEFAULT 'USD',
    is_paper_trading BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Portfolio positions
CREATE TABLE IF NOT EXISTS portfolio.positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID NOT NULL REFERENCES portfolio.portfolios(id) ON DELETE CASCADE,
    symbol VARCHAR(50) NOT NULL,
    quantity DECIMAL(20, 8) NOT NULL,
    entry_price DECIMAL(20, 8) NOT NULL,
    current_price DECIMAL(20, 8),
    pnl DECIMAL(20, 8) GENERATED ALWAYS AS ((current_price - entry_price) * quantity) STORED,
    pnl_percentage DECIMAL(10, 4) GENERATED ALWAYS AS (((current_price - entry_price) / entry_price) * 100) STORED,
    opened_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP WITH TIME ZONE,
    is_open BOOLEAN DEFAULT true
);

-- =====================================================
-- TRADING SCHEMA
-- =====================================================

-- Trading strategies
CREATE TABLE IF NOT EXISTS trading.strategies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    strategy_type VARCHAR(50) NOT NULL,
    parameters JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE IF NOT EXISTS trading.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID NOT NULL REFERENCES portfolio.portfolios(id),
    strategy_id UUID REFERENCES trading.strategies(id),
    symbol VARCHAR(50) NOT NULL,
    side VARCHAR(10) NOT NULL CHECK (side IN ('buy', 'sell')),
    order_type VARCHAR(20) NOT NULL CHECK (order_type IN ('market', 'limit', 'stop', 'stop_limit')),
    quantity DECIMAL(20, 8) NOT NULL,
    price DECIMAL(20, 8),
    stop_price DECIMAL(20, 8),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    filled_quantity DECIMAL(20, 8) DEFAULT 0,
    average_fill_price DECIMAL(20, 8),
    commission DECIMAL(20, 8) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    executed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE
);

-- Trade history
CREATE TABLE IF NOT EXISTS trading.trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES trading.orders(id),
    portfolio_id UUID NOT NULL REFERENCES portfolio.portfolios(id),
    symbol VARCHAR(50) NOT NULL,
    side VARCHAR(10) NOT NULL,
    quantity DECIMAL(20, 8) NOT NULL,
    price DECIMAL(20, 8) NOT NULL,
    commission DECIMAL(20, 8) DEFAULT 0,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- AGENTS SCHEMA
-- =====================================================

-- AI Trading agents
CREATE TABLE IF NOT EXISTS agents.trading_agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    agent_type VARCHAR(50) NOT NULL,
    strategy_id UUID REFERENCES trading.strategies(id),
    portfolio_id UUID REFERENCES portfolio.portfolios(id),
    configuration JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT false,
    performance_metrics JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Agent decisions log
CREATE TABLE IF NOT EXISTS agents.agent_decisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents.trading_agents(id),
    decision_type VARCHAR(50) NOT NULL,
    symbol VARCHAR(50),
    action VARCHAR(20) NOT NULL,
    confidence DECIMAL(5, 4) CHECK (confidence >= 0 AND confidence <= 1),
    reasoning TEXT,
    market_data JSONB,
    decision_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Agent performance history
CREATE TABLE IF NOT EXISTS agents.agent_performance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents.trading_agents(id),
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    total_trades INTEGER DEFAULT 0,
    winning_trades INTEGER DEFAULT 0,
    losing_trades INTEGER DEFAULT 0,
    total_pnl DECIMAL(20, 8) DEFAULT 0,
    win_rate DECIMAL(5, 4) GENERATED ALWAYS AS (
        CASE WHEN total_trades > 0 
        THEN winning_trades::DECIMAL / total_trades::DECIMAL 
        ELSE 0 END
    ) STORED,
    sharpe_ratio DECIMAL(10, 4),
    max_drawdown DECIMAL(10, 4),
    metrics JSONB DEFAULT '{}'
);

-- =====================================================
-- FARMS SCHEMA
-- =====================================================

-- Agent farms (groups of agents)
CREATE TABLE IF NOT EXISTS agents.farms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    farm_type VARCHAR(50) NOT NULL,
    target_allocation DECIMAL(20, 8),
    current_allocation DECIMAL(20, 8) DEFAULT 0,
    is_active BOOLEAN DEFAULT false,
    configuration JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Farm agent assignments
CREATE TABLE IF NOT EXISTS agents.farm_agents (
    farm_id UUID NOT NULL REFERENCES agents.farms(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES agents.trading_agents(id) ON DELETE CASCADE,
    allocation_percentage DECIMAL(5, 2) CHECK (allocation_percentage >= 0 AND allocation_percentage <= 100),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (farm_id, agent_id)
);

-- =====================================================
-- GOALS SCHEMA
-- =====================================================

-- Trading goals
CREATE TABLE IF NOT EXISTS trading.goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    goal_type VARCHAR(50) NOT NULL,
    target_value DECIMAL(20, 8),
    current_value DECIMAL(20, 8) DEFAULT 0,
    deadline DATE,
    portfolio_id UUID REFERENCES portfolio.portfolios(id),
    agent_id UUID REFERENCES agents.trading_agents(id),
    farm_id UUID REFERENCES agents.farms(id),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- MARKET DATA SCHEMA
-- =====================================================

-- Market data cache
CREATE TABLE IF NOT EXISTS trading.market_data (
    symbol VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    open DECIMAL(20, 8),
    high DECIMAL(20, 8),
    low DECIMAL(20, 8),
    close DECIMAL(20, 8) NOT NULL,
    volume DECIMAL(20, 8),
    PRIMARY KEY (symbol, timestamp)
);

-- Create indexes for performance
CREATE INDEX idx_positions_portfolio ON portfolio.positions(portfolio_id);
CREATE INDEX idx_orders_portfolio ON trading.orders(portfolio_id);
CREATE INDEX idx_orders_status ON trading.orders(status);
CREATE INDEX idx_trades_portfolio ON trading.trades(portfolio_id);
CREATE INDEX idx_agent_decisions_agent ON agents.agent_decisions(agent_id);
CREATE INDEX idx_agent_performance_agent ON agents.agent_performance(agent_id);
CREATE INDEX idx_market_data_symbol ON trading.market_data(symbol);

-- Create update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_portfolios_updated_at BEFORE UPDATE ON portfolio.portfolios 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_strategies_updated_at BEFORE UPDATE ON trading.strategies 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents.trading_agents 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_farms_updated_at BEFORE UPDATE ON agents.farms 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default data
INSERT INTO portfolio.portfolios (name, description, initial_balance) VALUES
    ('Paper Trading Portfolio', 'Default paper trading portfolio', 10000),
    ('Demo Portfolio', 'Demo portfolio for testing', 50000);

-- Success message
DO $$ 
BEGIN 
    RAISE NOTICE 'Database schema created successfully!';
END $$;