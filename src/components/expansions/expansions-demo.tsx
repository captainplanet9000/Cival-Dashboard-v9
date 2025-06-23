"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  TradingSymbolSelector, 
  TradingDateTimeRange, 
  PriceRangeSlider, 
  TradingNotes,
  MultipleSelector,
  DualRangeSlider,
  DateTimePicker,
  LoadingButton,
  InfiniteScroll,
  AutosizeTextarea,
  FloatingLabelInput,
  ProgressWithValue,
  ResponsiveModal,
  Typewriter,
  type TradingSymbol,
  type Option
} from "./index";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ExpansionsDemo = () => {
  // State for various components
  const [selectedSymbols, setSelectedSymbols] = React.useState<TradingSymbol[]>([]);
  const [startDate, setStartDate] = React.useState<Date>();
  const [endDate, setEndDate] = React.useState<Date>();
  const [priceRange, setPriceRange] = React.useState<[number, number]>([100, 200]);
  const [selectedOptions, setSelectedOptions] = React.useState<Option[]>([]);
  const [sliderValue, setSliderValue] = React.useState([20, 80]);
  const [dateTime, setDateTime] = React.useState<Date>();
  const [isLoading, setIsLoading] = React.useState(false);
  const [progress, setProgress] = React.useState(65);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [scrollItems, setScrollItems] = React.useState(Array.from({ length: 20 }, (_, i) => `Item ${i + 1}`));
  const [hasMore, setHasMore] = React.useState(true);
  const [scrollLoading, setScrollLoading] = React.useState(false);

  // Mock data for MultipleSelector
  const mockOptions: Option[] = [
    { value: "option1", label: "Option 1", group: "Group A" },
    { value: "option2", label: "Option 2", group: "Group A" },
    { value: "option3", label: "Option 3", group: "Group B" },
    { value: "option4", label: "Option 4", group: "Group B" },
    { value: "option5", label: "Option 5", group: "Group C" },
  ];

  const handleLoadMore = () => {
    setScrollLoading(true);
    
    setTimeout(() => {
      const newItems = Array.from(
        { length: 10 }, 
        (_, i) => `Item ${scrollItems.length + i + 1}`
      );
      
      setScrollItems(prev => [...prev, ...newItems]);
      setScrollLoading(false);
      
      if (scrollItems.length >= 80) {
        setHasMore(false);
      }
    }, 1000);
  };

  const handleLoadingAction = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  };

  const ComponentShowcase = ({ title, description, children, code }: {
    title: string;
    description: string;
    children: React.ReactNode;
    code?: string;
  }) => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {children}
          {code && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                View Code
              </summary>
              <pre className="mt-2 p-4 bg-muted rounded-md text-sm overflow-x-auto">
                <code>{code}</code>
              </pre>
            </details>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Shadcn UI Expansions for Trading</h1>
        <p className="text-muted-foreground">
          A comprehensive collection of enhanced UI components specifically designed for trading applications.
          Built on top of shadcn/ui with additional functionality for financial data visualization and interaction.
        </p>
        <div className="flex flex-wrap gap-2 mt-4">
          <Badge variant="secondary">14 Components</Badge>
          <Badge variant="secondary">Trading Optimized</Badge>
          <Badge variant="secondary">TypeScript</Badge>
          <Badge variant="secondary">Fully Responsive</Badge>
        </div>
      </div>

      <Tabs defaultValue="trading" className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="trading">Trading Components</TabsTrigger>
          <TabsTrigger value="core">Core Components</TabsTrigger>
          <TabsTrigger value="advanced">Advanced Features</TabsTrigger>
        </TabsList>

        <TabsContent value="trading" className="space-y-6">
          <ComponentShowcase
            title="Trading Symbol Selector"
            description="Advanced multi-select component for trading symbols with real-time price data, categorization, and search functionality."
            code={`<TradingSymbolSelector
  value={selectedSymbols}
  onChange={setSelectedSymbols}
  placeholder="Search trading symbols..."
  maxSelected={10}
  watchlistMode={true}
/>`}
          >
            <TradingSymbolSelector
              value={selectedSymbols}
              onChange={setSelectedSymbols}
              placeholder="Search trading symbols..."
              maxSelected={10}
              watchlistMode={true}
            />
          </ComponentShowcase>

          <ComponentShowcase
            title="Trading DateTime Range"
            description="Specialized date-time range picker with trading session presets, market hours validation, and analytics."
            code={`<TradingDateTimeRange
  startDate={startDate}
  endDate={endDate}
  onStartDateChange={setStartDate}
  onEndDateChange={setEndDate}
  showPresets={true}
  showAnalytics={true}
/>`}
          >
            <TradingDateTimeRange
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              showPresets={true}
              showAnalytics={true}
            />
          </ComponentShowcase>

          <ComponentShowcase
            title="Price Range Slider"
            description="Dual-range slider for price selection with current price indicators, preset ranges, and trading statistics."
            code={`<PriceRangeSlider
  value={priceRange}
  onValueChange={setPriceRange}
  min={50}
  max={300}
  currentPrice={175.25}
  symbol="AAPL"
  showPresets={true}
  showStats={true}
/>`}
          >
            <PriceRangeSlider
              value={priceRange}
              onValueChange={setPriceRange}
              min={50}
              max={300}
              currentPrice={175.25}
              symbol="AAPL"
              showPresets={true}
              showStats={true}
            />
          </ComponentShowcase>

          <ComponentShowcase
            title="Trading Notes"
            description="Comprehensive note-taking system with categorization, tagging, search, and filtering capabilities."
            code={`<TradingNotes
  symbol="AAPL"
  showHistory={true}
  autoSave={false}
  maxLength={2000}
/>`}
          >
            <TradingNotes
              symbol="AAPL"
              showHistory={true}
              autoSave={false}
              maxLength={2000}
            />
          </ComponentShowcase>
        </TabsContent>

        <TabsContent value="core" className="space-y-6">
          <ComponentShowcase
            title="Multiple Selector"
            description="Enhanced multi-select with async search, grouping, and creation capabilities."
            code={`<MultipleSelector
  value={selectedOptions}
  onChange={setSelectedOptions}
  options={mockOptions}
  placeholder="Select multiple options..."
  groupBy="group"
  creatable={true}
/>`}
          >
            <MultipleSelector
              value={selectedOptions}
              onChange={setSelectedOptions}
              options={mockOptions}
              placeholder="Select multiple options..."
              groupBy="group"
              creatable={true}
            />
          </ComponentShowcase>

          <ComponentShowcase
            title="Dual Range Slider"
            description="Range slider with custom labeling and positioning options."
            code={`<DualRangeSlider
  value={sliderValue}
  onValueChange={setSliderValue}
  min={0}
  max={100}
  label={(value) => \`\${value}%\`}
  labelPosition="bottom"
/>`}
          >
            <DualRangeSlider
              value={sliderValue}
              onValueChange={setSliderValue}
              min={0}
              max={100}
              label={(value) => `${value}%`}
              labelPosition="bottom"
            />
          </ComponentShowcase>

          <ComponentShowcase
            title="DateTime Picker"
            description="Advanced date and time picker with multiple granularities and time formats."
            code={`<DateTimePicker
  value={dateTime}
  onChange={setDateTime}
  placeholder="Select date and time"
  granularity="minute"
  hourCycle={24}
/>`}
          >
            <DateTimePicker
              value={dateTime}
              onChange={setDateTime}
              placeholder="Select date and time"
              granularity="minute"
              hourCycle={24}
            />
          </ComponentShowcase>

          <ComponentShowcase
            title="Loading Button"
            description="Button with built-in loading state and customizable loading text."
            code={`<LoadingButton
  loading={isLoading}
  loadingText="Processing..."
  onClick={handleLoadingAction}
>
  Click to Load
</LoadingButton>`}
          >
            <LoadingButton
              loading={isLoading}
              loadingText="Processing..."
              onClick={handleLoadingAction}
            >
              Click to Load
            </LoadingButton>
          </ComponentShowcase>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <ComponentShowcase
            title="Infinite Scroll"
            description="Infinite scrolling container with loading states and customizable thresholds."
            code={`<InfiniteScroll
  hasMore={hasMore}
  isLoading={scrollLoading}
  onLoadMore={handleLoadMore}
  threshold={100}
  className="h-64 border rounded-md p-4"
>
  {/* Scrollable content */}
</InfiniteScroll>`}
          >
            <InfiniteScroll
              hasMore={hasMore}
              isLoading={scrollLoading}
              onLoadMore={handleLoadMore}
              threshold={100}
              className="h-64 border rounded-md p-4"
            >
              <div className="space-y-2">
                {scrollItems.map((item, index) => (
                  <div key={index} className="p-2 bg-muted rounded">
                    {item}
                  </div>
                ))}
              </div>
            </InfiniteScroll>
          </ComponentShowcase>

          <ComponentShowcase
            title="Autosize Textarea"
            description="Textarea that automatically adjusts height based on content."
            code={`<AutosizeTextarea
  placeholder="Type your message..."
  minHeight={60}
  maxHeight={200}
/>`}
          >
            <AutosizeTextarea
              placeholder="Type your message..."
              minHeight={60}
              maxHeight={200}
            />
          </ComponentShowcase>

          <ComponentShowcase
            title="Floating Label Input"
            description="Input with animated floating label that moves based on focus and value state."
            code={`<FloatingLabelInput
  id="email"
  label="Email Address"
  type="email"
/>`}
          >
            <FloatingLabelInput
              id="email"
              label="Email Address"
              type="email"
            />
          </ComponentShowcase>

          <ComponentShowcase
            title="Progress with Value"
            description="Enhanced progress bar with value display and custom formatting."
            code={`<ProgressWithValue
  value={progress}
  max={100}
  showValue={true}
  valuePosition="right"
  formatValue={(val) => \`\${Math.round(val)}% Complete\`}
/>`}
          >
            <div className="space-y-4">
              <ProgressWithValue
                value={progress}
                max={100}
                showValue={true}
                valuePosition="right"
                formatValue={(val) => `${Math.round(val)}% Complete`}
              />
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setProgress(Math.max(0, progress - 10))}
                >
                  -10%
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setProgress(Math.min(100, progress + 10))}
                >
                  +10%
                </Button>
              </div>
            </div>
          </ComponentShowcase>

          <ComponentShowcase
            title="Responsive Modal"
            description="Modal that adapts to screen size - Dialog on desktop, Drawer on mobile."
            code={`<ResponsiveModal
  trigger={<Button>Open Modal</Button>}
  title="Responsive Modal"
  description="This modal adapts to screen size"
>
  <p>Content goes here...</p>
</ResponsiveModal>`}
          >
            <ResponsiveModal
              trigger={<Button>Open Modal</Button>}
              title="Responsive Modal"
              description="This modal adapts to screen size"
            >
              <div className="space-y-4">
                <p>This modal automatically switches between a dialog on desktop and a drawer on mobile devices.</p>
                <p>Try resizing your browser window to see the responsive behavior.</p>
              </div>
            </ResponsiveModal>
          </ComponentShowcase>

          <ComponentShowcase
            title="Typewriter Effect"
            description="Animated text that types out character by character with customizable speed and cursor."
            code={`<Typewriter
  text={["Welcome to Trading Dashboard", "Real-time Market Data", "Advanced Analytics"]}
  speed={50}
  loop={true}
  cursor={true}
/>`}
          >
            <div className="p-4 border rounded-lg bg-muted/50">
              <Typewriter
                text={["Welcome to Trading Dashboard", "Real-time Market Data", "Advanced Analytics"]}
                speed={50}
                loop={true}
                cursor={true}
                className="text-lg font-medium"
              />
            </div>
          </ComponentShowcase>
        </TabsContent>
      </Tabs>

      <Separator className="my-8" />

      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold">Integration Ready</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          All components are fully typed with TypeScript, follow shadcn/ui patterns, and are optimized for trading applications.
          Simply copy and paste into your project, or import from the expansions module.
        </p>
        <div className="flex justify-center gap-4">
          <Badge variant="outline" className="px-4 py-2">
            14 Components
          </Badge>
          <Badge variant="outline" className="px-4 py-2">
            TypeScript Support
          </Badge>
          <Badge variant="outline" className="px-4 py-2">
            Fully Accessible
          </Badge>
          <Badge variant="outline" className="px-4 py-2">
            Trading Optimized
          </Badge>
        </div>
      </div>
    </div>
  );
};

export default ExpansionsDemo;