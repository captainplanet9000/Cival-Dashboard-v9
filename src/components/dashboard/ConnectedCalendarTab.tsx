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
import { format, addDays, startOfWeek, endOfWeek, isSameDay, isToday, isFuture } from 'date-fns'

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

  // Load events data
  useEffect(() => {
    loadEventsData()
    const interval = setInterval(checkUpcomingEvents, 60000) // Check every minute
    return () => clearInterval(interval)
  }, [])

  const loadEventsData = () => {
    try {
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

    // Store event
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
    
    toast.success(`Event "${event.title}" scheduled successfully`)
    loadEventsData()
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

      {/* Calendar View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {format(selectedDate, 'MMMM yyyy')}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDate(addDays(selectedDate, -7))}
                  >
                    Previous
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
                    onClick={() => setSelectedDate(addDays(selectedDate, 7))}
                  >
                    Next
                  </Button>
                </div>
              </div>
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
                        onClick={() => setSelectedDate(day)}
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
        </div>
        
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