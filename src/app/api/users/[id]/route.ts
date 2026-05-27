import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireRole, hashPassword } from '@/lib/auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireRole(['ADMIN'])
    const body = await request.json()
    const { username, name, role, isActive, password } = body

    if (params.id === session.id && isActive === false) {
      return NextResponse.json({ error: 'ไม่สามารถปิดการใช้งานบัญชีของตนเองได้' }, { status: 400 })
    }

    const data: any = {}
    if (username) data.username = username.toLowerCase().trim()
    if (name) data.name = name
    if (role) data.role = role
    if (isActive !== undefined) data.isActive = Boolean(isActive)
    if (password) data.password = hashPassword(password)

    if (username) {
      const existing = await prisma.user.findFirst({
        where: {
          username: data.username,
          NOT: { id: params.id }
        }
      })
      if (existing) {
        return NextResponse.json({ error: 'ชื่อผู้ใช้งานนี้มีอยู่ในระบบแล้ว' }, { status: 400 })
      }
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data,
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireRole(['ADMIN'])

    if (params.id === session.id) {
      return NextResponse.json({ error: 'ไม่สามารถลบบัญชีของตนเองได้' }, { status: 400 })
    }

    try {
      await prisma.user.delete({
        where: { id: params.id }
      })
      return NextResponse.json({ success: true, message: 'ลบผู้ใช้งานเรียบร้อย' })
    } catch (err) {
      await prisma.user.update({
        where: { id: params.id },
        data: { isActive: false }
      })
      return NextResponse.json({ success: true, message: 'ปิดการใช้งานผู้ใช้งานเนื่องจากมีข้อมูลอ้างอิง' })
    }
  } catch (err: any) {
    const status = err.message === 'Unauthorized' ? 401 : err.message === 'Forbidden' ? 403 : 500
    return NextResponse.json({ error: err.message }, { status })
  }
}
