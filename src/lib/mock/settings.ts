import { CompanyProfile, DocumentSequence } from '@/lib/types'

export const mockCompanyProfile: CompanyProfile = {
  id: 'comp-001',
  name: 'บริษัท เอ็กซ์เพิร์ท บอดี้แอนด์เพนท์ จำกัด',
  nameEn: 'Expert Body and Paint Co., Ltd.',
  taxId: '0105568142253',
  branchCode: '00000',
  branchName: 'สำนักงานใหญ่',
  address: '622 ซ.ลาดพร้าว 47 (สะพาน 2)',
  subDistrict: 'สะพานสอง',
  district: 'วังทองหลาง',
  province: 'กรุงเทพมหานคร',
  postalCode: '10310',
  phone: '',
  email: '',
  website: '',
  logoUrl: undefined,
  authorizedName: '',
  authorizedTitle: '',
  signatureUrl: undefined,
  paymentTermDays: 30,
  bankName: '',
  bankAccount: '',
  bankAccountName: '',
}

export const mockDocumentSequences: DocumentSequence[] = [
  { id: 'seq-qt', docType: 'QT', prefix: 'QT', lastNo: 12 },
  { id: 'seq-po', docType: 'PO', prefix: 'PO', lastNo: 45 },
  { id: 'seq-do', docType: 'DO', prefix: 'DO', lastNo: 8 },
  { id: 'seq-inv', docType: 'INV', prefix: 'INV', lastNo: 33 },
]

export const mockPeakConfig: Record<string, string> = {
  PAYMENT_CHANNEL_TRANSFER: 'CSH001',
  PAYMENT_CHANNEL_CHEQUE: 'CSH002',
  ACCOUNT_COST_PARTS: '510101',
  ACCOUNT_COST_LABOR: '510102',
  ACCOUNT_REVENUE_LABOR: '410101',
  ACCOUNT_REVENUE_PARTS: '410102',
}
