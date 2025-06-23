/**
 * AI Agent Farm Management Page
 * Complete agent farm with paper trading, goals, and graduation system
 */

import AgentFarmDashboard from '@/components/paper-trading/AgentFarmDashboard'

export default function AgentsPage() {
  return <AgentFarmDashboard />
}

export const metadata = {
  title: 'Agent Farm Dashboard | AI Trading Agents',
  description: 'Manage and monitor your AI trading agents, track performance, and handle graduations to real capital.',
}