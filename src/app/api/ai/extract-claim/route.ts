import { NextRequest, NextResponse } from 'next/server'

// Mock AI extraction response for demo
const mockExtraction = {
  claim: {
    claimNo: { value: 'CLM-20250021', confidence: 95 },
    receiveNo: { value: 'RCV-0021', confidence: 90 },
    transactionNo: { value: 'TXN-000021', confidence: 88 },
    insuranceName: { value: 'ธนชาตประกันภัย', confidence: 92 },
    branch: { value: 'สำนักงานใหญ่', confidence: 85 },
    status: { value: 'RECEIVED', confidence: 95 },
    createdAt: { value: '2025-03-15', confidence: 90 },
    sentAt: { value: '', confidence: 0 },
  },
  car: {
    plate: { value: 'กก 1234', confidence: 97 },
    province: { value: 'กรุงเทพมหานคร', confidence: 93 },
    brand: { value: 'Toyota', confidence: 95 },
    model: { value: 'Camry', confidence: 92 },
    vin: { value: 'JTDKN3DU5A100001', confidence: 78 },
    insuredName: { value: 'นายสมชาย ใจดี', confidence: 88 },
  },
  labors: [
    {
      description: { value: 'ค่าแรงถอด-ประกอบกันชนหน้า', confidence: 90 },
      damageLevel: { value: 'ปานกลาง', confidence: 85 },
      discountPct: { value: 0, confidence: 95 },
      priceOffer: { value: 2500, confidence: 92 },
      priceApprove: { value: 2375, confidence: 88 },
    },
    {
      description: { value: 'ค่าแรงพ่นสีบังโคลนหน้า', confidence: 87 },
      damageLevel: { value: 'เบา', confidence: 80 },
      discountPct: { value: 5, confidence: 90 },
      priceOffer: { value: 3500, confidence: 91 },
      priceApprove: { value: 3325, confidence: 85 },
    },
  ],
  parts: [
    {
      partNo: { value: 'TY-BMP-F01', confidence: 93 },
      partName: { value: 'กันชนหน้า', confidence: 95 },
      priceFull: { value: 8500, confidence: 90 },
      quantity: { value: 1, confidence: 98 },
      damageType: { value: 'เปลี่ยน', confidence: 92 },
      discountPct: { value: 10, confidence: 88 },
      priceOffer: { value: 7650, confidence: 90 },
      priceApprove: { value: 7225, confidence: 85 },
      supplier: { value: 'บริษัท ไทยออโต้พาร์ท จำกัด', confidence: 75 },
      requireReturn: { value: true, confidence: 82 },
    },
    {
      partNo: { value: 'TY-HDL-R01', confidence: 91 },
      partName: { value: 'ไฟหน้าขวา', confidence: 94 },
      priceFull: { value: 12000, confidence: 89 },
      quantity: { value: 1, confidence: 98 },
      damageType: { value: 'เปลี่ยน', confidence: 93 },
      discountPct: { value: 5, confidence: 87 },
      priceOffer: { value: 11400, confidence: 88 },
      priceApprove: { value: 10200, confidence: 83 },
      supplier: { value: 'บริษัท ไทยออโต้พาร์ท จำกัด', confidence: 70 },
      requireReturn: { value: false, confidence: 90 },
    },
  ],
  summary: {
    laborTotal: { value: 5700, confidence: 92 },
    partsTotal: { value: 17425, confidence: 90 },
    subtotal: { value: 23125, confidence: 88 },
    vat: { value: 1619, confidence: 90 },
    grandTotal: { value: 24744, confidence: 87 },
    deductible: { value: 0, confidence: 95 },
  },
  validation: {
    passed: true,
    warnings: [],
  },
}

export async function POST(request: NextRequest) {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 2000))
  return NextResponse.json(mockExtraction)
}
