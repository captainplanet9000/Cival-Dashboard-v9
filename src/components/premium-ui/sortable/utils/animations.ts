import type { AnimationConfig } from '../types'

export const ANIMATION_PRESETS: Record<string, AnimationConfig> = {
  smooth: {
    duration: 200,
    easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    stiffness: 100,
    damping: 15,
  },
  snappy: {
    duration: 150,
    easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    stiffness: 400,
    damping: 25,
  },
  minimal: {
    duration: 100,
    easing: 'ease-out',
    stiffness: 200,
    damping: 20,
  },
  dramatic: {
    duration: 300,
    easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    stiffness: 60,
    damping: 10,
  },
}

export const createCustomAnimation = (
  duration: number = 200,
  easing: string = 'ease-out',
  stiffness: number = 100,
  damping: number = 15
): AnimationConfig => ({
  duration,
  easing,
  stiffness,
  damping,
})

export const getDragTransition = (preset: keyof typeof ANIMATION_PRESETS = 'smooth') => {
  const config = ANIMATION_PRESETS[preset]
  return {
    duration: config.duration,
    ease: config.easing,
  }
}

export const getSortTransition = (preset: keyof typeof ANIMATION_PRESETS = 'smooth') => {
  const config = ANIMATION_PRESETS[preset]
  return `transform ${config.duration}ms ${config.easing}`
}