import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const activeOnly = searchParams.get('active') === 'true'

    const where: any = {}
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { serviceCode: { contains: search, mode: 'insensitive' } }
      ]
    }
    if (activeOnly) {
      where.isActive = true
    }

    const services = await prisma.serviceMaster.findMany({
      where,
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(services)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, price, isActive } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Auto-generate serviceCode SV-XXXXX
    const latest = await prisma.serviceMaster.findFirst({
      orderBy: { serviceCode: 'desc' }
    })
    
    let nextNo = 1
    if (latest && latest.serviceCode) {
      const match = latest.serviceCode.match(/(\d+)$/)
      if (match) {
        nextNo = parseInt(match[1], 10) + 1
      }
    }
    const serviceCode = `SV-${String(nextNo).padStart(5, '0')}`

    const newService = await prisma.serviceMaster.create({
      data: {
        serviceCode,
        name,
        price: typeof price === 'number' ? price : 0,
        isActive: isActive !== false
      }
    })

    return NextResponse.json(newService, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
