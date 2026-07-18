import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

async function attachPhotosToOrder(order: any) {
  if (!order) return null
  const vehicleIds = order.vehicles.map((v: any) => v.id)
  const attachments = await prisma.attachment.findMany({
    where: {
      entityType: 'SERVICE_VEHICLE',
      entityId: { in: vehicleIds }
    }
  })

  const vehiclesWithPhotos = order.vehicles.map((v: any) => ({
    ...v,
    photos: attachments.filter(a => a.entityId === v.id).map(a => a.fileUrl)
  }))

  return {
    ...order,
    vehicles: vehiclesWithPhotos
  }
}

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

    const orderWithPhotos = await attachPhotosToOrder(order)
    return NextResponse.json(orderWithPhotos)
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

    if (status === 'COMPLETED') {
      await prisma.$transaction([
        prisma.serviceVehicle.updateMany({
          where: { serviceOrderId: params.id, NOT: { status: 'COMPLETED' } },
          data: {
            status: 'COMPLETED',
            completedAt: new Date()
          }
        }),
        prisma.serviceOrder.update({
          where: { id: params.id },
          data: { status: 'COMPLETED' }
        })
      ])
    } else {
      await prisma.serviceOrder.update({
        where: { id: params.id },
        data: updateData
      })
    }

    const updated = await prisma.serviceOrder.findUnique({
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

    const orderWithPhotos = await attachPhotosToOrder(updated)
    return NextResponse.json(orderWithPhotos)
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

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id
    const body = await request.json()
    const { customerId, vehicles } = body

    if (!customerId) {
      return NextResponse.json({ error: 'Customer is required' }, { status: 400 })
    }

    if (!Array.isArray(vehicles) || vehicles.length === 0) {
      return NextResponse.json({ error: 'At least one vehicle is required' }, { status: 400 })
    }

    // Calculate totals
    let subtotal = 0
    vehicles.forEach((v: any) => {
      if (Array.isArray(v.items)) {
        v.items.forEach((item: any) => {
          subtotal += (item.quantity * item.priceUnit || 0)
        })
      }
    })
    const vatAmount = subtotal * 0.07
    const grandTotal = subtotal + vatAmount

    // Execute in transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Get all existing vehicle IDs to delete their items
      const existingVehicles = await tx.serviceVehicle.findMany({
        where: { serviceOrderId: orderId },
        select: { id: true }
      })
      const existingVehicleIds = existingVehicles.map(v => v.id)

      // 2. Delete existing items
      await tx.serviceItem.deleteMany({
        where: { serviceVehicleId: { in: existingVehicleIds } }
      })

      // 3. Delete existing vehicles
      await tx.serviceVehicle.deleteMany({
        where: { serviceOrderId: orderId }
      })

      // 4. Update the order totals and customerId
      await tx.serviceOrder.update({
        where: { id: orderId },
        data: {
          customerId,
          subtotal,
          vatAmount,
          grandTotal,
        }
      })

      // 5. Create new vehicles and items
      for (const v of vehicles) {
        const newVehicle = await tx.serviceVehicle.create({
          data: {
            serviceOrderId: orderId,
            carPlate: v.carPlate,
            carProvince: v.carProvince || '',
            carBrand: v.carBrand,
            carModel: v.carModel,
            carVin: v.carVin || '',
          }
        })

        if (Array.isArray(v.items)) {
          for (const item of v.items) {
            await tx.serviceItem.create({
              data: {
                serviceVehicleId: newVehicle.id,
                description: item.description,
                quantity: item.quantity || 1,
                priceUnit: item.priceUnit || 0,
                totalPrice: (item.quantity || 1) * (item.priceUnit || 0)
              }
            })
          }
        }
      }

      // Fetch the fully updated order
      return await tx.serviceOrder.findUnique({
        where: { id: orderId },
        include: {
          customer: true,
          vehicles: {
            include: {
              items: true
            }
          }
        }
      })
    })

    const orderWithPhotos = await attachPhotosToOrder(result)
    return NextResponse.json(orderWithPhotos)
  } catch (error: any) {
    console.error('Error updating service order:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
