export function pickFile() {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.onchange = () => {
      const file = input.files[0]
      if (!file) return reject(new Error('No file'))
      if (file.size > 5 * 1024 * 1024) {
        return reject(new Error('文件不能超过 5MB'))
      }
      const reader = new FileReader()
      reader.onload = () => resolve({
        name: file.name,
        size: file.size,
        type: file.type,
        data: reader.result,
      })
      reader.onerror = reject
      reader.readAsDataURL(file)
    }
    input.click()
  })
}

export function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}
