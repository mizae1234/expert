import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const service = await prisma.serviceMaster.findUnique({
      where: { id: params.id }
    })

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    return NextResponse.json(service)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { name, price, isActive } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const updated = await prisma.serviceMaster.update({
      where: { id: params.id },
      data: {
        name,
        price: typeof price === 'number' ? price : 0,
        isActive: isActive !== false
      }
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const serviceId = params.id

    // Fetch the service first to get its name
    const service = await prisma.serviceMaster.findUnique({
      where: { id: serviceId }
    })

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    // Check if the service name is used in any ServiceItem
    const serviceItemCount = await prisma.serviceItem.count({
      where: { description: service.name }
    })

    if (serviceItemCount > 0) {
      return NextResponse.json(
        { error: `ไม่สามารถลบรายการบริการนี้ได้ เนื่องจากถูกใช้งานอยู่ในใบสั่งงานจำนวน ${serviceItemCount} รายการ` },
        { status: 400 }
      )
    }

    await prisma.serviceMaster.delete({
      where: { id: serviceId }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
