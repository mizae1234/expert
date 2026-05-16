import { PaymentRequest } from '../types'

export const mockPaymentRequests: PaymentRequest[] = [
  // 4 PENDING_APPROVAL
  {
    id: 'pr-001', requestType: 'AP_VENDOR', claimId: 'claim-009', claimNo: 'CLM-20250009', carPlate: 'ฌฌ 2468',
    supplierInvoiceId: 'sinv-claim-009-1', vendorName: 'บริษัท ไทยออโต้พาร์ท จำกัด',
    amount: 23970, whtAmount: 0, method: 'โอนเงิน', status: 'PENDING_APPROVAL',
    createdBy: 'finance-01', createdAt: '2025-03-25T10:00:00Z',
    billReceipt: {
      id: 'br-001', paymentRequestId: 'pr-001', receivedDate: '2025-03-24T09:00:00Z',
      physicalInvoiceNo: 'SINV-0009', invoiceNoMatched: true, receivedBy: 'สมศรี',
      systemInvoiceNo: 'SINV-0009', poNo: 'PO-0009', claimNo: 'CLM-20250009', amount: 23970,
      createdAt: '2025-03-24T09:00:00Z',
    },
  },
  {
    id: 'pr-002', requestType: 'AP_GARAGE', claimId: 'claim-009', claimNo: 'CLM-20250009', carPlate: 'ฌฌ 2468',
    garageName: 'อู่สยามบอดี้', amount: 10450, whtAmount: 0, method: 'เช็ค', status: 'PENDING_APPROVAL',
    createdBy: 'finance-01', createdAt: '2025-03-25T11:00:00Z',
  },
  {
    id: 'pr-003', requestType: 'AP_VENDOR', claimId: 'claim-010', claimNo: 'CLM-20250010', carPlate: 'ญญ 3579',
    supplierInvoiceId: 'sinv-claim-010-1', vendorName: 'บริษัท ไทยออโต้พาร์ท จำกัด',
    amount: 17425, whtAmount: 0, method: 'โอนเงิน', status: 'PENDING_APPROVAL',
    createdBy: 'finance-02', createdAt: '2025-03-26T09:30:00Z',
    billReceipt: {
      id: 'br-003', paymentRequestId: 'pr-003', receivedDate: '2025-03-25T14:00:00Z',
      physicalInvoiceNo: 'SINV-0010-A', invoiceNoMatched: false, receivedBy: 'วิชัย',
      systemInvoiceNo: 'SINV-0010', poNo: 'PO-0010', claimNo: 'CLM-20250010', amount: 17425,
      createdAt: '2025-03-25T14:00:00Z',
    },
  },
  {
    id: 'pr-004', requestType: 'AR', claimId: 'claim-010', claimNo: 'CLM-20250010', carPlate: 'ญญ 3579',
    insuranceInvoiceId: 'iinv-claim-010', insuranceName: 'ธนชาตประกันภัย',
    amount: 35690, whtAmount: 0, method: 'โอนเงิน', status: 'PENDING_APPROVAL',
    createdBy: 'finance-01', createdAt: '2025-03-26T10:00:00Z',
  },
  // 3 APPROVED
  {
    id: 'pr-005', requestType: 'AP_VENDOR', claimId: 'claim-016', claimNo: 'CLM-20250016', carPlate: 'ดด 1246',
    supplierInvoiceId: 'sinv-claim-016-1', vendorName: 'บริษัท ไทยออโต้พาร์ท จำกัด',
    amount: 28500, whtAmount: 0, method: 'โอนเงิน', status: 'APPROVED',
    approvedBy: 'manager-01', approvedAt: '2025-04-02T14:00:00Z',
    createdBy: 'finance-01', createdAt: '2025-04-01T09:00:00Z',
    billReceipt: {
      id: 'br-005', paymentRequestId: 'pr-005', receivedDate: '2025-03-31T10:00:00Z',
      physicalInvoiceNo: 'SINV-0016', invoiceNoMatched: true, receivedBy: 'สมศรี',
      systemInvoiceNo: 'SINV-0016', poNo: 'PO-0016', claimNo: 'CLM-20250016', amount: 28500,
      createdAt: '2025-03-31T10:00:00Z',
    },
  },
  {
    id: 'pr-006', requestType: 'AP_GARAGE', claimId: 'claim-016', claimNo: 'CLM-20250016', carPlate: 'ดด 1246',
    garageName: 'อู่กิตติ เซอร์วิส', amount: 8200, whtAmount: 0, method: 'โอนเงิน', status: 'APPROVED',
    approvedBy: 'manager-01', approvedAt: '2025-04-02T14:30:00Z',
    createdBy: 'finance-01', createdAt: '2025-04-01T09:30:00Z',
  },
  {
    id: 'pr-007', requestType: 'AR', claimId: 'claim-019', claimNo: 'CLM-20250019', carPlate: 'ถถ 3468',
    insuranceInvoiceId: 'iinv-claim-019', insuranceName: 'กรุงเทพประกันภัย',
    amount: 42150, whtAmount: 0, method: 'โอนเงิน', status: 'APPROVED',
    approvedBy: 'manager-01', approvedAt: '2025-04-05T11:00:00Z',
    createdBy: 'finance-02', createdAt: '2025-04-04T15:00:00Z',
  },
  // 2 REJECTED
  {
    id: 'pr-008', requestType: 'AP_VENDOR', claimId: 'claim-011', claimNo: 'CLM-20250011', carPlate: 'ฎฎ 4680',
    supplierInvoiceId: 'sinv-claim-011-1', vendorName: 'บริษัท อีสเทิร์นพาร์ท จำกัด',
    amount: 15800, whtAmount: 0, method: 'โอนเงิน', status: 'REJECTED',
    rejectReason: 'ยอดไม่ตรงกับ PO ต้องตรวจสอบใหม่', approvedBy: 'manager-01',
    createdBy: 'finance-01', createdAt: '2025-03-28T10:00:00Z',
  },
  {
    id: 'pr-009', requestType: 'AP_GARAGE', claimId: 'claim-012', claimNo: 'CLM-20250012', carPlate: 'ฏฏ 5791',
    garageName: 'อู่สยามบอดี้', amount: 6500, whtAmount: 0, method: 'เช็ค', status: 'REJECTED',
    rejectReason: 'ไม่มีใบแจ้งหนี้อู่แนบ ส่งใหม่พร้อมเอกสาร', approvedBy: 'manager-01',
    createdBy: 'finance-02', createdAt: '2025-03-29T13:00:00Z',
  },
  // 1 PENDING with mismatched bill
  {
    id: 'pr-010', requestType: 'AP_VENDOR', claimId: 'claim-013', claimNo: 'CLM-20250013', carPlate: 'ฐฐ 6802',
    supplierInvoiceId: 'sinv-claim-013-1', vendorName: 'บริษัท ไทยออโต้พาร์ท จำกัด',
    amount: 19200, whtAmount: 0, method: 'โอนเงิน', status: 'PENDING_APPROVAL',
    createdBy: 'finance-01', createdAt: '2025-03-30T10:00:00Z',
    billReceipt: {
      id: 'br-010', paymentRequestId: 'pr-010', receivedDate: '2025-03-29T11:00:00Z',
      physicalInvoiceNo: 'SINV-0013-REV2', invoiceNoMatched: false, receivedBy: 'วิชัย',
      systemInvoiceNo: 'SINV-0013', poNo: 'PO-0013', claimNo: 'CLM-20250013', amount: 19200,
      createdAt: '2025-03-29T11:00:00Z',
    },
  },
]
