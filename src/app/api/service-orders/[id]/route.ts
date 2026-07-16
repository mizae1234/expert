import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const order = await prisma.serviceOrder.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        vehicles: {
          include: {
            items: true
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json({ error: 'Service order not found' }, { status: 404 })
    }

    return NextResponse.json(order)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { status } = body

    const updateData: any = {}
    if (status) updateData.status = status

    const updated = await prisma.serviceOrder.update({
      where: { id: params.id },
      data: updateData,
      include: {
        customer: true,
        vehicles: {
          include: {
            items: true
          }
        }
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
    const orderId = params.id

    const vehicles = await prisma.serviceVehicle.findMany({
      where: { serviceOrderId: orderId },
      select: { id: true }
    })
    const vehicleIds = vehicles.map(v => v.id)

    await prisma.serviceItem.deleteMany({
      where: { serviceVehicleId: { in: vehicleIds } }
    })

    await prisma.serviceVehicle.deleteMany({
      where: { serviceOrderId: orderId }
    })

    await prisma.serviceOrder.delete({
      where: { id: orderId }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
