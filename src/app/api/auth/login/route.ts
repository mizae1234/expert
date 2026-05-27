import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyPassword } from '@/lib/auth'
import { signJWT } from '@/lib/jwt'

export async function POST(request: NextRequest) {
  try {
    console.log('[LOGIN] Start')
    const { username, password } = await request.json()
    if (!username || !password) {
      return NextResponse.json({ error: 'กรุณากรอกผู้ใช้งานและรหัสผ่าน' }, { status: 400 })
    }

    console.log('[LOGIN] Finding user:', username)
    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase().trim() }
    })
    console.log('[LOGIN] User found:', !!user)

    if (!user || !user.isActive || !verifyPassword(password, user.password)) {
      console.log('[LOGIN] Auth failed - user:', !!user, 'active:', user?.isActive, 'password:', user ? verifyPassword(password, user.password) : 'no-user')
      return NextResponse.json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' }, { status: 401 })
    }

    console.log('[LOGIN] Signing JWT...')
    const token = await signJWT({ id: user.id, username: user.username, role: user.role })
    console.log('[LOGIN] JWT signed, length:', token.length)

    const response = NextResponse.json({ 
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role
      }
    })

    response.cookies.set({
      name: 'expert-token',
      value: token,
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 28800 // 8 hours
    })

    console.log('[LOGIN] Success for:', user.username)
    return response
  } catch (err: any) {
    console.error('[LOGIN] ERROR:', err)
    return NextResponse.json({ error: err.message, stack: err.stack?.slice(0, 300) }, { status: 500 })
  }
}

