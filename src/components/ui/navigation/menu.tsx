"use client"

import * as React from "react"
import { ChevronRight, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

// Enhanced Menu Component like Ant Design

export interface MenuItem {
  key: string
  label: string
  icon?: React.ReactNode
  disabled?: boolean
  danger?: boolean
  children?: MenuItem[]
  href?: string
  onClick?: () => void
  type?: 'item' | 'submenu' | 'group' | 'divider'
}

export interface MenuProps {
  items: MenuItem[]
  mode?: 'horizontal' | 'vertical' | 'inline'
  theme?: 'light' | 'dark'
  selectedKeys?: string[]
  openKeys?: string[]
  defaultSelectedKeys?: string[]
  defaultOpenKeys?: string[]
  onSelect?: (selectedKeys: string[]) => void
  onOpenChange?: (openKeys: string[]) => void
  className?: string
  inlineCollapsed?: boolean
  selectable?: boolean
  multiple?: boolean
}

const Menu: React.FC<MenuProps> = ({
  items,
  mode = 'vertical',
  theme = 'light',
  selectedKeys,
  openKeys,
  defaultSelectedKeys = [],
  defaultOpenKeys = [],
  onSelect,
  onOpenChange,
  className,
  inlineCollapsed = false,
  selectable = true,
  multiple = false
}) => {
  const [internalSelectedKeys, setInternalSelectedKeys] = React.useState<string[]>(
    selectedKeys || defaultSelectedKeys
  )
  const [internalOpenKeys, setInternalOpenKeys] = React.useState<string[]>(
    openKeys || defaultOpenKeys
  )

  const activeSelectedKeys = selectedKeys || internalSelectedKeys
  const activeOpenKeys = openKeys || internalOpenKeys

  const handleSelect = (key: string) => {
    if (!selectable) return

    let newSelectedKeys: string[]
    if (multiple) {
      newSelectedKeys = activeSelectedKeys.includes(key)
        ? activeSelectedKeys.filter(k => k !== key)
        : [...activeSelectedKeys, key]
    } else {
      newSelectedKeys = [key]
    }

    if (onSelect) {
      onSelect(newSelectedKeys)
    } else {
      setInternalSelectedKeys(newSelectedKeys)
    }
  }

  const handleOpenChange = (key: string) => {
    const newOpenKeys = activeOpenKeys.includes(key)
      ? activeOpenKeys.filter(k => k !== key)
      : [...activeOpenKeys, key]

    if (onOpenChange) {
      onOpenChange(newOpenKeys)
    } else {
      setInternalOpenKeys(newOpenKeys)
    }
  }

  const themeClasses = {
    light: {
      menu: "bg-white border-gray-200",
      item: "text-gray-700 hover:bg-gray-50 hover:text-blue-600",
      selected: "bg-blue-50 text-blue-600 border-r-2 border-blue-600",
      disabled: "text-gray-400 cursor-not-allowed",
      danger: "text-red-600 hover:bg-red-50"
    },
    dark: {
      menu: "bg-gray-800 border-gray-700",
      item: "text-gray-300 hover:bg-gray-700 hover:text-white",
      selected: "bg-blue-600 text-white",
      disabled: "text-gray-600 cursor-not-allowed",
      danger: "text-red-400 hover:bg-red-900"
    }
  }

  const modeClasses = {
    horizontal: "flex border-b",
    vertical: "space-y-1 border-r",
    inline: "space-y-1"
  }

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    if (item.type === 'divider') {
      return (
        <div
          key={item.key}
          className={cn(
            "my-2 border-t",
            theme === 'light' ? "border-gray-200" : "border-gray-700"
          )}
        />
      )
    }

    if (item.type === 'group') {
      return (
        <div key={item.key} className="py-2">
          <div className={cn(
            "px-4 py-1 text-xs font-medium uppercase tracking-wider",
            theme === 'light' ? "text-gray-500" : "text-gray-400"
          )}>
            {item.label}
          </div>
          {item.children?.map(child => renderMenuItem(child, level + 1))}
        </div>
      )
    }

    const hasChildren = item.children && item.children.length > 0
    const isSelected = activeSelectedKeys.includes(item.key)
    const isOpen = activeOpenKeys.includes(item.key)
    
    const itemClasses = cn(
      "flex items-center px-4 py-2 text-sm transition-colors cursor-pointer",
      mode === 'horizontal' ? "border-b-2 border-transparent" : "",
      themeClasses[theme].item,
      isSelected && themeClasses[theme].selected,
      item.disabled && themeClasses[theme].disabled,
      item.danger && themeClasses[theme].danger,
      inlineCollapsed && mode === 'inline' && "justify-center px-2"
    )

    const handleClick = () => {
      if (item.disabled) return

      if (hasChildren && (mode === 'inline' || item.type === 'submenu')) {
        handleOpenChange(item.key)
      } else {
        handleSelect(item.key)
        item.onClick?.()
      }
    }

    return (
      <div key={item.key}>
        <div
          className={itemClasses}
          onClick={handleClick}
          style={{ paddingLeft: mode === 'inline' && !inlineCollapsed ? `${16 + level * 16}px` : undefined }}
        >
          {item.icon && (
            <span className={cn(
              "flex-shrink-0",
              inlineCollapsed ? "" : "mr-2"
            )}>
              {item.icon}
            </span>
          )}
          
          {(!inlineCollapsed || mode !== 'inline') && (
            <>
              <span className="flex-1 truncate">{item.label}</span>
              
              {hasChildren && (
                <span className="flex-shrink-0 ml-2">
                  {mode === 'horizontal' ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className={cn(
                      "h-4 w-4 transition-transform",
                      isOpen && "rotate-90"
                    )} />
                  )}
                </span>
              )}
            </>
          )}
        </div>

        {/* Submenu */}
        {hasChildren && mode === 'inline' && isOpen && (
          <div className={cn(
            "bg-gray-50 border-l-2 border-gray-200",
            theme === 'dark' && "bg-gray-900 border-gray-600"
          )}>
            {item.children?.map(child => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={cn(
      "select-none",
      modeClasses[mode],
      themeClasses[theme].menu,
      inlineCollapsed && "w-16",
      className
    )}>
      {items.map(item => renderMenuItem(item))}
    </div>
  )
}

export { Menu, type MenuItem }