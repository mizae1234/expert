"use client"

import { useState, useMemo, useEffect, useRef } from 'react'
import { useParams, useSearchParams, useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { FileText, ArrowLeft, History, Wrench, ShieldAlert, Car, PackageOpen, Tag, CheckCircle2, ChevronRight, Download, Plus, AlertTriangle, TrendingUp, CreditCard, Save, Upload, X, Edit2, Package, Truck, Trash2, CircleDot, Ban, XCircle, Clock, ShoppingCart, Eye } from 'lucide-react'
import { uploadToR2 } from '@/lib/upload'
import { getStatusColor, getStatusLabel, formatCurrency, getPOStatusLabel, cn } from '@/lib/utils'
import { ClaimStatus, PaymentRequest, Quotation, InsuranceInvoice, PurchaseOrder } from '@/lib/types'
import { formatDate } from '@/lib/date'
import { ClaimInfoTab, PnLTab, TimelineTab, PaymentsTab, InsuranceInvoiceTab, ExpensesTab, DocumentsTab } from './tabs'

const STATUS_FLOW: Record<string, string> = {
  RECEIVED: 'PARTS_CHECK',
  PARTS_CHECK: 'PO_ISSUED',
  PO_ISSUED: 'GOODS_RECEIVED',
  GOODS_RECEIVED: 'INVOICE_SENT',
  INVOICE_SENT: 'AP_PAID',
  AP_PAID: 'AR_RECEIVED',
  AR_RECEIVED: 'CLOSED',
}

const STATUS_FLOW_LABEL: Record<string, string> = {
  RECEIVED: 'เริ่มตรวจสอบอะไหล่',
  PARTS_CHECK: 'ออก PO',
  PO_ISSUED: 'รับของแล้ว',
  GOODS_RECEIVED: 'ส่งวางบิลประกัน',
  INVOICE_SENT: 'จ่าย AP แล้ว',
  AP_PAID: 'รับ AR แล้ว',
  AR_RECEIVED: 'ปิด Claim',
}

interface SearchableSelectOption {
  value: string
  label: string
}

function SearchableSelect({
  options,
  value,
  onChange,
  placeholder,
  className
}: {
  options: SearchableSelectOption[]
  value: string
  onChange: (val: string) => void
  placeholder: string
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const selectedOption = options.find(o => o.value === value)

  const filtered = options.filter(o => {
    const s = search.toLowerCase()
    return o.label.toLowerCase().includes(s) || o.value.toLowerCase().includes(s)
  })

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      <button
        type="button"
        onClick={() => {
          setOpen(!open)
          setSearch('')
        }}
        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-left mt-1"
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <span className="text-gray-400 text-xs ml-2">▼</span>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-slate-200 bg-white p-1 text-slate-900 shadow-md outline-none">
          <div className="p-1">
            <input
              type="text"
              placeholder="ค้นหา..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 mb-1"
              autoFocus
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm text-gray-500 outline-none">
                ไม่พบผลลัพธ์
              </div>
            ) : (
              filtered.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value)
                    setOpen(false)
                  }}
                  className={cn(
                    "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-slate-100 text-left",
                    opt.value === value && "bg-slate-100 font-medium"
                  )}
                >
                  {opt.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function ClaimDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const tabParam = searchParams.get('tab') || 'info'
  
  const [loading, setLoading] = useState(true)
  const [originalClaim, setOriginalClaim] = useState<any>(null)
  const [partsMaster, setPartsMaster] = useState<any[]>([])
  
  const [claimStatus, setClaimStatus] = useState<ClaimStatus>('RECEIVED')
  const [editMode, setEditMode] = useState(false)
  const [parts, setParts] = useState<any[]>([])
  const [labors, setLabors] = useState<any[]>([])
  const [supplierInvoices, setSupplierInvoices] = useState<any[]>([])
  const [garageInvoices, setGarageInvoices] = useState<any[]>([])
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [insuranceInvoice, setInsuranceInvoice] = useState<InsuranceInvoice | undefined>()
  const [quotations, setQuotations] = useState<Quotation[]>([])

  const refreshClaim = async () => {
    try {
      const res = await fetch(`/api/claims/${params.id}`)
      const data = await res.json()
      setOriginalClaim(data)
      setClaimStatus(data.status || 'RECEIVED')
      setParts(data.parts || [])
      setLabors(data.labors || [])
      setSupplierInvoices(data.supplierInvoices || [])
      setGarageInvoices(data.garageInvoices || [])
      setPurchaseOrders(data.purchaseOrders || [])
      setInsuranceInvoice(data.insuranceInvoice)
      setQuotations(data.quotations || [])
      setClaimPRs(data.paymentRequests || [])
    } catch (err) {
      console.error('Failed to refresh claim data:', err)
    }
  }

  useEffect(() => {
    Promise.all([
      fetch(`/api/claims/${params.id}`).then(res => res.json()),
      fetch('/api/vendors').then(res => res.json()).catch(() => []),
      fetch('/api/parts-master?all=true').then(res => res.json()).catch(() => []),
    ]).then(([data, vData, pmData]) => {
      setOriginalClaim(data)
      setClaimStatus(data.status || 'RECEIVED')
      setParts(data.parts || [])
      setLabors(data.labors || [])
      setSupplierInvoices(data.supplierInvoices || [])
      setGarageInvoices(data.garageInvoices || [])
      setPurchaseOrders(data.purchaseOrders || [])
      setInsuranceInvoice(data.insuranceInvoice)
      setQuotations(data.quotations || [])
      setClaimPRs(data.paymentRequests || [])
      
      setVendors(vData)
      if (vData.length > 0) {
        setPoVendorId(vData[0].id)
        setPoVendorName(vData[0].name)
      }
      
      if (Array.isArray(pmData)) setPartsMaster(pmData)
      
      setLoading(false)
    }).catch(err => {
      console.error(err)
      setLoading(false)
    })
  }, [params.id])
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showGarageUploadModal, setShowGarageUploadModal] = useState(false)
  const [isUploadingFile, setIsUploadingFile] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<{ name: string, url: string, type: string, file?: File } | null>(null)
  const [uploadedGarageFile, setUploadedGarageFile] = useState<{ name: string, url: string, type: string, file?: File } | null>(null)
  const [uploadMapSelections, setUploadMapSelections] = useState<Record<string, boolean>>({})
  const [uploadItemPrices, setUploadItemPrices] = useState<Record<string, number>>({})
  const [customInvoiceNo, setCustomInvoiceNo] = useState('')
  const [invoiceIncludeVat, setInvoiceIncludeVat] = useState(true)
  const [invoiceVatPct, setInvoiceVatPct] = useState(7)
  const [garageUploadSelections, setGarageUploadSelections] = useState<Record<string, boolean>>({})
  const [showCreatePRModal, setShowCreatePRModal] = useState(false)
  const [prInvoiceSelections, setPrInvoiceSelections] = useState<Record<string, boolean>>({})
  const [prMethod, setPrMethod] = useState('โอนเงิน')
  const [prNote, setPrNote] = useState('')
  const [claimPRs, setClaimPRs] = useState<PaymentRequest[]>([])
  const [vendors, setVendors] = useState<any[]>([])
  const [toast, setToast] = useState<string | null>(null)
  const [showCreateQuotationModal, setShowCreateQuotationModal] = useState(false)
  const [errorModalMsg, setErrorModalMsg] = useState<string | null>(null)
  const [showCreatePOModal, setShowCreatePOModal] = useState(false)
  const [editPOId, setEditPOId] = useState<string | null>(null)
  const [confirmCancelPOId, setConfirmCancelPOId] = useState<string | null>(null)
  const [poModalParts, setPoModalParts] = useState<any[]>([])
  const [poModalLabors, setPoModalLabors] = useState<any[]>([])
  const [poVendorId, setPoVendorId] = useState<string>('')
  const [poVendorName, setPoVendorName] = useState<string>('')
  const [poDeliveryAddress, setPoDeliveryAddress] = useState<string>('')
  const [poManualItems, setPoManualItems] = useState<{ id: string; description: string; quantity: number; unitPrice: number }[]>([])
  const [poIncludeVat, setPoIncludeVat] = useState(true)
  const [poVatPct, setPoVatPct] = useState(7)
  
  const [qtParts, setQtParts] = useState<any[]>([])
  const [qtLabors, setQtLabors] = useState<any[]>([])
  const [qtCustomVat, setQtCustomVat] = useState<string>('')
  const [qtCustomGrand, setQtCustomGrand] = useState<string>('')
  
  const [showSupplementModal, setShowSupplementModal] = useState(false)
  const [confirmModal, setConfirmModal] = useState<{ title: string, message: string, onConfirm: () => void } | null>(null)
  const [showReceiveARModal, setShowReceiveARModal] = useState(false)
  const [pendingPaymentRequest, setPendingPaymentRequest] = useState<{ type: 'AP_VENDOR' | 'AP_GARAGE', invoiceId: string, amount: number } | null>(null)
  const [rejectPRId, setRejectPRId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [selectedQuotationId, setSelectedQuotationId] = useState<string | null>(null)
  const [previewAttachment, setPreviewAttachment] = useState<{ name: string; url: string; type: string } | null>(null)
  const [qtDate, setQtDate] = useState(new Date().toISOString().split('T')[0])
  const [qtValidUntil, setQtValidUntil] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
  const [qtNote, setQtNote] = useState('')
  const [supplementReason, setSupplementReason] = useState('')
  const [arReceiveDate, setArReceiveDate] = useState(new Date().toISOString().split('T')[0])

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500) }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 animate-pulse">
        <p className="text-[#94a3b8]">กำลังโหลดข้อมูล Claim...</p>
      </div>
    )
  }

  if (!originalClaim) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-[#94a3b8]">ไม่พบ Claim</p>
      </div>
    )
  }

  const claim = { ...originalClaim, status: claimStatus, parts, labors, supplierInvoices, garageInvoices, purchaseOrders, insuranceInvoice }
  const { bg, text } = getStatusColor(claim.status)
  const partsTotal = parts.reduce((s, p) => s + p.priceApprove * p.quantity, 0)
  const laborTotal = labors.reduce((s, l) => s + l.priceApprove, 0)
  const subtotal = partsTotal + laborTotal
  const vat = Math.round(subtotal * 0.07 * 100) / 100
  const grand = Math.round((subtotal + vat) * 100) / 100
  const apVendor = claim.supplierInvoices?.reduce((s: number, inv: any) => s + inv.totalAmount, 0) || 0
  const arReceived = claim.insuranceInvoice?.grandTotal || 0
  const grossProfit = arReceived - apVendor
  const margin = arReceived > 0 ? (grossProfit / arReceived) * 100 : 0
  const nextStatus = STATUS_FLOW[claimStatus]
  const nextLabel = STATUS_FLOW_LABEL[claimStatus]

  const globalPoItems = claim.purchaseOrders?.filter((po: any) => po.status !== 'CANCELLED').flatMap((po: any) => po.items.map((item: any) => ({ ...item, poId: po.id, poNo: po.poNo, poStatus: po.status }))) || []
  const getPartAmt = (p: any) => {
    const poi = globalPoItems.find((x: any) => x.partNo === p.partNo)
    return poi ? (poi.unitPrice * (poi.quantity || 1)) : (p.priceApprove * p.quantity)
  }
  const getLaborAmt = (l: any) => {
    const pol = globalPoItems.find((x: any) => x.description?.includes(l.description))
    return pol ? pol.unitPrice : l.priceApprove
  }

  // Shared props for extracted tab components
  const tabProps = {
    claim, parts, labors, setParts, setLabors,
    supplierInvoices, setSupplierInvoices,
    garageInvoices, setGarageInvoices,
    purchaseOrders, setPurchaseOrders,
    insuranceInvoice, setInsuranceInvoice,
    quotations, setQuotations,
    editMode, partsTotal, laborTotal, subtotal, vat, grand,
    arReceived, apVendor, grossProfit, margin,
    showToast, setErrorModalMsg, setConfirmModal, refreshClaim, vendors,
  }

  // ─── Action Handlers ───
  const submitCreatePO = async () => {
    const selectedParts = poModalParts.filter(p => p.selected)
    const selectedLabors = poModalLabors.filter(l => l.selected)
    if (selectedParts.length === 0 && selectedLabors.length === 0 && poManualItems.length === 0) { showToast('กรุณาเลือกรายการอย่างน้อย 1 รายการ'); return }
    const poNo = editPOId ? purchaseOrders.find(p => p.id === editPOId)?.poNo : undefined // let server generate
    
    const partItems = selectedParts.map(p => ({
      partNo: p.partNo,
      description: p.partName,
      quantity: Number(p.quantity) || 1,
      unitPrice: Number(p.priceApprove) || 0,
      totalPrice: (Number(p.priceApprove) || 0) * (Number(p.quantity) || 1)
    }))
    const laborItems = selectedLabors.map(l => ({
      partNo: '',
      description: `[ค่าแรง] ${l.description}`,
      quantity: 1,
      unitPrice: Number(l.priceApprove) || 0,
      totalPrice: Number(l.priceApprove) || 0
    }))
    const manualItems = poManualItems.filter(m => m.description.trim()).map(m => ({
      partNo: '',
      description: m.description,
      quantity: Number(m.quantity) || 1,
      unitPrice: Number(m.unitPrice) || 0,
      totalPrice: (Number(m.unitPrice) || 0) * (Number(m.quantity) || 1)
    }))

    const payload = {
      poNo,
      vendorId: poVendorId,
      deliveryAddress: poDeliveryAddress,
      includeVat: poIncludeVat,
      vatPct: poIncludeVat ? poVatPct : 0,
      items: [...partItems, ...laborItems, ...manualItems]
    }

    try {
      const url = editPOId ? `/api/claims/${claim.id}/pos/${editPOId}` : `/api/claims/${claim.id}/pos`
      const method = editPOId ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Failed to save PO')
      }
      const savedPO = await res.json()
      if (!savedPO.vendor) savedPO.vendor = { id: poVendorId, name: poVendorName }
      
      if (editPOId) {
        setPurchaseOrders(prev => prev.map(p => p.id === editPOId ? savedPO : p))
        showToast(`แก้ไข ${poNo} สำเร็จ`)
      } else {
        setPurchaseOrders(prev => [...prev, savedPO])
        showToast(`สร้าง ${poNo} สำเร็จ (${selectedParts.length} รายการ)`)
      }
      setShowCreatePOModal(false)
    } catch (err: any) {
      setErrorModalMsg(`เกิดข้อผิดพลาดในการ${editPOId ? 'แก้ไข' : 'สร้าง'} PO: ${err.message}`)
    }
  }

  const handleCancelPO = async () => {
    if (!confirmCancelPOId) return
    try {
      const res = await fetch(`/api/claims/${claim.id}/pos/${confirmCancelPOId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' })
      })
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Failed to cancel PO')
      }
      const updatedPO = await res.json()
      setPurchaseOrders(prev => prev.map(p => p.id === confirmCancelPOId ? updatedPO : p))
      showToast('ยกเลิกใบสั่งซื้อสำเร็จ')
      setConfirmCancelPOId(null)
    } catch (err: any) {
      setErrorModalMsg(`เกิดข้อผิดพลาดในการยกเลิก PO: ${err.message}`)
    }
  }

  const handleCreateInsuranceInvoice = async (customData?: {
    laborTotal: number
    partsTotal: number
    subtotal: number
    vatAmount: number
    grandTotal: number
  }) => {
    try {
      const laborTot = customData ? customData.laborTotal : laborTotal
      const partsTot = customData ? customData.partsTotal : partsTotal
      const sub = customData ? customData.subtotal : (laborTot + partsTot)
      const vatAmt = customData ? customData.vatAmount : (Math.round(sub * 0.07 * 100) / 100)
      const grand = customData ? customData.grandTotal : (Math.round((sub + vatAmt) * 100) / 100)

      const res = await fetch(`/api/claims/${claim.id}/insurance-invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          laborTotal: laborTot,
          partsTotal: partsTot,
          subtotal: sub,
          vatAmount: vatAmt,
          grandTotal: grand
        })
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Failed to create insurance invoice')
      }

      const newInv = await res.json()
      setInsuranceInvoice(newInv)
      showToast(`สร้างใบวางบิลประกัน ${newInv.invoiceNo} เรียบร้อยแล้ว`)
    } catch (err: any) {
      setErrorModalMsg(`เกิดข้อผิดพลาด: ${err.message}`)
    }
  }

  const handleDeleteInsuranceInvoice = async () => {
    try {
      const res = await fetch(`/api/claims/${claim.id}/insurance-invoice`, {
        method: 'DELETE'
      })
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Failed to delete insurance invoice')
      }
      setInsuranceInvoice(undefined)
      showToast('ยกเลิกใบวางบิลสำเร็จ คุณสามารถแก้ไขรายการแล้วสร้างใหม่ได้')
    } catch (err: any) {
      setErrorModalMsg(`เกิดข้อผิดพลาดในการยกเลิกใบวางบิล: ${err.message}`)
    }
  }

  const handleCreatePaymentRequest = async (type: 'AP_VENDOR' | 'AP_GARAGE', invoiceId: string, amount: number) => {
    try {
      const res = await fetch(`/api/payment-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestType: type,
          claimId: claim.id,
          supplierInvoiceId: type === 'AP_VENDOR' ? invoiceId : undefined,
          garageInvoiceId: type === 'AP_GARAGE' ? invoiceId : undefined,
          amount,
        })
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Failed to create payment request')
      }

      showToast('สร้างคำขอเบิกจ่ายเงินเรียบร้อย กรุณารอการเงินอนุมัติ')
      await refreshClaim()
    } catch (err: any) {
      setErrorModalMsg(`เกิดข้อผิดพลาดในการสร้างคำขอเบิกเงิน: ${err.message}`)
    }
  }

  const handleCreateQuotation = async () => {
    const qtNo = `QT-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase()}`
    
    const laborTot = qtLabors.filter(l => l.selected).reduce((sum, l) => sum + (Number(l.priceApprove) || 0), 0)
    const partTot = qtParts.filter(p => p.selected).reduce((sum, p) => sum + ((Number(p.priceApprove) || 0) * (Number(p.quantity) || 1)), 0)
    const sub = partTot + laborTot
    const vatAmt = qtCustomVat !== '' ? Number(qtCustomVat) : Math.round(sub * 0.07 * 100) / 100
    const grand = qtCustomGrand !== '' ? Number(qtCustomGrand) : Math.round((sub + vatAmt) * 100) / 100
    
    const payload = {
      quotationNo: qtNo,
      quotationDate: new Date(qtDate).toISOString(),
      validUntil: new Date(qtValidUntil).toISOString(),
      laborItems: qtLabors.filter(l => l.selected).map(l => ({ description: l.description, damageLevel: l.damageLevel, discountPct: l.discountPct, unitPrice: l.priceApprove, totalPrice: l.priceApprove })),
      partItems: qtParts.filter(p => p.selected).map(p => ({ partNo: p.partNo, partName: p.partName, quantity: p.quantity, unitPrice: p.priceApprove, discountPct: p.discountPct, totalPrice: p.priceApprove * p.quantity })),
      laborTotal: laborTot,
      partsTotal: partTot,
      subtotal: sub,
      vatAmount: vatAmt,
      grandTotal: grand,
      note: qtNote || undefined,
      status: 'DRAFT',
      createdBy: 'Admin',
    }

    try {
      const res = await fetch(`/api/claims/${claim.id}/quotations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error('Failed to create quotation')
      const newQt = await res.json()
      setQuotations(prev => [...prev, newQt])
      setShowCreateQuotationModal(false)
      setQtNote('')
      showToast(`สร้างใบเสนอราคา ${qtNo} สำเร็จ`)
    } catch (err) {
      setErrorModalMsg('เกิดข้อผิดพลาดในการสร้างใบเสนอราคา')
    }
  }

  const handleSendQuotation = async (qtId: string) => {
    try {
      const res = await fetch(`/api/claims/${claim.id}/quotations`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: qtId, status: 'SENT' })
      })
      if (res.ok) {
        setQuotations(prev => prev.map(q => q.id === qtId ? { ...q, status: 'SENT' as const } : q))
        showToast('ส่งใบเสนอราคาให้ประกันแล้ว')
      } else {
        // Fallback: update local state even if API doesn't support PUT yet
        setQuotations(prev => prev.map(q => q.id === qtId ? { ...q, status: 'SENT' as const } : q))
        showToast('ส่งใบเสนอราคาให้ประกันแล้ว')
      }
    } catch {
      setQuotations(prev => prev.map(q => q.id === qtId ? { ...q, status: 'SENT' as const } : q))
      showToast('ส่งใบเสนอราคาให้ประกันแล้ว')
    }
  }

  const handleCreateSupplement = async () => {
    if (!selectedQuotationId) return
    const oldQt = quotations.find(q => q.id === selectedQuotationId)
    if (!oldQt) return
    
    // Create new supplement from current parts/labors
    const sub = partsTotal + laborTotal
    const vatAmt = Math.round(sub * 0.07 * 100) / 100
    const supNo = `${oldQt.quotationNo}-S${quotations.filter(q => q.quotationNo.startsWith(oldQt.quotationNo)).length}`
    
    const payload = {
      quotationNo: supNo,
      quotationDate: new Date().toISOString(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      laborItems: labors.map((l, i) => ({ description: l.description, damageLevel: l.damageLevel, discountPct: l.discountPct, unitPrice: l.priceApprove, totalPrice: l.priceApprove })),
      partItems: parts.map((p, i) => ({ partNo: p.partNo, partName: p.partName, quantity: p.quantity, unitPrice: p.priceApprove, discountPct: p.discountPct, totalPrice: p.priceApprove * p.quantity })),
      laborTotal,
      partsTotal,
      subtotal: sub,
      vatAmount: vatAmt,
      grandTotal: Math.round((sub + vatAmt) * 100) / 100,
      note: supplementReason || 'มีรายการซ่อมเพิ่มเติม',
      status: 'DRAFT',
      createdBy: 'Admin'
    }

    try {
      const res = await fetch(`/api/claims/${claim.id}/quotations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error('Failed to create supplement quotation')
      const newQt = await res.json()
      
      // Update old quotation to SUPERSEDED in DB
      await fetch(`/api/claims/${claim.id}/quotations`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedQuotationId, status: 'SUPERSEDED' })
      }).catch(() => {}) // Best effort
      setQuotations(prev => prev.map(q => q.id === selectedQuotationId ? { ...q, status: 'SUPERSEDED' as const } : q).concat(newQt))
      
      setShowSupplementModal(false)
      setSupplementReason('')
      showToast(`สร้าง Supplement ${supNo} สำเร็จ`)
    } catch (err) {
      setErrorModalMsg('เกิดข้อผิดพลาดในการสร้าง Supplement')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Inline Preview Modal for PDF/Image attachments */}
      {previewAttachment && (
        <div className="fixed inset-0 bg-black/70 z-[60] flex flex-col" onClick={() => setPreviewAttachment(null)}>
          <div className="flex items-center justify-between px-4 py-3 bg-[#0f172a]/90 backdrop-blur-sm border-b border-white/10" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-blue-400" />
              <span className="text-white text-sm font-medium truncate max-w-[400px]">{previewAttachment.name}</span>
              <Badge className="border-none text-[10px] bg-white/10 text-white/70">{previewAttachment.type.toUpperCase()}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10 h-8 text-xs" onClick={() => window.open(previewAttachment.url)}>
                <Download className="w-3.5 h-3.5 mr-1" />ดาวน์โหลด
              </Button>
              <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10 h-8 w-8 p-0" onClick={() => setPreviewAttachment(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center p-4 overflow-auto" onClick={e => e.stopPropagation()}>
            {previewAttachment.type === 'pdf' ? (
              <iframe src={previewAttachment.url} className="w-full h-full max-w-5xl rounded-lg border border-white/10 bg-white" style={{ minHeight: 'calc(100vh - 80px)' }} title={previewAttachment.name} />
            ) : (
              <img src={previewAttachment.url} alt={previewAttachment.name} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
            )}
          </div>
        </div>
      )}
      {toast && (
        <div className={`fixed top-6 right-6 text-white px-6 py-3 rounded-xl shadow-2xl z-50 animate-in slide-in-from-top-4 font-medium flex items-center gap-2 ${toast.includes('❌') || toast.includes('⚠️') ? 'bg-red-600' : 'bg-green-600'}`}>
          {!toast.includes('❌') && !toast.includes('⚠️') && !toast.includes('✅') && '✅ '}
          <span>{toast}</span>
        </div>
      )}

      {/* Datalists for Autocomplete */}
      <datalist id="parts-list">
        {partsMaster.filter(p => p.category !== 'LABOR').map(p => <option key={p.partNo} value={p.partName} />)}
      </datalist>
      <datalist id="part-no-list">
        {partsMaster.filter(p => p.category !== 'LABOR').map(p => <option key={p.partNo} value={p.partNo} />)}
      </datalist>
      <datalist id="labors-list">
        {partsMaster.filter(p => p.category === 'LABOR').map(p => <option key={p.partNo} value={p.partName} />)}
      </datalist>
      <datalist id="damage-type-list">
        <option value="เปลี่ยน" />
        <option value="ซ่อม" />
      </datalist>
      <datalist id="damage-level-list">
        <option value="เบา" />
        <option value="ปานกลาง" />
        <option value="หนัก" />
      </datalist>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/claims">
            <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-[#0f172a]">{claim.claimNo}</h1>
              <span className={`status-badge ${bg} ${text}`}>{getStatusLabel(claim.status)}</span>
            </div>
            <p className="text-sm text-[#94a3b8] mt-1">
              {claim.carPlate} — {claim.carBrand} {claim.carModel} — {claim.insuredName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {editMode ? (
            <>
              <Button variant="outline" size="sm" onClick={() => { setParts(originalClaim.parts || []); setLabors(originalClaim.labors || []); setEditMode(false) }}>
                <X className="w-4 h-4 mr-1.5" />ยกเลิก
              </Button>
              <Button size="sm" onClick={async () => { 
                if (parts && Array.isArray(parts)) {
                  const emptyPartIndex = parts.findIndex(p => !p.partName?.trim())
                  if (emptyPartIndex !== -1) {
                    showToast(`❌ กรุณาระบุชื่ออะไหล่ให้ครบทุกรายการ (รายการที่ ${emptyPartIndex + 1})`)
                    return
                  }
                }
                if (labors && Array.isArray(labors)) {
                  const emptyLaborIndex = labors.findIndex(l => !l.description?.trim())
                  if (emptyLaborIndex !== -1) {
                    showToast(`❌ กรุณาระบุชื่อรายการค่าแรงให้ครบทุกรายการ (รายการที่ ${emptyLaborIndex + 1})`)
                    return
                  }
                }

                try {
                  const res = await fetch(`/api/claims/${claim.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      parts,
                      labors,
                      claimNo: claim.claimNo,
                      receiveNo: claim.receiveNo,
                      transactionNo: claim.transactionNo,
                      carPlate: claim.carPlate,
                      province: claim.province,
                      carBrand: claim.carBrand,
                      carModel: claim.carModel,
                      carVin: claim.carVin,
                      insuredName: claim.insuredName,
                      insuranceId: claim.insuranceId,
                      garageId: claim.garageId,
                    })
                  })
                  if (!res.ok) {
                    const errData = await res.json()
                    throw new Error(errData.error || 'Failed to save')
                  }
                  const updatedData = await res.json()
                  setOriginalClaim(updatedData)
                  setParts(updatedData.parts || [])
                  setLabors(updatedData.labors || [])
                  setEditMode(false)
                  showToast('บันทึกข้อมูลเรียบร้อย')
                } catch (err: any) {
                  setErrorModalMsg(err.message || 'เกิดข้อผิดพลาดในการบันทึก')
                }
              }}>
                <Save className="w-4 h-4 mr-1.5" />บันทึก
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>
                <Edit2 className="w-4 h-4 mr-1.5" />แก้ไข
              </Button>
              {nextStatus && (
                <Button size="sm" className="bg-[#1d4ed8] hover:bg-[#1e40af]" onClick={() => setShowStatusModal(true)}>
                  <ChevronRight className="w-4 h-4 mr-1.5" />{nextLabel}
                </Button>
              )}
              {claimStatus !== 'CLOSED' && claimStatus !== 'CANCELLED' && (
                <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50" onClick={() => setConfirmModal({
                  title: 'ยกเลิกใบเคลม',
                  message: `ยืนยันยกเลิกเคลม ${claim.claimNo}? เคลมที่ยกเลิกจะไม่ถูกนับในรายงานรายรับ-รายจ่าย`,
                  onConfirm: async () => {
                    try {
                      await fetch(`/api/claims/${claim.id}/status`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: 'CANCELLED', note: 'ยกเลิกเคลม' })
                      })
                      showToast('ยกเลิกเคลมเรียบร้อยแล้ว')
                      setConfirmModal(null)
                      await refreshClaim()
                    } catch { setErrorModalMsg('เกิดข้อผิดพลาด') }
                  }
                })}>
                  <Ban className="w-4 h-4 mr-1" />ยกเลิกเคลม
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Status Change Modal */}
      {showStatusModal && nextStatus && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate-fade-in" onClick={() => setShowStatusModal(false)}>
          <Card className="w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <CardHeader>
              <CardTitle className="text-lg">เปลี่ยนสถานะ Claim</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center gap-4">
                <div className="text-center">
                  <span className={`status-badge ${getStatusColor(claimStatus).bg} ${getStatusColor(claimStatus).text}`}>{getStatusLabel(claimStatus)}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-[#94a3b8]" />
                <div className="text-center">
                  <span className={`status-badge ${getStatusColor(nextStatus as ClaimStatus).bg} ${getStatusColor(nextStatus as ClaimStatus).text}`}>{getStatusLabel(nextStatus)}</span>
                </div>
              </div>
              <p className="text-sm text-[#475569] text-center">ต้องการเปลี่ยนสถานะเป็น &quot;{getStatusLabel(nextStatus)}&quot; ใช่หรือไม่?</p>
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setShowStatusModal(false)}>ยกเลิก</Button>
                <Button className="bg-[#1d4ed8]" onClick={async () => { 
                  try {
                    await fetch(`/api/claims/${claim.id}/status`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ status: nextStatus as string })
                    })
                    setClaimStatus(nextStatus as ClaimStatus); 
                    setShowStatusModal(false); 
                    showToast(`เปลี่ยนสถานะเป็น "${getStatusLabel(nextStatus)}" แล้ว`) 
                  } catch (err) {
                    setErrorModalMsg('เกิดข้อผิดพลาดในการเปลี่ยนสถานะ')
                  }
                }}>
                  ยืนยัน
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'อะไหล่', value: `${parts.length} ชิ้น`, sub: `฿${formatCurrency(partsTotal)}` },
          { label: 'ค่าแรง', value: `${labors.length} รายการ`, sub: `฿${formatCurrency(laborTotal)}` },
          { label: 'PO', value: `${claim.purchaseOrders?.length || 0} ใบ`, sub: '' },
          { label: 'ยอดรวม', value: `฿${formatCurrency(grand)}`, sub: 'รวม VAT 7%' },
          { label: 'Margin', value: arReceived > 0 ? `${margin.toFixed(1)}%` : 'N/A', sub: arReceived > 0 ? `฿${formatCurrency(grossProfit)}` : '' },
        ].map((stat, i) => (
          <Card key={i} className="bg-white">
            <CardContent className="p-4">
              <p className="text-xs text-[#94a3b8] font-medium">{stat.label}</p>
              <p className="text-lg font-bold text-[#0f172a] mt-1">{stat.value}</p>
              {stat.sub && <p className="text-xs text-[#475569] mt-0.5">{stat.sub}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={tabParam} onValueChange={(v) => router.replace(`${pathname}?tab=${v}`, { scroll: false })} className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="info">ข้อมูล Claim</TabsTrigger>
          <TabsTrigger value="parts">อะไหล่/ค่าแรง</TabsTrigger>
          <TabsTrigger value="po">Purchase Orders</TabsTrigger>
          <TabsTrigger value="supplier-inv">ใบเปิดสินค้า</TabsTrigger>
          <TabsTrigger value="insurance-inv">วางบิลประกัน</TabsTrigger>
          <TabsTrigger value="expenses">ค่าใช้จ่ายเพิ่ม</TabsTrigger>
          <TabsTrigger value="documents">เอกสารแนบ</TabsTrigger>
          <TabsTrigger value="payments">การชำระเงิน</TabsTrigger>
          <TabsTrigger value="pnl">P&L</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        {/* Tab 1: Claim Info */}
        <TabsContent value="info">
          <ClaimInfoTab {...tabProps} />
        </TabsContent>

        {/* Tab 2: Parts & Labor */}
        <TabsContent value="parts">
          <div className="space-y-6">
            {/* Parts */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2"><Package className="w-5 h-5 text-[#1d4ed8]" />อะไหล่ ({parts.length})</CardTitle>
                {editMode && (
                  <Button variant="outline" size="sm" onClick={() => setParts([...parts, { id: `new-p-${Date.now()}`, claimId: claim.id, partNo: '', partName: '', priceFullAmt: 0, quantity: 1, damageType: 'เปลี่ยน', discountPct: 0, priceOffer: 0, priceApprove: 0, supplier: '', requireReturn: false, round: 1, status: 'approved' }])}>
                    <Plus className="w-4 h-4 mr-1" />เพิ่ม
                  </Button>
                )}
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>รหัส</TableHead>
                      <TableHead>ชื่ออะไหล่</TableHead>
                      <TableHead className="text-right">ราคาเต็ม</TableHead>
                      <TableHead className="text-center">จำนวน</TableHead>
                      <TableHead>ประเภท</TableHead>
                      <TableHead className="text-right">ส่วนลด%</TableHead>
                      <TableHead className="text-right">ราคาอนุมัติ</TableHead>
                      <TableHead>ผู้จำหน่าย</TableHead>
                      <TableHead className="text-center">คืนซาก</TableHead>
                      {editMode && <TableHead></TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parts.map((part, idx) => (
                      <TableRow key={part.id}>
                        <TableCell>{editMode ? <Input list="part-no-list" className="h-8 min-w-[120px] font-mono text-xs" value={part.partNo} onChange={e => { const n = [...parts]; n[idx] = { ...n[idx], partNo: e.target.value }; setParts(n) }} /> : <span className="font-mono text-xs">{part.partNo}</span>}</TableCell>
                        <TableCell>{editMode ? <Input list="parts-list" className={cn("h-8 min-w-[200px]", !part.partName?.trim() && "border-red-500 focus-visible:ring-red-500")} value={part.partName} onChange={e => { const n = [...parts]; n[idx] = { ...n[idx], partName: e.target.value }; setParts(n) }} /> : <span className="font-medium">{part.partName}</span>}</TableCell>
                        <TableCell className="text-right">{editMode ? <Input type="number" className="h-8 min-w-[100px] text-right" value={part.priceFullAmt || ''} onChange={e => { const n = [...parts]; n[idx] = { ...n[idx], priceFullAmt: +e.target.value }; setParts(n) }} /> : formatCurrency(part.priceFullAmt)}</TableCell>
                        <TableCell className="text-center">{editMode ? <Input type="number" className="h-8 min-w-[60px] text-center" value={part.quantity || ''} onChange={e => { const n = [...parts]; n[idx] = { ...n[idx], quantity: +e.target.value }; setParts(n) }} /> : part.quantity}</TableCell>
                        <TableCell>{editMode ? <Input list="damage-type-list" className="h-8 min-w-[80px]" value={part.damageType} onChange={e => { const n = [...parts]; n[idx] = { ...n[idx], damageType: e.target.value }; setParts(n) }} /> : <Badge variant="outline" className="text-[10px]">{part.damageType}</Badge>}</TableCell>
                        <TableCell className="text-right">{editMode ? <Input type="number" className="h-8 min-w-[70px] text-right" value={part.discountPct || ''} onChange={e => { const n = [...parts]; n[idx] = { ...n[idx], discountPct: +e.target.value }; setParts(n) }} /> : `${part.discountPct}%`}</TableCell>
                        <TableCell className="text-right">{editMode ? <Input type="number" className="h-8 min-w-[100px] text-right font-semibold" value={part.priceApprove || ''} onChange={e => { const n = [...parts]; n[idx] = { ...n[idx], priceApprove: +e.target.value }; setParts(n) }} /> : <span className="font-semibold">{formatCurrency(part.priceApprove)}</span>}</TableCell>
                        <TableCell>{editMode ? <Input className="h-8 min-w-[120px]" value={part.supplier} onChange={e => { const n = [...parts]; n[idx] = { ...n[idx], supplier: e.target.value }; setParts(n) }} /> : <span className="text-xs text-[#475569]">{part.supplier}</span>}</TableCell>
                        <TableCell className="text-center">
                          {editMode ? (
                            <input type="checkbox" checked={part.requireReturn} onChange={e => { const n = [...parts]; n[idx] = { ...n[idx], requireReturn: e.target.checked }; setParts(n) }} className="w-4 h-4" />
                          ) : part.requireReturn ? (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 text-[10px] font-medium">
                              <AlertTriangle className="w-3 h-3" />คืนซาก
                            </span>
                          ) : null}
                        </TableCell>
                        {editMode && (
                          <TableCell>
                            <button onClick={() => setParts(parts.filter((_, i) => i !== idx))} className="text-gray-400 hover:text-red-500">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Labors */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2"><Wrench className="w-5 h-5 text-[#1d4ed8]" />ค่าแรง ({labors.length})</CardTitle>
                {editMode && (
                  <Button variant="outline" size="sm" onClick={() => setLabors([...labors, { id: `new-l-${Date.now()}`, claimId: claim.id, description: '', damageLevel: 'ปานกลาง', discountPct: 0, priceOffer: 0, priceApprove: 0, round: 1, status: 'approved' }])}>
                    <Plus className="w-4 h-4 mr-1" />เพิ่ม
                  </Button>
                )}
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>รายการ</TableHead>
                      <TableHead>ระดับ</TableHead>
                      <TableHead className="text-right">ส่วนลด%</TableHead>
                      <TableHead className="text-right">ราคาเสนอ</TableHead>
                      <TableHead className="text-right">ราคาอนุมัติ</TableHead>
                      {editMode && <TableHead></TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {labors.map((labor, idx) => (
                      <TableRow key={labor.id}>
                        <TableCell>{editMode ? <Input list="labors-list" className={cn("h-8 min-w-[200px]", !labor.description?.trim() && "border-red-500 focus-visible:ring-red-500")} value={labor.description} onChange={e => { const n = [...labors]; n[idx] = { ...n[idx], description: e.target.value }; setLabors(n) }} /> : <span className="font-medium">{labor.description}</span>}</TableCell>
                        <TableCell>{editMode ? <Input list="damage-level-list" className="h-8 min-w-[100px]" value={labor.damageLevel} onChange={e => { const n = [...labors]; n[idx] = { ...n[idx], damageLevel: e.target.value }; setLabors(n) }} /> : <Badge variant="outline" className="text-[10px]">{labor.damageLevel}</Badge>}</TableCell>
                        <TableCell className="text-right">{editMode ? <Input type="number" className="h-8 min-w-[70px] text-right" value={labor.discountPct || ''} onChange={e => { const n = [...labors]; n[idx] = { ...n[idx], discountPct: +e.target.value }; setLabors(n) }} /> : `${labor.discountPct}%`}</TableCell>
                        <TableCell className="text-right">{editMode ? <Input type="number" className="h-8 min-w-[100px] text-right" value={labor.priceOffer || ''} onChange={e => { const n = [...labors]; n[idx] = { ...n[idx], priceOffer: +e.target.value }; setLabors(n) }} /> : formatCurrency(labor.priceOffer)}</TableCell>
                        <TableCell className="text-right">{editMode ? <Input type="number" className="h-8 min-w-[100px] text-right font-semibold" value={labor.priceApprove || ''} onChange={e => { const n = [...labors]; n[idx] = { ...n[idx], priceApprove: +e.target.value }; setLabors(n) }} /> : <span className="font-semibold">{formatCurrency(labor.priceApprove)}</span>}</TableCell>
                        {editMode && (
                          <TableCell>
                            <button onClick={() => setLabors(labors.filter((_, i) => i !== idx))} className="text-gray-400 hover:text-red-500">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* ─── Quotation Section ─── */}
          <Card className="mt-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2"><FileText className="w-5 h-5 text-[#1d4ed8]" />ใบเสนอราคา (Quotation)</CardTitle>
              <Button size="sm" className="bg-[#1d4ed8]" onClick={() => {
                setQtParts(parts.map(p => ({ ...p, selected: true })))
                setQtLabors(labors.map(l => ({ ...l, selected: true })))
                setQtCustomVat('')
                setQtCustomGrand('')
                setShowCreateQuotationModal(true)
              }}>
                <Plus className="w-4 h-4 mr-1" />ออกใบเสนอราคา
              </Button>
            </CardHeader>
            <CardContent>
              {quotations.length === 0 ? (
                <div className="text-center py-8 text-[#94a3b8]">
                  <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">ยังไม่มีใบเสนอราคา</p>
                  <p className="text-xs mt-1">กดปุ่มด้านบนเพื่อสร้างจากรายการอะไหล่/ค่าแรง</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {quotations.map(qt => {
                    const statusMap: Record<string, { bg: string; label: string }> = {
                      DRAFT: { bg: 'bg-gray-100 text-gray-600', label: 'กำลังร่าง' },
                      SENT: { bg: 'bg-blue-100 text-blue-700', label: 'ส่งให้ประกันแล้ว' },
                      APPROVED: { bg: 'bg-green-100 text-green-700', label: 'อนุมัติแล้ว ✅' },
                      REJECTED: { bg: 'bg-red-100 text-red-700', label: 'ถูกปฏิเสธ' },
                      SUPERSEDED: { bg: 'bg-amber-100 text-amber-700', label: 'มี Supplement แล้ว' },
                    }
                    const s = statusMap[qt.status] || statusMap.DRAFT
                    return (
                      <div key={qt.id} className={`border rounded-lg p-4 ${qt.status === 'APPROVED' ? 'border-green-200 bg-green-50/30' : qt.status === 'SUPERSEDED' ? 'border-amber-200 bg-amber-50/30 opacity-60' : 'border-gray-200'}`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold text-[#1d4ed8]">{qt.quotationNo}</span>
                            <Badge className={`border-none text-[10px] ${s.bg}`}>{s.label}</Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            {qt.status === 'APPROVED' && (
                              <Button variant="outline" size="sm" className="h-7 text-xs border-amber-200 text-amber-700 hover:bg-amber-50" onClick={() => { setSelectedQuotationId(qt.id); setShowSupplementModal(true); }}>
                                <Plus className="w-3 h-3 mr-1" />Supplement
                              </Button>
                            )}
                            {qt.status === 'DRAFT' && (
                              <Button variant="outline" size="sm" className="h-7 text-xs text-blue-600 border-blue-200" onClick={() => handleSendQuotation(qt.id)}>ส่งให้ประกัน</Button>
                            )}
                            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => window.open(`/claims/${claim.id}/pdf/quotation?qtId=${qt.id}`)}><Download className="w-3 h-3 mr-1" />PDF</Button>
                            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => window.open(`/api/claims/${claim.id}/peak-export?template=ar-invoice&qtId=${qt.id}`)}><Download className="w-3 h-3 mr-1" />PEAK</Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div><span className="text-[#94a3b8] text-xs">วันที่</span><p className="font-medium">{formatDate(qt.quotationDate)}</p></div>
                          <div><span className="text-[#94a3b8] text-xs">หมดอายุ</span><p className="font-medium">{formatDate(qt.validUntil)}</p></div>
                          <div><span className="text-[#94a3b8] text-xs">ค่าแรง ({qt.laborItems.length} รายการ)</span><p className="font-medium">฿{formatCurrency(qt.laborTotal)}</p></div>
                          <div><span className="text-[#94a3b8] text-xs">อะไหล่ ({qt.partItems.length} รายการ)</span><p className="font-medium">฿{formatCurrency(qt.partsTotal)}</p></div>
                        </div>
                        <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                          <div className="text-sm text-[#475569]">
                            {qt.approvedBy && <span>อนุมัติโดย: <strong>{qt.approvedBy}</strong></span>}
                          </div>
                          <span className="text-base font-bold text-[#1d4ed8]">฿{formatCurrency(qt.grandTotal)}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Purchase Orders */}
        <TabsContent value="po">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Purchase Orders</CardTitle>
              <Button variant="outline" size="sm" onClick={() => {
                setEditPOId(null)
                setPoDeliveryAddress(claim.garage?.name ? `${claim.garage.name}\n${claim.garage.address || ''} ${claim.garage.province || ''}`.trim() : '')
                setPoModalParts(parts.map(p => ({ ...p, selected: p.status === 'approved' })))
                setPoModalLabors(labors.map(l => ({ ...l, selected: false })))
                setPoManualItems([])
                setPoIncludeVat(true)
                setPoVatPct(7)
                setShowCreatePOModal(true)
              }}>
                <Plus className="w-4 h-4 mr-1" />สร้าง PO
              </Button>
            </CardHeader>
            <CardContent>
              {(claim.purchaseOrders?.length || 0) === 0 ? (
                <div className="text-center py-12 text-[#94a3b8]">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>ยังไม่มี PO</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {[...(claim.purchaseOrders || [])].sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()).map((po: any) => (
                    <Card key={po.id} className="border border-gray-100">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <h4 className="font-semibold text-[#0f172a]">{po.poNo}</h4>
                            <Badge variant="outline" className="text-[10px]">{po.poType}</Badge>
                            <Badge className={po.status === 'RECEIVED' ? 'bg-green-100 text-green-700' : po.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}>
                              {po.status === 'CANCELLED' ? 'ยกเลิก' : getPOStatusLabel(po.status)}
                            </Badge>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-lg font-bold text-[#0f172a]">฿{formatCurrency(po.totalAmount)}</span>
                            <span className="text-[10px] text-gray-500">(รวม VAT 7% แล้ว)</span>
                          </div>
                          <div className="flex items-center gap-4">
                            {po.status === 'DRAFT' && (
                              <div className="flex items-center gap-1 border-l pl-4 border-gray-200">
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:text-blue-600" onClick={() => {
                                  setEditPOId(po.id)
                                  setPoVendorId(po.vendorId)
                                  setPoVendorName(po.vendor?.name || '')
                                  setPoDeliveryAddress(po.deliveryAddress || '')
                                  setPoModalParts(parts.map((p: any) => {
                                    const existingPoItem = po.items.find((pi: any) => pi.partNo === p.partNo || pi.description === p.partName)
                                    if (existingPoItem) {
                                      return { ...p, selected: true, partName: existingPoItem.description, quantity: existingPoItem.quantity, priceApprove: existingPoItem.unitPrice }
                                    }
                                    return { ...p, selected: false }
                                  }))
                                  setPoModalLabors(labors.map((l: any) => {
                                    const existingPoItem = po.items.find((pi: any) => pi.description === `[ค่าแรง] ${l.description}`)
                                    if (existingPoItem) {
                                      return { ...l, selected: true, description: existingPoItem.description.replace('[ค่าแรง] ', ''), priceApprove: existingPoItem.unitPrice }
                                    }
                                    return { ...l, selected: false }
                                  }))
                                  setPoManualItems([])
                                  setPoIncludeVat(true)
                                  setPoVatPct(7)
                                  setShowCreatePOModal(true)
                                }}>
                                  <Edit2 className="w-3.5 h-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:text-red-600" onClick={() => setConfirmCancelPOId(po.id)}>
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            )}
                            {po.status !== 'DRAFT' && po.status !== 'CANCELLED' && (
                              <div className="flex items-center gap-1 border-l pl-4 border-gray-200">
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:text-red-600" onClick={() => setConfirmCancelPOId(po.id)}>
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-sm text-[#475569] flex items-center gap-4">
                          <span>Vendor: {po.vendor?.name}</span>
                          <span>•</span>
                          <span>{po.items.length} รายการ</span>
                          {po.goodsReceipt && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1 text-green-600">
                                <CheckCircle2 className="w-3.5 h-3.5" />รับของแล้ว
                              </span>
                            </>
                          )}
                        </div>
                        {po.status !== 'CANCELLED' && (
                          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                            {po.status === 'DRAFT' && (
                              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-xs h-7" onClick={async () => {
                                try {
                                  const res = await fetch(`/api/claims/${claim.id}/pos/${po.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'SENT' }) })
                                  if (!res.ok) throw new Error()
                                  const updated = await res.json()
                                  setPurchaseOrders(prev => prev.map(p => p.id === po.id ? updated : p))
                                  showToast(`${po.poNo} อนุมัติแล้ว`)
                                } catch { setErrorModalMsg('เกิดข้อผิดพลาด') }
                              }}>
                                <CheckCircle2 className="w-3 h-3 mr-1" />อนุมัติ / ส่ง PO
                              </Button>
                            )}
                            {po.status === 'SENT' && (
                              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-xs h-7" onClick={async () => {
                                try {
                                  const res = await fetch(`/api/claims/${claim.id}/pos/${po.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'RECEIVED' }) })
                                  if (!res.ok) throw new Error()
                                  const updated = await res.json()
                                  setPurchaseOrders(prev => prev.map(p => p.id === po.id ? updated : p))
                                  showToast(`${po.poNo} รับอะไหล่แล้ว`)
                                } catch { setErrorModalMsg('เกิดข้อผิดพลาด') }
                              }}>
                                <Package className="w-3 h-3 mr-1" />รับอะไหล่แล้ว
                              </Button>
                            )}
                            <Link href={`/claims/${claim.id}/pdf/purchase-order?poId=${po.id}`} target="_blank">
                              <Button variant="outline" size="sm" className="text-xs h-7">
                                <Download className="w-3 h-3 mr-1" />ดาวน์โหลด PO
                              </Button>
                            </Link>
                            <Link href={`/claims/${claim.id}/pdf/delivery-note?poId=${po.id}`} target="_blank">
                              <Button variant="outline" size="sm" className="text-xs h-7">
                                <Truck className="w-3 h-3 mr-1" />ใบส่งของ
                              </Button>
                            </Link>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Supplier Invoices + Payment Readiness */}
        <TabsContent value="supplier-inv">
          <div className="space-y-6">
            {(() => {
              const poItems = globalPoItems
              const allInvItems = supplierInvoices.flatMap((inv: any) => inv.items || [])
              const allGInvItems = garageInvoices.flatMap((gi: any) => gi.items || [])
              const totalApproved = parts.reduce((s: number, p: any) => s + getPartAmt(p), 0) + labors.reduce((s: number, l: any) => s + getLaborAmt(l), 0)
              const totalInvoiced = parts.filter(p => p.paymentStatus === 'INVOICED' || p.paymentStatus === 'PAID').reduce((s, p) => s + getPartAmt(p), 0) + labors.filter(l => l.paymentStatus === 'INVOICED' || l.paymentStatus === 'PAID').reduce((s, l) => s + getLaborAmt(l), 0)
              const totalPaid = parts.filter(p => p.paymentStatus === 'PAID').reduce((s, p) => s + getPartAmt(p), 0) + labors.filter(l => l.paymentStatus === 'PAID').reduce((s, l) => s + getLaborAmt(l), 0)
              const totalPending = totalApproved - totalInvoiced
              return (<>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Card className="bg-blue-50"><CardContent className="p-3 text-center"><p className="text-xs text-[#475569]">ยอดอนุมัติทั้งหมด</p><p className="text-lg font-bold text-[#0f172a]">฿{formatCurrency(totalApproved)}</p></CardContent></Card>
                  <Card className="bg-green-50"><CardContent className="p-3 text-center"><p className="text-xs text-[#475569]">มี Invoice แล้ว</p><p className="text-lg font-bold text-green-700">฿{formatCurrency(totalInvoiced)}</p></CardContent></Card>
                  <Card className="bg-amber-50"><CardContent className="p-3 text-center"><p className="text-xs text-[#475569]">รอ Invoice</p><p className="text-lg font-bold text-amber-600">฿{formatCurrency(totalPending)}</p></CardContent></Card>
                  <Card className="bg-purple-50"><CardContent className="p-3 text-center"><p className="text-xs text-[#475569]">จ่ายแล้ว</p><p className="text-lg font-bold text-purple-700">฿{formatCurrency(totalPaid)}</p></CardContent></Card>
                </div>
                {/* Combined Parts and Labors Table */}
                <Card><CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">รายการอะไหล่และค่าแรง</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => {
                    const sel: Record<string, boolean> = {}
                    const prices: Record<string, number> = {}
                    parts.filter(p => p.paymentStatus !== 'INVOICED' && p.paymentStatus !== 'PAID').forEach(p => { sel[p.id] = true; prices[p.id] = getPartAmt(p) })
                    labors.filter(l => l.paymentStatus !== 'INVOICED' && l.paymentStatus !== 'PAID').forEach(l => { sel[l.id] = true; prices[l.id] = getLaborAmt(l) })
                    setUploadMapSelections(sel); setUploadItemPrices(prices); setInvoiceIncludeVat(true); setInvoiceVatPct(7); setCustomInvoiceNo(''); setShowUploadModal(true)
                  }}><Upload className="w-4 h-4 mr-1" />อัพโหลด Invoice</Button>
                </CardHeader><CardContent>
                  <Table><TableHeader><TableRow className="bg-[#f8faff]">
                    <TableHead>ประเภท</TableHead><TableHead>รายการ</TableHead><TableHead className="text-right">ยอดอนุมัติ</TableHead><TableHead className="text-right">ยอด PO</TableHead><TableHead className="text-center">PO / เอกสารอ้างอิง</TableHead><TableHead className="text-center">Invoice</TableHead><TableHead className="text-center">สถานะ</TableHead>
                  </TableRow></TableHeader><TableBody>
                    {parts.map(p => {
                      const poi = poItems.find((x: any) => x.partNo === p.partNo)
                      const inv = allInvItems.find((x: any) => x.claimPartId === p.id)
                      const invDoc = inv ? supplierInvoices.find((si: any) => si.items?.some((i: any) => i.id === inv.id)) : null
                      return (<TableRow key={p.id} className={p.paymentStatus === 'PAID' ? 'bg-green-50/30' : ''}>
                        <TableCell><Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700">อะไหล่</Badge></TableCell>
                        <TableCell><span className="font-medium">{p.partName}</span><span className="text-xs text-[#94a3b8] ml-2">{p.partNo}</span></TableCell>
                        <TableCell className="text-right text-sm text-[#94a3b8]">฿{formatCurrency(p.priceApprove)}</TableCell>
                        <TableCell className="text-right font-semibold">{poi ? `฿${formatCurrency(poi.unitPrice * poi.quantity)}` : <span className="text-xs text-[#94a3b8]">—</span>}</TableCell>
                        <TableCell className="text-center">{poi ? <span className={`text-xs flex items-center justify-center gap-0.5 ${poi.poStatus === 'RECEIVED' ? 'text-green-600' : 'text-blue-600'}`}><CheckCircle2 className="w-3.5 h-3.5" />{poi.poNo}</span> : <span className="text-xs text-[#94a3b8]">—</span>}</TableCell>
                        <TableCell className="text-center">{invDoc ? <span className="text-xs text-green-600 flex items-center justify-center gap-0.5"><CheckCircle2 className="w-3.5 h-3.5" />{invDoc.invoiceNo}</span> : <span className="text-xs text-amber-500">⏳ รอ</span>}</TableCell>
                        <TableCell className="text-center"><Badge className={`border-none text-[10px] ${p.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' : p.paymentStatus === 'INVOICED' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>{p.paymentStatus === 'PAID' ? 'จ่ายแล้ว' : p.paymentStatus === 'INVOICED' ? 'มี Invoice' : 'รอ Invoice'}</Badge></TableCell>
                      </TableRow>)
                    })}
                    {labors.map(l => {
                      // Check garage invoices (old) AND supplier invoices (unified) for labor
                      const gItem = allGInvItems.find((gi: any) => gi.claimLaborId === l.id)
                      const gDoc = gItem ? garageInvoices.find((g: any) => g.items?.some((i: any) => i.id === gItem.id)) : null
                      // Also check supplier invoices for unified invoices containing labors
                      const sItem = !gDoc ? allInvItems.find((si: any) => si.claimLaborId === l.id || (si.description && si.description.includes(l.description))) : null
                      const sDoc = sItem ? supplierInvoices.find((si: any) => si.items?.some((i: any) => i.id === sItem.id)) : null
                      const invoiceDoc = gDoc || sDoc
                      // Check if labor is in a PO
                      const poLabor = poItems.find((x: any) => x.description?.includes(l.description))
                      return (<TableRow key={l.id} className={l.paymentStatus === 'PAID' ? 'bg-green-50/30' : ''}>
                        <TableCell><Badge variant="outline" className="text-[10px] bg-orange-50 text-orange-700">ค่าแรง</Badge></TableCell>
                        <TableCell className="font-medium">{l.description}</TableCell>
                        <TableCell className="text-right text-sm text-[#94a3b8]">฿{formatCurrency(l.priceApprove)}</TableCell>
                        <TableCell className="text-right font-semibold">{poLabor ? `฿${formatCurrency(poLabor.unitPrice * (poLabor.quantity || 1))}` : <span className="text-xs text-[#94a3b8]">—</span>}</TableCell>
                        <TableCell className="text-center">{poLabor ? <span className="text-xs text-blue-600 flex items-center justify-center gap-0.5"><CheckCircle2 className="w-3.5 h-3.5" />{poLabor.poNo}</span> : <span className="text-xs text-[#94a3b8]">—</span>}</TableCell>
                        <TableCell className="text-center">{invoiceDoc ? <span className="text-xs text-green-600 flex items-center justify-center gap-0.5"><CheckCircle2 className="w-3.5 h-3.5" />{invoiceDoc.invoiceNo}</span> : <span className="text-xs text-amber-500">⏳ รอ</span>}</TableCell>
                        <TableCell className="text-center"><Badge className={`border-none text-[10px] ${l.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' : l.paymentStatus === 'INVOICED' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>{l.paymentStatus === 'PAID' ? 'จ่ายแล้ว' : l.paymentStatus === 'INVOICED' ? 'มี Invoice' : 'รอ Invoice'}</Badge></TableCell>
                      </TableRow>)
                    })}
                  </TableBody></Table>
                </CardContent></Card>
                {/* Attachments Section */}
                {(() => {
                  const getCleanName = (url: string) => {
                    const rawName = url.split('/').pop() || 'เอกสาร'
                    return rawName.includes('_') ? rawName.substring(rawName.indexOf('_') + 1) : rawName
                  }
                  const allAttachments = [
                    ...supplierInvoices.filter((si: any) => si.attachmentUrl || si.pdfUrl).map((si: any) => ({ id: si.id, name: si.attachmentName || (si.pdfUrl ? getCleanName(si.pdfUrl) : 'เอกสาร'), url: si.attachmentUrl || si.pdfUrl || null, invoiceNo: si.invoiceNo, type: 'Supplier Invoice' })),
                    ...garageInvoices.filter((gi: any) => gi.attachmentUrl || gi.pdfUrl).map((gi: any) => ({ id: gi.id, name: gi.attachmentName || (gi.pdfUrl ? getCleanName(gi.pdfUrl) : 'เอกสาร'), url: gi.attachmentUrl || gi.pdfUrl || null, invoiceNo: gi.invoiceNo, type: 'Garage Invoice' }))
                  ]
                  return (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2"><FileText className="w-5 h-5 text-purple-500" />เอกสารแนบ</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {allAttachments.length === 0 ? (
                          <div className="text-center py-6 text-[#94a3b8]">
                            <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                            <p className="text-sm">ยังไม่มีเอกสารแนบ</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {allAttachments.map((att, i) => {
                              const isPdf = att.name.toLowerCase().endsWith('.pdf') || att.url?.toLowerCase().includes('.pdf')
                              const isImage = att.name.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/i) || att.url?.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)/i)
                              const isExcel = att.name.toLowerCase().match(/\.(xls|xlsx)$/i) || att.url?.toLowerCase().match(/\.(xls|xlsx)/i)
                              const isValid = !!att.url
                              return (
                                <div key={att.id + '-' + i} className="bg-[#f8faff] rounded-lg border border-gray-100 overflow-hidden">
                                  {/* Header */}
                                  <div className="flex items-center justify-between p-3">
                                    <div className="flex items-center gap-3">
                                      <div className={`w-8 h-8 rounded flex items-center justify-center ${isPdf ? 'bg-red-50' : isImage ? 'bg-blue-50' : isExcel ? 'bg-green-50' : 'bg-gray-50'}`}>
                                        <FileText className={`w-4 h-4 ${isPdf ? 'text-red-500' : isImage ? 'text-blue-500' : isExcel ? 'text-green-600' : 'text-gray-500'}`} />
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium text-[#0f172a]">{att.name}</p>
                                        <p className="text-xs text-[#94a3b8]">{att.type} • {att.invoiceNo}</p>
                                      </div>
                                    </div>
                                    {isValid && (
                                      <Button variant="outline" size="sm" className="h-7 text-xs text-purple-600 border-purple-200" onClick={() => window.open(att.url, '_blank')}>
                                        <Download className="w-3 h-3 mr-1" />ดาวน์โหลด
                                      </Button>
                                    )}
                                  </div>
                                  {/* Inline Preview */}
                                  {isValid && isPdf && (
                                    <div className="px-3 pb-3">
                                      <iframe src={att.url} className="w-full rounded-lg border border-gray-200 bg-white" style={{ height: '500px' }} title={att.name} />
                                    </div>
                                  )}
                                  {isValid && isImage && (
                                    <div className="px-3 pb-3">
                                      <img src={att.url} alt={att.name} className="w-full rounded-lg border border-gray-200 object-contain max-h-[500px] bg-white" />
                                    </div>
                                  )}
                                  {isValid && isExcel && (
                                    <div className="px-3 pb-3">
                                      <div className="p-3 bg-green-50 border border-green-100 rounded-lg flex items-center justify-between">
                                        <span className="text-xs text-green-700 font-medium">ไฟล์ Excel (ดาวน์โหลดเพื่อเปิดดู)</span>
                                        <Button size="sm" className="h-6 bg-green-600 hover:bg-green-700 text-[10px] text-white" onClick={() => window.open(att.url, '_blank')}>
                                          <Download className="w-3 h-3 mr-1" />ดาวน์โหลด Excel
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })()}

                {/* ─── ใบแจ้งหนี้ & ขอเบิกเงิน ─── */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2"><CreditCard className="w-5 h-5 text-[#1d4ed8]" />ใบแจ้งหนี้ / ขอเบิกจ่ายเงิน</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {(() => {
                        const allInvoices = [
                          ...supplierInvoices.map((si: any) => ({ ...si, _type: 'SUPPLIER', name: si.vendor?.name || 'Vendor' })),
                          ...garageInvoices.map((gi: any) => ({ ...gi, _type: 'GARAGE', name: gi.garage?.name || 'อู่' }))
                        ].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())

                        if (allInvoices.length === 0) {
                          return <p className="text-sm text-[#94a3b8] text-center py-3">ยังไม่มีใบแจ้งหนี้</p>
                        }

                        return allInvoices.map(inv => {
                          const pr = claim.paymentRequests?.find((p: any) => p.supplierInvoiceId === inv.id || p.garageInvoiceId === inv.id)
                          const hasParts = inv.items?.some((i: any) => i.claimPartId)
                          const hasLabors = inv.items?.some((i: any) => i.claimLaborId || i.description?.startsWith('[ค่าแรง]'))
                          const typeLabel = hasParts && hasLabors ? 'อะไหล่+ค่าแรง' : inv._type === 'SUPPLIER' ? 'อะไหล่' : 'ค่าแรง'
                          const badgeColor = hasParts && hasLabors ? 'bg-purple-50 text-purple-700' : inv._type === 'SUPPLIER' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'
                          return (
                            <div key={inv.id} className="p-3 bg-[#f8faff] rounded-lg border border-gray-100 hover:border-[#1d4ed8]/30 transition-colors">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className={`text-[10px] ${badgeColor}`}>{typeLabel}</Badge>
                                    <span className="text-sm font-medium">{inv.invoiceNo}</span>
                                  </div>
                                  <div className="text-xs text-[#94a3b8] mt-1">{inv.name} • {inv.items?.length || 0} รายการ</div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                  <span className="font-semibold text-sm">฿{formatCurrency(inv.totalAmount)}</span>
                                  <Badge className={`border-none text-[10px] ${inv.apPayment ? 'bg-green-100 text-green-700' : pr?.status === 'APPROVED' ? 'bg-green-100 text-green-700' : pr?.status === 'PENDING_APPROVAL' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{inv.apPayment ? 'จ่ายแล้ว' : pr?.status === 'APPROVED' ? 'อนุมัติแล้ว' : pr?.status === 'PENDING_APPROVAL' ? 'รออนุมัติ' : 'รอเบิกจ่าย'}</Badge>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
                                {!pr && !inv.apPayment && (
                                  <Button variant="outline" size="sm" className="h-7 text-xs text-[#1d4ed8] border-[#1d4ed8] hover:bg-blue-50" onClick={() => setPendingPaymentRequest({ type: inv._type === 'SUPPLIER' ? 'AP_VENDOR' : 'AP_GARAGE', invoiceId: inv.id, amount: inv.totalAmount })}><CreditCard className="w-3 h-3 mr-1" />ขอเบิกเงิน</Button>
                                )}
                                {pr?.status === 'REJECTED' && (
                                  <Badge className="border-none text-[10px] bg-red-100 text-red-700">ถูกปฏิเสธ: {pr.rejectReason}</Badge>
                                )}
                                {!inv.apPayment && !pr && (
                                  <Button variant="outline" size="sm" className="h-7 text-xs text-red-500 border-red-200 hover:bg-red-50" onClick={() => {
                                    setConfirmModal({
                                      title: `ลบ Invoice "${inv.invoiceNo}"`,
                                      message: 'รายการที่เกี่ยวข้องจะถูก reset กลับเป็น "รอ Invoice"',
                                      onConfirm: async () => {
                                        try {
                                          const endpoint = inv._type === 'SUPPLIER' ? 'supplier-invoices' : 'garage-invoices'
                                          const res = await fetch(`/api/claims/${claim.id}/${endpoint}?invoiceId=${inv.id}`, { method: 'DELETE' })
                                          if (!res.ok) throw new Error('ลบไม่สำเร็จ')
                                          showToast(`ลบ ${inv.invoiceNo} เรียบร้อย`)
                                          await refreshClaim()
                                        } catch (err: any) {
                                          setErrorModalMsg(err.message)
                                        }
                                      }
                                    })
                                  }}><Trash2 className="w-3 h-3 mr-1" />ลบ Invoice</Button>
                                )}
                              </div>
                              {/* Inline Preview for Invoice Attachment */}
                              {(() => {
                                const u = inv.attachmentUrl || inv.pdfUrl
                                if (!u) return null
                                const name = inv.attachmentName || u.split('/').pop() || 'เอกสาร'
                                const isPdf = name.toLowerCase().endsWith('.pdf') || u.toLowerCase().includes('.pdf')
                                const isImage = name.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/i) || u.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)/i)
                                const isExcel = name.toLowerCase().match(/\.(xls|xlsx)$/i) || u.toLowerCase().match(/\.(xls|xlsx)/i)
                                
                                return (
                                  <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs text-[#475569] font-medium flex items-center gap-1">
                                        <FileText className="w-3.5 h-3.5 text-blue-500" /> {name}
                                      </span>
                                      <Button variant="ghost" size="sm" className="h-6 px-2 text-[11px] text-[#1d4ed8]" onClick={() => window.open(u, '_blank')}>
                                        <Download className="w-3 h-3 mr-1" />ดาวน์โหลด
                                      </Button>
                                    </div>
                                    {isPdf && (
                                      <div className="rounded-lg overflow-hidden border border-gray-200 bg-white">
                                        <iframe src={u} className="w-full" style={{ height: '350px' }} title={name} />
                                      </div>
                                    )}
                                    {isImage && (
                                      <div className="rounded-lg overflow-hidden border border-gray-200 bg-white">
                                        <img src={u} alt={name} className="w-full object-contain max-h-[350px]" />
                                      </div>
                                    )}
                                    {isExcel && (
                                      <div className="p-3 bg-green-50 border border-green-100 rounded-lg flex items-center justify-between">
                                        <span className="text-xs text-green-700 font-medium">ไฟล์ Excel (ดาวน์โหลดเพื่อเปิดดู)</span>
                                        <Button size="sm" className="h-6 bg-green-600 hover:bg-green-700 text-[10px] text-white" onClick={() => window.open(u, '_blank')}>
                                          <Download className="w-3 h-3 mr-1" />ดาวน์โหลด Excel
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                )
                              })()}
                            </div>
                          )
                        })
                      })()}
                    </div>
                  </CardContent>
                </Card>
              </>)
            })()}
          </div>
          {/* Combined Upload Invoice Modal */}
          {showUploadModal && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setShowUploadModal(false)}>
              <Card className="w-full max-w-2xl shadow-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Upload className="w-5 h-5" />อัพโหลด Invoice</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <label className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-[#1d4ed8] transition-colors cursor-pointer block relative">
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="application/pdf, image/png, image/jpeg" 
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        const url = URL.createObjectURL(file)
                        setUploadedFile({ name: file.name, url, type: file.type, file })
                      }} 
                    />
                    {uploadedFile ? (
                      <div className="flex items-center gap-3 justify-center">
                        {uploadedFile.type.startsWith('image/') ? (
                          <img src={uploadedFile.url} alt="preview" className="w-16 h-16 object-cover rounded border" />
                        ) : (
                          <div className="w-16 h-16 bg-red-50 rounded border flex items-center justify-center"><FileText className="w-8 h-8 text-red-500" /></div>
                        )}
                        <div className="text-left">
                          <p className="text-sm font-medium text-[#0f172a]">{uploadedFile.name}</p>
                          <p className="text-xs text-green-600">แนบไฟล์เรียบร้อย • คลิกเพื่อเปลี่ยนไฟล์</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 mx-auto mb-2 text-[#94a3b8]" />
                        <p className="text-sm text-[#475569]">คลิกเพื่อแนบไฟล์ PDF/Image</p>
                      </>
                    )}
                  </label>
                  <div>
                    <label className="text-sm font-medium text-[#475569]">เลขที่ใบวางบิล (Invoice No.)</label>
                    <Input className="mt-1" placeholder="ใส่เลขที่จริงจากผู้จัดจำหน่าย หรือเว้นว่างระบบสร้างให้อัตโนมัติ" value={customInvoiceNo} onChange={e => setCustomInvoiceNo(e.target.value)} />
                  </div>
                  <div><h4 className="text-sm font-semibold mb-2">Invoice นี้ cover รายการไหนบ้าง?</h4>
                    <Table><TableHeader><TableRow className="bg-[#f8faff]"><TableHead className="w-10"></TableHead><TableHead className="text-xs">ประเภท</TableHead><TableHead className="text-xs">รายการ</TableHead><TableHead className="text-xs text-right w-36">ราคา (แก้ไขได้)</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {parts.filter(p => p.paymentStatus !== 'INVOICED' && p.paymentStatus !== 'PAID').map(p => (
                          <TableRow key={p.id} className={uploadMapSelections[p.id] ? 'bg-blue-50/50' : ''}>
                            <TableCell><input type="checkbox" checked={!!uploadMapSelections[p.id]} onChange={e => setUploadMapSelections(prev => ({ ...prev, [p.id]: e.target.checked }))} className="w-4 h-4" /></TableCell>
                            <TableCell><Badge variant="outline" className="text-[10px]">อะไหล่</Badge></TableCell>
                            <TableCell className="font-medium">{p.partName} <span className="text-xs text-[#94a3b8] font-mono">{p.partNo}</span></TableCell>
                            <TableCell className="text-right"><Input type="number" className="h-8 text-sm text-right w-32 ml-auto" value={uploadItemPrices[p.id] ?? getPartAmt(p)} onChange={e => setUploadItemPrices(prev => ({ ...prev, [p.id]: Number(e.target.value) || 0 }))} /></TableCell>
                          </TableRow>
                        ))}
                        {labors.filter(l => l.paymentStatus !== 'INVOICED' && l.paymentStatus !== 'PAID').map(l => (
                          <TableRow key={l.id} className={uploadMapSelections[l.id] ? 'bg-blue-50/50' : ''}>
                            <TableCell><input type="checkbox" checked={!!uploadMapSelections[l.id]} onChange={e => setUploadMapSelections(prev => ({ ...prev, [l.id]: e.target.checked }))} className="w-4 h-4" /></TableCell>
                            <TableCell><Badge variant="outline" className="text-[10px]">ค่าแรง</Badge></TableCell>
                            <TableCell className="font-medium">{l.description}</TableCell>
                            <TableCell className="text-right"><Input type="number" className="h-8 text-sm text-right w-32 ml-auto" value={uploadItemPrices[l.id] ?? getLaborAmt(l)} onChange={e => setUploadItemPrices(prev => ({ ...prev, [l.id]: Number(e.target.value) || 0 }))} /></TableCell>
                          </TableRow>
                        ))}
                      </TableBody></Table>
                      <div className="flex flex-col items-end gap-2 mt-4 p-4 bg-gray-50 rounded-lg w-full max-w-sm ml-auto">
                        {(() => {
                           const sub = parts.filter(p => uploadMapSelections[p.id]).reduce((s, p) => s + (uploadItemPrices[p.id] ?? getPartAmt(p)), 0) + labors.filter(l => uploadMapSelections[l.id]).reduce((s, l) => s + (uploadItemPrices[l.id] ?? getLaborAmt(l)), 0)
                           const vat = invoiceIncludeVat ? Math.round(sub * (invoiceVatPct / 100)) : 0
                           const validPOs = claim.purchaseOrders?.filter((po: any) => po.status !== 'CANCELLED') || []
                           const vendorData = validPOs[0]?.vendorId ? vendors.find((v: any) => v.id === validPOs[0].vendorId) : vendors[0]
                           const billingPct = vendorData?.billingPct ?? 100
                           const expectedBilling = Math.round(sub * billingPct / 100)
                           return (
                             <div className="w-full space-y-2">
                               {/* VAT Toggle */}
                               <div className="flex items-center justify-between border-b pb-2 mb-2 w-full">
                                 <label className="flex items-center gap-2 cursor-pointer">
                                   <input type="checkbox" checked={invoiceIncludeVat} onChange={e => setInvoiceIncludeVat(e.target.checked)} className="w-4 h-4 rounded animate-fade-in" />
                                   <span className="text-sm text-gray-600 font-medium">คิด VAT</span>
                                 </label>
                                 {invoiceIncludeVat && (
                                   <div className="flex items-center gap-1">
                                     <Input type="number" className="h-8 w-16 text-sm text-right" value={invoiceVatPct} onChange={e => setInvoiceVatPct(Number(e.target.value) || 0)} min={0} max={100} />
                                     <span className="text-sm text-gray-500">%</span>
                                   </div>
                                 )}
                               </div>

                               <div className="flex justify-between w-full text-sm text-gray-500"><span>มูลค่าก่อนภาษี:</span><span>฿{formatCurrency(sub)}</span></div>
                               {invoiceIncludeVat && (
                                 <div className="flex justify-between w-full text-sm text-gray-500"><span>VAT {invoiceVatPct}%:</span><span>฿{formatCurrency(vat)}</span></div>
                               )}
                               <div className="flex justify-between w-full text-base font-bold text-blue-700 pt-2 border-t mt-1"><span>รวมทั้งสิ้น:</span><span>฿{formatCurrency(sub + vat)}</span></div>
                               {billingPct < 100 && (
                                 <div className="w-full mt-2 pt-2 border-t border-dashed">
                                   <div className="flex justify-between text-sm text-amber-600"><span>Vendor วางบิล {billingPct}%:</span><span>฿{formatCurrency(expectedBilling)}</span></div>
                                   <p className="text-[10px] text-gray-400 mt-0.5">({vendorData?.name})</p>
                                 </div>
                               )}
                             </div>
                           )
                        })()}
                      </div>
                  </div>
                  <div className="flex gap-3 justify-end">
                    <Button variant="outline" onClick={() => setShowUploadModal(false)}>ยกเลิก</Button>
                    <Button className="bg-[#1d4ed8]" disabled={isUploadingFile} onClick={async () => {
                      const selParts = parts.filter(p => uploadMapSelections[p.id])
                      const selLabors = labors.filter(l => uploadMapSelections[l.id])
                      if (!selParts.length && !selLabors.length) { showToast('กรุณาเลือกอย่างน้อย 1 รายการ'); return }
                      
                      try {
                        setIsUploadingFile(true)
                        let pdfUrlToSave = null
                        if (uploadedFile?.file) {
                          pdfUrlToSave = await uploadToR2(uploadedFile.file, `claims/${claim.id}/invoices`)
                        }
                        
                        let hasError = false
                        
                        // Invoice number — user-provided or auto-generated by server
                        const invoiceNo = customInvoiceNo.trim() || undefined

                        // Build combined items list (parts + labors in ONE invoice)
                        const validPOs = claim.purchaseOrders?.filter((po: any) => po.status !== 'CANCELLED') || []
                        const firstVendorId = validPOs[0]?.vendorId || vendors[0]?.id || claim.garageId || 'ven-p01'

                        const partItems = selParts.map(p => {
                          const editedPrice = uploadItemPrices[p.id]
                          const poItem = validPOs.flatMap((po: any) => po.items).find((pi: any) => pi.partNo === p.partNo)
                          const unitPrice = editedPrice !== undefined ? editedPrice / p.quantity : (poItem ? poItem.unitPrice : p.priceApprove)
                          return {
                            poItemId: poItem?.id || validPOs[0]?.items?.[0]?.id,
                            claimPartId: p.id,
                            partNo: p.partNo,
                            description: p.partName,
                            quantity: p.quantity,
                            unitPrice: unitPrice,
                            totalPrice: unitPrice * p.quantity
                          }
                        })
                        const laborItems = selLabors.map(l => {
                          const editedPrice = uploadItemPrices[l.id]
                          const poLabor = validPOs.flatMap((po: any) => po.items).find((pi: any) => pi.description?.includes(l.description))
                          const unitPrice = editedPrice !== undefined ? editedPrice : (poLabor ? poLabor.unitPrice : l.priceApprove)
                          return {
                            claimPartId: null,
                            claimLaborId: l.id,
                            partNo: '',
                            description: `[ค่าแรง] ${l.description}`,
                            quantity: 1,
                            unitPrice: unitPrice,
                            totalPrice: unitPrice
                          }
                        })

                        const sub = selParts.reduce((s, p) => s + (uploadItemPrices[p.id] ?? getPartAmt(p)), 0) + selLabors.reduce((s, l) => s + (uploadItemPrices[l.id] ?? getLaborAmt(l)), 0)
                        const computedVat = invoiceIncludeVat ? Math.round(sub * (invoiceVatPct / 100)) : 0

                        const allItems = [...partItems, ...laborItems]

                        // Create ONE supplier invoice with all items
                        const res = await fetch(`/api/claims/${claim.id}/supplier-invoices`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            vendorId: firstVendorId,
                            invoiceNo,
                            items: allItems,
                            pdfUrl: pdfUrlToSave,
                            vatAmount: computedVat,
                            laborIds: selLabors.map(l => l.id) // pass labor IDs to mark as INVOICED
                          })
                        })
                        if (!res.ok) hasError = true
                        else {
                          const newInv = await res.json()
                          newInv.attachmentUrl = uploadedFile?.url || null
                          newInv.attachmentName = uploadedFile?.name || null
                          setSupplierInvoices(prev => [...prev, newInv])
                          if (selParts.length > 0) setParts(prev => prev.map(p => uploadMapSelections[p.id] ? { ...p, paymentStatus: 'INVOICED' as const } : p))
                          if (selLabors.length > 0) setLabors(prev => prev.map(l => uploadMapSelections[l.id] ? { ...l, paymentStatus: 'INVOICED' as const } : l))
                        }

                        if (hasError) throw new Error('เกิดข้อผิดพลาดในการบันทึกข้อมูลบางส่วน')

                        setShowUploadModal(false); setUploadedFile(null); showToast('บันทึก Invoice เรียบร้อย')
                      } catch (err: any) {
                        setErrorModalMsg(`เกิดข้อผิดพลาด: ${err.message}`)
                      } finally {
                        setIsUploadingFile(false)
                      }
                    }}>
                      {isUploadingFile ? <span className="flex items-center"><span className="w-4 h-4 mr-1.5 border-2 border-t-white border-white/30 rounded-full animate-spin"></span>อัพโหลด...</span> : <span className="flex items-center"><Save className="w-4 h-4 mr-1.5" />ยืนยัน</span>}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Tab 5: Insurance Invoice — AR/AP แยกชัดเจน */}
        <TabsContent value="insurance-inv">
          <InsuranceInvoiceTab {...tabProps} handleCreateInsuranceInvoice={handleCreateInsuranceInvoice} handleDeleteInsuranceInvoice={handleDeleteInsuranceInvoice} setConfirmModal={setConfirmModal} setShowReceiveARModal={setShowReceiveARModal} />
        </TabsContent>

        {/* Tab: Expenses */}
        <TabsContent value="expenses">
          <ExpensesTab {...tabProps} />
        </TabsContent>

        {/* Tab: Documents */}
        <TabsContent value="documents">
          <DocumentsTab {...tabProps} />
        </TabsContent>

        {/* Tab 6: Payments */}
        <TabsContent value="payments">
          <PaymentsTab {...tabProps} setRejectPRId={setRejectPRId} setRejectReason={setRejectReason} />
        </TabsContent>

        {/* Tab 7: P&L */}
        <TabsContent value="pnl">
          <PnLTab {...tabProps} />
        </TabsContent>

        {/* Tab 8: Timeline */}
        <TabsContent value="timeline">
          <TimelineTab {...tabProps} />
        </TabsContent>
      </Tabs>

      {/* ─── Create Quotation Modal ─── */}
      {showCreateQuotationModal && (() => {
        const laborTot = qtLabors.filter(l => l.selected).reduce((sum, l) => sum + (Number(l.priceApprove) || 0), 0)
        const partTot = qtParts.filter(p => p.selected).reduce((sum, p) => sum + ((Number(p.priceApprove) || 0) * (Number(p.quantity) || 1)), 0)
        const sub = partTot + laborTot
        const vatAmt = qtCustomVat !== '' ? Number(qtCustomVat) : Math.round(sub * 0.07)
        const grand = qtCustomGrand !== '' ? Number(qtCustomGrand) : (sub + vatAmt)
        
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-4 border-b flex justify-between items-center bg-[#f8faff]">
                <h3 className="font-semibold text-lg text-[#0f172a] flex items-center gap-2"><FileText className="w-5 h-5 text-[#1d4ed8]" />ออกใบเสนอราคา (Quotation)</h3>
                <Button variant="ghost" size="icon" onClick={() => setShowCreateQuotationModal(false)} className="h-8 w-8 text-[#94a3b8] hover:text-[#0f172a]"><X className="w-4 h-4" /></Button>
              </div>
              <div className="p-4 overflow-y-auto flex-1">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-[#475569]">วันที่เสนอราคา</label>
                      <Input type="date" className="mt-1" value={qtDate} onChange={e => setQtDate(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-[#475569]">วันหมดอายุ</label>
                      <Input type="date" className="mt-1" value={qtValidUntil} onChange={e => setQtValidUntil(e.target.value)} />
                    </div>
                  </div>
                  
                  {/* Items Selection Table */}
                  <div className="border rounded-lg overflow-hidden mt-4">
                    <Table>
                      <TableHeader className="bg-gray-50">
                        <TableRow>
                          <TableHead className="w-10"></TableHead>
                          <TableHead>รายการ</TableHead>
                          <TableHead className="w-20 text-center">จำนวน</TableHead>
                          <TableHead className="w-32 text-right">ราคา/หน่วย</TableHead>
                          <TableHead className="w-32 text-right">รวม</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow className="bg-blue-50/30"><TableCell colSpan={5} className="font-semibold text-sm">รายการค่าแรง</TableCell></TableRow>
                        {qtLabors.map((l, i) => (
                          <TableRow key={l.id}>
                            <TableCell><input type="checkbox" checked={l.selected} onChange={e => { const n = [...qtLabors]; n[i].selected = e.target.checked; setQtLabors(n) }} className="w-4 h-4" /></TableCell>
                            <TableCell><Input className="h-8 text-sm" value={l.description} onChange={e => { const n = [...qtLabors]; n[i].description = e.target.value; setQtLabors(n) }} /></TableCell>
                            <TableCell className="text-center">1</TableCell>
                            <TableCell><Input type="number" className="h-8 text-sm text-right" value={l.priceApprove || ''} onChange={e => { const n = [...qtLabors]; n[i].priceApprove = Number(e.target.value); setQtLabors(n) }} /></TableCell>
                            <TableCell className="text-right font-medium text-sm pt-3">฿{formatCurrency(Number(l.priceApprove) || 0)}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-blue-50/30"><TableCell colSpan={5} className="font-semibold text-sm">รายการอะไหล่</TableCell></TableRow>
                        {qtParts.map((p, i) => (
                          <TableRow key={p.id}>
                            <TableCell><input type="checkbox" checked={p.selected} onChange={e => { const n = [...qtParts]; n[i].selected = e.target.checked; setQtParts(n) }} className="w-4 h-4" /></TableCell>
                            <TableCell><Input className="h-8 text-sm" value={p.partName} onChange={e => { const n = [...qtParts]; n[i].partName = e.target.value; setQtParts(n) }} /></TableCell>
                            <TableCell><Input type="number" className="h-8 text-sm text-center" value={p.quantity || ''} onChange={e => { const n = [...qtParts]; n[i].quantity = Number(e.target.value); setQtParts(n) }} /></TableCell>
                            <TableCell><Input type="number" className="h-8 text-sm text-right" value={p.priceApprove || ''} onChange={e => { const n = [...qtParts]; n[i].priceApprove = Number(e.target.value); setQtParts(n) }} /></TableCell>
                            <TableCell className="text-right font-medium text-sm pt-3">฿{formatCurrency((Number(p.priceApprove) || 0) * (Number(p.quantity) || 1))}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-[#475569]">หมายเหตุ (แสดงในใบเสนอราคา)</label>
                    <Input placeholder="เช่น ราคาอะไหล่อ้างอิงราคาศูนย์" className="mt-1" value={qtNote} onChange={e => setQtNote(e.target.value)} />
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-4 border-t items-end">
                    <div><span className="text-xs text-[#94a3b8]">รวมค่าแรง</span><p className="font-semibold">฿{formatCurrency(laborTot)}</p></div>
                    <div><span className="text-xs text-[#94a3b8]">รวมค่าอะไหล่</span><p className="font-semibold">฿{formatCurrency(partTot)}</p></div>
                    <div><span className="text-xs text-[#94a3b8]">VAT 7% (แก้ไขได้)</span><Input type="number" placeholder={String(Math.round(sub * 0.07))} className="h-8 mt-1" value={qtCustomVat} onChange={e => setQtCustomVat(e.target.value)} /></div>
                    <div className="md:col-span-2 text-right"><span className="text-xs text-[#94a3b8]">ยอดรวมทั้งสิ้น (แก้ไขได้)</span>
                      <div className="flex items-center justify-end gap-2 mt-1">
                        <span className="font-bold text-[#1d4ed8] text-lg">฿</span>
                        <Input type="number" placeholder={String(sub + vatAmt)} className="h-10 w-40 text-right font-bold text-[#1d4ed8] text-lg" value={qtCustomGrand} onChange={e => setQtCustomGrand(e.target.value)} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-4 border-t flex justify-end gap-2 bg-gray-50">
                <Button variant="outline" onClick={() => setShowCreateQuotationModal(false)}>ยกเลิก</Button>
                <Button className="bg-[#1d4ed8]" onClick={handleCreateQuotation}>ยืนยันสร้างใบเสนอราคา</Button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ─── Create PO Modal ─── */}
      {showCreatePOModal && (() => {
        const poPartsTot = poModalParts.filter(p => p.selected).reduce((sum, p) => sum + ((Number(p.priceApprove) || 0) * (Number(p.quantity) || 1)), 0)
        const poLaborsTot = poModalLabors.filter(l => l.selected).reduce((sum, l) => sum + (Number(l.priceApprove) || 0), 0)
        const poManualTot = poManualItems.reduce((sum, m) => sum + ((Number(m.unitPrice) || 0) * (Number(m.quantity) || 1)), 0)
        const poTot = poPartsTot + poLaborsTot + poManualTot
        const vatAmt = poIncludeVat ? Math.round(poTot * (poVatPct / 100)) : 0
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-4 border-b flex justify-between items-center bg-[#f8faff]">
                <h3 className="font-semibold text-lg text-[#0f172a] flex items-center gap-2"><ShoppingCart className="w-5 h-5 text-blue-600" />{editPOId ? 'แก้ไขใบสั่งซื้อ' : 'สร้างใบสั่งซื้อ'} (PO)</h3>
                <Button variant="ghost" size="icon" onClick={() => setShowCreatePOModal(false)} className="h-8 w-8 text-[#94a3b8] hover:text-[#0f172a]"><X className="w-4 h-4" /></Button>
              </div>
              <div className="p-4 overflow-y-auto flex-1">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-[#475569]">เลือกผู้จัดจำหน่าย (Vendor)</label>
                      <SearchableSelect
                        options={vendors.map(v => ({
                          value: v.id,
                          label: `${v.name} (${v.vendorType === 'PARTS' ? 'ผู้จำหน่ายอะไหล่' : 'อู่'})`
                        }))}
                        value={poVendorId}
                        onChange={(val) => {
                          setPoVendorId(val)
                          const selected = vendors.find(v => v.id === val)
                          setPoVendorName(selected ? selected.name : '')
                        }}
                        placeholder="เลือกผู้จัดจำหน่าย..."
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-[#475569]">ที่อยู่สำหรับจัดส่ง (ใบส่งของ)</label>
                      <SearchableSelect
                        options={vendors.map(v => ({
                          value: v.id,
                          label: `${v.name} (${v.province || 'ไม่ระบุจังหวัด'})`
                        }))}
                        value=""
                        onChange={(val) => {
                          const selected = vendors.find(v => v.id === val)
                          if (selected) {
                            setPoDeliveryAddress(`${selected.name}\n${selected.address || ''} ${selected.province || ''}`.trim())
                          }
                        }}
                        placeholder="ค้นหาและเลือกที่อยู่อู่/คู่ค้า..."
                      />
                      <textarea
                        className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-2 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        rows={2}
                        value={poDeliveryAddress}
                        onChange={e => setPoDeliveryAddress(e.target.value)}
                        placeholder="พิมพ์ชื่ออู่ / ศูนย์บริการ / ที่อยู่จัดส่งเพิ่มเติม"
                      />
                    </div>
                  </div>
                  
                  <div className="border rounded-lg overflow-hidden mt-4">
                    <Table>
                      <TableHeader className="bg-gray-50">
                        <TableRow>
                          <TableHead className="w-10"></TableHead>
                          <TableHead>รายการอะไหล่</TableHead>
                          <TableHead className="w-20 text-center">จำนวน</TableHead>
                          <TableHead className="w-32 text-right">ราคา/หน่วย</TableHead>
                          <TableHead className="w-32 text-right">รวม</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {poModalParts.map((p, i) => (
                          <TableRow key={p.id}>
                            <TableCell><input type="checkbox" checked={p.selected} onChange={e => { const n = [...poModalParts]; n[i].selected = e.target.checked; setPoModalParts(n) }} className="w-4 h-4" /></TableCell>
                            <TableCell><Input className="h-8 text-sm" value={p.partName} onChange={e => { const n = [...poModalParts]; n[i].partName = e.target.value; setPoModalParts(n) }} /></TableCell>
                            <TableCell><Input type="number" className="h-8 text-sm text-center" value={p.quantity || ''} onChange={e => { const n = [...poModalParts]; n[i].quantity = Number(e.target.value); setPoModalParts(n) }} /></TableCell>
                            <TableCell><Input type="number" className="h-8 text-sm text-right" value={p.priceApprove || ''} onChange={e => { const n = [...poModalParts]; n[i].priceApprove = Number(e.target.value); setPoModalParts(n) }} /></TableCell>
                            <TableCell className="text-right font-medium text-sm pt-3">฿{formatCurrency((Number(p.priceApprove) || 0) * (Number(p.quantity) || 1))}</TableCell>
                          </TableRow>
                        ))}
                        {poModalParts.length === 0 && (
                          <TableRow><TableCell colSpan={5} className="text-center py-4 text-gray-500">ไม่มีรายการอะไหล่</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Labor items */}
                  <div className="border rounded-lg overflow-hidden mt-4">
                    <div className="bg-amber-50 px-4 py-2 border-b">
                      <h4 className="text-sm font-semibold text-amber-800">ค่าแรง</h4>
                    </div>
                    <Table>
                      <TableHeader className="bg-gray-50">
                        <TableRow>
                          <TableHead className="w-10"></TableHead>
                          <TableHead>รายการค่าแรง</TableHead>
                          <TableHead className="w-32 text-right">ราคา</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {poModalLabors.map((l: any, i: number) => (
                          <TableRow key={l.id}>
                            <TableCell><input type="checkbox" checked={l.selected} onChange={e => { const n = [...poModalLabors]; n[i].selected = e.target.checked; setPoModalLabors(n) }} className="w-4 h-4" /></TableCell>
                            <TableCell><Input className="h-8 text-sm" value={l.description} onChange={e => { const n = [...poModalLabors]; n[i].description = e.target.value; setPoModalLabors(n) }} /></TableCell>
                            <TableCell className="text-right"><Input type="number" className="h-8 text-sm text-right w-28 ml-auto" value={l.priceApprove || ''} onChange={e => { const n = [...poModalLabors]; n[i].priceApprove = Number(e.target.value); setPoModalLabors(n) }} /></TableCell>
                          </TableRow>
                        ))}
                        {poModalLabors.length === 0 && (
                          <TableRow><TableCell colSpan={3} className="text-center py-4 text-gray-500">ไม่มีรายการค่าแรง</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Manual Items */}
                  <div className="border rounded-lg overflow-hidden mt-4">
                    <div className="bg-green-50 px-4 py-2 border-b flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-green-800">รายการเพิ่มเติม (Manual)</h4>
                      <Button variant="outline" size="sm" className="h-7 text-xs text-green-700 border-green-300 hover:bg-green-100" onClick={() => setPoManualItems([...poManualItems, { id: `manual-${Date.now()}`, description: '', quantity: 1, unitPrice: 0 }])}>
                        <Plus className="w-3 h-3 mr-1" />เพิ่มรายการ
                      </Button>
                    </div>
                    <Table>
                      <TableHeader className="bg-gray-50">
                        <TableRow>
                          <TableHead>รายการ</TableHead>
                          <TableHead className="w-20 text-center">จำนวน</TableHead>
                          <TableHead className="w-32 text-right">ราคา/หน่วย</TableHead>
                          <TableHead className="w-32 text-right">รวม</TableHead>
                          <TableHead className="w-10"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {poManualItems.map((m, i) => (
                          <TableRow key={m.id}>
                            <TableCell><Input className="h-8 text-sm" placeholder="ชื่อรายการ เช่น ค่าขนส่ง" value={m.description} onChange={e => { const n = [...poManualItems]; n[i].description = e.target.value; setPoManualItems(n) }} /></TableCell>
                            <TableCell><Input type="number" className="h-8 text-sm text-center" value={m.quantity || ''} onChange={e => { const n = [...poManualItems]; n[i].quantity = Number(e.target.value); setPoManualItems(n) }} /></TableCell>
                            <TableCell><Input type="number" className="h-8 text-sm text-right" value={m.unitPrice || ''} onChange={e => { const n = [...poManualItems]; n[i].unitPrice = Number(e.target.value); setPoManualItems(n) }} /></TableCell>
                            <TableCell className="text-right font-medium text-sm pt-3">฿{formatCurrency((Number(m.unitPrice) || 0) * (Number(m.quantity) || 1))}</TableCell>
                            <TableCell><button onClick={() => setPoManualItems(poManualItems.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button></TableCell>
                          </TableRow>
                        ))}
                        {poManualItems.length === 0 && (
                          <TableRow><TableCell colSpan={5} className="text-center py-4 text-gray-400 text-sm">ยังไม่มีรายการเพิ่มเติม — กดปุ่ม "เพิ่มรายการ" ด้านบน</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  
                  <div className="flex justify-end pt-4 border-t">
                    <div className="flex flex-col items-end gap-2 w-72 bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between w-full text-sm text-gray-500">
                        <span>ยอดรวมก่อน VAT:</span><span>฿{formatCurrency(poTot)}</span>
                      </div>
                      {/* VAT Toggle */}
                      <div className="flex items-center justify-between w-full">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={poIncludeVat} onChange={e => setPoIncludeVat(e.target.checked)} className="w-4 h-4 rounded" />
                          <span className="text-sm text-gray-600">รวม VAT</span>
                        </label>
                        {poIncludeVat && (
                          <div className="flex items-center gap-1">
                            <Input type="number" className="h-7 w-16 text-sm text-right" value={poVatPct} onChange={e => setPoVatPct(Number(e.target.value) || 0)} />
                            <span className="text-sm text-gray-500">%</span>
                          </div>
                        )}
                      </div>
                      {poIncludeVat && (
                        <div className="flex justify-between w-full text-sm text-gray-500">
                          <span>VAT {poVatPct}%:</span><span>฿{formatCurrency(vatAmt)}</span>
                        </div>
                      )}
                      <div className="flex justify-between w-full text-base font-bold text-blue-700 pt-2 border-t mt-1">
                        <span>ยอดรวมทั้งสิ้น:</span><span>฿{formatCurrency(poTot + vatAmt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-4 border-t flex justify-end gap-2 bg-gray-50">
                <Button variant="outline" onClick={() => setShowCreatePOModal(false)}>ยกเลิก</Button>
                <Button className="bg-blue-600 hover:bg-blue-700" onClick={submitCreatePO}>{editPOId ? 'บันทึกการแก้ไข PO' : 'ยืนยันสร้าง PO'}</Button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ─── Supplement Modal ─── */}
      {showSupplementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-amber-50">
              <h3 className="font-semibold text-lg text-amber-900 flex items-center gap-2"><Plus className="w-5 h-5 text-amber-600" />เปิด Supplement</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowSupplementModal(false)} className="h-8 w-8 text-amber-700/50 hover:text-amber-900"><X className="w-4 h-4" /></Button>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-600 mb-4">คุณกำลังจะสร้างใบเสนอราคาฉบับเพิ่มเติม (Supplement) อ้างอิงจากใบเสนอราคาเดิม ระบบจะทำการคัดลอกข้อมูลทั้งหมดไปยังฉบับร่างใหม่ และปรับสถานะฉบับเดิมเป็น &quot;SUPERSEDED&quot;</p>
              <div>
                <label className="text-sm font-medium text-[#475569]">เหตุผลที่เปิด Supplement</label>
                <Input placeholder="เช่น มีรายการซ่อมเพิ่มเติม" className="mt-1" value={supplementReason} onChange={e => setSupplementReason(e.target.value)} />
              </div>
            </div>
            <div className="p-4 border-t flex justify-end gap-2 bg-gray-50">
              <Button variant="outline" onClick={() => setShowSupplementModal(false)}>ยกเลิก</Button>
              <Button className="bg-amber-600 hover:bg-amber-700 text-white" onClick={handleCreateSupplement}>ยืนยันเปิด Supplement</Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Cancel PO Confirm Modal ─── */}
      {confirmCancelPOId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b flex items-center gap-3 bg-red-50 text-red-700">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-semibold">ยกเลิกใบสั่งซื้อ</h3>
            </div>
            <div className="p-6 text-center text-[#475569]">
              คุณต้องการยกเลิกใบสั่งซื้อนี้ใช่หรือไม่? (สถานะจะถูกเปลี่ยนเป็น "ยกเลิก")
            </div>
            <div className="p-4 border-t flex justify-end gap-2 bg-gray-50">
              <Button variant="outline" onClick={() => setConfirmCancelPOId(null)}>ยกเลิก</Button>
              <Button onClick={handleCancelPO} className="bg-red-600 hover:bg-red-700 text-white">ยืนยันการยกเลิก</Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Error Modal ─── */}
      {errorModalMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b flex items-center gap-3 bg-red-50 text-red-700">
              <ShieldAlert className="w-5 h-5" />
              <h3 className="font-semibold">ข้อผิดพลาด</h3>
            </div>
            <div className="p-6 text-center text-[#475569]">
              {errorModalMsg}
            </div>
            <div className="p-4 border-t flex justify-end bg-gray-50">
              <Button onClick={() => setErrorModalMsg(null)} className="bg-red-600 hover:bg-red-700 text-white w-full">ปิดหน้าต่าง</Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Generic Confirm Modal ─── */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b flex items-center gap-3 bg-amber-50 text-amber-700">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-semibold">{confirmModal.title}</h3>
            </div>
            <div className="p-6 text-center text-[#475569]">{confirmModal.message}</div>
            <div className="p-4 border-t flex justify-end gap-2 bg-gray-50">
              <Button variant="outline" onClick={() => setConfirmModal(null)}>ยกเลิก</Button>
              <Button className="bg-[#1d4ed8]" onClick={() => { confirmModal.onConfirm(); setConfirmModal(null) }}>ยืนยัน</Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Receive AR Payment Modal ─── */}
      {showReceiveARModal && (() => {
        const [arReceivedDate, setArReceivedDate] = [arReceiveDate, setArReceiveDate]
        return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowReceiveARModal(false)}>
          <Card className="w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-600" />บันทึกรับเงินจากบ.ประกัน</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-700">ยอดรับ: <span className="font-bold text-lg">฿{formatCurrency(claim.insuranceInvoice?.grandTotal || 0)}</span></p>
              </div>
              <div>
                <label className="text-sm font-medium text-[#475569]">วันที่รับเงิน</label>
                <Input type="date" className="mt-1" value={arReceivedDate} onChange={e => setArReceivedDate(e.target.value)} />
              </div>
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setShowReceiveARModal(false)}>ยกเลิก</Button>
                <Button className="bg-green-600 hover:bg-green-700" onClick={async () => {
                  try {
                    const res = await fetch(`/api/claims/${claim.id}/insurance-invoice/receive-payment`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ method: 'โอนเงิน', receivedAt: arReceivedDate ? new Date(arReceivedDate).toISOString() : undefined })
                    })
                    if (!res.ok) { const e = await res.json(); throw new Error(e.error) }
                    setShowReceiveARModal(false)
                    showToast('บันทึกรับเงินจากบ.ประกันเรียบร้อยแล้ว')
                    await refreshClaim()
                  } catch (err: any) { setShowReceiveARModal(false); setErrorModalMsg(`เกิดข้อผิดพลาด: ${err.message}`) }
                }}><CheckCircle2 className="w-4 h-4 mr-1" />ยืนยันรับเงิน</Button>
              </div>
            </CardContent>
          </Card>
        </div>
        )
      })()}

      {/* ─── Create Payment Request Modal ─── */}
      {pendingPaymentRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setPendingPaymentRequest(null)}>
          <Card className="w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><CreditCard className="w-5 h-5 text-[#1d4ed8]" />สร้างคำขอเบิกจ่ายเงิน</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-[#f8faff] border border-blue-200 rounded-lg p-4">
                <p className="text-xs text-[#94a3b8]">ประเภท</p>
                <p className="font-medium text-sm">{pendingPaymentRequest.type === 'AP_VENDOR' ? 'จ่ายเงิน Supplier (ค่าอะไหล่)' : 'จ่ายเงินอู่ (ค่าแรง)'}</p>
                <p className="text-xs text-[#94a3b8] mt-2">ยอดเงิน</p>
                <p className="font-bold text-lg text-[#1d4ed8]">฿{formatCurrency(pendingPaymentRequest.amount)}</p>
              </div>
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setPendingPaymentRequest(null)}>ยกเลิก</Button>
                <Button className="bg-[#1d4ed8]" onClick={async () => {
                  await handleCreatePaymentRequest(pendingPaymentRequest.type, pendingPaymentRequest.invoiceId, pendingPaymentRequest.amount)
                  setPendingPaymentRequest(null)
                }}><CreditCard className="w-4 h-4 mr-1" />ยืนยันขอเบิกเงิน</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── Reject Payment Request Modal ─── */}
      {rejectPRId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setRejectPRId(null)}>
          <Card className="w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-red-600"><XCircle className="w-5 h-5" />ปฏิเสธคำขอเบิกเงิน</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-[#475569]">เหตุผลที่ปฏิเสธ</label>
                <Input className="mt-1" placeholder="ระบุเหตุผล..." value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
              </div>
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setRejectPRId(null)}>ยกเลิก</Button>
                <Button className="bg-red-600 hover:bg-red-700" disabled={!rejectReason.trim()} onClick={async () => {
                  try {
                    const res = await fetch(`/api/payment-requests/${rejectPRId}/reject`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ rejectReason, rejectedBy: 'การเงิน' })
                    })
                    if (!res.ok) { const e = await res.json(); throw new Error(e.error) }
                    setRejectPRId(null)
                    showToast('ปฏิเสธคำขอเบิกเงินเรียบร้อย')
                    await refreshClaim()
                  } catch (err: any) { setRejectPRId(null); setErrorModalMsg(`เกิดข้อผิดพลาด: ${err.message}`) }
                }}><XCircle className="w-4 h-4 mr-1" />ยืนยันปฏิเสธ</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
