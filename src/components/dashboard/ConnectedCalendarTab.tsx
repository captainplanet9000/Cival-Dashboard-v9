'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Calendar, Clock, Plus, RefreshCw, Bell, TrendingUp, 
  Target, Activity, AlertCircle, CheckCircle2
} from 'lucide-react'
import { useDashboardConnection } from './DashboardTabConnector'
import { toast } from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { format, addDays, startOfWeek, endOfWeek, isSameDay, isToday, isFuture, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'
import { CalendarView } from '@/components/calendar/CalendarView'
import { CalendarSummary } from '@/components/calendar/CalendarSummary'

interface ScheduledEvent {
  id: string
  title: string
  description: string
  type: 'trade' | 'analysis' | 'rebalance' | 'meeting' | 'earnings' | 'news'
  date: string
  time: string
  status: 'scheduled' | 'completed' | 'cancelled' | 'missed'
  priority: 'low' | 'medium' | 'high'
  agentId?: string
  recurring?: boolean
  notifications: boolean
}

interface ConnectedCalendarTabProps {
  className?: string
}

export function ConnectedCalendarTab({ className }: ConnectedCalendarTabProps) {
  const { state, actions } = useDashboardConnection('calendar')
  const [events, setEvents] = useState<ScheduledEvent[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week')
  
  // Event creation form state
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    type: 'analysis' as ScheduledEvent['type'],
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '09:00',
    priority: 'medium' as ScheduledEvent['priority'],
    agentId: '',
    recurring: false,
    notifications: true
  })

  // Calendar and daily data state
  const [calendarData, setCalendarData] = useState<Record<string, any>>({})
  const [dailySummary, setDailySummary] = useState<any>(null)
  const [showDailySummary, setShowDailySummary] = useState(false)

  // Load events and calendar data
  useEffect(() => {
    loadEventsData()
    loadCalendarData()
    const interval = setInterval(() => {
      checkUpcomingEvents()
      updateDailyData()
    }, 60000) // Check every minute
    return () => clearInterval(interval)
  }, [])

  const loadEventsData = async () => {
    try {
      // Try to load events from the backend API first
      const { backendClient } = await import('@/lib/api/backend-client')
      
      try {
        const response = await backendClient.getCalendarEvents()
        
        if (response.success && response.events) {
          // Convert backend events to frontend format
          const backendEvents = response.events.map((event: any) => ({
            id: event.id,
            title: event.title,
            description: event.description,
            type: event.type,
            date: event.date || format(new Date(), 'yyyy-MM-dd'),
            time: event.time || '09:00',
            status: event.status,
            priority: event.priority,
            recurring: event.recurring,
            notifications: event.notifications,
            agentId: event.agent_id,
            taskId: event.task_id
          }))
          
          // Combine with local events
          const storedEvents = localStorage.getItem('trading_calendar_events')
          const localEvents = storedEvents ? JSON.parse(storedEvents) : []
          
          const allEvents = [...backendEvents, ...localEvents]
          setEvents(allEvents)
          console.log('Events loaded from API:', backendEvents.length, 'backend +', localEvents.length, 'local')
          return
        }
      } catch (apiError) {
        console.warn('API events unavailable, using fallback:', apiError)
      }
      
      // Fallback to localStorage and default events
      const storedEvents = localStorage.getItem('trading_calendar_events')
      const eventsData = storedEvents ? JSON.parse(storedEvents) : []
      
      // Add some default market events
      const defaultEvents = [
        {
          id: 'market_open',
          title: 'Market Open',
          description: 'US stock market opens',
          type: 'trade',
          date: format(new Date(), 'yyyy-MM-dd'),
          time: '09:30',
          status: 'completed',
          priority: 'medium',
          recurring: true,
          notifications: true
        },
        {
          id: 'market_close',
          title: 'Market Close',
          description: 'US stock market closes',
          type: 'trade',
          date: format(new Date(), 'yyyy-MM-dd'),
          time: '16:00',
          status: 'scheduled',
          priority: 'medium',
          recurring: true,
          notifications: true
        },
        {
          id: 'weekly_rebalance',
          title: 'Portfolio Rebalance',
          description: 'Weekly portfolio rebalancing across all agents',
          type: 'rebalance',
          date: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
          time: '10:00',
          status: 'scheduled',
          priority: 'high',
          recurring: true,
          notifications: true
        }
      ]
      
      const allEvents = eventsData.length > 0 ? eventsData : [...defaultEvents, ...eventsData]
      setEvents(allEvents)
    } catch (error) {
      console.error('Error loading events data:', error)
    }
  }

  const checkUpcomingEvents = () => {
    const now = new Date()
    const upcomingEvents = events.filter(event => {
      const eventDateTime = new Date(`${event.date}T${event.time}`)
      const timeDiff = eventDateTime.getTime() - now.getTime()
      return timeDiff > 0 && timeDiff <= 15 * 60 * 1000 && event.notifications // 15 minutes
    })

    upcomingEvents.forEach(event => {
      if (event.status === 'scheduled') {
        toast(`📅 Upcoming: ${event.title} in 15 minutes`, {
          duration: 5000,
          icon: '⏰'
        })
      }
    })
  }

  const createEvent = async () => {
    if (!newEvent.title.trim()) {
      toast.error('Please enter an event title')
      return
    }

    try {
      // Try to create event via API first
      const { backendClient } = await import('@/lib/api/backend-client')
      
      const eventData = {
        title: newEvent.title,
        description: newEvent.description,
        type: newEvent.type,
        date: newEvent.date,
        time: newEvent.time,
        priority: newEvent.priority,
        agent_id: newEvent.agentId || undefined,
        recurring: newEvent.recurring,
        notifications: newEvent.notifications
      }
      
      try {
        const response = await backendClient.createCalendarEvent(eventData)
        
        if (response.success) {
          toast.success(`Event "${eventData.title}" scheduled successfully`)
          
          // Reset form and close dialog
          setNewEvent({
            title: '',
            description: '',
            type: 'analysis',
            date: format(new Date(), 'yyyy-MM-dd'),
            time: '09:00',
            priority: 'medium',
            agentId: '',
            recurring: false,
            notifications: true
          })
          setShowCreateDialog(false)
          
          // Reload events
          await loadEventsData()
          return
        }
      } catch (apiError) {
        console.warn('API event creation failed, using localStorage:', apiError)
      }
      
      // Fallback to localStorage
      const eventId = `event_${Date.now()}`
      const event: ScheduledEvent = {
        id: eventId,
        title: newEvent.title,
        description: newEvent.description,
        type: newEvent.type,
        date: newEvent.date,
        time: newEvent.time,
        status: 'scheduled',
        priority: newEvent.priority,
        agentId: newEvent.agentId || undefined,
        recurring: newEvent.recurring,
        notifications: newEvent.notifications
      }

      // Store event in localStorage
      const existingEvents = localStorage.getItem('trading_calendar_events')
      const allEvents = existingEvents ? JSON.parse(existingEvents) : []
      allEvents.push(event)
      localStorage.setItem('trading_calendar_events', JSON.stringify(allEvents))

      // Reset form and close dialog
      setNewEvent({
        title: '',
        description: '',
        type: 'analysis',
        date: format(new Date(), 'yyyy-MM-dd'),
        time: '09:00',
        priority: 'medium',
        agentId: '',
        recurring: false,
        notifications: true
      })
      setShowCreateDialog(false)
      
      toast.success(`Event "${event.title}" scheduled locally`)
      await loadEventsData()
      
    } catch (error) {
      console.error('Failed to create event:', error)
      toast.error('Failed to create event')
    }
  }

  const updateEventStatus = (eventId: string, newStatus: ScheduledEvent['status']) => {
    try {
      const storedEvents = localStorage.getItem('trading_calendar_events')
      const allEvents = storedEvents ? JSON.parse(storedEvents) : []
      const updatedEvents = allEvents.map((e: any) => 
        e.id === eventId ? { ...e, status: newStatus } : e
      )
      localStorage.setItem('trading_calendar_events', JSON.stringify(updatedEvents))
      
      loadEventsData()
      
      const event = events.find(e => e.id === eventId)
      if (event) {
        toast.success(`"${event.title}" marked as ${newStatus}`)
      }
    } catch (error) {
      console.error('Error updating event status:', error)
      toast.error('Failed to update event status')
    }
  }

  const deleteEvent = (eventId: string) => {
    try {
      const storedEvents = localStorage.getItem('trading_calendar_events')
      const allEvents = storedEvents ? JSON.parse(storedEvents) : []
      const updatedEvents = allEvents.filter((e: any) => e.id !== eventId)
      localStorage.setItem('trading_calendar_events', JSON.stringify(updatedEvents))
      
      toast.success('Event deleted successfully')
      loadEventsData()
    } catch (error) {
      console.error('Error deleting event:', error)
      toast.error('Failed to delete event')
    }
  }

  // Load calendar data for performance tracking
  const loadCalendarData = async () => {
    try {
      const currentMonth = selectedDate.getMonth() + 1
      const currentYear = selectedDate.getFullYear()
      const data = await generateCalendarData(currentYear, currentMonth)
      setCalendarData(data)
    } catch (error) {
      console.error('Error loading calendar data:', error)
    }
  }

  // Generate calendar data from current trading state
  const generateCalendarData = async (year: number, month: number) => {
    const data: Record<string, any> = {}
    const monthStart = startOfMonth(new Date(year, month - 1))
    const monthEnd = endOfMonth(new Date(year, month - 1))
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

    days.forEach((day) => {
      const dateStr = format(day, 'yyyy-MM-dd')
      const isToday = isSameDay(day, new Date())
      
      // Use current state for today, generate historical data for other days
      if (isToday) {
        data[dateStr] = {
          trading_date: dateStr,
          total_pnl: state.dailyPnL,
          total_trades: state.executedOrders.length,
          winning_trades: state.executedOrders.filter(order => 
            order.side === 'buy' ? 
            (state.marketPrices.get(order.symbol) || order.price) > order.price :
            (state.marketPrices.get(order.symbol) || order.price) < order.price
          ).length,
          active_agents: state.totalAgents,
          net_profit: state.totalPnL,
          win_rate: state.winRate,
          portfolio_value: state.portfolioValue
        }
      } else {
        // Generate simulated historical data
        const dayFactor = Math.random()
        const trades = Math.floor(Math.random() * 15) + 2
        const pnl = (Math.random() - 0.4) * 1000 * dayFactor
        data[dateStr] = {
          trading_date: dateStr,
          total_pnl: pnl,
          total_trades: trades,
          winning_trades: Math.floor(trades * (0.4 + Math.random() * 0.4)),
          active_agents: Math.floor(Math.random() * state.totalAgents) + 1,
          net_profit: pnl,
          win_rate: (0.4 + Math.random() * 0.4) * 100,
          portfolio_value: state.portfolioValue * (0.9 + Math.random() * 0.2)
        }
      }
    })

    return data
  }

  // Update daily data based on current state
  const updateDailyData = () => {
    const today = format(new Date(), 'yyyy-MM-dd')
    const todayData = {
      trading_date: today,
      total_pnl: state.dailyPnL,
      total_trades: state.executedOrders.length,
      winning_trades: state.executedOrders.filter(order => 
        order.side === 'buy' ? 
        (state.marketPrices.get(order.symbol) || order.price) > order.price :
        (state.marketPrices.get(order.symbol) || order.price) < order.price
      ).length,
      active_agents: state.totalAgents,
      net_profit: state.totalPnL,
      win_rate: state.winRate,
      portfolio_value: state.portfolioValue,
      last_updated: new Date().toISOString()
    }

    setCalendarData(prev => ({ ...prev, [today]: todayData }))
    setDailySummary(todayData)
  }

  // Handle date selection for daily summary
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    const dateStr = format(date, 'yyyy-MM-dd')
    const dayData = calendarData[dateStr]
    if (dayData) {
      setDailySummary(dayData)
      setShowDailySummary(true)
    }
  }

  // Get events for current view
  const getEventsForDate = (date: Date) => {
    return events.filter(event => isSameDay(new Date(event.date), date))
  }

  const getWeekDays = () => {
    const start = startOfWeek(selectedDate)
    const days = []
    for (let i = 0; i < 7; i++) {
      days.push(addDays(start, i))
    }
    return days
  }

  const eventTypes = [
    { value: 'trade', label: 'Trading', color: 'bg-blue-100 text-blue-800' },
    { value: 'analysis', label: 'Analysis', color: 'bg-purple-100 text-purple-800' },
    { value: 'rebalance', label: 'Rebalance', color: 'bg-green-100 text-green-800' },
    { value: 'meeting', label: 'Meeting', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'earnings', label: 'Earnings', color: 'bg-red-100 text-red-800' },
    { value: 'news', label: 'News/Events', color: 'bg-gray-100 text-gray-800' }
  ]

  const priorityColors = {
    low: 'border-l-blue-500',
    medium: 'border-l-yellow-500',
    high: 'border-l-red-500'
  }

  const statusIcons = {
    scheduled: <Clock className="h-4 w-4 text-blue-600" />,
    completed: <CheckCircle2 className="h-4 w-4 text-green-600" />,
    cancelled: <AlertCircle className="h-4 w-4 text-red-600" />,
    missed: <AlertCircle className="h-4 w-4 text-orange-600" />
  }

  const todaysEvents = getEventsForDate(new Date())
  const upcomingEvents = events.filter(event => {
    const eventDate = new Date(event.date)
    return isFuture(eventDate) && event.status === 'scheduled'
  }).slice(0, 5)

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Trading Calendar</h2>
          <p className="text-muted-foreground">
            Schedule and track trading events, analysis, and market activities
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Schedule Event
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Schedule Trading Event</DialogTitle>
                <DialogDescription>
                  Add a new event to your trading calendar
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Event Title</Label>
                  <Input
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                    placeholder="e.g., Weekly portfolio review"
                  />
                </div>
                
                <div>
                  <Label>Description</Label>
                  <Input
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                    placeholder="Optional event description"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Event Type</Label>
                    <Select value={newEvent.type} onValueChange={(v: any) => setNewEvent({...newEvent, type: v})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {eventTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Priority</Label>
                    <Select value={newEvent.priority} onValueChange={(v: any) => setNewEvent({...newEvent, priority: v})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={newEvent.date}
                      onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <Label>Time</Label>
                    <Input
                      type="time"
                      value={newEvent.time}
                      onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Assign to Agent (Optional)</Label>
                  <Select value={newEvent.agentId} onValueChange={(v) => setNewEvent({...newEvent, agentId: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an agent" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No specific agent</SelectItem>
                      {Array.from(state.agentPerformance.values()).map(agent => (
                        <SelectItem key={agent.agentId} value={agent.agentId}>
                          {agent.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between">
                  <Label>Enable Notifications</Label>
                  <input
                    type="checkbox"
                    checked={newEvent.notifications}
                    onChange={(e) => setNewEvent({...newEvent, notifications: e.target.checked})}
                    className="rounded"
                  />
                </div>
                
                <Button onClick={createEvent} className="w-full">
                  Schedule Event
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button variant="outline" size="sm" onClick={actions.refresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Today's Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todaysEvents.length}</div>
            <p className="text-xs text-muted-foreground">
              {todaysEvents.filter(e => e.status === 'completed').length} completed
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingEvents.length}</div>
            <p className="text-xs text-muted-foreground">
              Next 7 days
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {events.filter(e => e.status === 'completed').length}
            </div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {events.length > 0 
                ? Math.round((events.filter(e => e.status === 'completed').length / events.length) * 100)
                : 0
              }%
            </div>
            <p className="text-xs text-muted-foreground">
              Event completion
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Calendar View with Performance Data */}
      <div className="space-y-6">
        {/* Calendar Summary */}
        {Object.keys(calendarData).length > 0 && (
          <CalendarSummary 
            calendarData={calendarData}
            currentDate={selectedDate}
          />
        )}

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Performance Calendar */}
          <div className="xl:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    {format(selectedDate, 'MMMM yyyy')} Performance Calendar
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedDate(addDays(selectedDate, -30))}
                    >
                      Previous Month
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedDate(new Date())}
                    >
                      Today
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedDate(addDays(selectedDate, 30))}
                    >
                      Next Month
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {Object.keys(calendarData).length > 0 ? (
                  <CalendarView 
                    currentDate={selectedDate}
                    calendarData={calendarData}
                    onDateSelect={handleDateSelect}
                  />
                ) : (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Loading calendar data...</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Daily Summary Panel */}
          <div className="space-y-6">
            {/* Daily Performance Summary */}
            {dailySummary && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Daily Summary
                    </CardTitle>
                    <CardDescription>
                      {format(selectedDate, 'MMMM dd, yyyy')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className={`text-xl font-bold ${
                          dailySummary.total_pnl >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          ${dailySummary.total_pnl?.toFixed(0) || '0'}
                        </div>
                        <div className="text-xs text-muted-foreground">P&L</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-xl font-bold">{dailySummary.total_trades || 0}</div>
                        <div className="text-xs text-muted-foreground">Trades</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-xl font-bold">
                          {dailySummary.total_trades > 0 
                            ? Math.round((dailySummary.winning_trades / dailySummary.total_trades) * 100)
                            : 0
                          }%
                        </div>
                        <div className="text-xs text-muted-foreground">Win Rate</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-xl font-bold">{dailySummary.active_agents || 0}</div>
                        <div className="text-xs text-muted-foreground">Agents</div>
                      </div>
                    </div>
                    
                    {dailySummary.portfolio_value && (
                      <div className="pt-3 border-t">
                        <div className="flex justify-between text-sm">
                          <span>Portfolio Value:</span>
                          <span className="font-medium">
                            ${dailySummary.portfolio_value.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Today's Events */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Events & Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {todaysEvents.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No events scheduled for today
                    </p>
                  ) : (
                    todaysEvents.map(event => {
                      const eventType = eventTypes.find(t => t.value === event.type)
                      return (
                        <div
                          key={event.id}
                          className={`p-3 border-l-4 ${priorityColors[event.priority]} bg-gray-50 rounded-r-lg`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                {statusIcons[event.status]}
                                <span className="font-medium text-sm">{event.title}</span>
                              </div>
                              <div className="text-xs text-muted-foreground mb-2">
                                {event.time} • {eventType?.label}
                              </div>
                              {event.description && (
                                <p className="text-xs text-muted-foreground">{event.description}</p>
                              )}
                            </div>
                            {event.status === 'scheduled' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateEventStatus(event.id, 'completed')}
                                className="ml-2"
                              >
                                Complete
                              </Button>
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Events Management Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Week View */}
        <Card>
          <CardHeader>
            <CardTitle>Week View</CardTitle>
            <CardDescription>Current week schedule</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Week Header */}
              <div className="grid grid-cols-7 gap-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Week Days */}
              <div className="grid grid-cols-7 gap-2">
                {getWeekDays().map(day => {
                  const dayEvents = getEventsForDate(day)
                  const isSelectedDay = isSameDay(day, selectedDate)
                  const isTodayDay = isToday(day)
                  
                  return (
                    <motion.div
                      key={day.toISOString()}
                      className={`min-h-24 p-2 border rounded-lg cursor-pointer transition-colors ${
                        isSelectedDay ? 'border-blue-500 bg-blue-50' :
                        isTodayDay ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => handleDateSelect(day)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className={`text-sm font-medium mb-1 ${
                        isTodayDay ? 'text-green-600' : 'text-gray-900'
                      }`}>
                        {format(day, 'd')}
                      </div>
                      <div className="space-y-1">
                        {dayEvents.slice(0, 2).map(event => {
                          const eventType = eventTypes.find(t => t.value === event.type)
                          return (
                            <div
                              key={event.id}
                              className={`text-xs p-1 rounded truncate ${eventType?.color || 'bg-gray-100'}`}
                            >
                              {event.title}
                            </div>
                          )
                        })}
                        {dayEvents.length > 2 && (
                          <div className="text-xs text-muted-foreground">
                            +{dayEvents.length - 2} more
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Event Details Sidebar */}
        <div className="space-y-6">
          {/* Today's Events */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Today's Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {todaysEvents.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No events scheduled for today
                  </p>
                ) : (
                  todaysEvents.map(event => {
                    const eventType = eventTypes.find(t => t.value === event.type)
                    return (
                      <div
                        key={event.id}
                        className={`p-3 border-l-4 ${priorityColors[event.priority]} bg-gray-50 rounded-r-lg`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {statusIcons[event.status]}
                              <span className="font-medium text-sm">{event.title}</span>
                            </div>
                            <div className="text-xs text-muted-foreground mb-2">
                              {event.time} • {eventType?.label}
                            </div>
                            {event.description && (
                              <p className="text-xs text-muted-foreground">{event.description}</p>
                            )}
                          </div>
                          {event.status === 'scheduled' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateEventStatus(event.id, 'completed')}
                              className="ml-2"
                            >
                              Complete
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Upcoming Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingEvents.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No upcoming events
                  </p>
                ) : (
                  upcomingEvents.map(event => {
                    const eventType = eventTypes.find(t => t.value === event.type)
                    return (
                      <div key={event.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{event.title}</span>
                          <Badge className={eventType?.color || 'bg-gray-100'} variant="outline">
                            {eventType?.label}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(event.date), 'MMM dd')} at {event.time}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default ConnectedCalendarTab