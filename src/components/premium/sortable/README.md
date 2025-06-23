# Trading Dashboard Sortable Components

A comprehensive library of drag-and-drop sortable components specifically designed for trading dashboards. Built on top of `@dnd-kit` with advanced features for financial applications.

## 🚀 Features

### Core Functionality
- **Smooth Drag & Drop**: Powered by `@dnd-kit` with custom trading-focused enhancements
- **Touch Support**: Works seamlessly on mobile and tablet devices
- **Keyboard Navigation**: Full accessibility support with keyboard controls
- **Performance Optimized**: Virtualization support for large lists (1000+ items)

### Trading-Specific Features
- **Priority Indicators**: Visual priority levels (high, medium, low) with color coding
- **Risk Level Badges**: Risk assessment indicators (low, medium, high, critical)
- **Real-time Updates**: Live P&L, price changes, and portfolio metrics
- **Multi-Select Operations**: Bulk actions on selected items
- **Persistent Ordering**: Automatic save/restore of user preferences

### Advanced Capabilities
- **API Integration**: Built-in persistence to backend services
- **Performance Monitoring**: Track drag operations and optimize for large datasets
- **Custom Animations**: Smooth transitions with configurable animation presets
- **Error Handling**: Robust error recovery and offline support

## 📦 Components

### Core Components

#### `SortableContainer<T>`
Base container component for all sortable lists.

```tsx
import { SortableContainer } from '@/components/premium/sortable';

<SortableContainer
  items={items}
  onItemsReorder={handleReorder}
  orientation="vertical"
  options={{
    enableMultiSelect: true,
    enablePriorityIndicators: true,
    maxItems: 50,
  }}
>
  {(item, index) => <ItemComponent item={item} />}
</SortableContainer>
```

#### `SortableItem`
Individual sortable item wrapper.

```tsx
import { SortableItem } from '@/components/premium/sortable';

<SortableItem id={item.id} handle={true}>
  <div>Your item content</div>
</SortableItem>
```

### Trading Components

#### `WatchlistSortable`
Specialized component for managing trading symbol watchlists.

```tsx
import { WatchlistSortable } from '@/components/premium/sortable';

<WatchlistSortable
  items={watchlistItems}
  onItemsChange={setWatchlistItems}
  onAddSymbol={() => addNewSymbol()}
  onRemoveSymbol={(symbol) => removeSymbol(symbol)}
  onToggleAlert={(symbol) => toggleAlert(symbol)}
  onViewChart={(symbol) => openChart(symbol)}
/>
```

**Features:**
- Real-time price updates
- Change percentage indicators
- Volume and market cap display
- Alert management
- Quick actions (view chart, remove, add alert)

#### `PortfolioSortable`
Advanced component for portfolio position management.

```tsx
import { PortfolioSortable } from '@/components/premium/sortable';

<PortfolioSortable
  positions={portfolioPositions}
  onPositionsChange={setPositions}
  totalPortfolioValue={totalValue}
  onRebalance={() => rebalancePortfolio()}
  onClosePosition={(symbol) => closePosition(symbol)}
  onAdjustPosition={(symbol) => adjustPosition(symbol)}
/>
```

**Features:**
- Unrealized P&L tracking
- Portfolio weight visualization
- Risk level indicators
- Position management actions
- Performance metrics

#### `StrategySortable`
Component for managing trading strategy execution order.

```tsx
import { StrategySortable } from '@/components/premium/sortable';

<StrategySortable
  strategies={strategies}
  onStrategiesChange={setStrategies}
  onCreateStrategy={() => createNewStrategy()}
  onStartStrategy={(id) => startStrategy(id)}
  onPauseStrategy={(id) => pauseStrategy(id)}
  onStopStrategy={(id) => stopStrategy(id)}
/>
```

**Features:**
- Execution order management
- Strategy status controls (start/pause/stop)
- Performance metrics (win rate, Sharpe ratio, drawdown)
- Resource allocation tracking
- Strategy configuration

## 🛠️ Installation & Setup

### Dependencies
The components require these peer dependencies:

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

### Usage
Import components from the sortable library:

```tsx
import {
  WatchlistSortable,
  PortfolioSortable,
  StrategySortable,
  SortableContainer,
  SortableItem,
} from '@/components/premium/sortable';
```

### TypeScript Support
Full TypeScript support with comprehensive type definitions:

```tsx
import type {
  WatchlistItem,
  PortfolioPosition,
  TradingStrategy,
  TradingSortableOptions,
} from '@/components/premium/sortable';
```

## ⚙️ Configuration

### Options Interface
```tsx
interface TradingSortableOptions {
  enableMultiSelect?: boolean;      // Enable multi-item selection
  enableGrouping?: boolean;         // Enable item grouping
  enablePriorityIndicators?: boolean; // Show priority badges
  enableRiskIndicators?: boolean;   // Show risk level indicators
  maxItems?: number;               // Maximum items in list
  animationDuration?: number;      // Animation duration in ms
  persistOrder?: boolean;          // Save order to backend
  onOrderPersist?: (items: SortableItem[]) => Promise<void>;
}
```

### Default Configuration
```tsx
const DEFAULT_TRADING_OPTIONS: TradingSortableOptions = {
  enableMultiSelect: false,
  enableGrouping: false,
  enablePriorityIndicators: true,
  enableRiskIndicators: true,
  maxItems: 100,
  animationDuration: 200,
  persistOrder: true,
};
```

## 🎨 Styling & Theming

### CSS Classes
The components use predefined CSS classes for consistent styling:

```css
.sortable-item              /* Base item styles */
.sortable-item--dragging    /* Dragging state */
.sortable-item--over        /* Drop target state */
.sortable-handle           /* Drag handle */
.trading-priority-high     /* High priority indicator */
.trading-priority-medium   /* Medium priority indicator */
.trading-priority-low      /* Low priority indicator */
.trading-profit           /* Profit indicator */
.trading-loss            /* Loss indicator */
```

### Animation Presets
Choose from predefined animation configurations:

```tsx
import { ANIMATION_PRESETS } from '@/components/premium/sortable/utils/animations';

// Available presets: 'smooth', 'snappy', 'minimal', 'dramatic'
const animationConfig = ANIMATION_PRESETS.smooth;
```

## 📡 API Integration

### Persistence Hooks
Built-in hooks for backend integration:

```tsx
import { useSortablePersistence } from '@/components/premium/sortable/utils/apiIntegration';

const { saveOrder, loadOrder } = useSortablePersistence(
  items,
  'watchlist', // 'watchlist' | 'portfolio' | 'strategies'
  setItems
);
```

### Manual API Calls
Direct API integration:

```tsx
import { sortableApi, SortablePersistence } from '@/components/premium/sortable/utils/apiIntegration';

// Save watchlist order
await SortablePersistence.saveWatchlistOrder(watchlistItems);

// Load portfolio order
const orderedPositions = await SortablePersistence.loadPortfolioOrder(positions);
```

## 🚄 Performance Optimization

### Virtualization
For large lists (50+ items), enable virtualization:

```tsx
import { useVirtualizedSortable } from '@/components/premium/sortable/hooks/useVirtualizedSortable';

const {
  virtualizer,
  visibleItems,
  containerRef,
  isVirtualized
} = useVirtualizedSortable(items, {
  containerHeight: 400,
  itemHeight: 80,
  enabled: items.length > 50,
});
```

### Performance Monitoring
Track performance metrics:

```tsx
import { useSortableMetrics } from '@/components/premium/sortable/hooks/useVirtualizedSortable';

const { metrics, trackDragStart, trackDragEnd } = useSortableMetrics(items);
```

### Debounced Updates
Optimize frequent updates:

```tsx
import { useDebouncedSortable } from '@/components/premium/sortable/hooks/useVirtualizedSortable';

const { items: debouncedItems, updateItems } = useDebouncedSortable(
  items,
  setItems,
  150 // debounce delay in ms
);
```

## 🔧 Advanced Usage

### Custom Render Functions
Create custom item renderers:

```tsx
<SortableContainer
  items={items}
  onItemsReorder={handleReorder}
  renderOverlay={(item) => (
    <div className="custom-overlay">
      Dragging {item.name}
    </div>
  )}
>
  {(item, index) => (
    <CustomItemComponent
      item={item}
      index={index}
      onCustomAction={handleCustomAction}
    />
  )}
</SortableContainer>
```

### Event Handlers
Handle sortable events:

```tsx
<SortableContainer
  items={items}
  onItemsReorder={handleReorder}
  eventHandlers={{
    onDragStart: (item) => console.log('Drag started:', item),
    onDragEnd: (item) => console.log('Drag ended:', item),
    onItemClick: (item) => selectItem(item),
    onItemDoubleClick: (item) => editItem(item),
    onBulkAction: (items, action) => performBulkAction(items, action),
  }}
>
  {renderItem}
</SortableContainer>
```

### Multi-Select Operations
Enable bulk operations:

```tsx
const options: TradingSortableOptions = {
  enableMultiSelect: true,
};

// Handle bulk actions
const handleBulkAction = (selectedItems: SortableItem[], action: string) => {
  switch (action) {
    case 'delete':
      deleteMultipleItems(selectedItems);
      break;
    case 'setPriority':
      setMultiplePriorities(selectedItems, 'high');
      break;
  }
};
```

## 🧪 Testing

### Demo Component
Use the included demo component for testing:

```tsx
import { SortableDemo } from '@/components/premium/sortable/SortableDemo';

<SortableDemo />
```

### Mock Data
Mock data generators are available for testing:

```tsx
// Check SortableDemo.tsx for example mock data
const mockWatchlistData: WatchlistItem[] = [...];
const mockPortfolioData: PortfolioPosition[] = [...];
const mockStrategyData: TradingStrategy[] = [...];
```

## 🔍 Troubleshooting

### Common Issues

1. **Items not dragging**: Ensure `id` property is unique for each item
2. **Performance issues**: Enable virtualization for large lists
3. **API persistence failing**: Check network connectivity and API endpoints
4. **Styling conflicts**: Use CSS specificity or custom class names

### Debug Mode
Enable debug logging:

```tsx
// Set in development environment
window.SORTABLE_DEBUG = true;
```

## 📋 Type Definitions

### Core Types
```tsx
interface SortableItem {
  id: UniqueIdentifier;
  disabled?: boolean;
}

interface WatchlistItem extends SortableItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  priority?: 'high' | 'medium' | 'low';
  alerts?: number;
}

interface PortfolioPosition extends SortableItem {
  symbol: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  weight: number;
  priority?: 'high' | 'medium' | 'low';
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
}

interface TradingStrategy extends SortableItem {
  name: string;
  type: 'momentum' | 'mean-reversion' | 'arbitrage' | 'market-making' | 'custom';
  status: 'active' | 'paused' | 'stopped' | 'error';
  executionOrder: number;
  allocatedCapital: number;
  currentPnL: number;
  winRate: number;
  sharpeRatio: number;
  maxDrawdown: number;
  lastExecuted: Date;
  priority?: 'high' | 'medium' | 'low';
}
```

## 🤝 Contributing

### Development Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`
4. Run tests: `npm test`

### Code Style
- Use TypeScript for all new code
- Follow existing naming conventions
- Add JSDoc comments for public APIs
- Include unit tests for new features

## 📄 License

This component library is part of the Cival Trading Dashboard and is proprietary software. See the main project license for details.

---

## 🎯 Use Cases

### Watchlist Management
- Reorder symbols by importance
- Quick access to price changes
- Alert management
- Portfolio integration

### Portfolio Optimization
- Prioritize positions by risk/return
- Visual weight management
- P&L tracking
- Rebalancing workflows

### Strategy Orchestration
- Execution order optimization
- Resource allocation
- Performance monitoring
- Risk management

Built with ❤️ for the modern trading experience.