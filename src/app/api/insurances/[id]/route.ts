import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const insurance = await prisma.insurance.findUnique({
    where: { id: params.id },
    include: {
      claims: {
        include: {
          insuranceInvoice: true
        }
      }
    }
  })
  
  if (!insurance) {
    return NextResponse.json({ error: 'Insurance not found' }, { status: 404 })
  }
  
  return NextResponse.json(insurance)
}
