/**
 * Singleton instance of the enhanced portfolio tracker
 * Provides global access to live portfolio data
 */

import PortfolioTracker from './portfolio-tracker'

// Create singleton instance
let portfolioTrackerInstance: PortfolioTracker | null = null

/**
 * Get or create the portfolio tracker instance
 */
export function getPortfolioTracker(): PortfolioTracker {
  if (!portfolioTrackerInstance) {
    portfolioTrackerInstance = new PortfolioTracker()
  }
  return portfolioTrackerInstance
}

/**
 * Export the instance for direct access
 */
export const portfolioTracker = getPortfolioTracker()

// Also export the class for testing
export { PortfolioTracker }