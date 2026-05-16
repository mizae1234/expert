import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const vendors = await prisma.vendor.findMany({
    orderBy: { name: 'asc' }
  })
  
  return NextResponse.json(vendors)
}
