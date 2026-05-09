import { createContext, useEffect, useState, useRef } from 'react'
import { io } from 'socket.io-client'

export const SocketContext = createContext()

function loadMessages() {
  try {
    const raw = localStorage.getItem('chat_messages')
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

const STORAGE_KEY = 'chat_messages'
const MAX_STORED = 500

export function SocketProvider({ children }) {
  const [connected, setConnected] = useState(false)
  const [me, setMe] = useState(null)
  const [history, setHistory] = useState(loadMessages)
  const [announcement, setAnnouncement] = useState(null)
  const socketRef = useRef(null)

  useEffect(() => {
    const socket = io('', { transports: ['websocket', 'polling'] })
    socketRef.current = socket
    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))
    socket.on('welcome', (data) => {
      setMe(data.user)
      if (data.announcement) setAnnouncement(data.announcement)
      if (data.history && data.history.length > 0) {
        const merged = mergeMessages(loadMessages(), data.history)
        setHistory(merged)
      }
    })
    return () => { socket.disconnect() }
  }, [])

  const addMessage = (msg) => {
    setHistory(prev => {
      const next = [...prev, msg].slice(-MAX_STORED)
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }

  return (
    <SocketContext.Provider value={{ socket: socketRef, connected, me, history, addMessage, announcement }}>
      {children}
    </SocketContext.Provider>
  )
}

function mergeMessages(saved, server) {
  const ids = new Set(saved.map(m => m.id))
  const merged = [...saved]
  for (const m of server) {
    if (!ids.has(m.id)) { merged.push(m); ids.add(m.id) }
  }
  return merged.slice(-MAX_STORED)
}
