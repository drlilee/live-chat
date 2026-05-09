import { useState, useEffect, useRef, useCallback } from 'react'
import { useSocket } from '../hooks/useSocket'
import { pickAndResizeImage } from '../utils/image'
import ThemeToggle from '../components/ui/ThemeToggle'

function MessageBubble({ msg, activeVisitor }) {
  const isAdmin = msg.from === 'admin'
  const isImage = msg.type === 'image'
  return (
    <div className={`flex ${isAdmin ? 'justify-end' : 'justify-start'} mb-4 px-4`}>
      <div className="max-w-[70%]">
        {!isAdmin && (
          <p className="text-xs text-gray-400 mb-1 ml-1">{msg.visitorName || activeVisitor?.name}</p>
        )}
        <div className={`rounded-lg overflow-hidden ${
          isImage
            ? 'bg-transparent'
            : `px-3 py-2 text-sm leading-relaxed break-words ${
                isAdmin
                  ? 'bg-green-500 text-white rounded-br-sm'
                  : 'bg-white dark:bg-gray-700 shadow-sm border border-gray-100 dark:border-gray-600 rounded-bl-sm'
              }`
        }`}>
          {isImage ? (
            <img src={msg.image} alt="sent" className="max-w-full rounded-lg" style={{ maxHeight: 300 }} />
          ) : (
            msg.text
          )}
        </div>
        <p className={`text-[10px] text-gray-400 mt-1 ${isAdmin ? 'text-right' : 'text-left'}`}>
          {msg.time}
        </p>
      </div>
    </div>
  )
}

export default function Admin() {
  const { socket, connected } = useSocket()
  const [visitors, setVisitors] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [conversations, setConversations] = useState({})
  const [text, setText] = useState('')
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (!socket.current || !connected) return
    const s = socket.current

    s.on('visitor-list', (list) => setVisitors(list))

    s.on('visitor-joined', (v) => {
      setVisitors(prev => {
        if (prev.find(x => x.id === v.id)) return prev
        return [...prev, v]
      })
    })

    s.on('visitor-left', (id) => {
      setVisitors(prev => prev.filter(v => v.id !== id))
      setActiveId(prev => prev === id ? null : prev)
    })

    s.on('message', (msg) => {
      const key = msg.visitorId
      if (!key) return
      setConversations(prev => ({
        ...prev,
        [key]: [...(prev[key] || []), msg],
      }))
    })

    return () => {
      s.off('visitor-list')
      s.off('visitor-joined')
      s.off('visitor-left')
      s.off('message')
    }
  }, [socket, connected])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversations, activeId])

  const selectVisitor = useCallback((id) => {
    setActiveId(id)
    if (socket.current) {
      socket.current.emit('clear-unread', id)
      setVisitors(prev => prev.map(v => v.id === id ? { ...v, unread: 0 } : v))
    }
  }, [socket])

  const sendText = () => {
    if (!text.trim() || !activeId || !socket.current) return
    socket.current.emit('send-to-visitor', { visitorId: activeId, type: 'text', text })
    setText('')
    inputRef.current?.focus()
  }

  const sendImage = async () => {
    if (!activeId || !socket.current) return
    try {
      const dataUrl = await pickAndResizeImage()
      socket.current.emit('send-to-visitor', { visitorId: activeId, type: 'image', image: dataUrl, text: '' })
    } catch {
      // user cancelled
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendText()
    }
  }

  const activeMsgs = activeId ? (conversations[activeId] || []) : []
  const activeVisitor = visitors.find(v => v.id === activeId)

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <header className="h-12 flex items-center justify-between px-4 bg-gray-800 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-white font-semibold text-sm">管理后台</span>
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`} />
          <span className="text-gray-400 text-xs ml-2">在线访客: {visitors.length}</span>
        </div>
        <ThemeToggle light />
      </header>

      <div className="flex-1 flex min-h-0">
        {/* Visitor list */}
        <div className="w-64 lg:w-72 shrink-0 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">在线访客</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {visitors.length === 0 && (
              <p className="text-gray-400 text-sm text-center mt-10">暂无在线访客</p>
            )}
            {visitors.map(v => (
              <button
                key={v.id}
                onClick={() => selectVisitor(v.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors cursor-pointer
                  ${activeId === v.id
                    ? 'bg-primary-50 dark:bg-primary-900/20'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
              >
                <div className="w-9 h-9 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {v.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-sm truncate block">{v.name}</span>
                  <span className="text-xs text-gray-400">ID: {v.id}</span>
                </div>
                {v.unread > 0 && (
                  <span className="shrink-0 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center font-medium">
                    {v.unread > 99 ? '99+' : v.unread}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col min-w-0">
          {!activeVisitor ? (
            <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-800/30">
              <div className="text-center">
                <svg className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
                <p className="text-gray-400 text-sm">
                  {visitors.length === 0 ? '等待访客连接...' : '选择一个访客开始聊天'}
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="h-14 flex items-center gap-3 px-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shrink-0">
                <div className="w-9 h-9 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold shrink-0">
                  {activeVisitor.name[0]}
                </div>
                <div>
                  <div className="font-medium text-sm">{activeVisitor.name}</div>
                  <div className="text-xs text-gray-400">ID: {activeVisitor.id}</div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto py-4 bg-gray-50 dark:bg-gray-800/30">
                {activeMsgs.length === 0 && (
                  <p className="text-center text-gray-400 text-sm mt-20">还没有消息</p>
                )}
                {activeMsgs.map(msg => (
                  <MessageBubble key={msg.id} msg={msg} activeVisitor={activeVisitor} />
                ))}
                <div ref={bottomRef} />
              </div>

              <div className="flex items-end gap-2 p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shrink-0">
                <button
                  onClick={sendImage}
                  disabled={!connected || !activeId}
                  className="p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors cursor-pointer shrink-0"
                  title="发送图片"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
                <textarea
                  ref={inputRef}
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`回复 ${activeVisitor.name}...`}
                  rows={1}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 resize-none outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-sm"
                />
                <button
                  onClick={sendText}
                  disabled={!text.trim() || !connected || !activeId}
                  className="px-5 py-2.5 rounded-lg bg-green-500 text-white font-medium text-sm hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shrink-0"
                >
                  发送
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
