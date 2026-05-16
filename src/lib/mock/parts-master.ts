import { PartMaster } from '../types'

export const mockPartsMaster: PartMaster[] = [
  {
    id: 'pm-001',
    partNo: '7106013CFC0100',
    partName: 'ชายล่างกันชนหลัง',
    partNameAlt: ['ชายกันชนหลัง', 'สเกิร์ตหลัง'],
    category: 'กันชน/สเกิร์ต',
    unit: 'ชิ้น',
    standardPrice: 10408,
    isActive: true,
    source: 'AUTO',
    createdFrom: 'clm-001',
    usageCount: 47,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-05-10T14:30:00Z',
    vendorPrices: [
      { id: 'vp-001', partNo: '7106013CFC0100', vendorId: 'v-001', brand: 'OEM', price: 9800, lastSeenAt: '2024-05-10T14:30:00Z', isPreferred: true },
      { id: 'vp-002', partNo: '7106013CFC0100', vendorId: 'v-002', brand: 'แท้เบิกศูนย์', price: 10408, lastSeenAt: '2024-04-20T09:15:00Z', isPreferred: false }
    ]
  },
  {
    id: 'pm-002',
    partNo: '715002CFC0100',
    partName: 'ไฟทับทิมข้างขวา',
    partNameAlt: ['ไฟทับทิมขวา', 'ทับทิมกันชนขวา'],
    category: 'ระบบไฟ',
    unit: 'ชิ้น',
    standardPrice: 1500,
    isActive: true,
    source: 'AUTO',
    createdFrom: 'clm-001',
    usageCount: 12,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-03-12T11:20:00Z',
    vendorPrices: [
      { id: 'vp-003', partNo: '715002CFC0100', vendorId: 'v-001', brand: 'OEM', price: 1200, lastSeenAt: '2024-03-12T11:20:00Z', isPreferred: true }
    ]
  },
  {
    id: 'pm-003',
    partNo: '81550-02A00',
    partName: 'ไฟท้ายขวา',
    partNameAlt: ['โคมไฟท้ายขวา'],
    category: 'ระบบไฟ',
    unit: 'ดวง',
    standardPrice: 4500,
    isActive: true,
    source: 'MANUAL',
    usageCount: 25,
    createdAt: '2024-02-01T09:00:00Z',
    updatedAt: '2024-04-05T16:45:00Z',
    vendorPrices: [
      { id: 'vp-004', partNo: '81550-02A00', vendorId: 'v-003', brand: 'เทียบ', price: 2800, lastSeenAt: '2024-04-05T16:45:00Z', isPreferred: false },
      { id: 'vp-005', partNo: '81550-02A00', vendorId: 'v-001', brand: 'แท้เบิกศูนย์', price: 4500, lastSeenAt: '2024-03-22T10:00:00Z', isPreferred: true }
    ]
  },
  {
    id: 'pm-004',
    partNo: '52119-02980',
    partName: 'กันชนหน้า',
    partNameAlt: ['เปลือกกันชนหน้า', 'กันชนหน้าเดิม'],
    category: 'กันชน/สเกิร์ต',
    unit: 'ชิ้น',
    standardPrice: 3800,
    isActive: true,
    source: 'AUTO',
    createdFrom: 'clm-002',
    usageCount: 50,
    createdAt: '2024-01-20T14:20:00Z',
    updatedAt: '2024-05-12T08:30:00Z',
    vendorPrices: [
      { id: 'vp-006', partNo: '52119-02980', vendorId: 'v-002', brand: 'OEM', price: 3500, lastSeenAt: '2024-05-12T08:30:00Z', isPreferred: true },
      { id: 'vp-007', partNo: '52119-02980', vendorId: 'v-003', brand: 'เทียมไต้หวัน', price: 1800, lastSeenAt: '2024-05-01T13:10:00Z', isPreferred: false }
    ]
  },
  {
    id: 'pm-005',
    partNo: '53101-02E00',
    partName: 'กระจังหน้า',
    partNameAlt: ['หน้ากระจัง'],
    category: 'ตัวถังภายนอก',
    unit: 'ชิ้น',
    standardPrice: 2200,
    isActive: true,
    source: 'AUTO',
    createdFrom: 'clm-003',
    usageCount: 18,
    createdAt: '2024-02-10T11:45:00Z',
    updatedAt: '2024-04-18T15:20:00Z',
    vendorPrices: [
      { id: 'vp-008', partNo: '53101-02E00', vendorId: 'v-001', brand: 'OEM', price: 2000, lastSeenAt: '2024-04-18T15:20:00Z', isPreferred: true }
    ]
  },
  {
    id: 'pm-006',
    partNo: '81110-02E60',
    partName: 'ไฟหน้าขวา',
    partNameAlt: ['โคมไฟหน้าขวา'],
    category: 'ระบบไฟ',
    unit: 'ดวง',
    standardPrice: 8500,
    isActive: true,
    source: 'MANUAL',
    usageCount: 30,
    createdAt: '2024-01-05T08:30:00Z',
    updatedAt: '2024-05-05T09:15:00Z',
    vendorPrices: [
      { id: 'vp-009', partNo: '81110-02E60', vendorId: 'v-001', brand: 'แท้เบิกศูนย์', price: 8500, lastSeenAt: '2024-05-05T09:15:00Z', isPreferred: true },
      { id: 'vp-010', partNo: '81110-02E60', vendorId: 'v-003', brand: 'เทียบ', price: 4200, lastSeenAt: '2024-04-28T14:00:00Z', isPreferred: false }
    ]
  },
  {
    id: 'pm-007',
    partNo: '67001-02380',
    partName: 'ประตูหน้าขวา',
    partNameAlt: ['บานประตูหน้าขวา'],
    category: 'ตัวถังภายนอก',
    unit: 'บาน',
    standardPrice: 12000,
    isActive: true,
    source: 'AUTO',
    createdFrom: 'clm-005',
    usageCount: 5,
    createdAt: '2024-03-01T10:20:00Z',
    updatedAt: '2024-04-15T11:30:00Z',
    vendorPrices: [
      { id: 'vp-011', partNo: '67001-02380', vendorId: 'v-002', brand: 'แท้เบิกศูนย์', price: 12000, lastSeenAt: '2024-04-15T11:30:00Z', isPreferred: true },
      { id: 'vp-012', partNo: '67001-02380', vendorId: 'v-003', brand: 'มือสอง', price: 5500, lastSeenAt: '2024-04-10T16:00:00Z', isPreferred: false }
    ]
  },
  {
    id: 'pm-008',
    partNo: '87910-02C60',
    partName: 'กระจกมองข้างขวา',
    partNameAlt: ['กระจกมองข้างด้านขวา'],
    category: 'กระจก/ฝา',
    unit: 'ชิ้น',
    standardPrice: 3500,
    isActive: true,
    source: 'AUTO',
    createdFrom: 'clm-006',
    usageCount: 22,
    createdAt: '2024-02-15T13:10:00Z',
    updatedAt: '2024-05-02T10:45:00Z',
    vendorPrices: [
      { id: 'vp-013', partNo: '87910-02C60', vendorId: 'v-001', brand: 'OEM', price: 3200, lastSeenAt: '2024-05-02T10:45:00Z', isPreferred: true }
    ]
  },
  {
    id: 'pm-009',
    partNo: '53301-02260',
    partName: 'ฝากระโปรงหน้า',
    partNameAlt: ['ฝากระโปรง'],
    category: 'กระจก/ฝา',
    unit: 'บาน',
    standardPrice: 7500,
    isActive: true,
    source: 'MANUAL',
    usageCount: 15,
    createdAt: '2024-01-10T09:45:00Z',
    updatedAt: '2024-04-25T14:20:00Z',
    vendorPrices: [
      { id: 'vp-014', partNo: '53301-02260', vendorId: 'v-002', brand: 'แท้เบิกศูนย์', price: 7500, lastSeenAt: '2024-04-25T14:20:00Z', isPreferred: true },
      { id: 'vp-015', partNo: '53301-02260', vendorId: 'v-003', brand: 'เทียม', price: 3800, lastSeenAt: '2024-04-20T11:00:00Z', isPreferred: false }
    ]
  },
  {
    id: 'pm-010',
    partNo: '64401-02380',
    partName: 'ฝากระโปรงท้าย',
    partNameAlt: ['ฝาท้าย', 'ประตูท้าย'],
    category: 'กระจก/ฝา',
    unit: 'บาน',
    standardPrice: 8200,
    isActive: true,
    source: 'AUTO',
    createdFrom: 'clm-008',
    usageCount: 8,
    createdAt: '2024-03-10T15:30:00Z',
    updatedAt: '2024-05-08T09:10:00Z',
    vendorPrices: [
      { id: 'vp-016', partNo: '64401-02380', vendorId: 'v-001', brand: 'แท้เบิกศูนย์', price: 8200, lastSeenAt: '2024-05-08T09:10:00Z', isPreferred: true }
    ]
  },
  {
    id: 'pm-011',
    partNo: '53811-02170',
    partName: 'แก้มบังโคลนหน้าขวา',
    partNameAlt: ['บังโคลนหน้าขวา', 'แก้มหน้าขวา'],
    category: 'ตัวถังภายนอก',
    unit: 'ชิ้น',
    standardPrice: 2800,
    isActive: true,
    source: 'AUTO',
    createdFrom: 'clm-009',
    usageCount: 35,
    createdAt: '2024-01-25T11:15:00Z',
    updatedAt: '2024-05-11T16:30:00Z',
    vendorPrices: [
      { id: 'vp-017', partNo: '53811-02170', vendorId: 'v-001', brand: 'OEM', price: 2600, lastSeenAt: '2024-05-11T16:30:00Z', isPreferred: true },
      { id: 'vp-018', partNo: '53811-02170', vendorId: 'v-003', brand: 'เทียม', price: 1200, lastSeenAt: '2024-05-05T10:00:00Z', isPreferred: false }
    ]
  },
  {
    id: 'pm-012',
    partNo: '52159-02990',
    partName: 'กันชนหลัง',
    partNameAlt: ['เปลือกกันชนหลัง'],
    category: 'กันชน/สเกิร์ต',
    unit: 'ชิ้น',
    standardPrice: 3900,
    isActive: true,
    source: 'MANUAL',
    usageCount: 42,
    createdAt: '2024-01-12T10:30:00Z',
    updatedAt: '2024-05-09T14:15:00Z',
    vendorPrices: [
      { id: 'vp-019', partNo: '52159-02990', vendorId: 'v-002', brand: 'OEM', price: 3600, lastSeenAt: '2024-05-09T14:15:00Z', isPreferred: true },
      { id: 'vp-020', partNo: '52159-02990', vendorId: 'v-003', brand: 'เทียมไต้หวัน', price: 1900, lastSeenAt: '2024-04-28T09:45:00Z', isPreferred: false }
    ]
  },
  {
    id: 'pm-013',
    partNo: '81560-02A00',
    partName: 'ไฟท้ายซ้าย',
    partNameAlt: ['โคมไฟท้ายซ้าย'],
    category: 'ระบบไฟ',
    unit: 'ดวง',
    standardPrice: 4500,
    isActive: true,
    source: 'AUTO',
    createdFrom: 'clm-010',
    usageCount: 20,
    createdAt: '2024-02-05T14:20:00Z',
    updatedAt: '2024-04-12T11:00:00Z',
    vendorPrices: [
      { id: 'vp-021', partNo: '81560-02A00', vendorId: 'v-001', brand: 'แท้เบิกศูนย์', price: 4500, lastSeenAt: '2024-04-12T11:00:00Z', isPreferred: true }
    ]
  },
  {
    id: 'pm-014',
    partNo: '81150-02E60',
    partName: 'ไฟหน้าซ้าย',
    partNameAlt: ['โคมไฟหน้าซ้าย'],
    category: 'ระบบไฟ',
    unit: 'ดวง',
    standardPrice: 8500,
    isActive: true,
    source: 'AUTO',
    createdFrom: 'clm-011',
    usageCount: 28,
    createdAt: '2024-02-12T09:10:00Z',
    updatedAt: '2024-05-01T15:40:00Z',
    vendorPrices: [
      { id: 'vp-022', partNo: '81150-02E60', vendorId: 'v-002', brand: 'แท้เบิกศูนย์', price: 8500, lastSeenAt: '2024-05-01T15:40:00Z', isPreferred: true },
      { id: 'vp-023', partNo: '81150-02E60', vendorId: 'v-003', brand: 'เทียบ', price: 4200, lastSeenAt: '2024-04-20T10:15:00Z', isPreferred: false }
    ]
  },
  {
    id: 'pm-015',
    partNo: '53812-02170',
    partName: 'แก้มบังโคลนหน้าซ้าย',
    partNameAlt: ['บังโคลนหน้าซ้าย', 'แก้มหน้าซ้าย'],
    category: 'ตัวถังภายนอก',
    unit: 'ชิ้น',
    standardPrice: 2800,
    isActive: true,
    source: 'MANUAL',
    usageCount: 32,
    createdAt: '2024-01-28T13:50:00Z',
    updatedAt: '2024-05-10T12:20:00Z',
    vendorPrices: [
      { id: 'vp-024', partNo: '53812-02170', vendorId: 'v-001', brand: 'OEM', price: 2600, lastSeenAt: '2024-05-10T12:20:00Z', isPreferred: true }
    ]
  }
]
