"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

interface ProgressWithValueProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  value?: number;
  max?: number;
  showValue?: boolean;
  valuePosition?: "center" | "right" | "top";
  formatValue?: (value: number, max: number) => string;
  indicatorClassName?: string;
}

const ProgressWithValue = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressWithValueProps
>(({ 
  className, 
  value = 0, 
  max = 100, 
  showValue = true,
  valuePosition = "right",
  formatValue,
  indicatorClassName,
  ...props 
}, ref) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  const defaultFormatValue = (val: number, maxVal: number) => {
    return `${Math.round(val)}%`;
  };

  const displayValue = formatValue ? formatValue(percentage, 100) : defaultFormatValue(percentage, 100);

  return (
    <div className="w-full space-y-1">
      {showValue && valuePosition === "top" && (
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium">{displayValue}</span>
        </div>
      )}
      
      <div className="relative flex items-center">
        <ProgressPrimitive.Root
          ref={ref}
          className={cn(
            "relative h-2 w-full overflow-hidden rounded-full bg-primary/20",
            valuePosition === "right" && showValue && "mr-12",
            className
          )}
          {...props}
        >
          <ProgressPrimitive.Indicator
            className={cn(
              "h-full w-full flex-1 bg-primary transition-all",
              indicatorClassName
            )}
            style={{ transform: `translateX(-${100 - percentage}%)` }}
          />
          
          {showValue && valuePosition === "center" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-medium text-primary-foreground mix-blend-difference">
                {displayValue}
              </span>
            </div>
          )}
        </ProgressPrimitive.Root>
        
        {showValue && valuePosition === "right" && (
          <div className="ml-3 min-w-0">
            <span className="text-sm font-medium">{displayValue}</span>
          </div>
        )}
      </div>
    </div>
  );
});

ProgressWithValue.displayName = "ProgressWithValue";

export { ProgressWithValue };