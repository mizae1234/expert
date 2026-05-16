'use client'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Building2, Save, Upload, FileText, Hash, CreditCard, CheckCircle2 } from 'lucide-react'
import { mockCompanyProfile, mockDocumentSequences, mockPeakConfig } from '@/lib/mock/settings'
import { mockVendors } from '@/lib/mock/vendors'
import { mockInsurances } from '@/lib/mock/insurances'
import { CompanyProfile, DocumentSequence } from '@/lib/types'
import { uploadToR2 } from '@/lib/upload'

export default function SettingsPage() {
  const [company, setCompany] = useState<CompanyProfile>(mockCompanyProfile)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [isUploadingSig, setIsUploadingSig] = useState(false)
  const [sequences, setSequences] = useState<DocumentSequence[]>(mockDocumentSequences)
  const [peakConfig, setPeakConfig] = useState<Record<string, string>>(mockPeakConfig)
  const [toast, setToast] = useState<string | null>(null)
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500) }

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
                          alert('Upload failed')
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
                          alert('Upload failed')
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
            <Button className="bg-[#1d4ed8]" onClick={() => showToast('บันทึกข้อมูลบริษัทเรียบร้อย')}><Save className="w-4 h-4 mr-1.5" />บันทึก</Button>
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
            <Button className="bg-[#1d4ed8]" onClick={() => showToast('บันทึกเลขที่เอกสารเรียบร้อย')}><Save className="w-4 h-4 mr-1.5" />บันทึก</Button>
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
                      ผู้จำหน่าย / อู่ ({mockVendors.filter(v => v.peakVendorCode).length}/{mockVendors.length})
                      {mockVendors.every(v => v.peakVendorCode) ? 
                        <Badge className="bg-green-100 text-green-700 border-none">✅ พร้อม</Badge> : 
                        <Badge className="bg-amber-100 text-amber-700 border-none">⚠️ ขาด Code</Badge>
                      }
                    </h3>
                    <div className="text-sm text-gray-600 pl-4 space-y-2 max-h-[150px] overflow-y-auto pr-2">
                      {mockVendors.map(v => (
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
                      บริษัทประกัน ({mockInsurances.filter(i => i.peakCustomerId).length}/{mockInsurances.length})
                      {mockInsurances.every(i => i.peakCustomerId) ? 
                        <Badge className="bg-green-100 text-green-700 border-none">✅ พร้อม</Badge> : 
                        <Badge className="bg-amber-100 text-amber-700 border-none">⚠️ ขาด Code</Badge>
                      }
                    </h3>
                    <div className="text-sm text-gray-600 pl-4 space-y-2 max-h-[150px] overflow-y-auto pr-2">
                      {mockInsurances.map(i => (
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
      </Tabs>

      {toast && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white px-6 py-3 rounded-xl shadow-2xl z-50 animate-in slide-in-from-bottom-4">
          ✅ {toast}
        </div>
      )}
    </div>
  )
}
