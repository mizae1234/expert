import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

function formatDate(dateStr: string | Date): string {
  const d = new Date(dateStr)
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
}

export async function POST(req: NextRequest) {
  try {
    const { type, ids } = await req.json()
    
    // Config constants (ideally from DB)
    const ACCOUNT_REVENUE_LABOR = '410101'
    const ACCOUNT_REVENUE_PARTS = '410102'
    const ACCOUNT_COST_PARTS = '510101'
    const ACCOUNT_COST_LABOR = '510102'

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
        rows.push({
          'ลำดับที่*': seq++,
          'วันที่เอกสาร': formatDate(inv.invoiceDate),
          'เลขที่เอกสาร': inv.invoiceNo,
          'อ้างอิงถึง': inv.claim.claimNo,
          'ลูกค้า': inv.claim.insurance?.peakCustomerId || inv.claim.insurance?.id || '',
          'เลขทะเบียน 13 หลัก': '',
          'เลขสาขา 5 หลัก': '',
          'เป็นใบกำกับภาษี': '',
          'ประเภทราคา': 1,
          'สินค้า/บริการ': 'P001',
          'บัญชี': ACCOUNT_REVENUE_LABOR,
          'คำอธิบาย': `ค่าแรง|${inv.claim.carPlate}|${inv.claim.insurance?.name || ''}`,
          'จำนวน': 1,
          'ราคาต่อหน่วย': inv.laborTotal,
          'ส่วนลดต่อหน่วย': 0,
          'อัตราภาษี': '7%',
          'ถูกหัก ณ ที่จ่าย(ถ้ามี)': 0,
          'หมายเหตุ': '',
          'กลุ่มจัดประเภท': ''
        })
        rows.push({
          'ลำดับที่*': seq++,
          'วันที่เอกสาร': formatDate(inv.invoiceDate),
          'เลขที่เอกสาร': inv.invoiceNo,
          'อ้างอิงถึง': inv.claim.claimNo,
          'ลูกค้า': inv.claim.insurance?.peakCustomerId || inv.claim.insurance?.id || '',
          'เลขทะเบียน 13 หลัก': '',
          'เลขสาขา 5 หลัก': '',
          'เป็นใบกำกับภาษี': '',
          'ประเภทราคา': 1,
          'สินค้า/บริการ': 'P002',
          'บัญชี': ACCOUNT_REVENUE_PARTS,
          'คำอธิบาย': `ค่าอะไหล่|${inv.claim.carPlate}|${inv.claim.insurance?.name || ''}`,
          'จำนวน': 1,
          'ราคาต่อหน่วย': inv.partsTotal,
          'ส่วนลดต่อหน่วย': 0,
          'อัตราภาษี': '7%',
          'ถูกหัก ณ ที่จ่าย(ถ้ามี)': 0,
          'หมายเหตุ': '',
          'กลุ่มจัดประเภท': ''
        })
      }
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
          'สินค้า/บริการ': 'P002',
          'บัญชี': ACCOUNT_COST_PARTS,
          'คำอธิบาย': `ค่าอะไหล่|${si.claim.carPlate}|${si.claim.claimNo}`,
          'จำนวน': 1,
          'ราคาต่อหน่วย': si.totalAmount / 1.07,
          'อัตราภาษี': '7%',
          'หัก ณ ที่จ่าย (ถ้ามี)': 0,
          'ชำระโดย': '',
          'จำนวนเงินที่ชำระ': 0,
          'ภ.ง.ด. (ถ้ามี)': si.vendor?.whtType || '53',
          'หมายเหตุ': si.invoiceNo,
          'กลุ่มจัดประเภท': ''
        })
      }

      for (const gi of garageInvoices) {
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
          'สินค้า/บริการ': 'P001',
          'บัญชี': ACCOUNT_COST_LABOR,
          'คำอธิบาย': `ค่าแรง|${gi.claim.carPlate}|${gi.claim.claimNo}`,
          'จำนวน': 1,
          'ราคาต่อหน่วย': gi.totalAmount / 1.07,
          'อัตราภาษี': '7%',
          'หัก ณ ที่จ่าย (ถ้ามี)': 0,
          'ชำระโดย': '',
          'จำนวนเงินที่ชำระ': 0,
          'ภ.ง.ด. (ถ้ามี)': '53',
          'หมายเหตุ': gi.invoiceNo,
          'กลุ่มจัดประเภท': ''
        })
      }
      return NextResponse.json({ rows, filename: 'AP_Import_Purchase.xlsx' })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
