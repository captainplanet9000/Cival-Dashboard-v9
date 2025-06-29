"use client"

import * as React from "react"
import { CheckCircle, XCircle, AlertTriangle, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

// Enhanced Result Component like Ant Design

export interface ResultProps {
  status?: 'success' | 'error' | 'info' | 'warning' | '404' | '403' | '500'
  title?: React.ReactNode
  subTitle?: React.ReactNode
  icon?: React.ReactNode
  extra?: React.ReactNode
  className?: string
}

const Result: React.FC<ResultProps> = ({
  status = 'info',
  title,
  subTitle,
  icon,
  extra,
  className
}) => {
  const getStatusConfig = () => {
    const configs = {
      success: {
        icon: <CheckCircle className="h-16 w-16" />,
        color: "text-green-500",
        title: "Success",
        subTitle: "The operation completed successfully."
      },
      error: {
        icon: <XCircle className="h-16 w-16" />,
        color: "text-red-500",
        title: "Error",
        subTitle: "Something went wrong. Please try again."
      },
      warning: {
        icon: <AlertTriangle className="h-16 w-16" />,
        color: "text-yellow-500",
        title: "Warning",
        subTitle: "There are some issues that need attention."
      },
      info: {
        icon: <Info className="h-16 w-16" />,
        color: "text-blue-500",
        title: "Information",
        subTitle: "Here's some important information."
      },
      '404': {
        icon: <span className="text-6xl font-bold">404</span>,
        color: "text-gray-400",
        title: "404",
        subTitle: "Sorry, the page you visited does not exist."
      },
      '403': {
        icon: <span className="text-6xl font-bold">403</span>,
        color: "text-gray-400",
        title: "403",
        subTitle: "Sorry, you are not authorized to access this page."
      },
      '500': {
        icon: <span className="text-6xl font-bold">500</span>,
        color: "text-gray-400",
        title: "500",
        subTitle: "Sorry, something went wrong on the server."
      }
    }

    return configs[status] || configs.info
  }

  const config = getStatusConfig()

  return (
    <div className={cn(
      "flex flex-col items-center justify-center text-center py-12 px-4",
      className
    )}>
      {/* Icon */}
      <div className={cn("mb-6", config.color)}>
        {icon || config.icon}
      </div>

      {/* Title */}
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        {title || config.title}
      </h3>

      {/* Subtitle */}
      {(subTitle || config.subTitle) && (
        <p className="text-gray-600 mb-6 max-w-md">
          {subTitle || config.subTitle}
        </p>
      )}

      {/* Extra content */}
      {extra && (
        <div className="space-y-2">
          {extra}
        </div>
      )}
    </div>
  )
}

export { Result }