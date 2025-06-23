"use client";

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, Brain, Settings, BarChart3, Database, Cpu, MessageSquare, Server, Code } from 'lucide-react';

// Import existing components
import { MemoryAnalyticsDashboard } from '@/components/memory/MemoryAnalyticsDashboard';
import SystemMonitoringDashboard from '@/components/monitoring/SystemMonitoringDashboard';
import AdvancedDashboardTab from '@/components/dashboard/AdvancedDashboardTab';

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
        <h2 className="text-2xl font-bold text-foreground">Advanced Analytics & AI Management</h2>
        <p className="text-sm text-muted-foreground">Phase 15-18 Implementation</p>
      </div>
      
      <Tabs defaultValue="analytics" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="themes" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Themes
          </TabsTrigger>
          <TabsTrigger value="data-pipeline" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Data Pipeline
          </TabsTrigger>
          <TabsTrigger value="ai-chat" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            AI Assistant
          </TabsTrigger>
          <TabsTrigger value="mcp-servers" className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            MCP Servers
          </TabsTrigger>
          <TabsTrigger value="python-analysis" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            Python Analysis
          </TabsTrigger>
          <TabsTrigger value="memory" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Memory
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            System
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="mt-6">
          <AdvancedDashboardTab />
        </TabsContent>

        <TabsContent value="themes" className="mt-6">
          <ThemeSelector />
        </TabsContent>

        <TabsContent value="data-pipeline" className="mt-6">
          <DataPipelineManagement />
        </TabsContent>

        <TabsContent value="ai-chat" className="mt-6">
          <ElizaAIHub />
        </TabsContent>

        <TabsContent value="mcp-servers" className="mt-6">
          <MCPServerManager />
        </TabsContent>

        <TabsContent value="python-analysis" className="mt-6">
          <PythonAnalysisPipeline />
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