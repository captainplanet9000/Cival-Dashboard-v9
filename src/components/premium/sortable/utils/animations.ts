/**
 * Animation utilities for sortable components
 * Provides smooth transitions and visual feedback during drag operations
 */

import { CSSProperties } from 'react';
import { SortableAnimationConfig } from '../types';

// Default animation configurations
export const ANIMATION_PRESETS = {
  smooth: {
    duration: 200,
    easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    scale: 1.02,
    opacity: 0.9,
  },
  snappy: {
    duration: 150,
    easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    scale: 1.05,
    opacity: 0.8,
  },
  minimal: {
    duration: 100,
    easing: 'ease-out',
    scale: 1.01,
    opacity: 0.95,
  },
  dramatic: {
    duration: 300,
    easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    scale: 1.08,
    opacity: 0.7,
  },
};

/**
 * Generate CSS styles for drag animations
 */
export function getDragAnimationStyles(
  config: SortableAnimationConfig,
  isDragging: boolean = false
): CSSProperties {
  return {
    transition: `all ${config.duration}ms ${config.easing}`,
    transform: isDragging ? `scale(${config.scale})` : 'scale(1)',
    opacity: isDragging ? config.opacity : 1,
    zIndex: isDragging ? 1000 : 'auto',
    ...(isDragging && {
      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
      cursor: 'grabbing',
    }),
  };
}

/**
 * Generate CSS styles for drop zone animations
 */
export function getDropZoneStyles(
  isOver: boolean = false,
  canDrop: boolean = true
): CSSProperties {
  return {
    transition: 'all 200ms ease-in-out',
    ...(isOver && canDrop && {
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      borderColor: '#3B82F6',
      transform: 'scale(1.01)',
    }),
    ...(isOver && !canDrop && {
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      borderColor: '#EF4444',
    }),
  };
}

/**
 * Generate CSS styles for sortable items
 */
export function getSortableItemStyles(
  isDragging: boolean = false,
  isOver: boolean = false,
  disabled: boolean = false
): CSSProperties {
  return {
    transition: 'all 200ms ease-in-out',
    cursor: disabled ? 'not-allowed' : 'grab',
    userSelect: 'none',
    ...(isDragging && {
      opacity: 0.5,
      transform: 'rotate(2deg) scale(1.05)',
      zIndex: 1000,
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
      cursor: 'grabbing',
    }),
    ...(isOver && {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    }),
    ...(disabled && {
      opacity: 0.5,
      filter: 'grayscale(50%)',
    }),
  };
}

/**
 * CSS keyframes for loading animations
 */
export const LOADING_KEYFRAMES = `
  @keyframes sortable-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  
  @keyframes sortable-shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
  
  @keyframes sortable-bounce {
    0%, 20%, 53%, 80%, 100% { transform: translate3d(0, 0, 0); }
    40%, 43% { transform: translate3d(0, -8px, 0); }
    70% { transform: translate3d(0, -4px, 0); }
    90% { transform: translate3d(0, -2px, 0); }
  }
`;

/**
 * Generate loading skeleton styles
 */
export function getSkeletonStyles(): CSSProperties {
  return {
    background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
    backgroundSize: '200% 100%',
    animation: 'sortable-shimmer 1.5s infinite',
    borderRadius: '4px',
  };
}

/**
 * Priority indicator animations
 */
export function getPriorityIndicatorStyles(
  priority: 'high' | 'medium' | 'low'
): CSSProperties {
  const colors = {
    high: '#EF4444',
    medium: '#F59E0B',
    low: '#10B981',
  };

  return {
    position: 'relative',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: `linear-gradient(45deg, ${colors[priority]}22, transparent)`,
      borderRadius: 'inherit',
      animation: priority === 'high' ? 'sortable-pulse 2s infinite' : 'none',
    },
  } as CSSProperties;
}

/**
 * Generate trading-specific indicator styles
 */
export function getTradingIndicatorStyles(
  type: 'profit' | 'loss' | 'neutral',
  animated: boolean = false
): CSSProperties {
  const colorMap = {
    profit: '#10B981',
    loss: '#EF4444',
    neutral: '#6B7280',
  };

  return {
    color: colorMap[type],
    transition: 'all 300ms ease-in-out',
    ...(animated && {
      animation: type === 'profit' ? 'sortable-bounce 1s ease-in-out' : 'none',
    }),
  };
}

/**
 * Generate custom CSS classes for sortable components
 */
export function generateSortableCSS(): string {
  return `
    ${LOADING_KEYFRAMES}
    
    .sortable-container {
      position: relative;
      min-height: 100px;
    }
    
    .sortable-item {
      transition: all 200ms ease-in-out;
      cursor: grab;
      user-select: none;
    }
    
    .sortable-item:active {
      cursor: grabbing;
    }
    
    .sortable-item--dragging {
      opacity: 0.5;
      transform: rotate(2deg) scale(1.05);
      z-index: 1000;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
      cursor: grabbing;
    }
    
    .sortable-item--over {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    
    .sortable-item--disabled {
      opacity: 0.5;
      filter: grayscale(50%);
      cursor: not-allowed;
    }
    
    .sortable-handle {
      cursor: grab;
      opacity: 0;
      transition: opacity 200ms ease-in-out;
    }
    
    .sortable-item:hover .sortable-handle {
      opacity: 1;
    }
    
    .sortable-handle:active {
      cursor: grabbing;
    }
    
    .sortable-overlay {
      pointer-events: none;
      z-index: 999;
    }
    
    .sortable-drop-indicator {
      height: 2px;
      background: #3B82F6;
      border-radius: 1px;
      margin: 4px 0;
      opacity: 0;
      transform: scaleX(0);
      transition: all 200ms ease-in-out;
    }
    
    .sortable-drop-indicator--active {
      opacity: 1;
      transform: scaleX(1);
    }
    
    .trading-priority-high {
      border-left: 3px solid #EF4444;
      animation: sortable-pulse 2s infinite;
    }
    
    .trading-priority-medium {
      border-left: 3px solid #F59E0B;
    }
    
    .trading-priority-low {
      border-left: 3px solid #10B981;
    }
    
    .trading-profit {
      color: #10B981;
    }
    
    .trading-loss {
      color: #EF4444;
    }
    
    .trading-neutral {
      color: #6B7280;
    }
    
    .trading-risk-low {
      background: linear-gradient(90deg, transparent, #10B98120, transparent);
    }
    
    .trading-risk-medium {
      background: linear-gradient(90deg, transparent, #F59E0B20, transparent);
    }
    
    .trading-risk-high {
      background: linear-gradient(90deg, transparent, #EF444420, transparent);
    }
    
    .trading-risk-critical {
      background: linear-gradient(90deg, transparent, #DC262620, transparent);
      animation: sortable-pulse 3s infinite;
    }
  `;
}

/**
 * Inject CSS styles into document head
 */
export function injectSortableStyles(): void {
  if (typeof document === 'undefined') return;

  const styleId = 'sortable-styles';
  
  // Remove existing styles
  const existingStyle = document.getElementById(styleId);
  if (existingStyle) {
    existingStyle.remove();
  }

  // Create and inject new styles
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = generateSortableCSS();
  document.head.appendChild(style);
}

/**
 * Animation utility class for managing sortable animations
 */
export class SortableAnimationManager {
  private animationFrameId: number | null = null;
  private pendingAnimations = new Map<string, () => void>();

  /**
   * Schedule an animation to run on the next frame
   */
  scheduleAnimation(id: string, animation: () => void): void {
    this.pendingAnimations.set(id, animation);
    
    if (!this.animationFrameId) {
      this.animationFrameId = requestAnimationFrame(() => {
        this.flushAnimations();
      });
    }
  }

  /**
   * Cancel a scheduled animation
   */
  cancelAnimation(id: string): void {
    this.pendingAnimations.delete(id);
  }

  /**
   * Execute all pending animations
   */
  private flushAnimations(): void {
    const animations = Array.from(this.pendingAnimations.values());
    for (const animation of animations) {
      animation();
    }
    
    this.pendingAnimations.clear();
    this.animationFrameId = null;
  }

  /**
   * Clean up all animations
   */
  cleanup(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.pendingAnimations.clear();
  }
}

// Global animation manager instance
export const sortableAnimationManager = new SortableAnimationManager();