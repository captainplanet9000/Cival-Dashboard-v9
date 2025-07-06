#!/usr/bin/env python3
# Calculate realistic agent earnings based on market research

# Market research data
market_avg_return = 0.2485  # 24.85% from research
high_performance = 0.606   # 60.6% from top algorithms
hedge_fund_avg = 0.391     # 39.1% from hedge funds

# Agent capital scenarios
capital_small = 50000      # $50K per agent
capital_medium = 100000    # $100K per agent  
capital_large = 500000     # $500K per agent

# Calculate conservative, moderate, aggressive scenarios
scenarios = {
    'Conservative (Market-like)': market_avg_return * 0.7,  # 70% of market avg
    'Moderate (Market-matching)': market_avg_return,
    'Aggressive (High-performance)': high_performance * 0.6  # 60% of top performers
}

print('CIVAL DASHBOARD AGENT EARNINGS PROJECTIONS (Annual)')
print('='*60)

for scenario, return_rate in scenarios.items():
    print(f'\n{scenario}: {return_rate:.1%} annual return')
    print(f'  $50K Agent:   ${capital_small * return_rate:,.0f}')
    print(f'  $100K Agent:  ${capital_medium * return_rate:,.0f}')
    print(f'  $500K Agent:  ${capital_large * return_rate:,.0f}')

# Farm calculations (5 agents)
print('\n\nFARM EARNINGS (5 agents per farm)')
print('='*50)

farm_sizes = [
    ('Small Farm', 5 * capital_small),
    ('Medium Farm', 5 * capital_medium),
    ('Large Farm', 5 * capital_large)
]

for farm_name, farm_capital in farm_sizes:
    print(f'\n{farm_name} (${farm_capital:,.0f} total capital):')
    for scenario, return_rate in scenarios.items():
        annual_profit = farm_capital * return_rate
        monthly_profit = annual_profit / 12
        print(f'  {scenario}: ${annual_profit:,.0f}/year (${monthly_profit:,.0f}/month)')

# Multi-farm operations
print('\n\nMULTI-FARM OPERATIONS')
print('='*30)

farm_counts = [10, 25, 50, 100]
for farm_count in farm_counts:
    print(f'\n{farm_count} Medium Farms ({farm_count * 5} agents, ${farm_count * 5 * capital_medium:,.0f} total):')
    for scenario, return_rate in scenarios.items():
        total_capital = farm_count * 5 * capital_medium
        annual_profit = total_capital * return_rate
        monthly_profit = annual_profit / 12
        print(f'  {scenario}: ${annual_profit:,.0f}/year (${monthly_profit:,.0f}/month)')

# Strategy-specific projections based on codebase analysis
print('\n\nSTRATEGY-SPECIFIC PROJECTIONS ($100K agent)')
print('='*50)

strategies = {
    'Darvas Box': {'min': 0.15, 'max': 0.25, 'trades_per_week': 3.5},
    'Williams Alligator': {'min': 0.18, 'max': 0.28, 'trades_per_week': 5},
    'Renko Breakout': {'min': 0.12, 'max': 0.22, 'trades_per_week': 2.5},
    'Heikin Ashi': {'min': 0.14, 'max': 0.24, 'trades_per_week': 4},
    'Elliott Wave': {'min': 0.10, 'max': 0.20, 'trades_per_week': 2}
}

for strategy, data in strategies.items():
    min_profit = capital_medium * data['min']
    max_profit = capital_medium * data['max']
    avg_profit = (min_profit + max_profit) / 2
    weekly_trades = data['trades_per_week']
    print(f'\n{strategy}:')
    print(f'  Annual range: ${min_profit:,.0f} - ${max_profit:,.0f}')
    print(f'  Average: ${avg_profit:,.0f}/year (${avg_profit/12:,.0f}/month)')
    print(f'  Trade frequency: {weekly_trades} trades/week')