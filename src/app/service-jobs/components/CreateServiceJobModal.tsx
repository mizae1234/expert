"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Plus, Trash2, UserPlus, Check, X } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface CreateServiceJobModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function CreateServiceJobModal({ open, onClose, onSuccess }: CreateServiceJobModalProps) {
  const [customers, setCustomers] = useState<any[]>([])
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [isNewCustomer, setIsNewCustomer] = useState(false)
  const [loadingCustomers, setLoadingCustomers] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // New Customer Form State
  const [newCustomerName, setNewCustomerName] = useState('')
  const [newCustomerTaxId, setNewCustomerTaxId] = useState('')
  const [newCustomerPhone, setNewCustomerPhone] = useState('')
  const [newCustomerAddress, setNewCustomerAddress] = useState('')
  const [newCustomerBranchCode, setNewCustomerBranchCode] = useState('00000')
  const [newCustomerIsVatRegistered, setNewCustomerIsVatRegistered] = useState(true)
  const [newCustomerContactPerson, setNewCustomerContactPerson] = useState('')

  // Vehicle State
  const [carPlate, setCarPlate] = useState('')
  const [carProvince, setCarProvince] = useState('')
  const [carBrand, setCarBrand] = useState('')
  const [carModel, setCarModel] = useState('')
  const [carVin, setCarVin] = useState('')

  // Items State
  const [items, setItems] = useState<any[]>([
    { description: '', quantity: 1, priceUnit: 0 }
  ])

  const fetchCustomers = async () => {
    setLoadingCustomers(true)
    try {
      const res = await fetch('/api/customers')
      const data = await res.json()
      if (Array.isArray(data)) {
        setCustomers(data)
      }
    } catch (err) {
      console.error('Error fetching customers:', err)
    } finally {
      setLoadingCustomers(false)
    }
  }

  useEffect(() => {
    if (open) {
      fetchCustomers()
      // Reset state
      setSelectedCustomerId('')
      setIsNewCustomer(false)
      setNewCustomerName('')
      setNewCustomerTaxId('')
      setNewCustomerPhone('')
      setNewCustomerAddress('')
      setNewCustomerBranchCode('00000')
      setNewCustomerIsVatRegistered(true)
      setNewCustomerContactPerson('')
      setCarPlate('')
      setCarProvince('')
      setCarBrand('')
      setCarModel('')
      setCarVin('')
      setItems([{ description: '', quantity: 1, priceUnit: 0 }])
      setError('')
    }
  }, [open])

  // Subtotal calculations
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.priceUnit || 0), 0)
  const vatAmount = Math.round(subtotal * 0.07 * 100) / 100
  const grandTotal = subtotal + vatAmount

  const handleAddItem = () => {
    setItems([...items, { description: '', quantity: 1, priceUnit: 0 }])
  }

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const handleUpdateItem = (index: number, field: string, value: any) => {
    const updated = [...items]
    updated[index] = { ...updated[index], [field]: value }
    setItems(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      let finalCustomerId = selectedCustomerId

      // 1. Create customer first if adding new
      if (isNewCustomer) {
        if (!newCustomerName) {
          setError('กรุณากรอกชื่อลูกค้า/บริษัท')
          setSubmitting(false)
          return
        }
        const custRes = await fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newCustomerName,
            taxId: newCustomerTaxId,
            phone: newCustomerPhone,
            address: newCustomerAddress,
            branchCode: newCustomerBranchCode,
            isVatRegistered: newCustomerIsVatRegistered,
            contactPerson: newCustomerContactPerson
          })
        })
        const newCust = await custRes.json()
        if (!custRes.ok) {
          throw new Error(newCust.error || 'Failed to create customer')
        }
        finalCustomerId = newCust.id
      }

      if (!finalCustomerId) {
        setError('กรุณาเลือกลูกค้า หรือสร้างลูกค้าใหม่')
        setSubmitting(false)
        return
      }

      if (!carPlate || !carBrand || !carModel || !carVin) {
        setError('กรุณากรอกข้อมูลตัวรถให้ครบถ้วน (ทะเบียน, ยี่ห้อ, รุ่น, เลขตัวถัง)')
        setSubmitting(false)
        return
      }

      // Check items
      const validItems = items.filter(item => item.description.trim() !== '')
      if (validItems.length === 0) {
        setError('กรุณาเพิ่มรายการสั่งงานบริการอย่างน้อย 1 รายการ')
        setSubmitting(false)
        return
      }

      // 2. Create Service Order
      const res = await fetch('/api/service-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: finalCustomerId,
          carPlate,
          carProvince,
          carBrand,
          carModel,
          carVin,
          items: validItems
        })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create service job')
      }

      onSuccess()
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl overflow-y-auto max-h-[90vh] bg-white p-6 rounded-xl border border-gray-200 shadow-xl">
        <DialogHeader className="border-b border-gray-100 pb-3">
          <DialogTitle className="text-xl font-bold text-[#0f172a] flex items-center gap-2">
            <Plus className="w-5 h-5 text-[#1d4ed8]" />
            สร้างใบสั่งงานบริการใหม่
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm border border-red-200">
              {error}
            </div>
          )}

          {/* Customer Selection */}
          <div className="space-y-3 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-gray-700">ข้อมูลผู้ว่าจ้าง/ลูกค้า</label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 border-[#1d4ed8] text-[#1d4ed8] hover:bg-blue-50"
                onClick={() => setIsNewCustomer(!isNewCustomer)}
              >
                {isNewCustomer ? (
                  <>
                    <X className="w-3.5 h-3.5" />
                    เลือกลูกค้าที่มีอยู่
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5" />
                    สร้างลูกค้าใหม่
                  </>
                )}
              </Button>
            </div>

            {!isNewCustomer ? (
              <div className="w-full">
                <Select
                  value={selectedCustomerId}
                  onChange={e => setSelectedCustomerId(e.target.value)}
                  className="w-full bg-white border-gray-200"
                >
                  <option value="">-- เลือกลูกค้า --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.taxId ? `(Tax: ${c.taxId})` : ''}
                    </option>
                  ))}
                </Select>
                {loadingCustomers && <p className="text-xs text-gray-400 mt-1">กำลังโหลดข้อมูลลูกค้า...</p>}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <div className="space-y-1 md:col-span-2">
                  <span className="text-xs font-semibold text-gray-600">ชื่อลูกค้า/บริษัท *</span>
                  <Input
                    placeholder="เช่น บริษัท อะไหล่ดี จำกัด หรือ สมชาย มั่งมี"
                    value={newCustomerName}
                    onChange={e => setNewCustomerName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-gray-600">เลขประจำตัวผู้เสียภาษี</span>
                  <Input
                    placeholder="เลข 13 หลัก"
                    value={newCustomerTaxId}
                    onChange={e => setNewCustomerTaxId(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-gray-600">เบอร์โทรศัพท์</span>
                  <Input
                    placeholder="08X-XXXXXXX"
                    value={newCustomerPhone}
                    onChange={e => setNewCustomerPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-gray-600">รหัสสาขา</span>
                  <Input
                    placeholder="00000"
                    value={newCustomerBranchCode}
                    onChange={e => setNewCustomerBranchCode(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-gray-600">ชื่อผู้ติดต่อ</span>
                  <Input
                    placeholder="ชื่อเจ้าหน้าที่ประสานงาน"
                    value={newCustomerContactPerson}
                    onChange={e => setNewCustomerContactPerson(e.target.value)}
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <span className="text-xs font-semibold text-gray-600">ที่อยู่</span>
                  <Input
                    placeholder="ที่อยู่ตามใบกำกับภาษี"
                    value={newCustomerAddress}
                    onChange={e => setNewCustomerAddress(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="vatReg"
                    checked={newCustomerIsVatRegistered}
                    onChange={e => setNewCustomerIsVatRegistered(e.target.checked)}
                    className="rounded text-[#1d4ed8] focus:ring-[#1d4ed8]"
                  />
                  <label htmlFor="vatReg" className="text-xs font-semibold text-gray-600">
                    จดทะเบียนภาษีมูลค่าเพิ่ม (VAT 7%)
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Vehicle Details */}
          <div className="space-y-3 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
            <label className="text-sm font-semibold text-gray-700 block">ข้อมูลตัวรถ</label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-gray-600">เลขทะเบียน *</span>
                <Input
                  placeholder="กข 1234"
                  value={carPlate}
                  onChange={e => setCarPlate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-semibold text-gray-600">จังหวัด</span>
                <Input
                  placeholder="กรุงเทพฯ"
                  value={carProvince}
                  onChange={e => setCarProvince(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-semibold text-gray-600">ยี่ห้อรถ *</span>
                <Input
                  placeholder="Toyota"
                  value={carBrand}
                  onChange={e => setCarBrand(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-semibold text-gray-600">รุ่นรถ *</span>
                <Input
                  placeholder="Hilux Revo"
                  value={carModel}
                  onChange={e => setCarModel(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1 col-span-2 md:col-span-1">
                <span className="text-xs font-semibold text-gray-600">เลขตัวถัง VIN *</span>
                <Input
                  placeholder="VIN 17 หลัก"
                  value={carVin}
                  onChange={e => setCarVin(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Service Items */}
          <div className="space-y-3 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-gray-700">รายการรับบริการทำสี/งานซ่อม</label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1 border-gray-300 hover:bg-gray-100 text-gray-700"
                onClick={handleAddItem}
              >
                <Plus className="w-3.5 h-3.5" />
                เพิ่มรายการ
              </Button>
            </div>

            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <div className="flex-1">
                    <Input
                      placeholder={`รายการที่ ${idx + 1} เช่น พ่นสีกันชนหน้า`}
                      value={item.description}
                      onChange={e => handleUpdateItem(idx, 'description', e.target.value)}
                      required
                    />
                  </div>
                  <div className="w-[80px]">
                    <Input
                      type="number"
                      placeholder="จำนวน"
                      value={item.quantity}
                      min={1}
                      onChange={e => handleUpdateItem(idx, 'quantity', parseInt(e.target.value, 10) || 0)}
                      required
                    />
                  </div>
                  <div className="w-[120px]">
                    <Input
                      type="number"
                      placeholder="ราคาต่อหน่วย"
                      value={item.priceUnit}
                      min={0}
                      onChange={e => handleUpdateItem(idx, 'priceUnit', parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                    disabled={items.length === 1}
                    onClick={() => handleRemoveItem(idx)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Calculations Summary */}
            <div className="border-t border-gray-200/60 pt-3 flex flex-col items-end space-y-1.5 text-sm font-medium text-gray-700">
              <div className="flex justify-between w-full max-w-[240px]">
                <span>ราคารวมสินค้า:</span>
                <span>฿{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between w-full max-w-[240px] text-gray-500">
                <span>ภาษีมูลค่าเพิ่ม (7%):</span>
                <span>฿{formatCurrency(vatAmount)}</span>
              </div>
              <div className="flex justify-between w-full max-w-[240px] text-base font-bold text-[#0f172a]">
                <span>ยอดเงินสุทธิ:</span>
                <span>฿{formatCurrency(grandTotal)}</span>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-gray-100 pt-3 gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" className="border-gray-200 text-gray-700 hover:bg-gray-50">
                ยกเลิก
              </Button>
            </DialogClose>
            <Button type="submit" disabled={submitting} className="bg-[#1d4ed8] hover:bg-[#1e40af] text-white">
              {submitting ? 'กำลังบันทึก...' : 'บันทึกใบสั่งงาน'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
