import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  await new Promise(resolve => setTimeout(resolve, 1500))

  return NextResponse.json({
    invoiceNo: { value: 'SINV-2025-0001', confidence: 95 },
    invoiceDate: { value: '2025-03-20', confidence: 90 },
    vendorName: { value: 'บริษัท ไทยออโต้พาร์ท จำกัด', confidence: 88 },
    items: [
      { partNo: { value: 'TY-BMP-F01', confidence: 92 }, description: { value: 'กันชนหน้า', confidence: 94 }, qty: { value: 1, confidence: 98 }, unitPrice: { value: 7225, confidence: 90 }, total: { value: 7225, confidence: 90 } },
      { partNo: { value: 'TY-HDL-R01', confidence: 90 }, description: { value: 'ไฟหน้าขวา', confidence: 93 }, qty: { value: 1, confidence: 98 }, unitPrice: { value: 10200, confidence: 88 }, total: { value: 10200, confidence: 88 } },
    ],
    subtotal: { value: 17425, confidence: 90 },
    vat: { value: 1220, confidence: 88 },
    grandTotal: { value: 18645, confidence: 87 },
    validation: { passed: true, warnings: [] },
  })
}
