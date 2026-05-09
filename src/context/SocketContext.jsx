import { createContext, useEffect, useState, useRef } from 'react'
import { io } from 'socket.io-client'

export const SocketContext = createContext()

export function SocketProvider({ children }) {
  const [connected, setConnected] = useState(false)
  const [me, setMe] = useState(null)
  const socketRef = useRef(null)

  useEffect(() => {
    const socket = io('', { transports: ['websocket', 'polling'] })
    socketRef.current = socket
    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))
    socket.on('welcome', (user) => setMe(user))
    return () => { socket.disconnect() }
  }, [])

  return (
    <SocketContext.Provider value={{ socket: socketRef, connected, me }}>
      {children}
    </SocketContext.Provider>
  )
}
