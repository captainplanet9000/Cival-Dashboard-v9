"use client"

import * as React from "react"
import { ChevronDown, ChevronUp, ArrowUpDown, Search, Filter, Download, RefreshCw, Settings, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"

// Enhanced Table with sorting, filtering, pagination, and actions like PrimeReact/Ant Design

export interface TableColumn<T = any> {
  key: string
  title: string
  dataIndex?: string
  width?: number | string
  minWidth?: number
  maxWidth?: number
  sortable?: boolean
  filterable?: boolean
  searchable?: boolean
  fixed?: 'left' | 'right'
  align?: 'left' | 'center' | 'right'
  render?: (value: any, record: T, index: number) => React.ReactNode
  sorter?: (a: T, b: T) => number
  filters?: Array<{ text: string; value: any }>
  onFilter?: (value: any, record: T) => boolean
  className?: string
}

export interface TableProps<T = any> {
  columns: TableColumn<T>[]
  data: T[]
  loading?: boolean
  rowKey?: string | ((record: T) => string)
  pagination?: {
    current: number
    pageSize: number
    total: number
    showSizeChanger?: boolean
    showQuickJumper?: boolean
    onChange?: (page: number, pageSize: number) => void
  }
  rowSelection?: {
    type?: 'checkbox' | 'radio'
    selectedRowKeys?: React.Key[]
    onChange?: (selectedRowKeys: React.Key[], selectedRows: T[]) => void
    getCheckboxProps?: (record: T) => { disabled?: boolean }
  }
  onRow?: (record: T, index: number) => {
    onClick?: () => void
    onDoubleClick?: () => void
    onContextMenu?: () => void
  }
  scroll?: { x?: number | string; y?: number | string }
  size?: 'small' | 'middle' | 'large'
  bordered?: boolean
  showHeader?: boolean
  title?: () => React.ReactNode
  footer?: () => React.ReactNode
  expandable?: {
    expandedRowRender?: (record: T, index: number) => React.ReactNode
    rowExpandable?: (record: T) => boolean
  }
  className?: string
  actions?: {
    refresh?: () => void
    export?: () => void
    add?: () => void
    settings?: () => void
  }
}

const EnhancedTable = <T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  rowKey = 'id',
  pagination,
  rowSelection,
  onRow,
  scroll,
  size = 'middle',
  bordered = true,
  showHeader = true,
  title,
  footer,
  expandable,
  className,
  actions,
}: TableProps<T>) => {
  const [sortedData, setSortedData] = React.useState<T[]>(data)
  const [sortConfig, setSortConfig] = React.useState<{
    key: string
    direction: 'asc' | 'desc'
  } | null>(null)
  const [filters, setFilters] = React.useState<Record<string, any>>({})
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedRowKeys, setSelectedRowKeys] = React.useState<React.Key[]>(
    rowSelection?.selectedRowKeys || []
  )
  const [expandedRows, setExpandedRows] = React.useState<Set<React.Key>>(new Set())

  // Get row key
  const getRowKey = React.useCallback((record: T, index: number): React.Key => {
    if (typeof rowKey === 'function') {
      return rowKey(record)
    }
    return record[rowKey] || index
  }, [rowKey])

  // Handle sorting
  const handleSort = (column: TableColumn<T>) => {
    if (!column.sortable) return

    const key = column.dataIndex || column.key
    let direction: 'asc' | 'desc' = 'asc'

    if (sortConfig?.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }

    setSortConfig({ key, direction })

    const sorted = [...sortedData].sort((a, b) => {
      if (column.sorter) {
        return direction === 'asc' ? column.sorter(a, b) : column.sorter(b, a)
      }

      const aVal = a[key]
      const bVal = b[key]

      if (aVal < bVal) return direction === 'asc' ? -1 : 1
      if (aVal > bVal) return direction === 'asc' ? 1 : -1
      return 0
    })

    setSortedData(sorted)
  }

  // Handle row selection
  const handleRowSelect = (key: React.Key, selected: boolean) => {
    const newSelectedKeys = selected
      ? [...selectedRowKeys, key]
      : selectedRowKeys.filter(k => k !== key)
    
    setSelectedRowKeys(newSelectedKeys)
    
    if (rowSelection?.onChange) {
      const selectedRows = data.filter((record, index) => 
        newSelectedKeys.includes(getRowKey(record, index))
      )
      rowSelection.onChange(newSelectedKeys, selectedRows)
    }
  }

  // Handle select all
  const handleSelectAll = (selected: boolean) => {
    const newSelectedKeys = selected
      ? data.map((record, index) => getRowKey(record, index))
      : []
    
    setSelectedRowKeys(newSelectedKeys)
    
    if (rowSelection?.onChange) {
      const selectedRows = selected ? [...data] : []
      rowSelection.onChange(newSelectedKeys, selectedRows)
    }
  }

  // Handle row expansion
  const handleRowExpand = (key: React.Key) => {
    const newExpandedRows = new Set(expandedRows)
    if (expandedRows.has(key)) {
      newExpandedRows.delete(key)
    } else {
      newExpandedRows.add(key)
    }
    setExpandedRows(newExpandedRows)
  }

  // Filter and search data
  React.useEffect(() => {
    let filtered = [...data]

    // Apply search
    if (searchQuery) {
      const searchableColumns = columns.filter(col => col.searchable)
      filtered = filtered.filter(record =>
        searchableColumns.some(col => {
          const value = record[col.dataIndex || col.key]
          return String(value).toLowerCase().includes(searchQuery.toLowerCase())
        })
      )
    }

    // Apply filters
    Object.entries(filters).forEach(([key, filterValue]) => {
      if (filterValue !== undefined && filterValue !== null) {
        const column = columns.find(col => (col.dataIndex || col.key) === key)
        if (column?.onFilter) {
          filtered = filtered.filter(record => column.onFilter!(filterValue, record))
        }
      }
    })

    setSortedData(filtered)
  }, [data, searchQuery, filters, columns])

  const sizeClasses = {
    small: "text-xs",
    middle: "text-sm",
    large: "text-base"
  }

  const cellPadding = {
    small: "px-2 py-1",
    middle: "px-3 py-2",
    large: "px-4 py-3"
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Table Header */}
      {(title || actions || rowSelection || searchQuery !== undefined) && (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {title && <div className="font-semibold">{title()}</div>}
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 w-64"
              />
            </div>

            {/* Row selection info */}
            {rowSelection && selectedRowKeys.length > 0 && (
              <Badge variant="secondary">
                {selectedRowKeys.length} selected
              </Badge>
            )}
          </div>

          {/* Actions */}
          {actions && (
            <div className="flex items-center gap-2">
              {actions.refresh && (
                <Button variant="outline" size="sm" onClick={actions.refresh}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
              {actions.export && (
                <Button variant="outline" size="sm" onClick={actions.export}>
                  <Download className="h-4 w-4" />
                </Button>
              )}
              {actions.add && (
                <Button size="sm" onClick={actions.add}>
                  Add New
                </Button>
              )}
              {actions.settings && (
                <Button variant="outline" size="sm" onClick={actions.settings}>
                  <Settings className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className={cn(
        "relative overflow-auto rounded-lg border border-gray-200 bg-white",
        bordered && "border"
      )}>
        {loading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}

        <table className="w-full">
          {showHeader && (
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {/* Row selection header */}
                {rowSelection && (
                  <th className={cn("sticky left-0 bg-gray-50 z-10", cellPadding[size])}>
                    {rowSelection.type !== 'radio' && (
                      <Checkbox
                        checked={selectedRowKeys.length === data.length && data.length > 0}
                        indeterminate={selectedRowKeys.length > 0 && selectedRowKeys.length < data.length}
                        onCheckedChange={handleSelectAll}
                      />
                    )}
                  </th>
                )}

                {/* Expandable header */}
                {expandable && (
                  <th className={cn("sticky left-0 bg-gray-50 z-10 w-12", cellPadding[size])}>
                  </th>
                )}

                {/* Column headers */}
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={cn(
                      "font-semibold text-gray-900 border-r border-gray-200 last:border-r-0",
                      cellPadding[size],
                      sizeClasses[size],
                      column.align === 'center' && "text-center",
                      column.align === 'right' && "text-right",
                      column.fixed === 'left' && "sticky left-0 bg-gray-50 z-10",
                      column.fixed === 'right' && "sticky right-0 bg-gray-50 z-10"
                    )}
                    style={{
                      width: column.width,
                      minWidth: column.minWidth,
                      maxWidth: column.maxWidth
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span>{column.title}</span>
                      
                      {/* Sort indicator */}
                      {column.sortable && (
                        <button
                          onClick={() => handleSort(column)}
                          className="flex flex-col hover:bg-gray-100 rounded p-1"
                        >
                          {sortConfig?.key === (column.dataIndex || column.key) ? (
                            sortConfig.direction === 'asc' ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : (
                              <ChevronDown className="h-3 w-3" />
                            )
                          ) : (
                            <ArrowUpDown className="h-3 w-3 opacity-50" />
                          )}
                        </button>
                      )}

                      {/* Filter dropdown */}
                      {column.filterable && column.filters && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="hover:bg-gray-100 rounded p-1">
                              <Filter className="h-3 w-3" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-48">
                            {column.filters.map((filter) => (
                              <DropdownMenuCheckboxItem
                                key={filter.value}
                                checked={filters[column.dataIndex || column.key] === filter.value}
                                onCheckedChange={(checked) => {
                                  setFilters(prev => ({
                                    ...prev,
                                    [column.dataIndex || column.key]: checked ? filter.value : undefined
                                  }))
                                }}
                              >
                                {filter.text}
                              </DropdownMenuCheckboxItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </th>
                ))}

                {/* Actions column */}
                <th className={cn("w-12", cellPadding[size])}>
                  <MoreHorizontal className="h-4 w-4 opacity-50" />
                </th>
              </tr>
            </thead>
          )}

          <tbody className="divide-y divide-gray-200">
            {sortedData.map((record, index) => {
              const key = getRowKey(record, index)
              const rowProps = onRow?.(record, index)
              const isSelected = selectedRowKeys.includes(key)
              const isExpanded = expandedRows.has(key)

              return (
                <React.Fragment key={key}>
                  <tr
                    className={cn(
                      "hover:bg-gray-50 transition-colors",
                      isSelected && "bg-blue-50",
                      rowProps?.onClick && "cursor-pointer"
                    )}
                    onClick={rowProps?.onClick}
                    onDoubleClick={rowProps?.onDoubleClick}
                    onContextMenu={rowProps?.onContextMenu}
                  >
                    {/* Row selection */}
                    {rowSelection && (
                      <td className={cn("sticky left-0 bg-white z-10", cellPadding[size])}>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleRowSelect(key, !!checked)}
                          disabled={rowSelection.getCheckboxProps?.(record)?.disabled}
                        />
                      </td>
                    )}

                    {/* Expandable */}
                    {expandable && (
                      <td className={cn("sticky left-0 bg-white z-10", cellPadding[size])}>
                        {expandable.rowExpandable?.(record) !== false && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRowExpand(key)
                            }}
                            className="hover:bg-gray-100 rounded p-1"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                        )}
                      </td>
                    )}

                    {/* Data cells */}
                    {columns.map((column) => {
                      const cellValue = record[column.dataIndex || column.key]
                      const renderedValue = column.render
                        ? column.render(cellValue, record, index)
                        : cellValue

                      return (
                        <td
                          key={column.key}
                          className={cn(
                            "border-r border-gray-200 last:border-r-0",
                            cellPadding[size],
                            sizeClasses[size],
                            column.align === 'center' && "text-center",
                            column.align === 'right' && "text-right",
                            column.fixed === 'left' && "sticky left-0 bg-white z-10",
                            column.fixed === 'right' && "sticky right-0 bg-white z-10",
                            column.className
                          )}
                          style={{
                            width: column.width,
                            minWidth: column.minWidth,
                            maxWidth: column.maxWidth
                          }}
                        >
                          {renderedValue}
                        </td>
                      )
                    })}

                    {/* Actions */}
                    <td className={cellPadding[size]}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View</DropdownMenuItem>
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>

                  {/* Expanded row */}
                  {expandable && isExpanded && expandable.expandedRowRender && (
                    <tr>
                      <td
                        colSpan={columns.length + (rowSelection ? 1 : 0) + 2}
                        className="bg-gray-50 border-t border-gray-200 p-4"
                      >
                        {expandable.expandedRowRender(record, index)}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>

        {/* Empty state */}
        {sortedData.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-500">
            <div className="text-lg font-medium mb-2">No data</div>
            <div className="text-sm">No records found</div>
          </div>
        )}
      </div>

      {/* Footer */}
      {footer && (
        <div className="border-t border-gray-200 pt-4">
          {footer()}
        </div>
      )}

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {Math.min((pagination.current - 1) * pagination.pageSize + 1, pagination.total)} to{' '}
            {Math.min(pagination.current * pagination.pageSize, pagination.total)} of {pagination.total} entries
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.current <= 1}
              onClick={() => pagination.onChange?.(pagination.current - 1, pagination.pageSize)}
            >
              Previous
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.ceil(pagination.total / pagination.pageSize) }, (_, i) => i + 1)
                .filter(page => 
                  page === 1 || 
                  page === Math.ceil(pagination.total / pagination.pageSize) ||
                  Math.abs(page - pagination.current) <= 2
                )
                .map((page, index, array) => (
                  <React.Fragment key={page}>
                    {index > 0 && array[index - 1] !== page - 1 && (
                      <span className="px-2 py-1 text-gray-400">...</span>
                    )}
                    <Button
                      variant={page === pagination.current ? "default" : "outline"}
                      size="sm"
                      onClick={() => pagination.onChange?.(page, pagination.pageSize)}
                    >
                      {page}
                    </Button>
                  </React.Fragment>
                ))}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.current >= Math.ceil(pagination.total / pagination.pageSize)}
              onClick={() => pagination.onChange?.(pagination.current + 1, pagination.pageSize)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export { EnhancedTable }