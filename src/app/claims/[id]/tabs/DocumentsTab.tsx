'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Paperclip, Upload, Trash2, Eye, FileText, Image, File, X, Download } from 'lucide-react'
import { formatDate } from '@/lib/date'
import { uploadToR2 } from '@/lib/upload'
import { ClaimTabProps } from './types'

const FILE_ICONS: Record<string, any> = {
  image: Image,
  pdf: FileText,
  other: File,
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

export default function DocumentsTab({ claim, showToast, setErrorModalMsg, setConfirmModal, refreshClaim }: ClaimTabProps) {
  const documents = claim.documents || []
  const [showUpload, setShowUpload] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [description, setDescription] = useState('')
  const [uploading, setUploading] = useState(false)
  const [previewDoc, setPreviewDoc] = useState<{ fileName: string; fileUrl: string; fileType: string } | null>(null)

  const handleUpload = async () => {
    if (!file) {
      showToast('กรุณาเลือกไฟล์')
      return
    }
    setUploading(true)
    try {
      const fileUrl = await uploadToR2(file, 'claim-documents')
      const fileType = file.type.startsWith('image/') ? 'image' : file.type === 'application/pdf' ? 'pdf' : 'other'
      
      const res = await fetch(`/api/claims/${claim.id}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileUrl,
          fileType,
          fileSize: file.size,
          description: description || null,
        })
      })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error) }
      showToast('อัพโหลดเอกสารเรียบร้อย')
      setFile(null)
      setDescription('')
      setShowUpload(false)
      await refreshClaim()
    } catch (err: any) {
      setErrorModalMsg(`อัพโหลดไม่สำเร็จ: ${err.message}`)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = (docId: string, fileName: string) => {
    setConfirmModal({
      title: 'ลบเอกสาร',
      message: `ต้องการลบ "${fileName}" ?`,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/claims/${claim.id}/documents?docId=${docId}`, { method: 'DELETE' })
          if (!res.ok) throw new Error('ลบไม่สำเร็จ')
          showToast('ลบเอกสารเรียบร้อย')
          await refreshClaim()
        } catch (err: any) {
          setErrorModalMsg(err.message)
        }
      }
    })
  }

  const handlePreview = (doc: any) => {
    // PDF and images can be previewed inline; other types open in new tab
    const isPdf = doc.fileName?.toLowerCase().endsWith('.pdf') || doc.fileUrl?.toLowerCase().includes('.pdf') || doc.fileType === 'pdf'
    const isImage = !!(doc.fileName?.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/i) || doc.fileUrl?.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)/i) || doc.fileType === 'image')
    
    if (isPdf || isImage) {
      setPreviewDoc({ fileName: doc.fileName, fileUrl: doc.fileUrl, fileType: isPdf ? 'pdf' : 'image' })
    } else {
      window.open(doc.fileUrl)
    }
  }

  return (
    <div className="space-y-6">
      {/* Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 bg-black/70 z-50 flex flex-col" onClick={() => setPreviewDoc(null)}>
          {/* Header Bar */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#0f172a]/90 backdrop-blur-sm border-b border-white/10" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-blue-400" />
              <span className="text-white text-sm font-medium truncate max-w-[400px]">{previewDoc.fileName}</span>
              <Badge className="border-none text-[10px] bg-white/10 text-white/70">{previewDoc.fileType.toUpperCase()}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-white/80 hover:text-white hover:bg-white/10 h-8 text-xs"
                onClick={() => window.open(previewDoc.fileUrl)}
              >
                <Download className="w-3.5 h-3.5 mr-1" />ดาวน์โหลด
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-white/80 hover:text-white hover:bg-white/10 h-8 w-8 p-0"
                onClick={() => setPreviewDoc(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          {/* Content */}
          <div className="flex-1 flex items-center justify-center p-4 overflow-auto" onClick={e => e.stopPropagation()}>
            {previewDoc.fileType === 'pdf' ? (
              <iframe
                src={previewDoc.fileUrl}
                className="w-full h-full max-w-5xl rounded-lg border border-white/10 bg-white"
                style={{ minHeight: 'calc(100vh - 80px)' }}
                title={previewDoc.fileName}
              />
            ) : (
              <img
                src={previewDoc.fileUrl}
                alt={previewDoc.fileName}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              />
            )}
          </div>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Paperclip className="w-5 h-5 text-[#1d4ed8]" />
            เอกสารแนบ ({documents.length})
          </CardTitle>
          <Button size="sm" className="bg-[#1d4ed8]" onClick={() => setShowUpload(!showUpload)}>
            <Upload className="w-4 h-4 mr-1" />{showUpload ? 'ยกเลิก' : 'อัพโหลดเอกสาร'}
          </Button>
        </CardHeader>
        <CardContent>
          {/* Upload Form */}
          {showUpload && (
            <div className="bg-[#f8faff] border border-blue-100 rounded-lg p-4 mb-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-[#475569]">เลือกไฟล์</label>
                <div className="mt-1 border-2 border-dashed border-blue-200 rounded-lg p-4 text-center hover:border-blue-400 transition-colors cursor-pointer"
                  onClick={() => document.getElementById('doc-file-input')?.click()}>
                  {file ? (
                    <div className="flex items-center justify-center gap-2">
                      <FileText className="w-5 h-5 text-[#1d4ed8]" />
                      <span className="text-sm font-medium text-[#0f172a]">{file.name}</span>
                      <Badge className="border-none text-[9px] bg-gray-100 text-gray-600">{formatFileSize(file.size)}</Badge>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-8 h-8 mx-auto text-blue-300 mb-1" />
                      <p className="text-sm text-[#94a3b8]">คลิกเพื่อเลือกไฟล์ หรือลากมาวาง</p>
                      <p className="text-[10px] text-[#94a3b8] mt-1">รองรับ: รูปภาพ, PDF, เอกสาร</p>
                    </div>
                  )}
                  <input id="doc-file-input" type="file" className="hidden" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" onChange={e => setFile(e.target.files?.[0] || null)} />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-[#475569]">คำอธิบาย (ไม่บังคับ)</label>
                <Input className="mt-1" placeholder="เช่น ใบเสร็จค่าซ่อม, รูปถ่ายความเสียหาย" value={description} onChange={e => setDescription(e.target.value)} />
              </div>
              <div className="flex justify-end">
                <Button className="bg-[#1d4ed8]" disabled={uploading || !file} onClick={handleUpload}>
                  {uploading ? 'กำลังอัพโหลด...' : 'อัพโหลด'}
                </Button>
              </div>
            </div>
          )}

          {/* Document List */}
          {documents.length === 0 ? (
            <div className="text-center py-10 text-[#94a3b8]">
              <Paperclip className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">ยังไม่มีเอกสารแนบ</p>
              <p className="text-xs mt-1">กดปุ่ม "อัพโหลดเอกสาร" เพื่อเพิ่มไฟล์ เช่น รูปถ่าย, ใบเสร็จ, เอกสารสัญญา</p>
            </div>
          ) : (
            <div className="space-y-4">
              {documents.map((doc: any, i: number) => {
                const isPdf = doc.fileName?.toLowerCase().endsWith('.pdf') || doc.fileUrl?.toLowerCase().includes('.pdf') || doc.fileType === 'pdf'
                const isImage = !!(doc.fileName?.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/i) || doc.fileUrl?.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)/i) || doc.fileType === 'image')
                const isExcel = !!(doc.fileName?.toLowerCase().match(/\.(xls|xlsx)$/i) || doc.fileUrl?.toLowerCase().match(/\.(xls|xlsx)/i) || doc.fileType === 'excel' || doc.fileType === 'xls' || doc.fileType === 'xlsx')
                
                const IconComp = isPdf ? FileText : isImage ? Image : FileText
                const iconBgClass = isPdf ? 'bg-red-50' : isImage ? 'bg-blue-50' : isExcel ? 'bg-green-50' : 'bg-gray-50'
                const iconColorClass = isPdf ? 'text-red-500' : isImage ? 'text-blue-500' : isExcel ? 'text-green-600' : 'text-gray-500'
                return (
                  <div key={doc.id} className="bg-[#f8faff] rounded-lg border border-gray-100 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between p-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded flex items-center justify-center ${iconBgClass}`}>
                          <IconComp className={`w-4 h-4 ${iconColorClass}`} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#0f172a]">{doc.fileName}</p>
                          <p className="text-xs text-[#94a3b8]">
                            {doc.description || formatFileSize(doc.fileSize)} • {formatDate(doc.createdAt)}
                            {doc.uploadedBy && ` • ${doc.uploadedBy}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="text-[#1d4ed8] p-1" onClick={() => window.open(doc.fileUrl)}>
                          <Download className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-500 p-1 hover:bg-red-50" onClick={() => handleDelete(doc.id, doc.fileName)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                    {/* Inline Preview */}
                    {isPdf && doc.fileUrl && (
                      <div className="px-3 pb-3">
                        <iframe src={doc.fileUrl} className="w-full rounded-lg border border-gray-200 bg-white" style={{ height: '500px' }} title={doc.fileName} />
                      </div>
                    )}
                    {isImage && doc.fileUrl && (
                      <div className="px-3 pb-3">
                        <img src={doc.fileUrl} alt={doc.fileName} className="w-full rounded-lg border border-gray-200 object-contain max-h-[500px] bg-white" />
                      </div>
                    )}
                    {isExcel && doc.fileUrl && (
                      <div className="px-3 pb-3">
                        <div className="p-3 bg-green-50 border border-green-100 rounded-lg flex items-center justify-between">
                          <span className="text-xs text-green-700 font-medium">ไฟล์ Excel (ดาวน์โหลดเพื่อเปิดดู)</span>
                          <Button size="sm" className="h-7 bg-green-600 hover:bg-green-700 text-xs text-white" onClick={() => window.open(doc.fileUrl, '_blank')}>
                            <Download className="w-3 h-3 mr-1" />ดาวน์โหลด Excel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
