# Cival Dashboard - Frontend Development Guidelines

## 🎨 Frontend Architecture Overview

**Framework:** Next.js 15 with App Router  
**Language:** TypeScript 5.0+  
**Styling:** Tailwind CSS 3.4  
**Component Library:** Shadcn/UI  
**State Management:** Zustand + React Context  
**Real-time:** Socket.IO Client  

## 📁 Frontend Directory Structure

```
src/
├── app/                              # Next.js App Router pages
│   ├── layout.tsx                    # Root layout with providers
│   ├── page.tsx                      # Home page (redirects to dashboard)
│   ├── dashboard/                    # Main dashboard routes
│   │   ├── page.tsx                  # Dashboard overview
│   │   └── loading.tsx               # Loading UI
│   ├── trading/                      # Trading interface routes
│   │   ├── page.tsx
│   │   └── [symbol]/page.tsx         # Symbol-specific trading
│   ├── agents/                       # Agent management routes
│   │   ├── page.tsx
│   │   ├── [id]/page.tsx             # Individual agent details
│   │   └── create/page.tsx           # Agent creation
│   ├── analytics/                    # Analytics dashboard
│   │   ├── page.tsx
│   │   └── [timeframe]/page.tsx      # Time-specific analytics
│   ├── api/                          # API routes (middleware)
│   │   ├── health/route.ts           # Health check endpoint
│   │   └── websocket/route.ts        # WebSocket upgrade handler
│   └── globals.css                   # Global styles
├── components/                       # React components organized by domain
│   ├── ui/                          # Base UI components (Shadcn/UI)
│   │   ├── button.tsx               # Enhanced button with variants
│   │   ├── card.tsx                 # Card component
│   │   ├── dialog.tsx               # Modal dialogs
│   │   ├── skeleton.tsx             # Loading skeletons
│   │   ├── badge.tsx                # Status badges
│   │   ├── progress.tsx             # Progress bars
│   │   ├── select.tsx               # Dropdown selects
│   │   ├── input.tsx                # Form inputs
│   │   ├── label.tsx                # Form labels
│   │   ├── alert.tsx                # Alert messages
│   │   └── scroll-area.tsx          # Scrollable areas
│   ├── dashboard/                   # Dashboard-specific components
│   │   ├── EnhancedDashboard.tsx    # Main dashboard layout
│   │   ├── PortfolioSummary.tsx     # Portfolio overview
│   │   ├── QuickActions.tsx         # Quick action buttons
│   │   └── SystemStatus.tsx         # System health indicators
│   ├── trading/                     # Trading interface components
│   │   ├── TradingInterface.tsx     # Main trading UI
│   │   ├── OrderBook.tsx            # Live order book
│   │   ├── PriceChart.tsx           # Trading charts
│   │   ├── OrderForm.tsx            # Order placement form
│   │   └── PositionManager.tsx      # Position management
│   ├── agent/                       # AI agent components
│   │   ├── AgentCard.tsx            # Individual agent display
│   │   ├── AgentCreator.tsx         # Agent creation form
│   │   ├── AgentPerformance.tsx     # Performance metrics
│   │   ├── DecisionLog.tsx          # Decision history
│   │   └── ProductionAgentDecisionLog.tsx # Real-time decision log
│   ├── portfolio/                   # Portfolio components
│   │   ├── PortfolioOverview.tsx    # Portfolio summary
│   │   ├── PositionsList.tsx        # Current positions
│   │   ├── PerformanceChart.tsx     # Performance visualization
│   │   └── AssetAllocation.tsx      # Asset allocation pie chart
│   ├── charts/                      # Chart components
│   │   ├── TradingChart.tsx         # Advanced trading charts
│   │   ├── PerformanceChart.tsx     # Performance line charts
│   │   ├── PieChart.tsx             # Asset allocation charts
│   │   └── Candlestick.tsx          # Candlestick charts
│   ├── real-time-dashboard/         # Real-time monitoring
│   │   ├── LiveDataFeed.tsx         # Real-time data stream
│   │   ├── AgentStatusMonitor.tsx   # Agent activity monitor
│   │   ├── MarketDataStream.tsx     # Live market data
│   │   └── AlertSystem.tsx          # Real-time alerts
│   ├── file-manager/                # File management
│   │   ├── FileManagerDropzone.tsx  # Supabase file upload
│   │   ├── FileList.tsx             # File browser
│   │   └── FilePreview.tsx          # File preview modal
│   ├── calendar/                    # Calendar components
│   │   ├── CalendarView.tsx         # Main calendar interface
│   │   ├── PerformanceCalendar.tsx  # Performance tracking
│   │   └── EventScheduler.tsx       # Event scheduling
│   ├── analytics/                   # Analytics components
│   │   ├── AnalyticsDashboard.tsx   # Analytics overview
│   │   ├── MetricsDisplay.tsx       # Key metrics display
│   │   ├── ComparisonChart.tsx      # Comparison visualizations
│   │   └── ReportGenerator.tsx      # Report generation
│   └── layout/                      # Layout components
│       ├── Navigation.tsx           # Main navigation
│       ├── Sidebar.tsx              # Collapsible sidebar
│       ├── Header.tsx               # Page headers
│       └── Footer.tsx               # Footer component
├── lib/                             # Utility libraries and configurations
│   ├── api/                         # API integration
│   │   ├── backend-client.ts        # Complete backend API client
│   │   ├── market-data.ts           # Market data API wrapper
│   │   └── websocket-client.ts      # WebSocket client
│   ├── supabase/                    # Supabase integration
│   │   ├── client.ts                # Supabase client setup
│   │   ├── types.ts                 # Database type definitions
│   │   └── helpers.ts               # Database helper functions
│   ├── paper-trading/               # Paper trading engine
│   │   ├── PaperTradingEngine.ts    # Main engine
│   │   └── types.ts                 # Trading type definitions
│   ├── websocket/                   # Real-time communication
│   │   ├── ag-ui-client.ts          # AG-UI Protocol v2 client
│   │   ├── event-handlers.ts        # WebSocket event handlers
│   │   └── connection-manager.ts    # Connection management
│   ├── performance/                 # Performance optimization
│   │   ├── optimization.tsx         # React optimization utilities
│   │   ├── lazy-loading.ts          # Lazy loading helpers
│   │   └── caching.ts               # Client-side caching
│   ├── utils/                       # General utilities
│   │   ├── cn.ts                    # Classname utility
│   │   ├── formatters.ts            # Data formatting functions
│   │   ├── validators.ts            # Input validation
│   │   └── constants.ts             # Application constants
│   └── hooks/                       # Custom React hooks
│       ├── useWebSocket.ts          # WebSocket connection hook
│       ├── useApi.ts                # API request hook
│       ├── useLocalStorage.ts       # Local storage hook
│       └── useDebounce.ts           # Debouncing hook
├── types/                           # TypeScript type definitions
│   ├── database.types.ts            # Generated Supabase types
│   ├── api.types.ts                 # API response types
│   ├── agent.types.ts               # Agent-related types
│   ├── trading.types.ts             # Trading data types
│   └── websocket.types.ts           # WebSocket message types
└── styles/                          # Styling and theme files
    ├── globals.css                  # Global CSS with Tailwind
    ├── components.css               # Component-specific styles
    └── themes/                      # Theme configurations
        ├── dark.css                 # Dark theme variables
        └── light.css                # Light theme variables
```

## 🎨 Design System & Component Guidelines

### **Color Palette & Variants**
```css
/* Enhanced color system for better contrast */
:root {
  /* Primary colors */
  --primary: 220 90% 50%;           /* Blue */
  --primary-foreground: 0 0% 100%;
  
  /* Agent-specific colors */
  --agent: 270 90% 60%;             /* Purple */
  --agent-foreground: 0 0% 100%;
  
  /* Trading colors */
  --buy: 120 50% 45%;               /* Green */
  --sell: 0 65% 50%;                /* Red */
  --warning: 45 95% 55%;            /* Orange */
  --success: 120 60% 40%;           /* Green */
  --info: 200 90% 50%;              /* Blue */
  
  /* High contrast variants */
  --button-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  --border-contrast: 220 20% 80%;
}
```

### **Button Component Enhancement**
```typescript
// components/ui/button.tsx
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-blue-600 text-white hover:bg-blue-700 border border-blue-700 shadow-md",
        destructive: "bg-red-600 text-white hover:bg-red-700 border border-red-700 shadow-md",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        // Trading-specific variants
        buy: "bg-green-600 text-white hover:bg-green-700 border border-green-700 shadow-md",
        sell: "bg-red-600 text-white hover:bg-red-700 border border-red-700 shadow-md",
        agent: "bg-purple-600 text-white hover:bg-purple-700 border border-purple-700 shadow-md",
        warning: "bg-orange-600 text-white hover:bg-orange-700 border border-orange-700 shadow-md",
        success: "bg-green-600 text-white hover:bg-green-700 border border-green-700 shadow-md",
        info: "bg-blue-600 text-white hover:bg-blue-700 border border-blue-700 shadow-md",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

### **Enhanced Card Component**
```typescript
// components/ui/card.tsx with better separation
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow",
      className
    )}
    {...props}
  />
))

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6 border-b border-gray-100", className)}
    {...props}
  />
))

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
```

## 🔗 State Management Patterns

### **Zustand Store Structure**
```typescript
// lib/stores/trading-store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface TradingState {
  // Portfolio state
  portfolio: Portfolio | null
  positions: Position[]
  
  // Market data
  marketData: Record<string, MarketData>
  watchlist: string[]
  
  // Real-time connections
  isConnected: boolean
  lastUpdate: string
  
  // Actions
  setPortfolio: (portfolio: Portfolio) => void
  updateMarketData: (symbol: string, data: MarketData) => void
  addToWatchlist: (symbol: string) => void
  setConnectionStatus: (connected: boolean) => void
}

export const useTradingStore = create<TradingState>()(
  persist(
    (set, get) => ({
      portfolio: null,
      positions: [],
      marketData: {},
      watchlist: ['BTC', 'ETH', 'AAPL', 'GOOGL'],
      isConnected: false,
      lastUpdate: '',
      
      setPortfolio: (portfolio) => set({ portfolio }),
      
      updateMarketData: (symbol, data) => set((state) => ({
        marketData: { ...state.marketData, [symbol]: data },
        lastUpdate: new Date().toISOString()
      })),
      
      addToWatchlist: (symbol) => set((state) => ({
        watchlist: [...state.watchlist, symbol]
      })),
      
      setConnectionStatus: (connected) => set({ isConnected: connected })
    }),
    {
      name: 'trading-store',
      partialize: (state) => ({ watchlist: state.watchlist })
    }
  )
)
```

### **Agent State Management**
```typescript
// lib/stores/agent-store.ts
interface AgentState {
  agents: Agent[]
  activeAgent: Agent | null
  decisions: AgentDecision[]
  
  // Agent control
  startAgent: (agentId: string) => Promise<void>
  stopAgent: (agentId: string) => Promise<void>
  triggerDecision: (agentId: string) => Promise<void>
  
  // Decision management
  addDecision: (decision: AgentDecision) => void
  clearDecisions: () => void
}

export const useAgentStore = create<AgentState>((set, get) => ({
  agents: [],
  activeAgent: null,
  decisions: [],
  
  startAgent: async (agentId) => {
    try {
      const response = await backendApi.post(`/api/v1/agents/${agentId}/start`)
      if (response.data) {
        set((state) => ({
          agents: state.agents.map(agent => 
            agent.id === agentId ? { ...agent, status: 'active' } : agent
          )
        }))
      }
    } catch (error) {
      console.error('Failed to start agent:', error)
    }
  },
  
  addDecision: (decision) => set((state) => ({
    decisions: [decision, ...state.decisions].slice(0, 100) // Keep last 100 decisions
  }))
}))
```

## 🔄 Real-Time Communication

### **WebSocket Integration**
```typescript
// lib/websocket/ag-ui-client.ts
import io, { Socket } from 'socket.io-client'

export class AGUIClient {
  private socket: Socket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  
  constructor(private config: {
    url: string
    channels: string[]
  }) {}
  
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = io(this.config.url, {
        transports: ['websocket'],
        upgrade: true,
        rememberUpgrade: true
      })
      
      this.socket.on('connect', () => {
        console.log('WebSocket connected')
        this.reconnectAttempts = 0
        
        // Subscribe to configured channels
        this.config.channels.forEach(channel => {
          this.socket?.emit('subscribe', { channel })
        })
        
        resolve()
      })
      
      this.socket.on('disconnect', () => {
        console.log('WebSocket disconnected')
        this.handleReconnect()
      })
      
      this.socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error)
        reject(error)
      })
      
      // Handle AG-UI Protocol messages
      this.socket.on('agent_decision', this.handleAgentDecision.bind(this))
      this.socket.on('portfolio_update', this.handlePortfolioUpdate.bind(this))
      this.socket.on('market_data', this.handleMarketData.bind(this))
    })
  }
  
  private handleAgentDecision(data: AgentDecision) {
    // Update agent store with new decision
    useAgentStore.getState().addDecision(data)
    
    // Show toast notification for important decisions
    if (data.actionTaken) {
      toast.success(`Agent ${data.agentName} executed ${data.decisionType}`)
    }
  }
  
  private handlePortfolioUpdate(data: Portfolio) {
    // Update trading store with new portfolio data
    useTradingStore.getState().setPortfolio(data)
  }
  
  private handleMarketData(data: { symbol: string; price: number; timestamp: string }) {
    // Update market data in trading store
    useTradingStore.getState().updateMarketData(data.symbol, {
      price: data.price,
      timestamp: data.timestamp
    })
  }
}
```

### **Custom WebSocket Hook**
```typescript
// lib/hooks/useWebSocket.ts
import { useEffect, useRef, useState } from 'react'
import { AGUIClient } from '@/lib/websocket/ag-ui-client'

export function useWebSocket(url: string, channels: string[] = []) {
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const clientRef = useRef<AGUIClient | null>(null)
  
  useEffect(() => {
    const client = new AGUIClient({ url, channels })
    clientRef.current = client
    
    client.connect()
      .then(() => {
        setIsConnected(true)
        setError(null)
      })
      .catch((err) => {
        setError(err.message)
        setIsConnected(false)
      })
    
    return () => {
      client.disconnect()
      setIsConnected(false)
    }
  }, [url, channels.join(',')])
  
  return { isConnected, error, client: clientRef.current }
}
```

## 📱 Responsive Design Guidelines

### **Breakpoint Strategy**
```css
/* Mobile-first responsive design */
/* Base styles: Mobile (0px - 639px) */
.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

/* Small tablets (640px+) */
@media (min-width: 640px) {
  .dashboard-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Tablets (768px+) */
@media (min-width: 768px) {
  .dashboard-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 1.5rem;
  }
}

/* Desktops (1024px+) */
@media (min-width: 1024px) {
  .dashboard-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 2rem;
  }
}

/* Large desktops (1280px+) */
@media (min-width: 1280px) {
  .dashboard-grid {
    grid-template-columns: repeat(5, 1fr);
  }
}
```

### **Component Responsive Patterns**
```typescript
// Responsive component example
export function ResponsiveChart({ data }: { data: ChartData[] }) {
  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    const checkIsMobile = () => setIsMobile(window.innerWidth < 768)
    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
    return () => window.removeEventListener('resize', checkIsMobile)
  }, [])
  
  return (
    <div className="w-full h-64 md:h-96 lg:h-[500px]">
      <Chart
        data={data}
        height={isMobile ? 256 : 384}
        showTooltip={!isMobile}
        responsive
      />
    </div>
  )
}
```

## 🚀 Performance Optimization

### **Code Splitting & Lazy Loading**
```typescript
// Dynamic imports for better performance
import { lazy, Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

// Lazy load heavy components
const TradingChart = lazy(() => import('@/components/charts/TradingChart'))
const AnalyticsDashboard = lazy(() => import('@/components/analytics/AnalyticsDashboard'))

// Usage with fallback
export function DashboardWithLazyLoading() {
  return (
    <div className="grid gap-6">
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <TradingChart symbol="BTC" />
      </Suspense>
      
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <AnalyticsDashboard />
      </Suspense>
    </div>
  )
}
```

### **Memoization Patterns**
```typescript
// React optimization utilities
import { memo, useMemo, useCallback } from 'react'

// Memoized component for expensive renders
export const AgentCard = memo(({ agent }: { agent: Agent }) => {
  const performanceMetrics = useMemo(() => {
    return calculateAgentMetrics(agent.tradeHistory)
  }, [agent.tradeHistory])
  
  const handleStart = useCallback(() => {
    startAgent(agent.id)
  }, [agent.id])
  
  return (
    <Card>
      <CardHeader>
        <h3>{agent.name}</h3>
        <Badge variant={agent.status === 'active' ? 'success' : 'secondary'}>
          {agent.status}
        </Badge>
      </CardHeader>
      <CardContent>
        <div>PnL: {formatCurrency(performanceMetrics.totalPnl)}</div>
        <Button onClick={handleStart} variant="agent">
          Start Agent
        </Button>
      </CardContent>
    </Card>
  )
})
```

### **Caching Strategy**
```typescript
// Client-side caching for API responses
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function usePortfolioData() {
  return useQuery({
    queryKey: ['portfolio'],
    queryFn: () => backendApi.get('/api/v1/portfolio/summary'),
    staleTime: 30000, // 30 seconds
    cacheTime: 300000, // 5 minutes
    refetchOnWindowFocus: false
  })
}

export function useAgentMutation() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (agentData: CreateAgentRequest) => 
      backendApi.post('/api/v1/agents', agentData),
    onSuccess: () => {
      // Invalidate and refetch agents list
      queryClient.invalidateQueries({ queryKey: ['agents'] })
    }
  })
}
```

## 🧪 Testing Guidelines

### **Component Testing**
```typescript
// Example component test
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '@/components/ui/button'

describe('Button Component', () => {
  test('renders with correct variant styles', () => {
    render(<Button variant="agent">Start Agent</Button>)
    
    const button = screen.getByRole('button', { name: /start agent/i })
    expect(button).toHaveClass('bg-purple-600')
  })
  
  test('calls onClick handler when clicked', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

### **Integration Testing**
```typescript
// Integration test for agent workflow
import { render, screen, waitFor } from '@testing-library/react'
import { AgentDashboard } from '@/components/agent/AgentDashboard'
import { mockAgent } from '../__mocks__/agent'

describe('Agent Dashboard Integration', () => {
  test('displays agent status and allows starting agent', async () => {
    render(<AgentDashboard />)
    
    // Wait for agents to load
    await waitFor(() => {
      expect(screen.getByText(mockAgent.name)).toBeInTheDocument()
    })
    
    // Click start button
    const startButton = screen.getByRole('button', { name: /start agent/i })
    fireEvent.click(startButton)
    
    // Verify status change
    await waitFor(() => {
      expect(screen.getByText('active')).toBeInTheDocument()
    })
  })
})
```

## 📋 Code Quality Standards

### **TypeScript Guidelines**
```typescript
// Strong typing for all components
interface ComponentProps {
  // Use specific types instead of 'any'
  data: MarketData[]
  onUpdate: (symbol: string, price: number) => void
  
  // Optional props with defaults
  refreshInterval?: number
  showTooltips?: boolean
}

// Proper error handling
type ApiResponse<T> = {
  data: T
  error?: string
  status: 'success' | 'error' | 'loading'
}

// Use discriminated unions for better type safety
type AgentStatus = 
  | { type: 'idle' }
  | { type: 'processing'; progress: number }
  | { type: 'error'; message: string }
  | { type: 'complete'; result: TradeResult }
```

### **Accessibility Guidelines**
```typescript
// Accessible component example
export function AccessibleButton({ 
  children, 
  onClick, 
  disabled = false,
  ariaLabel,
  ...props 
}: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-disabled={disabled}
      className={cn(
        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      {...props}
    >
      {children}
    </button>
  )
}
```

---

**Document Version:** 1.0  
**Last Updated:** December 2025  
**Maintained By:** Cival Development Team