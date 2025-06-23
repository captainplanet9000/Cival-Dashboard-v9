# Shadcn UI Expansions for Trading

A comprehensive collection of enhanced UI components specifically designed for trading applications, built on top of shadcn/ui with additional functionality for financial data visualization and interaction.

## 🚀 Features

- **14 Premium Components** - Specialized for trading dashboards
- **TypeScript First** - Full type safety and IntelliSense support
- **Trading Optimized** - Components designed for financial data
- **Fully Responsive** - Works across all device sizes
- **Accessible** - Built with WAI-ARIA compliance
- **Customizable** - Easy to theme and extend
- **Copy & Paste** - No additional dependencies required

## 📦 Components Overview

### Trading-Specific Components

#### TradingSymbolSelector
Advanced multi-select component for trading symbols with real-time price data.

**Features:**
- Real-time price updates
- Symbol categorization (stocks, crypto, forex, etc.)
- Search with debouncing
- Watchlist mode
- Market data integration

```tsx
<TradingSymbolSelector
  value={selectedSymbols}
  onChange={setSelectedSymbols}
  placeholder="Search trading symbols..."
  maxSelected={10}
  watchlistMode={true}
/>
```

#### TradingDateTimeRange
Specialized date-time range picker with trading session presets.

**Features:**
- Quick presets (Last Hour, Today, Week, Month, etc.)
- Market hours validation
- Trading session analytics
- Range duration calculations

```tsx
<TradingDateTimeRange
  startDate={startDate}
  endDate={endDate}
  onRangeChange={(start, end) => setRange([start, end])}
  showPresets={true}
  showAnalytics={true}
/>
```

#### PriceRangeSlider
Dual-range slider for price selection with trading-specific features.

**Features:**
- Current price indicators
- Preset risk ranges (Conservative, Moderate, Aggressive)
- Trading statistics
- Currency formatting
- Position analysis

```tsx
<PriceRangeSlider
  value={[100, 200]}
  onValueChange={setPriceRange}
  currentPrice={175.25}
  symbol="AAPL"
  showPresets={true}
  showStats={true}
/>
```

#### TradingNotes
Comprehensive note-taking system for trading insights.

**Features:**
- Categorization (Trade, Analysis, Strategy, Market)
- Priority levels and tagging
- Search and filtering
- Auto-save functionality
- Symbol association

```tsx
<TradingNotes
  symbol="AAPL"
  onSave={handleNoteSave}
  showHistory={true}
  maxLength={2000}
/>
```

### Core Expansion Components

#### MultipleSelector
Enhanced multi-select with advanced features.

**Features:**
- Async search with debouncing
- Grouping and categorization
- Creatable options
- Fixed options support
- Custom loading/empty indicators

```tsx
<MultipleSelector
  value={selected}
  onChange={setSelected}
  onSearch={handleAsyncSearch}
  placeholder="Select options..."
  groupBy="category"
  creatable={true}
/>
```

#### DualRangeSlider
Range slider with custom labeling and positioning.

**Features:**
- Custom label formatting
- Top/bottom label positioning
- Precise value control
- Responsive design

```tsx
<DualRangeSlider
  value={[20, 80]}
  onValueChange={setRange}
  label={(value) => `${value}%`}
  labelPosition="bottom"
/>
```

#### DateTimePicker
Advanced date and time picker with granular control.

**Features:**
- Multiple granularities (day, hour, minute, second)
- 12/24 hour formats
- Year range customization
- Keyboard navigation
- Locale support

```tsx
<DateTimePicker
  value={dateTime}
  onChange={setDateTime}
  granularity="minute"
  hourCycle={24}
  yearRange={10}
/>
```

#### LoadingButton
Button with built-in loading state management.

**Features:**
- Automatic loading state
- Custom loading text
- Disabled state handling
- Spinner animation

```tsx
<LoadingButton
  loading={isLoading}
  loadingText="Processing..."
  onClick={handleAction}
>
  Submit Order
</LoadingButton>
```

#### InfiniteScroll
Infinite scrolling container with performance optimization.

**Features:**
- Customizable threshold
- Loading states
- End message handling
- Performance optimized

```tsx
<InfiniteScroll
  hasMore={hasMore}
  isLoading={loading}
  onLoadMore={loadMore}
  threshold={100}
>
  {items.map(item => <Item key={item.id} {...item} />)}
</InfiniteScroll>
```

#### AutosizeTextarea
Self-adjusting textarea with min/max height control.

**Features:**
- Automatic height adjustment
- Min/max height constraints
- Character counting
- Keyboard shortcuts

```tsx
<AutosizeTextarea
  placeholder="Enter your notes..."
  minHeight={60}
  maxHeight={200}
  maxLength={1000}
/>
```

#### FloatingLabelInput
Input with animated floating label.

**Features:**
- Smooth label animation
- Focus state management
- Value state detection
- Customizable styling

```tsx
<FloatingLabelInput
  id="email"
  label="Email Address"
  type="email"
/>
```

#### ProgressWithValue
Enhanced progress bar with value display.

**Features:**
- Multiple value positions (top, center, right)
- Custom value formatting
- Animated transitions
- Color customization

```tsx
<ProgressWithValue
  value={progress}
  showValue={true}
  valuePosition="right"
  formatValue={(val) => `${val}% Complete`}
/>
```

#### ResponsiveModal
Adaptive modal (Dialog on desktop, Drawer on mobile).

**Features:**
- Automatic responsive behavior
- Custom breakpoint support
- Consistent API across devices
- Smooth transitions

```tsx
<ResponsiveModal
  trigger={<Button>Open</Button>}
  title="Modal Title"
  breakpoint={768}
>
  <ModalContent />
</ResponsiveModal>
```

#### Typewriter
Animated text with typewriter effect.

**Features:**
- Multiple text sequences
- Customizable speed and delay
- Loop functionality
- Cursor animation
- Event callbacks

```tsx
<Typewriter
  text={["Welcome", "To Trading", "Dashboard"]}
  speed={50}
  loop={true}
  cursor={true}
/>
```

## 🛠️ Installation

### Method 1: Copy & Paste (Recommended)

1. Copy the component files from `/src/components/expansions/`
2. Ensure you have the required dependencies:

```bash
npm install @radix-ui/react-slider @radix-ui/react-progress date-fns
```

### Method 2: Import from Module

```tsx
import {
  TradingSymbolSelector,
  TradingDateTimeRange,
  PriceRangeSlider,
  TradingNotes,
  MultipleSelector,
  // ... other components
} from "@/components/expansions";
```

## 📋 Prerequisites

Ensure you have the following shadcn/ui components installed:

```bash
npx shadcn-ui@latest add button card input label select badge
npx shadcn-ui@latest add command popover separator sheet dialog
npx shadcn-ui@latest add drawer tabs tooltip scroll-area calendar
```

## 🎨 Customization

All components inherit shadcn/ui theming and can be customized via:

1. **CSS Variables** - Modify theme colors
2. **Component Props** - Use className and style props
3. **Component Variants** - Extend with custom variants
4. **Theme Provider** - Global theme configuration

### Example Theme Customization

```css
/* Custom trading theme colors */
:root {
  --trading-bull: 22 163 74;  /* Green for bullish */
  --trading-bear: 239 68 68;  /* Red for bearish */
  --trading-neutral: 107 114 128; /* Gray for neutral */
}

.trading-positive {
  color: hsl(var(--trading-bull));
}

.trading-negative {
  color: hsl(var(--trading-bear));
}
```

## 🔧 Advanced Usage

### Custom Symbol Search

```tsx
const customSymbolSearch = async (query: string): Promise<TradingSymbol[]> => {
  const response = await fetch(`/api/symbols/search?q=${query}`);
  return response.json();
};

<TradingSymbolSelector
  onSearch={customSymbolSearch}
  // ... other props
/>
```

### Integration with Trading APIs

```tsx
const TradingDashboard = () => {
  const [symbols, setSymbols] = useState<TradingSymbol[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [dateRange, setDateRange] = useState<[Date?, Date?]>([undefined, undefined]);

  // Real-time price updates
  useEffect(() => {
    const ws = new WebSocket('wss://api.trading.com/live-prices');
    ws.onmessage = (event) => {
      const priceUpdate = JSON.parse(event.data);
      updateSymbolPrices(priceUpdate);
    };
    return () => ws.close();
  }, []);

  return (
    <div className="space-y-6">
      <TradingSymbolSelector
        value={symbols}
        onChange={setSymbols}
        watchlistMode={true}
      />
      
      <PriceRangeSlider
        value={priceRange}
        onValueChange={setPriceRange}
        currentPrice={symbols[0]?.price}
        symbol={symbols[0]?.symbol}
      />
      
      <TradingDateTimeRange
        startDate={dateRange[0]}
        endDate={dateRange[1]}
        onRangeChange={(start, end) => setDateRange([start, end])}
      />
    </div>
  );
};
```

## 📊 Performance Considerations

- **Virtualization** - InfiniteScroll uses efficient rendering
- **Debouncing** - Search components include built-in debouncing
- **Memoization** - Components use React.memo where appropriate
- **Code Splitting** - Import only components you need

## 🧪 Testing

Components are designed to be testable with standard React testing utilities:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { TradingSymbolSelector } from '@/components/expansions';

test('trading symbol selector works', () => {
  const mockOnChange = jest.fn();
  
  render(
    <TradingSymbolSelector
      onChange={mockOnChange}
      placeholder="Search symbols..."
    />
  );
  
  const input = screen.getByPlaceholderText('Search symbols...');
  fireEvent.change(input, { target: { value: 'AAPL' } });
  
  // Assert expected behavior
});
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Add comprehensive tests
4. Update documentation
5. Submit a pull request

## 📝 License

MIT License - feel free to use in your projects.

## 🔗 Related

- [shadcn/ui](https://ui.shadcn.com/) - Base component library
- [Radix UI](https://www.radix-ui.com/) - Primitive components
- [Tailwind CSS](https://tailwindcss.com/) - Styling framework

---

**Built for traders, by traders.** 📈