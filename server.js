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
app.use((_req, res) => res.sendFile(join(__dirname, 'dist', 'index.html')))

const names = ['小明', '小红', '大壮', '阿花', '老张', '小丽', '阿强', '美美', '石头', '小雪',
  '乐乐', '豆豆', '果果', '圆圆', '大宝', '二丫', '三胖', '四儿', '五哥', '六妹']

let nameIdx = 0
const users = new Map() // socketId -> { id, name, color }

const colors = ['#f43f5e','#8b5cf6','#06b6d4','#f59e0b','#10b981','#6366f1',
  '#ec4899','#14b8a6','#f97316','#3b82f6']

io.on('connection', (socket) => {
  const name = names[nameIdx % names.length]
  nameIdx++
  const user = { id: socket.id, name, color: colors[nameIdx % colors.length] }
  users.set(socket.id, user)

  console.log(`${name} joined (${users.size} online)`)
  socket.join('group')

  // Welcome message
  socket.emit('welcome', { you: user, users: Array.from(users.values()) })
  // Notify others
  socket.to('group').emit('user-joined', user)
  socket.to('group').emit('user-list', Array.from(users.values()))

  // Chat message
  socket.on('chat', (data) => {
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
    io.to('group').emit('message', msg)
  })

  socket.on('disconnect', () => {
    users.delete(socket.id)
    console.log(`${name} left (${users.size} online)`)
    io.to('group').emit('user-left', socket.id)
    io.to('group').emit('user-list', Array.from(users.values()))
  })
})

const PORT = process.env.PORT || 3000
http.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`))
