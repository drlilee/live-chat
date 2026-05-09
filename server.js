import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

const app = express()
const http = createServer(app)
const io = new Server(http, {
  cors: { origin: '*' },
})

// Serve static files in production
app.use(express.static(join(__dirname, 'dist')))

// SPA fallback: all non-static routes go to index.html
app.use((_req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'))
})

// In-memory store
const visitors = new Map()   // socketId -> { id, name, unread }
const admins = new Set()     // admin socket ids

io.on('connection', (socket) => {
  const role = socket.handshake.query.role // 'admin' | 'visitor'

  if (role === 'admin') {
    admins.add(socket.id)
    console.log(`Admin connected: ${socket.id}`)

    // Send current visitor list to new admin
    const list = Array.from(visitors.values())
    socket.emit('visitor-list', list)

    socket.on('disconnect', () => {
      admins.delete(socket.id)
      console.log(`Admin disconnected: ${socket.id}`)
    })
    return
  }

  // Visitor
  const visitorId = `v_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const name = `访客${visitorId.slice(-4)}`
  const visitor = { id: visitorId, name, unread: 0 }
  visitors.set(socket.id, visitor)

  console.log(`Visitor connected: ${name} (${visitorId})`)

  // Notify admins
  io.to(admins).emit('visitor-joined', visitor)
  io.to(admins).emit('visitor-list', Array.from(visitors.values()))

  // Confirm to visitor
  socket.emit('welcome', visitor)

  // Visitor sends message -> forward to admins
  socket.on('visitor-message', (data) => {
    const msg = {
      id: `m_${Date.now()}`,
      from: 'visitor',
      visitorId: visitor.id,
      visitorName: visitor.name,
      text: data.text,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    }
    io.to(admins).emit('message', msg)

    // Increment unread for this visitor (for all admins)
    const v = visitors.get(socket.id)
    if (v) v.unread++
    io.to(admins).emit('visitor-list', Array.from(visitors.values()))
  })

  // Admin sends message to this visitor
  socket.on('admin-message', (data) => {
    // This comes from admin socket, relay to visitor
  })

  socket.on('disconnect', () => {
    visitors.delete(socket.id)
    console.log(`Visitor disconnected: ${name}`)
    io.to(admins).emit('visitor-left', visitorId)
    io.to(admins).emit('visitor-list', Array.from(visitors.values()))
  })
})

// Admin -> specific visitor message
io.on('connection', (socket) => {
  // We handle this differently: admin messages come through the main connection as admin
})

// Actually, let's use a single connection handler with proper role handling

// Re-do: Use a cleaner approach
// The admin sends messages through the same socket

// Override the entire connection handler
io.removeAllListeners('connection')

io.on('connection', (socket) => {
  const role = socket.handshake.query.role

  if (role === 'admin') {
    admins.add(socket.id)
    console.log(`Admin connected: ${socket.id}`)
    socket.emit('visitor-list', Array.from(visitors.values()))

    // Admin sends message to specific visitor
    socket.on('send-to-visitor', ({ visitorId, text }) => {
      const msg = {
        id: `m_${Date.now()}`,
        from: 'admin',
        text,
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      }
      // Find the visitor's socket
      for (const [sid, v] of visitors) {
        if (v.id === visitorId) {
          io.to(sid).emit('message', msg)
          break
        }
      }
      // Echo back to all admins
      socket.emit('message', { ...msg, visitorId })
      socket.broadcast.to(admins).emit('message', { ...msg, visitorId })
    })

    // Admin clears unread for a visitor
    socket.on('clear-unread', (visitorId) => {
      for (const [, v] of visitors) {
        if (v.id === visitorId) {
          v.unread = 0
          break
        }
      }
      io.to(admins).emit('visitor-list', Array.from(visitors.values()))
    })

    socket.on('disconnect', () => {
      admins.delete(socket.id)
      console.log(`Admin disconnected: ${socket.id}`)
    })
    return
  }

  // === Visitor ===
  const visitorId = `v_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const name = `访客${visitorId.slice(-4)}`
  const visitor = { id: visitorId, name, unread: 0 }
  visitors.set(socket.id, visitor)

  console.log(`Visitor connected: ${name}`)

  io.to(admins).emit('visitor-joined', visitor)
  io.to(admins).emit('visitor-list', Array.from(visitors.values()))
  socket.emit('welcome', visitor)

  socket.on('visitor-message', (data) => {
    const msg = {
      id: `m_${Date.now()}`,
      from: 'visitor',
      visitorId: visitor.id,
      visitorName: visitor.name,
      text: data.text,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    }
    io.to(admins).emit('message', msg)
    const v = visitors.get(socket.id)
    if (v) v.unread++
    io.to(admins).emit('visitor-list', Array.from(visitors.values()))
  })

  socket.on('disconnect', () => {
    visitors.delete(socket.id)
    io.to(admins).emit('visitor-left', visitorId)
    io.to(admins).emit('visitor-list', Array.from(visitors.values()))
    console.log(`Visitor disconnected: ${name}`)
  })
})

const PORT = process.env.PORT || 3000
http.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
