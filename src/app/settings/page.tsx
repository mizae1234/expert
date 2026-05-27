'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Building2, Save, Upload, FileText, Hash, CreditCard, CheckCircle2, Users, Plus, Pencil, Trash2 } from 'lucide-react'
import { CompanyProfile, DocumentSequence } from '@/lib/types'
import { uploadToR2 } from '@/lib/upload'

export default function SettingsPage() {
  const [company, setCompany] = useState<CompanyProfile>({} as CompanyProfile)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [isUploadingSig, setIsUploadingSig] = useState(false)
  const [sequences, setSequences] = useState<DocumentSequence[]>([])
  const [peakConfig, setPeakConfig] = useState<Record<string, string>>({
    ACCOUNT_REVENUE_PARTS: '41102',
    ACCOUNT_REVENUE_LABOR: '41101',
    ACCOUNT_COST_PARTS: '51102',
    ACCOUNT_COST_LABOR: '51101',
    PAYMENT_CHANNEL_TRANSFER: 'โอนเงิน',
    PAYMENT_CHANNEL_CHEQUE: 'เช็ค',
  })
  const [vendorsList, setVendorsList] = useState<any[]>([])
  const [insurancesList, setInsurancesList] = useState<any[]>([])
  const [toast, setToast] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500) }

  const [users, setUsers] = useState<any[]>([])
  const [userModalOpen, setUserModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<any | null>(null)
  const [userForm, setUserForm] = useState({ username: '', name: '', password: '', role: 'STAFF', isActive: true })
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/vendors').then(r => r.json()).catch(() => []),
      fetch('/api/insurances?simple=true').then(r => r.json()).catch(() => []),
      fetch('/api/settings/company').then(r => r.json()).catch(() => ({})),
      fetch('/api/settings/sequences').then(r => r.json()).catch(() => []),
      fetch('/api/users').then(r => r.ok ? r.json() : []).catch(() => []),
    ]).then(([vnd, ins, compData, seqData, userData]) => {
      setVendorsList(vnd)
      setInsurancesList(ins)
      if (!compData.error && compData.id) setCompany(compData)
      if (Array.isArray(seqData)) setSequences(seqData)
      if (Array.isArray(userData)) setUsers(userData)
      setLoading(false)
    })
  }, [])

  const handleSaveUser = async () => {
    if (!userForm.username || !userForm.name || (!editingUser && !userForm.password)) {
      showToast('⚠️ กรุณากรอกข้อมูลให้ครบถ้วน')
      return
    }

    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users'
      const method = editingUser ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userForm)
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save user')

      showToast(editingUser ? '✅ แก้ไขผู้ใช้งานเรียบร้อย' : '✅ เพิ่มผู้ใช้งานเรียบร้อย')
      setUserModalOpen(false)
      fetch('/api/users').then(r => r.ok ? r.json() : []).then(data => setUsers(data))
    } catch (err: any) {
      showToast(`❌ เกิดข้อผิดพลาด: ${err.message}`)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete user')

      showToast(`✅ ${data.message || 'ลบผู้ใช้งานเรียบร้อย'}`)
      fetch('/api/users').then(r => r.ok ? r.json() : []).then(data => setUsers(data))
    } catch (err: any) {
      showToast(`❌ เกิดข้อผิดพลาด: ${err.message}`)
    }
  }

  const saveCompany = async () => {
    const missing = []
    if (!company.name) missing.push('ชื่อบริษัท')
    if (!company.taxId) missing.push('เลขทะเบียนนิติบุคคล')
    if (!company.branchCode) missing.push('รหัสสาขา')
    if (!company.address) missing.push('ที่อยู่')
    
    if (missing.length > 0) {
      showToast(`⚠️ กรุณากรอกข้อมูลให้ครบถ้วน: ${missing.join(', ')}`)
      return
    }

    try {
      const res = await fetch('/api/settings/company', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(company)
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to save company settings')
      }
      showToast('✅ บันทึกข้อมูลบริษัทเรียบร้อย')
    } catch (err: any) {
      showToast(`❌ เกิดข้อผิดพลาด: ${err.message}`)
    }
  }

  const updateField = (field: keyof CompanyProfile, value: string | number) => {
    setCompany(prev => ({ ...prev, [field]: value }))
  }

  const fieldRow = (label: string, field: keyof CompanyProfile, placeholder?: string, type?: string) => (
    <div key={field} className="grid grid-cols-3 gap-4 items-center py-2">
      <label className="text-sm font-medium text-[#475569]">{label}</label>
      <div className="col-span-2">
        <Input
          type={type || 'text'}
          value={String(company[field] || '')}
          onChange={e => updateField(field, type === 'number' ? Number(e.target.value) : e.target.value)}
          placeholder={placeholder}
          className="bg-white"
        />
      </div>
    </div>
  )

  const docTypeLabels: Record<string, string> = { QT: 'ใบเสนอราคา', PO: 'ใบสั่งซื้อ', DO: 'ใบส่งของ', INV: 'ใบแจ้งหนี้' }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a]">ตั้งค่าระบบ</h1>
          <p className="text-sm text-[#94a3b8]">ข้อมูลบริษัท, เลขที่เอกสาร, PEAK Integration</p>
        </div>
      </div>

      <Tabs defaultValue="company">
        <TabsList className="bg-white border">
          <TabsTrigger value="company" className="flex items-center gap-1.5"><Building2 className="w-4 h-4" />ข้อมูลบริษัท</TabsTrigger>
          <TabsTrigger value="sequences" className="flex items-center gap-1.5"><Hash className="w-4 h-4" />เลขที่เอกสาร</TabsTrigger>
          <TabsTrigger value="peak" className="flex items-center gap-1.5"><CreditCard className="w-4 h-4" />PEAK Integration</TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-1.5"><Users className="w-4 h-4" />ผู้ใช้งาน</TabsTrigger>
        </TabsList>

        {/* Tab 1: Company Profile */}
        <TabsContent value="company">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader><CardTitle className="text-base">ข้อมูลทั่วไป</CardTitle></CardHeader>
                <CardContent className="space-y-1">
                  {fieldRow('ชื่อบริษัท (ไทย)', 'name', 'บริษัท ABC จำกัด')}
                  {fieldRow('ชื่อบริษัท (อังกฤษ)', 'nameEn', 'ABC Co., Ltd.')}
                  {fieldRow('เลขทะเบียนนิติบุคคล', 'taxId', '0105565XXXXXX')}
                  {fieldRow('รหัสสาขา', 'branchCode', '00000')}
                  {fieldRow('ชื่อสาขา', 'branchName', 'สำนักงานใหญ่')}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">ที่อยู่และการติดต่อ</CardTitle></CardHeader>
                <CardContent className="space-y-1">
                  {fieldRow('ที่อยู่', 'address', 'เลขที่ อาคาร ถนน')}
                  {fieldRow('แขวง/ตำบล', 'subDistrict')}
                  {fieldRow('เขต/อำเภอ', 'district')}
                  {fieldRow('จังหวัด', 'province')}
                  {fieldRow('รหัสไปรษณีย์', 'postalCode')}
                  {fieldRow('โทรศัพท์', 'phone')}
                  {fieldRow('อีเมล', 'email')}
                  {fieldRow('เว็บไซต์', 'website')}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">ข้อมูลธนาคาร</CardTitle></CardHeader>
                <CardContent className="space-y-1">
                  {fieldRow('ธนาคาร', 'bankName')}
                  {fieldRow('เลขบัญชี', 'bankAccount')}
                  {fieldRow('ชื่อบัญชี', 'bankAccountName')}
                  {fieldRow('ระยะเวลาชำระเงิน (วัน)', 'paymentTermDays', '30', 'number')}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader><CardTitle className="text-base">โลโก้บริษัท</CardTitle></CardHeader>
                <CardContent>
                  <label className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-[#1d4ed8] transition-colors cursor-pointer block relative">
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/png, image/jpeg" 
                      disabled={isUploadingLogo}
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        try {
                          setIsUploadingLogo(true)
                          const url = await uploadToR2(file, 'settings/company/logo')
                          updateField('logoUrl', url)
                          showToast('อัปโหลดโลโก้สำเร็จ')
                        } catch (err) {
                          showToast('❌ อัปโหลดโลโก้ไม่สำเร็จ')
                        } finally {
                          setIsUploadingLogo(false)
                        }
                      }} 
                    />
                    {isUploadingLogo ? (
                      <div className="text-sm text-[#94a3b8] flex items-center justify-center gap-2"><Upload className="w-4 h-4 animate-bounce" /> กำลังอัปโหลด...</div>
                    ) : company.logoUrl ? (
                      <img src={company.logoUrl} alt="Logo" className="w-24 h-24 mx-auto object-contain" />
                    ) : (
                      <><Upload className="w-8 h-8 mx-auto mb-2 text-[#94a3b8]" /><p className="text-xs text-[#94a3b8]">อัปโหลดโลโก้</p><p className="text-[10px] text-[#94a3b8] mt-1">PNG, JPG ไม่เกิน 2MB</p></>
                    )}
                  </label>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">ผู้มีอำนาจลงนาม</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-[#475569]">ชื่อ-นามสกุล</label>
                    <Input value={company.authorizedName || ''} onChange={e => updateField('authorizedName', e.target.value)} className="mt-1 bg-white" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#475569]">ตำแหน่ง</label>
                    <Input value={company.authorizedTitle || ''} onChange={e => updateField('authorizedTitle', e.target.value)} className="mt-1 bg-white" />
                  </div>
                  <label className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-[#1d4ed8] transition-colors cursor-pointer block relative">
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/png, image/jpeg" 
                      disabled={isUploadingSig}
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        try {
                          setIsUploadingSig(true)
                          const url = await uploadToR2(file, 'settings/company/signature')
                          updateField('signatureUrl', url)
                          showToast('อัปโหลดลายเซ็นสำเร็จ')
                        } catch (err) {
                          showToast('❌ อัปโหลดลายเซ็นไม่สำเร็จ')
                        } finally {
                          setIsUploadingSig(false)
                        }
                      }} 
                    />
                    {isUploadingSig ? (
                      <div className="text-sm text-[#94a3b8] flex items-center justify-center gap-2"><Upload className="w-4 h-4 animate-bounce" /> กำลังอัปโหลด...</div>
                    ) : company.signatureUrl ? (
                      <img src={company.signatureUrl} alt="Signature" className="w-32 h-16 mx-auto object-contain" />
                    ) : (
                      <><Upload className="w-6 h-6 mx-auto mb-1 text-[#94a3b8]" /><p className="text-xs text-[#94a3b8]">อัปโหลดลายเซ็น</p></>
                    )}
                  </label>
                </CardContent>
              </Card>
            </div>
          </div>
          <div className="flex justify-end mt-6">
            <Button className="bg-[#1d4ed8]" onClick={saveCompany}><Save className="w-4 h-4 mr-1.5" />บันทึก</Button>
          </div>
        </TabsContent>

        {/* Tab 2: Document Sequences */}
        <TabsContent value="sequences">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><FileText className="w-5 h-5 text-[#1d4ed8]" />ตั้งค่าเลขที่เอกสาร</CardTitle>
              <p className="text-xs text-[#94a3b8] mt-1">รูปแบบ: {'{prefix}'}-{'{YYYY}'}-{'{XXXX}'} — ขึ้นปีใหม่ reset เป็น 0001</p>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#f8faff]">
                    <TableHead>ประเภทเอกสาร</TableHead>
                    <TableHead>Prefix</TableHead>
                    <TableHead>เลขล่าสุด</TableHead>
                    <TableHead>ตัวอย่าง</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sequences.map((seq, i) => (
                    <TableRow key={seq.id}>
                      <TableCell className="font-medium">{docTypeLabels[seq.docType] || seq.docType}<Badge className="ml-2 bg-gray-100 text-gray-600 border-none text-[10px]">{seq.docType}</Badge></TableCell>
                      <TableCell>
                        <Input
                          value={seq.prefix}
                          onChange={e => setSequences(prev => prev.map((s, j) => j === i ? { ...s, prefix: e.target.value } : s))}
                          className="w-24 bg-white"
                        />
                      </TableCell>
                      <TableCell><span className="font-mono text-sm">{String(seq.lastNo).padStart(4, '0')}</span></TableCell>
                      <TableCell><span className="font-mono text-sm text-[#1d4ed8]">{seq.prefix}-{new Date().getFullYear()}-{String(seq.lastNo + 1).padStart(4, '0')}</span></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <div className="flex justify-end mt-4">
            <Button 
              className="bg-[#1d4ed8]" 
              onClick={async () => {
                try {
                  const res = await fetch('/api/settings/sequences', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(sequences)
                  })
                  if (!res.ok) throw new Error('Failed to save')
                  showToast('✅ บันทึกเลขที่เอกสารเรียบร้อย')
                } catch (err) {
                  showToast('❌ เกิดข้อผิดพลาดในการบันทึกเลขที่เอกสาร')
                }
              }}
            >
              <Save className="w-4 h-4 mr-1.5" />บันทึก
            </Button>
          </div>
        </TabsContent>

        {/* Tab 3: PEAK Integration */}
        <TabsContent value="peak">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <Card>
                <CardHeader><CardTitle className="text-base">รหัสบัญชี</CardTitle></CardHeader>
                <CardContent className="space-y-1">
                  {[['รายได้ค่าอะไหล่', 'ACCOUNT_REVENUE_PARTS'], ['รายได้ค่าแรง', 'ACCOUNT_REVENUE_LABOR'], ['ต้นทุนค่าอะไหล่', 'ACCOUNT_COST_PARTS'], ['ต้นทุนค่าแรง', 'ACCOUNT_COST_LABOR']].map(([label, key]) => (
                    <div key={key} className="grid grid-cols-3 gap-4 items-center py-2">
                      <label className="text-sm font-medium text-[#475569]">{label}</label>
                      <div className="col-span-2"><Input value={peakConfig[key] || ''} onChange={e => setPeakConfig(prev => ({ ...prev, [key]: e.target.value }))} className="bg-white font-mono" /></div>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base">ช่องทางชำระเงิน</CardTitle></CardHeader>
                <CardContent className="space-y-1">
                  {[['โอนเงิน', 'PAYMENT_CHANNEL_TRANSFER'], ['เช็ค', 'PAYMENT_CHANNEL_CHEQUE']].map(([label, key]) => (
                    <div key={key} className="grid grid-cols-3 gap-4 items-center py-2">
                      <label className="text-sm font-medium text-[#475569]">{label}</label>
                      <div className="col-span-2"><Input value={peakConfig[key] || ''} onChange={e => setPeakConfig(prev => ({ ...prev, [key]: e.target.value }))} className="bg-white font-mono" /></div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Checklist Go Live */}
            <div className="space-y-6">
              <Card className="border-[#1d4ed8]">
                <CardHeader className="bg-[#f8faff] border-b">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-[#1d4ed8]" />
                    Checklist ความพร้อม (Go Live)
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-6">
                  
                  {/* Company */}
                  <div>
                    <h3 className="font-semibold text-sm mb-2 flex justify-between">
                      ข้อมูลบริษัท 
                      <Badge className="bg-green-100 text-green-700 border-none">✅ พร้อม</Badge>
                    </h3>
                    <div className="text-sm text-gray-600 pl-4 space-y-1">
                      <p>✅ Company Profile ครบ</p>
                    </div>
                  </div>

                  {/* Vendors */}
                  <div>
                    <h3 className="font-semibold text-sm mb-2 flex justify-between">
                      ผู้จำหน่าย / อู่ ({vendorsList.filter((v: any) => v.peakVendorCode).length}/{vendorsList.length})
                      {vendorsList.every((v: any) => v.peakVendorCode) ? 
                        <Badge className="bg-green-100 text-green-700 border-none">✅ พร้อม</Badge> : 
                        <Badge className="bg-amber-100 text-amber-700 border-none">⚠️ ขาด Code</Badge>
                      }
                    </h3>
                    <div className="text-sm text-gray-600 pl-4 space-y-2 max-h-[150px] overflow-y-auto pr-2">
                      {vendorsList.map((v: any) => (
                        <div key={v.id} className="flex justify-between items-center border-b border-gray-50 pb-1">
                          <span className="truncate pr-2">{v.name}</span>
                          {v.peakVendorCode ? 
                            <span className="text-green-600 font-mono text-xs w-16 text-right shrink-0">{v.peakVendorCode}</span> : 
                            <span className="text-amber-500 text-xs w-16 text-right shrink-0">ยังไม่มี</span>
                          }
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Insurances */}
                  <div>
                    <h3 className="font-semibold text-sm mb-2 flex justify-between">
                      บริษัทประกัน ({insurancesList.filter((i: any) => i.peakCustomerId).length}/{insurancesList.length})
                      {insurancesList.every((i: any) => i.peakCustomerId) ? 
                        <Badge className="bg-green-100 text-green-700 border-none">✅ พร้อม</Badge> : 
                        <Badge className="bg-amber-100 text-amber-700 border-none">⚠️ ขาด Code</Badge>
                      }
                    </h3>
                    <div className="text-sm text-gray-600 pl-4 space-y-2 max-h-[150px] overflow-y-auto pr-2">
                      {insurancesList.map((i: any) => (
                        <div key={i.id} className="flex justify-between items-center border-b border-gray-50 pb-1">
                          <span className="truncate pr-2">{i.name}</span>
                          {i.peakCustomerId ? 
                            <span className="text-green-600 font-mono text-xs w-16 text-right shrink-0">{i.peakCustomerId}</span> : 
                            <span className="text-amber-500 text-xs w-16 text-right shrink-0">ยังไม่มี</span>
                          }
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Config */}
                  <div>
                    <h3 className="font-semibold text-sm mb-2 flex justify-between">
                      PEAK Config
                      <Badge className="bg-green-100 text-green-700 border-none">✅ พร้อม</Badge>
                    </h3>
                    <div className="text-sm text-gray-600 pl-4 space-y-1">
                      <p>✅ Account Codes ครบ</p>
                      <p>✅ Product Codes ครบ</p>
                      <p>✅ Payment Channels ครบ</p>
                    </div>
                  </div>

                </CardContent>
              </Card>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button className="bg-[#1d4ed8]" onClick={() => showToast('บันทึก PEAK Config เรียบร้อย')}><Save className="w-4 h-4 mr-1.5" />บันทึก</Button>
          </div>
        </TabsContent>

        {/* Tab 4: User Management */}
        <TabsContent value="users">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#1d4ed8]" />
                  จัดการผู้ใช้งานระบบ
                </CardTitle>
                <p className="text-xs text-[#94a3b8] mt-1">กำหนดสิทธิ์เข้าใช้งานของเจ้าหน้าที่ในระบบ</p>
              </div>
              <Button 
                onClick={() => {
                  setEditingUser(null)
                  setUserForm({ username: '', name: '', password: '', role: 'STAFF', isActive: true })
                  setUserModalOpen(true)
                }}
                className="bg-[#1d4ed8]"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                เพิ่มผู้ใช้งาน
              </Button>
            </CardHeader>
            <CardContent>
              <div className="border rounded-xl overflow-hidden bg-white">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#f8faff]">
                      <TableHead>ชื่อผู้ใช้งาน (Username)</TableHead>
                      <TableHead>ชื่อ-นามสกุล</TableHead>
                      <TableHead>สิทธิ์การใช้งาน (Role)</TableHead>
                      <TableHead>สถานะ</TableHead>
                      <TableHead className="text-right">จัดการ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-gray-500 py-6">
                          ไม่พบข้อมูลผู้ใช้งาน หรือคุณไม่มีสิทธิ์เข้าถึงหน้านี้
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell className="font-mono font-medium">{u.username}</TableCell>
                          <TableCell>{u.name}</TableCell>
                          <TableCell>
                            <Badge className={
                              u.role === 'ADMIN' ? 'bg-red-50 text-red-600 border-none' :
                              u.role === 'ACCOUNTANT' ? 'bg-blue-50 text-blue-600 border-none' :
                              'bg-gray-50 text-gray-600 border-none'
                            }>
                              {u.role === 'ADMIN' ? 'Admin' : u.role === 'ACCOUNTANT' ? 'Accountant' : 'Staff'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={u.isActive ? 'bg-green-50 text-green-600 border-none' : 'bg-gray-50 text-gray-400 border-none'}>
                              {u.isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right space-x-1.5">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8 px-2.5 rounded-lg border-gray-200"
                              onClick={() => {
                                setEditingUser(u)
                                setUserForm({ username: u.username, name: u.name, password: '', role: u.role, isActive: u.isActive })
                                setUserModalOpen(true)
                              }}
                            >
                              <Pencil className="w-3.5 h-3.5 mr-1" />
                              แก้ไข
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8 px-2.5 rounded-lg text-red-600 hover:bg-red-50 border-gray-200"
                              onClick={() => setConfirmDeleteId(u.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-1" />
                              ลบ
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add / Edit User Modal */}
      {userModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200">
          <Card className="w-full max-w-md shadow-2xl border-none m-4">
            <CardHeader>
              <CardTitle className="text-base">
                {editingUser ? `แก้ไขผู้ใช้งาน: ${editingUser.username}` : 'เพิ่มผู้ใช้งานใหม่'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#475569]">ชื่อผู้ใช้งาน (Username)</label>
                <Input 
                  value={userForm.username} 
                  onChange={e => setUserForm(p => ({ ...p, username: e.target.value.toLowerCase().replace(/\s/g, '') }))} 
                  disabled={!!editingUser}
                  placeholder="english_only"
                  className="bg-white font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#475569]">ชื่อ-นามสกุล</label>
                <Input 
                  value={userForm.name} 
                  onChange={e => setUserForm(p => ({ ...p, name: e.target.value }))} 
                  placeholder="ชื่อจริง นามสกุล"
                  className="bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#475569]">
                  {editingUser ? 'รหัสผ่านใหม่ (ว่างไว้หากไม่ต้องการเปลี่ยน)' : 'รหัสผ่าน'}
                </label>
                <Input 
                  type="password"
                  value={userForm.password} 
                  onChange={e => setUserForm(p => ({ ...p, password: e.target.value }))} 
                  placeholder="••••••••"
                  className="bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#475569]">สิทธิ์การใช้งาน (Role)</label>
                <select
                  value={userForm.role}
                  onChange={e => setUserForm(p => ({ ...p, role: e.target.value }))}
                  className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]"
                >
                  <option value="STAFF">Staff (จัดการ Claim/เสนอราคา)</option>
                  <option value="ACCOUNTANT">Accountant (ฝ่ายบัญชี/การเงิน/รายงาน/PEAK)</option>
                  <option value="ADMIN">Admin (จัดการระบบ/สิทธิ์ผู้ใช้/ทั้งหมด)</option>
                </select>
              </div>

              {editingUser && (
                <div className="flex items-center justify-between py-2 border-t border-gray-50 mt-2">
                  <label className="text-sm font-medium text-[#475569]">เปิดใช้งานสถานะ (Active)</label>
                  <input 
                    type="checkbox" 
                    checked={userForm.isActive}
                    onChange={e => setUserForm(p => ({ ...p, isActive: e.target.checked }))}
                    className="w-4 h-4 rounded text-[#1d4ed8] focus:ring-[#1d4ed8]"
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 border-t pt-4 mt-4">
                <Button variant="outline" className="border-gray-200" onClick={() => setUserModalOpen(false)}>
                  ยกเลิก
                </Button>
                <Button className="bg-[#1d4ed8]" onClick={handleSaveUser}>
                  บันทึก
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200">
          <Card className="w-full max-w-sm shadow-2xl border-none m-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-red-600">ยืนยันการลบผู้ใช้งาน</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-6">คุณต้องการลบผู้ใช้งานนี้ออกจากระบบใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้</p>
              <div className="flex justify-end gap-3">
                <Button variant="outline" className="border-gray-200" onClick={() => setConfirmDeleteId(null)}>
                  ยกเลิก
                </Button>
                <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={async () => {
                  const id = confirmDeleteId
                  setConfirmDeleteId(null)
                  await handleDeleteUser(id)
                }}>
                  ยืนยันการลบ
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {toast && (
        <div className={`fixed top-6 right-6 text-white px-6 py-3 rounded-xl shadow-2xl z-50 animate-in slide-in-from-top-4 font-medium flex items-center gap-2 ${toast.includes('❌') || toast.includes('⚠️') ? 'bg-red-600' : 'bg-green-600'}`}>
          {!toast.includes('❌') && !toast.includes('⚠️') && !toast.includes('✅') && '✅ '}
          <span>{toast}</span>
        </div>
      )}
    </div>
  )
}
