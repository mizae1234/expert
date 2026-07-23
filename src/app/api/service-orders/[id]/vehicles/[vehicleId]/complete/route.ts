import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'

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
    const { status, photos, completedAt, uploadedBy, remark } = body

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 })
    }

    const resolvedCompletedAt = status === 'COMPLETED' ? (completedAt ? new Date(completedAt) : new Date()) : null
    
    const session = await getSession()
    const changer = session ? `${session.name} (${session.username})` : (uploadedBy || 'Mechanic/User')

    // Execute in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update the vehicle status and completedAt
      const vehicle = await tx.serviceVehicle.update({
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
          const fileType = url.toLowerCase().endsWith('.pdf') ? 'pdf' : (/\.(jpg|jpeg|png|gif|webp|svg)/i.test(url) ? 'image' : 'other')
          await tx.attachment.create({
            data: {
              entityType: 'SERVICE_VEHICLE',
              entityId: vehicleId,
              fileName,
              fileUrl: url,
              fileType,
              uploadedBy: changer
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

      // Log status change
      const hasPlate = vehicle.carPlate && vehicle.carPlate !== '-'
      const vehiclePlate = hasPlate
        ? (vehicle.carVin ? `${vehicle.carVin} | ${vehicle.carPlate}` : vehicle.carPlate)
        : (vehicle.carVin || vehicle.carPlate)
      const actionText = status === 'COMPLETED' ? 'เสร็จงาน' : status === 'CANCELLED' ? 'ยกเลิกงาน' : 'เปลี่ยนสถานะ'
      await tx.serviceLog.create({
        data: {
          serviceOrderId: orderId,
          action: status === 'COMPLETED' ? 'COMPLETE_VEHICLE' : status === 'CANCELLED' ? 'CANCEL_VEHICLE' : 'UPDATE_VEHICLE',
          details: `${actionText} รถทะเบียน ${vehiclePlate} (สถานะ: ${status === 'COMPLETED' ? 'เสร็จงาน' : status === 'CANCELLED' ? 'ยกเลิกงาน' : status})${remark ? ` (เหตุผล: ${remark})` : ''} แนบไฟล์จำนวน ${photos?.length || 0} รายการ`,
          changedBy: changer
        }
      })

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
          },
          logs: {
            orderBy: { createdAt: 'desc' }
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
