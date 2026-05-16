"use client"

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Upload, FileText, Loader2, CheckCircle2, Sparkles, X, RotateCcw, Plus, Trash2, Save, ArrowLeft, AlertTriangle, Package } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import Link from 'next/link'

type ConfState = 'ai-high' | 'ai-low' | 'edited'

function ConfDot({ state }: { state: ConfState }) {
  const colors = {
    'ai-high': 'bg-emerald-400',
    'ai-low': 'bg-amber-400',
    'edited': 'bg-gray-400',
  }
  return <span className={`inline-block w-2 h-2 rounded-full ${colors[state]}`} />
}

function AIField({
  label, value, confidence, onChange, onReset, type = 'text',
}: {
  label: string; value: string | number; confidence: number; onChange: (v: string) => void; onReset: () => void; type?: string
}) {
  const [edited, setEdited] = useState(false)
  const state: ConfState = edited ? 'edited' : confidence >= 85 ? 'ai-high' : 'ai-low'
  const borderColor = state === 'ai-high' ? 'border-emerald-300 focus-within:ring-emerald-200' : state === 'ai-low' ? 'border-amber-300 focus-within:ring-amber-200' : 'border-gray-300'

  return (
    <div className="space-y-1">
      <label className="flex items-center gap-1.5 text-xs font-medium text-[#475569]">
        <ConfDot state={state} />
        {label}
        {confidence > 0 && <span className="text-[10px] text-[#94a3b8]">({confidence}%)</span>}
      </label>
      <div className={`relative flex items-center rounded-lg border ${borderColor} bg-white transition-all`}>
        <input
          type={type}
          value={value}
          onChange={e => { setEdited(true); onChange(e.target.value) }}
          className="flex-1 h-9 px-3 text-sm bg-transparent outline-none rounded-lg"
        />
        {edited && (
          <button onClick={() => { setEdited(false); onReset() }} className="p-1 mr-1 text-gray-400 hover:text-gray-600">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}

const processingSteps = [
  'กำลังอ่านเอกสาร...',
  'วิเคราะห์ข้อมูล Claim...',
  'ระบุข้อมูลรถยนต์...',
  'อ่านรายการอะไหล่และค่าแรง...',
  'ตรวจสอบความถูกต้อง...',
]

export default function NewClaimPage() {
  const router = useRouter()
  const [step, setStep] = useState<'choose' | 'upload' | 'processing' | 'review' | 'manual'>('choose')
  const [processingStep, setProcessingStep] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const [data, setData] = useState<any>(null)

  // Manual form state
  const [manualForm, setManualForm] = useState({
    claimNo: '', receiveNo: '', transactionNo: '',
    insuranceName: '', branch: '',
    carPlate: '', province: '', carBrand: '', carModel: '', carVin: '', insuredName: '',
  })
  const [manualLabors, setManualLabors] = useState<any[]>([])
  const [manualParts, setManualParts] = useState<any[]>([])

  const addManualLabor = () => setManualLabors([...manualLabors, { description: '', damageLevel: '', discountPct: 0, priceOffer: 0, priceApprove: 0 }])
  const addManualPart = () => setManualParts([...manualParts, { partNo: '', partName: '', priceFullAmt: 0, quantity: 1, damageType: '', discountPct: 0, priceOffer: 0, priceApprove: 0, supplier: '', requireReturn: false }])
  const removeManualLabor = (i: number) => setManualLabors(manualLabors.filter((_, idx) => idx !== i))
  const removeManualPart = (i: number) => setManualParts(manualParts.filter((_, idx) => idx !== i))

  // AI extraction simulation
  const handleExtract = useCallback(async () => {
    setStep('processing')
    for (let i = 0; i < processingSteps.length; i++) {
      setProcessingStep(i)
      await new Promise(r => setTimeout(r, 800))
    }
    try {
      const res = await fetch('/api/ai/extract-claim', { method: 'POST', body: JSON.stringify({}) })
      const result = await res.json()
      setData(result)
      setStep('review')
    } catch {
      setData(null)
      setStep('review')
    }
  }, [])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleExtract()
  }

  const handleSave = async () => {
    router.push('/claims')
  }

  if (step === 'choose') {
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <Link href="/claims">
            <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#0f172a]">รับ Claim ใหม่</h1>
            <p className="text-sm text-[#94a3b8] mt-1">เลือกวิธีการบันทึกข้อมูล Claim</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* AI Option */}
          <Card className="cursor-pointer hover:shadow-lg hover:border-[#1d4ed8] transition-all duration-300 group" onClick={() => setStep('upload')}>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[#1d4ed8] to-[#3b82f6] flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-[#0f172a] mb-2">AI อ่านเอกสาร</h3>
              <p className="text-sm text-[#475569] mb-4">อัพโหลดภาพหรือ PDF เอกสาร Claim<br/>AI จะช่วยกรอกข้อมูลให้อัตโนมัติ</p>
              <div className="flex flex-wrap justify-center gap-1.5">
                {['JPG', 'PNG', 'PDF', 'HEIC'].map(f => (
                  <span key={f} className="px-2 py-0.5 rounded bg-[#eff6ff] text-[#1d4ed8] text-[10px] font-medium">{f}</span>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Manual Option */}
          <Card className="cursor-pointer hover:shadow-lg hover:border-[#1d4ed8] transition-all duration-300 group" onClick={() => setStep('manual')}>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[#475569] to-[#64748b] flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-[#0f172a] mb-2">กรอกข้อมูลเอง</h3>
              <p className="text-sm text-[#475569] mb-4">กรอกข้อมูล Claim, รถยนต์,<br/>อะไหล่ และค่าแรงด้วยตัวเอง</p>
              <span className="px-3 py-1 rounded-full bg-gray-100 text-[#475569] text-xs font-medium">Manual Entry</span>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (step === 'upload') {
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setStep('choose')}><ArrowLeft className="w-5 h-5" /></Button>
          <div>
            <h1 className="text-2xl font-bold text-[#0f172a]">AI อ่านเอกสาร</h1>
            <p className="text-sm text-[#94a3b8] mt-1">อัพโหลดเอกสาร Claim เพื่อให้ AI ช่วยกรอกข้อมูล</p>
          </div>
        </div>

        <Card>
          <CardContent className="p-8">
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={cn(
                "border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer",
                dragOver ? "border-[#1d4ed8] bg-[#eff6ff] scale-[1.01]" : "border-gray-300 hover:border-[#1d4ed8] hover:bg-[#f8faff]"
              )}
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[#1d4ed8] to-[#3b82f6] flex items-center justify-center mb-4 shadow-lg">
                <Upload className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-[#0f172a] mb-2">ลากไฟล์มาวางที่นี่</h3>
              <p className="text-sm text-[#94a3b8] mb-4">หรือคลิกเพื่อเลือกไฟล์</p>
              <p className="text-xs text-[#94a3b8]">รองรับ JPG, PNG, WEBP, HEIC, PDF — ขนาดสูงสุด 20MB</p>
              <input id="file-upload" type="file" accept=".jpg,.jpeg,.png,.webp,.heic,.pdf" className="hidden" onChange={handleExtract} />
            </div>

            <div className="mt-6 flex items-center gap-3 text-sm text-[#475569]">
              <Sparkles className="w-5 h-5 text-[#1d4ed8]" />
              <span>AI จะอ่านเอกสารและกรอกข้อมูลให้อัตโนมัติ — คุณสามารถแก้ไขทุก field ได้ภายหลัง</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (step === 'processing') {
    return (
      <div className="max-w-lg mx-auto mt-24 animate-fade-in">
        <Card>
          <CardContent className="p-10 text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-[#1d4ed8] to-[#3b82f6] flex items-center justify-center mb-6 animate-pulse-soft shadow-xl">
              <Sparkles className="w-9 h-9 text-white" />
            </div>
            <h2 className="text-xl font-bold text-[#0f172a] mb-6">AI กำลังอ่านเอกสาร</h2>
            <div className="space-y-3 text-left">
              {processingSteps.map((s, i) => (
                <div key={i} className="flex items-center gap-3">
                  {i < processingStep ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  ) : i === processingStep ? (
                    <Loader2 className="w-5 h-5 text-[#1d4ed8] animate-spin flex-shrink-0" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-200 flex-shrink-0" />
                  )}
                  <span className={cn("text-sm", i <= processingStep ? "text-[#0f172a] font-medium" : "text-[#94a3b8]")}>{s}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (step === 'manual') {
    const updateManualForm = (key: string, val: string) => setManualForm({ ...manualForm, [key]: val })
    const updateLabor = (i: number, key: string, val: any) => { const arr = [...manualLabors]; arr[i] = { ...arr[i], [key]: val }; setManualLabors(arr) }
    const updatePart = (i: number, key: string, val: any) => { const arr = [...manualParts]; arr[i] = { ...arr[i], [key]: val }; setManualParts(arr) }

    return (
      <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setStep('choose')}><ArrowLeft className="w-5 h-5" /></Button>
            <div>
              <h1 className="text-2xl font-bold text-[#0f172a]">กรอกข้อมูล Claim</h1>
              <p className="text-sm text-[#94a3b8] mt-1">กรอกข้อมูลด้วยตัวเอง — สามารถเพิ่มอะไหล่และค่าแรงได้ไม่จำกัด</p>
            </div>
          </div>
          <Button onClick={handleSave}><Save className="w-4 h-4 mr-2" />บันทึก Claim</Button>
        </div>

        {/* Claim Info */}
        <Card>
          <CardHeader><CardTitle className="text-base">ข้อมูล Claim</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { key: 'claimNo', label: 'Claim No.' },
                { key: 'receiveNo', label: 'Receive No.' },
                { key: 'transactionNo', label: 'Transaction No.' },
                { key: 'insuranceName', label: 'บ.ประกัน' },
                { key: 'branch', label: 'สาขา' },
              ].map(f => (
                <div key={f.key} className="space-y-1">
                  <label className="text-xs font-medium text-[#475569]">{f.label}</label>
                  <Input value={(manualForm as any)[f.key]} onChange={e => updateManualForm(f.key, e.target.value)} placeholder={f.label} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Car Info */}
        <Card>
          <CardHeader><CardTitle className="text-base">ข้อมูลรถยนต์</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { key: 'carPlate', label: 'ทะเบียน' },
                { key: 'province', label: 'จังหวัด' },
                { key: 'carBrand', label: 'ยี่ห้อ' },
                { key: 'carModel', label: 'รุ่น' },
                { key: 'carVin', label: 'VIN' },
                { key: 'insuredName', label: 'ผู้เอาประกัน' },
              ].map(f => (
                <div key={f.key} className="space-y-1">
                  <label className="text-xs font-medium text-[#475569]">{f.label}</label>
                  <Input value={(manualForm as any)[f.key]} onChange={e => updateManualForm(f.key, e.target.value)} placeholder={f.label} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Labor Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">ค่าแรง ({manualLabors.length} รายการ)</CardTitle>
            <Button variant="outline" size="sm" onClick={addManualLabor}><Plus className="w-4 h-4 mr-1" />เพิ่มค่าแรง</Button>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {manualLabors.length === 0 ? (
              <div className="text-center py-8 text-[#94a3b8]">
                <p className="text-sm">ยังไม่มีรายการค่าแรง</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={addManualLabor}><Plus className="w-4 h-4 mr-1" />เพิ่มค่าแรง</Button>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-[#f8faff]">
                    <th className="text-left p-3 font-semibold text-[#475569]">#</th>
                    <th className="text-left p-3 font-semibold text-[#475569]">รายการ</th>
                    <th className="text-left p-3 font-semibold text-[#475569]">ระดับ</th>
                    <th className="text-right p-3 font-semibold text-[#475569]">ส่วนลด%</th>
                    <th className="text-right p-3 font-semibold text-[#475569]">ราคาเสนอ</th>
                    <th className="text-right p-3 font-semibold text-[#475569]">ราคาอนุมัติ</th>
                    <th className="p-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {manualLabors.map((l, i) => (
                    <tr key={i} className="border-b border-gray-50 hover:bg-[#f8faff]">
                      <td className="p-3 text-[#94a3b8]">{i + 1}</td>
                      <td className="p-3"><input className="w-full border border-gray-200 rounded px-2 py-1 text-sm outline-none focus:border-[#1d4ed8]" value={l.description} onChange={e => updateLabor(i, 'description', e.target.value)} placeholder="รายการค่าแรง" /></td>
                      <td className="p-3"><input className="w-24 border border-gray-200 rounded px-2 py-1 text-sm outline-none focus:border-[#1d4ed8]" value={l.damageLevel} onChange={e => updateLabor(i, 'damageLevel', e.target.value)} placeholder="เบา/ปานกลาง/หนัก" /></td>
                      <td className="p-3 text-right"><input type="number" className="w-16 border border-gray-200 rounded px-2 py-1 text-sm text-right outline-none focus:border-[#1d4ed8]" value={l.discountPct} onChange={e => updateLabor(i, 'discountPct', +e.target.value)} /></td>
                      <td className="p-3 text-right"><input type="number" className="w-24 border border-gray-200 rounded px-2 py-1 text-sm text-right outline-none focus:border-[#1d4ed8]" value={l.priceOffer} onChange={e => updateLabor(i, 'priceOffer', +e.target.value)} /></td>
                      <td className="p-3 text-right"><input type="number" className="w-24 border border-gray-200 rounded px-2 py-1 text-sm text-right font-semibold outline-none focus:border-[#1d4ed8]" value={l.priceApprove} onChange={e => updateLabor(i, 'priceApprove', +e.target.value)} /></td>
                      <td className="p-3"><button onClick={() => removeManualLabor(i)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        {/* Parts Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">อะไหล่ ({manualParts.length} รายการ)</CardTitle>
            <Button variant="outline" size="sm" onClick={addManualPart}><Plus className="w-4 h-4 mr-1" />เพิ่มอะไหล่</Button>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {manualParts.length === 0 ? (
              <div className="text-center py-8 text-[#94a3b8]">
                <p className="text-sm">ยังไม่มีรายการอะไหล่</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={addManualPart}><Plus className="w-4 h-4 mr-1" />เพิ่มอะไหล่</Button>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-[#f8faff]">
                    <th className="text-left p-3 font-semibold text-[#475569]">#</th>
                    <th className="text-left p-3 font-semibold text-[#475569]">รหัส</th>
                    <th className="text-left p-3 font-semibold text-[#475569]">ชื่ออะไหล่</th>
                    <th className="text-right p-3 font-semibold text-[#475569]">ราคาเต็ม</th>
                    <th className="text-center p-3 font-semibold text-[#475569]">จำนวน</th>
                    <th className="text-left p-3 font-semibold text-[#475569]">ประเภท</th>
                    <th className="text-right p-3 font-semibold text-[#475569]">ราคาอนุมัติ</th>
                    <th className="text-center p-3 font-semibold text-[#475569]">คืนซาก</th>
                    <th className="p-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {manualParts.map((p, i) => (
                    <tr key={i} className="border-b border-gray-50 hover:bg-[#f8faff]">
                      <td className="p-3 text-[#94a3b8]">{i + 1}</td>
                      <td className="p-3"><input className="w-28 border border-gray-200 rounded px-2 py-1 text-sm font-mono outline-none focus:border-[#1d4ed8]" value={p.partNo} onChange={e => updatePart(i, 'partNo', e.target.value)} placeholder="รหัส" /></td>
                      <td className="p-3"><input className="w-32 border border-gray-200 rounded px-2 py-1 text-sm outline-none focus:border-[#1d4ed8]" value={p.partName} onChange={e => updatePart(i, 'partName', e.target.value)} placeholder="ชื่ออะไหล่" /></td>
                      <td className="p-3 text-right"><input type="number" className="w-24 border border-gray-200 rounded px-2 py-1 text-sm text-right outline-none focus:border-[#1d4ed8]" value={p.priceFullAmt} onChange={e => updatePart(i, 'priceFullAmt', +e.target.value)} /></td>
                      <td className="p-3 text-center"><input type="number" className="w-14 border border-gray-200 rounded px-2 py-1 text-sm text-center outline-none focus:border-[#1d4ed8]" value={p.quantity} onChange={e => updatePart(i, 'quantity', +e.target.value)} /></td>
                      <td className="p-3"><input className="w-20 border border-gray-200 rounded px-2 py-1 text-sm outline-none focus:border-[#1d4ed8]" value={p.damageType} onChange={e => updatePart(i, 'damageType', e.target.value)} placeholder="เปลี่ยน/ซ่อม" /></td>
                      <td className="p-3 text-right"><input type="number" className="w-24 border border-gray-200 rounded px-2 py-1 text-sm text-right font-semibold outline-none focus:border-[#1d4ed8]" value={p.priceApprove} onChange={e => updatePart(i, 'priceApprove', +e.target.value)} /></td>
                      <td className="p-3 text-center">
                        <input type="checkbox" checked={p.requireReturn} onChange={e => updatePart(i, 'requireReturn', e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-[#1d4ed8] focus:ring-[#1d4ed8]" />
                      </td>
                      <td className="p-3"><button onClick={() => removeManualPart(i)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        {/* Sticky Action Bar */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 -mx-6 px-6 py-4 flex items-center justify-between shadow-lg">
          <Button variant="outline" onClick={() => setStep('choose')}>
            <ArrowLeft className="w-4 h-4 mr-2" />ย้อนกลับ
          </Button>
          <Button onClick={handleSave} className="px-8">
            <Save className="w-4 h-4 mr-2" />บันทึก Claim
          </Button>
        </div>
      </div>
    )
  }

  // Review step
  if (!data) return null
  const { claim: claimData, car, labors, parts, summary, validation } = data

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setStep('upload')}><ArrowLeft className="w-5 h-5" /></Button>
          <div>
            <h1 className="text-2xl font-bold text-[#0f172a]">ตรวจสอบข้อมูล</h1>
            <p className="text-sm text-[#94a3b8] mt-1">ตรวจสอบและแก้ไขข้อมูลที่ AI อ่านได้</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setStep('upload')}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Extract ใหม่
          </Button>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            บันทึก Claim
          </Button>
        </div>
      </div>

      {/* Validation Warnings */}
      {!validation.passed && validation.warnings.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-800">พบข้อสังเกต</p>
              {validation.warnings.map((w: string, i: number) => (
                <p key={i} className="text-sm text-amber-700 mt-1">• {w}</p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confidence Legend */}
      <div className="flex items-center gap-6 text-xs text-[#475569]">
        <div className="flex items-center gap-1.5"><ConfDot state="ai-high" /> AI มั่นใจ (≥85%)</div>
        <div className="flex items-center gap-1.5"><ConfDot state="ai-low" /> ควรตรวจสอบ (&lt;85%)</div>
        <div className="flex items-center gap-1.5"><ConfDot state="edited" /> แก้ไขแล้ว</div>
      </div>

      {/* Claim Info */}
      <Card>
        <CardHeader><CardTitle className="text-base">ข้อมูล Claim</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(claimData).map(([key, field]: [string, any]) => (
              <AIField
                key={key}
                label={key}
                value={field.value}
                confidence={field.confidence}
                onChange={() => {}}
                onReset={() => {}}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Car Info */}
      <Card>
        <CardHeader><CardTitle className="text-base">ข้อมูลรถยนต์</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(car).map(([key, field]: [string, any]) => (
              <AIField
                key={key}
                label={key}
                value={field.value}
                confidence={field.confidence}
                onChange={() => {}}
                onReset={() => {}}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Labor Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">ค่าแรง ({labors.length} รายการ)</CardTitle>
          <Button variant="outline" size="sm"><Plus className="w-4 h-4 mr-1" />เพิ่มค่าแรง</Button>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-[#f8faff]">
                <th className="text-left p-3 font-semibold text-[#475569]">#</th>
                <th className="text-left p-3 font-semibold text-[#475569]">รายการ</th>
                <th className="text-left p-3 font-semibold text-[#475569]">ระดับ</th>
                <th className="text-right p-3 font-semibold text-[#475569]">ส่วนลด%</th>
                <th className="text-right p-3 font-semibold text-[#475569]">ราคาเสนอ</th>
                <th className="text-right p-3 font-semibold text-[#475569]">ราคาอนุมัติ</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {labors.map((l: any, i: number) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-[#f8faff]">
                  <td className="p-3 text-[#94a3b8]">{i + 1}</td>
                  <td className="p-3"><input className="w-full bg-transparent outline-none" defaultValue={l.description.value} /></td>
                  <td className="p-3"><input className="w-24 bg-transparent outline-none" defaultValue={l.damageLevel.value} /></td>
                  <td className="p-3 text-right"><input className="w-16 bg-transparent outline-none text-right" defaultValue={l.discountPct.value} /></td>
                  <td className="p-3 text-right"><input className="w-24 bg-transparent outline-none text-right" defaultValue={l.priceOffer.value} /></td>
                  <td className="p-3 text-right font-semibold"><input className="w-24 bg-transparent outline-none text-right font-semibold" defaultValue={l.priceApprove.value} /></td>
                  <td className="p-3"><button className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Parts Master Review Section */}
      <Card className="border-[#1d4ed8] shadow-sm">
        <CardHeader className="bg-[#eff6ff] rounded-t-xl border-b border-blue-100 pb-4">
          <CardTitle className="text-base flex items-center gap-2 text-[#1d4ed8]">
            <Package className="w-5 h-5" />
            รายการอะไหล่ — ตรวจสอบข้อมูล Master
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-100">
            {parts.map((p: any, i: number) => {
              // Mock logic for part matching
              const isMatch = p.partNo.value.includes('CFC') || p.partNo.value.includes('02')
              const usageCount = Math.floor(Math.random() * 50) + 1
              const isHighPrice = p.priceApprove.value > p.priceFull.value * 1.15
              const isNew = !isMatch

              return (
                <div key={i} className={cn("p-4 transition-colors", isNew ? "bg-amber-50/30" : "hover:bg-gray-50")}>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex-shrink-0">
                      {isNew ? (
                        <div className="bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded">NEW</div>
                      ) : (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold text-[#0f172a]">{p.partNo.value}</span>
                        <span className="text-sm text-[#0f172a]">{p.partName.value}</span>
                        {isNew && <span className="text-xs text-amber-600 font-medium ml-2">← Part ใหม่!</span>}
                      </div>

                      {isMatch ? (
                        <div className="text-xs text-[#475569] space-y-1">
                          <div>พบใน Master — ใช้ไปแล้ว <span className="font-medium text-[#0f172a]">{usageCount}</span> Claim</div>
                          <div className="flex items-center gap-2">
                            <span>ราคากลาง <span className="font-medium">฿{formatCurrency(p.priceFull.value * 0.9)}</span></span>
                            <span className="text-gray-300">|</span>
                            <span>Vendor X <span className="font-medium">฿{formatCurrency(p.priceFull.value * 0.85)}</span> (OEM)</span>
                          </div>
                          {isHighPrice && (
                            <div className="flex items-center gap-1.5 text-red-600 mt-1 bg-red-50 p-1.5 rounded w-fit">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span className="font-medium">ราคาสูงกว่าราคากลาง 18% — ตรวจสอบด้วย</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-xs text-[#475569] space-y-2 mt-2 bg-white p-3 rounded border border-amber-200 shadow-sm">
                          <div>ยังไม่มีใน Master</div>
                          <div className="grid grid-cols-2 gap-3 max-w-md">
                            <div className="space-y-1">
                              <label className="text-[#94a3b8]">ชื่อ</label>
                              <Input className="h-7 text-xs" defaultValue={p.partName.value} />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[#94a3b8]">หมวดหมู่</label>
                              <select className="flex h-7 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50">
                                <option>กันชน/สเกิร์ต</option>
                                <option>กระจก/ฝา</option>
                                <option>ระบบไฟ</option>
                                <option>ตัวถังภายนอก</option>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[#94a3b8]">ราคากลาง</label>
                              <Input className="h-7 text-xs" defaultValue={p.priceFull.value} type="number" />
                            </div>
                          </div>
                          <div className="flex items-center gap-3 pt-2">
                            <span className="font-medium text-[#0f172a]">บันทึกลง Master?</span>
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input type="radio" name={`master-${i}`} defaultChecked className="text-[#1d4ed8]" /> ใช่
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input type="radio" name={`master-${i}`} className="text-[#1d4ed8]" /> ไม่ใช่
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Parts Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">อะไหล่ ({parts.length} รายการ)</CardTitle>
          <Button variant="outline" size="sm"><Plus className="w-4 h-4 mr-1" />เพิ่มอะไหล่</Button>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-[#f8faff]">
                <th className="text-left p-3 font-semibold text-[#475569]">#</th>
                <th className="text-left p-3 font-semibold text-[#475569]">รหัส</th>
                <th className="text-left p-3 font-semibold text-[#475569]">ชื่ออะไหล่</th>
                <th className="text-right p-3 font-semibold text-[#475569]">ราคาเต็ม</th>
                <th className="text-center p-3 font-semibold text-[#475569]">จำนวน</th>
                <th className="text-left p-3 font-semibold text-[#475569]">ประเภท</th>
                <th className="text-right p-3 font-semibold text-[#475569]">ราคาอนุมัติ</th>
                <th className="text-center p-3 font-semibold text-[#475569]">คืนซาก</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {parts.map((p: any, i: number) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-[#f8faff]">
                  <td className="p-3 text-[#94a3b8]">{i + 1}</td>
                  <td className="p-3"><input className="w-28 bg-transparent outline-none font-mono text-xs" defaultValue={p.partNo.value} /></td>
                  <td className="p-3"><input className="w-32 bg-transparent outline-none" defaultValue={p.partName.value} /></td>
                  <td className="p-3 text-right"><input className="w-24 bg-transparent outline-none text-right" defaultValue={p.priceFull.value} /></td>
                  <td className="p-3 text-center"><input className="w-12 bg-transparent outline-none text-center" defaultValue={p.quantity.value} /></td>
                  <td className="p-3"><input className="w-20 bg-transparent outline-none" defaultValue={p.damageType.value} /></td>
                  <td className="p-3 text-right font-semibold"><input className="w-24 bg-transparent outline-none text-right font-semibold" defaultValue={p.priceApprove.value} /></td>
                  <td className="p-3 text-center">
                    {p.requireReturn.value && <Badge className="bg-amber-50 text-amber-600 text-[10px]">คืนซาก</Badge>}
                  </td>
                  <td className="p-3"><button className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader><CardTitle className="text-base">สรุปยอด</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(summary).map(([key, field]: [string, any]) => (
              <AIField
                key={key}
                label={key}
                value={field.value}
                confidence={field.confidence}
                onChange={() => {}}
                onReset={() => {}}
                type="number"
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Bar */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 -mx-6 px-6 py-4 flex items-center justify-between shadow-lg">
        <Button variant="outline" onClick={() => setStep('upload')}>
          <RotateCcw className="w-4 h-4 mr-2" />
          Extract ใหม่
        </Button>
        <Button onClick={handleSave} className="px-8">
          <Save className="w-4 h-4 mr-2" />
          บันทึก Claim
        </Button>
      </div>
    </div>
  )
}
