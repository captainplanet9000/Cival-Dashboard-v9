/**
 * Persistence Management Dashboard
 * Demonstrates and manages the persistent state system
 */

'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AgentConfigManager } from '@/components/agents/AgentConfigManager'
import { PersistentComponent, PersistentForm, PersistentInput, PersistentTable } from '@/components/persistence/PersistentComponent'
import { useAgentMemory } from '@/components/agents/AgentMemoryProvider'
import { usePersistentState, useUserPreferences, useDashboardLayout } from '@/hooks/usePersistentState'
import { persistenceManager } from '@/lib/persistence/persistence-manager'
import { Database, Brain, Settings, BarChart3, Save, RotateCcw, CheckCircle } from 'lucide-react'

export default function PersistencePage() {
  const [selectedAgent, setSelectedAgent] = useState('marcus_momentum')
  const [testData, setTestData] = usePersistentState('persistence_test', { counter: 0, message: '' })
  const { preferences, updatePreference } = useUserPreferences()
  const { layout, addWidget, removeWidget } = useDashboardLayout('persistence_demo')
  const { saveMemory, getMemory, isInitialized } = useAgentMemory()
  const [memoryTest, setMemoryTest] = useState<any>(null)

  const storageInfo = persistenceManager.getStorageInfo()

  const testAgentMemory = async () => {
    try {
      // Save test memory
      await saveMemory(selectedAgent, 'test', 'demo_memory', {
        message: 'Persistence test successful',
        timestamp: new Date().toISOString(),
        testValue: Math.random()
      }, 0.9)

      // Retrieve memory
      const memories = await getMemory(selectedAgent, 'test')
      setMemoryTest(memories)
    } catch (error) {
      console.error('Memory test failed:', error)
    }
  }

  const incrementCounter = () => {
    setTestData({
      ...testData,
      counter: testData.counter + 1,
      message: `Updated at ${new Date().toLocaleTimeString()}`
    })
  }

  const addTestWidget = () => {
    addWidget({
      id: `widget_${Date.now()}`,
      type: 'test',
      title: 'Test Widget',
      content: 'This widget state persists across page refreshes!'
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Persistence Management</h1>
          <p className="text-muted-foreground">
            Manage and test the persistent state system for Railway deployments
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={storageInfo.supabase_available ? 'default' : 'secondary'}>
            {storageInfo.supabase_available ? 'Supabase Connected' : 'Local Storage Only'}
          </Badge>
          <Badge variant={isInitialized ? 'default' : 'destructive'}>
            {isInitialized ? 'Memory System Active' : 'Memory System Offline'}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Status</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Supabase</span>
                <Badge variant={storageInfo.supabase_available ? 'default' : 'secondary'}>
                  {storageInfo.supabase_available ? 'Available' : 'Offline'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">LocalStorage</span>
                <Badge variant={storageInfo.localStorage_available ? 'default' : 'destructive'}>
                  {storageInfo.localStorage_available ? 'Available' : 'Offline'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Session Storage</span>
                <Badge variant={storageInfo.sessionStorage_available ? 'default' : 'destructive'}>
                  {storageInfo.sessionStorage_available ? 'Available' : 'Offline'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agent Memory</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button onClick={testAgentMemory} size="sm" className="w-full">
                Test Agent Memory
              </Button>
              {memoryTest && (
                <div className="text-xs text-green-600">
                  <CheckCircle className="h-3 w-3 inline mr-1" />
                  {memoryTest.length} memories retrieved
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">State Test</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">{testData.counter}</div>
              <Button onClick={incrementCounter} size="sm" className="w-full">
                Increment Counter
              </Button>
              {testData.message && (
                <div className="text-xs text-muted-foreground">
                  {testData.message}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Alert>
        <Database className="h-4 w-4" />
        <AlertDescription>
          All state changes on this page persist across browser refreshes and Railway deployments. 
          Try refreshing the page to see your data maintained.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="agents" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="agents">Agent Configs</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard State</TabsTrigger>
          <TabsTrigger value="preferences">User Preferences</TabsTrigger>
          <TabsTrigger value="demo">Live Demo</TabsTrigger>
        </TabsList>

        <TabsContent value="agents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agent Configuration Management</CardTitle>
              <CardDescription>
                Configure persistent agent settings that survive Railway deployments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium">Select Agent:</label>
                  <select 
                    value={selectedAgent}
                    onChange={(e) => setSelectedAgent(e.target.value)}
                    className="px-3 py-1 border rounded-md"
                  >
                    <option value="marcus_momentum">Marcus Momentum</option>
                    <option value="alex_arbitrage">Alex Arbitrage</option>
                    <option value="sophia_reversion">Sophia Reversion</option>
                  </select>
                </div>
                
                <AgentConfigManager 
                  agentId={selectedAgent}
                  onConfigSaved={(config) => {
                    console.log('Agent config saved:', config)
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dashboard Layout Persistence</CardTitle>
              <CardDescription>
                Dashboard widget positions and settings are automatically saved
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button onClick={addTestWidget} size="sm">
                    Add Test Widget
                  </Button>
                  <Button 
                    onClick={() => layout.widgets.forEach((w: any) => removeWidget(w.id))} 
                    variant="outline" 
                    size="sm"
                  >
                    Clear All Widgets
                  </Button>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  Current Layout: {layout.widgets.length} widgets
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {layout.widgets.map((widget: any) => (
                    <Card key={widget.id}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-sm">{widget.title}</CardTitle>
                          <Button 
                            onClick={() => removeWidget(widget.id)}
                            variant="ghost" 
                            size="sm"
                          >
                            ×
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{widget.content}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Preferences</CardTitle>
              <CardDescription>
                Global user settings that persist across sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {preferences && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Theme</label>
                      <select 
                        value={preferences.theme}
                        onChange={(e) => updatePreference('theme', e.target.value)}
                        className="w-full px-3 py-1 border rounded-md"
                      >
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                        <option value="system">System</option>
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Dashboard Layout</label>
                      <select 
                        value={preferences.dashboard_layout}
                        onChange={(e) => updatePreference('dashboard_layout', e.target.value)}
                        className="w-full px-3 py-1 border rounded-md"
                      >
                        <option value="grid">Grid</option>
                        <option value="list">List</option>
                        <option value="compact">Compact</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Default Timeframe</label>
                    <select 
                      value={preferences.default_timeframe}
                      onChange={(e) => updatePreference('default_timeframe', e.target.value)}
                      className="w-full px-3 py-1 border rounded-md"
                    >
                      <option value="1h">1 Hour</option>
                      <option value="4h">4 Hours</option>
                      <option value="1d">Daily</option>
                      <option value="1w">Weekly</option>
                    </select>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    Preferences are automatically saved and will persist across Railway deployments
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="demo" className="space-y-4">
          <PersistentComponent componentId="demo_component" initialState={{ notes: '', counter: 0 }}>
            <Card>
              <CardHeader>
                <CardTitle>Live Persistence Demo</CardTitle>
                <CardDescription>
                  This component automatically saves its state. Try refreshing the page!
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PersistentForm formId="demo_form">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Persistent Notes</label>
                      <PersistentInput 
                        name="notes"
                        placeholder="Type something here... it will persist!"
                        className="w-full px-3 py-2 border rounded-md"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Email</label>
                      <PersistentInput 
                        name="email"
                        type="email"
                        placeholder="your@email.com"
                        className="w-full px-3 py-2 border rounded-md"
                      />
                    </div>
                    
                    <Button type="submit">
                      Submit (Form data persists)
                    </Button>
                    
                    <div className="text-xs text-muted-foreground">
                      All form data automatically saves as you type and persists across page refreshes
                    </div>
                  </div>
                </PersistentForm>
              </CardContent>
            </Card>
          </PersistentComponent>
        </TabsContent>
      </Tabs>
    </div>
  )
}