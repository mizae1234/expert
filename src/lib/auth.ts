import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import { verifyJWT } from '@/lib/jwt'
import crypto from 'crypto'

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex')
  return `pbkdf2$1000$${salt}$${hash}`
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const parts = storedHash.split('$')
    if (parts.length !== 4) return false
    const [, iterations, salt, hash] = parts
    const testHash = crypto.pbkdf2Sync(password, salt, parseInt(iterations), 64, 'sha512').toString('hex')
    return hash === testHash
  } catch (err) {
    return false
  }
}

export async function getSession() {
  const cookieStore = cookies()
  const token = cookieStore.get('expert-token')?.value
  if (!token) return null
  
  const payload = await verifyJWT(token)
  if (!payload || !payload.id) return null
  
  // Verify user still exists and is active in DB
  const user = await prisma.user.findUnique({
    where: { id: payload.id }
  })
  
  if (!user || !user.isActive) return null
  
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
  }
}

export async function requireAuth() {
  const session = await getSession()
  if (!session) {
    throw new Error('Unauthorized')
  }
  return session
}

export async function requireRole(allowedRoles: ('ADMIN' | 'ACCOUNTANT' | 'STAFF')[]) {
  const session = await requireAuth()
  if (!allowedRoles.includes(session.role)) {
    throw new Error('Forbidden')
  }
  return session
}
