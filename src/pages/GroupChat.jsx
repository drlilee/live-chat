import { useState, useEffect, useRef } from 'react'
import { useSocket } from '../hooks/useSocket'
import { pickAndResizeImage } from '../utils/image'
import NameModal from '../components/ui/NameModal'
import ThemeToggle from '../components/ui/ThemeToggle'

export default function GroupChat() {
  const { socket, connected, me, history, addMessage, removeMessage, announcement } = useSocket()
  const [users, setUsers] = useState([])
  const [text, setText] = useState('')
  const [kicked, setKicked] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (!socket.current || !connected) return
    const s = socket.current

    s.on('user-list', (list) => setUsers(list))
    s.on('user-joined', (user) => setUsers(prev => prev.find(u => u.id === user.id) ? prev : [...prev, user]))
    s.on('user-left', (id) => setUsers(prev => prev.filter(u => u.id !== id)))
    s.on('message', (msg) => addMessage(msg))
    s.on('message-recalled', (msgId) => removeMessage(msgId))
    s.on('kicked', () => setKicked(true))

    return () => {
      s.off('user-list')
      s.off('user-joined')
      s.off('user-left')
      s.off('message')
      s.off('message-recalled')
      s.off('kicked')
    }
  }, [socket, connected])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [history])

  const handleJoin = (name) => {
    if (socket.current) {
      socket.current.emit('join', name)
    }
  }

  const handleRecall = (msgId) => {
    if (socket.current) {
      socket.current.emit('recall-message', msgId)
    }
  }

  const sendText = () => {
    if (!text.trim() || !socket.current) return
    socket.current.emit('chat', { type: 'text', text })
    setText('')
    inputRef.current?.focus()
  }

  const sendImage = async () => {
    if (!socket.current) return
    try {
      const dataUrl = await pickAndResizeImage()
      socket.current.emit('chat', { type: 'image', image: dataUrl, text: '' })
    } catch { /* cancelled */ }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendText()
    }
  }

  const isMe = (msg) => msg.from === me?.id

  // Show name modal until user has joined
  if (kicked) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center p-8">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">您已被踢出聊群</h2>
          <p className="text-gray-500 dark:text-gray-400">如有疑问请联系管理员</p>
        </div>
      </div>
    )
  }

  if (!me) {
    return <NameModal onJoin={handleJoin} connecting={!connected} />
  }

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Header */}
      <header className="h-12 flex items-center justify-between px-4 bg-primary-500 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-white font-semibold text-sm">三1班八卦群</span>
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-300' : 'bg-red-400'}`} />
          <span className="text-white/70 text-xs">{users.length} 人在线</span>
        </div>
        <ThemeToggle light />
      </header>

      <div className="flex-1 flex min-h-0">
        {/* User list */}
        <div className="hidden md:flex w-56 shrink-0 border-r border-gray-200 dark:border-gray-700 flex-col bg-gray-50 dark:bg-gray-800/50">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">在线成员 ({users.length})</span>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {users.map(u => (
              <div key={u.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg">
                <div className="w-8 h-8 rounded-md flex items-center justify-center text-white font-bold text-sm shrink-0"
                  style={{ backgroundColor: u.color }}>
                  {u.name[0]}
                </div>
                <span className="text-sm truncate">{u.name}</span>
                {u.id === me?.id && <span className="text-[10px] text-gray-400 ml-auto">我</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-y-auto py-4 bg-gray-50 dark:bg-gray-800/30">
            {announcement && (
              <div className="flex justify-center mb-4 px-4">
                <div className="max-w-md w-full rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 text-center">
                  <svg className="w-5 h-5 text-amber-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                  </svg>
                  <p className="text-sm text-amber-800 dark:text-amber-200 whitespace-pre-line leading-relaxed">{announcement.text}</p>
                </div>
              </div>
            )}
            {history.length === 0 && announcement == null && (
              <div className="text-center mt-20 text-gray-400 text-sm">暂无消息，来打个招呼吧</div>
            )}
            {history.map(msg => {
              const mine = isMe(msg)
              const isImg = msg.type === 'image'
              return (
                <div key={msg.id} className={`flex ${mine ? 'justify-end' : 'justify-start'} mb-4 px-4`}>
                  <div className="max-w-[70%]">
                    {!mine && (
                      <p className="text-xs mb-1 ml-1" style={{ color: msg.color }}>{msg.name}</p>
                    )}
                    <div className={`rounded-lg overflow-hidden ${
                      isImg
                        ? 'bg-transparent'
                        : `px-3 py-2 text-sm leading-relaxed wrap-break-word ${
                            mine
                              ? 'bg-primary-500 text-white rounded-br-sm'
                              : 'bg-white dark:bg-gray-700 shadow-sm border border-gray-100 dark:border-gray-600 rounded-bl-sm'
                          }`
                    }`}>
                      {isImg
                        ? <img src={msg.image} alt="" className="rounded-lg" style={{ maxWidth: 280, maxHeight: 300 }} />
                        : msg.text
                      }
                    </div>
                    <div className={`flex items-center gap-1 mt-1 ${mine ? 'justify-end' : 'justify-start'}`}>
                      <p className="text-[10px] text-gray-400">{msg.time}</p>
                      {mine && msg.type !== 'image' && (
                        <button
                          onClick={() => handleRecall(msg.id)}
                          className="text-[10px] text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                          title="撤回"
                        >
                          撤回
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex items-end gap-2 p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shrink-0">
            <button onClick={sendImage} disabled={!connected}
              className="p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors cursor-pointer shrink-0">
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
            <textarea ref={inputRef} value={text} onChange={e => setText(e.target.value)} onKeyDown={handleKeyDown}
              placeholder={`${me?.name || ''}，说点什么...`} rows={1}
              className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 resize-none outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm" />
            <button onClick={sendText} disabled={!text.trim() || !connected}
              className="px-5 py-2.5 rounded-lg bg-primary-500 text-white font-medium text-sm hover:bg-primary-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shrink-0">
              发送
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
