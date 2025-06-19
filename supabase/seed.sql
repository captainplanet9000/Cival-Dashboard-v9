-- Seed data to get the dashboard operational immediately
-- Run this after the migration to populate initial data

-- 1. Create default user if not exists
INSERT INTO users (id, email, role, created_at)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'admin@cival.trading',
    'admin',
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- 2. Create default wallet
INSERT INTO wallets (id, user_id, name, type, balance, currency, is_active)
VALUES (
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Main Trading Wallet',
    'spot',
    100000.00,
    'USDT',
    true
) ON CONFLICT (id) DO NOTHING;

-- 3. Add supported currencies (if not exists)
INSERT INTO supported_currencies (symbol, name, decimals, is_active)
VALUES 
    ('USDT', 'Tether', 6, true),
    ('USDC', 'USD Coin', 6, true),
    ('BTC', 'Bitcoin', 8, true),
    ('ETH', 'Ethereum', 18, true),
    ('BNB', 'Binance Coin', 8, true)
ON CONFLICT (symbol) DO NOTHING;

-- 4. Create default trading strategies
INSERT INTO trading_strategies (id, name, type, parameters, status)
VALUES 
    ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Momentum Strategy', 'momentum', 
     '{"timeframe": "1h", "lookback": 20, "threshold": 0.02}', 'active'),
    ('c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Mean Reversion', 'mean_reversion',
     '{"timeframe": "4h", "sma_period": 50, "std_dev": 2}', 'active'),
    ('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Arbitrage Bot', 'arbitrage',
     '{"min_spread": 0.001, "max_position": 10000}', 'inactive')
ON CONFLICT (id) DO NOTHING;

-- 5. Create autonomous agents
INSERT INTO autonomous_agents (
    id, name, type, status, configuration, capabilities, memory_bank,
    learning_rate, exploration_rate, created_at
)
VALUES 
    ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Alpha Trader', 'trading', 'active',
     '{"strategy_id": "c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11", "risk_limit": 0.02}',
     '["market_analysis", "order_execution", "risk_management"]',
     '{"learned_patterns": [], "performance_history": []}',
     0.001, 0.1, NOW()),
    ('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Risk Monitor', 'risk_management', 'active',
     '{"max_drawdown": 0.1, "var_limit": 0.05}',
     '["risk_analysis", "portfolio_monitoring", "alert_generation"]',
     '{}', 0.001, 0.05, NOW()),
    ('d2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Market Scanner', 'analysis', 'active',
     '{"scan_interval": 60, "symbols": ["BTC/USDT", "ETH/USDT"]}',
     '["market_scanning", "signal_generation", "trend_analysis"]',
     '{}', 0.001, 0.15, NOW())
ON CONFLICT (id) DO NOTHING;

-- 6. Create coordination protocols
INSERT INTO coordination_protocols (
    id, name, protocol_type, configuration, participating_agents, is_active
)
VALUES 
    ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Trading Consensus', 'consensus',
     '{"min_agents": 2, "consensus_threshold": 0.7}',
     '["d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11", "d2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"]',
     true),
    ('e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Risk Override', 'hierarchical',
     '{"priority_agent": "d1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"}',
     '["d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11", "d1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"]',
     true)
ON CONFLICT (id) DO NOTHING;

-- 7. Create farms
INSERT INTO farms (
    id, name, type, status, configuration, assigned_capital, 
    current_value, total_agents, created_at
)
VALUES 
    ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Momentum Farm Alpha', 'momentum', 'active',
     '{"strategy": "momentum", "timeframes": ["1h", "4h"], "max_positions": 5}',
     25000.00, 26500.00, 3, NOW()),
    ('f1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Arbitrage Farm Beta', 'arbitrage', 'active',
     '{"exchanges": ["binance", "coinbase"], "min_spread": 0.002}',
     50000.00, 51200.00, 2, NOW()),
    ('f2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'DeFi Yield Farm', 'defi', 'inactive',
     '{"protocols": ["uniswap", "aave"], "target_apy": 0.15}',
     15000.00, 15450.00, 1, NOW())
ON CONFLICT (id) DO NOTHING;

-- 8. Create sample market data
INSERT INTO market_data (symbol, price, volume, timestamp)
VALUES 
    ('BTC/USDT', 45000.00, 1234567890.00, NOW() - INTERVAL '5 minutes'),
    ('BTC/USDT', 45100.00, 1234567900.00, NOW() - INTERVAL '4 minutes'),
    ('BTC/USDT', 45050.00, 1234567910.00, NOW() - INTERVAL '3 minutes'),
    ('BTC/USDT', 45150.00, 1234567920.00, NOW() - INTERVAL '2 minutes'),
    ('BTC/USDT', 45200.00, 1234567930.00, NOW() - INTERVAL '1 minute'),
    ('BTC/USDT', 45250.00, 1234567940.00, NOW()),
    ('ETH/USDT', 2400.00, 987654321.00, NOW() - INTERVAL '5 minutes'),
    ('ETH/USDT', 2410.00, 987654331.00, NOW() - INTERVAL '4 minutes'),
    ('ETH/USDT', 2405.00, 987654341.00, NOW() - INTERVAL '3 minutes'),
    ('ETH/USDT', 2415.00, 987654351.00, NOW() - INTERVAL '2 minutes'),
    ('ETH/USDT', 2420.00, 987654361.00, NOW() - INTERVAL '1 minute'),
    ('ETH/USDT', 2425.00, 987654371.00, NOW());

-- 9. Create trading goals
INSERT INTO goals (
    id, user_id, title, description, type, status, 
    target_value, current_value, deadline
)
VALUES 
    ('g0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
     'Daily Profit Target', 'Achieve $5000 daily profit', 'profit', 'active',
     5000.00, 3250.00, NOW() + INTERVAL '1 day'),
    ('g1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
     'Risk Management', 'Keep drawdown below 5%', 'risk', 'active',
     5.00, 2.30, NOW() + INTERVAL '30 days'),
    ('g2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
     'Win Rate Improvement', 'Achieve 75% win rate', 'performance', 'active',
     75.00, 68.50, NOW() + INTERVAL '14 days')
ON CONFLICT (id) DO NOTHING;

-- 10. Create sample positions
INSERT INTO positions (
    id, user_id, symbol, side, quantity, entry_price, 
    current_price, unrealized_pnl, status
)
VALUES 
    ('p0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
     'BTC/USDT', 'long', 0.5, 44800.00, 45250.00, 225.00, 'open'),
    ('p1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
     'ETH/USDT', 'long', 5.0, 2380.00, 2425.00, 225.00, 'open')
ON CONFLICT (id) DO NOTHING;

-- 11. Create watchlist
INSERT INTO watchlists (id, user_id, name, symbols)
VALUES (
    'w0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Main Watchlist',
    '["BTC/USDT", "ETH/USDT", "BNB/USDT", "SOL/USDT", "ADA/USDT"]'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- 12. Create sample alerts
INSERT INTO alerts (
    user_id, alert_type, severity, title, message, source
)
VALUES 
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'price', 'info',
     'BTC Price Alert', 'BTC/USDT reached $45,250', 'market_monitor'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'risk', 'warning',
     'Drawdown Warning', 'Portfolio drawdown approaching 3%', 'risk_monitor');

-- 13. Add user preferences
INSERT INTO user_preferences (user_id, preferences)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    '{
        "theme": "dark",
        "notifications": {
            "email": true,
            "push": true,
            "sms": false
        },
        "trading": {
            "default_leverage": 1,
            "risk_per_trade": 0.02,
            "preferred_timeframe": "1h"
        },
        "display": {
            "currency": "USD",
            "timezone": "UTC",
            "decimal_places": 2
        }
    }'::jsonb
) ON CONFLICT (user_id) DO NOTHING;

-- 14. Create resource pools
INSERT INTO resource_pools (
    id, name, resource_type, total_capacity, allocated_capacity,
    configuration, is_active
)
VALUES 
    ('r0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'GPU Compute Pool', 'compute',
     100.0, 45.0, '{"gpu_type": "A100", "memory": "40GB"}', true),
    ('r1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Capital Pool', 'capital',
     100000.0, 75000.0, '{"currency": "USDT", "risk_limit": 0.1}', true),
    ('r2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'API Rate Pool', 'api_calls',
     10000.0, 2500.0, '{"reset_interval": "1h", "burst_limit": 100}', true)
ON CONFLICT (id) DO NOTHING;

-- 15. Add DeFi protocols
INSERT INTO defi_protocols (
    id, name, protocol_type, chain, tvl, apy, risk_score, is_active
)
VALUES 
    ('defi0001', 'Uniswap V3', 'dex', 'ethereum', 5000000000.00, 12.50, 3, true),
    ('defi0002', 'Aave', 'lending', 'ethereum', 12000000000.00, 4.25, 2, true),
    ('defi0003', 'Compound', 'lending', 'ethereum', 8000000000.00, 3.75, 2, true),
    ('defi0004', 'PancakeSwap', 'dex', 'bsc', 3000000000.00, 18.50, 5, true)
ON CONFLICT (id) DO NOTHING;

-- Grant permissions for RLS (adjust based on your auth setup)
-- This assumes you're using a service role for the dashboard
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;