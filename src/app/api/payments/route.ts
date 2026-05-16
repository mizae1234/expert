import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const payments = await prisma.paymentRequest.findMany({
    orderBy: { createdAt: 'desc' }
  })
  
  return NextResponse.json(payments)
}
