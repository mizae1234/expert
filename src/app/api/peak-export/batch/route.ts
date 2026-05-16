import { NextRequest, NextResponse } from 'next/server'
import { mockClaims } from '@/lib/mock/claims'
import { mockPeakConfig } from '@/lib/mock/settings'

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const template = searchParams.get('template') // ar-invoice, ar-receipt, ap-purchase, ap-expense
  const dateFrom = searchParams.get('dateFrom')
  const dateTo = searchParams.get('dateTo')

  if (!template) return NextResponse.json({ error: 'Missing template parameter' }, { status: 400 })

  const conf = mockPeakConfig
  const allRows: Record<string, unknown>[] = []
  let seq = 1

  // Filter claims based on date range (mock logic)
  let claims = mockClaims
  if (dateFrom && dateTo) {
    claims = claims.filter(c => c.createdAt >= dateFrom && c.createdAt <= dateTo)
  }

  // ==============================
  // Template 1: AR Invoice (ตั้งลูกหนี้)
  // ==============================
  if (template === 'ar-invoice') {
    for (const claim of claims) {
      if (!claim.insuranceInvoice) continue
      const insurance = claim.insurance
      if (!insurance?.peakCustomerId) continue

      const inv = claim.insuranceInvoice
      allRows.push({
        ลำดับที่: seq++,
        วันที่: formatDate(inv.invoiceDate),
        เลขที่เอกสาร: inv.invoiceNo,
        อ้างอิงถึง: claim.claimNo,
        ลูกค้า: insurance.peakCustomerId,
        สินค้า: 'P001',
        บัญชี: conf.ACCOUNT_REVENUE_LABOR,
        คำอธิบาย: `ค่าแรง|${claim.carPlate}|${insurance.name}`,
        จำนวน: 1,
        'ราคา/หน่วย': inv.laborTotal,
        อัตราภาษี: '7%',
      })
      allRows.push({
        ลำดับที่: seq++,
        วันที่: formatDate(inv.invoiceDate),
        เลขที่เอกสาร: inv.invoiceNo,
        อ้างอิงถึง: claim.claimNo,
        ลูกค้า: insurance.peakCustomerId,
        สินค้า: 'P002',
        บัญชี: conf.ACCOUNT_REVENUE_PARTS,
        คำอธิบาย: `ค่าอะไหล่|${claim.carPlate}|${insurance.name}`,
        จำนวน: 1,
        'ราคา/หน่วย': inv.partsTotal,
        อัตราภาษี: '7%',
      })
    }
    return NextResponse.json({ template: 'Import_Invoice', filename: `Batch_AR_Invoice.xlsx`, rows: allRows })
  }

  // ==============================
  // Template 2: AR Receipt (รับชำระ)
  // ==============================
  if (template === 'ar-receipt') {
    for (const claim of claims) {
      if (!claim.insuranceInvoice?.arPayment) continue
      const insurance = claim.insurance
      const inv = claim.insuranceInvoice
      const arPayment = inv.arPayment!

      allRows.push({
        ลำดับที่: seq++,
        อ้างอิงใบแจ้งหนี้: inv.invoiceNo,
        วันที่เอกสาร: formatDate(arPayment.receivedAt),
        เลขที่ใบเสร็จ: '',
        ออกใบกำกับภาษี: insurance?.isVatRegistered ? 1 : 2,
        รับชำระโดย: conf.PAYMENT_CHANNEL_TRANSFER,
        จำนวนเงินที่รับชำระ: arPayment.amount,
        หมายเหตุ: claim.claimNo,
      })
    }
    return NextResponse.json({ template: 'Import_Receipt', filename: `Batch_AR_Receipt.xlsx`, rows: allRows })
  }

  // ==============================
  // Template 3: AP Purchase (ตั้งเจ้าหนี้)
  // ==============================
  if (template === 'ap-purchase') {
    for (const claim of claims) {
      const supplierInvoices = claim.supplierInvoices || []
      for (const si of supplierInvoices) {
        const vendor = si.vendor
        if (!vendor?.peakVendorCode || !vendor?.taxId) continue
        const po = claim.purchaseOrders?.find(p => p.vendorId === si.vendorId)

        allRows.push({
          ลำดับที่: seq++,
          วันที่เอกสาร: formatDate(si.invoiceDate),
          อ้างอิงถึง: `${po?.poNo || ''}|${claim.claimNo}`.slice(0, 32),
          'ผู้รับเงิน/คู่ค้า': vendor.peakVendorCode,
          'เลขทะเบียน 13 หลัก': vendor.taxId,
          'เลขสาขา 5 หลัก': vendor.branchCode || '00000',
          เลขที่ใบกำกับฯ: si.invoiceNo,
          วันที่ใบกำกับฯ: formatDate(si.invoiceDate),
          วันที่บันทึกภาษีซื้อ: formatDate(si.invoiceDate),
          ประเภทราคา: 1,
          'สินค้า/บริการ': 'P002',
          บัญชี: conf.ACCOUNT_COST_PARTS,
          คำอธิบาย: `ค่าอะไหล่|${claim.carPlate}|${claim.claimNo}`,
          จำนวน: 1,
          'ราคา/หน่วย': si.totalAmount / 1.07,
          อัตราภาษี: '7%',
          'หัก ณ ที่จ่าย': 0,
          ชำระโดย: '',
          จำนวนเงินที่ชำระ: 0,
          'ภ.ง.ด.': vendor.whtType || '53',
          หมายเหตุ: si.invoiceNo,
        })
      }

      const garageInvoices = claim.garageInvoices || []
      for (const gi of garageInvoices) {
        if (!gi.peakVendorCode || !gi.taxId) continue
        allRows.push({
          ลำดับที่: seq++,
          วันที่เอกสาร: formatDate(gi.invoiceDate),
          อ้างอิงถึง: claim.claimNo.slice(0, 32),
          'ผู้รับเงิน/คู่ค้า': gi.peakVendorCode,
          'เลขทะเบียน 13 หลัก': gi.taxId,
          'เลขสาขา 5 หลัก': gi.branchCode || '00000',
          เลขที่ใบกำกับฯ: gi.invoiceNo,
          วันที่ใบกำกับฯ: formatDate(gi.invoiceDate),
          วันที่บันทึกภาษีซื้อ: formatDate(gi.invoiceDate),
          ประเภทราคา: 1,
          'สินค้า/บริการ': 'P001',
          บัญชี: conf.ACCOUNT_COST_LABOR,
          คำอธิบาย: `ค่าแรง|${claim.carPlate}|${claim.claimNo}`,
          จำนวน: 1,
          'ราคา/หน่วย': gi.totalAmount / 1.07,
          อัตราภาษี: '7%',
          'หัก ณ ที่จ่าย': 0,
          ชำระโดย: '',
          จำนวนเงินที่ชำระ: 0,
          'ภ.ง.ด.': gi.whtType || '53',
          หมายเหตุ: gi.invoiceNo,
        })
      }
    }
    return NextResponse.json({ template: 'Import_PurchaseInventory', filename: `Batch_AP_Purchase.xlsx`, rows: allRows })
  }

  // ==============================
  // Template 4: AP Expense (จ่ายเงิน Vendor/อู่)
  // ==============================
  if (template === 'ap-expense') {
    for (const claim of claims) {
      const supplierInvoices = claim.supplierInvoices || []
      for (const si of supplierInvoices) {
        const apPayment = si.apPayment
        if (!apPayment) continue
        const vendor = si.vendor
        const po = claim.purchaseOrders?.find(p => p.vendorId === si.vendorId)

        allRows.push({
          ลำดับที่: seq++,
          วันที่เอกสาร: formatDate(apPayment.paidAt),
          อ้างอิงถึง: `${po?.poNo || ''}|${claim.claimNo}`.slice(0, 32),
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
          หมายเหตุ: si.invoiceNo,
        })
      }

      const garageInvoices = claim.garageInvoices || []
      for (const gi of garageInvoices) {
        const apPayment = gi.apPayment
        if (!apPayment) continue

        allRows.push({
          ลำดับที่: seq++,
          วันที่เอกสาร: formatDate(apPayment.paidAt),
          อ้างอิงถึง: claim.claimNo.slice(0, 32),
          'ผู้รับเงิน/คู่ค้า': gi.peakVendorCode || '',
          'เลขทะเบียน 13 หลัก': gi.taxId || '',
          'เลขสาขา 5 หลัก': gi.branchCode || '00000',
          เลขที่ใบกำกับฯ: gi.invoiceNo,
          วันที่ใบกำกับฯ: formatDate(gi.invoiceDate),
          วันที่บันทึกภาษีซื้อ: formatDate(gi.invoiceDate),
          ประเภทราคา: 1,
          บัญชี: conf.ACCOUNT_COST_LABOR,
          คำอธิบาย: `ค่าแรง|${claim.carPlate}|${claim.claimNo}`,
          จำนวน: 1,
          'ราคา/หน่วย': apPayment.amount,
          อัตราภาษี: '7%',
          'หัก ณ ที่จ่าย': apPayment.whtAmount || 0,
          ชำระโดย: conf.PAYMENT_CHANNEL_TRANSFER,
          จำนวนเงินที่ชำระ: apPayment.amount - (apPayment.whtAmount || 0),
          'ภ.ง.ด.': gi.whtType || '53',
          หมายเหตุ: gi.invoiceNo,
        })
      }
    }
    return NextResponse.json({ template: 'Import_Expense', filename: `Batch_AP_Expense.xlsx`, rows: allRows })
  }

  return NextResponse.json({ error: `Unknown template: ${template}` }, { status: 400 })
}
