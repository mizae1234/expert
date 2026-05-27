"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CreditCard } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface CreatePRModalProps {
  isOpen: boolean
  onClose: () => void
  claimId: string
  pendingPaymentRequest: { type: 'AP_VENDOR' | 'AP_GARAGE', invoiceId: string, amount: number } | null
  showToast: (msg: string) => void
  setErrorModalMsg: (msg: string | null) => void
  refreshClaim: () => Promise<void>
}

export function CreatePRModal({
  isOpen,
  onClose,
  claimId,
  pendingPaymentRequest,
  showToast,
  setErrorModalMsg,
  refreshClaim
}: CreatePRModalProps) {
  if (!isOpen || !pendingPaymentRequest) return null

  const handleCreatePaymentRequest = async () => {
    try {
      const res = await fetch(`/api/payment-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestType: pendingPaymentRequest.type,
          claimId: claimId,
          supplierInvoiceId: pendingPaymentRequest.type === 'AP_VENDOR' ? pendingPaymentRequest.invoiceId : undefined,
          garageInvoiceId: pendingPaymentRequest.type === 'AP_GARAGE' ? pendingPaymentRequest.invoiceId : undefined,
          amount: pendingPaymentRequest.amount,
        })
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Failed to create payment request')
      }

      showToast('สร้างคำขอเบิกจ่ายเงินเรียบร้อย กรุณารอการเงินอนุมัติ')
      await refreshClaim()
      onClose()
    } catch (err: any) {
      setErrorModalMsg(`เกิดข้อผิดพลาดในการสร้างคำขอเบิกเงิน: ${err.message}`)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <Card className="w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#1d4ed8]" />
            สร้างคำขอเบิกจ่ายเงิน
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-[#f8faff] border border-blue-200 rounded-lg p-4">
            <p className="text-xs text-[#94a3b8]">ประเภท</p>
            <p className="font-medium text-sm">
              {pendingPaymentRequest.type === 'AP_VENDOR' ? 'จ่ายเงิน Supplier (ค่าอะไหล่)' : 'จ่ายเงินอู่ (ค่าแรง)'}
            </p>
            <p className="text-xs text-[#94a3b8] mt-2">ยอดเงิน</p>
            <p className="font-bold text-lg text-[#1d4ed8]">฿{formatCurrency(pendingPaymentRequest.amount)}</p>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={onClose}>ยกเลิก</Button>
            <Button className="bg-[#1d4ed8]" onClick={handleCreatePaymentRequest}>
              <CreditCard className="w-4 h-4 mr-1" />
              ยืนยันขอเบิกเงิน
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
