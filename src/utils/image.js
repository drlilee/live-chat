export function pickAndResizeImage() {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'

    input.onchange = () => {
      const file = input.files[0]
      if (!file) return reject(new Error('No file selected'))

      const reader = new FileReader()
      reader.onload = () => {
        const img = new Image()
        img.onload = () => {
          const maxW = 800
          if (img.width <= maxW) {
            return resolve(reader.result)
          }
          const canvas = document.createElement('canvas')
          const ratio = maxW / img.width
          canvas.width = maxW
          canvas.height = img.height * ratio
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          resolve(canvas.toDataURL('image/jpeg', 0.75))
        }
        img.src = reader.result
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    }

    input.click()
  })
}
