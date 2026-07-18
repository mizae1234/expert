import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { serviceOrders: true }
        }
      }
    })

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    return NextResponse.json(customer)
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
    const {
      name,
      taxId,
      phone,
      address,
      branchCode,
      isVatRegistered,
      contactPerson,
      peakCustomerId,
      contactType,
      nationality,
      businessType,
      creditTermArDays,
    } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const updatedCustomer = await prisma.customer.update({
      where: { id: params.id },
      data: {
        name,
        taxId: taxId || null,
        phone: phone || null,
        address: address || null,
        branchCode: branchCode || '00000',
        isVatRegistered: isVatRegistered !== false,
        contactPerson: contactPerson || null,
        peakCustomerId: peakCustomerId || null,
        contactType: contactType || 'ลูกค้า',
        nationality: nationality || 'ไทย',
        businessType: businessType || 'บริษัทจำกัด',
        creditTermArDays: typeof creditTermArDays === 'number' ? creditTermArDays : 30,
      }
    })

    return NextResponse.json(updatedCustomer)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const customerId = params.id

    // Check if customer has associated service orders
    const serviceOrderCount = await prisma.serviceOrder.count({
      where: { customerId }
    })

    if (serviceOrderCount > 0) {
      return NextResponse.json(
        { error: `ไม่สามารถลบลูกค้าได้ เนื่องจากลูกค้ามีใบสั่งงานบริการในระบบจำนวน ${serviceOrderCount} รายการ` },
        { status: 400 }
      )
    }

    await prisma.customer.delete({
      where: { id: customerId }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
