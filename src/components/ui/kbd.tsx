import React from 'react'
import { cn } from '@/lib/utils'

interface KbdProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode
}

export function Kbd({ children, className, ...props }: KbdProps) {
  return (
    <kbd
      className={cn(
        'inline-flex items-center gap-1 rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-xs font-mono text-gray-600 shadow-sm',
        className
      )}
      {...props}
    >
      {children}
    </kbd>
  )
}

export { Kbd as default }