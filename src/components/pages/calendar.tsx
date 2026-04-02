'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  CalendarDays,
  Plus,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  Pencil,
  Trash2,
  CalendarDays as CalendarIcon,
  TrendingUp,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { StatsCard } from '@/components/stats-card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

// ─── Types ─────────────────────────────────────────────────────────────────────
interface CalendarEvent {
  id: string
  title: string
  description: string | null
  type: string
  startDate: string
  endDate: string | null
  allDay: boolean
  color: string
  location: string | null
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

interface CalendarStats {
  thisMonthEvents: number
  upcomingEvents: number
}

// ─── Constants ─────────────────────────────────────────────────────────────────
const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

const EVENT_TYPE_COLORS: Record<string, string> = {
  AUCTION_START: '#45A452',
  AUCTION_END: '#ef4444',
  MAINTENANCE: '#f59e0b',
  MEETING: '#6366f1',
  REPORT_DUE: '#8b5cf6',
  SUBSCRIPTION_RENEWAL: '#06b6d4',
  CUSTOM: '#94a3b8',
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  AUCTION_START: 'Début enchère',
  AUCTION_END: 'Fin enchère',
  MAINTENANCE: 'Maintenance',
  MEETING: 'Réunion',
  REPORT_DUE: 'Rapport dû',
  SUBSCRIPTION_RENEWAL: 'Renouvellement',
  CUSTOM: 'Personnalisé',
}

const EVENT_TYPES = [
  'AUCTION_START',
  'AUCTION_END',
  'MAINTENANCE',
  'MEETING',
  'REPORT_DUE',
  'SUBSCRIPTION_RENEWAL',
  'CUSTOM',
]

// ─── Format helpers ────────────────────────────────────────────────────────────
function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function formatDateFull(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

// ─── Main Calendar Component ───────────────────────────────────────────────────
export default function CalendarPage() {
  const now = new Date()
  const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1)
  const [currentYear, setCurrentYear] = useState(now.getFullYear())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [stats, setStats] = useState<CalendarStats | null>(null)
  const [loading, setLoading] = useState(true)

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [formTitle, setFormTitle] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formType, setFormType] = useState('MEETING')
  const [formStartDate, setFormStartDate] = useState('')
  const [formEndDate, setFormEndDate] = useState('')
  const [formAllDay, setFormAllDay] = useState(false)
  const [formColor, setFormColor] = useState('#45A452')
  const [formLocation, setFormLocation] = useState('')

  // ─── Fetch events ────────────────────────────────────────────────────────
  const fetchEvents = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/calendar?month=${currentMonth}&year=${currentYear}`)
      if (res.ok) {
        const data = await res.json()
        setEvents(data.events || [])
        setStats(data.stats || null)
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [currentMonth, currentYear])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  // ─── Calendar grid data ──────────────────────────────────────────────────
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth - 1, 1)
    const lastDay = new Date(currentYear, currentMonth, 0)
    let startDow = firstDay.getDay() - 1 // Convert Sunday=0 to Monday-based
    if (startDow < 0) startDow = 6

    const days: (number | null)[] = []
    for (let i = 0; i < startDow; i++) days.push(null)
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(d)

    return days
  }, [currentMonth, currentYear])

  const getEventsForDay = (day: number): CalendarEvent[] => {
    return events.filter((e) => {
      const d = new Date(e.startDate)
      return d.getDate() === day && d.getMonth() === currentMonth - 1 && d.getFullYear() === currentYear
    })
  }

  const isToday = (day: number): boolean => {
    const today = new Date()
    return day === today.getDate() && currentMonth === today.getMonth() + 1 && currentYear === today.getFullYear()
  }

  // ─── Navigation ──────────────────────────────────────────────────────────
  const goToPrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const goToNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  const goToToday = () => {
    setCurrentMonth(now.getMonth() + 1)
    setCurrentYear(now.getFullYear())
  }

  const monthLabel = new Date(currentYear, currentMonth - 1, 1).toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  })

  // ─── Open dialogs ────────────────────────────────────────────────────────
  const openCreateDialog = (day?: number) => {
    setEditingEvent(null)
    resetForm()
    if (day) {
      const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      setFormStartDate(dateStr)
      setFormEndDate(dateStr)
    }
    setDialogOpen(true)
  }

  const openEditDialog = (event: CalendarEvent) => {
    setEditingEvent(event)
    setFormTitle(event.title)
    setFormDescription(event.description || '')
    setFormType(event.type)
    setFormStartDate(event.startDate.slice(0, 16))
    setFormEndDate(event.endDate ? event.endDate.slice(0, 16) : '')
    setFormAllDay(event.allDay)
    setFormColor(event.color)
    setFormLocation(event.location || '')
    setDialogOpen(true)
    setDetailDialogOpen(false)
  }

  const openDetailDialog = (event: CalendarEvent) => {
    setSelectedEvent(event)
    setDetailDialogOpen(true)
  }

  // ─── Reset form ───────────────────────────────────────────────────────────
  const resetForm = () => {
    setFormTitle('')
    setFormDescription('')
    setFormType('MEETING')
    setFormStartDate('')
    setFormEndDate('')
    setFormAllDay(false)
    setFormColor('#45A452')
    setFormLocation('')
  }

  // ─── Handle submit ────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!formTitle.trim()) {
      toast.error('Le titre est requis')
      return
    }
    if (!formStartDate) {
      toast.error('La date de début est requise')
      return
    }

    setSubmitting(true)
    try {
      const url = editingEvent ? `/api/calendar/${editingEvent.id}` : '/api/calendar'
      const method = editingEvent ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle.trim(),
          description: formDescription || undefined,
          type: formType,
          startDate: formStartDate,
          endDate: formEndDate || undefined,
          allDay: formAllDay,
          color: formColor,
          location: formLocation || undefined,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erreur lors de l'opération")
      }

      toast.success(editingEvent ? 'Événement mis à jour' : 'Événement créé')
      setDialogOpen(false)
      resetForm()
      fetchEvents()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur lors de l'opération")
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Delete event ─────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/calendar/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erreur lors de la suppression')
      toast.success('Événement supprimé')
      setDetailDialogOpen(false)
      fetchEvents()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur lors de la suppression')
    }
  }

  // ─── Loading state ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-[500px] rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* ── Stats Cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatsCard
          title="Événements ce mois"
          value={stats?.thisMonthEvents || 0}
          subtitle={monthLabel}
          icon={CalendarDays}
          iconColor="text-[#45A452]"
          iconBg="bg-[#45A452]/10"
        />
        <StatsCard
          title="Événements à venir"
          value={stats?.upcomingEvents || 0}
          subtitle="Prochains événements"
          icon={TrendingUp}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
        <StatsCard
          title="Total événements"
          value={events.length}
          subtitle="Ce mois-ci"
          icon={CalendarIcon}
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
        />
      </div>

      {/* ── Calendar ───────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={goToPrevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="text-base capitalize">{monthLabel}</CardTitle>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={goToNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToToday} className="ml-2">
                Aujourd&apos;hui
              </Button>
            </div>
            <Button
              className="bg-[#45A452] hover:bg-[#2d8a3a] text-white"
              onClick={() => openCreateDialog()}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nouvel événement
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {DAYS_FR.map((day) => (
              <div key={day} className="text-center text-xs font-semibold text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="h-24 rounded-lg bg-muted/30" />
              }

              const dayEvents = getEventsForDay(day)
              const today = isToday(day)

              return (
                <button
                  key={day}
                  onClick={() => dayEvents.length > 0 && openCreateDialog(day)}
                  className={`h-24 rounded-lg border p-1.5 text-left transition-all hover:bg-muted/50 ${
                    today ? 'border-[#45A452] bg-[#45A452]/5' : 'border-border'
                  }`}
                >
                  <span className={`text-xs font-medium ${today ? 'text-[#45A452] font-bold' : 'text-foreground'}`}>
                    {day}
                  </span>
                  <div className="mt-1 space-y-0.5">
                    {dayEvents.slice(0, 3).map((event) => (
                      <button
                        key={event.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          openDetailDialog(event)
                        }}
                        className="w-full text-left rounded px-1 py-0.5 text-[10px] font-medium text-white truncate block"
                        style={{ backgroundColor: event.color || EVENT_TYPE_COLORS[event.type] || '#94a3b8' }}
                      >
                        {event.allDay
                          ? event.title
                          : `${formatTime(event.startDate)} ${event.title}`}
                      </button>
                    ))}
                    {dayEvents.length > 3 && (
                      <span className="text-[9px] text-muted-foreground px-1">
                        +{dayEvents.length - 3} autre(s)
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── Event Detail Dialog ────────────────────────────────────────────── */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="sm:max-w-[440px]">
          {selectedEvent && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{ backgroundColor: selectedEvent.color || EVENT_TYPE_COLORS[selectedEvent.type] || '#94a3b8' }}
                  />
                  {selectedEvent.title}
                </DialogTitle>
                <DialogDescription>
                  <Badge
                    variant="secondary"
                    className="text-[10px] font-semibold mt-1"
                    style={{
                      backgroundColor: (EVENT_TYPE_COLORS[selectedEvent.type] || '#94a3b8') + '15',
                      color: EVENT_TYPE_COLORS[selectedEvent.type] || '#94a3b8',
                    }}
                  >
                    {EVENT_TYPE_LABELS[selectedEvent.type] || selectedEvent.type}
                  </Badge>
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-2">
                {selectedEvent.description && (
                  <p className="text-sm text-muted-foreground">{selectedEvent.description}</p>
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarDays className="h-4 w-4" />
                  {formatDateFull(selectedEvent.startDate)}
                </div>
                {selectedEvent.endDate && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    Jusqu&apos;au {formatDateFull(selectedEvent.endDate)}
                  </div>
                )}
                {selectedEvent.location && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {selectedEvent.location}
                  </div>
                )}
                {selectedEvent.allDay && (
                  <Badge variant="outline" className="text-xs">
                    Toute la journée
                  </Badge>
                )}
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  variant="outline"
                  className="text-red-500 hover:text-red-600"
                  onClick={() => handleDelete(selectedEvent.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer
                </Button>
                <Button
                  className="bg-[#45A452] hover:bg-[#2d8a3a] text-white"
                  onClick={() => openEditDialog(selectedEvent)}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Modifier
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Create/Edit Event Dialog ──────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#45A452]/10">
                <CalendarDays className="h-4 w-4 text-[#45A452]" />
              </div>
              {editingEvent ? "Modifier l'événement" : 'Nouvel événement'}
            </DialogTitle>
            <DialogDescription>
              {editingEvent ? 'Modifiez les détails' : 'Créez un nouvel événement'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="event-title">Titre *</Label>
              <Input
                id="event-title"
                placeholder="Titre de l'événement"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-description">Description</Label>
              <Textarea
                id="event-description"
                placeholder="Description..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type *</Label>
                <Select value={formType} onValueChange={(v) => { setFormType(v); setFormColor(EVENT_TYPE_COLORS[v] || '#45A452') }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {EVENT_TYPE_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Couleur</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formColor}
                    onChange={(e) => setFormColor(e.target.value)}
                    className="h-9 w-12 rounded border cursor-pointer"
                  />
                  <Input
                    value={formColor}
                    onChange={(e) => setFormColor(e.target.value)}
                    className="flex-1 font-mono text-xs"
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="event-start">Date début *</Label>
                <Input
                  id="event-start"
                  type={formAllDay ? 'date' : 'datetime-local'}
                  value={formStartDate}
                  onChange={(e) => setFormStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-end">Date fin</Label>
                <Input
                  id="event-end"
                  type={formAllDay ? 'date' : 'datetime-local'}
                  value={formEndDate}
                  onChange={(e) => setFormEndDate(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="event-allday"
                checked={formAllDay}
                onCheckedChange={(checked) => setFormAllDay(checked === true)}
              />
              <Label htmlFor="event-allday" className="text-sm">
                Toute la journée
              </Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-location">Lieu</Label>
              <Input
                id="event-location"
                placeholder="Ex: Salle de réunion A"
                value={formLocation}
                onChange={(e) => setFormLocation(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              className="bg-[#45A452] hover:bg-[#2d8a3a] text-white"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? 'Enregistrement...' : editingEvent ? 'Mettre à jour' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
