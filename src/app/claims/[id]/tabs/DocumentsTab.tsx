'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Paperclip, Upload, Trash2, Eye, FileText, Image, File } from 'lucide-react'
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

  return (
    <div className="space-y-6">
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
            <Table>
              <TableHeader>
                <TableRow className="bg-[#f8faff]">
                  <TableHead className="text-xs w-10">#</TableHead>
                  <TableHead className="text-xs">ชื่อไฟล์</TableHead>
                  <TableHead className="text-xs">คำอธิบาย</TableHead>
                  <TableHead className="text-xs">ขนาด</TableHead>
                  <TableHead className="text-xs">วันที่อัพโหลด</TableHead>
                  <TableHead className="text-xs">ผู้อัพโหลด</TableHead>
                  <TableHead className="text-xs text-center">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc: any, i: number) => {
                  const IconComp = FILE_ICONS[doc.fileType] || File
                  return (
                    <TableRow key={doc.id} className="hover:bg-blue-50/30">
                      <TableCell className="text-xs text-[#94a3b8]">{i + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <IconComp className="w-4 h-4 text-[#1d4ed8] flex-shrink-0" />
                          <span className="text-sm font-medium truncate max-w-[200px]">{doc.fileName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-[#475569]">{doc.description || '—'}</TableCell>
                      <TableCell className="text-xs text-[#94a3b8]">{formatFileSize(doc.fileSize)}</TableCell>
                      <TableCell className="text-xs">{formatDate(doc.createdAt)}</TableCell>
                      <TableCell className="text-xs text-[#94a3b8]">{doc.uploadedBy}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="sm" className="text-[#1d4ed8] p-1" onClick={() => window.open(doc.fileUrl)}>
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-500 p-1 hover:bg-red-50" onClick={() => handleDelete(doc.id, doc.fileName)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
