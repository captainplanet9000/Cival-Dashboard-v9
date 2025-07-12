# Backend Integration Migration Instructions

## Overview
This document provides instructions for applying the backend integration migration that enables real API connectivity for all dashboard components.

## Migration Files
- `supabase/migrations/20250712_backend_integration_complete.sql` - Main migration
- `scripts/apply-backend-integration-migration.sql` - Manual application script

## What This Migration Does

### 1. Creates Backend Integration Tracking
- **Table**: `backend_integration_log`
- **Purpose**: Tracks which components have backend integration enabled
- **Features**: Monitors API endpoints and fallback mechanisms

### 2. API Response Caching
- **Table**: `api_response_cache` 
- **Purpose**: Caches API responses for fallback scenarios
- **Features**: Automatic expiration and conflict resolution

### 3. Backend Health Monitoring
- **Table**: `backend_health_monitor`
- **Purpose**: Monitors health and performance of backend services
- **Features**: Response time tracking and failure counting

### 4. Utility Functions
- `update_backend_health()` - Updates service health status
- `cache_api_response()` - Caches API responses with TTL
- `get_cached_api_response()` - Retrieves cached responses

## Application Methods

### Method 1: Supabase Dashboard (Recommended)
1. Open your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the content from `supabase/migrations/20250712_backend_integration_complete.sql`
4. Click "Run" to execute the migration

### Method 2: Local Supabase CLI
```bash
# If you have Supabase CLI and Docker running
npx supabase db push
```

### Method 3: Direct PostgreSQL Connection
```bash
# Connect to your database and run:
psql "your-connection-string" -f supabase/migrations/20250712_backend_integration_complete.sql
```

## Verification Steps

After applying the migration, verify it worked:

```sql
-- Check tables were created
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('backend_integration_log', 'api_response_cache', 'backend_health_monitor');

-- Check functions were created
SELECT routine_name FROM information_schema.routines 
WHERE routine_name IN ('update_backend_health', 'cache_api_response', 'get_cached_api_response');

-- Check data was inserted
SELECT component_name, integration_status FROM backend_integration_log;
```

## Expected Results

After successful migration, you should see:
- 3 new tables created
- 3 new functions created  
- 5 component integration entries
- 5 health monitoring entries
- Proper RLS policies enabled

## Rollback (if needed)

```sql
-- To rollback this migration
DROP TABLE IF EXISTS backend_integration_log CASCADE;
DROP TABLE IF EXISTS api_response_cache CASCADE; 
DROP TABLE IF EXISTS backend_health_monitor CASCADE;
DROP FUNCTION IF EXISTS update_backend_health CASCADE;
DROP FUNCTION IF EXISTS cache_api_response CASCADE;
DROP FUNCTION IF EXISTS get_cached_api_response CASCADE;
```

## Integration Status

The following components now have full backend integration:

| Component | Status | API Endpoints | Fallback |
|-----------|--------|---------------|----------|
| ConnectedTradingTab | ✅ Active | createTradingOrder, getTradingPositions | Paper Trading Engine |
| ConnectedAgentsTab | ✅ Active | startAgent, stopAgent, deleteAgent, updateAgent | Mock Data |
| AutonomousCoordinatorStatus | ✅ Active | getCoordinatorStatus, getSystemConnections | Mock Data |
| ConnectedAnalyticsTab | ✅ Active | getPerformanceAnalytics, getRiskMetrics | Mock Data |
| ConnectedFarmsTab | ✅ Active | getFarmStatus, updateFarmConfiguration | Mock Data |

## Next Steps

After applying this migration:
1. Restart your frontend application
2. Test each dashboard component
3. Verify API calls are working in browser console
4. Check that fallbacks work when backend is unavailable
5. Monitor the `backend_health_monitor` table for service status

## Support

If you encounter issues:
1. Check browser console for API errors
2. Verify Supabase connection in Network tab
3. Check `backend_health_monitor` table for service status
4. Review integration logs in `backend_integration_log` table