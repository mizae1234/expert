import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyPassword } from '@/lib/auth'
import { signJWT } from '@/lib/jwt'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()
    if (!username || !password) {
      return NextResponse.json({ error: 'กรุณากรอกผู้ใช้งานและรหัสผ่าน' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase().trim() }
    })

    if (!user || !user.isActive || !verifyPassword(password, user.password)) {
      return NextResponse.json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' }, { status: 401 })
    }

    const token = await signJWT({ id: user.id, username: user.username, role: user.role })

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
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 28800 // 8 hours
    })

    return response
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
