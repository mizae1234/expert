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

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; vehicleId: string } }
) {
  try {
    const orderId = params.id
    const vehicleId = params.vehicleId
    const body = await request.json()
    const { status, photos, completedAt, uploadedBy } = body

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 })
    }

    const resolvedCompletedAt = status === 'COMPLETED' ? (completedAt ? new Date(completedAt) : new Date()) : null
    
    // Execute in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update the vehicle status and completedAt
      await tx.serviceVehicle.update({
        where: { id: vehicleId },
        data: {
          status,
          completedAt: resolvedCompletedAt
        }
      })

      // 2. Manage attachments (photos)
      // Delete old photos associated with this vehicle
      await tx.attachment.deleteMany({
        where: {
          entityType: 'SERVICE_VEHICLE',
          entityId: vehicleId
        }
      })

      // Add new photos unconditionally if photos array is provided
      if (Array.isArray(photos) && photos.length > 0) {
        for (const url of photos) {
          const fileName = url.substring(url.lastIndexOf('/') + 1) || 'vehicle_photo.jpg'
          await tx.attachment.create({
            data: {
              entityType: 'SERVICE_VEHICLE',
              entityId: vehicleId,
              fileName,
              fileUrl: url,
              fileType: 'image',
              uploadedBy: uploadedBy || 'Mechanic'
            }
          })
        }
      }

      // 3. Query all vehicles in this order to compute parent order status
      const allVehicles = await tx.serviceVehicle.findMany({
        where: { serviceOrderId: orderId }
      })

      const totalCount = allVehicles.length
      const completedCount = allVehicles.filter(v => v.status === 'COMPLETED').length
      const cancelledCount = allVehicles.filter(v => v.status === 'CANCELLED').length

      let nextOrderStatus = 'PENDING'
      if (completedCount === totalCount - cancelledCount && totalCount > 0) {
        nextOrderStatus = 'COMPLETED'
      } else if (completedCount > 0) {
        nextOrderStatus = 'IN_PROGRESS'
      } else {
        nextOrderStatus = 'PENDING'
      }

      // 4. Update parent order status
      return await tx.serviceOrder.update({
        where: { id: orderId },
        data: {
          status: nextOrderStatus as any
        },
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
    console.error('Error updating vehicle completion status:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
