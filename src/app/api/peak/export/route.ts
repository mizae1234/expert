import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

function formatDate(dateStr: string | Date): string {
  const d = new Date(dateStr)
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
}

function buildRemark(claim: any): string {
  const parts = [
    claim.claimNo,
    [claim.carBrand, claim.carModel].filter(Boolean).join(' '),
    claim.carColor || '',
    claim.carPlate,
  ].filter(Boolean)
  return parts.join('|')
}

export async function POST(req: NextRequest) {
  try {
    const { type, ids } = await req.json()
    
    // Config constants (ideally from DB)
    const ACCOUNT_REVENUE_LABOR = '410101'
    const ACCOUNT_REVENUE_PARTS = '410102'
    const ACCOUNT_COST_PARTS = '510101'
    const ACCOUNT_COST_LABOR = '510102'

    const categoryLabels: Record<string, string> = {
      shipping: 'ค่าส่งอะไหล่',
      handling: 'ค่าขนส่ง/ยก',
      towing: 'ค่ายกรถ/ลากรถ',
      paint_material: 'ค่าวัสดุสี',
      consumable: 'ค่าวัสดุสิ้นเปลือง',
      subcontract: 'ค่าจ้างช่วง',
      other: 'อื่นๆ',
    }

    const categoryToAccount: Record<string, string> = {
      shipping: '520201',
      handling: '520201',
      towing: '520201',
      paint_material: '510101',
      consumable: '510101',
      subcontract: '510102',
      other: '520299',
    }

    if (type === 'ar') {
      const invoices = await prisma.insuranceInvoice.findMany({
        where: { id: { in: ids } },
        include: {
          claim: { include: { insurance: true } }
        }
      })
      
      const rows: any[] = []
      let seq = 1
      for (const inv of invoices) {
        const remark = buildRemark(inv.claim)
        let hasAdded = false
        if (inv.laborTotal > 0) {
          rows.push({
            'ลำดับที่*': seq,
            'วันที่เอกสาร': formatDate(inv.invoiceDate),
            'เลขที่เอกสาร': '',
            'อ้างอิงถึง': inv.claim.claimNo,
            'ลูกค้า': inv.claim.insurance?.peakCustomerId || inv.claim.insurance?.id || '',
            'เลขทะเบียน 13 หลัก': '',
            'เลขสาขา 5 หลัก': '',
            'เป็นใบกำกับภาษี': '',
            'ประเภทราคา': 1,
            'สินค้า/บริการ': 'P00035',
            'บัญชี': ACCOUNT_REVENUE_LABOR,
            'คำอธิบาย': `ค่าแรง|${inv.claim.carPlate}|${inv.claim.insurance?.name || ''}`,
            'จำนวน': 1,
            'ราคาต่อหน่วย': inv.laborTotal,
            'ส่วนลดต่อหน่วย': 0,
            'อัตราภาษี': '7%',
            'ถูกหัก ณ ที่จ่าย(ถ้ามี)': 0,
            'หมายเหตุ': remark,
            'กลุ่มจัดประเภท': ''
          })
          hasAdded = true
        }
        if (inv.partsTotal > 0) {
          rows.push({
            'ลำดับที่*': seq,
            'วันที่เอกสาร': formatDate(inv.invoiceDate),
            'เลขที่เอกสาร': '',
            'อ้างอิงถึง': inv.claim.claimNo,
            'ลูกค้า': inv.claim.insurance?.peakCustomerId || inv.claim.insurance?.id || '',
            'เลขทะเบียน 13 หลัก': '',
            'เลขสาขา 5 หลัก': '',
            'เป็นใบกำกับภาษี': '',
            'ประเภทราคา': 1,
            'สินค้า/บริการ': 'P00033',
            'บัญชี': ACCOUNT_REVENUE_PARTS,
            'คำอธิบาย': `ค่าอะไหล่|${inv.claim.carPlate}|${inv.claim.insurance?.name || ''}`,
            'จำนวน': 1,
            'ราคาต่อหน่วย': inv.partsTotal,
            'ส่วนลดต่อหน่วย': 0,
            'อัตราภาษี': '7%',
            'ถูกหัก ณ ที่จ่าย(ถ้ามี)': 0,
            'หมายเหตุ': remark,
            'กลุ่มจัดประเภท': ''
          })
          hasAdded = true
        }
        if (hasAdded) {
          seq++
        }
      }

      await prisma.insuranceInvoice.updateMany({
        where: { id: { in: ids } },
        data: { isSynced: true, syncedAt: new Date() }
      })
      return NextResponse.json({ rows, filename: 'AR_Import_Invoice.xlsx' })
    }

    if (type === 'ap') {
      const supplierInvoices = await prisma.supplierInvoice.findMany({
        where: { id: { in: ids } },
        include: { claim: true, vendor: true }
      })
      
      const garageInvoices = await prisma.garageInvoice.findMany({
        where: { id: { in: ids } },
        include: { claim: true }
      })

      const rows: any[] = []
      let seq = 1

      for (const si of supplierInvoices) {
        const remark = buildRemark(si.claim)
        rows.push({
          'ลำดับที่*': seq++,
          'วันที่เอกสาร': formatDate(si.invoiceDate),
          'อ้างอิงถึง': si.claim.claimNo.slice(0, 32),
          'ผู้รับเงิน/คู่ค้า': si.vendor?.peakVendorCode || si.vendor?.id || '',
          'เลขทะเบียน 13 หลัก': si.vendor?.taxId || '',
          'เลขสาขา 5 หลัก': si.vendor?.branchCode || '00000',
          'เลขที่ใบกำกับฯ (ถ้ามี)': si.invoiceNo,
          'วันที่ใบกำกับฯ (ถ้ามี)': formatDate(si.invoiceDate),
          'วันที่บันทึกภาษีซื้อ (ถ้ามี)': formatDate(si.invoiceDate),
          'ประเภทราคา': 1,
          'สินค้า/บริการ': 'P00033',
          'บัญชี': ACCOUNT_COST_PARTS,
          'คำอธิบาย': `ค่าอะไหล่|${si.claim.carPlate}|${si.claim.claimNo}`,
          'จำนวน': 1,
          'ราคาต่อหน่วย': si.totalAmount / 1.07,
          'อัตราภาษี': '7%',
          'หัก ณ ที่จ่าย (ถ้ามี)': 0,
          'ชำระโดย': '',
          'จำนวนเงินที่ชำระ': 0,
          'ภ.ง.ด. (ถ้ามี)': si.vendor?.whtType || '53',
          'หมายเหตุ': remark,
          'กลุ่มจัดประเภท': ''
        })
      }

      for (const gi of garageInvoices) {
        const remark = buildRemark(gi.claim)
        rows.push({
          'ลำดับที่*': seq++,
          'วันที่เอกสาร': formatDate(gi.invoiceDate),
          'อ้างอิงถึง': gi.claim.claimNo.slice(0, 32),
          'ผู้รับเงิน/คู่ค้า': '', // Garage may not have peakVendorCode in schema currently
          'เลขทะเบียน 13 หลัก': '',
          'เลขสาขา 5 หลัก': '00000',
          'เลขที่ใบกำกับฯ (ถ้ามี)': gi.invoiceNo,
          'วันที่ใบกำกับฯ (ถ้ามี)': formatDate(gi.invoiceDate),
          'วันที่บันทึกภาษีซื้อ (ถ้ามี)': formatDate(gi.invoiceDate),
          'ประเภทราคา': 1,
          'สินค้า/บริการ': 'P00035',
          'บัญชี': ACCOUNT_COST_LABOR,
          'คำอธิบาย': `ค่าแรง|${gi.claim.carPlate}|${gi.claim.claimNo}`,
          'จำนวน': 1,
          'ราคาต่อหน่วย': gi.totalAmount / 1.07,
          'อัตราภาษี': '7%',
          'หัก ณ ที่จ่าย (ถ้ามี)': 0,
          'ชำระโดย': '',
          'จำนวนเงินที่ชำระ': 0,
          'ภ.ง.ด. (ถ้ามี)': '53',
          'หมายเหตุ': remark,
        })
      }

      await prisma.supplierInvoice.updateMany({
        where: { id: { in: supplierInvoices.map(si => si.id) } },
        data: { isSynced: true, syncedAt: new Date() }
      })
      await prisma.garageInvoice.updateMany({
        where: { id: { in: garageInvoices.map(gi => gi.id) } },
        data: { isSynced: true, syncedAt: new Date() }
      })
      return NextResponse.json({ rows, filename: 'AP_Import_Purchase.xlsx' })
    }

    if (type === 'expense') {
      const expenses = await prisma.claimExpense.findMany({
        where: { id: { in: ids } },
        include: { claim: true }
      })

      const rows: any[] = []
      let seq = 1
      for (const exp of expenses) {
        const remark = buildRemark(exp.claim)
        rows.push({
          'ลำดับที่* ': seq++,
          'วันที่เอกสาร': formatDate(exp.date),
          'อ้างอิงถึง': exp.claim.claimNo,
          'ผู้รับเงิน/คู่ค้า': exp.createdBy || '',
          'เลขทะเบียน 13 หลัก': '',
          'เลขสาขา 5 หลัก': '00000',
          'เลขที่ใบกำกับฯ (ถ้ามี)': '',
          'วันที่ใบกำกับฯ (ถ้ามี)': '',
          'วันที่บันทึกภาษีซื้อ (ถ้ามี)': '',
          'ประเภทราคา': 1,
          'บัญชี': categoryToAccount[exp.category] || '520299',
          'คำอธิบาย': `${categoryLabels[exp.category] || 'ค่าใช้จ่ายเพิ่มเติม'} - ${exp.description}`,
          'จำนวน': 1,
          'ราคาต่อหน่วย': exp.amount,
          'อัตราภาษี': '7%',
          'หัก ณ ที่จ่าย (ถ้ามี)': 0,
          'ชำระโดย': '',
          'จำนวนเงินที่ชำระ': 0,
          'ภ.ง.ด. (ถ้ามี)': '',
          'หมายเหตุ': remark,
        })
      }

      await prisma.claimExpense.updateMany({
        where: { id: { in: ids } },
        data: { isSynced: true, syncedAt: new Date() }
      })
      return NextResponse.json({ rows, filename: 'Expense_Import.xlsx' })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
