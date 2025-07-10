# Advanced Memory System Documentation

## Overview

The Advanced Memory System is a comprehensive AI agent learning platform that enables intelligent trading agents to store, analyze, and learn from their experiences. The system combines persistent storage, semantic search, pattern recognition, and real-time analytics to create a sophisticated learning environment.

## Architecture

### Core Components

1. **Unified Memory Service** (`unified-memory-service.ts`)
   - Central memory management and coordination
   - Database persistence with Supabase integration
   - Real-time WebSocket updates
   - Memory lifecycle management

2. **Semantic Search Service** (`semantic-search-service.ts`)
   - Embedding generation (OpenAI/Mock providers)
   - Vector similarity calculations
   - Intelligent caching system
   - Memory clustering capabilities

3. **Pattern Recognition Service** (`pattern-recognition-service.ts`)
   - Multi-pattern analysis (success/failure/risk/evolution/adaptation)
   - Insight generation with confidence scoring
   - Recommendation system
   - Learning trend analysis

4. **Performance Optimization Service** (`performance-optimization-service.ts`)
   - Real-time performance monitoring
   - Automatic optimization rules
   - Batch operation processing
   - Resource management

5. **Testing Suite** (`memory-system-tests.ts`)
   - Comprehensive unit, integration, performance, and stress tests
   - Automated health checks
   - Production readiness validation

## Database Schema

### Primary Tables

#### `agent_memories`
```sql
CREATE TABLE agent_memories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID REFERENCES agents(id),
  content TEXT NOT NULL,
  memory_type TEXT NOT NULL CHECK (memory_type IN (
    'trade_decision', 'market_insight', 'strategy_learning', 
    'risk_observation', 'pattern_recognition', 'performance_feedback'
  )),
  category TEXT DEFAULT 'general',
  importance_score DECIMAL(5,4) DEFAULT 0.5,
  relevance_decay DECIMAL(5,4) DEFAULT 0.95,
  access_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMP,
  context JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  related_symbols TEXT[] DEFAULT '{}',
  market_conditions JSONB DEFAULT '{}',
  trade_outcome JSONB,
  strategy_used TEXT,
  timeframe TEXT,
  confidence_level DECIMAL(5,4),
  embedding JSONB DEFAULT '{}',
  embedding_model TEXT,
  parent_memory_id UUID REFERENCES agent_memories(id),
  cluster_id UUID,
  similarity_threshold DECIMAL(5,4) DEFAULT 0.7,
  expires_at TIMESTAMP,
  archived_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `memory_clusters`
```sql
CREATE TABLE memory_clusters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID REFERENCES agents(id),
  cluster_name TEXT NOT NULL,
  cluster_type TEXT CHECK (cluster_type IN (
    'pattern', 'strategy', 'outcome', 'temporal', 'market_condition'
  )),
  description TEXT,
  memory_count INTEGER DEFAULT 0,
  avg_importance DECIMAL(5,4) DEFAULT 0.5,
  success_rate DECIMAL(5,4),
  avg_pnl DECIMAL(12,2),
  common_patterns JSONB DEFAULT '{}',
  insights JSONB DEFAULT '{}',
  recommendations TEXT[] DEFAULT '{}',
  cluster_embedding JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  auto_generated BOOLEAN DEFAULT false,
  last_analyzed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `memory_insights`
```sql
CREATE TABLE memory_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID REFERENCES agents(id),
  insight_type TEXT NOT NULL,
  insight_category TEXT DEFAULT 'general',
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  confidence_score DECIMAL(5,4) NOT NULL,
  impact_score DECIMAL(5,4) DEFAULT 0.5,
  urgency_level TEXT DEFAULT 'medium',
  is_actionable BOOLEAN DEFAULT true,
  recommendations TEXT[] DEFAULT '{}',
  supporting_memories UUID[],
  generated_by TEXT DEFAULT 'system',
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Supporting Tables

- `enhanced_memory_checkpoints` - Memory state snapshots
- `memory_performance_tracking` - Performance correlation data
- `memory_optimization_log` - System optimization history

## API Endpoints

### Memory Operations

#### Store Memory
```typescript
POST /api/memory/store
{
  "agentId": "string",
  "content": "string",
  "memoryType": "trade_decision|market_insight|strategy_learning|risk_observation|pattern_recognition|performance_feedback",
  "context": {},
  "options": {
    "importance": 0.8,
    "category": "success",
    "symbols": ["BTC/USD"],
    "strategy": "momentum_trading",
    "generateEmbedding": true
  }
}
```

#### Retrieve Memories
```typescript
GET /api/memory/store?agentId=string&limit=10&memoryTypes=trade_decision
```

#### Semantic Search
```typescript
POST /api/memory/search
{
  "agentId": "string",
  "query": "profitable Bitcoin trades",
  "semantic": true,
  "limit": 10
}
```

#### Get Insights
```typescript
GET /api/memory/insights?agentId=string
```

#### Record Trade Outcome
```typescript
POST /api/memory/insights
{
  "agentId": "string",
  "memoryId": "string",
  "outcome": {
    "pnl": 250.50,
    "success": true,
    "executionTime": 150,
    "slippage": 0.1
  }
}
```

### Cluster Operations

#### Get Memory Clusters
```typescript
GET /api/memory/clusters?agentId=string
```

#### Create Cluster
```typescript
POST /api/memory/clusters
{
  "agentId": "string",
  "name": "Bitcoin Success Pattern",
  "type": "pattern",
  "memoryIds": ["uuid1", "uuid2"],
  "description": "Successful BTC trading patterns"
}
```

### Checkpoint Operations

#### Create Checkpoint
```typescript
POST /api/memory/checkpoint
{
  "agentId": "string",
  "name": "Pre-deployment checkpoint",
  "type": "manual",
  "agentState": {},
  "triggerEvent": "manual_backup"
}
```

#### Restore Checkpoint
```typescript
PUT /api/memory/checkpoint
{
  "checkpointId": "string"
}
```

### Analytics

#### Get Learning Metrics
```typescript
GET /api/memory/analytics?agentId=string
```

## Core Services Usage

### Unified Memory Service

```typescript
import { unifiedMemoryService } from '@/lib/memory/unified-memory-service'

// Store a memory
const memoryId = await unifiedMemoryService.storeMemory(
  'agent-001',
  'Successful BTC trade with momentum strategy',
  'trade_decision',
  { 
    symbol: 'BTC/USD',
    price: 45000,
    strategy: 'momentum_trading',
    pnl: 250.50
  },
  {
    importance: 0.9,
    generateEmbedding: true,
    symbols: ['BTC/USD']
  }
)

// Retrieve memories
const memories = await unifiedMemoryService.retrieveMemories('agent-001', {
  memoryTypes: ['trade_decision'],
  limit: 10,
  sortBy: 'importance'
})

// Semantic search
const results = await unifiedMemoryService.semanticSearch(
  'agent-001',
  'profitable cryptocurrency trades',
  10,
  0.7 // similarity threshold
)

// Get pattern recommendations
const recommendations = await unifiedMemoryService.getPatternRecommendations('agent-001')
```

### Semantic Search Service

```typescript
import { getSemanticSearchService } from '@/lib/memory/semantic-search-service'

const semanticService = getSemanticSearchService()

// Generate embeddings
const embedding = await semanticService.generateEmbedding('Market analysis text')

// Calculate similarity
const similarity = semanticService.calculateCosineSimilarity(embedding1, embedding2)

// Search memories
const searchResults = await semanticService.searchMemories(
  'search query',
  memories,
  {
    threshold: 0.7,
    limit: 10,
    memoryTypes: ['trade_decision']
  }
)

// Cluster memories
const clusters = await semanticService.clusterMemories(memories, 5, 0.75)
```

### Pattern Recognition Service

```typescript
import { getPatternRecognitionService } from '@/lib/memory/pattern-recognition-service'

const patternService = getPatternRecognitionService()

// Analyze patterns
const patterns = await patternService.analyzeMemoryPatterns('agent-001', memories, {
  minConfidence: 0.6,
  maxAge: 30,
  includeHistorical: true
})

// Generate insights
const insights = await patternService.generatePatternInsights(patterns)

// Get recommendations
const recommendations = await patternService.getPatternRecommendations('agent-001', {
  currentMarket: 'bullish',
  timeframe: '1h'
})
```

### Performance Optimization Service

```typescript
import { getPerformanceOptimizationService } from '@/lib/memory/performance-optimization-service'

const perfService = getPerformanceOptimizationService()

// Optimize batch operations
const results = await perfService.optimizeMemoryBatch([
  { type: 'store', data: {}, priority: 1 },
  { type: 'retrieve', data: {}, priority: 2 }
])

// Optimize embeddings
const embeddings = await perfService.optimizeEmbeddingGeneration(
  ['text1', 'text2'],
  { batchSize: 10, parallel: true, cache: true }
)

// Optimize queries
const queryResult = await perfService.optimizeQuery(
  () => database.query('SELECT * FROM memories'),
  'cache_key',
  300000 // 5 minutes TTL
)

// Get performance metrics
const metrics = perfService.getCurrentMetrics()
const recommendations = perfService.getOptimizationRecommendations()
```

## React Components

### AgentMemoryDashboard

Main dashboard for viewing and managing agent memories with real-time updates.

```typescript
import { AgentMemoryDashboard } from '@/components/memory/AgentMemoryDashboard'

// Features:
// - Memory timeline view
// - Agent personality profiles
// - Decision simulation
// - Memory analytics
// - Real-time WebSocket updates
```

### AdvancedMemoryAnalytics

Comprehensive analytics dashboard with semantic search and pattern analysis.

```typescript
import { AdvancedMemoryAnalytics } from '@/components/memory/AdvancedMemoryAnalytics'

// Features:
// - Semantic search interface
// - Memory cluster visualization
// - Learning trend analysis
// - AI-generated insights
// - Performance metrics
```

### MemoryIntegratedTrading

Demonstration component showing memory formation during trading decisions.

```typescript
import { MemoryIntegratedTrading } from '@/components/memory/MemoryIntegratedTrading'

// Features:
// - Live trading simulation
// - Memory-enhanced decisions
// - Real-time memory creation
// - Pattern influence tracking
// - Performance feedback loop
```

### MemorySystemMonitoring

Production monitoring dashboard for system health and diagnostics.

```typescript
import { MemorySystemMonitoring } from '@/components/memory/MemorySystemMonitoring'

// Features:
// - Real-time health monitoring
// - Service status tracking
// - Performance metrics
// - Diagnostic test runner
// - Optimization controls
```

## WebSocket Integration

### Event Types

#### Memory Events
```typescript
interface MemoryUpdate {
  agentId: string
  memoryId: string
  memoryType: string
  content: string
  importanceScore: number
  action: 'stored' | 'updated' | 'archived' | 'deleted'
  timestamp: number
}

interface MemoryInsight {
  agentId: string
  insightType: 'pattern_discovered' | 'strategy_improved' | 'risk_identified'
  description: string
  confidence: number
  memoryIds: string[]
  impact: {
    performanceChange: number
    confidenceChange: number
  }
  timestamp: number
}

interface AgentLearningUpdate {
  agentId: string
  learningMetrics: {
    totalMemories: number
    avgImportanceScore: number
    learningEfficiency: number
    adaptationScore: number
  }
  recentActivity: {
    memoriesAddedToday: number
    insightsGenerated: number
  }
  timestamp: number
}
```

### React Hooks

```typescript
import { 
  useMemoryUpdates, 
  useMemoryInsights, 
  useAgentLearningUpdates 
} from '@/lib/realtime/websocket'

// Use in components
const memoryUpdates = useMemoryUpdates('agent-001')
const insights = useMemoryInsights('agent-001')
const learningUpdates = useAgentLearningUpdates('agent-001')
```

## Testing

### Running Tests

```typescript
import { getMemoryTestRunner } from '@/lib/memory/memory-system-tests'

const testRunner = getMemoryTestRunner()

// Run all tests
const results = await testRunner.runAllTests({
  includeStressTests: true,
  includePerformanceTests: true,
  agentId: 'test-agent'
})

// Get test results
const testSuites = testRunner.getTestSuites()
const testResults = testRunner.getTestResults()
```

### Test Categories

1. **Unit Tests**
   - Memory storage/retrieval
   - Embedding generation
   - Pattern detection
   - Clustering algorithms

2. **Integration Tests**
   - Memory-to-pattern pipeline
   - Trading system integration
   - Real-time updates
   - Database persistence

3. **Performance Tests**
   - Memory storage performance
   - Semantic search speed
   - Pattern analysis efficiency
   - Batch operation throughput

4. **Stress Tests**
   - High volume operations
   - Concurrent access
   - Memory limits
   - Error recovery

## Performance Optimization

### Caching Strategy

1. **Embedding Cache**
   - LRU cache with configurable size
   - TTL-based expiration
   - Automatic cleanup

2. **Query Results Cache**
   - Redis-backed caching
   - Intelligent cache keys
   - Selective invalidation

3. **Pattern Analysis Cache**
   - Analysis result caching
   - Incremental updates
   - Context-aware keys

### Database Optimization

1. **Indexing Strategy**
   ```sql
   -- Primary indexes
   CREATE INDEX idx_agent_memories_agent_id ON agent_memories(agent_id);
   CREATE INDEX idx_agent_memories_created_at ON agent_memories(created_at);
   CREATE INDEX idx_agent_memories_memory_type ON agent_memories(memory_type);
   CREATE INDEX idx_agent_memories_importance ON agent_memories(importance_score);
   
   -- Composite indexes
   CREATE INDEX idx_agent_memories_agent_type_created ON agent_memories(agent_id, memory_type, created_at);
   CREATE INDEX idx_agent_memories_agent_importance ON agent_memories(agent_id, importance_score DESC);
   ```

2. **Query Optimization**
   - Prepared statements
   - Batch operations
   - Connection pooling
   - Read replicas

### Memory Management

1. **Automatic Archiving**
   - Age-based archiving
   - Importance thresholds
   - Storage optimization

2. **Memory Limits**
   - Agent-specific limits
   - Global system limits
   - Graceful degradation

## Monitoring and Alerts

### Health Checks

1. **Service Health**
   - Response time monitoring
   - Error rate tracking
   - Uptime measurement

2. **Performance Metrics**
   - Throughput monitoring
   - Memory usage tracking
   - Cache performance

3. **System Alerts**
   - Critical error notifications
   - Performance degradation alerts
   - Capacity warnings

### Observability

1. **Logging**
   - Structured logging
   - Request tracing
   - Error tracking

2. **Metrics**
   - Custom metrics collection
   - Performance dashboards
   - Trend analysis

## Deployment

### Environment Configuration

```bash
# Required Environment Variables
DATABASE_URL="postgresql://..."           # Supabase database
REDIS_URL="redis://..."                  # Redis for caching
NEXT_PUBLIC_API_URL="http://localhost:8000"

# Optional Configuration
OPENAI_API_KEY="sk-..."                  # For production embeddings
EMBEDDING_PROVIDER="openai|mock"         # Provider selection
MEMORY_CACHE_SIZE="10000"                # Cache configuration
MEMORY_TTL="300000"                      # 5 minutes default
```

### Production Checklist

- [ ] Database migration completed
- [ ] Environment variables configured
- [ ] Redis connection established
- [ ] WebSocket service running
- [ ] Performance monitoring enabled
- [ ] Error tracking configured
- [ ] Backup procedures implemented
- [ ] Load testing completed
- [ ] Security review passed

### Scaling Considerations

1. **Horizontal Scaling**
   - Stateless service design
   - Load balancer configuration
   - Session affinity for WebSockets

2. **Database Scaling**
   - Read replica configuration
   - Sharding strategy
   - Connection pooling

3. **Cache Scaling**
   - Redis cluster setup
   - Cache partitioning
   - Eviction policies

## Security

### Data Protection

1. **Encryption**
   - Data at rest encryption
   - Transport layer security
   - Sensitive data masking

2. **Access Control**
   - Agent isolation
   - API authentication
   - Rate limiting

### Privacy Considerations

1. **Data Retention**
   - Configurable retention periods
   - Automatic data purging
   - Audit trails

2. **Anonymization**
   - PII detection
   - Data anonymization
   - Privacy compliance

## Troubleshooting

### Common Issues

1. **High Memory Usage**
   - Check cache size configuration
   - Monitor memory leaks
   - Implement cleanup procedures

2. **Slow Performance**
   - Analyze query performance
   - Check index usage
   - Review cache hit rates

3. **WebSocket Connection Issues**
   - Verify network connectivity
   - Check authentication
   - Monitor connection limits

### Debug Commands

```typescript
// Enable debug logging
process.env.DEBUG = 'memory:*'

// Check service health
const health = await performanceService.getCurrentMetrics()

// Run diagnostics
const testResults = await testRunner.runAllTests()

// Export system state
const state = {
  metrics: performanceService.getCurrentMetrics(),
  recommendations: performanceService.getOptimizationRecommendations(),
  patterns: patternService.getDetectedPatterns()
}
```

## Contributing

### Development Setup

1. Clone repository
2. Install dependencies: `npm install`
3. Configure environment variables
4. Run database migrations
5. Start development server: `npm run dev`

### Testing Guidelines

1. Write tests for new features
2. Maintain test coverage above 80%
3. Run full test suite before commits
4. Include performance tests for optimizations

### Code Style

- Follow TypeScript strict mode
- Use meaningful variable names
- Document public APIs
- Follow established patterns

## Changelog

### v1.0.0 (Current)
- Initial release with complete memory system
- Semantic search implementation
- Pattern recognition capabilities
- Performance optimization
- Comprehensive testing suite
- Production monitoring

### Future Roadmap

- Advanced AI model integration
- Multi-agent collaboration
- Federated learning capabilities
- Enhanced pattern recognition
- Real-time strategy adaptation