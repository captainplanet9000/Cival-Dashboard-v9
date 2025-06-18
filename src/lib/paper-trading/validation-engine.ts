// Paper Trading Validation Engine
import type {
  AgentPaperTradingStrategy,
  AgentPaperOrderRequest,
  AgentPaperTradingConfig,
  AgentPaperTradingAccount
} from '@/types/agent-paper-trading';

export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  category: 'risk' | 'logic' | 'performance' | 'compliance';
  severity: 'error' | 'warning' | 'info';
  validate: (input: any) => ValidationResult;
}

export interface ValidationResult {
  passed: boolean;
  message: string;
  details?: any;
  suggestedFix?: string;
}

export interface ValidationReport {
  overall: 'passed' | 'failed' | 'warning';
  score: number; // 0-100
  summary: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
  };
  results: Array<{
    rule: ValidationRule;
    result: ValidationResult;
  }>;
  recommendations: string[];
  blockers: string[]; // Issues that prevent execution
}

export class PaperTradingValidationEngine {
  private rules: Map<string, ValidationRule> = new Map();

  constructor() {
    this.initializeDefaultRules();
  }

  private initializeDefaultRules(): void {
    // Strategy Validation Rules
    this.addRule({
      id: 'strategy_has_entry_conditions',
      name: 'Entry Conditions Required',
      description: 'Strategy must have at least one entry condition',
      category: 'logic',
      severity: 'error',
      validate: (strategy: AgentPaperTradingStrategy) => {
        const hasConditions = strategy.entry_conditions && strategy.entry_conditions.length > 0;
        return {
          passed: hasConditions,
          message: hasConditions ? 
            'Strategy has entry conditions' : 
            'Strategy must define entry conditions',
          suggestedFix: 'Add entry conditions to strategy configuration'
        };
      }
    });

    this.addRule({
      id: 'strategy_has_exit_conditions',
      name: 'Exit Conditions Required',
      description: 'Strategy must have at least one exit condition',
      category: 'logic',
      severity: 'error',
      validate: (strategy: AgentPaperTradingStrategy) => {
        const hasConditions = strategy.exit_conditions && strategy.exit_conditions.length > 0;
        return {
          passed: hasConditions,
          message: hasConditions ? 
            'Strategy has exit conditions' : 
            'Strategy must define exit conditions',
          suggestedFix: 'Add exit conditions to strategy configuration'
        };
      }
    });

    this.addRule({
      id: 'strategy_has_risk_rules',
      name: 'Risk Management Rules',
      description: 'Strategy should have risk management rules',
      category: 'risk',
      severity: 'warning',
      validate: (strategy: AgentPaperTradingStrategy) => {
        const hasRules = strategy.risk_management_rules && strategy.risk_management_rules.length > 0;
        return {
          passed: hasRules,
          message: hasRules ? 
            'Strategy has risk management rules' : 
            'Strategy should include risk management rules',
          suggestedFix: 'Add stop-loss, position sizing, and risk limit rules'
        };
      }
    });

    this.addRule({
      id: 'strategy_parameters_valid',
      name: 'Parameter Validation',
      description: 'Strategy parameters must be valid and reasonable',
      category: 'logic',
      severity: 'warning',
      validate: (strategy: AgentPaperTradingStrategy) => {
        if (!strategy.parameters || Object.keys(strategy.parameters).length === 0) {
          return {
            passed: false,
            message: 'Strategy has no parameters defined',
            suggestedFix: 'Define strategy parameters'
          };
        }

        // Check for reasonable values
        const issues: string[] = [];
        Object.entries(strategy.parameters).forEach(([key, value]) => {
          if (typeof value === 'number') {
            if (value <= 0) {
              issues.push(`${key} should be positive`);
            }
            if (value > 1000) {
              issues.push(`${key} seems unusually large`);
            }
          }
        });

        return {
          passed: issues.length === 0,
          message: issues.length === 0 ? 
            'All parameters are valid' : 
            `Parameter issues: ${issues.join(', ')}`,
          details: { issues },
          suggestedFix: 'Review and adjust parameter values'
        };
      }
    });

    // Order Validation Rules
    this.addRule({
      id: 'order_quantity_positive',
      name: 'Positive Order Quantity',
      description: 'Order quantity must be positive',
      category: 'logic',
      severity: 'error',
      validate: (order: AgentPaperOrderRequest) => {
        const isPositive = order.quantity > 0;
        return {
          passed: isPositive,
          message: isPositive ? 
            'Order quantity is positive' : 
            'Order quantity must be greater than zero',
          suggestedFix: 'Set a positive quantity value'
        };
      }
    });

    this.addRule({
      id: 'order_symbol_valid',
      name: 'Valid Trading Symbol',
      description: 'Order must have a valid trading symbol',
      category: 'logic',
      severity: 'error',
      validate: (order: AgentPaperOrderRequest) => {
        const hasSymbol = order.symbol && order.symbol.length > 0;
        const validFormat = hasSymbol && /^[A-Z0-9\/\-_]+$/.test(order.symbol);
        return {
          passed: hasSymbol && validFormat,
          message: hasSymbol && validFormat ? 
            'Order symbol is valid' : 
            'Order must have a valid trading symbol',
          suggestedFix: 'Use standard trading symbol format (e.g., BTC/USD, AAPL)'
        };
      }
    });

    this.addRule({
      id: 'limit_order_has_price',
      name: 'Limit Order Price Required',
      description: 'Limit orders must have a price specified',
      category: 'logic',
      severity: 'error',
      validate: (order: AgentPaperOrderRequest) => {
        if (order.order_type !== 'limit') {
          return { passed: true, message: 'Not a limit order' };
        }
        
        const hasPrice = order.price && order.price > 0;
        return {
          passed: hasPrice,
          message: hasPrice ? 
            'Limit order has valid price' : 
            'Limit orders must specify a positive price',
          suggestedFix: 'Set a positive price for limit orders'
        };
      }
    });

    // Account Configuration Rules
    this.addRule({
      id: 'account_initial_balance_valid',
      name: 'Valid Initial Balance',
      description: 'Account must have a positive initial balance',
      category: 'risk',
      severity: 'error',
      validate: (config: AgentPaperTradingConfig) => {
        const isValid = config.initial_balance > 0;
        return {
          passed: isValid,
          message: isValid ? 
            'Initial balance is valid' : 
            'Initial balance must be positive',
          suggestedFix: 'Set a positive initial balance (e.g., 10000)'
        };
      }
    });

    this.addRule({
      id: 'account_max_drawdown_reasonable',
      name: 'Reasonable Max Drawdown',
      description: 'Maximum drawdown should be reasonable (5-50%)',
      category: 'risk',
      severity: 'warning',
      validate: (config: AgentPaperTradingConfig) => {
        const isReasonable = config.max_drawdown_percent >= 5 && config.max_drawdown_percent <= 50;
        return {
          passed: isReasonable,
          message: isReasonable ? 
            'Max drawdown is reasonable' : 
            `Max drawdown of ${config.max_drawdown_percent}% may be too ${config.max_drawdown_percent < 5 ? 'low' : 'high'}`,
          suggestedFix: 'Set max drawdown between 5-50%'
        };
      }
    });

    this.addRule({
      id: 'account_position_size_reasonable',
      name: 'Reasonable Position Size Limit',
      description: 'Maximum position size should be reasonable (5-50%)',
      category: 'risk',
      severity: 'warning',
      validate: (config: AgentPaperTradingConfig) => {
        const isReasonable = config.max_position_size_percent >= 5 && config.max_position_size_percent <= 50;
        return {
          passed: isReasonable,
          message: isReasonable ? 
            'Position size limit is reasonable' : 
            `Position size limit of ${config.max_position_size_percent}% may be too ${config.max_position_size_percent < 5 ? 'low' : 'high'}`,
          suggestedFix: 'Set position size limit between 5-50%'
        };
      }
    });

    this.addRule({
      id: 'account_has_allowed_symbols',
      name: 'Allowed Symbols Defined',
      description: 'Account should specify allowed trading symbols',
      category: 'compliance',
      severity: 'warning',
      validate: (config: AgentPaperTradingConfig) => {
        const hasSymbols = config.allowed_symbols && config.allowed_symbols.length > 0;
        return {
          passed: hasSymbols,
          message: hasSymbols ? 
            `Account allows trading ${config.allowed_symbols.length} symbols` : 
            'No allowed symbols specified',
          suggestedFix: 'Define list of allowed trading symbols'
        };
      }
    });

    this.addRule({
      id: 'account_daily_trade_limit_reasonable',
      name: 'Reasonable Daily Trade Limit',
      description: 'Daily trade limit should be reasonable (1-100)',
      category: 'risk',
      severity: 'info',
      validate: (config: AgentPaperTradingConfig) => {
        const isReasonable = config.max_daily_trades >= 1 && config.max_daily_trades <= 100;
        return {
          passed: isReasonable,
          message: isReasonable ? 
            'Daily trade limit is reasonable' : 
            `Daily trade limit of ${config.max_daily_trades} may be ${config.max_daily_trades < 1 ? 'too low' : 'too high'}`,
          suggestedFix: 'Set daily trade limit between 1-100'
        };
      }
    });

    // Risk Management Rules
    this.addRule({
      id: 'position_size_within_limits',
      name: 'Position Size Within Limits',
      description: 'Position size should not exceed account limits',
      category: 'risk',
      severity: 'error',
      validate: (context: { order: AgentPaperOrderRequest; account: AgentPaperTradingAccount; marketPrice: number }) => {
        const orderValue = context.order.quantity * context.marketPrice;
        const maxPositionValue = context.account.total_equity * (context.account.config.max_position_size_percent / 100);
        const withinLimits = orderValue <= maxPositionValue;
        
        return {
          passed: withinLimits,
          message: withinLimits ? 
            'Position size within limits' : 
            `Position size of $${orderValue.toFixed(2)} exceeds limit of $${maxPositionValue.toFixed(2)}`,
          details: { orderValue, maxPositionValue },
          suggestedFix: 'Reduce order quantity or increase position size limit'
        };
      }
    });

    this.addRule({
      id: 'sufficient_buying_power',
      name: 'Sufficient Buying Power',
      description: 'Account must have sufficient buying power for buy orders',
      category: 'risk',
      severity: 'error',
      validate: (context: { order: AgentPaperOrderRequest; account: AgentPaperTradingAccount; marketPrice: number }) => {
        if (context.order.side === 'sell') {
          return { passed: true, message: 'Sell order - no buying power check needed' };
        }
        
        const orderValue = context.order.quantity * context.marketPrice;
        const hasSufficientFunds = context.account.available_buying_power >= orderValue;
        
        return {
          passed: hasSufficientFunds,
          message: hasSufficientFunds ? 
            'Sufficient buying power available' : 
            `Insufficient buying power: need $${orderValue.toFixed(2)}, have $${context.account.available_buying_power.toFixed(2)}`,
          details: { required: orderValue, available: context.account.available_buying_power },
          suggestedFix: 'Reduce order size or add funds to account'
        };
      }
    });
  }

  // Rule Management
  addRule(rule: ValidationRule): void {
    this.rules.set(rule.id, rule);
  }

  removeRule(ruleId: string): boolean {
    return this.rules.delete(ruleId);
  }

  getRule(ruleId: string): ValidationRule | undefined {
    return this.rules.get(ruleId);
  }

  getAllRules(): ValidationRule[] {
    return Array.from(this.rules.values());
  }

  getRulesByCategory(category: ValidationRule['category']): ValidationRule[] {
    return this.getAllRules().filter(rule => rule.category === category);
  }

  // Validation Methods
  validateStrategy(strategy: AgentPaperTradingStrategy): ValidationReport {
    const strategyRules = this.getAllRules().filter(rule => 
      ['strategy_has_entry_conditions', 'strategy_has_exit_conditions', 'strategy_has_risk_rules', 'strategy_parameters_valid'].includes(rule.id)
    );

    return this.runValidation(strategy, strategyRules);
  }

  validateOrder(order: AgentPaperOrderRequest): ValidationReport {
    const orderRules = this.getAllRules().filter(rule => 
      ['order_quantity_positive', 'order_symbol_valid', 'limit_order_has_price'].includes(rule.id)
    );

    return this.runValidation(order, orderRules);
  }

  validateOrderWithContext(
    order: AgentPaperOrderRequest,
    account: AgentPaperTradingAccount,
    marketPrice: number
  ): ValidationReport {
    const basicValidation = this.validateOrder(order);
    
    const contextRules = this.getAllRules().filter(rule => 
      ['position_size_within_limits', 'sufficient_buying_power'].includes(rule.id)
    );

    const context = { order, account, marketPrice };
    const contextValidation = this.runValidation(context, contextRules);

    // Merge results
    return this.mergeValidationReports(basicValidation, contextValidation);
  }

  validateAccountConfig(config: AgentPaperTradingConfig): ValidationReport {
    const configRules = this.getAllRules().filter(rule => 
      rule.id.startsWith('account_')
    );

    return this.runValidation(config, configRules);
  }

  validateCompleteSetup(
    strategy: AgentPaperTradingStrategy,
    config: AgentPaperTradingConfig
  ): ValidationReport {
    const strategyValidation = this.validateStrategy(strategy);
    const configValidation = this.validateAccountConfig(config);

    return this.mergeValidationReports(strategyValidation, configValidation);
  }

  // Core Validation Logic
  private runValidation(input: any, rules: ValidationRule[]): ValidationReport {
    const results: Array<{ rule: ValidationRule; result: ValidationResult }> = [];
    let totalScore = 0;
    let maxScore = 0;

    for (const rule of rules) {
      try {
        const result = rule.validate(input);
        results.push({ rule, result });

        // Calculate score
        const ruleWeight = this.getRuleWeight(rule);
        maxScore += ruleWeight;
        
        if (result.passed) {
          totalScore += ruleWeight;
        } else if (rule.severity === 'warning') {
          totalScore += ruleWeight * 0.5; // Partial credit for warnings
        }
      } catch (error) {
        results.push({
          rule,
          result: {
            passed: false,
            message: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            suggestedFix: 'Check rule implementation'
          }
        });
      }
    }

    const score = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 100;
    
    const summary = {
      total: results.length,
      passed: results.filter(r => r.result.passed).length,
      failed: results.filter(r => !r.result.passed && r.rule.severity === 'error').length,
      warnings: results.filter(r => !r.result.passed && r.rule.severity === 'warning').length
    };

    const blockers = results
      .filter(r => !r.result.passed && r.rule.severity === 'error')
      .map(r => r.result.message);

    const overall = blockers.length > 0 ? 'failed' : 
                   summary.warnings > 0 ? 'warning' : 'passed';

    return {
      overall,
      score,
      summary,
      results,
      recommendations: this.generateRecommendations(results),
      blockers
    };
  }

  private getRuleWeight(rule: ValidationRule): number {
    switch (rule.severity) {
      case 'error': return 100;
      case 'warning': return 50;
      case 'info': return 25;
      default: return 50;
    }
  }

  private generateRecommendations(results: Array<{ rule: ValidationRule; result: ValidationResult }>): string[] {
    const recommendations: string[] = [];
    
    const failedCriticalRules = results.filter(r => 
      !r.result.passed && r.rule.severity === 'error'
    );

    if (failedCriticalRules.length > 0) {
      recommendations.push('Fix critical errors before proceeding with paper trading');
    }

    const warningRules = results.filter(r => 
      !r.result.passed && r.rule.severity === 'warning'
    );

    if (warningRules.length > 2) {
      recommendations.push('Address warning messages to improve strategy robustness');
    }

    // Category-specific recommendations
    const riskIssues = results.filter(r => 
      !r.result.passed && r.rule.category === 'risk'
    );

    if (riskIssues.length > 0) {
      recommendations.push('Review and strengthen risk management controls');
    }

    const logicIssues = results.filter(r => 
      !r.result.passed && r.rule.category === 'logic'
    );

    if (logicIssues.length > 0) {
      recommendations.push('Verify strategy logic and implementation');
    }

    return recommendations;
  }

  private mergeValidationReports(report1: ValidationReport, report2: ValidationReport): ValidationReport {
    const combinedResults = [...report1.results, ...report2.results];
    
    const summary = {
      total: combinedResults.length,
      passed: combinedResults.filter(r => r.result.passed).length,
      failed: combinedResults.filter(r => !r.result.passed && r.rule.severity === 'error').length,
      warnings: combinedResults.filter(r => !r.result.passed && r.rule.severity === 'warning').length
    };

    const score = Math.round((report1.score + report2.score) / 2);
    const blockers = [...report1.blockers, ...report2.blockers];
    const recommendations = [...new Set([...report1.recommendations, ...report2.recommendations])];

    const overall = blockers.length > 0 ? 'failed' : 
                   summary.warnings > 0 ? 'warning' : 'passed';

    return {
      overall,
      score,
      summary,
      results: combinedResults,
      recommendations,
      blockers
    };
  }

  // Quick Validation Methods
  canExecuteOrder(order: AgentPaperOrderRequest, account: AgentPaperTradingAccount, marketPrice: number): boolean {
    const validation = this.validateOrderWithContext(order, account, marketPrice);
    return validation.overall !== 'failed';
  }

  isStrategyReady(strategy: AgentPaperTradingStrategy): boolean {
    const validation = this.validateStrategy(strategy);
    return validation.overall !== 'failed';
  }

  getQuickValidationSummary(input: any, type: 'strategy' | 'order' | 'config'): string {
    let validation: ValidationReport;
    
    switch (type) {
      case 'strategy':
        validation = this.validateStrategy(input);
        break;
      case 'config':
        validation = this.validateAccountConfig(input);
        break;
      case 'order':
        validation = this.validateOrder(input);
        break;
      default:
        return 'Unknown validation type';
    }

    if (validation.overall === 'passed') {
      return `✅ Validation passed (${validation.score}/100)`;
    } else if (validation.overall === 'warning') {
      return `⚠️ Validation passed with warnings (${validation.score}/100) - ${validation.summary.warnings} warnings`;
    } else {
      return `❌ Validation failed (${validation.score}/100) - ${validation.summary.failed} errors`;
    }
  }
}

// Singleton instance
export const paperTradingValidationEngine = new PaperTradingValidationEngine();

// Factory function
export function createPaperTradingValidationEngine(): PaperTradingValidationEngine {
  return new PaperTradingValidationEngine();
}