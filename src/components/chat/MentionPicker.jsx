export default function MentionPicker({ users, me, onSelect, onClose }) {
  const others = users.filter(u => u.id !== me?.id)

  return (
    <div className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-1 w-48 z-50 max-h-56 overflow-y-auto">
      <div className="px-3 py-1.5 text-xs text-gray-400 font-medium">选择要 @ 的人</div>
      {others.length === 0 && (
        <p className="px-3 py-2 text-sm text-gray-400">暂无其他在线成员</p>
      )}
      {others.map(u => (
        <button
          key={u.id}
          onClick={() => onSelect(u.name)}
          className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
        >
          <div className="w-7 h-7 rounded-md flex items-center justify-center text-white font-bold text-xs shrink-0"
            style={{ backgroundColor: u.color }}>
            {u.name[0]}
          </div>
          <span className="text-sm truncate">{u.name}</span>
        </button>
      ))}
      <button
        onClick={() => onSelect('所有人')}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors cursor-pointer border-t border-gray-100 dark:border-gray-700"
      >
        <div className="w-7 h-7 rounded-md flex items-center justify-center bg-blue-500 text-white font-bold text-xs shrink-0">
          @
        </div>
        <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">所有人</span>
      </button>
    </div>
  )
}
