"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  RotateCcw,
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  AlertTriangle,
  Package,
  Sparkles,
  CheckCircle2
} from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import { ThaiDatePicker } from '@/components/ui/thai-date-picker'

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
  label, value, confidence, onChange, onReset, type = 'text', list, isManual = false
}: {
  label: string
  value: string | number
  confidence: number
  onChange: (v: string) => void
  onReset: () => void
  type?: string
  list?: string
  isManual?: boolean
}) {
  const [edited, setEdited] = useState(false)
  const state: ConfState = edited ? 'edited' : confidence >= 85 ? 'ai-high' : 'ai-low'
  const borderColor = isManual
    ? 'border-gray-300 focus-within:border-[#1d4ed8]'
    : state === 'ai-high'
    ? 'border-emerald-300 focus-within:ring-emerald-200'
    : state === 'ai-low'
    ? 'border-amber-300 focus-within:ring-amber-200'
    : 'border-gray-300'

  return (
    <div className="space-y-1">
      <label className="flex items-center gap-1.5 text-xs font-medium text-[#475569]">
        {!isManual && <ConfDot state={state} />}
        {label}
        {(!isManual && confidence > 0) && <span className="text-[10px] text-[#94a3b8]">({confidence}%)</span>}
      </label>
      <div className={`relative flex items-center rounded-lg border ${borderColor} bg-white transition-all`}>
        {type === 'date' ? (
          <div className="flex-1 overflow-hidden rounded-lg">
            <ThaiDatePicker
              value={value as string}
              onChange={(v) => {
                setEdited(true)
                onChange(v)
              }}
              className="w-full h-9 px-3 text-sm border-0 shadow-none hover:bg-transparent focus-visible:ring-0 rounded-none bg-transparent"
            />
          </div>
        ) : (
          <input
            type={type}
            value={value}
            onChange={e => {
              setEdited(true)
              onChange(e.target.value)
            }}
            className="flex-1 h-9 px-3 text-sm bg-transparent outline-none rounded-lg"
            list={list}
          />
        )}
        {(!isManual && edited) && (
          <button
            onClick={() => {
              setEdited(false)
              onReset()
            }}
            className="p-1 mr-1 text-gray-400 hover:text-gray-600"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}

interface ClaimFormReviewProps {
  data: any
  setData: React.Dispatch<React.SetStateAction<any>>
  partsMaster: any[]
  isManualMode: boolean
  setStep: (step: 'choose' | 'upload' | 'processing' | 'form' | 'import') => void
  handleSave: () => Promise<void>
  showToast: (msg: string) => void
}

export default function ClaimFormReview({
  data,
  setData,
  partsMaster,
  isManualMode,
  setStep,
  handleSave,
  showToast
}: ClaimFormReviewProps) {
  if (!data) return null
  const { claim: claimData, car, labors, parts, summary, validation } = data

  const updateLaborReview = (i: number, key: string, val: any) => {
    const newLabors = [...data.labors]
    newLabors[i] = { ...newLabors[i], [key]: { ...newLabors[i][key], value: val, edited: true } }
    setData({ ...data, labors: newLabors })
  }

  const removeLaborReview = (i: number) => {
    setData({ ...data, labors: data.labors.filter((_: any, idx: number) => idx !== i) })
  }

  const addLaborReview = () => {
    setData({
      ...data,
      labors: [
        ...data.labors,
        {
          description: { value: '', confidence: 0 },
          damageLevel: { value: '', confidence: 0 },
          discountPct: { value: 0, confidence: 0 },
          priceOffer: { value: 0, confidence: 0 },
          priceApprove: { value: 0, confidence: 0 }
        }
      ]
    })
  }

  const updatePartReview = (i: number, key: string, val: any) => {
    const newParts = [...data.parts]
    newParts[i] = { ...newParts[i], [key]: { ...newParts[i][key], value: val, edited: true } }

    if (key === 'partName') {
      const matched = partsMaster.find(pm => pm.partName === val)
      if (matched) {
        newParts[i].partNo = { value: matched.partNo, edited: true, confidence: 100 }
        newParts[i].priceFull = { value: matched.standardPrice || newParts[i].priceFull?.value || 0, edited: true, confidence: 100 }
      }
    }

    setData({ ...data, parts: newParts })
  }

  const removePartReview = (i: number) => {
    setData({ ...data, parts: data.parts.filter((_: any, idx: number) => idx !== i) })
  }

  const addPartReview = () => {
    setData({
      ...data,
      parts: [
        ...data.parts,
        {
          partNo: { value: '', confidence: 0 },
          partName: { value: '', confidence: 0 },
          priceFull: { value: 0, confidence: 0 },
          quantity: { value: 1, confidence: 0 },
          damageType: { value: '', confidence: 0 },
          priceApprove: { value: 0, confidence: 0 },
          requireReturn: { value: false, confidence: 0 }
        }
      ]
    })
  }

  const updateClaimData = (key: string, val: any) => {
    setData({
      ...data,
      claim: { ...data.claim, [key]: { ...data.claim[key], value: val } }
    })
  }

  const updateCarData = (key: string, val: any) => {
    setData({
      ...data,
      car: { ...data.car, [key]: { ...data.car[key], value: val } }
    })
  }

  const updateSummaryData = (key: string, val: any) => {
    setData({
      ...data,
      summary: { ...data.summary, [key]: { ...data.summary[key], value: val } }
    })
  }

  const labelMap: Record<string, { label: string; list?: string; type?: string }> = {
    claimNo: { label: 'เลขที่เคลม' },
    receiveNo: { label: 'เลขที่รับ' },
    transactionNo: { label: 'เลขที่ธุรกรรม' },
    insuranceName: { label: 'บริษัทประกันภัย', list: 'insurance-list' },
    branch: { label: 'สาขา', list: 'branch-list' },
    status: { label: 'สถานะ' },
    createdAt: { label: 'วันที่สร้าง', type: 'date' },
    sentAt: { label: 'วันที่ส่ง', type: 'date' },
    plate: { label: 'ทะเบียนรถ' },
    province: { label: 'จังหวัด', list: 'province-list' },
    brand: { label: 'ยี่ห้อ', list: 'brand-list' },
    model: { label: 'รุ่น' },
    vin: { label: 'เลขตัวถัง (VIN)' },
    insuredName: { label: 'ชื่อผู้เอาประกัน' },
    laborTotal: { label: 'รวมค่าแรง' },
    partsTotal: { label: 'รวมค่าอะไหล่' },
    subtotal: { label: 'ยอดรวมก่อนภาษี' },
    vat: { label: 'ภาษีมูลค่าเพิ่ม' },
    grandTotal: { label: 'ยอดรวมทั้งสิ้น' },
    deductible: { label: 'ค่าเสียหายส่วนแรก (Deductible)' }
  }

  const partsTotalValue = parts.reduce((s: number, p: any) => s + (Number(p.priceApprove.value) || 0) * (Number(p.quantity.value) || 1), 0)
  const laborTotalValue = labors.reduce((s: number, l: any) => s + (Number(l.priceApprove.value) || 0), 0)

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setStep('choose')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-[#0f172a]">{isManualMode ? 'กรอกข้อมูล Claim' : 'ตรวจสอบข้อมูล'}</h1>
            <p className="text-sm text-[#94a3b8] mt-1">
              {isManualMode ? 'กรอกข้อมูลด้วยตัวเอง' : 'ตรวจสอบและแก้ไขข้อมูลที่ AI อ่านได้'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!isManualMode && (
            <Button variant="outline" onClick={() => setStep('upload')}>
              <RotateCcw className="w-4 h-4 mr-2" />
              อ่านเอกสารใหม่
            </Button>
          )}
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            บันทึก Claim
          </Button>
        </div>
      </div>

      {/* Validation Warnings */}
      {!isManualMode && !validation.passed && validation.warnings.length > 0 && (
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
      {!isManualMode && (
        <div className="flex items-center gap-6 text-xs text-[#475569]">
          <div className="flex items-center gap-1.5"><ConfDot state="ai-high" /> AI มั่นใจ (&ge;85%)</div>
          <div className="flex items-center gap-1.5"><ConfDot state="ai-low" /> ควรตรวจสอบ (&lt;85%)</div>
          <div className="flex items-center gap-1.5"><ConfDot state="edited" /> แก้ไขแล้ว</div>
        </div>
      )}

      {/* Claim Info */}
      <Card>
        <CardHeader><CardTitle className="text-base">ข้อมูล Claim</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(claimData).map(([key, field]: [string, any]) => (
              <AIField
                key={key}
                label={labelMap[key]?.label || key}
                list={labelMap[key]?.list}
                type={labelMap[key]?.type}
                value={field.value}
                confidence={field.confidence}
                onChange={(val) => updateClaimData(key, val)}
                onReset={() => {}}
                isManual={isManualMode}
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
                label={labelMap[key]?.label || key}
                list={labelMap[key]?.list}
                value={field.value}
                confidence={field.confidence}
                onChange={(val) => updateCarData(key, val)}
                onReset={() => {}}
                isManual={isManualMode}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Labor Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">ค่าแรง ({labors.length} รายการ)</CardTitle>
          <Button variant="outline" size="sm" onClick={addLaborReview}>
            <Plus className="w-4 h-4 mr-1" />
            เพิ่มค่าแรง
          </Button>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {labors.length === 0 ? (
            <div className="text-center py-8 text-[#94a3b8]">
              <p className="text-sm">ยังไม่มีรายการค่าแรง</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={addLaborReview}>
                <Plus className="w-4 h-4 mr-1" />
                เพิ่มค่าแรง
              </Button>
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
                {labors.map((l: any, i: number) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-[#f8faff]">
                    <td className="p-3 text-[#94a3b8]">{i + 1}</td>
                    <td className="p-3">
                      <input
                        className={cn(
                          "w-full bg-white border rounded px-2 py-1.5 text-sm outline-none focus:border-[#1d4ed8] focus:ring-1 focus:ring-[#1d4ed8]/20 transition-all shadow-sm",
                          !l.description.value?.trim() ? "border-red-500 focus:border-red-500 focus:ring-red-200" : isManualMode ? "border-gray-200" : "border-blue-200 hover:border-blue-300"
                        )}
                        value={l.description.value}
                        onChange={e => updateLaborReview(i, 'description', e.target.value)}
                      />
                    </td>
                    <td className="p-3">
                      <input
                        className={cn(
                          "w-24 bg-white border rounded px-2 py-1.5 text-sm outline-none focus:border-[#1d4ed8] focus:ring-1 focus:ring-[#1d4ed8]/20 transition-all shadow-sm",
                          isManualMode ? "border-gray-200" : "border-blue-200 hover:border-blue-300"
                        )}
                        value={l.damageLevel.value}
                        onChange={e => updateLaborReview(i, 'damageLevel', e.target.value)}
                      />
                    </td>
                    <td className="p-3 text-right">
                      <input
                        type="text"
                        inputMode="decimal"
                        className={cn(
                          "w-16 bg-white border rounded px-2 py-1.5 text-sm outline-none text-right focus:border-[#1d4ed8] focus:ring-1 focus:ring-[#1d4ed8]/20 transition-all shadow-sm",
                          isManualMode ? "border-gray-200" : "border-blue-200 hover:border-blue-300"
                        )}
                        value={l.discountPct.value}
                        onChange={e => updateLaborReview(i, 'discountPct', e.target.value)}
                      />
                    </td>
                    <td className="p-3 text-right">
                      <input
                        type="text"
                        inputMode="decimal"
                        className={cn(
                          "w-24 bg-white border rounded px-2 py-1.5 text-sm outline-none text-right focus:border-[#1d4ed8] focus:ring-1 focus:ring-[#1d4ed8]/20 transition-all shadow-sm",
                          isManualMode ? "border-gray-200" : "border-blue-200 hover:border-blue-300"
                        )}
                        value={l.priceOffer.value}
                        onChange={e => updateLaborReview(i, 'priceOffer', e.target.value)}
                      />
                    </td>
                    <td className="p-3 text-right font-semibold">
                      <input
                        type="text"
                        inputMode="decimal"
                        className={cn(
                          "w-24 border rounded px-2 py-1.5 text-sm outline-none text-right font-semibold text-[#1d4ed8] focus:bg-white focus:border-[#1d4ed8] focus:ring-1 focus:ring-[#1d4ed8]/20 transition-all shadow-sm",
                          isManualMode ? "bg-white border-gray-200" : "bg-blue-50/50 border-blue-200 hover:border-blue-300"
                        )}
                        value={l.priceApprove.value}
                        onChange={e => updateLaborReview(i, 'priceApprove', e.target.value)}
                      />
                    </td>
                    <td className="p-3">
                      <button onClick={() => removeLaborReview(i)} className="text-gray-400 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Parts Master Review Section (Only AI) */}
      {!isManualMode && parts.length > 0 && (
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
                const isMatch = p.partNo.value.includes('CFC') || p.partNo.value.includes('02')
                const usageCount = Math.floor(Math.random() * 50) + 1
                const isHighPrice = p.priceApprove.value > p.priceFull.value * 1.15
                const isNew = !isMatch

                return (
                  <div key={i} className={cn("p-4 transition-colors", isNew ? "bg-amber-50/30" : "hover:bg-gray-50")}>
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex-shrink-0">
                        {isNew ? (
                          <div className="bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded">ใหม่</div>
                        ) : (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-semibold text-[#0f172a]">{p.partNo.value}</span>
                          <span className="text-sm text-[#0f172a]">{p.partName.value}</span>
                          {isNew && <span className="text-xs text-amber-600 font-medium ml-2">&larr; Part ใหม่!</span>}
                        </div>

                        {isMatch ? (
                          <div className="text-xs text-[#475569] space-y-1">
                            <div>พบใน Master — ใช้ไปแล้ว <span className="font-medium text-[#0f172a]">{usageCount}</span> รายการเคลม</div>
                            <div className="flex items-center gap-2">
                              <span>ราคากลาง <span className="font-medium">฿{formatCurrency(p.priceFull.value * 0.9)}</span></span>
                              <span className="text-gray-300">|</span>
                              <span>ผู้จำหน่าย X <span className="font-medium">฿{formatCurrency(p.priceFull.value * 0.85)}</span> (OEM)</span>
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
      )}

      {/* Parts Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">อะไหล่ ({parts.length} รายการ)</CardTitle>
          <Button variant="outline" size="sm" onClick={addPartReview}>
            <Plus className="w-4 h-4 mr-1" />
            เพิ่มอะไหล่
          </Button>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {parts.length === 0 ? (
            <div className="text-center py-8 text-[#94a3b8]">
              <p className="text-sm">ยังไม่มีรายการอะไหล่</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={addPartReview}>
                <Plus className="w-4 h-4 mr-1" />
                เพิ่มอะไหล่
              </Button>
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
                {parts.map((p: any, i: number) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-[#f8faff]">
                    <td className="p-3 text-[#94a3b8]">{i + 1}</td>
                    <td className="p-3">
                      <input
                        className={cn(
                          "w-28 bg-white border rounded px-2 py-1.5 outline-none font-mono text-xs focus:border-[#1d4ed8] focus:ring-1 focus:ring-[#1d4ed8]/20 transition-all shadow-sm",
                          isManualMode ? "border-gray-200" : "border-blue-200 hover:border-blue-300"
                        )}
                        value={p.partNo.value}
                        onChange={e => updatePartReview(i, 'partNo', e.target.value)}
                      />
                    </td>
                    <td className="p-3">
                      <input
                        className={cn(
                          "w-32 bg-white border rounded px-2 py-1.5 text-sm outline-none focus:border-[#1d4ed8] focus:ring-1 focus:ring-[#1d4ed8]/20 transition-all shadow-sm",
                          !p.partName.value?.trim() ? "border-red-500 focus-border-red-500 focus:ring-red-200" : isManualMode ? "border-gray-200" : "border-blue-200 hover:border-blue-300"
                        )}
                        value={p.partName.value}
                        onChange={e => updatePartReview(i, 'partName', e.target.value)}
                        list="parts-master-list"
                      />
                    </td>
                    <td className="p-3 text-right">
                      <input
                        type="text"
                        inputMode="decimal"
                        className={cn(
                          "w-24 bg-white border rounded px-2 py-1.5 text-sm outline-none text-right focus:border-[#1d4ed8] focus:ring-1 focus:ring-[#1d4ed8]/20 transition-all shadow-sm",
                          isManualMode ? "border-gray-200" : "border-blue-200 hover:border-blue-300"
                        )}
                        value={p.priceFull.value}
                        onChange={e => updatePartReview(i, 'priceFull', e.target.value)}
                      />
                    </td>
                    <td className="p-3 text-center">
                      <input
                        type="text"
                        inputMode="numeric"
                        className={cn(
                          "w-16 bg-white border rounded px-2 py-1.5 text-sm outline-none text-center focus:border-[#1d4ed8] focus:ring-1 focus:ring-[#1d4ed8]/20 transition-all shadow-sm",
                          isManualMode ? "border-gray-200" : "border-blue-200 hover:border-blue-300"
                        )}
                        value={p.quantity.value}
                        onChange={e => updatePartReview(i, 'quantity', e.target.value)}
                      />
                    </td>
                    <td className="p-3">
                      <input
                        className={cn(
                          "w-20 bg-white border rounded px-2 py-1.5 text-sm outline-none focus:border-[#1d4ed8] focus:ring-1 focus:ring-[#1d4ed8]/20 transition-all shadow-sm",
                          isManualMode ? "border-gray-200" : "border-blue-200 hover:border-blue-300"
                        )}
                        value={p.damageType.value}
                        onChange={e => updatePartReview(i, 'damageType', e.target.value)}
                      />
                    </td>
                    <td className="p-3 text-right font-semibold">
                      <input
                        type="text"
                        inputMode="decimal"
                        className={cn(
                          "w-24 border rounded px-2 py-1.5 text-sm outline-none text-right font-semibold text-[#1d4ed8] focus:bg-white focus:border-[#1d4ed8] focus:ring-1 focus:ring-[#1d4ed8]/20 transition-all shadow-sm",
                          isManualMode ? "bg-white border-gray-200" : "bg-blue-50/50 border-blue-200 hover:border-blue-300"
                        )}
                        value={p.priceApprove.value}
                        onChange={e => updatePartReview(i, 'priceApprove', e.target.value)}
                      />
                    </td>
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={p.requireReturn.value}
                        onChange={e => updatePartReview(i, 'requireReturn', e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-[#1d4ed8] focus:ring-[#1d4ed8]"
                      />
                    </td>
                    <td className="p-3">
                      <button onClick={() => removePartReview(i)} className="text-gray-400 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
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
                label={labelMap[key]?.label || key}
                value={field.value}
                confidence={field.confidence}
                onChange={(val) => updateSummaryData(key, val)}
                onReset={() => {}}
                type="number"
                isManual={isManualMode}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Bar */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 -mx-6 px-6 py-4 flex items-center justify-between shadow-lg">
        <Button variant="outline" onClick={() => setStep('choose')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          ย้อนกลับ
        </Button>
        <Button onClick={handleSave} className="px-8">
          <Save className="w-4 h-4 mr-2" />
          บันทึก Claim
        </Button>
      </div>

      {/* Datalists */}
      <datalist id="parts-master-list">
        {partsMaster.map(pm => (
          <option key={pm.id} value={pm.partName} />
        ))}
      </datalist>

      <datalist id="insurance-list">
        <option value="ธนชาตประกันภัย" />
        <option value="วิริยะประกันภัย" />
        <option value="สินมั่นคงประกันภัย" />
        <option value="ทิพยประกันภัย" />
        <option value="กรุงเทพประกันภัย" />
        <option value="เมืองไทยประกันภัย" />
        <option value="คุ้มภัยโตเกียวมารีน" />
      </datalist>

      <datalist id="branch-list">
        <option value="Dealer Zone 1" />
        <option value="Dealer Zone 2" />
        <option value="Dealer Zone 3" />
        <option value="สำนักงานใหญ่" />
      </datalist>

      <datalist id="province-list">
        <option value="กรุงเทพมหานคร" />
        <option value="นนทบุรี" />
        <option value="ปทุมธานี" />
        <option value="สมุทรปราการ" />
        <option value="เชียงใหม่" />
        <option value="ชลบุรี" />
        <option value="ขอนแก่น" />
        <option value="นครราชสีมา" />
        <option value="ภูเก็ต" />
      </datalist>

      <datalist id="brand-list">
        <option value="Toyota" />
        <option value="Honda" />
        <option value="Isuzu" />
        <option value="Nissan" />
        <option value="Mitsubishi" />
        <option value="Ford" />
        <option value="Mazda" />
        <option value="MG" />
        <option value="BYD" />
      </datalist>
    </div>
  )
}
