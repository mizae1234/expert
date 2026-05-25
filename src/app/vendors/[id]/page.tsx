"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Phone, MapPin, Building2, Save } from 'lucide-react'

const DEFAULT_VENDOR = {
  name: '', vendorType: 'PARTS', phone: '', address: '', province: '',
  taxId: '', branchCode: '', peakVendorCode: '', whtType: 'NONE',
  whtRate: 0, isVatRegistered: false, paymentTerms: 30, isActive: true,
  contactType: 'ผู้ขาย',
  nationality: 'ไทย',
  businessType: 'บริษัทจำกัด',
  creditTermAr: 'ตามการตั้งค่าของกิจการ',
  creditTermArDays: 30,
  creditTermAp: 'ตามการตั้งค่าของกิจการ',
  creditTermApDays: 30,
  accountArCode: '113101',
  accountApCode: '212101',
  creditLimitType: 'ไม่กำหนดวงเงิน',
  creditLimitAmount: 0
}

export default function VendorDetailPage() {
  const params = useParams()
  const router = useRouter()
  const isNew = params.id === 'new'
  const [vendor, setVendor] = useState<any>(isNew ? DEFAULT_VENDOR : null)
  const [loading, setLoading] = useState(!isNew)
  const [isSaving, setIsSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500) }

  useEffect(() => {
    if (!isNew) {
      fetch(`/api/vendors/${params.id}`).then(res => res.json()).then(data => {
        setVendor(data.error ? null : data)
        setLoading(false)
      }).catch(err => {
        console.error(err)
        setLoading(false)
      })
    }
  }, [params.id, isNew])

  if (loading) return <div className="text-center py-12 text-[#94a3b8] animate-pulse">กำลังโหลดข้อมูล Vendor...</div>
  if (!vendor) return <div className="text-center py-12 text-[#94a3b8]">ไม่พบ Vendor</div>

  const handleSave = async () => {
    const missing = []
    if (!vendor.name) missing.push('ชื่อผู้จำหน่าย/อู่')
    
    if (missing.length > 0) {
      showToast(`⚠️ กรุณากรอกข้อมูลให้ครบถ้วน: ${missing.join(', ')}`)
      return
    }

    try {
      setIsSaving(true)
      const res = await fetch(isNew ? `/api/vendors` : `/api/vendors/${params.id}`, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vendor)
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Save failed')
      }
      showToast('บันทึกข้อมูลเรียบร้อย')
      if (isNew) {
        setTimeout(() => router.push('/vendors'), 1500)
      }
    } catch (err: any) {
      console.error(err)
      showToast(`❌ เกิดข้อผิดพลาด: ${err.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in relative">
      {toast && (
        <div className={`fixed top-6 right-6 text-white px-6 py-3 rounded-xl shadow-2xl z-50 animate-in slide-in-from-top-4 font-medium flex items-center gap-2 ${toast.includes('❌') || toast.includes('⚠️') ? 'bg-red-600' : 'bg-green-600'}`}>
          {!toast.includes('❌') && !toast.includes('⚠️') && !toast.includes('✅') && '✅ '}
          <span>{toast}</span>
        </div>
      )}
      <div className="flex items-center gap-4">
        <Link href="/vendors"><Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button></Link>
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a]">{isNew ? 'สร้าง Vendor / อู่ ใหม่' : (vendor.name || 'Vendor')}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge className={vendor.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}>
              {vendor.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">ข้อมูลทั่วไป</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#94a3b8] font-medium">ชื่อผู้จำหน่าย/อู่ <span className="text-red-500">*</span></label>
                <input type="text" className="w-full mt-1.5 p-2 text-sm border rounded-md" value={vendor.name || ''} onChange={e => setVendor({...vendor, name: e.target.value})} />
              </div>
              <div>
                <label className="text-xs text-[#94a3b8] font-medium">ประเภท Vendor</label>
                <select className="w-full mt-1.5 p-2 text-sm border rounded-md" value={vendor.vendorType || 'PARTS'} onChange={e => setVendor({...vendor, vendorType: e.target.value})}>
                  <option value="PARTS">ผู้จำหน่ายอะไหล่ (Parts)</option>
                  <option value="GARAGE">อู่ (Garage)</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-[#94a3b8] font-medium">เครดิต (วัน)</label>
                <input type="number" className="w-full mt-1.5 p-2 text-sm border rounded-md" value={vendor.paymentTerms || 30} onChange={e => setVendor({...vendor, paymentTerms: Number(e.target.value)})} />
              </div>
              <div>
                <label className="text-xs text-[#94a3b8] font-medium">% วางบิล (Billing %)</label>
                <div className="flex items-center gap-2 mt-1.5">
                  <input type="number" className="w-full p-2 text-sm border rounded-md" value={vendor.billingPct ?? 100} onChange={e => setVendor({...vendor, billingPct: Number(e.target.value)})} min={0} max={100} step={0.1} />
                  <span className="text-sm text-gray-500">%</span>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">% ของยอดอนุมัติที่ vendor จะมาวางบิลจริง (default 100%)</p>
              </div>
              <div>
                <label className="text-xs text-[#94a3b8] font-medium">เบอร์โทรศัพท์</label>
                <input type="text" className="w-full mt-1.5 p-2 text-sm border rounded-md" value={vendor.phone || ''} onChange={e => setVendor({...vendor, phone: e.target.value})} />
              </div>
              <div>
                <label className="text-xs text-[#94a3b8] font-medium">จังหวัด</label>
                <input 
                  type="text"
                  className="w-full mt-1.5 p-2 text-sm border rounded-md" 
                  value={vendor.province || ''}
                  onChange={(e) => setVendor({ ...vendor, province: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-[#94a3b8] font-medium">ที่อยู่ (Address)</label>
                <textarea 
                  className="w-full mt-1.5 p-2 text-sm border rounded-md" 
                  rows={2} 
                  defaultValue={vendor.address || ''} 
                  onChange={e => setVendor({...vendor, address: e.target.value})}
                ></textarea>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2">ข้อมูลภาษี</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-xs text-[#94a3b8] font-medium">เลขผู้เสียภาษี 13 หลัก</label>
                <input type="text" className="w-full mt-1.5 p-2 text-sm border rounded-md" value={vendor.taxId || ''} onChange={e => setVendor({...vendor, taxId: e.target.value})} />
              </div>
              <div>
                <label className="text-xs text-[#94a3b8] font-medium">รหัสสาขา 5 หลัก</label>
                <input type="text" className="w-full mt-1.5 p-2 text-sm border rounded-md" value={vendor.branchCode || '00000'} onChange={e => setVendor({...vendor, branchCode: e.target.value})} />
              </div>
              <div>
                <label className="text-xs text-[#94a3b8] font-medium">ออกใบกำกับภาษี</label>
                <select className="w-full mt-1.5 p-2 text-sm border rounded-md" value={String(vendor.isVatRegistered)} onChange={e => setVendor({...vendor, isVatRegistered: e.target.value === 'true'})}>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-[#94a3b8] font-medium">ภ.ง.ด.</label>
                <select className="w-full mt-1.5 p-2 text-sm border rounded-md" value={vendor.whtType || '53'} onChange={e => setVendor({...vendor, whtType: e.target.value})}>
                  <option value="1">ภ.ง.ด. 1</option>
                  <option value="3">ภ.ง.ด. 3</option>
                  <option value="53">ภ.ง.ด. 53</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-[#94a3b8] font-medium">% หัก ณ ที่จ่าย</label>
                <input type="number" className="w-full mt-1.5 p-2 text-sm border rounded-md" value={vendor.whtRate || 0} onChange={e => setVendor({...vendor, whtRate: Number(e.target.value)})} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-indigo-700">
                ตั้งค่าการเชื่อมต่อระบบบัญชี PEAK
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs text-[#94a3b8] font-medium">ประเภทผู้ติดต่อ *</label>
                <select className="w-full mt-1.5 p-2 text-sm border rounded-md" value={vendor.contactType || 'ผู้ขาย'} onChange={e => setVendor({...vendor, contactType: e.target.value})}>
                  <option value="ไม่ระบุ">ไม่ระบุ</option>
                  <option value="ลูกค้า">ลูกค้า</option>
                  <option value="ผู้ขาย">ผู้ขาย</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-[#94a3b8] font-medium">สัญชาติ *</label>
                <input type="text" className="w-full mt-1.5 p-2 text-sm border rounded-md" value={vendor.nationality || 'ไทย'} onChange={e => setVendor({...vendor, nationality: e.target.value})} />
              </div>
              <div>
                <label className="text-xs text-[#94a3b8] font-medium">ประเภทกิจการ *</label>
                <select className="w-full mt-1.5 p-2 text-sm border rounded-md" value={vendor.businessType || 'บริษัทจำกัด'} onChange={e => setVendor({...vendor, businessType: e.target.value})}>
                  <option value="บริษัทจำกัด">บริษัทจำกัด</option>
                  <option value="บุคคลธรรมดา">บุคคลธรรมดา</option>
                  <option value="ห้างหุ้นส่วนจำกัด">ห้างหุ้นส่วนจำกัด</option>
                  <option value="ห้างหุ้นส่วนสามัญ">ห้างหุ้นส่วนสามัญ</option>
                  <option value="ร้านค้า">ร้านค้า</option>
                  <option value="คณะบุคคล">คณะบุคคล</option>
                  <option value="บริษัทมหาชนจำกัด">บริษัทมหาชนจำกัด</option>
                  <option value="มูลนิธิ">มูลนิธิ</option>
                  <option value="สมาคม">สมาคม</option>
                  <option value="กิจการร่วมค้า">กิจการร่วมค้า</option>
                  <option value="อื่น ๆ">อื่น ๆ</option>
                </select>
              </div>
              
              <div className="border-t md:col-span-2 my-2"></div>
              
              <div>
                <label className="text-xs text-[#94a3b8] font-medium">ครบกำหนดชำระใบแจ้งหนี้ *</label>
                <select className="w-full mt-1.5 p-2 text-sm border rounded-md" value={vendor.creditTermAr || 'ตามการตั้งค่าของกิจการ'} onChange={e => setVendor({...vendor, creditTermAr: e.target.value})}>
                  <option value="ตามการตั้งค่าของกิจการ">ตามการตั้งค่าของกิจการ</option>
                  <option value="X วันหลังวันที่ออกเอกสาร">X วันหลังวันที่ออกเอกสาร</option>
                  <option value="วันที่ X ของเดือนถัดไป">วันที่ X ของเดือนถัดไป</option>
                  <option value="สิ้นเดือนของวันที่ออกเอกสาร">สิ้นเดือนของวันที่ออกเอกสาร</option>
                  <option value="สิ้นเดือนของเดือนถัดไป">สิ้นเดือนของเดือนถัดไป</option>
                </select>
              </div>
              {(vendor.creditTermAr === 'X วันหลังวันที่ออกเอกสาร' || vendor.creditTermAr === 'วันที่ X ของเดือนถัดไป') && (
                <div>
                  <label className="text-xs text-[#94a3b8] font-medium">จำนวนวัน / วันที่ (ตัวแปร X)</label>
                  <input type="number" className="w-full mt-1.5 p-2 text-sm border rounded-md" value={vendor.creditTermArDays ?? 30} onChange={e => setVendor({...vendor, creditTermArDays: Number(e.target.value)})} />
                </div>
              )}
              
              <div>
                <label className="text-xs text-[#94a3b8] font-medium">ครบกำหนดบันทึกรายจ่าย *</label>
                <select className="w-full mt-1.5 p-2 text-sm border rounded-md" value={vendor.creditTermAp || 'ตามการตั้งค่าของกิจการ'} onChange={e => setVendor({...vendor, creditTermAp: e.target.value})}>
                  <option value="ตามการตั้งค่าของกิจการ">ตามการตั้งค่าของกิจการ</option>
                  <option value="X วันหลังวันที่ออกเอกสาร">X วันหลังวันที่ออกเอกสาร</option>
                  <option value="วันที่ X ของเดือนถัดไป">วันที่ X ของเดือนถัดไป</option>
                  <option value="สิ้นเดือนของวันที่ออกเอกสาร">สิ้นเดือนของวันที่ออกเอกสาร</option>
                  <option value="สิ้นเดือนของเดือนถัดไป">สิ้นเดือนของเดือนถัดไป</option>
                </select>
              </div>
              {(vendor.creditTermAp === 'X วันหลังวันที่ออกเอกสาร' || vendor.creditTermAp === 'วันที่ X ของเดือนถัดไป') && (
                <div>
                  <label className="text-xs text-[#94a3b8] font-medium">จำนวนวัน / วันที่ (ตัวแปร X)</label>
                  <input type="number" className="w-full mt-1.5 p-2 text-sm border rounded-md" value={vendor.creditTermApDays ?? 30} onChange={e => setVendor({...vendor, creditTermApDays: Number(e.target.value)})} />
                </div>
              )}
              
              <div className="border-t md:col-span-2 my-2"></div>
              
              <div>
                <label className="text-xs text-[#94a3b8] font-medium">ผังบัญชีลูกหนี้ (Account AR Code) *</label>
                <input type="text" className="w-full mt-1.5 p-2 text-sm border rounded-md font-mono" placeholder="เช่น 113101" value={vendor.accountArCode || '113101'} onChange={e => setVendor({...vendor, accountArCode: e.target.value})} />
              </div>
              <div>
                <label className="text-xs text-[#94a3b8] font-medium">ผังบัญชีเจ้าหนี้ (Account AP Code) *</label>
                <input type="text" className="w-full mt-1.5 p-2 text-sm border rounded-md font-mono" placeholder="เช่น 212101" value={vendor.accountApCode || '212101'} onChange={e => setVendor({...vendor, accountApCode: e.target.value})} />
              </div>
              
              <div className="border-t md:col-span-2 my-2"></div>
              
              <div>
                <label className="text-xs text-[#94a3b8] font-medium">กำหนดวงเงิน *</label>
                <select className="w-full mt-1.5 p-2 text-sm border rounded-md" value={vendor.creditLimitType || 'ไม่กำหนดวงเงิน'} onChange={e => setVendor({...vendor, creditLimitType: e.target.value})}>
                  <option value="ค่าเริ่มต้น">ค่าเริ่มต้น</option>
                  <option value="ไม่กำหนดวงเงิน">ไม่กำหนดวงเงิน</option>
                  <option value="กำหนดเอง">กำหนดเอง</option>
                </select>
              </div>
              {vendor.creditLimitType === 'กำหนดเอง' && (
                <div>
                  <label className="text-xs text-[#94a3b8] font-medium">จำนวนเงินวงเงิน (Credit Limit Amount)</label>
                  <input type="number" className="w-full mt-1.5 p-2 text-sm border rounded-md" value={vendor.creditLimitAmount ?? 0} onChange={e => setVendor({...vendor, creditLimitAmount: Number(e.target.value)})} />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className={vendor.peakVendorCode ? 'border-green-200' : 'border-amber-200'}>
            <CardHeader className="pb-3 border-b bg-gray-50/50">
              <CardTitle className="text-base flex items-center justify-between">
                PEAK Integration
                {vendor.peakVendorCode ? 
                  <Badge className="bg-green-100 text-green-700 border-none">✅ พร้อม Export</Badge> : 
                  <Badge className="bg-amber-100 text-amber-700 border-none">⚠️ ขาด Code</Badge>
                }
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <label className="text-xs text-[#94a3b8] font-medium">PEAK Vendor Code</label>
              <input type="text" placeholder="เช่น V00001" className="w-full mt-1.5 p-2 text-sm border rounded-md font-mono" value={vendor.peakVendorCode || ''} onChange={e => setVendor({...vendor, peakVendorCode: e.target.value})} />
              <p className="text-[10px] text-gray-500 mt-2">
                *รหัสผู้จำหน่าย/เจ้าหนี้ ในระบบบัญชี PEAK จำเป็นต้องระบุเพื่อส่งออกเอกสาร AP
              </p>
            </CardContent>
          </Card>

          <Button className="w-full bg-[#1d4ed8]" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
          </Button>
        </div>
      </div>
    </div>
  )
}
