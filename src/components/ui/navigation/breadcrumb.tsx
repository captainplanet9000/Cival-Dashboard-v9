"use client"

import * as React from "react"
import { ChevronRight, Home } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

// Enhanced Breadcrumb Component like Ant Design

export interface BreadcrumbItem {
  title: string
  href?: string
  icon?: React.ReactNode
  dropdownItems?: BreadcrumbItem[]
  onClick?: () => void
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[]
  separator?: React.ReactNode
  className?: string
  showHome?: boolean
  homeHref?: string
  itemRender?: (item: BreadcrumbItem, index: number, items: BreadcrumbItem[]) => React.ReactNode
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  separator = <ChevronRight className="h-4 w-4" />,
  className,
  showHome = true,
  homeHref = "/",
  itemRender
}) => {
  const allItems = showHome 
    ? [{ title: "Home", href: homeHref, icon: <Home className="h-4 w-4" /> }, ...items]
    : items

  const renderItem = (item: BreadcrumbItem, index: number) => {
    if (itemRender) {
      return itemRender(item, index, allItems)
    }

    const isLast = index === allItems.length - 1
    const content = (
      <span className={cn(
        "flex items-center gap-1",
        isLast ? "text-gray-900 font-medium" : "text-gray-500 hover:text-gray-700",
        item.href && !isLast && "cursor-pointer transition-colors"
      )}>
        {item.icon}
        {item.title}
      </span>
    )

    if (item.href && !isLast) {
      return (
        <Link href={item.href} className="hover:text-blue-600 transition-colors">
          {content}
        </Link>
      )
    }

    if (item.onClick && !isLast) {
      return (
        <button 
          onClick={item.onClick}
          className="hover:text-blue-600 transition-colors"
        >
          {content}
        </button>
      )
    }

    return content
  }

  return (
    <nav className={cn("flex items-center space-x-2 text-sm", className)}>
      {allItems.map((item, index) => (
        <React.Fragment key={index}>
          {renderItem(item, index)}
          {index < allItems.length - 1 && (
            <span className="text-gray-400">{separator}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  )
}

export { Breadcrumb }