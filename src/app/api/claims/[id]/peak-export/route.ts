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

function buildRemark(claim: any): string {
  const parts = [
    claim.claimNo,
    [claim.carBrand, claim.carModel].filter(Boolean).join(' '),
    claim.carColor || '',
    claim.carPlate,
  ].filter(Boolean)
  return parts.join('|')
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const template = searchParams.get('template') || 'ar-invoice'

    const claim = await prisma.claim.findUnique({
      where: { id: params.id },
      include: {
        insurance: true,
        insuranceInvoice: { include: { arPayment: true } },
        supplierInvoices: { include: { vendor: true, apPayment: true } },
        garageInvoices: { include: { garage: true } },
        purchaseOrders: true,
      }
    })
    if (!claim) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const insurance = claim.insurance
    const conf = PEAK_CONFIG
    const remark = buildRemark(claim)

    // ==============================
    // Template 1: AR Invoice (ตั้งลูกหนี้)
    // ==============================
    if (template === 'ar-invoice') {
      if (!claim.insuranceInvoice) {
        return NextResponse.json({ error: 'ต้องมี Insurance Invoice ก่อนถึงจะ Export ได้' }, { status: 400 })
      }
      const issues: string[] = []
      if (!insurance?.peakCustomerId) issues.push('Insurance ยังไม่มี peakCustomerId')
      if (issues.length) return NextResponse.json({ error: 'Validation failed', issues }, { status: 400 })

      const inv = claim.insuranceInvoice
      const rows = []
      if (inv.laborTotal > 0) {
        rows.push({
          ลำดับที่: 1,
          วันที่: formatDate(inv.invoiceDate),
          เลขที่เอกสาร: '',
          อ้างอิงถึง: claim.claimNo,
          ลูกค้า: insurance?.peakCustomerId || '',
          สินค้า: 'P00035',
          บัญชี: conf.ACCOUNT_REVENUE_LABOR,
          คำอธิบาย: `ค่าแรง|${claim.carPlate}|${insurance?.name || ''}`,
          จำนวน: 1,
          'ราคา/หน่วย': inv.laborTotal,
          อัตราภาษี: '7%',
          หมายเหตุ: remark,
        })
      }
      if (inv.partsTotal > 0) {
        rows.push({
          ลำดับที่: 1,
          วันที่: formatDate(inv.invoiceDate),
          เลขที่เอกสาร: '',
          อ้างอิงถึง: claim.claimNo,
          ลูกค้า: insurance?.peakCustomerId || '',
          สินค้า: 'P00033',
          บัญชี: conf.ACCOUNT_REVENUE_PARTS,
          คำอธิบาย: `ค่าอะไหล่|${claim.carPlate}|${insurance?.name || ''}`,
          จำนวน: 1,
          'ราคา/หน่วย': inv.partsTotal,
          อัตราภาษี: '7%',
          หมายเหตุ: remark,
        })
      }

      return NextResponse.json({
        template: 'Import_Invoice',
        filename: `AR_Invoice_${inv.invoiceNo}.xlsx`,
        rows,
      })
    }

    // ==============================
    // Template 2: AR Receipt (รับชำระ)
    // ==============================
    if (template === 'ar-receipt') {
      if (!claim.insuranceInvoice) return NextResponse.json({ error: 'ต้องมี Insurance Invoice ก่อน' }, { status: 400 })
      const arPayment = claim.insuranceInvoice.arPayment
      if (!arPayment) return NextResponse.json({ error: 'ยังไม่มีการรับชำระ AR' }, { status: 400 })

      return NextResponse.json({
        template: 'Import_Receipt',
        filename: `AR_Receipt_${claim.insuranceInvoice.invoiceNo}.xlsx`,
        rows: [
          {
            ลำดับที่: 1,
            อ้างอิงใบแจ้งหนี้: claim.insuranceInvoice.invoiceNo,
            วันที่เอกสาร: formatDate(arPayment.receivedAt),
            เลขที่ใบเสร็จ: '',
            ออกใบกำกับภาษี: insurance?.isVatRegistered ? 1 : 2,
            รับชำระโดย: conf.PAYMENT_CHANNEL_TRANSFER,
            จำนวนเงินที่รับชำระ: arPayment.amount,
            หมายเหตุ: remark,
          },
        ],
      })
    }

    // ==============================
    // Template 3: AP Purchase (ตั้งเจ้าหนี้)
    // ==============================
    if (template === 'ap-purchase') {
      const rows: Record<string, unknown>[] = []
      let seq = 1

      for (const si of claim.supplierInvoices) {
        const vendor = si.vendor
        rows.push({
          ลำดับที่: seq++,
          วันที่เอกสาร: formatDate(si.invoiceDate),
          อ้างอิงถึง: claim.claimNo.slice(0, 32),
          'ผู้รับเงิน/คู่ค้า': vendor?.peakVendorCode || '',
          'เลขทะเบียน 13 หลัก': vendor?.taxId || '',
          'เลขสาขา 5 หลัก': vendor?.branchCode || '00000',
          เลขที่ใบกำกับฯ: si.invoiceNo,
          วันที่ใบกำกับฯ: formatDate(si.invoiceDate),
          วันที่บันทึกภาษีซื้อ: formatDate(si.invoiceDate),
          ประเภทราคา: 1,
          'สินค้า/บริการ': 'P00033',
          บัญชี: conf.ACCOUNT_COST_PARTS,
          คำอธิบาย: `ค่าอะไหล่|${claim.carPlate}|${claim.claimNo}`,
          จำนวน: 1,
          'ราคา/หน่วย': si.totalAmount / 1.07,
          อัตราภาษี: '7%',
          'หัก ณ ที่จ่าย': 0,
          ชำระโดย: '',
          จำนวนเงินที่ชำระ: 0,
          'ภ.ง.ด.': vendor?.whtType || '53',
          หมายเหตุ: remark,
        })
      }

      for (const gi of claim.garageInvoices) {
        const garage = gi.garage
        rows.push({
          ลำดับที่: seq++,
          วันที่เอกสาร: formatDate(gi.invoiceDate),
          อ้างอิงถึง: claim.claimNo.slice(0, 32),
          'ผู้รับเงิน/คู่ค้า': garage?.peakVendorCode || '',
          'เลขทะเบียน 13 หลัก': garage?.taxId || '',
          'เลขสาขา 5 หลัก': garage?.branchCode || '00000',
          เลขที่ใบกำกับฯ: gi.invoiceNo,
          วันที่ใบกำกับฯ: formatDate(gi.invoiceDate),
          วันที่บันทึกภาษีซื้อ: formatDate(gi.invoiceDate),
          ประเภทราคา: 1,
          'สินค้า/บริการ': 'P00035',
          บัญชี: conf.ACCOUNT_COST_LABOR,
          คำอธิบาย: `ค่าแรง|${claim.carPlate}|${claim.claimNo}`,
          จำนวน: 1,
          'ราคา/หน่วย': gi.totalAmount / 1.07,
          อัตราภาษี: '7%',
          'หัก ณ ที่จ่าย': 0,
          ชำระโดย: '',
          จำนวนเงินที่ชำระ: 0,
          'ภ.ง.ด.': garage?.whtType || '53',
          หมายเหตุ: remark,
        })
      }

      if (rows.length === 0) return NextResponse.json({ error: 'ไม่มี Supplier/Garage Invoice' }, { status: 400 })

      return NextResponse.json({
        template: 'Import_PurchaseInventory',
        filename: `AP_Purchase_${claim.claimNo}.xlsx`,
        rows,
      })
    }

    // ==============================
    // Template 4: AP Expense (จ่ายเงิน Vendor/อู่)
    // ==============================
    if (template === 'ap-expense') {
      const rows: Record<string, unknown>[] = []
      let seq = 1

      for (const si of claim.supplierInvoices) {
        const apPayment = si.apPayment
        if (!apPayment) continue
        const vendor = si.vendor

        rows.push({
          ลำดับที่: seq++,
          วันที่เอกสาร: formatDate(apPayment.paidAt),
          อ้างอิงถึง: claim.claimNo.slice(0, 32),
          'ผู้รับเงิน/คู่ค้า': vendor?.peakVendorCode || '',
          'เลขทะเบียน 13 หลัก': vendor?.taxId || '',
          'เลขสาขา 5 หลัก': vendor?.branchCode || '00000',
          เลขที่ใบกำกับฯ: si.invoiceNo,
          วันที่ใบกำกับฯ: formatDate(si.invoiceDate),
          วันที่บันทึกภาษีซื้อ: formatDate(si.invoiceDate),
          ประเภทราคา: 1,
          บัญชี: conf.ACCOUNT_COST_PARTS,
          คำอธิบาย: `ค่าอะไหล่|${claim.carPlate}|${claim.claimNo}`,
          จำนวน: 1,
          'ราคา/หน่วย': apPayment.amount,
          อัตราภาษี: '7%',
          'หัก ณ ที่จ่าย': apPayment.whtAmount || 0,
          ชำระโดย: conf.PAYMENT_CHANNEL_TRANSFER,
          จำนวนเงินที่ชำระ: apPayment.amount - (apPayment.whtAmount || 0),
          'ภ.ง.ด.': vendor?.whtType || '53',
          หมายเหตุ: remark,
        })
      }

      if (rows.length === 0) return NextResponse.json({ error: 'ยังไม่มีการจ่ายเงิน AP' }, { status: 400 })

      return NextResponse.json({
        template: 'Import_Expense',
        filename: `AP_Expense_${claim.claimNo}.xlsx`,
        rows,
      })
    }

    return NextResponse.json({ error: `Unknown template: ${template}` }, { status: 400 })
  } catch (error) {
    console.error('[API] GET /api/claims/[id]/peak-export error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
