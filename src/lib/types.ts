// ==========================================
// Enums
// ==========================================
export type ClaimStatus =
  | 'RECEIVED'
  | 'PARTS_CHECK'
  | 'PO_ISSUED'
  | 'GOODS_RECEIVED'
  | 'INVOICE_SENT'
  | 'AP_PAID'
  | 'AR_RECEIVED'
  | 'CLOSED'
  | 'CANCELLED'

export type POType = 'PARTS' | 'LABOR'
export type DeliveryMode = 'DIRECT_TO_GARAGE' | 'SELF_DELIVERY'
export type POStatus = 'DRAFT' | 'SENT' | 'RECEIVED' | 'CANCELLED'
export type ARStatus = 'PENDING' | 'SENT' | 'PARTIAL' | 'PAID' | 'CANCELLED'
export type QuotationStatus = 'DRAFT' | 'SENT' | 'APPROVED' | 'REJECTED' | 'SUPERSEDED'
export type APPayType = 'VENDOR' | 'GARAGE'
export type VendorType = 'PARTS' | 'GARAGE'

// ==========================================
// Models
// ==========================================
export interface Insurance {
  id: string
  name: string
  branch?: string
  taxId?: string
  address?: string
  contactPerson?: string
  peakCustomerId?: string
  branchCode?: string
  isVatRegistered?: boolean
  contactType?: string
  nationality?: string
  businessType?: string
  creditTermAr?: string
  creditTermArDays?: number
  creditTermAp?: string
  creditTermApDays?: number
  accountArCode?: string
  accountApCode?: string
  creditLimitType?: string
  creditLimitAmount?: number
}

export interface Vendor {
  id: string
  name: string
  vendorType: VendorType
  taxId?: string
  phone?: string
  zone?: string
  province?: string
  paymentTerms: number
  isActive: boolean
  branchCode?: string
  peakVendorCode?: string
  whtType?: string
  contactType?: string
  nationality?: string
  businessType?: string
  creditTermAr?: string
  creditTermArDays?: number
  creditTermAp?: string
  creditTermApDays?: number
  accountArCode?: string
  accountApCode?: string
  creditLimitType?: string
  creditLimitAmount?: number
}

export interface Garage {
  id: string
  name: string
  zone?: string
  province?: string
  address?: string
  phone?: string
  taxId?: string
  branchCode?: string
  peakVendorCode?: string
  whtType?: string
}

export type PartMasterSource = 'AUTO' | 'MANUAL'

export interface PartVendorPrice {
  id: string
  partNo: string
  vendorId: string
  vendor?: Vendor
  brand: string
  price: number
  lastSeenAt: string
  isPreferred: boolean
}

export interface PartMaster {
  id: string
  partNo: string
  partName: string
  partNameAlt: string[]
  category?: string
  unit: string
  standardPrice?: number
  isActive: boolean
  source: PartMasterSource
  createdFrom?: string
  usageCount: number
  createdAt: string
  updatedAt: string
  vendorPrices?: PartVendorPrice[]
}

export interface ClaimPart {
  id: string
  claimId: string
  partNo: string
  partName: string
  priceFullAmt: number
  quantity: number
  damageType: string
  discountPct: number
  priceOffer: number
  priceApprove: number
  supplier: string
  requireReturn: boolean
  round: number
  status: string
  paymentStatus?: 'PENDING' | 'INVOICED' | 'PR_SENT' | 'PAID'
  partMasterId?: string
  partMaster?: PartMaster
}

export interface ClaimLabor {
  id: string
  claimId: string
  description: string
  damageLevel: string
  discountPct: number
  priceOffer: number
  priceApprove: number
  round: number
  status: string
  paymentStatus?: 'PENDING' | 'INVOICED' | 'PR_SENT' | 'PAID'
}

export interface GarageInvoiceItem {
  id: string
  garageInvoiceId: string
  claimLaborId?: string
  description: string
  unitPrice: number
  totalPrice: number
}

export interface GarageInvoice {
  id: string
  claimId: string
  garageId: string
  garageName?: string
  invoiceNo: string
  invoiceDate: string
  items: GarageInvoiceItem[]
  subtotal: number
  vatAmount: number
  totalAmount: number
  apPayment?: APPayment
  taxId?: string
  branchCode?: string
  peakVendorCode?: string
  whtType?: string
  createdAt: string
}

export interface POItem {
  id: string
  poId: string
  partNo: string
  description: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export interface GoodsReceipt {
  id: string
  poId: string
  receivedAt: string
  receivedBy: string
  note?: string
  deliveryOrder?: DeliveryOrder
}

export interface DeliveryOrder {
  id: string
  goodsReceiptId: string
  garageId: string
  deliveredAt: string
  receivedBy: string
  note?: string
}

export interface PurchaseOrder {
  id: string
  claimId: string
  vendorId: string
  vendor?: Vendor
  poNo: string
  poType: POType
  deliveryMode: DeliveryMode
  totalAmount: number
  status: POStatus
  items: POItem[]
  goodsReceipt?: GoodsReceipt
  apPayment?: APPayment
  createdAt: string
}

export interface SupplierInvoiceItem {
  id: string
  supplierInvoiceId: string
  poItemId: string
  claimPartId?: string
  partNo: string
  description: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export interface SupplierInvoice {
  id: string
  claimId: string
  vendorId: string
  vendor?: Vendor
  invoiceNo: string
  invoiceDate: string
  subtotal: number
  vatAmount: number
  totalAmount: number
  pdfUrl?: string
  apPayment?: APPayment
  items?: SupplierInvoiceItem[]
  createdAt: string
}

export interface PaymentReadinessItem {
  claimPartId: string
  partNo: string
  partName: string
  priceApprove: number
  poId: string | null
  poStatus: string | null
  supplierInvoiceId: string | null
  canPay: boolean
  blockReason: string | null
}

export interface PaymentReadinessSummary {
  totalApproved: number
  totalCanPay: number
  totalPending: number
  totalPaid: number
}

export interface InsuranceInvoice {
  id: string
  claimId: string
  invoiceNo: string
  invoiceDate: string
  laborTotal: number
  partsTotal: number
  subtotal: number
  vatAmount: number
  grandTotal: number
  deductible: number
  dueDate?: string
  status: ARStatus
  cancelledAt?: string
  arPayment?: ARPayment
  createdAt: string
  // joined from claim for list view
  claim?: { claimNo: string; carPlate: string; insurance?: { name: string } }
}

export interface APPayment {
  id: string
  supplierInvoiceId?: string
  poId?: string
  payType: APPayType
  amount: number
  whtAmount: number
  paidAt: string
  method: string
  ref?: string
}

export interface ARPayment {
  id: string
  insuranceInvoiceId: string
  amount: number
  receivedAt: string
  method: string
  ref?: string
}

export type PaymentRequestType = 'AP_VENDOR' | 'AP_GARAGE' | 'AR'
export type ApprovalStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED'

export interface BillReceipt {
  id: string
  paymentRequestId: string
  receivedDate: string
  physicalInvoiceNo: string
  invoiceNoMatched: boolean
  receivedBy: string
  systemInvoiceNo: string
  poNo?: string
  claimNo: string
  amount: number
  note?: string
  createdAt: string
}

export interface PaymentRequest {
  id: string
  requestType: PaymentRequestType
  claimId: string
  claimNo?: string
  carPlate?: string
  supplierInvoiceId?: string
  insuranceInvoiceId?: string
  vendorName?: string
  garageName?: string
  insuranceName?: string
  amount: number
  whtAmount: number
  method: string
  note?: string
  status: ApprovalStatus
  approvedBy?: string
  approvedAt?: string
  rejectReason?: string
  createdBy: string
  createdAt: string
  billReceipt?: BillReceipt
}

export interface ClaimStatusLog {
  id: string
  claimId: string
  fromStatus?: string
  toStatus: string
  changedBy: string
  note?: string
  createdAt: string
}

export interface ExtractionLog {
  id: string
  claimId: string
  fieldName: string
  aiValue: string
  userValue: string
  editedAt: string
}

export interface Claim {
  id: string
  claimNo: string
  receiveNo: string
  transactionNo: string
  insuranceId: string
  insurance?: Insurance
  garageId: string
  garage?: Garage
  carPlate: string
  carBrand: string
  carModel: string
  carVin: string
  province: string
  insuredName: string
  status: ClaimStatus
  createdAt: string
  sentAt?: string
  parts?: ClaimPart[]
  labors?: ClaimLabor[]
  purchaseOrders?: PurchaseOrder[]
  supplierInvoices?: SupplierInvoice[]
  garageInvoices?: GarageInvoice[]
  insuranceInvoice?: InsuranceInvoice
  statusLogs?: ClaimStatusLog[]
  extractionLogs?: ExtractionLog[]
}

// ==========================================
// Dashboard Types
// ==========================================
export interface DashboardSummary {
  totalClaims: number
  pendingClaims: number
  totalRevenue: number
  avgMargin: number
  claimsByMonth: { month: string; count: number }[]
}

export interface RevenueByInsurance {
  insuranceId: string
  insuranceName: string
  totalRevenue: number
  claimCount: number
}

export interface ClaimsByStatus {
  status: ClaimStatus
  count: number
}

// ==========================================
// P&L Types
// ==========================================
export interface ClaimPnL {
  arReceived: number
  apVendor: number
  apGarage: number
  grossProfit: number
  marginPct: number
}

// ==========================================
// AI Extraction Types
// ==========================================
export interface AIField<T = string> {
  value: T
  confidence: number
}

export interface AIExtractedClaim {
  claim: {
    claimNo: AIField
    receiveNo: AIField
    transactionNo: AIField
    insuranceName: AIField
    branch: AIField
    status: AIField
    createdAt: AIField
    sentAt: AIField
  }
  car: {
    plate: AIField
    province: AIField
    brand: AIField
    model: AIField
    vin: AIField
    insuredName: AIField
  }
  labors: {
    description: AIField
    damageLevel: AIField
    discountPct: AIField<number>
    priceOffer: AIField<number>
    priceApprove: AIField<number>
  }[]
  parts: {
    partNo: AIField
    partName: AIField
    priceFull: AIField<number>
    quantity: AIField<number>
    damageType: AIField
    discountPct: AIField<number>
    priceOffer: AIField<number>
    priceApprove: AIField<number>
    supplier: AIField
    requireReturn: AIField<boolean>
  }[]
  summary: {
    laborTotal: AIField<number>
    partsTotal: AIField<number>
    subtotal: AIField<number>
    vat: AIField<number>
    grandTotal: AIField<number>
    deductible: AIField<number>
  }
  validation: {
    passed: boolean
    warnings: string[]
  }
}

// ==========================================
// API Filter Types
// ==========================================
export interface ClaimFilter {
  status?: ClaimStatus
  insuranceId?: string
  dateFrom?: string
  dateTo?: string
  search?: string
}

export interface CompanyProfile {
  id: string
  name: string
  nameEn?: string
  taxId: string
  branchCode: string
  branchName: string
  address: string
  subDistrict?: string
  district?: string
  province?: string
  postalCode?: string
  phone?: string
  email?: string
  website?: string
  logoUrl?: string
  authorizedName?: string
  authorizedTitle?: string
  signatureUrl?: string
  paymentTermDays: number
  bankName?: string
  bankAccount?: string
  bankAccountName?: string
}

export interface DocumentSequence {
  id: string
  docType: string
  prefix: string
  lastNo: number
}

export interface QuotationLabor {
  id: string
  description: string
  damageLevel?: string
  discountPct: number
  unitPrice: number
  totalPrice: number
}

export interface QuotationPart {
  id: string
  partNo?: string
  partName: string
  quantity: number
  unitPrice: number
  discountPct: number
  totalPrice: number
}

export interface Quotation {
  id: string
  quotationNo: string
  claimId: string
  quotationDate: string
  validUntil: string
  laborItems: QuotationLabor[]
  partItems: QuotationPart[]
  laborTotal: number
  partsTotal: number
  subtotal: number
  vatAmount: number
  grandTotal: number
  note?: string
  status: QuotationStatus
  approvedAt?: string
  approvedBy?: string
  createdBy: string
  createdAt: string
}
