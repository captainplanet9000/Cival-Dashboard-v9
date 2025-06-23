"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

interface DualRangeSliderProps extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  labelPosition?: "top" | "bottom";
  label?: (value: number | undefined) => React.ReactNode;
}

const DualRangeSlider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  DualRangeSliderProps
>(({ className, labelPosition = "top", label, ...props }, ref) => {
  const initialValue = Array.isArray(props.value) ? props.value : [props.min || 0, props.max || 100];

  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn("relative flex w-full touch-none select-none items-center", className)}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-primary/20">
        <SliderPrimitive.Range className="absolute h-full bg-primary" />
      </SliderPrimitive.Track>
      {initialValue.map((value, index) => (
        <React.Fragment key={index}>
          <div
            className="absolute text-center"
            style={{
              left: `calc(${((value - (props.min || 0)) / ((props.max || 100) - (props.min || 0))) * 100}% + 0px)`,
              top: labelPosition === "top" ? "-20px" : "20px",
            }}
          >
            {label ? (
              <span className="text-sm text-muted-foreground">{label(value)}</span>
            ) : (
              <span className="text-sm text-muted-foreground">{value}</span>
            )}
          </div>
          <SliderPrimitive.Thumb className="block h-4 w-4 rounded-full border border-primary/50 bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50" />
        </React.Fragment>
      ))}
    </SliderPrimitive.Root>
  );
});

DualRangeSlider.displayName = "DualRangeSlider";

export { DualRangeSlider };