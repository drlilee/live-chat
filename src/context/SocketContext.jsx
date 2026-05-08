import { createContext, useEffect, useState, useRef, useCallback } from 'react'
import { io } from 'socket.io-client'

export const SocketContext = createContext()

const SOCKET_URL = ''

export function SocketProvider({ role, children }) {
  const [connected, setConnected] = useState(false)
  const [visitor, setVisitor] = useState(null)
  const socketRef = useRef(null)

  useEffect(() => {
    const socket = io(SOCKET_URL, { query: { role } })
    socketRef.current = socket

    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))

    if (role === 'visitor') {
      socket.on('welcome', (data) => setVisitor(data))
    }

    return () => {
      socket.disconnect()
    }
  }, [role])

  const value = { socket: socketRef, connected, visitor, setVisitor }
  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}
