import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const orders = await prisma.serviceOrder.findMany({
      include: {
        customer: true,
        vehicles: {
          include: {
            items: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(orders)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customerId, vehicles } = body

    if (!customerId || !Array.isArray(vehicles) || vehicles.length === 0) {
      return NextResponse.json({ error: 'Missing customer or vehicles data' }, { status: 400 })
    }

    // Generate JOB-YYYYMMXXXXX sequence number
    const now = new Date()
    const yyyymm = now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0')
    const prefix = `JOB-${yyyymm}`

    const latestOrder = await prisma.serviceOrder.findFirst({
      where: { orderNo: { startsWith: prefix } },
      orderBy: { orderNo: 'desc' }
    })

    let nextNo = 1
    if (latestOrder) {
      const match = latestOrder.orderNo.match(/(\d+)$/)
      if (match) {
        nextNo = parseInt(match[1], 10) + 1
      }
    }
    const orderNo = `${prefix}${String(nextNo).padStart(5, '0')}`

    // Calculate totals and structure data
    let subtotal = 0
    const vehiclesData = vehicles.map((v: any) => {
      const vehicleItems = v.items || []
      const itemsData = vehicleItems.map((item: any) => {
        const qty = Number(item.quantity || 1)
        const price = Number(item.priceUnit || 0)
        const total = qty * price
        subtotal += total
        return {
          description: item.description,
          quantity: qty,
          priceUnit: price,
          totalPrice: total
        }
      })

      return {
        carPlate: v.carPlate,
        carProvince: v.carProvince || null,
        carBrand: v.carBrand,
        carModel: v.carModel,
        carVin: v.carVin,
        items: {
          create: itemsData
        }
      }
    })

    const vatAmount = Math.round(subtotal * 0.07 * 100) / 100
    const grandTotal = subtotal + vatAmount

    const newOrder = await prisma.serviceOrder.create({
      data: {
        orderNo,
        customerId,
        subtotal,
        vatAmount,
        grandTotal,
        status: 'PENDING',
        vehicles: {
          create: vehiclesData
        }
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

    return NextResponse.json(newOrder, { status: 201 })
  } catch (error: any) {
    console.error('Create Service Order Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
