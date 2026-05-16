import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const invoices = await prisma.insuranceInvoice.findMany({
    include: {
      claim: {
        include: {
          insurance: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
  
  return NextResponse.json(invoices)
}
