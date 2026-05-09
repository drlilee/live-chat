import { useState, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import ThemeToggle from '../components/ui/ThemeToggle'

function PasswordModal({ onSubmit, error }) {
  const [pwd, setPwd] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold">管理后台</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">请输入管理密码</p>
        </div>
        <form onSubmit={e => { e.preventDefault(); onSubmit(pwd) }}>
          <input
            type="password"
            value={pwd}
            onChange={e => setPwd(e.target.value)}
            placeholder="请输入密码"
            autoFocus
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 mb-3"
          />
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          <button
            type="submit"
            className="w-full py-3 rounded-lg bg-gray-800 dark:bg-gray-600 text-white font-medium hover:bg-gray-900 dark:hover:bg-gray-500 transition-colors cursor-pointer"
          >
            登录
          </button>
        </form>
      </div>
    </div>
  )
}

export default function Admin() {
  const [authed, setAuthed] = useState(false)
  const [authError, setAuthError] = useState('')
  const [users, setUsers] = useState([])
  const [messages, setMessages] = useState([])
  const socketRef = useRef(null)
  const bottomRef = useRef(null)

  const handleAuth = (pwd) => {
    if (!socketRef.current) return
    socketRef.current.emit('admin-auth', pwd, (res) => {
      if (res.ok) {
        setAuthed(true)
        setUsers(res.users || [])
      } else {
        setAuthError('密码错误')
      }
    })
  }

  useEffect(() => {
    const s = io('', { transports: ['websocket', 'polling'] })
    socketRef.current = s

    s.on('user-list', (list) => setUsers(list))
    s.on('user-joined', (u) => setUsers(prev => prev.find(x => x.id === u.id) ? prev : [...prev, u]))
    s.on('user-left', (id) => setUsers(prev => prev.filter(x => x.id !== id)))
    s.on('message', (msg) => setMessages(prev => [...prev, msg]))

    return () => { s.disconnect() }
  }, [])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  if (!authed) {
    return <PasswordModal onSubmit={handleAuth} error={authError} />
  }

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <header className="h-12 flex items-center justify-between px-4 bg-gray-800 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-white font-semibold text-sm">三1班八卦群管理端</span>
          <span className="text-white/70 text-xs">{users.length} 人在线</span>
        </div>
        <ThemeToggle light />
      </header>

      <div className="flex-1 flex min-h-0">
        {/* User list */}
        <div className="w-56 shrink-0 border-r border-gray-200 dark:border-gray-700 flex flex-col bg-gray-50 dark:bg-gray-800/50">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">在线成员</span>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {users.map(u => (
              <div key={u.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg">
                <div className="w-8 h-8 rounded-md flex items-center justify-center text-white font-bold text-sm shrink-0"
                  style={{ backgroundColor: u.color }}>
                  {u.name[0]}
                </div>
                <span className="text-sm truncate">{u.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chat view */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-y-auto py-4 bg-gray-50 dark:bg-gray-800/30">
            {messages.map(msg => {
              const isImg = msg.type === 'image'
              return (
                <div key={msg.id} className="flex justify-start mb-4 px-4">
                  <div className="max-w-[70%]">
                    <p className="text-xs mb-1 ml-1" style={{ color: msg.color }}>{msg.name}</p>
                    <div className={`rounded-lg overflow-hidden ${
                      isImg
                        ? 'bg-transparent'
                        : 'px-3 py-2 text-sm leading-relaxed bg-white dark:bg-gray-700 shadow-sm border border-gray-100 dark:border-gray-600 rounded-bl-sm'
                    }`}>
                      {isImg
                        ? <img src={msg.image} alt="" className="rounded-lg" style={{ maxWidth: 280, maxHeight: 300 }} />
                        : msg.text
                      }
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1 text-left">{msg.time}</p>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>

          <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-center text-sm text-gray-400">
            管理端 — 只读模式查看群聊
          </div>
        </div>
      </div>
    </div>
  )
}
