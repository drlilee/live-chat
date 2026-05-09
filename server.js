import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const http = createServer(app)
const io = new Server(http, { cors: { origin: '*' } })

app.use(express.static(join(__dirname, 'dist'), {
  setHeaders: (res) => res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
}))
app.use((_req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
  res.sendFile(join(__dirname, 'dist', 'index.html'))
})

const colors = ['#f43f5e','#8b5cf6','#06b6d4','#f59e0b','#10b981','#6366f1',
  '#ec4899','#14b8a6','#f97316','#3b82f6','#e11d48','#7c3aed']

const users = new Map()
const adminPassword = 'admin123'
const messageHistory = []
const MAX_HISTORY = 200

const announcement = {
  id: 'announcement',
  type: 'system',
  text: '进入"三1班八卦群"，请文明用语，不能刷屏，谢谢。\n发布者：威风的龙lele',
}

io.on('connection', (socket) => {
  let user = null

  socket.on('join', (name) => {
    const cleanName = name.trim().slice(0, 12) || '游客'
    user = {
      id: socket.id,
      name: cleanName,
      color: colors[Math.floor(Math.random() * colors.length)],
    }
    users.set(socket.id, user)
    socket.join('group')

    console.log(`${cleanName} joined (${users.size} online)`)
    socket.emit('welcome', { user, history: messageHistory, announcement })
    io.to('group').emit('user-joined', user)
    io.to('group').emit('user-list', Array.from(users.values()))
  })

  socket.on('chat', (data) => {
    if (!user) return
    const msg = {
      id: `m_${Date.now()}`,
      from: socket.id,
      name: user.name,
      color: user.color,
      type: data.type || 'text',
      text: data.text || '',
      image: data.image || '',
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    }
    messageHistory.push(msg)
    if (messageHistory.length > MAX_HISTORY) messageHistory.shift()
    io.to('group').emit('message', msg)
  })

  socket.on('admin-auth', (password, cb) => {
    if (password === adminPassword) {
      socket.join('admins')
      socket.join('group')
      cb({ ok: true, users: Array.from(users.values()), history: messageHistory })
    } else {
      cb({ ok: false })
    }
  })

  socket.on('kick-user', (targetId) => {
    if (!io.sockets.adapter.rooms.get('admins')?.has(socket.id)) return
    const target = io.sockets.sockets.get(targetId)
    if (target && users.has(targetId)) {
      const kickedUser = users.get(targetId)
      target.emit('kicked')
      target.disconnect()
      users.delete(targetId)
      io.to('group').emit('user-left', targetId)
      io.to('group').emit('user-list', Array.from(users.values()))
      io.to('admins').emit('user-list', Array.from(users.values()))
      console.log(`${kickedUser.name} was kicked by admin`)
    }
  })

  socket.on('disconnect', () => {
    if (user) {
      users.delete(socket.id)
      console.log(`${user.name} left (${users.size} online)`)
      io.to('group').emit('user-left', socket.id)
      io.to('group').emit('user-list', Array.from(users.values()))
      io.to('admins').emit('user-list', Array.from(users.values()))
    }
  })
})

const PORT = process.env.PORT || 3000
http.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`))
