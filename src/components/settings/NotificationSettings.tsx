'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Bell, Plus, Trash2, TestTube, MessageSquare, Mail,
  Smartphone, Webhook, Settings, Clock, Shield
} from 'lucide-react'
import { toast } from 'react-hot-toast'

// Import notification service
import { 
  appriseNotificationService, 
  useNotifications,
  NotificationChannel,
  NotificationPreferences,
  NotificationFilter
} from '@/lib/notifications/apprise-service'

interface NotificationSettingsProps {
  className?: string
}

export function NotificationSettings({ className }: NotificationSettingsProps) {
  const [preferences, setPreferences] = useState<NotificationPreferences>()
  const [newChannel, setNewChannel] = useState<Partial<NotificationChannel>>({
    name: '',
    type: 'discord',
    url: '',
    enabled: true,
    priority: 'normal'
  })
  const [showAddChannel, setShowAddChannel] = useState(false)
  const [testingChannel, setTestingChannel] = useState<string | null>(null)

  const { sendNotification, getPreferences, savePreferences } = useNotifications()

  // Load preferences on mount
  useEffect(() => {
    const currentPrefs = getPreferences()
    setPreferences(currentPrefs)
  }, [])

  // Save preferences when they change
  const handleSavePreferences = (newPrefs: NotificationPreferences) => {
    setPreferences(newPrefs)
    savePreferences(newPrefs)
    toast.success('Notification preferences saved')
  }

  // Add new channel
  const handleAddChannel = () => {
    if (!newChannel.name || !newChannel.url) {
      toast.error('Please fill in channel name and URL')
      return
    }

    const channel: NotificationChannel = {
      id: `channel_${Date.now()}`,
      name: newChannel.name,
      type: newChannel.type as any,
      url: newChannel.url,
      enabled: newChannel.enabled || true,
      priority: newChannel.priority || 'normal',
      filters: []
    }

    const updatedPrefs = {
      ...preferences!,
      channels: [...(preferences?.channels || []), channel]
    }

    handleSavePreferences(updatedPrefs)
    
    setNewChannel({
      name: '',
      type: 'discord',
      url: '',
      enabled: true,
      priority: 'normal'
    })
    setShowAddChannel(false)
    toast.success('Channel added successfully')
  }

  // Remove channel
  const handleRemoveChannel = (channelId: string) => {
    const updatedPrefs = {
      ...preferences!,
      channels: preferences!.channels.filter(c => c.id !== channelId)
    }
    handleSavePreferences(updatedPrefs)
    toast.success('Channel removed')
  }

  // Toggle channel enabled status
  const handleToggleChannel = (channelId: string) => {
    const updatedPrefs = {
      ...preferences!,
      channels: preferences!.channels.map(c => 
        c.id === channelId ? { ...c, enabled: !c.enabled } : c
      )
    }
    handleSavePreferences(updatedPrefs)
  }

  // Test channel
  const handleTestChannel = async (channelId: string) => {
    setTestingChannel(channelId)
    
    try {
      const result = await sendNotification({
        title: 'Test Notification',
        body: 'This is a test message from Cival Trading Dashboard to verify your notification channel is working correctly.',
        type: 'system',
        priority: 'normal',
        timestamp: new Date(),
        channels: [channelId]
      })

      if (result.success) {
        toast.success('Test notification sent successfully')
      } else {
        toast.error('Test notification failed')
      }
    } catch (error) {
      toast.error('Test notification failed')
    } finally {
      setTestingChannel(null)
    }
  }

  // Get channel type icon
  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'discord': return <MessageSquare className="h-4 w-4" />
      case 'telegram': return <MessageSquare className="h-4 w-4" />
      case 'slack': return <MessageSquare className="h-4 w-4" />
      case 'email': return <Mail className="h-4 w-4" />
      case 'sms': return <Smartphone className="h-4 w-4" />
      case 'webhook': return <Webhook className="h-4 w-4" />
      default: return <Bell className="h-4 w-4" />
    }
  }

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'emergency': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'normal': return 'bg-blue-100 text-blue-800'
      case 'low': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (!preferences) {
    return <div>Loading notification settings...</div>
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Bell className="h-5 w-5 text-blue-600" />
            Notification Settings
          </h3>
          <p className="text-sm text-muted-foreground">
            Configure multi-channel notifications for trading alerts and system events
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={preferences.globalEnabled ? 'default' : 'secondary'}>
            {preferences.globalEnabled ? 'Enabled' : 'Disabled'}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="channels">Channels</TabsTrigger>
          <TabsTrigger value="filters">Filters</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>General Notification Settings</CardTitle>
              <CardDescription>
                Control overall notification behavior and default settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Global Enable/Disable */}
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="global-notifications">Enable Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Master switch for all notification channels
                  </p>
                </div>
                <Switch
                  id="global-notifications"
                  checked={preferences.globalEnabled}
                  onCheckedChange={(checked) => 
                    handleSavePreferences({ ...preferences, globalEnabled: checked })
                  }
                />
              </div>

              {/* Emergency Only Mode */}
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="emergency-only">Emergency Only Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Only send emergency priority notifications
                  </p>
                </div>
                <Switch
                  id="emergency-only"
                  checked={preferences.emergencyOnly}
                  onCheckedChange={(checked) => 
                    handleSavePreferences({ ...preferences, emergencyOnly: checked })
                  }
                />
              </div>

              {/* Default Priority */}
              <div className="space-y-2">
                <Label>Default Priority</Label>
                <Select
                  value={preferences.defaultPriority}
                  onValueChange={(value: any) => 
                    handleSavePreferences({ ...preferences, defaultPriority: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low Priority</SelectItem>
                    <SelectItem value="normal">Normal Priority</SelectItem>
                    <SelectItem value="high">High Priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Quiet Hours */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Quiet Hours
              </CardTitle>
              <CardDescription>
                Disable non-emergency notifications during specific hours
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Enable Quiet Hours</Label>
                <Switch
                  checked={preferences.quietHours?.enabled || false}
                  onCheckedChange={(checked) => 
                    handleSavePreferences({
                      ...preferences,
                      quietHours: { ...preferences.quietHours!, enabled: checked }
                    })
                  }
                />
              </div>

              {preferences.quietHours?.enabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Start Time</Label>
                    <Input
                      type="time"
                      value={preferences.quietHours.start}
                      onChange={(e) => 
                        handleSavePreferences({
                          ...preferences,
                          quietHours: { ...preferences.quietHours!, start: e.target.value }
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>End Time</Label>
                    <Input
                      type="time"
                      value={preferences.quietHours.end}
                      onChange={(e) => 
                        handleSavePreferences({
                          ...preferences,
                          quietHours: { ...preferences.quietHours!, end: e.target.value }
                        })
                      }
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Channels */}
        <TabsContent value="channels" className="space-y-4">
          {/* Add Channel */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Notification Channels</CardTitle>
                  <CardDescription>
                    Configure Discord, Telegram, Slack, email, and other notification channels
                  </CardDescription>
                </div>
                <Button onClick={() => setShowAddChannel(!showAddChannel)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Channel
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {showAddChannel && (
                <div className="space-y-4 p-4 border rounded-lg bg-gray-50 mb-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Channel Name</Label>
                      <Input
                        placeholder="My Discord Server"
                        value={newChannel.name}
                        onChange={(e) => setNewChannel({ ...newChannel, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Channel Type</Label>
                      <Select
                        value={newChannel.type}
                        onValueChange={(value: any) => setNewChannel({ ...newChannel, type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="discord">Discord</SelectItem>
                          <SelectItem value="telegram">Telegram</SelectItem>
                          <SelectItem value="slack">Slack</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="webhook">Webhook</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Channel URL/Address</Label>
                    <Input
                      placeholder="https://discord.com/api/webhooks/..."
                      value={newChannel.url}
                      onChange={(e) => setNewChannel({ ...newChannel, url: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {newChannel.type === 'discord' && 'Discord webhook URL'}
                      {newChannel.type === 'telegram' && 'Format: telegram://BOT_TOKEN/CHAT_ID'}
                      {newChannel.type === 'slack' && 'Slack webhook URL'}
                      {newChannel.type === 'email' && 'Email address'}
                      {newChannel.type === 'webhook' && 'Custom webhook URL'}
                    </p>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowAddChannel(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddChannel}>
                      Add Channel
                    </Button>
                  </div>
                </div>
              )}

              {/* Channel List */}
              <div className="space-y-3">
                {preferences.channels.map((channel) => (
                  <div key={channel.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {getChannelIcon(channel.type)}
                        <div>
                          <div className="font-medium">{channel.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {channel.type} • {channel.url.substring(0, 50)}...
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge className={getPriorityColor(channel.priority)} variant="secondary">
                        {channel.priority}
                      </Badge>
                      <Switch
                        checked={channel.enabled}
                        onCheckedChange={() => handleToggleChannel(channel.id)}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTestChannel(channel.id)}
                        disabled={testingChannel === channel.id}
                      >
                        {testingChannel === channel.id ? (
                          <TestTube className="h-4 w-4 animate-pulse" />
                        ) : (
                          <TestTube className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemoveChannel(channel.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                {preferences.channels.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No notification channels configured</p>
                    <p className="text-sm">Add your first channel to start receiving notifications</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Filters */}
        <TabsContent value="filters" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Filters</CardTitle>
              <CardDescription>
                Configure which types of notifications to receive on each channel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Filter configuration coming soon</p>
                <p className="text-sm">Advanced filtering options will be available in the next update</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced */}
        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Rate Limiting
              </CardTitle>
              <CardDescription>
                Prevent notification spam with rate limiting controls
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Enable Rate Limiting</Label>
                <Switch
                  checked={preferences.rateLimiting?.enabled || false}
                  onCheckedChange={(checked) => 
                    handleSavePreferences({
                      ...preferences,
                      rateLimiting: { ...preferences.rateLimiting!, enabled: checked }
                    })
                  }
                />
              </div>

              {preferences.rateLimiting?.enabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Max Per Hour</Label>
                    <Input
                      type="number"
                      value={preferences.rateLimiting.maxPerHour}
                      onChange={(e) => 
                        handleSavePreferences({
                          ...preferences,
                          rateLimiting: { 
                            ...preferences.rateLimiting!, 
                            maxPerHour: parseInt(e.target.value) 
                          }
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Max Per Day</Label>
                    <Input
                      type="number"
                      value={preferences.rateLimiting.maxPerDay}
                      onChange={(e) => 
                        handleSavePreferences({
                          ...preferences,
                          rateLimiting: { 
                            ...preferences.rateLimiting!, 
                            maxPerDay: parseInt(e.target.value) 
                          }
                        })
                      }
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}