import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { name: 'asc' }
    })
    return NextResponse.json(customers)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, taxId, phone, address, branchCode, isVatRegistered, contactPerson } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const newCustomer = await prisma.customer.create({
      data: {
        name,
        taxId: taxId || null,
        phone: phone || null,
        address: address || null,
        branchCode: branchCode || '00000',
        isVatRegistered: isVatRegistered !== false,
        contactPerson: contactPerson || null
      }
    })

    return NextResponse.json(newCustomer, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
