import { useState, useEffect, useRef } from 'react'
import { useSocket } from '../hooks/useSocket'
import { pickAndResizeImage } from '../utils/image'
import ThemeToggle from '../components/ui/ThemeToggle'

function MessageBubble({ msg, isMe }) {
  const isImage = msg.type === 'image'
  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className="max-w-[75%]">
        {!isMe && <p className="text-xs text-gray-400 mb-1 ml-1">客服</p>}
        <div className={`rounded-lg overflow-hidden ${
          isImage
            ? 'bg-transparent'
            : `px-3 py-2 text-sm leading-relaxed break-words ${
                isMe
                  ? 'bg-primary-500 text-white rounded-br-sm'
                  : 'bg-white dark:bg-gray-700 shadow-sm border border-gray-100 dark:border-gray-600 rounded-bl-sm'
              }`
        }`}>
          {isImage ? (
            <img src={msg.image} alt="sent" className="max-w-full rounded-lg" style={{ maxHeight: 300 }} />
          ) : (
            msg.text
          )}
        </div>
        <p className={`text-[10px] text-gray-400 mt-1 ${isMe ? 'text-right' : 'text-left'}`}>
          {msg.time}
        </p>
      </div>
    </div>
  )
}

export default function Visitor() {
  const { socket, connected, visitor } = useSocket()
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (!socket.current || !connected) return
    const s = socket.current
    s.on('message', (msg) => setMessages(prev => [...prev, msg]))
    return () => { s.off('message') }
  }, [socket, connected])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendText = () => {
    if (!text.trim() || !socket.current) return
    const msg = {
      id: `m_${Date.now()}`,
      from: 'visitor',
      type: 'text',
      text,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    }
    setMessages(prev => [...prev, msg])
    socket.current.emit('visitor-message', { type: 'text', text })
    setText('')
    inputRef.current?.focus()
  }

  const sendImage = async () => {
    if (!socket.current) return
    try {
      const dataUrl = await pickAndResizeImage()
      const msg = {
        id: `m_${Date.now()}`,
        from: 'visitor',
        type: 'image',
        image: dataUrl,
        text: '',
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages(prev => [...prev, msg])
      socket.current.emit('visitor-message', { type: 'image', image: dataUrl, text: '' })
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

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <header className="h-12 flex items-center justify-between px-4 bg-primary-500 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-white/20 flex items-center justify-center text-white text-xs font-bold">
            {visitor?.name?.[0] || '?'}
          </div>
          <span className="text-white font-medium text-sm">
            {visitor ? `${visitor.name} - 在线客服` : '连接中...'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-300' : 'bg-red-400'}`} />
          <ThemeToggle light />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto py-4 px-4 bg-gray-50 dark:bg-gray-800/50">
        {messages.length === 0 && (
          <div className="text-center mt-20">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <svg className="w-8 h-8 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-gray-400 text-sm">你好！有什么可以帮你的？</p>
          </div>
        )}
        {messages.map(msg => {
          const isMe = msg.from === 'visitor'
          return <MessageBubble key={msg.id} msg={msg} isMe={isMe} />
        })}
        <div ref={bottomRef} />
      </div>

      <div className="flex items-end gap-2 p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shrink-0">
        <button
          onClick={sendImage}
          disabled={!connected}
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
          placeholder="输入消息..."
          rows={1}
          className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 resize-none outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm"
        />
        <button
          onClick={sendText}
          disabled={!text.trim() || !connected}
          className="px-5 py-2.5 rounded-lg bg-primary-500 text-white font-medium text-sm hover:bg-primary-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shrink-0"
        >
          发送
        </button>
      </div>
    </div>
  )
}
