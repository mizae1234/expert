import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireRole, hashPassword } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    await requireRole(['ADMIN'])
    const users = await prisma.user.findMany({
      orderBy: { username: 'asc' },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      }
    })
    return NextResponse.json(users)
  } catch (err: any) {
    const status = err.message === 'Unauthorized' ? 401 : err.message === 'Forbidden' ? 403 : 500
    return NextResponse.json({ error: err.message }, { status })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(['ADMIN'])
    const body = await request.json()
    const { username, password, name, role } = body

    if (!username || !password || !name || !role) {
      return NextResponse.json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' }, { status: 400 })
    }

    const cleanUsername = username.toLowerCase().trim()

    const existingUser = await prisma.user.findUnique({
      where: { username: cleanUsername }
    })

    if (existingUser) {
      return NextResponse.json({ error: 'ชื่อผู้ใช้งานนี้มีอยู่ในระบบแล้ว' }, { status: 400 })
    }

    const hashedPassword = hashPassword(password)

    const user = await prisma.user.create({
      data: {
        username: cleanUsername,
        password: hashedPassword,
        name,
        role,
        isActive: true,
      },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      }
    })

    return NextResponse.json(user)
  } catch (err: any) {
    const status = err.message === 'Unauthorized' ? 401 : err.message === 'Forbidden' ? 403 : 500
    return NextResponse.json({ error: err.message }, { status })
  }
}
