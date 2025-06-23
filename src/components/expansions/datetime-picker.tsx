"use client";

import * as React from "react";
import { CalendarIcon, Clock } from "lucide-react";
import { format, isValid, parse, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DateTimePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  disabled?: boolean;
  /** @default "PPP HH:mm:ss" */
  displayFormat?: { hour24?: string; hour12?: string };
  placeholder?: string;
  /** @default "day" */
  granularity?: "day" | "hour" | "minute" | "second";
  /** @default 24 */
  hourCycle?: 12 | 24;
  /** @default 50 */
  yearRange?: number;
  defaultPopupValue?: Date;
}

function DateTimePicker({
  value,
  onChange,
  disabled,
  displayFormat,
  placeholder = "Pick a date and time",
  granularity = "minute",
  hourCycle = 24,
  yearRange = 50,
  defaultPopupValue,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [date, setDate] = React.useState<Date | undefined>(value);
  const [month, setMonth] = React.useState<Date>(
    value || defaultPopupValue || new Date()
  );

  const displayFormatStr = React.useMemo(() => {
    if (displayFormat) {
      return hourCycle === 24 ? displayFormat.hour24 : displayFormat.hour12;
    }

    if (granularity === "day") return "PPP";
    if (granularity === "hour") return hourCycle === 24 ? "PPP HH:00" : "PPP h:00 a";
    if (granularity === "minute") return hourCycle === 24 ? "PPP HH:mm" : "PPP h:mm a";
    if (granularity === "second") return hourCycle === 24 ? "PPP HH:mm:ss" : "PPP h:mm:ss a";

    return "PPP";
  }, [displayFormat, granularity, hourCycle]);

  const yearFrom = new Date().getFullYear() - yearRange;
  const yearTo = new Date().getFullYear() + yearRange;

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) return;

    const newDate = date ? new Date(date) : new Date();
    newDate.setFullYear(selectedDate.getFullYear());
    newDate.setMonth(selectedDate.getMonth());
    newDate.setDate(selectedDate.getDate());

    setDate(newDate);
    onChange?.(newDate);
    setMonth(selectedDate);
  };

  const handleTimeChange = (
    type: "hour" | "minute" | "second" | "ampm",
    timeValue: string
  ) => {
    if (!date) {
      const now = new Date();
      const newDate = new Date(now);
      
      if (type === "hour") {
        const hour24 = hourCycle === 12 
          ? (timeValue === "12" ? 0 : parseInt(timeValue)) + (format(now, "a") === "PM" ? 12 : 0)
          : parseInt(timeValue);
        newDate.setHours(hour24);
      } else if (type === "minute") {
        newDate.setMinutes(parseInt(timeValue));
      } else if (type === "second") {
        newDate.setSeconds(parseInt(timeValue));
      } else if (type === "ampm") {
        const currentHour = newDate.getHours();
        if (timeValue === "AM" && currentHour >= 12) {
          newDate.setHours(currentHour - 12);
        } else if (timeValue === "PM" && currentHour < 12) {
          newDate.setHours(currentHour + 12);
        }
      }
      
      setDate(newDate);
      onChange?.(newDate);
      return;
    }

    const newDate = new Date(date);
    
    if (type === "hour") {
      if (hourCycle === 12) {
        const isPM = format(date, "a") === "PM";
        let hour24 = parseInt(timeValue);
        if (timeValue === "12") {
          hour24 = isPM ? 12 : 0;
        } else if (isPM) {
          hour24 += 12;
        }
        newDate.setHours(hour24);
      } else {
        newDate.setHours(parseInt(timeValue));
      }
    } else if (type === "minute") {
      newDate.setMinutes(parseInt(timeValue));
    } else if (type === "second") {
      newDate.setSeconds(parseInt(timeValue));
    } else if (type === "ampm") {
      const currentHour = newDate.getHours();
      if (timeValue === "AM" && currentHour >= 12) {
        newDate.setHours(currentHour - 12);
      } else if (timeValue === "PM" && currentHour < 12) {
        newDate.setHours(currentHour + 12);
      }
    }

    setDate(newDate);
    onChange?.(newDate);
  };

  const hours = hourCycle === 24 
    ? Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"))
    : Array.from({ length: 12 }, (_, i) => (i + 1).toString());

  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"));
  const seconds = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"));

  React.useEffect(() => {
    setDate(value);
    if (value) {
      setMonth(value);
    }
  }, [value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, displayFormatStr) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex">
          <div className="border-r">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateSelect}
              month={month}
              onMonthChange={setMonth}
              fromYear={yearFrom}
              toYear={yearTo}
              disabled={disabled}
              initialFocus
            />
          </div>
          {granularity !== "day" && (
            <div className="p-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <Label>Time</Label>
              </div>
              <div className="mt-2 flex gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Hour</Label>
                  <Select
                    value={date ? format(date, hourCycle === 24 ? "HH" : "h") : ""}
                    onValueChange={(value) => handleTimeChange("hour", value)}
                  >
                    <SelectTrigger className="w-16">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <ScrollArea className="h-40">
                        {hours.map((hour) => (
                          <SelectItem key={hour} value={hour}>
                            {hour}
                          </SelectItem>
                        ))}
                      </ScrollArea>
                    </SelectContent>
                  </Select>
                </div>
                
                {granularity !== "hour" && (
                  <div className="space-y-1">
                    <Label className="text-xs">Min</Label>
                    <Select
                      value={date ? format(date, "mm") : ""}
                      onValueChange={(value) => handleTimeChange("minute", value)}
                    >
                      <SelectTrigger className="w-16">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <ScrollArea className="h-40">
                          {minutes.map((minute) => (
                            <SelectItem key={minute} value={minute}>
                              {minute}
                            </SelectItem>
                          ))}
                        </ScrollArea>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {granularity === "second" && (
                  <div className="space-y-1">
                    <Label className="text-xs">Sec</Label>
                    <Select
                      value={date ? format(date, "ss") : ""}
                      onValueChange={(value) => handleTimeChange("second", value)}
                    >
                      <SelectTrigger className="w-16">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <ScrollArea className="h-40">
                          {seconds.map((second) => (
                            <SelectItem key={second} value={second}>
                              {second}
                            </SelectItem>
                          ))}
                        </ScrollArea>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {hourCycle === 12 && (
                  <div className="space-y-1">
                    <Label className="text-xs">AM/PM</Label>
                    <Select
                      value={date ? format(date, "a") : ""}
                      onValueChange={(value) => handleTimeChange("ampm", value)}
                    >
                      <SelectTrigger className="w-16">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AM">AM</SelectItem>
                        <SelectItem value="PM">PM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export { DateTimePicker };