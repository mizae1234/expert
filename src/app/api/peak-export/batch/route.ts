import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

function formatDate(dateStr: string | Date): string {
  const d = new Date(dateStr)
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
}

const PEAK_CONFIG = {
  ACCOUNT_REVENUE_LABOR: '41101',
  ACCOUNT_REVENUE_PARTS: '41102',
  ACCOUNT_COST_PARTS: '51102',
  ACCOUNT_COST_LABOR: '51101',
  PAYMENT_CHANNEL_TRANSFER: 'โอนเงิน',
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const template = searchParams.get('template')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    if (!template) return NextResponse.json({ error: 'Missing template parameter' }, { status: 400 })

    const conf = PEAK_CONFIG
    const allRows: Record<string, unknown>[] = []
    let seq = 1

    const dateFilter: any = {}
    if (dateFrom && dateTo) {
      dateFilter.createdAt = { gte: new Date(dateFrom), lte: new Date(dateTo) }
    }

    const claims = await prisma.claim.findMany({
      where: dateFilter,
      include: {
        insurance: true,
        insuranceInvoice: { include: { arPayment: true } },
        supplierInvoices: { include: { vendor: true, apPayment: true } },
        garageInvoices: { include: { garage: true } },
        purchaseOrders: true,
      }
    })

    if (template === 'ar-invoice') {
      for (const claim of claims) {
        if (!claim.insuranceInvoice) continue
        const insurance = claim.insurance
        if (!insurance?.peakCustomerId) continue
        const inv = claim.insuranceInvoice
        
        let hasAdded = false
        if (inv.laborTotal > 0) {
          allRows.push({
            ลำดับที่: seq, วันที่: formatDate(inv.invoiceDate), เลขที่เอกสาร: '',
            อ้างอิงถึง: claim.claimNo, ลูกค้า: insurance.peakCustomerId,
            สินค้า: 'P00035', บัญชี: conf.ACCOUNT_REVENUE_LABOR,
            คำอธิบาย: `ค่าแรง|${claim.carPlate}|${insurance.name}`,
            จำนวน: 1, 'ราคา/หน่วย': inv.laborTotal, อัตราภาษี: '7%',
          })
          hasAdded = true
        }
        if (inv.partsTotal > 0) {
          allRows.push({
            ลำดับที่: seq, วันที่: formatDate(inv.invoiceDate), เลขที่เอกสาร: '',
            อ้างอิงถึง: claim.claimNo, ลูกค้า: insurance.peakCustomerId,
            สินค้า: 'P00033', บัญชี: conf.ACCOUNT_REVENUE_PARTS,
            คำอธิบาย: `ค่าอะไหล่|${claim.carPlate}|${insurance.name}`,
            จำนวน: 1, 'ราคา/หน่วย': inv.partsTotal, อัตราภาษี: '7%',
          })
          hasAdded = true
        }
        
        if (hasAdded) {
          seq++
        }
      }
      return NextResponse.json({ template: 'Import_Invoice', filename: `Batch_AR_Invoice.xlsx`, rows: allRows })
    }

    if (template === 'ar-receipt') {
      for (const claim of claims) {
        if (!claim.insuranceInvoice?.arPayment) continue
        const insurance = claim.insurance
        const inv = claim.insuranceInvoice
        const arPayment = inv.arPayment!
        allRows.push({
          ลำดับที่: seq++, อ้างอิงใบแจ้งหนี้: inv.invoiceNo,
          วันที่เอกสาร: formatDate(arPayment.receivedAt), เลขที่ใบเสร็จ: '',
          ออกใบกำกับภาษี: insurance?.isVatRegistered ? 1 : 2,
          รับชำระโดย: conf.PAYMENT_CHANNEL_TRANSFER,
          จำนวนเงินที่รับชำระ: arPayment.amount, หมายเหตุ: claim.claimNo,
        })
      }
      return NextResponse.json({ template: 'Import_Receipt', filename: `Batch_AR_Receipt.xlsx`, rows: allRows })
    }

    if (template === 'ap-purchase') {
      for (const claim of claims) {
        for (const si of claim.supplierInvoices) {
          const vendor = si.vendor
          if (!vendor?.peakVendorCode || !vendor?.taxId) continue
          allRows.push({
            ลำดับที่: seq++, วันที่เอกสาร: formatDate(si.invoiceDate),
            อ้างอิงถึง: claim.claimNo.slice(0, 32),
            'ผู้รับเงิน/คู่ค้า': vendor.peakVendorCode,
            'เลขทะเบียน 13 หลัก': vendor.taxId,
            'เลขสาขา 5 หลัก': vendor.branchCode || '00000',
            เลขที่ใบกำกับฯ: si.invoiceNo, วันที่ใบกำกับฯ: formatDate(si.invoiceDate),
            วันที่บันทึกภาษีซื้อ: formatDate(si.invoiceDate), ประเภทราคา: 1,
            'สินค้า/บริการ': 'P00033', บัญชี: conf.ACCOUNT_COST_PARTS,
            คำอธิบาย: `ค่าอะไหล่|${claim.carPlate}|${claim.claimNo}`,
            จำนวน: 1, 'ราคา/หน่วย': si.totalAmount / 1.07, อัตราภาษี: '7%',
            'หัก ณ ที่จ่าย': 0, ชำระโดย: '', จำนวนเงินที่ชำระ: 0,
            'ภ.ง.ด.': vendor.whtType || '53', หมายเหตุ: si.invoiceNo,
          })
        }
        for (const gi of claim.garageInvoices) {
          const garage = gi.garage
          if (!garage?.peakVendorCode || !garage?.taxId) continue
          allRows.push({
            ลำดับที่: seq++, วันที่เอกสาร: formatDate(gi.invoiceDate),
            อ้างอิงถึง: claim.claimNo.slice(0, 32),
            'ผู้รับเงิน/คู่ค้า': garage.peakVendorCode,
            'เลขทะเบียน 13 หลัก': garage.taxId,
            'เลขสาขา 5 หลัก': garage.branchCode || '00000',
            เลขที่ใบกำกับฯ: gi.invoiceNo, วันที่ใบกำกับฯ: formatDate(gi.invoiceDate),
            วันที่บันทึกภาษีซื้อ: formatDate(gi.invoiceDate), ประเภทราคา: 1,
            'สินค้า/บริการ': 'P00035', บัญชี: conf.ACCOUNT_COST_LABOR,
            คำอธิบาย: `ค่าแรง|${claim.carPlate}|${claim.claimNo}`,
            จำนวน: 1, 'ราคา/หน่วย': gi.totalAmount / 1.07, อัตราภาษี: '7%',
            'หัก ณ ที่จ่าย': 0, ชำระโดย: '', จำนวนเงินที่ชำระ: 0,
            'ภ.ง.ด.': garage.whtType || '53', หมายเหตุ: gi.invoiceNo,
          })
        }
      }
      return NextResponse.json({ template: 'Import_PurchaseInventory', filename: `Batch_AP_Purchase.xlsx`, rows: allRows })
    }

    if (template === 'ap-expense') {
      for (const claim of claims) {
        for (const si of claim.supplierInvoices) {
          const apPayment = si.apPayment
          if (!apPayment) continue
          const vendor = si.vendor
          allRows.push({
            ลำดับที่: seq++, วันที่เอกสาร: formatDate(apPayment.paidAt),
            อ้างอิงถึง: claim.claimNo.slice(0, 32),
            'ผู้รับเงิน/คู่ค้า': vendor?.peakVendorCode || '',
            'เลขทะเบียน 13 หลัก': vendor?.taxId || '',
            'เลขสาขา 5 หลัก': vendor?.branchCode || '00000',
            เลขที่ใบกำกับฯ: si.invoiceNo, วันที่ใบกำกับฯ: formatDate(si.invoiceDate),
            วันที่บันทึกภาษีซื้อ: formatDate(si.invoiceDate), ประเภทราคา: 1,
            บัญชี: conf.ACCOUNT_COST_PARTS,
            คำอธิบาย: `ค่าอะไหล่|${claim.carPlate}|${claim.claimNo}`,
            จำนวน: 1, 'ราคา/หน่วย': apPayment.amount, อัตราภาษี: '7%',
            'หัก ณ ที่จ่าย': apPayment.whtAmount || 0,
            ชำระโดย: conf.PAYMENT_CHANNEL_TRANSFER,
            จำนวนเงินที่ชำระ: apPayment.amount - (apPayment.whtAmount || 0),
            'ภ.ง.ด.': vendor?.whtType || '53', หมายเหตุ: si.invoiceNo,
          })
        }
      }
      return NextResponse.json({ template: 'Import_Expense', filename: `Batch_AP_Expense.xlsx`, rows: allRows })
    }

    return NextResponse.json({ error: `Unknown template: ${template}` }, { status: 400 })
  } catch (error) {
    console.error('[API] GET /api/peak-export/batch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
