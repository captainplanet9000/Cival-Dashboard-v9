/**
 * Persistent Component Wrapper
 * Automatically saves and restores component state across Railway deployments
 */

'use client'

import React, { useEffect, useRef } from 'react'
import { usePersistentState } from '@/hooks/usePersistentState'

interface PersistentComponentProps {
  children: React.ReactNode
  componentId: string
  userId?: string
  initialState?: any
  autoSave?: boolean
  saveInterval?: number
  className?: string
}

/**
 * Wrapper component that automatically persists children component state
 */
export function PersistentComponent({
  children,
  componentId,
  userId = 'solo-operator',
  initialState = {},
  autoSave = true,
  saveInterval = 5000, // 5 seconds
  className
}: PersistentComponentProps) {
  const [persistedState, setPersistentState, isLoading] = usePersistentState(
    componentId,
    initialState,
    userId
  )
  
  const stateRef = useRef(persistedState)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Update ref when state changes
  useEffect(() => {
    stateRef.current = persistedState
  }, [persistedState])

  // Auto-save mechanism
  useEffect(() => {
    if (!autoSave || isLoading) return

    const saveState = () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      saveTimeoutRef.current = setTimeout(() => {
        if (stateRef.current !== initialState) {
          setPersistentState(stateRef.current)
        }
      }, saveInterval)
    }

    // Set up periodic saves
    const interval = setInterval(saveState, saveInterval)

    // Save on component unmount
    return () => {
      clearInterval(interval)
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      saveState()
    }
  }, [autoSave, isLoading, saveInterval, setPersistentState, initialState])

  // Provide persistence utilities to child components
  const persistenceUtils = {
    state: persistedState,
    setState: setPersistentState,
    isLoading,
    componentId,
    userId
  }

  if (isLoading) {
    return (
      <div className={`persistent-component loading ${className || ''}`}>
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span className="ml-2 text-sm text-muted-foreground">Restoring state...</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`persistent-component ${className || ''}`}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            ...persistenceUtils,
            ...child.props
          })
        }
        return child
      })}
    </div>
  )
}

/**
 * HOC for making components persistent
 */
export function withPersistence<P extends object>(
  Component: React.ComponentType<P>,
  componentId: string,
  options: Partial<PersistentComponentProps> = {}
) {
  return function PersistentWrapper(props: P) {
    return (
      <PersistentComponent
        componentId={componentId}
        {...options}
      >
        <Component {...props} />
      </PersistentComponent>
    )
  }
}

/**
 * Hook for manual state persistence within components
 */
export function usePersistenceContext() {
  const context = React.useContext(React.createContext<any>(null))
  
  if (!context) {
    throw new Error('usePersistenceContext must be used within a PersistentComponent')
  }
  
  return context
}

/**
 * Persistent form component that auto-saves form data
 */
interface PersistentFormProps {
  formId: string
  children: React.ReactNode
  onSubmit?: (data: any) => void
  className?: string
  resetOnSubmit?: boolean
}

export function PersistentForm({
  formId,
  children,
  onSubmit,
  className,
  resetOnSubmit = false
}: PersistentFormProps) {
  const [formData, setFormData] = usePersistentState(`form_${formId}`, {})

  const handleInputChange = (name: string, value: any) => {
    setFormData({
      ...formData,
      [name]: value
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (onSubmit) {
      onSubmit(formData)
    }
    if (resetOnSubmit) {
      setFormData({})
    }
  }

  // Provide form utilities to child components
  const formUtils = {
    formData,
    handleInputChange,
    setFormData
  }

  return (
    <form onSubmit={handleSubmit} className={className}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            ...formUtils,
            ...child.props
          })
        }
        return child
      })}
    </form>
  )
}

/**
 * Persistent input component
 */
interface PersistentInputProps {
  name: string
  type?: string
  placeholder?: string
  className?: string
  formData?: any
  handleInputChange?: (name: string, value: any) => void
}

export function PersistentInput({
  name,
  type = 'text',
  placeholder,
  className,
  formData = {},
  handleInputChange
}: PersistentInputProps) {
  const value = formData[name] || ''

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (handleInputChange) {
      handleInputChange(name, e.target.value)
    }
  }

  return (
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
    />
  )
}

/**
 * Persistent table component that saves column widths, sorting, etc.
 */
interface PersistentTableProps {
  tableId: string
  children: React.ReactNode
  className?: string
}

export function PersistentTable({
  tableId,
  children,
  className
}: PersistentTableProps) {
  const [tableState, setTableState] = usePersistentState(`table_${tableId}`, {
    sortColumn: null,
    sortDirection: 'asc',
    columnWidths: {},
    hiddenColumns: [],
    pageSize: 10,
    currentPage: 1
  })

  const updateTableState = (updates: any) => {
    setTableState({
      ...tableState,
      ...updates
    })
  }

  const tableUtils = {
    tableState,
    updateTableState,
    sortColumn: tableState.sortColumn,
    sortDirection: tableState.sortDirection,
    columnWidths: tableState.columnWidths,
    hiddenColumns: tableState.hiddenColumns,
    pageSize: tableState.pageSize,
    currentPage: tableState.currentPage
  }

  return (
    <div className={`persistent-table ${className || ''}`}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            ...tableUtils,
            ...child.props
          })
        }
        return child
      })}
    </div>
  )
}

/**
 * Persistent dashboard widget
 */
interface PersistentWidgetProps {
  widgetId: string
  title: string
  children: React.ReactNode
  defaultPosition?: { x: number; y: number }
  defaultSize?: { width: number; height: number }
  resizable?: boolean
  draggable?: boolean
  className?: string
}

export function PersistentWidget({
  widgetId,
  title,
  children,
  defaultPosition = { x: 0, y: 0 },
  defaultSize = { width: 300, height: 200 },
  resizable = true,
  draggable = true,
  className
}: PersistentWidgetProps) {
  const [widgetState, setWidgetState] = usePersistentState(`widget_${widgetId}`, {
    position: defaultPosition,
    size: defaultSize,
    isMinimized: false,
    isVisible: true
  })

  const updatePosition = (x: number, y: number) => {
    setWidgetState({
      ...widgetState,
      position: { x, y }
    })
  }

  const updateSize = (width: number, height: number) => {
    setWidgetState({
      ...widgetState,
      size: { width, height }
    })
  }

  const toggleMinimized = () => {
    setWidgetState({
      ...widgetState,
      isMinimized: !widgetState.isMinimized
    })
  }

  const toggleVisible = () => {
    setWidgetState({
      ...widgetState,
      isVisible: !widgetState.isVisible
    })
  }

  if (!widgetState.isVisible) {
    return null
  }

  return (
    <div
      className={`persistent-widget ${className || ''}`}
      style={{
        position: 'absolute',
        left: widgetState.position.x,
        top: widgetState.position.y,
        width: widgetState.size.width,
        height: widgetState.isMinimized ? 'auto' : widgetState.size.height
      }}
    >
      <div className="widget-header">
        <h3 className="widget-title">{title}</h3>
        <div className="widget-controls">
          <button onClick={toggleMinimized}>
            {widgetState.isMinimized ? '▢' : '▢'}
          </button>
          <button onClick={toggleVisible}>✕</button>
        </div>
      </div>
      {!widgetState.isMinimized && (
        <div className="widget-content">
          {children}
        </div>
      )}
    </div>
  )
}