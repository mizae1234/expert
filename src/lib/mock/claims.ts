import { Claim, ClaimPart, ClaimLabor, PurchaseOrder, POItem, SupplierInvoice, SupplierInvoiceItem, GarageInvoice, GarageInvoiceItem, InsuranceInvoice, APPayment, ARPayment, ClaimStatusLog, GoodsReceipt } from '../types'
import { mockInsurances } from './insurances'
import { mockGarages, mockVendors } from './vendors'

// Helper to generate parts for a claim
function generateParts(claimId: string, count: number): ClaimPart[] {
  const partsList = [
    { partNo: 'TY-BMP-F01', partName: 'กันชนหน้า', priceFullAmt: 8500, damageType: 'เปลี่ยน' },
    { partNo: 'TY-HDL-R01', partName: 'ไฟหน้าขวา', priceFullAmt: 12000, damageType: 'เปลี่ยน' },
    { partNo: 'TY-FND-FL1', partName: 'บังโคลนหน้าซ้าย', priceFullAmt: 4500, damageType: 'ซ่อม' },
    { partNo: 'TY-GRL-F01', partName: 'กระจังหน้า', priceFullAmt: 3200, damageType: 'เปลี่ยน' },
    { partNo: 'TY-HDL-L01', partName: 'ไฟหน้าซ้าย', priceFullAmt: 11500, damageType: 'เปลี่ยน' },
    { partNo: 'TY-DOR-FR1', partName: 'ประตูหน้าขวา', priceFullAmt: 15000, damageType: 'เปลี่ยน' },
    { partNo: 'TY-MRR-R01', partName: 'กระจกมองข้างขวา', priceFullAmt: 3800, damageType: 'เปลี่ยน' },
    { partNo: 'TY-TLL-R01', partName: 'ไฟท้ายขวา', priceFullAmt: 6500, damageType: 'เปลี่ยน' },
  ]

  return partsList.slice(0, count).map((p, i) => ({
    id: `part-${claimId}-${i + 1}`,
    claimId,
    partNo: p.partNo,
    partName: p.partName,
    priceFullAmt: p.priceFullAmt,
    quantity: 1,
    damageType: p.damageType,
    discountPct: [0, 5, 10, 15][Math.floor(Math.random() * 4)],
    priceOffer: Math.round(p.priceFullAmt * 0.9),
    priceApprove: Math.round(p.priceFullAmt * 0.85),
    supplier: mockVendors.filter(v => v.vendorType === 'PARTS')[i % 3].name,
    requireReturn: p.damageType === 'เปลี่ยน' && Math.random() > 0.5,
    round: 1,
    status: 'approved',
    paymentStatus: 'PENDING' as const,
  }))
}

// Helper to generate labors for a claim
function generateLabors(claimId: string, count: number): ClaimLabor[] {
  const laborsList = [
    { description: 'ค่าแรงถอด-ประกอบกันชนหน้า', damageLevel: 'ปานกลาง', priceOffer: 2500 },
    { description: 'ค่าแรงพ่นสีบังโคลนหน้า', damageLevel: 'เบา', priceOffer: 3500 },
    { description: 'ค่าแรงเคาะดัดประตู', damageLevel: 'หนัก', priceOffer: 5000 },
    { description: 'ค่าแรงพ่นสีประตู', damageLevel: 'ปานกลาง', priceOffer: 4000 },
    { description: 'ค่าแรงขัดสี', damageLevel: 'เบา', priceOffer: 1500 },
  ]

  return laborsList.slice(0, count).map((l, i) => ({
    id: `labor-${claimId}-${i + 1}`,
    claimId,
    description: l.description,
    damageLevel: l.damageLevel,
    discountPct: [0, 5, 10][Math.floor(Math.random() * 3)],
    priceOffer: l.priceOffer,
    priceApprove: Math.round(l.priceOffer * 0.95),
    round: 1,
    status: 'approved',
    paymentStatus: 'PENDING' as const,
  }))
}

// Plates and car data
const carData = [
  { plate: 'กก 1234', brand: 'Toyota', model: 'Camry', province: 'กรุงเทพมหานคร' },
  { plate: 'ขข 5678', brand: 'Honda', model: 'Civic', province: 'นนทบุรี' },
  { plate: 'คค 9012', brand: 'Mazda', model: 'CX-5', province: 'ชลบุรี' },
  { plate: 'งง 3456', brand: 'Toyota', model: 'Yaris', province: 'เชียงใหม่' },
  { plate: 'จจ 7890', brand: 'Honda', model: 'HR-V', province: 'ระยอง' },
  { plate: 'ฉฉ 2345', brand: 'Nissan', model: 'Almera', province: 'ขอนแก่น' },
  { plate: 'ชช 6789', brand: 'Toyota', model: 'Hilux', province: 'เชียงราย' },
  { plate: 'ซซ 1357', brand: 'Isuzu', model: 'D-Max', province: 'นครราชสีมา' },
  { plate: 'ฌฌ 2468', brand: 'Mitsubishi', model: 'Triton', province: 'สุราษฎร์ธานี' },
  { plate: 'ญญ 3579', brand: 'Ford', model: 'Ranger', province: 'ภูเก็ต' },
  { plate: 'ฎฎ 4680', brand: 'Toyota', model: 'Fortuner', province: 'กรุงเทพมหานคร' },
  { plate: 'ฏฏ 5791', brand: 'Honda', model: 'City', province: 'ปทุมธานี' },
  { plate: 'ฐฐ 6802', brand: 'MG', model: 'ZS', province: 'สมุทรปราการ' },
  { plate: 'ฑฑ 7913', brand: 'Suzuki', model: 'Swift', province: 'นครปฐม' },
  { plate: 'ฒฒ 8024', brand: 'Toyota', model: 'Corolla Cross', province: 'พระนครศรีอยุธยา' },
  { plate: 'ณณ 9135', brand: 'Honda', model: 'Accord', province: 'ลำพูน' },
  { plate: 'ดด 1246', brand: 'Mazda', model: '2', province: 'เพชรบุรี' },
  { plate: 'ตต 2357', brand: 'Toyota', model: 'CHR', province: 'กาญจนบุรี' },
  { plate: 'ถถ 3468', brand: 'Nissan', model: 'Kicks', province: 'สงขลา' },
  { plate: 'ทท 4579', brand: 'Honda', model: 'BR-V', province: 'อุดรธานี' },
]

const insuredNames = [
  'นายสมชาย ใจดี', 'นางสาวสมหญิง รักดี', 'นายวิชัย สุขสันต์', 'นางมาลี ทองดี',
  'นายประเสริฐ แก้วมณี', 'นางสาวพิมพ์ชนก จันทร์ดี', 'นายกิตติ พงศ์สวัสดิ์',
  'นางวรรณา สมบูรณ์', 'นายอนุชา เจริญ', 'นางสาวจิราภรณ์ ศรีสุข',
  'นายธนพล อมรเดช', 'นางสุดารัตน์ พิทักษ์', 'นายอภิชาติ วงศ์สว่าง',
  'นางสาวกัลยา รุ่งเรือง', 'นายสุรเชษฐ์ มีสุข', 'นางพรทิพย์ แสงทอง',
  'นายเอกชัย ดวงตา', 'นางสาวนิภา พึ่งพร', 'นายชาตรี สายัณห์', 'นางกนกวรรณ บุญมา',
]

const statusDistribution: Array<{ status: Claim['status']; count: number }> = [
  { status: 'RECEIVED', count: 5 },
  { status: 'PARTS_CHECK', count: 3 },
  { status: 'PO_ISSUED', count: 4 },
  { status: 'GOODS_RECEIVED', count: 3 },
  { status: 'INVOICE_SENT', count: 2 },
  { status: 'AR_RECEIVED', count: 2 },
  { status: 'CLOSED', count: 1 },
]

// Generate 20 claims
function generateClaims(): Claim[] {
  const claims: Claim[] = []
  let claimIndex = 0

  for (const { status, count } of statusDistribution) {
    for (let i = 0; i < count; i++) {
      const idx = claimIndex
      const claimId = `claim-${String(idx + 1).padStart(3, '0')}`
      const car = carData[idx]
      const insurance = mockInsurances[idx % mockInsurances.length]
      const garage = mockGarages[idx % mockGarages.length]
      const partsCount = 2 + (idx % 3)
      const laborsCount = 1 + (idx % 3)
      const createdDate = new Date(2025, 0 + Math.floor(idx / 4), 5 + idx)

      const parts = generateParts(claimId, partsCount)
      const labors = generateLabors(claimId, laborsCount)

      const partsTotal = parts.reduce((sum, p) => sum + p.priceApprove * p.quantity, 0)
      const laborTotal = labors.reduce((sum, l) => sum + l.priceApprove, 0)

      // Generate POs for claims beyond PARTS_CHECK
      const purchaseOrders: PurchaseOrder[] = []
      if (['PO_ISSUED', 'GOODS_RECEIVED', 'INVOICE_SENT', 'AP_PAID', 'AR_RECEIVED', 'CLOSED'].includes(status)) {
        const poItems: POItem[] = parts.map((p, pi) => ({
          id: `poi-${claimId}-${pi + 1}`,
          poId: `po-${claimId}-1`,
          partNo: p.partNo,
          description: p.partName,
          quantity: p.quantity,
          unitPrice: p.priceApprove,
          totalPrice: p.priceApprove * p.quantity,
        }))

        const grId = `gr-${claimId}-1`
        const goodsReceipt: GoodsReceipt | undefined =
          ['GOODS_RECEIVED', 'INVOICE_SENT', 'AP_PAID', 'AR_RECEIVED', 'CLOSED'].includes(status)
            ? {
                id: grId,
                poId: `po-${claimId}-1`,
                receivedAt: new Date(createdDate.getTime() + 7 * 86400000).toISOString(),
                receivedBy: 'พนักงานรับของ',
                note: 'รับของครบ',
              }
            : undefined

        purchaseOrders.push({
          id: `po-${claimId}-1`,
          claimId,
          vendorId: 'ven-p01',
          vendor: mockVendors[0],
          poNo: `PO-${String(idx + 1).padStart(4, '0')}`,
          poType: 'PARTS',
          deliveryMode: 'DIRECT_TO_GARAGE',
          totalAmount: partsTotal,
          status: goodsReceipt ? 'RECEIVED' : 'SENT',
          items: poItems,
          goodsReceipt,
          createdAt: new Date(createdDate.getTime() + 2 * 86400000).toISOString(),
        })
      }

      // Generate supplier invoices
      const supplierInvoices: SupplierInvoice[] = []
      if (['INVOICE_SENT', 'AP_PAID', 'AR_RECEIVED', 'CLOSED'].includes(status)) {
        const subtotal = partsTotal
        const vatAmount = Math.round(subtotal * 0.07)

        // Generate invoice items mapped to PO items and claim parts
        const poItems = purchaseOrders[0]?.items || []
        const invoiceItems: SupplierInvoiceItem[] = poItems.map((poi, pi) => ({
          id: `sinv-item-${claimId}-${pi + 1}`,
          supplierInvoiceId: `sinv-${claimId}-1`,
          poItemId: poi.id,
          claimPartId: parts[pi]?.id,
          partNo: poi.partNo,
          description: poi.description,
          quantity: poi.quantity,
          unitPrice: poi.unitPrice,
          totalPrice: poi.totalPrice,
        }))

        supplierInvoices.push({
          id: `sinv-${claimId}-1`,
          claimId,
          vendorId: 'ven-p01',
          vendor: mockVendors[0],
          invoiceNo: `SINV-${String(idx + 1).padStart(4, '0')}`,
          invoiceDate: new Date(createdDate.getTime() + 10 * 86400000).toISOString(),
          subtotal,
          vatAmount,
          totalAmount: subtotal + vatAmount,
          items: invoiceItems,
          createdAt: new Date(createdDate.getTime() + 10 * 86400000).toISOString(),
        })
      }

      // Generate insurance invoice
      let insuranceInvoice: InsuranceInvoice | undefined
      if (['INVOICE_SENT', 'AP_PAID', 'AR_RECEIVED', 'CLOSED'].includes(status)) {
        const subtotal = partsTotal + laborTotal
        const vatAmount = Math.round(subtotal * 0.07)
        insuranceInvoice = {
          id: `iinv-${claimId}`,
          claimId,
          invoiceNo: `INV-${String(idx + 1).padStart(4, '0')}`,
          invoiceDate: new Date(createdDate.getTime() + 12 * 86400000).toISOString(),
          laborTotal,
          partsTotal,
          subtotal,
          vatAmount,
          grandTotal: subtotal + vatAmount,
          deductible: 0,
          status: ['AR_RECEIVED', 'CLOSED'].includes(status) ? 'PAID' : 'SENT',
          createdAt: new Date(createdDate.getTime() + 12 * 86400000).toISOString(),
        }
      }

      // Generate status logs
      const statusFlow: Claim['status'][] = ['RECEIVED', 'PARTS_CHECK', 'PO_ISSUED', 'GOODS_RECEIVED', 'INVOICE_SENT', 'AP_PAID', 'AR_RECEIVED', 'CLOSED']
      const currentStatusIndex = statusFlow.indexOf(status)
      const statusLogs: ClaimStatusLog[] = []
      for (let si = 0; si <= currentStatusIndex; si++) {
        statusLogs.push({
          id: `log-${claimId}-${si}`,
          claimId,
          fromStatus: si > 0 ? statusFlow[si - 1] : undefined,
          toStatus: statusFlow[si],
          changedBy: 'admin',
          note: si === 0 ? 'รับ Claim เข้าระบบ' : undefined,
          createdAt: new Date(createdDate.getTime() + si * 2 * 86400000).toISOString(),
        })
      }

        // Generate garage invoices for labors
        const garageInvoices: GarageInvoice[] = []
        if (['INVOICE_SENT', 'AP_PAID', 'AR_RECEIVED', 'CLOSED'].includes(status)) {
          const gInvItems: GarageInvoiceItem[] = labors.map((l, li) => ({
            id: `ginv-item-${claimId}-${li + 1}`,
            garageInvoiceId: `ginv-${claimId}-1`,
            claimLaborId: l.id,
            description: l.description,
            unitPrice: l.priceApprove,
            totalPrice: l.priceApprove,
          }))
          const gSub = laborTotal
          const gVat = Math.round(gSub * 0.07)
          garageInvoices.push({
            id: `ginv-${claimId}-1`,
            claimId,
            garageId: garage.id,
            garageName: garage.name,
            invoiceNo: `GINV-${String(idx + 1).padStart(4, '0')}`,
            invoiceDate: new Date(createdDate.getTime() + 10 * 86400000).toISOString(),
            items: gInvItems,
            subtotal: gSub,
            vatAmount: gVat,
            totalAmount: gSub + gVat,
            createdAt: new Date(createdDate.getTime() + 10 * 86400000).toISOString(),
          })
          // Update paymentStatus
          labors.forEach(l => { l.paymentStatus = ['AP_PAID', 'AR_RECEIVED', 'CLOSED'].includes(status) ? 'PAID' : 'INVOICED' })
        }

        // Update parts paymentStatus based on status
        if (['INVOICE_SENT', 'AP_PAID', 'AR_RECEIVED', 'CLOSED'].includes(status)) {
          parts.forEach(p => { p.paymentStatus = ['AP_PAID', 'AR_RECEIVED', 'CLOSED'].includes(status) ? 'PAID' : 'INVOICED' })
        }

        claims.push({
        id: claimId,
        claimNo: `CLM-${String(2025)}${String(idx + 1).padStart(4, '0')}`,
        receiveNo: `RCV-${String(idx + 1).padStart(4, '0')}`,
        transactionNo: `TXN-${String(idx + 1).padStart(6, '0')}`,
        insuranceId: insurance.id,
        insurance,
        garageId: garage.id,
        garage,
        carPlate: car.plate,
        carBrand: car.brand,
        carModel: car.model,
        carVin: `JTDKN3DU${String(5 + idx)}A${String(100000 + idx)}`,
        province: car.province,
        insuredName: insuredNames[idx],
        status,
        createdAt: createdDate.toISOString(),
        sentAt: currentStatusIndex >= 1 ? new Date(createdDate.getTime() + 86400000).toISOString() : undefined,
        parts,
        labors,
        purchaseOrders,
        supplierInvoices,
        garageInvoices,
        insuranceInvoice,
        statusLogs,
        extractionLogs: [],
      })

      claimIndex++
    }
  }

  return claims
}

export const mockClaims = generateClaims()
