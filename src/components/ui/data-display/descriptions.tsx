"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// Enhanced Descriptions Component like Ant Design

export interface DescriptionItem {
  key?: string
  label: React.ReactNode
  children: React.ReactNode
  span?: number
  className?: string
  labelStyle?: React.CSSProperties
  contentStyle?: React.CSSProperties
}

export interface DescriptionsProps {
  title?: React.ReactNode
  extra?: React.ReactNode
  bordered?: boolean
  column?: number | { xs?: number; sm?: number; md?: number; lg?: number; xl?: number; xxl?: number }
  size?: 'default' | 'middle' | 'small'
  layout?: 'horizontal' | 'vertical'
  colon?: boolean
  labelStyle?: React.CSSProperties
  contentStyle?: React.CSSProperties
  className?: string
  items?: DescriptionItem[]
  children?: React.ReactNode
}

const Descriptions: React.FC<DescriptionsProps> = ({
  title,
  extra,
  bordered = false,
  column = 3,
  size = 'default',
  layout = 'horizontal',
  colon = true,
  labelStyle,
  contentStyle,
  className,
  items = [],
  children
}) => {
  // Parse items from children if provided
  const descriptionItems = React.useMemo(() => {
    if (items.length > 0) return items

    const itemsFromChildren: DescriptionItem[] = []
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child) && child.type === DescriptionsItem) {
        itemsFromChildren.push({
          key: child.key as string,
          label: child.props.label,
          children: child.props.children,
          span: child.props.span,
          className: child.props.className,
          labelStyle: child.props.labelStyle,
          contentStyle: child.props.contentStyle
        })
      }
    })
    return itemsFromChildren
  }, [items, children])

  const getColumns = () => {
    if (typeof column === 'number') return column
    // In a real implementation, you'd use a responsive hook here
    return column.lg || column.md || column.sm || column.xs || 3
  }

  const columns = getColumns()

  const sizeClasses = {
    small: "py-1 px-2 text-sm",
    default: "py-2 px-3 text-sm",
    middle: "py-3 px-4 text-base"
  }

  const renderTable = () => {
    const rows: DescriptionItem[][] = []
    let currentRow: DescriptionItem[] = []
    let currentRowSpan = 0

    for (const item of descriptionItems) {
      const span = Math.min(item.span || 1, columns)
      
      if (currentRowSpan + span > columns) {
        // Start new row
        rows.push(currentRow)
        currentRow = [item]
        currentRowSpan = span
      } else {
        // Add to current row
        currentRow.push(item)
        currentRowSpan += span
      }
    }

    if (currentRow.length > 0) {
      rows.push(currentRow)
    }

    return (
      <table className="w-full table-fixed">
        <tbody>
          {rows.map((row, rowIndex) => {
            if (layout === 'vertical') {
              return (
                <React.Fragment key={rowIndex}>
                  {/* Label row */}
                  <tr>
                    {row.map((item, colIndex) => {
                      const span = item.span || 1
                      return (
                        <th
                          key={`label-${rowIndex}-${colIndex}`}
                          colSpan={span}
                          className={cn(
                            "text-left font-medium text-gray-900",
                            sizeClasses[size],
                            bordered && "border border-gray-200 bg-gray-50",
                            item.className
                          )}
                          style={{ ...labelStyle, ...item.labelStyle }}
                        >
                          {item.label}
                          {colon && ':'}
                        </th>
                      )
                    })}
                    {/* Fill remaining columns */}
                    {Array.from({ length: columns - row.reduce((sum, item) => sum + (item.span || 1), 0) }, (_, i) => (
                      <th
                        key={`empty-label-${rowIndex}-${i}`}
                        className={cn(
                          sizeClasses[size],
                          bordered && "border border-gray-200 bg-gray-50"
                        )}
                      />
                    ))}
                  </tr>
                  {/* Content row */}
                  <tr>
                    {row.map((item, colIndex) => {
                      const span = item.span || 1
                      return (
                        <td
                          key={`content-${rowIndex}-${colIndex}`}
                          colSpan={span}
                          className={cn(
                            "text-gray-700",
                            sizeClasses[size],
                            bordered && "border border-gray-200",
                            item.className
                          )}
                          style={{ ...contentStyle, ...item.contentStyle }}
                        >
                          {item.children}
                        </td>
                      )
                    })}
                    {/* Fill remaining columns */}
                    {Array.from({ length: columns - row.reduce((sum, item) => sum + (item.span || 1), 0) }, (_, i) => (
                      <td
                        key={`empty-content-${rowIndex}-${i}`}
                        className={cn(
                          sizeClasses[size],
                          bordered && "border border-gray-200"
                        )}
                      />
                    ))}
                  </tr>
                </React.Fragment>
              )
            } else {
              // Horizontal layout
              const cells: React.ReactNode[] = []
              
              for (const item of row) {
                const span = item.span || 1
                
                // Label cell
                cells.push(
                  <th
                    key={`label-${rowIndex}-${cells.length}`}
                    className={cn(
                      "text-left font-medium text-gray-900 w-auto",
                      sizeClasses[size],
                      bordered && "border border-gray-200 bg-gray-50",
                      item.className
                    )}
                    style={{ ...labelStyle, ...item.labelStyle }}
                  >
                    {item.label}
                    {colon && ':'}
                  </th>
                )
                
                // Content cell
                cells.push(
                  <td
                    key={`content-${rowIndex}-${cells.length}`}
                    colSpan={span * 2 - 1}
                    className={cn(
                      "text-gray-700",
                      sizeClasses[size],
                      bordered && "border border-gray-200",
                      item.className
                    )}
                    style={{ ...contentStyle, ...item.contentStyle }}
                  >
                    {item.children}
                  </td>
                )
              }
              
              // Fill remaining columns
              const usedColumns = row.reduce((sum, item) => sum + (item.span || 1), 0)
              const remainingColumns = columns - usedColumns
              
              for (let i = 0; i < remainingColumns; i++) {
                cells.push(
                  <th
                    key={`empty-label-${rowIndex}-${i}`}
                    className={cn(
                      sizeClasses[size],
                      bordered && "border border-gray-200 bg-gray-50"
                    )}
                  />,
                  <td
                    key={`empty-content-${rowIndex}-${i}`}
                    className={cn(
                      sizeClasses[size],
                      bordered && "border border-gray-200"
                    )}
                  />
                )
              }
              
              return <tr key={rowIndex}>{cells}</tr>
            }
          })}
        </tbody>
      </table>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      {(title || extra) && (
        <div className="flex items-center justify-between">
          {title && (
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          )}
          {extra && <div>{extra}</div>}
        </div>
      )}

      {/* Content */}
      <div className={cn(
        bordered && "border border-gray-200 rounded-lg overflow-hidden"
      )}>
        {renderTable()}
      </div>
    </div>
  )
}

// Helper component for defining items as children
const DescriptionsItem: React.FC<DescriptionItem> = () => {
  return null // This component is only used for its props
}

export { Descriptions, DescriptionsItem, type DescriptionItem }