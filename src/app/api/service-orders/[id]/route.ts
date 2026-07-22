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
        },
        logs: {
          orderBy: { createdAt: 'desc' }
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
    const session = await getSession()
    const changer = session ? `${session.name} (${session.username})` : 'System'

    const body = await request.json()
    const { status, vehicleIds, action, remark } = body

    if (Array.isArray(vehicleIds) && vehicleIds.length > 0 && action) {
      await prisma.$transaction(async (tx) => {
        if (action === 'COMPLETE') {
          await tx.serviceVehicle.updateMany({
            where: { id: { in: vehicleIds } },
            data: {
              status: 'COMPLETED',
              completedAt: new Date()
            }
          })
        } else if (action === 'CANCEL') {
          await tx.serviceVehicle.updateMany({
            where: { id: { in: vehicleIds } },
            data: {
              status: 'CANCELLED',
              completedAt: null
            }
          })
        }

        // Recalculate parent order status
        const allVehicles = await tx.serviceVehicle.findMany({
          where: { serviceOrderId: params.id }
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

        await tx.serviceOrder.update({
          where: { id: params.id },
          data: { status: nextOrderStatus as any }
        })

        // Log batch action
        const vehiclesList = allVehicles.filter(v => vehicleIds.includes(v.id))
        const vehicleNames = vehiclesList.map(v => `${v.carPlate} (${v.carBrand} ${v.carModel})`).join(', ')
        await tx.serviceLog.create({
          data: {
            serviceOrderId: params.id,
            action: action === 'COMPLETE' ? 'BATCH_COMPLETE' : 'BATCH_CANCEL',
            details: `${action === 'COMPLETE' ? 'เสร็จงาน' : 'ยกเลิก'} รถจำนวน ${vehicleIds.length} คัน: ${vehicleNames}${remark ? ` (เหตุผล: ${remark})` : ''}`,
            changedBy: changer
          }
        })
      })
    } else if (status === 'COMPLETED') {
      await prisma.$transaction(async (tx) => {
        await tx.serviceVehicle.updateMany({
          where: { serviceOrderId: params.id, NOT: { status: 'COMPLETED' } },
          data: {
            status: 'COMPLETED',
            completedAt: new Date()
          }
        })
        await tx.serviceOrder.update({
          where: { id: params.id },
          data: { status: 'COMPLETED' }
        })
        await tx.serviceLog.create({
          data: {
            serviceOrderId: params.id,
            action: 'COMPLETE_ALL',
            details: 'เสร็จงานรถทุกคันในใบสั่งงาน',
            changedBy: changer
          }
        })
      })
    } else if (status === 'CANCELLED') {
      await prisma.$transaction(async (tx) => {
        // ONLY cancel vehicles that are NOT completed!
        await tx.serviceVehicle.updateMany({
          where: { 
            serviceOrderId: params.id, 
            status: { in: ['PENDING', 'IN_PROGRESS'] } 
          },
          data: {
            status: 'CANCELLED',
            completedAt: null
          }
        })
        await tx.serviceOrder.update({
          where: { id: params.id },
          data: { status: 'CANCELLED' }
        })
        await tx.serviceLog.create({
          data: {
            serviceOrderId: params.id,
            action: 'CANCEL_ALL',
            details: `ยกเลิกใบสั่งงานและรถที่กำลังดำเนินการทั้งหมด${remark ? ` (เหตุผล: ${remark})` : ''}`,
            changedBy: changer
          }
        })
      })
    } else {
      const updateData: any = {}
      if (status) updateData.status = status
      await prisma.$transaction(async (tx) => {
        await tx.serviceOrder.update({
          where: { id: params.id },
          data: updateData
        })
        await tx.serviceLog.create({
          data: {
            serviceOrderId: params.id,
            action: 'UPDATE_STATUS',
            details: `เปลี่ยนสถานะใบสั่งงานเป็น ${status === 'PENDING' ? 'รอดำเนินการ' : status === 'IN_PROGRESS' ? 'กำลังทำสี' : status === 'CANCELLED' ? 'ยกเลิก' : status}`,
            changedBy: changer
          }
        })
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
        },
        logs: {
          orderBy: { createdAt: 'desc' }
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
    const { customerId, vehicles, operationDate } = body

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
          customer: { connect: { id: customerId } },
          operationDate: operationDate ? new Date(operationDate) : null,
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
                serviceCode: item.serviceCode || null,
                description: item.description,
                quantity: item.quantity || 1,
                priceUnit: item.priceUnit || 0,
                totalPrice: (item.quantity || 1) * (item.priceUnit || 0)
              }
            })
          }
        }
      }

      // Log edit action
      const session = await getSession()
      const changer = session ? `${session.name} (${session.username})` : 'System'
      await tx.serviceLog.create({
        data: {
          serviceOrderId: orderId,
          action: 'EDIT_ORDER',
          details: 'แก้ไขรายละเอียดใบสั่งงาน (ข้อมูลลูกค้า/รถยนต์/รายการสั่งซ่อม)',
          changedBy: changer
        }
      })

      // Fetch the fully updated order
      return await tx.serviceOrder.findUnique({
        where: { id: orderId },
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
    console.error('Error updating service order:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
