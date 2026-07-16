"use client"

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { 
  ArrowLeft, Plus, Trash2, UserPlus, X, Check, 
  HelpCircle, Wrench, ChevronDown, ChevronUp, Copy 
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default function NewServiceJobPage() {
  const router = useRouter()
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

  // Batch Default Settings
  const [defaultBrand, setDefaultBrand] = useState('')
  const [defaultModel, setDefaultModel] = useState('')
  const [defaultDescription, setDefaultDescription] = useState('')
  const [defaultPrice, setDefaultPrice] = useState<number>(0)

  // Vehicles list state
  // Each vehicle: { id, carPlate, carProvince, carBrand, carModel, carVin, items: [{ description, quantity, priceUnit }] }
  const [vehicles, setVehicles] = useState<any[]>([
    { 
      id: 'v-1', 
      carPlate: '', 
      carProvince: '', 
      carBrand: '', 
      carModel: '', 
      carVin: '', 
      items: [{ description: '', quantity: 1, priceUnit: 0 }] 
    }
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
    fetchCustomers()
  }, [])

  // Auto-fill existing rows with batch defaults
  const handleApplyDefaultsToAll = () => {
    const updated = vehicles.map(v => ({
      ...v,
      carBrand: v.carBrand || defaultBrand,
      carModel: v.carModel || defaultModel,
      items: v.items.map((item: any, idx: number) => {
        // If the first item description is empty, apply default
        if (idx === 0 && !item.description) {
          return {
            ...item,
            description: defaultDescription,
            priceUnit: defaultPrice || item.priceUnit
          }
        }
        return item
      })
    }))
    setVehicles(updated)
  }

  // Add a new vehicle card
  const handleAddVehicle = () => {
    const nextId = `v-${Date.now()}`
    setVehicles([
      ...vehicles,
      {
        id: nextId,
        carPlate: '',
        carProvince: '',
        carBrand: defaultBrand,
        carModel: defaultModel,
        carVin: '',
        items: [{ 
          description: defaultDescription, 
          quantity: 1, 
          priceUnit: defaultPrice 
        }]
      }
    ])
  }

  const handleRemoveVehicle = (id: string) => {
    if (vehicles.length > 1) {
      setVehicles(vehicles.filter(v => v.id !== id))
    }
  }

  const handleUpdateVehicle = (id: string, field: string, value: any) => {
    setVehicles(vehicles.map(v => {
      if (v.id === id) {
        return { ...v, [field]: value }
      }
      return v
    }))
  }

  // Services (Items) management per vehicle
  const handleAddServiceItem = (vehicleId: string) => {
    setVehicles(vehicles.map(v => {
      if (v.id === vehicleId) {
        return {
          ...v,
          items: [...v.items, { description: '', quantity: 1, priceUnit: 0 }]
        }
      }
      return v
    }))
  }

  const handleRemoveServiceItem = (vehicleId: string, itemIdx: number) => {
    setVehicles(vehicles.map(v => {
      if (v.id === vehicleId && v.items.length > 1) {
        return {
          ...v,
          items: v.items.filter((_item: any, idx: number) => idx !== itemIdx)
        }
      }
      return v
    }))
  }

  const handleUpdateServiceItem = (vehicleId: string, itemIdx: number, field: string, value: any) => {
    setVehicles(vehicles.map(v => {
      if (v.id === vehicleId) {
        const updatedItems = [...v.items]
        updatedItems[itemIdx] = { ...updatedItems[itemIdx], [field]: value }
        return { ...v, items: updatedItems }
      }
      return v
    }))
  }

  // Calculate overall pricing details
  const subtotal = useMemo(() => {
    return vehicles.reduce((sum, v) => {
      const vSum = v.items.reduce((itemSum: number, item: any) => {
        return itemSum + (item.quantity * item.priceUnit || 0)
      }, 0)
      return sum + vSum
    }, 0)
  }, [vehicles])

  const vatAmount = Math.round(subtotal * 0.07 * 100) / 100
  const grandTotal = subtotal + vatAmount

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

      // Validate vehicles
      for (let i = 0; i < vehicles.length; i++) {
        const v = vehicles[i]
        const idxLabel = `คันที่ ${i + 1}`
        if (!v.carPlate || !v.carBrand || !v.carModel || !v.carVin) {
          setError(`กรุณากรอกข้อมูลรถให้ครบถ้วนใน ${idxLabel} (ทะเบียน, ยี่ห้อ, รุ่น, VIN)`)
          setSubmitting(false)
          return
        }
        const validItems = v.items.filter((item: any) => item.description.trim() !== '')
        if (validItems.length === 0) {
          setError(`กรุณากรอกรายละเอียดงานบริการอย่างน้อย 1 รายการใน ${idxLabel}`)
          setSubmitting(false)
          return
        }
      }

      // 2. Submit Service Order
      const res = await fetch('/api/service-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: finalCustomerId,
          vehicles: vehicles.map(v => ({
            carPlate: v.carPlate,
            carProvince: v.carProvince,
            carBrand: v.carBrand,
            carModel: v.carModel,
            carVin: v.carVin,
            items: v.items.filter((item: any) => item.description.trim() !== '')
          }))
        })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save job sheet')
      }

      router.push('/service-jobs')
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in p-6 max-w-6xl mx-auto">
      {/* Title */}
      <div className="flex items-center gap-3">
        <Link href="/service-jobs">
          <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg border-gray-200">
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a] flex items-center gap-2">
            <Wrench className="w-6 h-6 text-[#1d4ed8]" />
            สร้างใบสั่งงานบริการทั่วไป
          </h1>
          <p className="text-sm text-[#94a3b8] mt-0.5">
            สร้างใบสั่งงานบริการประเภทพ่นสีหรือล้างรถทั่วไป โดยรองรับรถยนต์หลายคันและบริการย่อยในใบเดียว
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Columns (Forms) */}
        <div className="lg:col-span-2 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm border border-red-200">
              {error}
            </div>
          )}

          {/* 1. Customer Card */}
          <Card className="shadow-sm border-gray-200">
            <CardHeader className="border-b border-gray-100 bg-gray-50/50 flex flex-row items-center justify-between p-4">
              <CardTitle className="text-base font-bold text-[#0f172a]">ข้อมูลผู้ว่าจ้าง / ลูกค้า</CardTitle>
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
            </CardHeader>
            <CardContent className="p-5">
              {!isNewCustomer ? (
                <div className="w-full">
                  <Select
                    value={selectedCustomerId}
                    onChange={e => setSelectedCustomerId(e.target.value)}
                    className="w-full bg-white border-gray-200"
                    required
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1 md:col-span-2">
                    <span className="text-xs font-semibold text-gray-600">ชื่อลูกค้า/บริษัท *</span>
                    <Input
                      placeholder="เช่น บริษัท อะไหล่ดี จำกัด หรือ นายสมชาย มั่งมี"
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
                      placeholder="ชื่อผู้ประสานงาน"
                      value={newCustomerContactPerson}
                      onChange={e => setNewCustomerContactPerson(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <span className="text-xs font-semibold text-gray-600">ที่อยู่</span>
                    <Input
                      placeholder="ที่อยู่สำหรับออกใบกำกับภาษี"
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
            </CardContent>
          </Card>

          {/* 2. Batch Defaults Panel */}
          <Card className="shadow-sm border-gray-200 bg-blue-50/20 border-blue-100">
            <CardHeader className="p-4 border-b border-blue-50/50 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold text-blue-900 flex items-center gap-1.5">
                <Copy className="w-4 h-4 text-blue-600" />
                ค่าเริ่มต้นสำหรับรถยนต์ทุกคัน (Batch Defaults)
              </CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-blue-700 hover:bg-blue-50"
                onClick={handleApplyDefaultsToAll}
              >
                ดึงข้อมูลตั้งต้นไปใช้กับทุกแถว
              </Button>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-blue-800">ยี่ห้อรถเริ่มต้น</span>
                <Input
                  placeholder="เช่น BYD"
                  value={defaultBrand}
                  onChange={e => setDefaultBrand(e.target.value)}
                  className="bg-white border-blue-200"
                />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-semibold text-blue-800">รุ่นรถเริ่มต้น</span>
                <Input
                  placeholder="เช่น ATTO 3"
                  value={defaultModel}
                  onChange={e => setDefaultModel(e.target.value)}
                  className="bg-white border-blue-200"
                />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-semibold text-blue-800">บริการเริ่มต้น</span>
                <Input
                  placeholder="เช่น พ่นสีข้างขวา"
                  value={defaultDescription}
                  onChange={e => setDefaultDescription(e.target.value)}
                  className="bg-white border-blue-200"
                />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-semibold text-blue-800">ราคาต่อหน่วยเริ่มต้น</span>
                <Input
                  type="number"
                  placeholder="0"
                  value={defaultPrice || ''}
                  onChange={e => setDefaultPrice(parseFloat(e.target.value) || 0)}
                  className="bg-white border-blue-200"
                />
              </div>
            </CardContent>
          </Card>

          {/* 3. Vehicles list */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-[#0f172a] px-1">รายการรถยนต์ที่สั่งงาน ({vehicles.length} คัน)</h2>
            {vehicles.map((vehicle, vIdx) => (
              <Card key={vehicle.id} className="shadow-sm border-gray-200 overflow-hidden relative border-l-4 border-l-[#1d4ed8]">
                <div className="bg-gray-50/50 p-3 border-b border-gray-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">รถยนต์คันที่ {vIdx + 1}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 gap-1"
                    disabled={vehicles.length === 1}
                    onClick={() => handleRemoveVehicle(vehicle.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    ลบรถคันนี้
                  </Button>
                </div>
                
                <CardContent className="p-5 space-y-4">
                  {/* Vehicle Specs Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-gray-600">เลขทะเบียน *</span>
                      <Input
                        placeholder="กข 1234"
                        value={vehicle.carPlate}
                        onChange={e => handleUpdateVehicle(vehicle.id, 'carPlate', e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-gray-600">จังหวัด</span>
                      <Input
                        placeholder="กรุงเทพฯ"
                        value={vehicle.carProvince}
                        onChange={e => handleUpdateVehicle(vehicle.id, 'carProvince', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-gray-600">ยี่ห้อรถ *</span>
                      <Input
                        placeholder="Toyota"
                        value={vehicle.carBrand}
                        onChange={e => handleUpdateVehicle(vehicle.id, 'carBrand', e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-gray-600">รุ่นรถ *</span>
                      <Input
                        placeholder="Yaris"
                        value={vehicle.carModel}
                        onChange={e => handleUpdateVehicle(vehicle.id, 'carModel', e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1 col-span-2 md:col-span-1">
                      <span className="text-xs font-semibold text-gray-600">เลขตัวถัง VIN *</span>
                      <Input
                        placeholder="เลข VIN 17 หลัก"
                        value={vehicle.carVin}
                        onChange={e => handleUpdateVehicle(vehicle.id, 'carVin', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Nested Services Table */}
                  <div className="border-t border-gray-100 pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">รายการบริการของรถคันนี้</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1 text-xs border-gray-200 text-gray-600"
                        onClick={() => handleAddServiceItem(vehicle.id)}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        เพิ่มบริการย่อย
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {vehicle.items.map((item: any, itemIdx: number) => (
                        <div key={itemIdx} className="flex gap-2 items-center">
                          <div className="flex-1">
                            <Input
                              placeholder="เช่น พ่นสีแก้มหน้าขวา"
                              value={item.description}
                              onChange={e => handleUpdateServiceItem(vehicle.id, itemIdx, 'description', e.target.value)}
                              required
                            />
                          </div>
                          <div className="w-[80px]">
                            <Input
                              type="number"
                              placeholder="จำนวน"
                              value={item.quantity}
                              min={1}
                              onChange={e => handleUpdateServiceItem(vehicle.id, itemIdx, 'quantity', parseInt(e.target.value, 10) || 0)}
                              required
                            />
                          </div>
                          <div className="w-[120px]">
                            <Input
                              type="number"
                              placeholder="ราคา/หน่วย"
                              value={item.priceUnit}
                              min={0}
                              onChange={e => handleUpdateServiceItem(vehicle.id, itemIdx, 'priceUnit', parseFloat(e.target.value) || 0)}
                              required
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-9 w-9 p-0 text-red-400 hover:text-red-600"
                            disabled={vehicle.items.length === 1}
                            onClick={() => handleRemoveServiceItem(vehicle.id, itemIdx)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Button
              type="button"
              variant="outline"
              className="w-full py-6 border-dashed border-gray-300 text-gray-500 hover:text-[#1d4ed8] hover:border-[#1d4ed8] gap-2 rounded-xl transition-all"
              onClick={handleAddVehicle}
            >
              <Plus className="w-5 h-5" />
              เพิ่มรถยนต์คันใหม่
            </Button>
          </div>
        </div>

        {/* Right Sticky Column (Billing Summary) */}
        <div className="space-y-6 lg:sticky lg:top-6">
          <Card className="shadow-sm border-gray-200 overflow-hidden">
            <CardHeader className="bg-gray-50 border-b border-gray-200 p-4">
              <CardTitle className="text-base font-bold text-[#0f172a]">สรุปยอดค่าบริการ</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex justify-between">
                  <span className="text-gray-400">จำนวนรถทั้งหมด:</span>
                  <span className="font-bold text-[#0f172a]">{vehicles.length} คัน</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">ราคารวมสินค้า:</span>
                  <span className="font-semibold">฿{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-500 text-xs">
                  <span>ภาษีมูลค่าเพิ่ม (7%):</span>
                  <span>฿{formatCurrency(vatAmount)}</span>
                </div>
                <hr className="border-gray-100" />
                <div className="flex justify-between text-lg font-bold text-gray-900 pt-1">
                  <span>ยอดสุทธิทั้งหมด:</span>
                  <span className="text-[#1d4ed8]">฿{formatCurrency(grandTotal)}</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <Button 
                  type="submit" 
                  disabled={submitting} 
                  className="w-full bg-[#1d4ed8] hover:bg-[#1e40af] text-white py-5 font-semibold text-sm rounded-xl shadow-md transition-all"
                >
                  {submitting ? 'กำลังบันทึก...' : 'บันทึกใบสั่งงาน'}
                </Button>
                <Link href="/service-jobs" className="w-full">
                  <Button type="button" variant="outline" className="w-full border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl">
                    ยกเลิก
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  )
}
