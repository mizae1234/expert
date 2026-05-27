const JWT_SECRET = process.env.JWT_SECRET || 'expert-body-paint-super-secret-key-2026'

// Base64Url helpers
function base64UrlEncode(str: string): string {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  while (base64.length % 4) base64 += '='
  return decodeURIComponent(escape(atob(base64)))
}

function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

function base64UrlToArrayBuffer(base64Url: string): ArrayBuffer {
  let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
  while (base64.length % 4) base64 += '='
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

export async function signJWT(payload: any, expiresInSeconds: number = 28800): Promise<string> {
  const encoder = new TextEncoder()
  const header = { alg: 'HS256', typ: 'JWT' }
  const headerStr = base64UrlEncode(JSON.stringify(header))
  
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds
  const fullPayload = { ...payload, exp }
  const payloadStr = base64UrlEncode(JSON.stringify(fullPayload))
  
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(JWT_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(`${headerStr}.${payloadStr}`)
  )
  
  const signatureStr = arrayBufferToBase64Url(signature)
  return `${headerStr}.${payloadStr}.${signatureStr}`
}

export async function verifyJWT(token: string): Promise<any | null> {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    
    const [headerStr, payloadStr, signatureStr] = parts
    const encoder = new TextEncoder()
    
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(JWT_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    )
    
    const signature = base64UrlToArrayBuffer(signatureStr)
    const data = encoder.encode(`${headerStr}.${payloadStr}`)
    
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signature,
      data
    )
    
    if (!isValid) return null
    
    const payload = JSON.parse(base64UrlDecode(payloadStr))
    if (payload.exp && Math.floor(Date.now() / 1000) >= payload.exp) {
      return null // Expired
    }
    
    return payload
  } catch (err) {
    return null
  }
}
