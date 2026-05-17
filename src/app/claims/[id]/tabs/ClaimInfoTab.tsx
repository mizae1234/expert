'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { formatDate } from '@/lib/date'
import { ClaimTabProps } from './types'
import { useState, useEffect, useRef } from 'react'

// Autocomplete dropdown component
function AutocompleteSelect({ label, value, options, onChange, editMode }: {
  label: string
  value: string
  options: { id: string; name: string }[]
  onChange: (id: string, name: string) => void
  editMode: boolean
}) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = options.filter(o => o.name.toLowerCase().includes(search.toLowerCase()))

  if (!editMode) {
    return (
      <div className="flex justify-between items-center py-2 border-b border-gray-50">
        <span className="text-sm text-[#475569]">{label}</span>
        <span className="text-sm font-medium text-[#0f172a]">{value}</span>
      </div>
    )
  }

  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-50">
      <span className="text-sm text-[#475569]">{label}</span>
      <div className="relative w-56" ref={ref}>
        <Input
          className="h-8 text-sm text-right pr-8"
          value={search || value}
          onChange={e => { setSearch(e.target.value); setOpen(true) }}
          onFocus={() => { setSearch(''); setOpen(true) }}
          placeholder="ค้นหา..."
        />
        {open && filtered.length > 0 && (
          <div className="absolute right-0 top-9 w-full bg-white border rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
            {filtered.map(o => (
              <button
                key={o.id}
                className="w-full px-3 py-2 text-sm text-left hover:bg-blue-50 transition-colors"
                onClick={() => { onChange(o.id, o.name); setSearch(''); setOpen(false) }}
              >
                {o.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function ClaimInfoTab({ claim, editMode, vendors }: ClaimTabProps) {
  const [formData, setFormData] = useState({
    claimNo: claim.claimNo || '',
    receiveNo: claim.receiveNo || '',
    transactionNo: claim.transactionNo || '',
    carPlate: claim.carPlate || '',
    province: claim.province || '',
    carBrand: claim.carBrand || '',
    carModel: claim.carModel || '',
    carVin: claim.carVin || '',
    insuredName: claim.insuredName || '',
  })

  const [insuranceName, setInsuranceName] = useState(claim.insurance?.name || '')
  const [garageName, setGarageName] = useState(claim.garage?.name || '')

  // Insurance and garage lists from vendors prop (already fetched by parent)
  const [insurances, setInsurances] = useState<{ id: string; name: string }[]>([])
  const [garages, setGarages] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    // Fetch insurances and garages for autocomplete
    fetch('/api/insurances').then(r => r.json()).then(data => {
      if (Array.isArray(data)) setInsurances(data.map((i: any) => ({ id: i.id, name: i.name })))
    }).catch(() => {})
    fetch('/api/garages').then(r => r.json()).then(data => {
      if (Array.isArray(data)) setGarages(data.map((g: any) => ({ id: g.id, name: g.name })))
    }).catch(() => {})
  }, [])

  // Sync form data when claim changes
  useEffect(() => {
    setFormData({
      claimNo: claim.claimNo || '',
      receiveNo: claim.receiveNo || '',
      transactionNo: claim.transactionNo || '',
      carPlate: claim.carPlate || '',
      province: claim.province || '',
      carBrand: claim.carBrand || '',
      carModel: claim.carModel || '',
      carVin: claim.carVin || '',
      insuredName: claim.insuredName || '',
    })
    setInsuranceName(claim.insurance?.name || '')
    setGarageName(claim.garage?.name || '')
  }, [claim])

  const handleChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }))
    ;(claim as any)[key] = value
  }

  const textFields = [
    { key: 'claimNo', label: 'Claim No.' },
    { key: 'receiveNo', label: 'Receive No.' },
    { key: 'transactionNo', label: 'Transaction No.' },
  ]

  const carFields = [
    { key: 'carPlate', label: 'ทะเบียน' },
    { key: 'province', label: 'จังหวัด' },
    { key: 'carBrand', label: 'ยี่ห้อ' },
    { key: 'carModel', label: 'รุ่น' },
    { key: 'carVin', label: 'VIN' },
    { key: 'insuredName', label: 'ผู้เอาประกัน' },
  ]

  const renderTextField = (field: { key: string; label: string }) => {
    const val = (formData as any)[field.key]
    return (
      <div key={field.label} className="flex justify-between items-center py-2 border-b border-gray-50">
        <span className="text-sm text-[#475569]">{field.label}</span>
        {editMode ? (
          <Input className="w-56 h-8 text-sm text-right" value={val} onChange={e => handleChange(field.key, e.target.value)} />
        ) : (
          <span className="text-sm font-medium text-[#0f172a]">{val}</span>
        )}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader><CardTitle className="text-base">ข้อมูล Claim</CardTitle></CardHeader>
        <CardContent className="space-y-1">
          {textFields.map(renderTextField)}

          {/* Insurance - autocomplete */}
          <AutocompleteSelect
            label="บ.ประกัน"
            value={insuranceName}
            options={insurances}
            editMode={editMode}
            onChange={(id, name) => {
              setInsuranceName(name)
              ;(claim as any).insuranceId = id
            }}
          />

          {/* Garage - autocomplete */}
          <AutocompleteSelect
            label="อู่"
            value={garageName}
            options={garages}
            editMode={editMode}
            onChange={(id, name) => {
              setGarageName(name)
              ;(claim as any).garageId = id
            }}
          />

          {/* Date */}
          <div className="flex justify-between items-center py-2 border-b border-gray-50">
            <span className="text-sm text-[#475569]">วันที่รับ</span>
            {editMode ? (
              <Input
                type="date"
                className="w-56 h-8 text-sm text-right"
                defaultValue={new Date(claim.createdAt).toISOString().split('T')[0]}
                onChange={e => { (claim as any).createdAt = new Date(e.target.value).toISOString() }}
              />
            ) : (
              <span className="text-sm font-medium text-[#0f172a]">{formatDate(claim.createdAt)}</span>
            )}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">ข้อมูลรถยนต์</CardTitle></CardHeader>
        <CardContent className="space-y-1">
          {carFields.map(renderTextField)}
        </CardContent>
      </Card>
    </div>
  )
}
