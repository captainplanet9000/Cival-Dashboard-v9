/**
 * Profit Securing Service
 * Automated profit taking and portfolio management
 */

import { DailyProfit, ProfitGoal, SecuredProfit } from '@/lib/stores/app-store';

export interface ProfitRule {
  id: string;
  name: string;
  triggerType: 'percentage' | 'amount' | 'trailing' | 'time_based';
  triggerValue: number;
  securePercentage: number; // 0-100%
  destination: 'stable' | 'wallet' | 'reinvest';
  isActive: boolean;
  priority: number;
}

export interface ProfitTarget {
  id: string;
  type: 'daily' | 'weekly' | 'monthly';
  targetAmount: number;
  currentAmount: number;
  deadline: Date;
  autoSecure: boolean;
  secureThreshold: number;
}

export class ProfitSecuringService {
  private rules: Map<string, ProfitRule> = new Map();
  private targets: Map<string, ProfitTarget> = new Map();
  private isRunning: boolean = false;
  private monitorInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeDefaultRules();
  }

  async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;
    
    this.monitorInterval = setInterval(() => {
      this.checkProfitRules();
    }, 30000); // Check every 30 seconds

    console.log('Profit Securing Service started');
  }

  stop(): void {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
    this.isRunning = false;
  }

  private initializeDefaultRules(): void {
    const defaultRules: ProfitRule[] = [
      {
        id: 'secure-25-at-100',
        name: 'Secure 25% at $100 profit',
        triggerType: 'amount',
        triggerValue: 100,
        securePercentage: 25,
        destination: 'stable',
        isActive: true,
        priority: 1
      },
      {
        id: 'secure-50-at-10pct',
        name: 'Secure 50% at 10% gain',
        triggerType: 'percentage',
        triggerValue: 10,
        securePercentage: 50,
        destination: 'wallet',
        isActive: true,
        priority: 2
      }
    ];

    defaultRules.forEach(rule => this.rules.set(rule.id, rule));
  }

  private async checkProfitRules(): Promise<void> {
    // Mock profit checking - would integrate with real portfolio data
    const currentProfit = await this.getCurrentProfit();
    const activeRules = Array.from(this.rules.values()).filter(r => r.isActive);

    for (const rule of activeRules) {
      if (this.shouldTriggerRule(rule, currentProfit)) {
        await this.executeSecuring(rule, currentProfit);
      }
    }
  }

  private async getCurrentProfit(): Promise<{ amount: number; percentage: number }> {
    // Mock data - would calculate from real positions
    return {
      amount: 250 + Math.random() * 100,
      percentage: 5 + Math.random() * 10
    };
  }

  private shouldTriggerRule(rule: ProfitRule, profit: { amount: number; percentage: number }): boolean {
    switch (rule.triggerType) {
      case 'amount':
        return profit.amount >= rule.triggerValue;
      case 'percentage':
        return profit.percentage >= rule.triggerValue;
      case 'trailing':
        // Implement trailing stop logic
        return false;
      case 'time_based':
        // Implement time-based logic
        return false;
      default:
        return false;
    }
  }

  private async executeSecuring(rule: ProfitRule, profit: { amount: number; percentage: number }): Promise<void> {
    const secureAmount = profit.amount * (rule.securePercentage / 100);
    
    console.log(`Executing profit rule: ${rule.name}`);
    console.log(`Securing ${rule.securePercentage}% (${secureAmount}) to ${rule.destination}`);

    // Mock execution - would implement actual securing logic
    const secured: SecuredProfit = {
      id: `secured-${Date.now()}`,
      sourceType: 'trading',
      amountUSD: secureAmount,
      securedTo: rule.destination,
      notes: `Auto-secured via rule: ${rule.name}`,
      securedAt: new Date()
    };

    // Update rule to prevent immediate re-triggering
    rule.isActive = false;
    setTimeout(() => {
      rule.isActive = true;
    }, 300000); // Re-activate after 5 minutes
  }

  addRule(rule: Omit<ProfitRule, 'id'>): ProfitRule {
    const newRule: ProfitRule = {
      id: `rule-${Date.now()}`,
      ...rule
    };
    this.rules.set(newRule.id, newRule);
    return newRule;
  }

  getRules(): ProfitRule[] {
    return Array.from(this.rules.values());
  }

  updateRule(id: string, updates: Partial<ProfitRule>): void {
    const rule = this.rules.get(id);
    if (rule) {
      this.rules.set(id, { ...rule, ...updates });
    }
  }

  getStatus(): { isRunning: boolean; activeRules: number } {
    return {
      isRunning: this.isRunning,
      activeRules: Array.from(this.rules.values()).filter(r => r.isActive).length
    };
  }
}

// Create and export singleton instance with lazy initialization
let _profitSecuringServiceInstance: ProfitSecuringService | null = null;

export const profitSecuringService = {
  get instance(): ProfitSecuringService {
    if (!_profitSecuringServiceInstance) {
      _profitSecuringServiceInstance = new ProfitSecuringService();
    }
    return _profitSecuringServiceInstance;
  },
  
  // Proxy all methods
  start: () => profitSecuringService.instance.start(),
  stop: () => profitSecuringService.instance.stop(),
  secureProfit: (amount: number, strategy: string) => profitSecuringService.instance.secureProfit(amount, strategy),
  getSecuredProfits: () => profitSecuringService.instance.getSecuredProfits(),
  getStatus: () => profitSecuringService.instance.getStatus()
};