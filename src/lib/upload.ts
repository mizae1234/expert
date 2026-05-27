async function compressImageIfNeeded(file: File): Promise<File> {
  // If not in a browser environment or not an image, return original file
  if (typeof window === 'undefined' || !file.type.startsWith('image/')) {
    return file
  }

  // If the file is smaller than 150KB, skip compression
  if (file.size < 150 * 1024) {
    return file
  }

  return new Promise((resolve) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      const MAX_WIDTH = 2048
      let { width, height } = img

      if (width > MAX_WIDTH) {
        height = Math.round((height * MAX_WIDTH) / width)
        width = MAX_WIDTH
      } else if (file.size < 500 * 1024) {
        // If width is already under 2048 and file is under 500KB, skip to save CPU
        resolve(file)
        return
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        resolve(file)
        return
      }

      ctx.drawImage(img, 0, 0, width, height)

      // Preserve PNG transparency by exporting as PNG; otherwise compress to JPEG at 0.88 quality
      const isPng = file.type === 'image/png'
      const outputType = isPng ? 'image/png' : 'image/jpeg'
      const quality = isPng ? undefined : 0.88

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file)
            return
          }
          const compressedFile = new File([blob], file.name, {
            type: outputType,
            lastModified: Date.now(),
          })
          resolve(compressedFile)
        },
        outputType,
        quality
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(file)
    }

    img.src = objectUrl
  })
}

export async function uploadToR2(file: File, folder: string): Promise<string> {
  const fileToUpload = await compressImageIfNeeded(file)
  const formData = new FormData()
  formData.append('file', fileToUpload)
  formData.append('folder', folder)

  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.error || 'Failed to upload file')
  }

  const { publicUrl } = await res.json()
  return publicUrl
}
