"use client"

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Phone, MapPin, Building2 } from 'lucide-react'

export default function VendorDetailPage() {
  const params = useParams()
  const [vendor, setVendor] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/vendors/${params.id}`).then(res => res.json()).then(data => {
      setVendor(data.error ? null : data)
      setLoading(false)
    }).catch(err => {
      console.error(err)
      setLoading(false)
    })
  }, [params.id])

  if (loading) return <div className="text-center py-12 text-[#94a3b8] animate-pulse">กำลังโหลดข้อมูล Vendor...</div>
  if (!vendor) return <div className="text-center py-12 text-[#94a3b8]">ไม่พบ Vendor</div>

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link href="/vendors"><Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button></Link>
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a]">{vendor.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline">{vendor.vendorType === 'PARTS' ? 'ผู้จำหน่ายอะไหล่' : 'อู่'}</Badge>
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
                <label className="text-xs text-[#94a3b8] font-medium">ชื่อผู้จำหน่าย/อู่</label>
                <div className="text-sm font-medium mt-1">{vendor.name}</div>
              </div>
              <div>
                <label className="text-xs text-[#94a3b8] font-medium">เครดิต (วัน)</label>
                <div className="text-sm font-medium mt-1">{vendor.paymentTerms}</div>
              </div>
              <div>
                <label className="text-xs text-[#94a3b8] font-medium">เบอร์โทรศัพท์</label>
                <div className="text-sm font-medium mt-1">{vendor.phone || '-'}</div>
              </div>
              <div>
                <label className="text-xs text-[#94a3b8] font-medium">จังหวัด</label>
                <div className="text-sm font-medium mt-1">{vendor.province || '-'}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2">ข้อมูลภาษี</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-xs text-[#94a3b8] font-medium">เลขผู้เสียภาษี 13 หลัก</label>
                <input type="text" className="w-full mt-1.5 p-2 text-sm border rounded-md" defaultValue={vendor.taxId || ''} />
              </div>
              <div>
                <label className="text-xs text-[#94a3b8] font-medium">รหัสสาขา 5 หลัก</label>
                <input type="text" className="w-full mt-1.5 p-2 text-sm border rounded-md" defaultValue={vendor.branchCode || '00000'} />
              </div>
              <div>
                <label className="text-xs text-[#94a3b8] font-medium">ออกใบกำกับภาษี</label>
                <select className="w-full mt-1.5 p-2 text-sm border rounded-md">
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-[#94a3b8] font-medium">ภ.ง.ด.</label>
                <select className="w-full mt-1.5 p-2 text-sm border rounded-md" defaultValue={vendor.whtType || '53'}>
                  <option value="1">ภ.ง.ด. 1</option>
                  <option value="3">ภ.ง.ด. 3</option>
                  <option value="53">ภ.ง.ด. 53</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-[#94a3b8] font-medium">% หัก ณ ที่จ่าย</label>
                <input type="number" className="w-full mt-1.5 p-2 text-sm border rounded-md" defaultValue={0} />
              </div>
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
              <input type="text" placeholder="เช่น V00001" className="w-full mt-1.5 p-2 text-sm border rounded-md font-mono" defaultValue={vendor.peakVendorCode || ''} />
              <p className="text-[10px] text-gray-500 mt-2">
                *รหัสผู้จำหน่าย/เจ้าหนี้ ในระบบบัญชี PEAK จำเป็นต้องระบุเพื่อส่งออกเอกสาร AP
              </p>
            </CardContent>
          </Card>

          <Button className="w-full bg-[#1d4ed8]">บันทึกข้อมูล</Button>
        </div>
      </div>
    </div>
  )
}
