"use client"

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  FileSpreadsheet,
  X,
  Plus,
  ImageIcon
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Dynamic import of ClaimFormReview component to optimize initial load performance
const ClaimFormReview = dynamic(() => import('./components/ClaimFormReview'), {
  loading: () => (
    <div className="flex items-center justify-center h-64 animate-pulse">
      <p className="text-[#94a3b8]">กำลังโหลดแบบฟอร์มตรวจสอบข้อมูล...</p>
    </div>
  ),
  ssr: false
})

const processingSteps = [
  'กำลังอ่านเอกสาร...',
  'วิเคราะห์ข้อมูล Claim...',
  'ระบุข้อมูลรถยนต์...',
  'อ่านรายการอะไหล่และค่าแรง...',
  'ตรวจสอบความถูกต้อง...',
]

const emptyDataTemplate = {
  claim: {
    claimNo: { value: '', confidence: 0 },
    receiveNo: { value: '', confidence: 0 },
    transactionNo: { value: '', confidence: 0 },
    insuranceName: { value: '', confidence: 0 },
    branch: { value: '', confidence: 0 },
    status: { value: '', confidence: 0 },
    createdAt: { value: '', confidence: 0 },
    sentAt: { value: '', confidence: 0 },
  },
  car: {
    plate: { value: '', confidence: 0 },
    province: { value: '', confidence: 0 },
    brand: { value: '', confidence: 0 },
    model: { value: '', confidence: 0 },
    vin: { value: '', confidence: 0 },
    insuredName: { value: '', confidence: 0 },
  },
  labors: [],
  parts: [],
  summary: {
    laborTotal: { value: 0, confidence: 0 },
    partsTotal: { value: 0, confidence: 0 },
    subtotal: { value: 0, confidence: 0 },
    vat: { value: 0, confidence: 0 },
    grandTotal: { value: 0, confidence: 0 },
    deductible: { value: 0, confidence: 0 },
  },
  validation: { passed: true, warnings: [] }
}

interface SelectedFile {
  file: File
  preview: string // object URL or icon placeholder
  id: string
}

export default function NewClaimPage() {
  const router = useRouter()
  const [step, setStep] = useState<'choose' | 'upload' | 'processing' | 'form' | 'import'>('choose')
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{
    success: boolean
    totalRows: number
    imported: number
    skipped: number
    errors: number
  } | null>(null)
  const [processingStep, setProcessingStep] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const [data, setData] = useState<any>(null)
  const [isManualMode, setIsManualMode] = useState(false)
  const [partsMaster, setPartsMaster] = useState<any[]>([])
  const [toast, setToast] = useState<string | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  useEffect(() => {
    fetch('/api/parts-master')
      .then(res => res.json())
      .then(pmData => {
        if (Array.isArray(pmData)) setPartsMaster(pmData)
      })
      .catch(console.error)
  }, [])

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      selectedFiles.forEach(sf => {
        if (sf.preview.startsWith('blob:')) URL.revokeObjectURL(sf.preview)
      })
    }
  }, [selectedFiles])

  const startManual = () => {
    setData(JSON.parse(JSON.stringify(emptyDataTemplate)))
    setIsManualMode(true)
    setStep('form')
  }

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (file.type === 'application/pdf') {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
        return
      }

      const img = new Image()
      const objectUrl = URL.createObjectURL(file)
      img.onload = () => {
        URL.revokeObjectURL(objectUrl)
        const MAX_WIDTH = 2048
        let { width, height } = img
        if (width > MAX_WIDTH) {
          height = Math.round(height * MAX_WIDTH / width)
          width = MAX_WIDTH
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, width, height)
        const compressed = canvas.toDataURL('image/jpeg', 0.88)
        resolve(compressed)
      }
      img.onerror = reject
      img.src = objectUrl
    })
  }

  const addFiles = (files: FileList | File[]) => {
    const newFiles: SelectedFile[] = Array.from(files).map(file => {
      const isImage = file.type.startsWith('image/')
      const preview = isImage ? URL.createObjectURL(file) : 'pdf'
      return {
        file,
        preview,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      }
    })
    setSelectedFiles(prev => [...prev, ...newFiles])
  }

  const removeFile = (id: string) => {
    setSelectedFiles(prev => {
      const file = prev.find(f => f.id === id)
      if (file && file.preview.startsWith('blob:')) URL.revokeObjectURL(file.preview)
      return prev.filter(f => f.id !== id)
    })
  }

  const handleExtractMultiple = useCallback(async () => {
    if (selectedFiles.length === 0) {
      showToast('⚠️ กรุณาเลือกไฟล์อย่างน้อย 1 ไฟล์')
      return
    }

    setStep('processing')
    setProcessingStep(0)
    setIsManualMode(false)
    const progressInterval = setInterval(() => {
      setProcessingStep(prev => (prev < 3 ? prev + 1 : prev))
    }, 2000)

    try {
      // Compress all images in parallel
      const filesData = await Promise.all(
        selectedFiles.map(async (sf) => {
          const base64data = await compressImage(sf.file)
          const mimeType = sf.file.type === 'application/pdf' ? 'application/pdf' : 'image/jpeg'
          return { data: base64data, mimeType }
        })
      )

      const res = await fetch('/api/ai/extract-claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: filesData })
      })

      const result = await res.json()
      clearInterval(progressInterval)

      if (!res.ok || result.error) {
        const errMsg = result.error || `HTTP ${res.status}`
        console.error('[AI extract] error:', errMsg)
        showToast('❌ AI อ่านไม่สำเร็จ: ' + errMsg)
        setStep('upload')
        return
      }

      setProcessingStep(4)
      setTimeout(() => {
        setData(result)
        setStep('form')
      }, 500)
    } catch (err: any) {
      clearInterval(progressInterval)
      console.error('Extract error:', err)
      showToast('❌ เกิดข้อผิดพลาด: ' + (err?.message || 'ไม่สามารถเชื่อมต่อ AI ได้'))
      setStep('upload')
    }
  }, [selectedFiles])

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) addFiles(files)
    // Reset input so the same file can be selected again
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const files = e.dataTransfer.files
    if (files && files.length > 0) addFiles(files)
  }

  const handleSave = async () => {
    if (data?.parts && Array.isArray(data.parts)) {
      const emptyPartIndex = data.parts.findIndex((p: any) => !p.partName?.value?.trim())
      if (emptyPartIndex !== -1) {
        showToast(`❌ กรุณาระบุชื่ออะไหล่ให้ครบทุกรายการ (รายการที่ ${emptyPartIndex + 1})`)
        return
      }
    }
    if (data?.labors && Array.isArray(data.labors)) {
      const emptyLaborIndex = data.labors.findIndex((l: any) => !l.description?.value?.trim())
      if (emptyLaborIndex !== -1) {
        showToast(`❌ กรุณาระบุชื่อรายการค่าแรงให้ครบทุกรายการ (รายการที่ ${emptyLaborIndex + 1})`)
        return
      }
    }

    try {
      const res = await fetch('/api/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to save')
      }
      router.push('/claims')
    } catch (err: any) {
      showToast('❌ เกิดข้อผิดพลาดในการบันทึก: ' + err.message)
    }
  }

  if (step === 'choose') {
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in relative">
        {toast && (
          <div className={`fixed top-6 right-6 text-white px-6 py-3 rounded-xl shadow-2xl z-50 animate-in slide-in-from-top-4 font-medium flex items-center gap-2 ${toast.includes('❌') || toast.includes('⚠️') ? 'bg-red-600' : 'bg-gray-800'}`}>
            {!toast.includes('❌') && !toast.includes('⚠️') && !toast.includes('✅') && '✅ '}
            <span>{toast}</span>
          </div>
        )}
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
          <Card className="cursor-pointer hover:shadow-lg hover:border-[#1d4ed8] transition-all duration-300 group" onClick={() => setStep('upload')}>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[#1d4ed8] to-[#3b82f6] flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-[#0f172a] mb-2">AI อ่านเอกสาร</h3>
              <p className="text-sm text-[#475569] mb-4">อัพโหลดภาพหรือ PDF เอกสาร Claim<br/>AI จะช่วยกรอกข้อมูลให้อัตโนมัติ<br/><span className="text-[#1d4ed8] font-medium">รองรับหลายภาพพร้อมกัน</span></p>
              <div className="flex flex-wrap justify-center gap-1.5">
                {['JPG', 'PNG', 'PDF', 'HEIC'].map(f => (
                  <span key={f} className="px-2 py-0.5 rounded bg-[#eff6ff] text-[#1d4ed8] text-[10px] font-medium">{f}</span>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg hover:border-[#1d4ed8] transition-all duration-300 group" onClick={startManual}>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[#475569] to-[#64748b] flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-[#0f172a] mb-2">กรอกข้อมูลเอง</h3>
              <p className="text-sm text-[#475569] mb-4">กรอกข้อมูล Claim, รถยนต์,<br/>อะไหล่ และค่าแรงด้วยตัวเอง</p>
              <span className="px-3 py-1 rounded-full bg-gray-100 text-[#475569] text-xs font-medium">ป้อนข้อมูลเอง</span>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (step === 'import') {
    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      await handleUploadExcel(file)
    }

    const handleDropExcel = async (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const file = e.dataTransfer.files?.[0]
      if (!file) return
      await handleUploadExcel(file)
    }

    const handleUploadExcel = async (file: File) => {
      setImporting(true)
      setImportResult(null)
      try {
        const formData = new FormData()
        formData.append('file', file)

        const res = await fetch('/api/claims/import', {
          method: 'POST',
          body: formData
        })

        if (!res.ok) {
          const errData = await res.json()
          throw new Error(errData.error || 'Failed to import Excel file')
        }

        const result = await res.json()
        setImportResult(result)
        showToast('✅ นำเข้าข้อมูลจาก Excel สำเร็จ')
      } catch (err: any) {
        console.error(err)
        showToast('❌ ' + (err.message || 'เกิดข้อผิดพลาดในการนำเข้าข้อมูล'))
      } finally {
        setImporting(false)
      }
    }

    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in relative">
        {toast && (
          <div className={`fixed top-6 right-6 text-white px-6 py-3 rounded-xl shadow-2xl z-50 animate-in slide-in-from-top-4 font-medium flex items-center gap-2 ${toast.includes('❌') || toast.includes('⚠️') ? 'bg-red-600' : 'bg-gray-800'}`}>
            {!toast.includes('❌') && !toast.includes('⚠️') && !toast.includes('✅') && '✅ '}
            <span>{toast}</span>
          </div>
        )}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setStep('choose')} disabled={importing}><ArrowLeft className="w-5 h-5" /></Button>
          <div>
            <h1 className="text-2xl font-bold text-[#0f172a]">นำเข้าจาก Excel</h1>
            <p className="text-sm text-[#94a3b8] mt-1">อัพโหลดไฟล์ Excel รายการอนุมัติเคลมเพื่อนำเข้าข้อมูลในระบบ</p>
          </div>
        </div>

        <Card>
          <CardContent className="p-8">
            {!importResult && !importing && (
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDropExcel}
                className={cn(
                  "border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer",
                  dragOver ? "border-[#1d4ed8] bg-[#eff6ff] scale-[1.01]" : "border-gray-300 hover:border-[#1d4ed8] hover:bg-[#f8faff]"
                )}
                onClick={() => document.getElementById('excel-upload')?.click()}
              >
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-green-600 to-emerald-500 flex items-center justify-center mb-4 shadow-lg">
                  <FileSpreadsheet className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-[#0f172a] mb-2">ลากไฟล์ Excel มาวางที่นี่</h3>
                <p className="text-sm text-[#94a3b8] mb-4">หรือคลิกเพื่อเลือกไฟล์ (.xls, .xlsx)</p>
                <p className="text-xs text-[#94a3b8]">รองรับรูปแบบข้อมูลตามไฟล์ template_approve.xls</p>
                <input id="excel-upload" type="file" accept=".xls,.xlsx" className="hidden" onChange={handleFileSelect} />
              </div>
            )}

            {importing && (
              <div className="text-center py-12 space-y-4">
                <Loader2 className="w-12 h-12 text-green-600 animate-spin mx-auto" />
                <h3 className="text-lg font-semibold text-[#0f172a]">กำลังนำเข้าข้อมูลจาก Excel...</h3>
                <p className="text-sm text-gray-500">ระบบกำลังประมวลผลข้อมูลและจับคู่บริษัทประกันกับศูนย์บริการ</p>
              </div>
            )}

            {importResult && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl text-green-800">
                  <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-sm">การนำเข้าข้อมูลเสร็จสิ้น</h4>
                    <p className="text-xs text-green-700 mt-0.5">ระบบได้ประมวลผลข้อมูลในไฟล์ทั้งหมดเรียบร้อยแล้ว</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-[#f8faff] rounded-xl p-4 border text-center">
                    <span className="text-xs text-[#475569]">แถวทั้งหมดในไฟล์</span>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{importResult.totalRows} แถว</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4 border border-green-100 text-center">
                    <span className="text-xs text-green-700">นำเข้าสำเร็จ</span>
                    <p className="text-2xl font-bold text-green-600 mt-1">{importResult.imported} รายการ</p>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 text-center">
                    <span className="text-xs text-amber-700">ข้าม (มีในระบบแล้ว)</span>
                    <p className="text-2xl font-bold text-amber-600 mt-1">{importResult.skipped} รายการ</p>
                  </div>
                  <div className="bg-red-50 rounded-xl p-4 border border-red-100 text-center">
                    <span className="text-xs text-red-700">พบข้อผิดพลาด</span>
                    <p className="text-2xl font-bold text-red-600 mt-1">{importResult.errors} รายการ</p>
                  </div>
                </div>

                <div className="flex gap-3 justify-end border-t pt-4">
                  <Button variant="outline" onClick={() => setImportResult(null)}>นำเข้าไฟล์อื่น</Button>
                  <Link href="/claims">
                    <Button className="bg-[#1d4ed8] hover:bg-[#1d4ed8]/90 text-white">ไปที่รายการ Claim ทั้งหมด</Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (step === 'upload') {
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in relative">
        {toast && (
          <div className={`fixed top-6 right-6 text-white px-6 py-3 rounded-xl shadow-2xl z-50 animate-in slide-in-from-top-4 font-medium flex items-center gap-2 ${toast.includes('❌') || toast.includes('⚠️') ? 'bg-red-600' : 'bg-gray-800'}`}>
            {!toast.includes('❌') && !toast.includes('⚠️') && !toast.includes('✅') && '✅ '}
            <span>{toast}</span>
          </div>
        )}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => { setStep('choose'); setSelectedFiles([]) }}><ArrowLeft className="w-5 h-5" /></Button>
          <div>
            <h1 className="text-2xl font-bold text-[#0f172a]">AI อ่านเอกสาร</h1>
            <p className="text-sm text-[#94a3b8] mt-1">อัพโหลดเอกสาร Claim เพื่อให้ AI ช่วยกรอกข้อมูล — รองรับหลายภาพพร้อมกัน</p>
          </div>
        </div>

        <Card>
          <CardContent className="p-8">
            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={cn(
                "border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 cursor-pointer",
                dragOver ? "border-[#1d4ed8] bg-[#eff6ff] scale-[1.01]" : "border-gray-300 hover:border-[#1d4ed8] hover:bg-[#f8faff]"
              )}
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-[#1d4ed8] to-[#3b82f6] flex items-center justify-center mb-3 shadow-lg">
                <Upload className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-base font-semibold text-[#0f172a] mb-1">ลากไฟล์มาวางที่นี่ หรือ คลิกเพื่อเลือกไฟล์</h3>
              <p className="text-xs text-[#94a3b8]">รองรับ JPG, PNG, WEBP, HEIC, PDF — เลือกได้หลายไฟล์พร้อมกัน</p>
              <input id="file-upload" type="file" accept=".jpg,.jpeg,.png,.webp,.heic,.pdf" className="hidden" onChange={onFileChange} multiple />
            </div>

            {/* Selected files preview */}
            {selectedFiles.length > 0 && (
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-[#0f172a] flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-[#1d4ed8]" />
                    ไฟล์ที่เลือก ({selectedFiles.length} ไฟล์)
                  </h4>
                  <button
                    onClick={() => document.getElementById('file-upload')?.click()}
                    className="text-xs text-[#1d4ed8] hover:text-[#1d4ed8]/80 font-medium flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    เพิ่มไฟล์
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {selectedFiles.map((sf) => (
                    <div key={sf.id} className="relative group rounded-xl border border-gray-200 overflow-hidden bg-gray-50 aspect-square">
                      {sf.preview === 'pdf' ? (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-3">
                          <FileText className="w-10 h-10 text-red-500" />
                          <span className="text-[10px] text-[#475569] text-center truncate w-full px-1">{sf.file.name}</span>
                        </div>
                      ) : (
                        <img
                          src={sf.preview}
                          alt={sf.file.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                      {/* Remove button */}
                      <button
                        onClick={(e) => { e.stopPropagation(); removeFile(sf.id) }}
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 hover:bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      {/* File name overlay */}
                      {sf.preview !== 'pdf' && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 pt-6">
                          <span className="text-[10px] text-white truncate block">{sf.file.name}</span>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Add more button tile */}
                  <div
                    onClick={() => document.getElementById('file-upload')?.click()}
                    className="rounded-xl border-2 border-dashed border-gray-300 hover:border-[#1d4ed8] aspect-square flex flex-col items-center justify-center gap-1 cursor-pointer transition-all duration-200 hover:bg-[#f8faff]"
                  >
                    <Plus className="w-6 h-6 text-gray-400" />
                    <span className="text-[10px] text-gray-400">เพิ่มรูป</span>
                  </div>
                </div>

                {/* Extract button */}
                <Button
                  onClick={handleExtractMultiple}
                  className="w-full bg-gradient-to-r from-[#1d4ed8] to-[#3b82f6] hover:from-[#1e40af] hover:to-[#2563eb] text-white shadow-lg h-12 text-base font-semibold"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  ให้ AI อ่านเอกสาร {selectedFiles.length > 1 ? `ทั้ง ${selectedFiles.length} ไฟล์` : ''}
                </Button>
              </div>
            )}

            <div className="mt-6 flex items-center gap-3 text-sm text-[#475569]">
              <Sparkles className="w-5 h-5 text-[#1d4ed8] flex-shrink-0" />
              <span>AI จะอ่านเอกสารทุกหน้าพร้อมกันและกรอกข้อมูลให้อัตโนมัติ — คุณสามารถแก้ไขทุก field ได้ภายหลัง</span>
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
            <h2 className="text-xl font-bold text-[#0f172a] mb-2">AI กำลังอ่านเอกสาร</h2>
            {selectedFiles.length > 1 && (
              <p className="text-sm text-[#94a3b8] mb-4">กำลังวิเคราะห์ {selectedFiles.length} ไฟล์พร้อมกัน</p>
            )}
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

  if (step === 'form') {
    return (
      <ClaimFormReview
        data={data}
        setData={setData}
        partsMaster={partsMaster}
        isManualMode={isManualMode}
        setStep={setStep}
        handleSave={handleSave}
        showToast={showToast}
      />
    )
  }

  return null
}

