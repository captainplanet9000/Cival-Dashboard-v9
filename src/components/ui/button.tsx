import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-blue-600 text-white hover:bg-blue-700 border border-blue-700 shadow-md",
        destructive:
          "bg-red-600 text-white hover:bg-red-700 border border-red-700 shadow-md",
        outline:
          "border-2 border-gray-300 bg-white text-gray-900 hover:bg-gray-50 hover:border-gray-400 shadow-sm",
        secondary:
          "bg-gray-600 text-white hover:bg-gray-700 border border-gray-700 shadow-md",
        ghost: "text-gray-900 hover:bg-gray-100 hover:text-gray-900 border border-transparent hover:border-gray-200",
        link: "text-blue-600 underline-offset-4 hover:underline hover:text-blue-700",
        // Trading-specific variants with high contrast
        buy: "bg-green-600 text-white hover:bg-green-700 border border-green-700 shadow-md focus:ring-green-500",
        sell: "bg-red-600 text-white hover:bg-red-700 border border-red-700 shadow-md focus:ring-red-500",
        // Agent-specific variants
        agent: "bg-purple-600 text-white hover:bg-purple-700 border border-purple-700 shadow-md",
        warning: "bg-orange-600 text-white hover:bg-orange-700 border border-orange-700 shadow-md",
        success: "bg-green-600 text-white hover:bg-green-700 border border-green-700 shadow-md",
        info: "bg-cyan-600 text-white hover:bg-cyan-700 border border-cyan-700 shadow-md",
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