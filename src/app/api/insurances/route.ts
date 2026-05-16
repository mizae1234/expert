import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const insurances = await prisma.insurance.findMany({
    include: {
      claims: {
        include: {
          insuranceInvoice: true
        }
      }
    },
    orderBy: { name: 'asc' }
  })
  return NextResponse.json(insurances)
}
