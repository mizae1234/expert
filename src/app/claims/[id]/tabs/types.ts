// Shared types for claim detail tab components
import { ClaimStatus, PaymentRequest, Quotation, InsuranceInvoice, PurchaseOrder } from '@/lib/types'

export interface ClaimTabProps {
  claim: any
  parts: any[]
  labors: any[]
  setParts: React.Dispatch<React.SetStateAction<any[]>>
  setLabors: React.Dispatch<React.SetStateAction<any[]>>
  supplierInvoices: any[]
  setSupplierInvoices: React.Dispatch<React.SetStateAction<any[]>>
  garageInvoices: any[]
  setGarageInvoices: React.Dispatch<React.SetStateAction<any[]>>
  purchaseOrders: PurchaseOrder[]
  setPurchaseOrders: React.Dispatch<React.SetStateAction<PurchaseOrder[]>>
  insuranceInvoice?: InsuranceInvoice
  setInsuranceInvoice: React.Dispatch<React.SetStateAction<InsuranceInvoice | undefined>>
  quotations: Quotation[]
  setQuotations: React.Dispatch<React.SetStateAction<Quotation[]>>
  editMode: boolean
  partsTotal: number
  laborTotal: number
  subtotal: number
  vat: number
  grand: number
  arReceived: number
  apVendor: number
  grossProfit: number
  margin: number
  showToast: (msg: string) => void
  setErrorModalMsg: (msg: string | null) => void
  setConfirmModal: (val: { title: string, message: string, onConfirm: () => void } | null) => void
  refreshClaim: () => Promise<void>
  vendors: any[]
}
