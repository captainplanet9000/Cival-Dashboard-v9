"use client"

import * as React from "react"
import { X, Info, CheckCircle, AlertTriangle, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { createPortal } from "react-dom"

// Enhanced Modal Component like Ant Design

export interface ModalProps {
  title?: React.ReactNode
  open?: boolean
  confirmLoading?: boolean
  destroyOnClose?: boolean
  forceRender?: boolean
  getContainer?: HTMLElement | (() => HTMLElement) | string
  mask?: boolean
  maskClosable?: boolean
  maskStyle?: React.CSSProperties
  okText?: React.ReactNode
  okType?: 'primary' | 'ghost' | 'dashed' | 'link' | 'text' | 'default'
  okButtonProps?: any
  cancelText?: React.ReactNode
  cancelButtonProps?: any
  centered?: boolean
  closable?: boolean
  closeIcon?: React.ReactNode
  footer?: React.ReactNode | null
  keyboard?: boolean
  width?: string | number
  wrapClassName?: string
  zIndex?: number
  bodyStyle?: React.CSSProperties
  maskTransitionName?: string
  transitionName?: string
  className?: string
  children?: React.ReactNode
  afterClose?: () => void
  onCancel?: (e: React.MouseEvent<HTMLElement>) => void
  onOk?: (e: React.MouseEvent<HTMLElement>) => void
}

export interface ConfirmModalProps {
  title?: React.ReactNode
  content?: React.ReactNode
  icon?: React.ReactNode
  okText?: React.ReactNode
  cancelText?: React.ReactNode
  okType?: 'primary' | 'danger'
  onOk?: () => void | Promise<void>
  onCancel?: () => void
  centered?: boolean
  width?: string | number
  zIndex?: number
  autoFocusButton?: 'ok' | 'cancel' | null
}

const Modal: React.FC<ModalProps> = ({
  title,
  open = false,
  confirmLoading = false,
  destroyOnClose = false,
  forceRender = false,
  getContainer,
  mask = true,
  maskClosable = true,
  maskStyle,
  okText = 'OK',
  okType = 'primary',
  okButtonProps,
  cancelText = 'Cancel',
  cancelButtonProps,
  centered = false,
  closable = true,
  closeIcon = <X className="h-4 w-4" />,
  footer,
  keyboard = true,
  width = 520,
  wrapClassName,
  zIndex = 1000,
  bodyStyle,
  className,
  children,
  afterClose,
  onCancel,
  onOk
}) => {
  const [isVisible, setIsVisible] = React.useState(open)
  const [isAnimating, setIsAnimating] = React.useState(false)
  const [hasBeenOpened, setHasBeenOpened] = React.useState(open || forceRender)

  React.useEffect(() => {
    if (open) {
      setHasBeenOpened(true)
      setIsVisible(true)
      setIsAnimating(true)
      
      const timer = setTimeout(() => {
        setIsAnimating(false)
      }, 200)
      
      return () => clearTimeout(timer)
    } else if (isVisible) {
      setIsAnimating(true)
      
      const timer = setTimeout(() => {
        setIsVisible(false)
        setIsAnimating(false)
        afterClose?.()
        
        if (destroyOnClose) {
          setHasBeenOpened(false)
        }
      }, 200)
      
      return () => clearTimeout(timer)
    }
  }, [open, afterClose, destroyOnClose, isVisible])

  const handleClose = (e: React.MouseEvent<HTMLElement>) => {
    onCancel?.(e)
  }

  const handleOk = (e: React.MouseEvent<HTMLElement>) => {
    onOk?.(e)
  }

  const handleMaskClick = (e: React.MouseEvent) => {
    if (maskClosable && e.target === e.currentTarget) {
      handleClose(e)
    }
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (keyboard && e.key === 'Escape') {
      handleClose(e as any)
    }
  }

  React.useEffect(() => {
    if (open && keyboard) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, keyboard])

  const renderFooter = () => {
    if (footer === null) return null
    
    if (footer) return footer

    return (
      <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-200">
        <Button
          variant="outline"
          onClick={handleClose}
          disabled={confirmLoading}
          {...cancelButtonProps}
        >
          {cancelText}
        </Button>
        <Button
          variant={okType === 'primary' ? 'default' : okType}
          onClick={handleOk}
          loading={confirmLoading}
          disabled={confirmLoading}
          {...okButtonProps}
        >
          {okText}
        </Button>
      </div>
    )
  }

  const renderModal = () => {
    if (!hasBeenOpened && !forceRender) return null

    return (
      <div
        className={cn(
          "fixed inset-0 overflow-y-auto",
          !isVisible && "pointer-events-none",
          wrapClassName
        )}
        style={{ zIndex }}
      >
        {/* Mask */}
        {mask && (
          <div
            className={cn(
              "fixed inset-0 bg-black transition-opacity duration-200",
              open ? "opacity-50" : "opacity-0"
            )}
            style={maskStyle}
            onClick={handleMaskClick}
          />
        )}

        {/* Modal */}
        <div
          className={cn(
            "fixed inset-0 flex items-center justify-center p-4",
            centered ? "items-center" : "items-start pt-16"
          )}
        >
          <div
            className={cn(
              "relative bg-white rounded-lg shadow-xl max-w-full max-h-full overflow-hidden transition-all duration-200",
              open && !isAnimating ? "opacity-100 scale-100" : "opacity-0 scale-95",
              className
            )}
            style={{ width, maxWidth: '100vw', maxHeight: '100vh' }}
          >
            {/* Header */}
            {(title || closable) && (
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                {title && (
                  <h3 className="text-lg font-medium text-gray-900">{title}</h3>
                )}
                {closable && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClose}
                    className="h-8 w-8 p-0"
                  >
                    {closeIcon}
                  </Button>
                )}
              </div>
            )}

            {/* Body */}
            <div
              className="p-6 overflow-y-auto"
              style={bodyStyle}
            >
              {children}
            </div>

            {/* Footer */}
            {renderFooter() && (
              <div className="px-6 pb-6">
                {renderFooter()}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (typeof window === 'undefined') return null

  const container = getContainer
    ? typeof getContainer === 'string'
      ? document.querySelector(getContainer)
      : typeof getContainer === 'function'
      ? getContainer()
      : getContainer
    : document.body

  return container ? createPortal(renderModal(), container) : renderModal()
}

// Confirm Modal Function
const confirm = (props: ConfirmModalProps): { destroy: () => void; update: (newProps: ConfirmModalProps) => void } => {
  let currentProps = { ...props }
  
  const container = document.createElement('div')
  document.body.appendChild(container)

  const render = (renderProps: ConfirmModalProps) => {
    const root = (window as any).__REACT_ROOT_CACHE__ = (window as any).__REACT_ROOT_CACHE__ || new Map()
    
    if (!root.has(container)) {
      const { createRoot } = require('react-dom/client')
      root.set(container, createRoot(container))
    }
    
    const reactRoot = root.get(container)
    
    reactRoot.render(
      <ConfirmModal
        {...renderProps}
        onDestroy={() => {
          reactRoot.unmount()
          if (container.parentNode) {
            container.parentNode.removeChild(container)
          }
        }}
      />
    )
  }

  const destroy = () => {
    const root = (window as any).__REACT_ROOT_CACHE__?.get(container)
    if (root) {
      root.unmount()
      if (container.parentNode) {
        container.parentNode.removeChild(container)
      }
    }
  }

  const update = (newProps: ConfirmModalProps) => {
    currentProps = { ...currentProps, ...newProps }
    render(currentProps)
  }

  render(currentProps)

  return { destroy, update }
}

const ConfirmModal: React.FC<ConfirmModalProps & { onDestroy: () => void }> = ({
  title = 'Confirm',
  content,
  icon,
  okText = 'OK',
  cancelText = 'Cancel',
  okType = 'primary',
  onOk,
  onCancel,
  centered = true,
  width = 416,
  zIndex = 1010,
  autoFocusButton = 'ok',
  onDestroy
}) => {
  const [open, setOpen] = React.useState(true)
  const [loading, setLoading] = React.useState(false)

  const handleOk = async () => {
    if (onOk) {
      setLoading(true)
      try {
        await onOk()
        setOpen(false)
      } catch (error) {
        console.error('Confirm modal onOk error:', error)
      } finally {
        setLoading(false)
      }
    } else {
      setOpen(false)
    }
  }

  const handleCancel = () => {
    onCancel?.()
    setOpen(false)
  }

  const getIcon = () => {
    if (icon) return icon
    return <AlertTriangle className="h-6 w-6 text-yellow-500" />
  }

  return (
    <Modal
      title={null}
      open={open}
      centered={centered}
      width={width}
      zIndex={zIndex}
      closable={false}
      maskClosable={false}
      onCancel={handleCancel}
      afterClose={onDestroy}
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" onClick={handleCancel} disabled={loading}>
            {cancelText}
          </Button>
          <Button
            variant={okType === 'danger' ? 'destructive' : 'default'}
            onClick={handleOk}
            loading={loading}
            disabled={loading}
            autoFocus={autoFocusButton === 'ok'}
          >
            {okText}
          </Button>
        </div>
      }
    >
      <div className="flex gap-4">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="flex-1">
          {title && (
            <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
          )}
          {content && (
            <div className="text-gray-600">{content}</div>
          )}
        </div>
      </div>
    </Modal>
  )
}

// Helper functions
const info = (props: ConfirmModalProps) => confirm({ ...props, icon: <Info className="h-6 w-6 text-blue-500" /> })
const success = (props: ConfirmModalProps) => confirm({ ...props, icon: <CheckCircle className="h-6 w-6 text-green-500" /> })
const error = (props: ConfirmModalProps) => confirm({ ...props, icon: <XCircle className="h-6 w-6 text-red-500" /> })
const warning = (props: ConfirmModalProps) => confirm({ ...props, icon: <AlertTriangle className="h-6 w-6 text-yellow-500" /> })

Modal.confirm = confirm
Modal.info = info
Modal.success = success
Modal.error = error
Modal.warning = warning

export { Modal }