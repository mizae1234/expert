"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CreditCard } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface CreatePRModalProps {
  isOpen: boolean
  onClose: () => void
  claimId: string
  pendingPaymentRequest: { 
    type: 'AP_VENDOR' | 'AP_GARAGE', 
    invoiceId: string, 
    amount: number,
    whtAmount?: number,
    whtPct?: number
  } | null
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
  const [includeWht, setIncludeWht] = useState(false)
  const [whtPct, setWhtPct] = useState(3)
  const [customWhtAmount, setCustomWhtAmount] = useState<string>('')

  useEffect(() => {
    if (isOpen && pendingPaymentRequest) {
      const hasWht = !!pendingPaymentRequest.whtAmount && pendingPaymentRequest.whtAmount > 0
      setIncludeWht(hasWht)
      setWhtPct(pendingPaymentRequest.whtPct || 3)
      setCustomWhtAmount(hasWht ? String(pendingPaymentRequest.whtAmount) : '')
    }
  }, [isOpen, pendingPaymentRequest])

  if (!isOpen || !pendingPaymentRequest) return null

  // Estimate subtotal assuming 7% VAT is included in amount
  const subtotalEstimate = pendingPaymentRequest.amount / 1.07
  const calculatedWht = includeWht ? Math.round(subtotalEstimate * (whtPct / 100) * 100) / 100 : 0
  const finalWhtAmount = includeWht ? (customWhtAmount !== '' ? Number(customWhtAmount) : calculatedWht) : 0
  const payableAmount = pendingPaymentRequest.amount - finalWhtAmount

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
          whtAmount: finalWhtAmount,
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
          <div className="bg-[#f8faff] border border-blue-200 rounded-lg p-4 space-y-3">
            <div>
              <p className="text-xs text-[#94a3b8]">ประเภท</p>
              <p className="font-medium text-sm">
                {pendingPaymentRequest.type === 'AP_VENDOR' ? 'จ่ายเงิน Supplier (ค่าอะไหล่)' : 'จ่ายเงินอู่ (ค่าแรง)'}
              </p>
            </div>
            
            <div className="border-t pt-2 flex justify-between items-center">
              <span className="text-xs text-[#94a3b8]">ยอดบิลรวม VAT:</span>
              <span className="font-semibold text-sm">฿{formatCurrency(pendingPaymentRequest.amount)}</span>
            </div>

            <div className="border-t pt-2 space-y-2">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeWht}
                    onChange={e => setIncludeWht(e.target.checked)}
                    className="w-4 h-4 rounded animate-fade-in"
                  />
                  <span className="text-xs font-medium text-gray-600">หัก ณ ที่จ่าย (WHT)</span>
                </label>
                {includeWht && (
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      className="h-7 w-12 text-xs text-right p-1"
                      value={whtPct}
                      onChange={e => {
                        setWhtPct(Number(e.target.value) || 0)
                        setCustomWhtAmount('')
                      }}
                      min={0}
                      max={100}
                    />
                    <span className="text-xs text-gray-500">%</span>
                  </div>
                )}
              </div>

              {includeWht && (
                <div className="flex items-center justify-between text-xs text-gray-500 pl-6">
                  <span>จำนวนเงิน WHT:</span>
                  <div className="flex items-center gap-1">
                    <span>฿</span>
                    <Input
                      type="number"
                      step="0.01"
                      className="h-7 w-24 text-xs text-right font-medium"
                      value={customWhtAmount}
                      onChange={e => setCustomWhtAmount(e.target.value)}
                      placeholder={String(calculatedWht)}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="border-t pt-2 flex justify-between items-center text-blue-700">
              <span className="font-bold text-sm">ยอดจ่ายสุทธิ (Net):</span>
              <span className="font-bold text-lg">฿{formatCurrency(payableAmount)}</span>
            </div>
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
