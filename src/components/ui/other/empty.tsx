"use client"

import * as React from "react"
import { FileX, Inbox, Search, Wifi, Database } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

// Enhanced Empty Component like Ant Design

export interface EmptyProps {
  image?: React.ReactNode | 'default' | 'simple'
  imageStyle?: React.CSSProperties
  description?: React.ReactNode
  children?: React.ReactNode
  className?: string
}

const Empty: React.FC<EmptyProps> = ({
  image = 'default',
  imageStyle,
  description,
  children,
  className
}) => {
  const getDefaultImage = () => {
    if (image === 'simple') {
      return (
        <div className="flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full">
          <Inbox className="h-8 w-8 text-gray-400" />
        </div>
      )
    }

    return (
      <div className="flex items-center justify-center w-24 h-24 bg-gray-50 rounded-lg">
        <FileX className="h-12 w-12 text-gray-300" />
      </div>
    )
  }

  const renderImage = () => {
    if (React.isValidElement(image)) {
      return image
    }

    if (typeof image === 'string') {
      return getDefaultImage()
    }

    return getDefaultImage()
  }

  return (
    <div className={cn(
      "flex flex-col items-center justify-center text-center py-8 px-4",
      className
    )}>
      {/* Image */}
      <div className="mb-4" style={imageStyle}>
        {renderImage()}
      </div>

      {/* Description */}
      <div className="text-gray-500 text-sm mb-4">
        {description || "No data"}
      </div>

      {/* Children (usually action buttons) */}
      {children && (
        <div>
          {children}
        </div>
      )}
    </div>
  )
}

// Predefined empty states for common scenarios
const EmptyData: React.FC<Omit<EmptyProps, 'image' | 'description'> & { description?: React.ReactNode }> = (props) => (
  <Empty
    {...props}
    image={<Database className="h-12 w-12 text-gray-300" />}
    description={props.description || "No data available"}
  />
)

const EmptySearch: React.FC<Omit<EmptyProps, 'image' | 'description'> & { description?: React.ReactNode }> = (props) => (
  <Empty
    {...props}
    image={<Search className="h-12 w-12 text-gray-300" />}
    description={props.description || "No search results found"}
  />
)

const EmptyConnection: React.FC<Omit<EmptyProps, 'image' | 'description'> & { description?: React.ReactNode }> = (props) => (
  <Empty
    {...props}
    image={<Wifi className="h-12 w-12 text-gray-300" />}
    description={props.description || "Connection failed"}
  />
)

Empty.Data = EmptyData
Empty.Search = EmptySearch
Empty.Connection = EmptyConnection

export { Empty }