"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface FloatingLabelInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
}

const FloatingLabelInput = React.forwardRef<HTMLInputElement, FloatingLabelInputProps>(
  ({ className, label, id, type = "text", ...props }, ref) => {
    const [focused, setFocused] = React.useState(false);
    const [hasValue, setHasValue] = React.useState(false);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setFocused(true);
      props.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setFocused(false);
      setHasValue(e.target.value !== "");
      props.onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(e.target.value !== "");
      props.onChange?.(e);
    };

    React.useEffect(() => {
      if (props.value || props.defaultValue) {
        setHasValue(true);
      }
    }, [props.value, props.defaultValue]);

    return (
      <div className="relative">
        <input
          ref={ref}
          id={id}
          type={type}
          className={cn(
            "peer block w-full appearance-none rounded-md border border-input bg-background px-3 pb-2.5 pt-5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-0",
            "placeholder-transparent",
            className
          )}
          placeholder=" "
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          {...props}
        />
        <label
          htmlFor={id}
          className={cn(
            "absolute left-3 top-4 z-10 origin-[0] -translate-y-2 scale-75 transform text-sm text-muted-foreground duration-300",
            "peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100",
            "peer-focus:-translate-y-2 peer-focus:scale-75 peer-focus:text-primary",
            (focused || hasValue) && "-translate-y-2 scale-75 text-primary"
          )}
        >
          {label}
        </label>
      </div>
    );
  }
);

FloatingLabelInput.displayName = "FloatingLabelInput";

export { FloatingLabelInput };