import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const seq = await prisma.$transaction(async (tx) => {
      let s = await tx.documentSequence.findUnique({
        where: { docType: 'BILLING_NOTE' }
      })
      
      if (!s) {
        s = await tx.documentSequence.create({
          data: {
            docType: 'BILLING_NOTE',
            prefix: 'BN',
            lastNo: 0
          }
        })
      }
      
      const nextNo = s.lastNo + 1
      
      await tx.documentSequence.update({
        where: { id: s.id },
        data: { lastNo: nextNo }
      })
      
      return { prefix: s.prefix, number: nextNo }
    })
    
    const now = new Date()
    const yyyymm = now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0')
    const documentNo = `${seq.prefix}-${yyyymm}${String(seq.number).padStart(5, '0')}`
    
    return NextResponse.json({ documentNo })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
