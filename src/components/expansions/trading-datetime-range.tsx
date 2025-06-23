"use client";

import * as React from "react";
import { Calendar, Clock, BarChart3 } from "lucide-react";
import { DateTimePicker } from "./datetime-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { format, subDays, subHours, subMonths, subWeeks, startOfDay, endOfDay } from "date-fns";

interface TradingDateTimeRangeProps {
  startDate?: Date;
  endDate?: Date;
  onStartDateChange?: (date: Date | undefined) => void;
  onEndDateChange?: (date: Date | undefined) => void;
  onRangeChange?: (startDate: Date | undefined, endDate: Date | undefined) => void;
  disabled?: boolean;
  showPresets?: boolean;
  showAnalytics?: boolean;
  className?: string;
  maxRange?: number; // Maximum range in days
  minDate?: Date;
  maxDate?: Date;
}

interface PresetRange {
  label: string;
  value: string;
  getRange: () => [Date, Date];
  description: string;
}

const TradingDateTimeRange = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onRangeChange,
  disabled,
  showPresets = true,
  showAnalytics = false,
  className,
  maxRange,
  minDate,
  maxDate,
}: TradingDateTimeRangeProps) => {
  const [localStartDate, setLocalStartDate] = React.useState<Date | undefined>(startDate);
  const [localEndDate, setLocalEndDate] = React.useState<Date | undefined>(endDate);
  const [selectedPreset, setSelectedPreset] = React.useState<string>("");

  const presetRanges: PresetRange[] = [
    {
      label: "Last Hour",
      value: "1h",
      getRange: () => [subHours(new Date(), 1), new Date()],
      description: "Perfect for high-frequency trading analysis"
    },
    {
      label: "Today",
      value: "1d",
      getRange: () => [startOfDay(new Date()), endOfDay(new Date())],
      description: "Current trading session"
    },
    {
      label: "Last 7 Days",
      value: "7d",
      getRange: () => [subDays(new Date(), 7), new Date()],
      description: "Weekly trend analysis"
    },
    {
      label: "Last 30 Days",
      value: "30d",
      getRange: () => [subDays(new Date(), 30), new Date()],
      description: "Monthly performance review"
    },
    {
      label: "Last 3 Months",
      value: "3m",
      getRange: () => [subMonths(new Date(), 3), new Date()],
      description: "Quarterly trend analysis"
    },
    {
      label: "Year to Date",
      value: "ytd",
      getRange: () => [new Date(new Date().getFullYear(), 0, 1), new Date()],
      description: "Annual performance tracking"
    }
  ];

  React.useEffect(() => {
    setLocalStartDate(startDate);
    setLocalEndDate(endDate);
  }, [startDate, endDate]);

  const handleStartDateChange = (date: Date | undefined) => {
    setLocalStartDate(date);
    setSelectedPreset("");
    onStartDateChange?.(date);
    onRangeChange?.(date, localEndDate);
  };

  const handleEndDateChange = (date: Date | undefined) => {
    setLocalEndDate(date);
    setSelectedPreset("");
    onEndDateChange?.(date);
    onRangeChange?.(localStartDate, date);
  };

  const handlePresetSelect = (preset: PresetRange) => {
    const [start, end] = preset.getRange();
    setLocalStartDate(start);
    setLocalEndDate(end);
    setSelectedPreset(preset.value);
    onStartDateChange?.(start);
    onEndDateChange?.(end);
    onRangeChange?.(start, end);
  };

  const validateRange = (start: Date | undefined, end: Date | undefined): string[] => {
    const warnings: string[] = [];
    
    if (!start || !end) return warnings;
    
    if (start >= end) {
      warnings.push("Start date must be before end date");
    }
    
    if (maxRange) {
      const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays > maxRange) {
        warnings.push(`Date range cannot exceed ${maxRange} days`);
      }
    }
    
    if (minDate && start < minDate) {
      warnings.push(`Start date cannot be before ${format(minDate, "PPP")}`);
    }
    
    if (maxDate && end > maxDate) {
      warnings.push(`End date cannot be after ${format(maxDate, "PPP")}`);
    }
    
    return warnings;
  };

  const warnings = validateRange(localStartDate, localEndDate);
  const isValid = warnings.length === 0;

  const getRangeDuration = (): string => {
    if (!localStartDate || !localEndDate) return "";
    
    const diffMs = localEndDate.getTime() - localStartDate.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
    
    if (diffDays < 1) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} week${weeks !== 1 ? 's' : ''}`;
    } else {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months !== 1 ? 's' : ''}`;
    }
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <BarChart3 className="h-5 w-5" />
          Trading Time Range
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {showPresets && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Quick Presets</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {presetRanges.map((preset) => (
                <Button
                  key={preset.value}
                  variant={selectedPreset === preset.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePresetSelect(preset)}
                  disabled={disabled}
                  className="justify-start"
                  title={preset.description}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
            <Separator />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="text-sm font-medium">Start Date & Time</span>
            </div>
            <DateTimePicker
              value={localStartDate}
              onChange={handleStartDateChange}
              placeholder="Select start date"
              disabled={disabled}
              granularity="minute"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">End Date & Time</span>
            </div>
            <DateTimePicker
              value={localEndDate}
              onChange={handleEndDateChange}
              placeholder="Select end date"
              disabled={disabled}
              granularity="minute"
            />
          </div>
        </div>

        {/* Range Summary */}
        {localStartDate && localEndDate && isValid && (
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                {getRangeDuration()}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {format(localStartDate, "MMM d, HH:mm")} - {format(localEndDate, "MMM d, HH:mm")}
              </span>
            </div>
          </div>
        )}

        {/* Validation Warnings */}
        {warnings.length > 0 && (
          <div className="space-y-2">
            {warnings.map((warning, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                <span className="text-sm text-yellow-800">{warning}</span>
              </div>
            ))}
          </div>
        )}

        {/* Analytics Summary */}
        {showAnalytics && localStartDate && localEndDate && isValid && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t">
            <div className="text-center">
              <div className="text-lg font-semibold">
                {Math.ceil((localEndDate.getTime() - localStartDate.getTime()) / (1000 * 60 * 60 * 24))}
              </div>
              <div className="text-xs text-muted-foreground">Days</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">
                {Math.ceil((localEndDate.getTime() - localStartDate.getTime()) / (1000 * 60 * 60))}
              </div>
              <div className="text-xs text-muted-foreground">Hours</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">
                {localStartDate.getDay() === 0 || localStartDate.getDay() === 6 ? "Weekend" : "Weekday"}
              </div>
              <div className="text-xs text-muted-foreground">Start</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">
                {localEndDate.getHours() >= 9 && localEndDate.getHours() <= 16 ? "Market" : "Extended"}
              </div>
              <div className="text-xs text-muted-foreground">Hours</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export { TradingDateTimeRange };