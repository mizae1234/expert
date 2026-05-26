"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ArrowLeft, Building2, Save } from 'lucide-react'
import { formatCurrency, getStatusColor, getStatusLabel } from '@/lib/utils'
import { formatDate } from '@/lib/date'

const DEFAULT_INSURANCE = {
  name: '', 
  branch: 'สำนักงานใหญ่', 
  contactPerson: '', 
  taxId: '', 
  address: '',
  branchCode: '00000', 
  isVatRegistered: false, 
  peakCustomerId: '',
  contactType: 'ลูกค้า',
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

export default function InsuranceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const isNew = params.id === 'new'
  const [insurance, setInsurance] = useState<any>(isNew ? DEFAULT_INSURANCE : null)
  const [loading, setLoading] = useState(!isNew)
  const [isSaving, setIsSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500) }

  useEffect(() => {
    if (!isNew) {
      fetch(`/api/insurances/${params.id}`).then(res => res.json()).then(data => {
        setInsurance(data.error ? null : data)
        setLoading(false)
      }).catch(err => {
        console.error(err)
        setLoading(false)
      })
    }
  }, [params.id, isNew])

  if (loading) return <div className="text-center py-12 text-[#94a3b8] animate-pulse">กำลังโหลดข้อมูล...</div>
  if (!insurance) return <div className="text-center py-12 text-[#94a3b8]">ไม่พบข้อมูล</div>
  
  const handleSave = async () => {
    const missing = []
    if (!insurance.name) missing.push('ชื่อบริษัทประกัน')
    
    if (missing.length > 0) {
      showToast(`⚠️ กรุณากรอกข้อมูลให้ครบถ้วน: ${missing.join(', ')}`)
      return
    }

    try {
      setIsSaving(true)
      const res = await fetch(isNew ? `/api/insurances` : `/api/insurances/${params.id}`, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(insurance)
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Save failed')
      }
      showToast('✅ บันทึกข้อมูลเรียบร้อย')
      if (isNew) {
        setTimeout(() => router.push('/insurances'), 1500)
      }
    } catch (err: any) {
      console.error(err)
      showToast(`❌ เกิดข้อผิดพลาด: ${err.message}`)
    } finally {
      setIsSaving(false)
    }
  }
  
  const claims = insurance.claims || []

  const totalRevenue = claims.filter((c: any) => c.insuranceInvoice).reduce((s: number, c: any) => s + (c.insuranceInvoice?.grandTotal || 0), 0)

  return (
    <div className="space-y-6 animate-fade-in relative">
      {toast && (
        <div className={`fixed top-6 right-6 text-white px-6 py-3 rounded-xl shadow-2xl z-50 animate-in slide-in-from-top-4 font-medium flex items-center gap-2 ${toast.includes('❌') || toast.includes('⚠️') ? 'bg-red-600' : 'bg-green-600'}`}>
          {!toast.includes('❌') && !toast.includes('⚠️') && !toast.includes('✅') && '✅ '}
          <span>{toast}</span>
        </div>
      )}
      <div className="flex items-center gap-4">
        <Link href="/insurances"><Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button></Link>
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a]">{isNew ? 'เพิ่มบริษัทประกัน' : (insurance.name || 'บริษัทประกัน')}</h1>
          {!isNew && <p className="text-sm text-[#94a3b8] mt-1">{insurance.branch}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: 'จำนวน Claim', value: claims.length },
              { label: 'รายได้รวม', value: `฿${formatCurrency(totalRevenue)}` },
            ].map(s => (
              <Card key={s.label}><CardContent className="p-4"><p className="text-xs text-[#94a3b8]">{s.label}</p><p className="text-lg font-bold mt-1">{s.value}</p></CardContent></Card>
            ))}
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2">ข้อมูลบริษัทและภาษี</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-6">
              <div className="col-span-2">
                <label className="text-xs text-[#94a3b8] font-medium">ชื่อบริษัทประกัน <span className="text-red-500">*</span></label>
                <input type="text" className="w-full mt-1.5 p-2 text-sm border rounded-md" value={insurance.name || ''} onChange={e => setInsurance({...insurance, name: e.target.value})} />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-[#94a3b8] font-medium">สาขา</label>
                <input type="text" className="w-full mt-1.5 p-2 text-sm border rounded-md" value={insurance.branch || ''} onChange={e => setInsurance({...insurance, branch: e.target.value})} />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-[#94a3b8] font-medium">ที่อยู่ในการวางบิล</label>
                <textarea rows={2} className="w-full mt-1.5 p-2 text-sm border rounded-md" value={insurance.address || ''} onChange={e => setInsurance({...insurance, address: e.target.value})} />
              </div>
              <div>
                <label className="text-xs text-[#94a3b8] font-medium">ชื่อผู้ติดต่อ</label>
                <input type="text" className="w-full mt-1.5 p-2 text-sm border rounded-md" value={insurance.contactPerson || ''} onChange={e => setInsurance({...insurance, contactPerson: e.target.value})} />
              </div>
              <div>
                <label className="text-xs text-[#94a3b8] font-medium">เลขผู้เสียภาษี 13 หลัก</label>
                <input type="text" className="w-full mt-1.5 p-2 text-sm border rounded-md" value={insurance.taxId || ''} onChange={e => setInsurance({...insurance, taxId: e.target.value})} />
              </div>
              <div>
                <label className="text-xs text-[#94a3b8] font-medium">รหัสสาขา 5 หลัก</label>
                <input type="text" className="w-full mt-1.5 p-2 text-sm border rounded-md" value={insurance.branchCode || ''} onChange={e => setInsurance({...insurance, branchCode: e.target.value})} />
              </div>
              <div>
                <label className="text-xs text-[#94a3b8] font-medium">จดทะเบียนภาษีมูลค่าเพิ่ม</label>
                <select className="w-full mt-1.5 p-2 text-sm border rounded-md" value={String(insurance.isVatRegistered)} onChange={e => setInsurance({...insurance, isVatRegistered: e.target.value === 'true'})}>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-[#94a3b8] font-medium">เครดิตเทอม (วัน)</label>
                <input type="number" className="w-full mt-1.5 p-2 text-sm border rounded-md" value={insurance.creditTermArDays ?? 30} onChange={e => setInsurance({...insurance, creditTermArDays: Number(e.target.value)})} />
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
                <select className="w-full mt-1.5 p-2 text-sm border rounded-md" value={insurance.contactType || 'ลูกค้า'} onChange={e => setInsurance({...insurance, contactType: e.target.value})}>
                  <option value="ไม่ระบุ">ไม่ระบุ</option>
                  <option value="ลูกค้า">ลูกค้า</option>
                  <option value="ผู้ขาย">ผู้ขาย</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-[#94a3b8] font-medium">สัญชาติ *</label>
                <input type="text" className="w-full mt-1.5 p-2 text-sm border rounded-md" value={insurance.nationality || 'ไทย'} onChange={e => setInsurance({...insurance, nationality: e.target.value})} />
              </div>
              <div>
                <label className="text-xs text-[#94a3b8] font-medium">ประเภทกิจการ *</label>
                <select className="w-full mt-1.5 p-2 text-sm border rounded-md" value={insurance.businessType || 'บริษัทจำกัด'} onChange={e => setInsurance({...insurance, businessType: e.target.value})}>
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
                <select className="w-full mt-1.5 p-2 text-sm border rounded-md" value={insurance.creditTermAr || 'ตามการตั้งค่าของกิจการ'} onChange={e => setInsurance({...insurance, creditTermAr: e.target.value})}>
                  <option value="ตามการตั้งค่าของกิจการ">ตามการตั้งค่าของกิจการ</option>
                  <option value="X วันหลังวันที่ออกเอกสาร">X วันหลังวันที่ออกเอกสาร</option>
                  <option value="วันที่ X ของเดือนถัดไป">วันที่ X ของเดือนถัดไป</option>
                  <option value="สิ้นเดือนของวันที่ออกเอกสาร">สิ้นเดือนของวันที่ออกเอกสาร</option>
                  <option value="สิ้นเดือนของเดือนถัดไป">สิ้นเดือนของเดือนถัดไป</option>
                </select>
              </div>
              {(insurance.creditTermAr === 'X วันหลังวันที่ออกเอกสาร' || insurance.creditTermAr === 'วันที่ X ของเดือนถัดไป') && (
                <div>
                  <label className="text-xs text-[#94a3b8] font-medium">จำนวนวัน / วันที่ (ตัวแปร X)</label>
                  <input type="number" className="w-full mt-1.5 p-2 text-sm border rounded-md" value={insurance.creditTermArDays ?? 30} onChange={e => setInsurance({...insurance, creditTermArDays: Number(e.target.value)})} />
                </div>
              )}
              
              <div>
                <label className="text-xs text-[#94a3b8] font-medium">ครบกำหนดบันทึกรายจ่าย *</label>
                <select className="w-full mt-1.5 p-2 text-sm border rounded-md" value={insurance.creditTermAp || 'ตามการตั้งค่าของกิจการ'} onChange={e => setInsurance({...insurance, creditTermAp: e.target.value})}>
                  <option value="ตามการตั้งค่าของกิจการ">ตามการตั้งค่าของกิจการ</option>
                  <option value="X วันหลังวันที่ออกเอกสาร">X วันหลังวันที่ออกเอกสาร</option>
                  <option value="วันที่ X ของเดือนถัดไป">วันที่ X ของเดือนถัดไป</option>
                  <option value="สิ้นเดือนของวันที่ออกเอกสาร">สิ้นเดือนของวันที่ออกเอกสาร</option>
                  <option value="สิ้นเดือนของเดือนถัดไป">สิ้นเดือนของเดือนถัดไป</option>
                </select>
              </div>
              {(insurance.creditTermAp === 'X วันหลังวันที่ออกเอกสาร' || insurance.creditTermAp === 'วันที่ X ของเดือนถัดไป') && (
                <div>
                  <label className="text-xs text-[#94a3b8] font-medium">จำนวนวัน / วันที่ (ตัวแปร X)</label>
                  <input type="number" className="w-full mt-1.5 p-2 text-sm border rounded-md" value={insurance.creditTermApDays ?? 30} onChange={e => setInsurance({...insurance, creditTermApDays: Number(e.target.value)})} />
                </div>
              )}
              
              <div className="border-t md:col-span-2 my-2"></div>
              
              <div>
                <label className="text-xs text-[#94a3b8] font-medium">ผังบัญชีลูกหนี้ (Account AR Code) *</label>
                <input type="text" className="w-full mt-1.5 p-2 text-sm border rounded-md font-mono" placeholder="เช่น 113101" value={insurance.accountArCode || '113101'} onChange={e => setInsurance({...insurance, accountArCode: e.target.value})} />
              </div>
              <div>
                <label className="text-xs text-[#94a3b8] font-medium">ผังบัญชีเจ้าหนี้ (Account AP Code) *</label>
                <input type="text" className="w-full mt-1.5 p-2 text-sm border rounded-md font-mono" placeholder="เช่น 212101" value={insurance.accountApCode || '212101'} onChange={e => setInsurance({...insurance, accountApCode: e.target.value})} />
              </div>
              
              <div className="border-t md:col-span-2 my-2"></div>
              
              <div>
                <label className="text-xs text-[#94a3b8] font-medium">กำหนดวงเงิน *</label>
                <select className="w-full mt-1.5 p-2 text-sm border rounded-md" value={insurance.creditLimitType || 'ไม่กำหนดวงเงิน'} onChange={e => setInsurance({...insurance, creditLimitType: e.target.value})}>
                  <option value="ค่าเริ่มต้น">ค่าเริ่มต้น</option>
                  <option value="ไม่กำหนดวงเงิน">ไม่กำหนดวงเงิน</option>
                  <option value="กำหนดเอง">กำหนดเอง</option>
                </select>
              </div>
              {insurance.creditLimitType === 'กำหนดเอง' && (
                <div>
                  <label className="text-xs text-[#94a3b8] font-medium">จำนวนเงินวงเงิน (Credit Limit Amount)</label>
                  <input type="number" className="w-full mt-1.5 p-2 text-sm border rounded-md" value={insurance.creditLimitAmount ?? 0} onChange={e => setInsurance({...insurance, creditLimitAmount: Number(e.target.value)})} />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className={insurance.peakCustomerId ? 'border-green-200' : 'border-amber-200'}>
            <CardHeader className="pb-3 border-b bg-gray-50/50">
              <CardTitle className="text-base flex items-center justify-between">
                PEAK Integration
                {insurance.peakCustomerId ? 
                  <Badge className="bg-green-100 text-green-700 border-none">✅ พร้อม Export</Badge> : 
                  <Badge className="bg-amber-100 text-amber-700 border-none">⚠️ ขาด Code</Badge>
                }
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <label className="text-xs text-[#94a3b8] font-medium">PEAK Customer Code</label>
              <input type="text" placeholder="เช่น C00001" className="w-full mt-1.5 p-2 text-sm border rounded-md font-mono" value={insurance.peakCustomerId || ''} onChange={e => setInsurance({...insurance, peakCustomerId: e.target.value})} />
              <p className="text-[10px] text-gray-500 mt-2">
                *รหัสลูกค้า/ลูกหนี้ ในระบบบัญชี PEAK จำเป็นต้องระบุเพื่อส่งออกเอกสาร AR
              </p>
            </CardContent>
          </Card>

          <Button className="w-full bg-[#1d4ed8]" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">ประวัติ Claim</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Claim No.</TableHead>
                <TableHead>ทะเบียน</TableHead>
                <TableHead>ผู้เอาประกัน</TableHead>
                <TableHead>วันที่</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {claims.map((c: any) => {
                const sc = getStatusColor(c.status)
                return (
                  <TableRow key={c.id}>
                    <TableCell><Link href={`/claims/${c.id}`} className="text-[#1d4ed8] hover:underline font-semibold">{c.claimNo}</Link></TableCell>
                    <TableCell>{c.carPlate}</TableCell>
                    <TableCell>{c.insuredName}</TableCell>
                    <TableCell>{formatDate(c.createdAt)}</TableCell>
                    <TableCell><span className={`status-badge ${sc.bg} ${sc.text}`}>{getStatusLabel(c.status)}</span></TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
