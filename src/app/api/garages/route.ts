import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const garages = await prisma.vendor.findMany({
      where: { vendorType: 'GARAGE' },
      orderBy: { name: 'asc' }
    })
    return NextResponse.json(garages)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
