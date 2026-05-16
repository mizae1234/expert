import { Insurance } from '../types'

export const mockInsurances: Insurance[] = [
  {
    id: 'ins-001',
    name: 'ธนชาตประกันภัย',
    branch: 'สำนักงานใหญ่',
    taxId: '0107536000269',
    contactPerson: 'คุณสมชาย ธนชาติ',
    peakCustomerId: 'C001',
  },
  {
    id: 'ins-002',
    name: 'กรุงเทพประกันภัย',
    branch: 'สำนักงานใหญ่',
    taxId: '0107536000277',
    contactPerson: 'คุณสมหญิง กรุงเทพ',
    peakCustomerId: 'C002',
  },
  {
    id: 'ins-003',
    name: 'วิริยะประกันภัย',
    branch: 'สาขาพระราม 9',
    taxId: '0107536000285',
    contactPerson: 'คุณวิชัย วิริยะ',
    peakCustomerId: 'C003',
  },
  {
    id: 'ins-004',
    name: 'สินมั่นคงประกันภัย',
    branch: 'สำนักงานใหญ่',
    taxId: '0107536000293',
    contactPerson: 'คุณมั่นคง สินทรัพย์',
    peakCustomerId: 'C004',
  },
]
