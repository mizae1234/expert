"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, User, Phone, MapPin, Save, Trash2, CheckCircle2 } from 'lucide-react'

const DEFAULT_CUSTOMER = {
  name: '',
  taxId: '',
  phone: '',
  address: '',
  branchCode: '00000',
  isVatRegistered: true,
  contactPerson: '',
  peakCustomerId: '',
  contactType: 'ลูกค้า',
  nationality: 'ไทย',
  businessType: 'บริษัทจำกัด',
  creditTermArDays: 30,
}

export default function CustomerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const isNew = params.id === 'new'
  const id = params.id as string

  const [customer, setCustomer] = useState<any>(isNew ? DEFAULT_CUSTOMER : null)
  const [loading, setLoading] = useState(!isNew)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    if (!isNew && id) {
      fetch(`/api/customers/${id}`)
        .then(res => res.json())
        .then(data => {
          if (data.error) {
            showToast('❌ ไม่พบข้อมูลลูกค้า')
            router.push('/customers')
          } else {
            setCustomer(data)
          }
          setLoading(false)
        })
        .catch(err => {
          console.error('Error fetching customer:', err)
          showToast('❌ เกิดข้อผิดพลาดในการดึงข้อมูล')
          setLoading(false)
        })
    }
  }, [id, isNew, router])

  const handleSave = async () => {
    if (!customer.name) {
      showToast('⚠️ กรุณากรอกชื่อลูกค้า/บริษัท')
      return
    }

    setIsSaving(true)
    try {
      const url = isNew ? '/api/customers' : `/api/customers/${id}`
      const method = isNew ? 'POST' : 'PUT'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customer)
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'บันทึกข้อมูลไม่สำเร็จ')
      }

      showToast('✅ บันทึกข้อมูลลูกค้าสำเร็จ')
      setTimeout(() => {
        router.push('/customers')
      }, 1000)
    } catch (err: any) {
      showToast('❌ ' + err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (isNew) return
    if (!confirm('คุณแน่ใจว่าต้องการลบข้อมูลลูกค้ารายนี้ใช่หรือไม่?')) return

    setIsDeleting(true)
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: 'DELETE'
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'ลบข้อมูลไม่สำเร็จ')
      }

      showToast('✅ ลบข้อมูลลูกค้าสำเร็จ')
      setTimeout(() => {
        router.push('/customers')
      }, 1000)
    } catch (err: any) {
      showToast('❌ ' + err.message)
    } finally {
      setIsDeleting(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-gray-500">กำลังโหลดรายละเอียดข้อมูลลูกค้า...</div>
  }

  if (!customer) {
    return <div className="p-8 text-center text-red-500">ไม่พบข้อมูลลูกค้า</div>
  }

  return (
    <div className="space-y-6 animate-fade-in p-6 relative">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 bg-[#0f172a] text-white px-4 py-2.5 rounded-xl shadow-lg text-sm flex items-center gap-2 border border-white/10 animate-slide-in">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/customers">
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg border-gray-200 hover:bg-gray-50">
              <ArrowLeft className="w-4 h-4 text-gray-600" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#0f172a]">
              {isNew ? 'เพิ่มลูกค้าใหม่' : customer.name}
            </h1>
            <p className="text-sm text-[#94a3b8] mt-0.5">
              {isNew ? 'สร้างข้อมูลประวัติลูกค้าใหม่' : `รหัสลูกค้า: ${customer.id}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isNew && (
            <Button
              variant="ghost"
              className="text-red-500 hover:text-red-700 hover:bg-red-50 gap-1.5"
              onClick={handleDelete}
              disabled={isDeleting || isSaving}
            >
              <Trash2 className="w-4 h-4" />
              ลบลูกค้า
            </Button>
          )}
          <Button
            className="bg-[#1d4ed8] hover:bg-[#1e40af] gap-1.5 text-white"
            onClick={handleSave}
            disabled={isSaving || isDeleting}
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Columns (Form) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-sm border-gray-200">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100 p-4">
              <CardTitle className="text-base font-bold text-[#0f172a] flex items-center gap-2">
                <User className="w-4 h-4 text-[#1d4ed8]" />
                ข้อมูลทั่วไปของลูกค้า
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-gray-500 uppercase">ชื่อลูกค้า / บริษัท *</label>
                <input
                  type="text"
                  className="w-full mt-1.5 p-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={customer.name}
                  onChange={e => setCustomer({ ...customer, name: e.target.value })}
                  placeholder="ป้อนชื่อลูกค้า บุคคลธรรมดา หรือชื่อบริษัท..."
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">เบอร์โทรศัพท์</label>
                <input
                  type="text"
                  className="w-full mt-1.5 p-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={customer.phone || ''}
                  onChange={e => setCustomer({ ...customer, phone: e.target.value })}
                  placeholder="เช่น 081-234-5678"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">ผู้ประสานงาน / ชื่อผู้ติดต่อ</label>
                <input
                  type="text"
                  className="w-full mt-1.5 p-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={customer.contactPerson || ''}
                  onChange={e => setCustomer({ ...customer, contactPerson: e.target.value })}
                  placeholder="เช่น คุณสมชาย"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">สัญชาติ</label>
                <input
                  type="text"
                  className="w-full mt-1.5 p-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={customer.nationality || 'ไทย'}
                  onChange={e => setCustomer({ ...customer, nationality: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">ประเภทธุรกิจ</label>
                <select
                  className="w-full mt-1.5 p-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  value={customer.businessType || 'บริษัทจำกัด'}
                  onChange={e => setCustomer({ ...customer, businessType: e.target.value })}
                >
                  <option value="บริษัทจำกัด">บริษัทจำกัด</option>
                  <option value="บุคคลธรรมดา">บุคคลธรรมดา</option>
                  <option value="ห้างหุ้นส่วนจำกัด">ห้างหุ้นส่วนจำกัด</option>
                  <option value="ห้างหุ้นส่วนสามัญ">ห้างหุ้นส่วนสามัญ</option>
                  <option value="ร้านค้า">ร้านค้า</option>
                  <option value="อื่น ๆ">อื่น ๆ</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">ประเภทผู้ติดต่อ (PEAK Contact Type)</label>
                <select
                  className="w-full mt-1.5 p-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  value={customer.contactType || 'ลูกค้า'}
                  onChange={e => setCustomer({ ...customer, contactType: e.target.value })}
                >
                  <option value="ลูกค้า">ลูกค้า (Customer)</option>
                  <option value="ผู้ขาย">ผู้ขาย (Vendor)</option>
                  <option value="ไม่ระบุ">ไม่ระบุ</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">ระยะเวลาเครดิต (วัน)</label>
                <input
                  type="number"
                  className="w-full mt-1.5 p-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={customer.creditTermArDays || ''}
                  onChange={e => setCustomer({ ...customer, creditTermArDays: Number(e.target.value) || 0 })}
                  placeholder="30"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-gray-500 uppercase">ที่อยู่จัดส่งเอกสาร / ที่อยู่จดทะเบียน</label>
                <textarea
                  className="w-full mt-1.5 p-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  rows={3}
                  value={customer.address || ''}
                  onChange={e => setCustomer({ ...customer, address: e.target.value })}
                  placeholder="ป้อนรายละเอียดที่อยู่จดทะเบียนภาษี..."
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (Tax & Integration Settings) */}
        <div className="space-y-6">
          {/* Tax Information */}
          <Card className="shadow-sm border-gray-200">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100 p-4">
              <CardTitle className="text-base font-bold text-[#0f172a]">ข้อมูลทางภาษี</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">การจดทะเบียนภาษีมูลค่าเพิ่ม (VAT)</label>
                <select
                  className="w-full mt-1.5 p-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  value={String(customer.isVatRegistered)}
                  onChange={e => setCustomer({ ...customer, isVatRegistered: e.target.value === 'true' })}
                >
                  <option value="true">จดทะเบียนภาษีมูลค่าเพิ่ม (7%)</option>
                  <option value="false">ไม่จดทะเบียนภาษีมูลค่าเพิ่ม</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">เลขประจำตัวผู้เสียภาษี 13 หลัก</label>
                <input
                  type="text"
                  className="w-full mt-1.5 p-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  value={customer.taxId || ''}
                  onChange={e => setCustomer({ ...customer, taxId: e.target.value })}
                  placeholder="เช่น 1234567890123"
                  maxLength={13}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">รหัสสาขา 5 หลัก</label>
                <input
                  type="text"
                  className="w-full mt-1.5 p-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  value={customer.branchCode || ''}
                  onChange={e => setCustomer({ ...customer, branchCode: e.target.value })}
                  placeholder="00000 (สำนักงานใหญ่)"
                  maxLength={5}
                />
              </div>
            </CardContent>
          </Card>

          {/* PEAK Account Code */}
          <Card className="shadow-sm border-gray-200">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100 p-4">
              <CardTitle className="text-base font-bold text-[#0f172a] flex items-center justify-between">
                PEAK Integration
                {customer.peakCustomerId ? (
                  <Badge className="bg-green-100 text-green-700 border-none">เชื่อมต่อแล้ว</Badge>
                ) : (
                  <Badge className="bg-amber-100 text-amber-700 border-none">ไม่มีรหัส PEAK</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">PEAK Customer ID / Contact ID</label>
                <input
                  type="text"
                  className="w-full mt-1.5 p-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  value={customer.peakCustomerId || ''}
                  onChange={e => setCustomer({ ...customer, peakCustomerId: e.target.value })}
                  placeholder="เช่น C0001"
                />
                <p className="text-[10px] text-gray-400 mt-2 leading-relaxed">
                  *ระบุรหัสผู้ติดต่อให้ตรงกับระบบบัญชี PEAK เพื่อให้สามารถจับคู่ข้อมูลเวลาส่งออกเอกสารได้ถูกต้อง
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Stats if editing */}
          {!isNew && customer._count && (
            <Card className="shadow-sm border-gray-200 bg-gray-50/50">
              <CardContent className="p-4 text-xs font-medium space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">จำนวนใบสั่งงานสะสม:</span>
                  <span className="font-bold text-[#0f172a]">{customer._count.serviceOrders || 0} รายการ</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
