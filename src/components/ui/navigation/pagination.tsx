"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Enhanced Pagination Component like Ant Design

export interface PaginationProps {
  current?: number
  total: number
  pageSize?: number
  pageSizeOptions?: number[]
  showSizeChanger?: boolean
  showQuickJumper?: boolean
  showTotal?: (total: number, range: [number, number]) => React.ReactNode
  simple?: boolean
  size?: 'small' | 'default' | 'large'
  disabled?: boolean
  hideOnSinglePage?: boolean
  responsive?: boolean
  showLessItems?: boolean
  onChange?: (page: number, pageSize: number) => void
  onShowSizeChange?: (current: number, size: number) => void
  className?: string
}

const Pagination: React.FC<PaginationProps> = ({
  current = 1,
  total,
  pageSize = 10,
  pageSizeOptions = [10, 20, 50, 100],
  showSizeChanger = false,
  showQuickJumper = false,
  showTotal,
  simple = false,
  size = 'default',
  disabled = false,
  hideOnSinglePage = false,
  responsive = true,
  showLessItems = false,
  onChange,
  onShowSizeChange,
  className
}) => {
  const [jumpPage, setJumpPage] = React.useState('')
  
  const totalPages = Math.ceil(total / pageSize)
  const startItem = (current - 1) * pageSize + 1
  const endItem = Math.min(current * pageSize, total)

  if (hideOnSinglePage && totalPages <= 1) {
    return null
  }

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === current || disabled) return
    onChange?.(page, pageSize)
  }

  const handlePageSizeChange = (newPageSize: number) => {
    const newPage = Math.min(current, Math.ceil(total / newPageSize))
    onShowSizeChange?.(newPage, newPageSize)
    onChange?.(newPage, newPageSize)
  }

  const handleQuickJump = () => {
    const page = parseInt(jumpPage)
    if (page >= 1 && page <= totalPages && page !== current) {
      handlePageChange(page)
      setJumpPage('')
    }
  }

  const sizeClasses = {
    small: {
      button: "h-8 px-2 text-sm",
      input: "h-8 w-12 text-sm",
      select: "h-8 text-sm"
    },
    default: {
      button: "h-9 px-3 text-sm",
      input: "h-9 w-16 text-sm",
      select: "h-9 text-sm"
    },
    large: {
      button: "h-10 px-4 text-base",
      input: "h-10 w-20 text-base",
      select: "h-10 text-base"
    }
  }

  const generatePageNumbers = () => {
    const pages: (number | 'ellipsis')[] = []
    const maxVisible = showLessItems ? 5 : 7
    const sidePages = Math.floor((maxVisible - 3) / 2)

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      pages.push(1)

      let start = Math.max(2, current - sidePages)
      let end = Math.min(totalPages - 1, current + sidePages)

      if (current - 1 <= sidePages) {
        end = maxVisible - 1
      }
      if (totalPages - current <= sidePages) {
        start = totalPages - maxVisible + 2
      }

      if (start > 2) {
        pages.push('ellipsis')
      }

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      if (end < totalPages - 1) {
        pages.push('ellipsis')
      }

      if (totalPages > 1) {
        pages.push(totalPages)
      }
    }

    return pages
  }

  if (simple) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Button
          variant="outline"
          size={size === 'default' ? 'default' : size}
          onClick={() => handlePageChange(current - 1)}
          disabled={current <= 1 || disabled}
          className={sizeClasses[size].button}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <span className="px-2 text-sm">
          {current} / {totalPages}
        </span>
        
        <Button
          variant="outline"
          size={size === 'default' ? 'default' : size}
          onClick={() => handlePageChange(current + 1)}
          disabled={current >= totalPages || disabled}
          className={sizeClasses[size].button}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className={cn("flex items-center gap-2 flex-wrap", className)}>
      {/* Total Info */}
      {showTotal && (
        <div className="text-sm text-gray-600 mr-4">
          {showTotal(total, [startItem, endItem])}
        </div>
      )}

      {/* Page Size Changer */}
      {showSizeChanger && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Show</span>
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => handlePageSizeChange(parseInt(value))}
            disabled={disabled}
          >
            <SelectTrigger className={cn("w-20", sizeClasses[size].select)}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map(option => (
                <SelectItem key={option} value={option.toString()}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-gray-600">per page</span>
        </div>
      )}

      {/* Previous Button */}
      <Button
        variant="outline"
        size={size === 'default' ? 'default' : size}
        onClick={() => handlePageChange(current - 1)}
        disabled={current <= 1 || disabled}
        className={sizeClasses[size].button}
      >
        <ChevronLeft className="h-4 w-4" />
        {!responsive && <span className="ml-1">Previous</span>}
      </Button>

      {/* Page Numbers */}
      <div className="flex items-center gap-1">
        {generatePageNumbers().map((page, index) => {
          if (page === 'ellipsis') {
            return (
              <div key={`ellipsis-${index}`} className="px-2">
                <MoreHorizontal className="h-4 w-4 text-gray-400" />
              </div>
            )
          }

          return (
            <Button
              key={page}
              variant={page === current ? "default" : "outline"}
              size={size === 'default' ? 'default' : size}
              onClick={() => handlePageChange(page)}
              disabled={disabled}
              className={cn(
                sizeClasses[size].button,
                page === current && "bg-blue-600 text-white border-blue-600"
              )}
            >
              {page}
            </Button>
          )
        })}
      </div>

      {/* Next Button */}
      <Button
        variant="outline"
        size={size === 'default' ? 'default' : size}
        onClick={() => handlePageChange(current + 1)}
        disabled={current >= totalPages || disabled}
        className={sizeClasses[size].button}
      >
        {!responsive && <span className="mr-1">Next</span>}
        <ChevronRight className="h-4 w-4" />
      </Button>

      {/* Quick Jumper */}
      {showQuickJumper && (
        <div className="flex items-center gap-2 ml-4">
          <span className="text-sm text-gray-600">Go to</span>
          <Input
            type="number"
            min="1"
            max={totalPages}
            value={jumpPage}
            onChange={(e) => setJumpPage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleQuickJump()}
            disabled={disabled}
            className={sizeClasses[size].input}
            placeholder="Page"
          />
          <Button
            variant="outline"
            size={size === 'default' ? 'default' : size}
            onClick={handleQuickJump}
            disabled={disabled}
            className={sizeClasses[size].button}
          >
            Go
          </Button>
        </div>
      )}
    </div>
  )
}

export { Pagination }