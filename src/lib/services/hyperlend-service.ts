/**
 * HyperLend Service
 * Comprehensive lending and borrowing on Hyperliquid
 */

import { 
  HyperLendMarket, 
  HyperLendPosition, 
  MultiChainBalance 
} from '@/lib/stores/app-store';

export interface HyperLendAPI {
  endpoint: string;
  apiKey?: string;
  network: 'mainnet' | 'testnet';
}

export interface LendingRate {
  symbol: string;
  supplyAPR: number;
  borrowAPR: number;
  utilization: number;
  totalSupply: number;
  totalBorrow: number;
  availableLiquidity: number;
  collateralFactor: number;
  liquidationThreshold: number;
  reserveFactor: number;
}

export interface BorrowingPosition {
  id: string;
  asset: string;
  borrowedAmount: number;
  borrowedAmountUSD: number;
  interestAccrued: number;
  healthFactor: number;
  liquidationPrice: number;
  collateralAssets: Array<{
    asset: string;
    amount: number;
    valueUSD: number;
  }>;
  isActive: boolean;
  openedAt: Date;
}

export interface SupplyPosition {
  id: string;
  asset: string;
  suppliedAmount: number;
  suppliedAmountUSD: number;
  interestEarned: number;
  currentAPR: number;
  isCollateral: boolean;
  isActive: boolean;
  openedAt: Date;
}

export interface LiquidationAlert {
  positionId: string;
  currentHealthFactor: number;
  liquidationThreshold: number;
  timeToLiquidation: number; // hours
  recommendedAction: 'add_collateral' | 'repay_debt' | 'monitor';
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface LendingStrategy {
  id: string;
  name: string;
  type: 'yield_farming' | 'leveraged_staking' | 'delta_neutral' | 'basis_trading';
  targetAPY: number;
  riskLevel: 'low' | 'medium' | 'high';
  maxLeverage: number;
  autoRebalance: boolean;
  parameters: Record<string, any>;
  isActive: boolean;
}

export interface MarketConditions {
  totalValueLocked: number;
  averageSupplyAPR: number;
  averageBorrowAPR: number;
  topAssetsByTVL: Array<{
    asset: string;
    tvl: number;
    apr: number;
  }>;
  riskMetrics: {
    averageHealthFactor: number;
    liquidationVolume24h: number;
    badDebtTotal: number;
  };
}

export class HyperLendService {
  private api: HyperLendAPI;
  private markets: Map<string, HyperLendMarket> = new Map();
  private userPositions: Map<string, HyperLendPosition[]> = new Map();
  private isInitialized: boolean = false;

  constructor() {
    this.api = {
      endpoint: process.env.NEXT_PUBLIC_HYPERLEND_API_URL || 'https://api.hyperliquid.xyz/info',
      apiKey: process.env.NEXT_PUBLIC_HYPERLEND_API_KEY,
      network: 'mainnet'
    };
  }

  /**
   * Initialize the service with market data
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await this.loadMarkets();
      this.isInitialized = true;
      console.log('HyperLend service initialized');
    } catch (error) {
      console.error('Error initializing HyperLend service:', error);
      throw error;
    }
  }

  /**
   * Load all available lending markets
   */
  async loadMarkets(): Promise<HyperLendMarket[]> {
    try {
      // Mock market data - would fetch from Hyperliquid API
      const mockMarkets: HyperLendMarket[] = [
        {
          id: 'usdc-market',
          symbol: 'USDC',
          contractAddress: '0x...',
          decimals: 6,
          supplyRateAPR: 4.25,
          borrowRateAPR: 6.80,
          totalSupply: 125000000,
          totalBorrow: 85000000,
          utilizationRate: 68.0,
          collateralFactor: 0.85,
          liquidationThreshold: 0.90,
          isActive: true,
          lastUpdated: new Date(),
          createdAt: new Date()
        },
        {
          id: 'eth-market',
          symbol: 'ETH',
          contractAddress: '0x...',
          decimals: 18,
          supplyRateAPR: 3.15,
          borrowRateAPR: 5.40,
          totalSupply: 45000,
          totalBorrow: 28000,
          utilizationRate: 62.2,
          collateralFactor: 0.80,
          liquidationThreshold: 0.85,
          isActive: true,
          lastUpdated: new Date(),
          createdAt: new Date()
        },
        {
          id: 'btc-market',
          symbol: 'BTC',
          contractAddress: '0x...',
          decimals: 8,
          supplyRateAPR: 2.85,
          borrowRateAPR: 4.20,
          totalSupply: 1250,
          totalBorrow: 780,
          utilizationRate: 62.4,
          collateralFactor: 0.75,
          liquidationThreshold: 0.80,
          isActive: true,
          lastUpdated: new Date(),
          createdAt: new Date()
        },
        {
          id: 'sol-market',
          symbol: 'SOL',
          contractAddress: '0x...',
          decimals: 9,
          supplyRateAPR: 5.20,
          borrowRateAPR: 8.75,
          totalSupply: 850000,
          totalBorrow: 425000,
          utilizationRate: 50.0,
          collateralFactor: 0.70,
          liquidationThreshold: 0.75,
          isActive: true,
          lastUpdated: new Date(),
          createdAt: new Date()
        }
      ];

      mockMarkets.forEach(market => {
        this.markets.set(market.symbol, market);
      });

      return mockMarkets;
    } catch (error) {
      console.error('Error loading markets:', error);
      return [];
    }
  }

  /**
   * Get all active markets
   */
  getMarkets(): HyperLendMarket[] {
    return Array.from(this.markets.values()).filter(market => market.isActive);
  }

  /**
   * Get market by symbol
   */
  getMarket(symbol: string): HyperLendMarket | null {
    return this.markets.get(symbol) || null;
  }

  /**
   * Get current lending rates for all markets
   */
  async getLendingRates(): Promise<LendingRate[]> {
    try {
      const markets = this.getMarkets();
      return markets.map(market => ({
        symbol: market.symbol,
        supplyAPR: market.supplyRateAPR,
        borrowAPR: market.borrowRateAPR,
        utilization: market.utilizationRate,
        totalSupply: market.totalSupply,
        totalBorrow: market.totalBorrow,
        availableLiquidity: market.totalSupply - market.totalBorrow,
        collateralFactor: market.collateralFactor,
        liquidationThreshold: market.liquidationThreshold,
        reserveFactor: 0.1 // Mock reserve factor
      }));
    } catch (error) {
      console.error('Error getting lending rates:', error);
      return [];
    }
  }

  /**
   * Supply assets to earn interest
   */
  async supply(asset: string, amount: number, useAsCollateral: boolean = true): Promise<string | null> {
    try {
      if (!this.isInitialized) await this.initialize();

      const market = this.getMarket(asset);
      if (!market) throw new Error(`Market not found for ${asset}`);

      // Mock transaction - would interact with Hyperliquid contracts
      console.log(`Supplying ${amount} ${asset} to HyperLend`);
      console.log(`Use as collateral: ${useAsCollateral}`);

      // Create position record
      const position: HyperLendPosition = {
        id: `supply-${asset}-${Date.now()}`,
        marketId: market.id,
        positionType: 'supply',
        amount: amount,
        amountUSD: amount * await this.getAssetPrice(asset),
        interestEarned: 0,
        interestEarnedUSD: 0,
        aprAtEntry: market.supplyRateAPR,
        isActive: true,
        openedAt: new Date()
      };

      // Mock transaction hash
      return `supply_tx_${Date.now()}`;
    } catch (error) {
      console.error('Error supplying assets:', error);
      throw error;
    }
  }

  /**
   * Withdraw supplied assets
   */
  async withdraw(asset: string, amount: number): Promise<string | null> {
    try {
      if (!this.isInitialized) await this.initialize();

      console.log(`Withdrawing ${amount} ${asset} from HyperLend`);

      // Mock transaction hash
      return `withdraw_tx_${Date.now()}`;
    } catch (error) {
      console.error('Error withdrawing assets:', error);
      throw error;
    }
  }

  /**
   * Borrow assets against collateral
   */
  async borrow(asset: string, amount: number): Promise<string | null> {
    try {
      if (!this.isInitialized) await this.initialize();

      const market = this.getMarket(asset);
      if (!market) throw new Error(`Market not found for ${asset}`);

      // Check borrowing capacity
      const borrowingPower = await this.getBorrowingPower('user123'); // Mock user ID
      const borrowValueUSD = amount * await this.getAssetPrice(asset);

      if (borrowValueUSD > borrowingPower) {
        throw new Error('Insufficient borrowing power');
      }

      console.log(`Borrowing ${amount} ${asset} from HyperLend`);

      // Create position record
      const position: HyperLendPosition = {
        id: `borrow-${asset}-${Date.now()}`,
        marketId: market.id,
        positionType: 'borrow',
        amount: amount,
        amountUSD: borrowValueUSD,
        interestEarned: 0, // Negative for borrowed amounts
        interestEarnedUSD: 0,
        aprAtEntry: market.borrowRateAPR,
        healthFactor: await this.calculateHealthFactor('user123'),
        liquidationPrice: await this.calculateLiquidationPrice(asset, amount),
        isActive: true,
        openedAt: new Date()
      };

      // Mock transaction hash
      return `borrow_tx_${Date.now()}`;
    } catch (error) {
      console.error('Error borrowing assets:', error);
      throw error;
    }
  }

  /**
   * Repay borrowed assets
   */
  async repay(asset: string, amount: number): Promise<string | null> {
    try {
      if (!this.isInitialized) await this.initialize();

      console.log(`Repaying ${amount} ${asset} to HyperLend`);

      // Mock transaction hash
      return `repay_tx_${Date.now()}`;
    } catch (error) {
      console.error('Error repaying assets:', error);
      throw error;
    }
  }

  /**
   * Get user positions
   */
  async getUserPositions(userAddress: string): Promise<HyperLendPosition[]> {
    try {
      // Mock user positions - would fetch from blockchain/API
      const mockPositions: HyperLendPosition[] = [
        {
          id: 'pos-supply-usdc-1',
          marketId: 'usdc-market',
          positionType: 'supply',
          amount: 10000,
          amountUSD: 10000,
          interestEarned: 425.50,
          interestEarnedUSD: 425.50,
          aprAtEntry: 4.25,
          isActive: true,
          openedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
        },
        {
          id: 'pos-borrow-eth-1',
          marketId: 'eth-market',
          positionType: 'borrow',
          amount: 2.5,
          amountUSD: 6000,
          interestEarned: -135.75, // Negative for borrowed amounts
          interestEarnedUSD: -135.75,
          aprAtEntry: 5.40,
          healthFactor: 2.15,
          liquidationPrice: 1800,
          isActive: true,
          openedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) // 15 days ago
        }
      ];

      this.userPositions.set(userAddress, mockPositions);
      return mockPositions;
    } catch (error) {
      console.error('Error getting user positions:', error);
      return [];
    }
  }

  /**
   * Calculate borrowing power for user
   */
  async getBorrowingPower(userAddress: string): Promise<number> {
    try {
      const positions = await this.getUserPositions(userAddress);
      let totalCollateralValueUSD = 0;

      positions.forEach(position => {
        if (position.positionType === 'supply' && position.isActive) {
          const market = Array.from(this.markets.values()).find(m => m.id === position.marketId);
          if (market) {
            totalCollateralValueUSD += position.amountUSD * market.collateralFactor;
          }
        }
      });

      // Subtract existing borrowings
      let totalBorrowedUSD = 0;
      positions.forEach(position => {
        if (position.positionType === 'borrow' && position.isActive) {
          totalBorrowedUSD += position.amountUSD;
        }
      });

      return Math.max(0, totalCollateralValueUSD - totalBorrowedUSD);
    } catch (error) {
      console.error('Error calculating borrowing power:', error);
      return 0;
    }
  }

  /**
   * Calculate health factor for user
   */
  async calculateHealthFactor(userAddress: string): Promise<number> {
    try {
      const positions = await this.getUserPositions(userAddress);
      let totalCollateralValueUSD = 0;
      let totalBorrowedUSD = 0;
      let weightedLiquidationThreshold = 0;

      positions.forEach(position => {
        const market = Array.from(this.markets.values()).find(m => m.id === position.marketId);
        if (!market) return;

        if (position.positionType === 'supply' && position.isActive) {
          totalCollateralValueUSD += position.amountUSD;
          weightedLiquidationThreshold += position.amountUSD * market.liquidationThreshold;
        } else if (position.positionType === 'borrow' && position.isActive) {
          totalBorrowedUSD += position.amountUSD;
        }
      });

      if (totalBorrowedUSD === 0) return Infinity;
      if (totalCollateralValueUSD === 0) return 0;

      const avgLiquidationThreshold = weightedLiquidationThreshold / totalCollateralValueUSD;
      return (totalCollateralValueUSD * avgLiquidationThreshold) / totalBorrowedUSD;
    } catch (error) {
      console.error('Error calculating health factor:', error);
      return 0;
    }
  }

  /**
   * Calculate liquidation price for a position
   */
  async calculateLiquidationPrice(asset: string, borrowAmount: number): Promise<number> {
    try {
      const market = this.getMarket(asset);
      if (!market) return 0;

      const currentPrice = await this.getAssetPrice(asset);
      const liquidationThreshold = market.liquidationThreshold;

      // Simplified liquidation price calculation
      // In reality, this would consider all collateral positions
      return currentPrice * (1 - (1 - liquidationThreshold) * 0.5);
    } catch (error) {
      console.error('Error calculating liquidation price:', error);
      return 0;
    }
  }

  /**
   * Get liquidation alerts for user
   */
  async getLiquidationAlerts(userAddress: string): Promise<LiquidationAlert[]> {
    try {
      const positions = await this.getUserPositions(userAddress);
      const alerts: LiquidationAlert[] = [];

      for (const position of positions) {
        if (position.positionType === 'borrow' && position.isActive && position.healthFactor) {
          let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
          let recommendedAction: 'add_collateral' | 'repay_debt' | 'monitor' = 'monitor';

          if (position.healthFactor < 1.1) {
            severity = 'critical';
            recommendedAction = 'repay_debt';
          } else if (position.healthFactor < 1.3) {
            severity = 'high';
            recommendedAction = 'add_collateral';
          } else if (position.healthFactor < 1.5) {
            severity = 'medium';
            recommendedAction = 'add_collateral';
          }

          if (severity !== 'low') {
            alerts.push({
              positionId: position.id,
              currentHealthFactor: position.healthFactor,
              liquidationThreshold: 1.0,
              timeToLiquidation: this.estimateTimeToLiquidation(position.healthFactor),
              recommendedAction,
              severity
            });
          }
        }
      }

      return alerts;
    } catch (error) {
      console.error('Error getting liquidation alerts:', error);
      return [];
    }
  }

  /**
   * Get market conditions overview
   */
  async getMarketConditions(): Promise<MarketConditions> {
    try {
      const markets = this.getMarkets();
      
      let totalValueLocked = 0;
      for (const market of markets) {
        const price = await this.getAssetPrice(market.symbol);
        totalValueLocked += market.totalSupply * price;
      }

      const avgSupplyAPR = markets.reduce((sum, market) => sum + market.supplyRateAPR, 0) / markets.length;
      const avgBorrowAPR = markets.reduce((sum, market) => sum + market.borrowRateAPR, 0) / markets.length;

      const topAssetsByTVL = await Promise.all(
        markets.map(async (market) => ({
          asset: market.symbol,
          tvl: market.totalSupply * await this.getAssetPrice(market.symbol),
          apr: market.supplyRateAPR
        }))
      );

      topAssetsByTVL.sort((a, b) => b.tvl - a.tvl);

      return {
        totalValueLocked,
        averageSupplyAPR: avgSupplyAPR,
        averageBorrowAPR: avgBorrowAPR,
        topAssetsByTVL: topAssetsByTVL.slice(0, 5),
        riskMetrics: {
          averageHealthFactor: 2.45, // Mock data
          liquidationVolume24h: 125000, // Mock data
          badDebtTotal: 5000 // Mock data
        }
      };
    } catch (error) {
      console.error('Error getting market conditions:', error);
      throw error;
    }
  }

  /**
   * Create automated lending strategy
   */
  async createStrategy(strategy: Omit<LendingStrategy, 'id'>): Promise<LendingStrategy> {
    const newStrategy: LendingStrategy = {
      id: `strategy-${Date.now()}`,
      ...strategy
    };

    console.log('Created lending strategy:', newStrategy);
    return newStrategy;
  }

  /**
   * Helper methods
   */
  private async getAssetPrice(symbol: string): Promise<number> {
    // Mock price data - would integrate with price oracles
    const prices: Record<string, number> = {
      'USDC': 1.00,
      'ETH': 2400,
      'BTC': 43000,
      'SOL': 65.50,
      'USDT': 1.00
    };
    return prices[symbol] || 1;
  }

  private estimateTimeToLiquidation(healthFactor: number): number {
    // Simplified estimation based on health factor
    if (healthFactor < 1.1) return 1; // 1 hour
    if (healthFactor < 1.3) return 12; // 12 hours
    if (healthFactor < 1.5) return 48; // 48 hours
    return 168; // 1 week
  }

  /**
   * Get service status
   */
  getStatus(): {
    isInitialized: boolean;
    marketsLoaded: number;
    endpoint: string;
    network: string;
  } {
    return {
      isInitialized: this.isInitialized,
      marketsLoaded: this.markets.size,
      endpoint: this.api.endpoint,
      network: this.api.network
    };
  }

  /**
   * Refresh market data
   */
  async refresh(): Promise<void> {
    await this.loadMarkets();
  }
}

// Create and export singleton instance with lazy initialization
let _hyperLendServiceInstance: HyperLendService | null = null;

export const hyperLendService = {
  get instance(): HyperLendService {
    if (!_hyperLendServiceInstance) {
      _hyperLendServiceInstance = new HyperLendService();
    }
    return _hyperLendServiceInstance;
  },
  
  // Proxy all methods
  initialize: () => hyperLendService.instance.initialize(),
  getMarkets: () => hyperLendService.instance.getMarkets(),
  getLendingRates: () => hyperLendService.instance.getLendingRates(),
  getUserPositions: (userId: string) => hyperLendService.instance.getUserPositions(userId),
  getMarketConditions: () => hyperLendService.instance.getMarketConditions(),
  getLiquidationAlerts: (userId: string) => hyperLendService.instance.getLiquidationAlerts(userId),
  calculateHealthFactor: (userId: string) => hyperLendService.instance.calculateHealthFactor(userId),
  getBorrowingPower: (userId: string) => hyperLendService.instance.getBorrowingPower(userId),
  supply: (asset: string, amount: number, useAsCollateral: boolean) => 
    hyperLendService.instance.supply(asset, amount, useAsCollateral),
  borrow: (asset: string, amount: number) => hyperLendService.instance.borrow(asset, amount)
};
export default hyperLendService;