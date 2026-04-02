'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import {
  MessageSquare,
  Plus,
  Search,
  Send,
  Users,
  Trash2,
  X,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

// ─── Types ─────────────────────────────────────────────────────────────────────
interface ChatRoom {
  id: string
  name: string
  description: string | null
  isPrivate: boolean
  lastMessage: { content: string; senderName: string | null; createdAt: string } | null
  unreadCount: number
  memberCount: number
  createdAt: string
  updatedAt: string
}

interface ChatMessage {
  id: string
  roomId: string
  senderId: string
  senderName: string | null
  content: string
  type: string
  createdAt: string
}

interface Account {
  id: string
  name: string
  email: string
}

// ─── Format helpers ────────────────────────────────────────────────────────────
function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// ─── Main Chat Component ──────────────────────────────────────────────────────
export default function ChatPage() {
  const [rooms, setRooms] = useState<ChatRoom[]>([])
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [sendingMessage, setSendingMessage] = useState(false)

  // Dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formIsPrivate, setFormIsPrivate] = useState(false)
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ─── Fetch rooms ──────────────────────────────────────────────────────────
  const fetchRooms = useCallback(async () => {
    try {
      const res = await fetch('/api/chat/rooms')
      if (res.ok) {
        const data = await res.json()
        setRooms(data.rooms || [])
      }
    } catch {
      // silent
    }
  }, [])

  // ─── Fetch messages for active room ──────────────────────────────────────
  const fetchMessages = useCallback(async () => {
    if (!activeRoomId) return
    try {
      const res = await fetch(`/api/chat/rooms/${activeRoomId}/messages?limit=100`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
      }
    } catch {
      // silent
    }
  }, [activeRoomId])

  // ─── Fetch accounts ──────────────────────────────────────────────────────
  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch('/api/accounts?limit=100')
      if (res.ok) {
        const data = await res.json()
        setAccounts(data.accounts || [])
      }
    } catch {
      // silent
    }
  }, [])

  // ─── Initial load ────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([fetchRooms(), fetchAccounts()]).finally(() => setLoading(false))
  }, [fetchRooms, fetchAccounts])

  // ─── Polling for new messages ─────────────────────────────────────────────
  useEffect(() => {
    if (!activeRoomId) return

    fetchMessages()

    pollIntervalRef.current = setInterval(() => {
      fetchMessages()
      fetchRooms()
    }, 3000)

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [activeRoomId, fetchMessages, fetchRooms])

  // ─── Auto-scroll on new messages ─────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ─── Select room ─────────────────────────────────────────────────────────
  const handleSelectRoom = (roomId: string) => {
    setActiveRoomId(roomId)
    setMessages([])
  }

  // ─── Send message ────────────────────────────────────────────────────────
  const handleSendMessage = async () => {
    if (!messageInput.trim() || !activeRoomId || sendingMessage) return

    setSendingMessage(true)
    try {
      const res = await fetch(`/api/chat/rooms/${activeRoomId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: messageInput.trim() }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erreur lors de l'envoi")
      }

      setMessageInput('')
      fetchMessages()
      fetchRooms()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur lors de l'envoi")
    } finally {
      setSendingMessage(false)
    }
  }

  // ─── Create room ─────────────────────────────────────────────────────────
  const handleCreateRoom = async () => {
    if (!formName.trim()) {
      toast.error('Le nom du salon est requis')
      return
    }

    try {
      const res = await fetch('/api/chat/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName.trim(),
          description: formDescription || undefined,
          isPrivate: formIsPrivate,
          memberAccountIds: selectedMembers,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erreur lors de la création')
      }

      toast.success('Salon créé avec succès')
      setCreateDialogOpen(false)
      setFormName('')
      setFormDescription('')
      setFormIsPrivate(false)
      setSelectedMembers([])
      fetchRooms()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur lors de la création')
    }
  }

  // ─── Delete room ─────────────────────────────────────────────────────────
  const handleDeleteRoom = async (roomId: string) => {
    try {
      const res = await fetch(`/api/chat/rooms/${roomId}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erreur lors de la suppression')
      }
      toast.success('Salon supprimé')
      if (activeRoomId === roomId) {
        setActiveRoomId(null)
        setMessages([])
      }
      fetchRooms()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur lors de la suppression')
    }
  }

  // ─── Toggle member selection ─────────────────────────────────────────────
  const toggleMember = (accountId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(accountId) ? prev.filter((id) => id !== accountId) : [...prev, accountId],
    )
  }

  // ─── Active room data ────────────────────────────────────────────────────
  const activeRoom = rooms.find((r) => r.id === activeRoomId)

  // ─── Loading state ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex h-[calc(100dvh-8rem)] gap-4 p-4 md:p-6">
        <Skeleton className="w-80 rounded-xl hidden md:block" />
        <Skeleton className="flex-1 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100dvh-8rem)] gap-4 p-4 md:p-6">
      {/* ── Left Panel: Room List ─────────────────────────────────────────── */}
      <Card className="w-full md:w-80 shrink-0 flex flex-col">
        <CardHeader className="pb-3 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-[#45A452]" />
              Salons
            </CardTitle>
            <Button
              size="icon"
              className="h-8 w-8 bg-[#45A452] hover:bg-[#2d8a3a]"
              onClick={() => setCreateDialogOpen(true)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <Separator />
        <ScrollArea className="flex-1 max-h-96 md:max-h-none overflow-y-auto">
          <div className="p-2 space-y-1">
            {rooms.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <MessageSquare className="h-8 w-8 text-muted-foreground/40 mb-2" />
                <p className="text-xs text-muted-foreground">Aucun salon</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Créez un salon pour commencer
                </p>
              </div>
            ) : (
              rooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => handleSelectRoom(room.id)}
                  className={`w-full flex items-start gap-3 rounded-lg p-3 text-left transition-all hover:bg-muted/50 ${
                    activeRoomId === room.id ? 'bg-[#45A452]/10 border border-[#45A452]/20' : ''
                  }`}
                >
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarFallback
                      className={`text-xs font-bold ${
                        activeRoomId === room.id ? 'bg-[#45A452] text-white' : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {getInitials(room.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium truncate">{room.name}</span>
                      {room.unreadCount > 0 && (
                        <Badge className="h-5 min-w-5 rounded-full bg-[#45A452] text-[10px] px-1.5 text-white shrink-0">
                          {room.unreadCount}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {room.memberCount}
                    </p>
                    {room.lastMessage && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        <span className="font-medium">{room.lastMessage.senderName}:</span>{' '}
                        {room.lastMessage.content}
                      </p>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </Card>

      {/* ── Right Panel: Active Room ──────────────────────────────────────── */}
      <Card className="flex-1 flex flex-col min-w-0">
        {activeRoom ? (
          <>
            {/* Room Header */}
            <CardHeader className="pb-3 px-4 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="text-xs font-bold bg-[#45A452] text-white">
                      {getInitials(activeRoom.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-sm">{activeRoom.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {activeRoom.description || `${activeRoom.memberCount} membre(s)`}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-red-500"
                  onClick={() => handleDeleteRoom(activeRoom.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <MessageSquare className="h-12 w-12 text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground">Aucun message</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Envoyez le premier message
                    </p>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isOwn = msg.senderId === 'current-user'
                    // We'll determine ownership from senderName comparison or use a simpler approach
                    // For now, alternate based on sender changes
                    const prevMsg = idx > 0 ? messages[idx - 1] : null
                    const showAvatar = !prevMsg || prevMsg.senderId !== msg.senderId
                    const showTime = !messages[idx + 1] || messages[idx + 1].senderId !== msg.senderId

                    return (
                      <div key={msg.id} className="flex gap-2">
                        {/* Determine side based on senderId - for demo, we'll check later */}
                        <div className={`flex gap-2 max-w-[75%] ${msg.senderName === 'Admin' ? 'ml-auto flex-row-reverse' : ''}`}>
                          {showAvatar && (
                            <Avatar className="h-7 w-7 shrink-0 mt-1">
                              <AvatarFallback className="text-[10px] font-bold bg-muted">
                                {getInitials(msg.senderName || '?')}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          {!showAvatar && <div className="w-7 shrink-0" />}
                          <div className="space-y-1">
                            {showAvatar && (
                              <p className={`text-[10px] font-medium text-muted-foreground ${msg.senderName === 'Admin' ? 'text-right' : ''}`}>
                                {msg.senderName || 'Anonyme'}
                              </p>
                            )}
                            <div
                              className={`rounded-2xl px-3 py-2 text-sm ${
                                msg.senderName === 'Admin'
                                  ? 'bg-[#45A452] text-white rounded-br-md'
                                  : 'bg-muted rounded-bl-md'
                              }`}
                            >
                              {msg.content}
                            </div>
                            {showTime && (
                              <p className={`text-[10px] text-muted-foreground ${msg.senderName === 'Admin' ? 'text-right' : ''}`}>
                                {formatTime(msg.createdAt)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="border-t p-4">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Écrire un message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  className="bg-[#45A452] hover:bg-[#2d8a3a] text-white shrink-0"
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim() || sendingMessage}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          /* Empty state */
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#45A452]/10 mb-4">
              <MessageSquare className="h-8 w-8 text-[#45A452]" />
            </div>
            <h3 className="text-lg font-semibold">Bienvenue dans le Chat</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Sélectionnez un salon existant ou créez-en un nouveau pour commencer à discuter.
            </p>
            <Button
              className="mt-4 bg-[#45A452] hover:bg-[#2d8a3a] text-white"
              onClick={() => setCreateDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nouveau salon
            </Button>
          </div>
        )}
      </Card>

      {/* ── Create Room Dialog ─────────────────────────────────────────────── */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#45A452]/10">
                <Plus className="h-4 w-4 text-[#45A452]" />
              </div>
              Nouveau salon
            </DialogTitle>
            <DialogDescription>Créez un salon de discussion</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="room-name">Nom du salon *</Label>
              <Input
                id="room-name"
                placeholder="Ex: Équipe Support"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="room-description">Description</Label>
              <Input
                id="room-description"
                placeholder="Description optionnelle..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="room-private"
                checked={formIsPrivate}
                onCheckedChange={(checked) => setFormIsPrivate(checked === true)}
              />
              <Label htmlFor="room-private" className="text-sm">
                Salon privé
              </Label>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>Membres</Label>
              <div className="max-h-48 overflow-y-auto rounded-lg border p-2 space-y-1">
                {accounts.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    Aucun compte disponible
                  </p>
                ) : (
                  accounts.map((acc) => (
                    <label
                      key={acc.id}
                      className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50 cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedMembers.includes(acc.id)}
                        onCheckedChange={() => toggleMember(acc.id)}
                      />
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-[9px] font-bold bg-muted">
                          {getInitials(acc.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{acc.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{acc.email}</p>
                      </div>
                    </label>
                  ))
                )}
              </div>
              {selectedMembers.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-[10px] text-muted-foreground">
                    {selectedMembers.length} sélectionné(s)
                  </span>
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              className="bg-[#45A452] hover:bg-[#2d8a3a] text-white"
              onClick={handleCreateRoom}
            >
              Créer le salon
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
