# 📋 COPY & PASTE THIS EXACT SCRIPT

## 🚀 Copy This Into Supabase SQL Editor:

```sql
-- ULTRA SIMPLE SETUP - Guaranteed to work
-- Just creates the essential tables with no fancy queries

-- 1. Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    symbol VARCHAR(20) NOT NULL,
    side VARCHAR(10) NOT NULL,
    order_type VARCHAR(20) NOT NULL,
    quantity DECIMAL(20,8) NOT NULL,
    price DECIMAL(20,8),
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create alerts table  
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    acknowledged BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create risk_metrics table
CREATE TABLE IF NOT EXISTS risk_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID,
    metric_type VARCHAR(50) NOT NULL,
    value DECIMAL(20,8) NOT NULL,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create basic indexes
CREATE INDEX IF NOT EXISTS idx_orders_symbol ON orders(symbol);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);

-- 5. Add test data
INSERT INTO alerts (alert_type, severity, title, message) 
VALUES ('system', 'info', 'Database Ready', 'Trading system is operational');

-- 6. Simple success message
SELECT 'SUCCESS: Essential trading tables created!' as result;
```

## ✅ That's It!

1. Copy the SQL above
2. Paste into Supabase Dashboard → SQL Editor
3. Click Run
4. You should see "SUCCESS: Essential trading tables created!"

## 🎯 Next Steps:

1. **Configure environment:**
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

2. **Start dashboard:**
   ```bash
   npm run dev
   ```

3. **Visit:** `http://localhost:3000/dashboard`

**Your trading dashboard is now ready!** 🚀