import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Simple JWT decode (no signature verification - that happens in API routes)
// Middleware only needs to check: does the token exist and is it not expired?
function decodeJWTPayload(token: string): any | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    
    // Decode payload (base64url → JSON)
    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    while (base64.length % 4) base64 += '='
    const payload = JSON.parse(atob(base64))
    
    // Check expiry
    if (payload.exp && Math.floor(Date.now() / 1000) >= payload.exp) {
      return null
    }
    
    return payload
  } catch {
    return null
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Define public paths that don't need authentication
  const isPublicPath = 
    pathname === '/login' ||
    pathname.startsWith('/api/auth/login') ||
    pathname.startsWith('/api/auth/logout') ||
    pathname.startsWith('/api/auth/debug') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') // for files like favicon.ico, images, etc.

  if (isPublicPath) {
    return NextResponse.next()
  }

  // Get token from cookies
  const token = request.cookies.get('expert-token')?.value

  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Decode token (lightweight check - no crypto needed)
  const payload = decodeJWTPayload(token)
  if (!payload) {
    const response = pathname.startsWith('/api/')
      ? NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      : NextResponse.redirect(new URL('/login', request.url))
    
    // Clear invalid token cookie
    response.cookies.delete('expert-token')
    return response
  }

  // Enforce role-based access control at middleware level
  const userRole = payload.role

  // Staff restriction
  if (userRole === 'STAFF') {
    const isAllowed = 
      pathname === '/dashboard' ||
      pathname.startsWith('/claims') ||
      pathname.startsWith('/insurances') ||
      pathname.startsWith('/vendors') ||
      pathname.startsWith('/parts-master') ||
      pathname.startsWith('/api/claims') ||
      pathname.startsWith('/api/insurances') ||
      pathname.startsWith('/api/vendors') ||
      pathname.startsWith('/api/parts-master') ||
      pathname.startsWith('/api/stats') ||
      pathname.startsWith('/api/upload') ||
      pathname.startsWith('/api/auth/me')

    if (!isAllowed) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Accountant restriction
  if (userRole === 'ACCOUNTANT') {
    const isSettingsPage = pathname.startsWith('/settings') || pathname.startsWith('/api/settings') || pathname.startsWith('/api/users')
    if (isSettingsPage) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}

