import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const parts = await prisma.partMaster.findMany({
    include: {
      vendorPrices: true
    },
    orderBy: { partNo: 'asc' }
  })
  
  return NextResponse.json(parts)
}
