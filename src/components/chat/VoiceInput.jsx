import { useState, useRef } from 'react'

export default function VoiceInput({ onResult }) {
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef(null)

  const start = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('你的浏览器不支持语音输入，请使用 Chrome 或 Edge')
      return
    }
    const recognition = new SpeechRecognition()
    recognition.lang = 'zh-CN'
    recognition.interimResults = false
    recognition.continuous = false

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript
      onResult(text)
    }
    recognition.onerror = () => setListening(false)
    recognition.onend = () => setListening(false)

    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
  }

  const stop = () => {
    recognitionRef.current?.stop()
    setListening(false)
  }

  return (
    <button
      onClick={listening ? stop : start}
      className={`p-2.5 rounded-lg transition-all cursor-pointer shrink-0 ${
        listening
          ? 'bg-red-500 text-white animate-pulse'
          : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500'
      }`}
      title={listening ? '点击停止' : '语音输入'}
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      </svg>
    </button>
  )
}
