"use client";

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, Brain, Settings, BarChart3, Database, Cpu, MessageSquare, Server, Code } from 'lucide-react';

// Import existing components
import { MemoryAnalyticsDashboard } from '@/components/memory/MemoryAnalyticsDashboard';
import SystemMonitoringDashboard from '@/components/monitoring/SystemMonitoringDashboard';
import QueueMonitoringDashboard from '@/components/monitoring/QueueMonitoringDashboard';
import V7DashboardContent from '@/components/dashboard/V7DashboardContent';

// Import new service components
import DataPipelineManagement from '@/components/advanced/DataPipelineManagement';
import ElizaAIHub from '@/components/advanced/ElizaAIHub';
import MCPServerManager from '@/components/advanced/MCPServerManager';
import PythonAnalysisPipeline from '@/components/advanced/PythonAnalysisPipeline';

// Import theme selector
import { ThemeSelector } from '@/components/theme/theme-selector';

export default function AdvancedConsolidatedTab() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Trading Platform</h2>
        <p className="text-sm text-muted-foreground">AI-Powered Trading Dashboard</p>
      </div>
      
      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="trading" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Trading
          </TabsTrigger>
          <TabsTrigger value="agents" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Agents
          </TabsTrigger>
          <TabsTrigger value="farms" className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            Farms
          </TabsTrigger>
          <TabsTrigger value="goals" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Goals
          </TabsTrigger>
          <TabsTrigger value="vault" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Vault
          </TabsTrigger>
          <TabsTrigger value="memory" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Memory
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            System
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          <V7DashboardContent />
        </TabsContent>

        <TabsContent value="trading" className="mt-6">
          <div>Trading Dashboard - Coming Soon</div>
        </TabsContent>

        <TabsContent value="agents" className="mt-6">
          <div>AI Agents Dashboard - Coming Soon</div>
        </TabsContent>

        <TabsContent value="farms" className="mt-6">
          <div>Farms Dashboard - Coming Soon</div>
        </TabsContent>

        <TabsContent value="goals" className="mt-6">
          <div>Goals Dashboard - Coming Soon</div>
        </TabsContent>

        <TabsContent value="vault" className="mt-6">
          <div>Vault Dashboard - Coming Soon</div>
        </TabsContent>

        <TabsContent value="memory" className="mt-6">
          <MemoryAnalyticsDashboard />
        </TabsContent>

        <TabsContent value="system" className="mt-6">
          <SystemMonitoringDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}