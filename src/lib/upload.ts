export async function uploadToR2(file: File, folder: string): Promise<string> {
  // 1. Get presigned URL from our API
  const res = await fetch('/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type,
      folder,
    }),
  })

  if (!res.ok) {
    throw new Error('Failed to get upload URL')
  }

  const { signedUrl, publicUrl } = await res.json()

  // 2. Upload the file directly to Cloudflare R2
  const uploadRes = await fetch(signedUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type,
    },
    body: file,
  })

  if (!uploadRes.ok) {
    throw new Error('Failed to upload file to R2')
  }

  // 3. Return the public URL
  return publicUrl
}
