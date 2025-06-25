/**
 * AG-UI Integration Index
 * Central exports for AG-UI components and LangChain integration
 */

// Core AG-UI
export { AGUIClient, createAGUIClient, getAGUIClient, disconnectAGUI } from './client'
export { langChainAGUIRegistry } from './langchain-registry'
export { langChainAGUIHandlers } from './langchain-handlers'

// Types
export type * from './types'

// LangChain Integration Types
export type {
  LangChainAGUIAgent,
  AGUIMessageContext,
  AGUIResponse
} from './langchain-registry'