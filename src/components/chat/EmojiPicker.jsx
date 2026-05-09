import { useState } from 'react'

const emojis = [
  '😀','😂','🤣','😍','🥰','😎','🤩','😜','🤔','😅',
  '😢','😭','😤','😡','🥺','😱','🤯','🥳','😴','🤗',
  '👍','👎','👏','🙌','💪','🤝','✌️','🤞','🙏','👋',
  '❤️','💔','🔥','⭐','🎉','💯','✅','❌','💩','🤡',
  '🐶','🐱','🦊','🐼','🐨','🐸','🦁','🐷','🐮','🐵',
  '🍕','🍔','🌮','🍣','🍩','🎂','☕','🍺','🍷','🥤',
]

export default function EmojiPicker({ onSelect, onClose }) {
  const [filter, setFilter] = useState('')

  const filtered = filter
    ? emojis.filter(e => e.includes(filter) || e === filter)
    : emojis

  return (
    <div className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-3 w-72 z-50">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs text-gray-500 dark:text-gray-400">表情</span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg leading-none cursor-pointer">&times;</button>
      </div>
      <div className="grid grid-cols-10 gap-1 max-h-48 overflow-y-auto">
        {filtered.map((emoji, i) => (
          <button
            key={i}
            onClick={() => onSelect(emoji)}
            className="w-7 h-7 flex items-center justify-center text-lg hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer transition-colors"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  )
}
