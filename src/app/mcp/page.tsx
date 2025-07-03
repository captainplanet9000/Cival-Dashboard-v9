/**
 * MCP Dashboard Page
 * Main page for MCP (Model Context Protocol) management and monitoring
 * Provides comprehensive control interface for all MCP servers and tools
 */

import { Metadata } from 'next';
import MCPDashboard from '@/components/mcp/MCPDashboard';

export const metadata: Metadata = {
  title: 'MCP Control Center | AI Trading Dashboard',
  description: 'Model Context Protocol integration dashboard for managing AI trading agents and tools',
};

export default function MCPPage() {
  return (
    <div className="min-h-screen bg-background">
      <MCPDashboard />
    </div>
  );
}