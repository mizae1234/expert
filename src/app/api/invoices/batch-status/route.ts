import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { ARStatus } from '@prisma/client'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { ids, status } = body
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Missing or invalid ids' }, { status: 400 })
    }
    
    if (!status || !Object.values(ARStatus).includes(status as ARStatus)) {
      return NextResponse.json({ error: 'Missing or invalid status' }, { status: 400 })
    }
    
    const updated = await prisma.insuranceInvoice.updateMany({
      where: {
        id: { in: ids }
      },
      data: {
        status: status as ARStatus
      }
    })
    
    return NextResponse.json({ success: true, count: updated.count })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
