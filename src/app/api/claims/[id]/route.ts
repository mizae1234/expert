import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const claim = await prisma.claim.findUnique({
    where: { id: params.id },
    include: {
      insurance: { select: { id: true, name: true, branch: true, taxId: true, branchCode: true, peakCustomerId: true } },
      garage: { select: { id: true, name: true, phone: true } },
      parts: { include: { partMaster: { select: { id: true, partNo: true, partName: true, standardPrice: true } } } },
      labors: true,
      purchaseOrders: { include: { vendor: { select: { id: true, name: true } }, items: true } },
      supplierInvoices: { include: { vendor: { select: { id: true, name: true } }, items: true, apPayment: { select: { id: true, paidAt: true, amount: true } } } },
      garageInvoices: { include: { garage: { select: { id: true, name: true } }, items: true } },
      insuranceInvoice: { include: { arPayment: { select: { id: true, receivedAt: true, amount: true } } } },
      statusLogs: { orderBy: { createdAt: 'desc' }, take: 50 },
      quotations: { include: { laborItems: true, partItems: true } },
      expenses: { orderBy: { createdAt: 'desc' } },
      documents: { orderBy: { createdAt: 'desc' }, take: 30 },
      paymentRequests: { 
        include: { 
          supplierInvoice: { select: { id: true, invoiceNo: true, vendor: { select: { id: true, name: true } } } }, 
          garageInvoice: { select: { id: true, invoiceNo: true, garage: { select: { id: true, name: true } } } }, 
          insuranceInvoice: { select: { id: true, invoiceNo: true } }, 
          billReceipt: true 
        } 
      },
    }
  })

  if (!claim) {
    return NextResponse.json({ error: 'Claim not found' }, { status: 404 })
  }
  return NextResponse.json(claim)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json()
  const { parts, labors, ...claimData } = body
  
  // Validate parts have names and labors have descriptions
  if (parts && Array.isArray(parts)) {
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i]
      if (!p.partName?.trim()) {
        return NextResponse.json({ error: `กรุณาระบุชื่ออะไหล่ให้ครบทุกรายการ (รายการที่ ${i + 1})` }, { status: 400 })
      }
    }
  }

  if (labors && Array.isArray(labors)) {
    for (let i = 0; i < labors.length; i++) {
      const l = labors[i]
      if (!l.description?.trim()) {
        return NextResponse.json({ error: `กรุณาระบุชื่อรายการค่าแรงให้ครบทุกรายการ (รายการที่ ${i + 1})` }, { status: 400 })
      }
    }
  }

  // 1. Update basic claim data if provided
  if (Object.keys(claimData).length > 0) {
    await prisma.claim.update({
      where: { id: params.id },
      data: claimData
    })
  }

  // 2. Safely Update Parts
  if (parts && Array.isArray(parts)) {
    const existingParts = await prisma.claimPart.findMany({ where: { claimId: params.id } })
    const incomingIds = parts.map(p => p.id).filter(id => id && !id.startsWith('new-'))
    const idsToDelete = existingParts.map(p => p.id).filter(id => !incomingIds.includes(id))

    if (idsToDelete.length > 0) {
      await prisma.claimPart.deleteMany({ where: { id: { in: idsToDelete } } })
    }

    for (const p of parts) {
      const partData = {
        partNo: p.partNo || '',
        partName: p.partName || '',
        priceFullAmt: Number(p.priceFullAmt || 0),
        quantity: Number(p.quantity || 1),
        damageType: p.damageType || 'เปลี่ยน',
        discountPct: Number(p.discountPct || 0),
        priceOffer: Number(p.priceOffer || 0),
        priceApprove: Number(p.priceApprove || 0),
        supplier: p.supplier || '',
        requireReturn: Boolean(p.requireReturn)
      }

      if (!p.id || p.id.startsWith('new-')) {
        await prisma.claimPart.create({ data: { ...partData, claimId: params.id } })
      } else {
        await prisma.claimPart.update({ where: { id: p.id }, data: partData })
      }
    }
  }

  // 3. Safely Update Labors
  if (labors && Array.isArray(labors)) {
    const existingLabors = await prisma.claimLabor.findMany({ where: { claimId: params.id } })
    const incomingIds = labors.map(l => l.id).filter(id => id && !id.startsWith('new-'))
    const idsToDelete = existingLabors.map(l => l.id).filter(id => !incomingIds.includes(id))

    if (idsToDelete.length > 0) {
      await prisma.claimLabor.deleteMany({ where: { id: { in: idsToDelete } } })
    }

    for (const l of labors) {
      const laborData = {
        description: l.description || '',
        damageLevel: l.damageLevel || 'ปานกลาง',
        discountPct: Number(l.discountPct || 0),
        priceOffer: Number(l.priceOffer || 0),
        priceApprove: Number(l.priceApprove || 0)
      }

      if (!l.id || l.id.startsWith('new-')) {
        await prisma.claimLabor.create({ data: { ...laborData, claimId: params.id } })
      } else {
        await prisma.claimLabor.update({ where: { id: l.id }, data: laborData })
      }
    }
  }
  
  const updatedClaim = await prisma.claim.findUnique({
    where: { id: params.id },
    include: {
      insurance: { select: { id: true, name: true, branch: true, taxId: true, branchCode: true, peakCustomerId: true } },
      garage: { select: { id: true, name: true, phone: true } },
      parts: { include: { partMaster: { select: { id: true, partNo: true, partName: true, standardPrice: true } } } },
      labors: true,
      purchaseOrders: { include: { vendor: { select: { id: true, name: true } }, items: true } },
      supplierInvoices: { include: { vendor: { select: { id: true, name: true } }, items: true, apPayment: { select: { id: true, paidAt: true, amount: true } } } },
      garageInvoices: { include: { garage: { select: { id: true, name: true } }, items: true } },
      insuranceInvoice: { include: { arPayment: { select: { id: true, receivedAt: true, amount: true } } } },
      statusLogs: { orderBy: { createdAt: 'desc' }, take: 50 },
      quotations: { include: { laborItems: true, partItems: true } },
      expenses: { orderBy: { createdAt: 'desc' } },
      documents: { orderBy: { createdAt: 'desc' }, take: 30 },
      paymentRequests: { 
        include: { 
          supplierInvoice: { select: { id: true, invoiceNo: true, vendor: { select: { id: true, name: true } } } }, 
          garageInvoice: { select: { id: true, invoiceNo: true, garage: { select: { id: true, name: true } } } }, 
          insuranceInvoice: { select: { id: true, invoiceNo: true } }, 
          billReceipt: true 
        } 
      },
    }
  })
  
  return NextResponse.json(updatedClaim)
}
