import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

const DEFAULT_SEQUENCES = [
  { docType: 'CLAIM', prefix: 'C' },
  { docType: 'PO_PARTS', prefix: 'PO' },
  { docType: 'PO_LABOR', prefix: 'PL' },
  { docType: 'QUOTATION', prefix: 'QT' },
  { docType: 'INVOICE', prefix: 'INV' },
  { docType: 'RECEIPT', prefix: 'RC' },
  { docType: 'BILLING_NOTE', prefix: 'BN' }
]

export async function GET() {
  try {
    let sequences = await prisma.documentSequence.findMany()
    
    // Auto-initialize missing sequences
    if (sequences.length < DEFAULT_SEQUENCES.length) {
      const existingTypes = new Set(sequences.map(s => s.docType))
      const missing = DEFAULT_SEQUENCES.filter(s => !existingTypes.has(s.docType))
      
      for (const m of missing) {
        await prisma.documentSequence.create({
          data: {
            docType: m.docType,
            prefix: m.prefix,
            lastNo: 0
          }
        })
      }
      // Re-fetch all
      sequences = await prisma.documentSequence.findMany()
    }
    
    return NextResponse.json(sequences)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json()
    // Body should be an array of sequences: [{ id, prefix }]
    
    for (const seq of body) {
      await prisma.documentSequence.update({
        where: { id: seq.id },
        data: { prefix: seq.prefix }
      })
    }
    
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
