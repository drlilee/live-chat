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

// Serve static files in production (no caching for SPA)
app.use(express.static(join(__dirname, 'dist'), {
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
  }
}))

// SPA fallback: all non-static routes go to index.html
app.use((_req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'))
})

// In-memory store: socketId -> { id, name, unread }
const visitors = new Map()

io.on('connection', (socket) => {
  const role = socket.handshake.query.role

  // === Admin ===
  if (role === 'admin') {
    socket.join('admins')
    console.log(`Admin connected: ${socket.id}`)
    socket.emit('visitor-list', Array.from(visitors.values()))

    socket.on('send-to-visitor', ({ visitorId, text }) => {
      console.log(`Admin sending to visitor ${visitorId}: ${text}`)
      const msg = {
        id: `m_${Date.now()}`,
        from: 'admin',
        text,
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      }
      let found = false
      for (const [sid, v] of visitors) {
        if (v.id === visitorId) {
          io.to(sid).emit('message', msg)
          console.log(`  -> delivered to visitor socket ${sid}`)
          found = true
          break
        }
      }
      if (!found) console.log(`  -> visitor not found!`)
      // Echo to all admins
      const admins = io.sockets.adapter.rooms.get('admins')
      console.log(`  -> echoing to admins room (${admins ? admins.size : 0} admins)`)
      io.to('admins').emit('message', { ...msg, visitorId })
    })

    socket.on('clear-unread', (visitorId) => {
      for (const [, v] of visitors) {
        if (v.id === visitorId) { v.unread = 0; break }
      }
      io.to('admins').emit('visitor-list', Array.from(visitors.values()))
    })

    socket.on('disconnect', () => {
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

  io.to('admins').emit('visitor-joined', visitor)
  io.to('admins').emit('visitor-list', Array.from(visitors.values()))
  socket.emit('welcome', visitor)

  socket.on('visitor-message', (data) => {
    console.log(`Visitor ${visitor.name} says: ${data.text}`)
    const msg = {
      id: `m_${Date.now()}`,
      from: 'visitor',
      visitorId: visitor.id,
      visitorName: visitor.name,
      text: data.text,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    }
    const admins = io.sockets.adapter.rooms.get('admins')
    console.log(`  -> forwarding to admins room (${admins ? admins.size : 0} admins)`)
    io.to('admins').emit('message', msg)

    const v = visitors.get(socket.id)
    if (v) v.unread++
    io.to('admins').emit('visitor-list', Array.from(visitors.values()))
  })

  socket.on('disconnect', () => {
    visitors.delete(socket.id)
    io.to('admins').emit('visitor-left', visitorId)
    io.to('admins').emit('visitor-list', Array.from(visitors.values()))
    console.log(`Visitor disconnected: ${name}`)
  })
})

const PORT = process.env.PORT || 3000
http.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
