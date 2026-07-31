"use client"

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { 
  ArrowLeft, Plus, Trash2, Save, Wrench, Copy, X, 
  Upload, Sparkles, User
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default function EditServiceJobPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string

  // API states
  const [customers, setCustomers] = useState<any[]>([])
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [operationDate, setOperationDate] = useState('')
  const [loadingCustomers, setLoadingCustomers] = useState(false)
  const [loadingOrder, setLoadingOrder] = useState(true)

  // Batch Default Settings
  const [defaultBrand, setDefaultBrand] = useState('')
  const [defaultModel, setDefaultModel] = useState('')
  const [defaultDescription, setDefaultDescription] = useState('')
  const [defaultPrice, setDefaultPrice] = useState<number>(0)
  const [serviceCatalog, setServiceCatalog] = useState<any[]>([])

  // Vehicles list state
  const [vehicles, setVehicles] = useState<any[]>([])

  // Modal & Uploader state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [pastedExcelText, setPastedExcelText] = useState('')

  // Form submit state
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch Service Order details to edit
  const fetchOrderDetails = async () => {
    try {
      const res = await fetch(`/api/service-orders/${orderId}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      setSelectedCustomerId(data.customerId || '')
      if (data.operationDate) {
        setOperationDate(new Date(data.operationDate).toISOString().split('T')[0])
      }
      
      // Map vehicles to the edit form state
      if (Array.isArray(data.vehicles)) {
        setVehicles(data.vehicles.map((v: any) => ({
          id: v.id,
          carPlate: v.carPlate,
          carProvince: v.carProvince || '',
          carBrand: v.carBrand,
          carModel: v.carModel,
          carVin: v.carVin || '',
          items: Array.isArray(v.items) ? v.items.map((item: any) => ({
            description: item.description,
            quantity: item.quantity,
            priceUnit: item.priceUnit
          })) : [{ description: '', quantity: 1, priceUnit: 0 }]
        })))
      }
    } catch (err: any) {
      console.error(err)
      setError('ไม่สามารถดึงข้อมูลใบสั่งงานได้: ' + err.message)
    } finally {
      setLoadingOrder(false)
    }
  }

  const fetchCustomers = async () => {
    setLoadingCustomers(true)
    try {
      const res = await fetch('/api/customers')
      const data = await res.json()
      if (Array.isArray(data)) {
        setCustomers(data)
      }
    } catch (err) {
      console.error('Error fetching customers:', err)
    } finally {
      setLoadingCustomers(false)
    }
  }

  const fetchServices = async () => {
    try {
      const res = await fetch('/api/services?active=true')
      const data = await res.json()
      if (Array.isArray(data)) {
        setServiceCatalog(data)
      }
    } catch (err) {
      console.error('Error fetching services:', err)
    }
  }

  useEffect(() => {
    fetchCustomers()
    fetchServices()
    fetchOrderDetails()
  }, [orderId])

  // Vehicle operations
  const handleAddVehicle = () => {
    setVehicles([
      ...vehicles,
      {
        id: `v-${Date.now()}-${Math.random()}`,
        carPlate: '',
        carProvince: '',
        carBrand: defaultBrand || 'BYD',
        carModel: defaultModel || 'ES',
        carVin: '',
        items: [{
          description: defaultDescription || '',
          quantity: 1,
          priceUnit: defaultPrice || 0
        }]
      }
    ])
  }

  const handleRemoveVehicle = (id: string) => {
    if (vehicles.length > 1) {
      setVehicles(vehicles.filter(v => v.id !== id))
    }
  }

  const handleUpdateVehicleField = (id: string, field: string, value: string) => {
    setVehicles(vehicles.map(v => {
      if (v.id === id) {
        return { ...v, [field]: value }
      }
      return v
    }))
  }

  // Service item operations per vehicle
  const handleAddServiceItem = (vehicleId: string) => {
    setVehicles(vehicles.map(v => {
      if (v.id === vehicleId) {
        return {
          ...v,
          items: [
            ...v.items,
            {
              description: defaultDescription || '',
              quantity: 1,
              priceUnit: defaultPrice || 0
            }
          ]
        }
      }
      return v
    }))
  }

  const handleRemoveServiceItem = (vehicleId: string, itemIdx: number) => {
    setVehicles(vehicles.map(v => {
      if (v.id === vehicleId && v.items.length > 1) {
        return {
          ...v,
          items: v.items.filter((_item: any, idx: number) => idx !== itemIdx)
        }
      }
      return v
    }))
  }

  const handleUpdateServiceItem = (vehicleId: string, itemIdx: number, field: string, value: any) => {
    setVehicles(vehicles.map(v => {
      if (v.id === vehicleId) {
        const updatedItems = [...v.items]
        updatedItems[itemIdx] = { ...updatedItems[itemIdx], [field]: value }
        return { ...v, items: updatedItems }
      }
      return v
    }))
  }

  const handleDefaultDescriptionChange = (value: string) => {
    setDefaultDescription(value)
    const matched = serviceCatalog.find(s => s.name.trim().toLowerCase() === value.trim().toLowerCase())
    if (matched) {
      setDefaultPrice(matched.price)
    }
  }

  const handleUpdateServiceItemDescription = (vehicleId: string, itemIdx: number, value: string) => {
    const matched = serviceCatalog.find(s => s.name.trim().toLowerCase() === value.trim().toLowerCase())
    setVehicles(vehicles.map(v => {
      if (v.id === vehicleId) {
        const updatedItems = [...v.items]
        updatedItems[itemIdx] = { 
          ...updatedItems[itemIdx], 
          description: value,
          priceUnit: matched ? matched.price : updatedItems[itemIdx].priceUnit,
          serviceCode: matched ? matched.serviceCode : null
        }
        return { ...v, items: updatedItems }
      }
      return v
    }))
  }

  const handleApplyDefaultsToAll = () => {
    const updated = vehicles.map(v => ({
      ...v,
      carBrand: v.carBrand || defaultBrand,
      carModel: v.carModel || defaultModel,
      items: v.items.map((item: any, idx: number) => {
        if (idx === 0 && !item.description) {
          return {
            ...item,
            description: defaultDescription,
            priceUnit: defaultPrice || item.priceUnit
          }
        }
        return item
      })
    }))
    setVehicles(updated)
  }

  // Excel template downloader
  const parseThaiExcelDate = (dateStr: string): string => {
    if (!dateStr) return ''
    const parts = dateStr.trim().split(/[\/\-\.]/)
    if (parts.length === 3) {
      let day = parseInt(parts[0], 10)
      let month = parseInt(parts[1], 10)
      let year = parseInt(parts[2], 10)
      if (year > 2500) {
        year = year - 543
      } else if (year < 100) {
        year = year + 2000
      }
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      }
    }
    return ''
  }

  // Excel template downloader
  const handleDownloadTemplate = async () => {
    try {
      const XLSX = await import('xlsx')
      const data = [
        ['พ่นทะเบียน', '', '', '', ''],
        ['วันที่ปฏิบัติงาน', '1/6/2026', '', '', ''],
        ['No.', 'Vin No.', 'ยี่ห้อ', 'Model', 'ทะเบียน'],
        ['1', 'LNAAKAA19R5E02010', 'AION', 'ES', 'ทอ-7542'],
        ['2', 'LNAAKAA13R5E01693', 'AION', 'ES', 'ทอ-7547'],
        ['3', 'LNAAKAA1XR5E01707', 'AION', 'ES', 'ทอ-7548'],
      ]
      
      const ws = XLSX.utils.aoa_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Template')
      XLSX.writeFile(wb, 'expert_service_job_template.xlsx')
    } catch (err: any) {
      console.error('Error generating template:', err)
      alert('ไม่สามารถดาวน์โหลดเทมเพลตได้: ' + err.message)
    }
  }

  const parseExcelData = async (grid: string[][]) => {
    if (grid.length === 0) return { parsedVehicles: [], jobDescription: '', parsedOperationDate: '' }

    let startRow = 0
    let jobDescription = ''
    let parsedOperationDate = ''

    // Detect if Row 1 is a single description cell (A1 filled, others empty in the first row)
    const firstRowVal = grid[0].filter(c => c.trim() !== '')
    if (firstRowVal.length === 1 && grid[0][0]) {
      jobDescription = grid[0][0]
      startRow = 1 // Headers/Dates are next
    }

    // Check if the next row has "วันที่ปฏิบัติงาน" in column A
    if (grid[startRow] && grid[startRow].length >= 2) {
      const firstCell = grid[startRow][0].trim()
      if (firstCell.includes('วันที่ปฏิบัติงาน')) {
        parsedOperationDate = grid[startRow][1].trim()
        startRow = startRow + 1
      }
    }

    const headerRow = grid[startRow] || []
    let vinIdx = -1
    let brandIdx = -1
    let modelIdx = -1
    let plateIdx = -1

    // Detect headers
    const isHeader = headerRow.some(cell => {
      const c = cell.toLowerCase()
      return c.includes('vin') || c.includes('no') || c.includes('model') || c.includes('ทะเบียน') || c.includes('plate')
    })

    if (isHeader) {
      startRow = startRow + 1 // Data starts after header row
      headerRow.forEach((cell, idx) => {
        const c = cell.toLowerCase()
        if (c.includes('vin') || c.includes('เลขตัวถัง')) vinIdx = idx
        if (c.includes('ยี่ห้อ') || c.includes('brand') || c.includes('brand/ยี่ห้อ')) brandIdx = idx
        if (c.includes('model') || c.includes('รุ่น')) modelIdx = idx
        if (c.includes('ทะเบียน') || c.includes('plate')) plateIdx = idx
      })
    }

    // Default column indexes if header not matched: 1=VIN, 2=Brand, 3=Model, 4=Plate
    if (vinIdx === -1) vinIdx = 1
    if (brandIdx === -1) brandIdx = 2
    if (modelIdx === -1) modelIdx = 3
    if (plateIdx === -1) plateIdx = 4

    const parsedVehicles: any[] = []
    const rawServiceName = jobDescription || defaultDescription || 'พ่นทะเบียน'
    const serviceName = rawServiceName.replace(/^['"\s]+|['"\s]+$/g, '').trim()
    const matchedService = serviceCatalog.find(s => s.name.trim().toLowerCase() === serviceName.toLowerCase())
    const resolvedPrice = matchedService ? matchedService.price : (defaultPrice || 0)

    const isSprayingPlate = serviceName.toLowerCase() === 'พ่นทะเบียน'

    for (let i = startRow; i < grid.length; i++) {
      const row = grid[i]
      if (row.length === 0) continue

      const vin = (row[vinIdx] || '').trim()
      const brand = row[brandIdx] || defaultBrand || 'BYD'
      const model = row[modelIdx] || defaultModel || 'ES'
      const plate = (row[plateIdx] || '').trim()

      if (isSprayingPlate && (plate === '' || plate === '-' || plate.length === 0)) {
        throw new Error(`แถวที่ ${i - startRow + 1}: สำหรับบริการพ่นทะเบียน จำเป็นต้องระบุเลขทะเบียน ห้ามใส่ค่าว่าง, ช่องว่าง หรือเครื่องหมาย -`)
      }

      if (vin || plate) {
        let finalDescription = serviceName
        let finalPrice = resolvedPrice
        let isLocked = false

        if (isSprayingPlate && vin) {
          try {
            const checkRes = await fetch(`/api/services/check-vin?vin=${vin}`)
            if (checkRes.ok) {
              const checkData = await checkRes.json()
              if (checkData.hasDone) {
                finalDescription = checkData.sv00001?.name || 'พ่นทะเบียนแบบมีพ่นข้างมาก่อน'
                finalPrice = checkData.sv00001?.price ?? 200
                isLocked = true
              } else {
                finalDescription = checkData.sv00004?.name || 'พ่นทะเบียนอย่างเดียวไม่มีพ่นข้างมาก่อน'
                finalPrice = checkData.sv00004?.price ?? 400
              }
            }
          } catch (apiErr) {
            console.error('Error checking VIN history:', apiErr)
          }
        }

        parsedVehicles.push({
          id: `v-imported-${Date.now()}-${i}-${Math.random()}`,
          carPlate: plate,
          carProvince: '',
          carBrand: brand,
          carModel: model,
          carVin: vin,
          items: [{
            description: finalDescription,
            quantity: 1,
            priceUnit: finalPrice,
            isLocked
          }]
        })
      }
    }

    return { parsedVehicles, jobDescription, parsedOperationDate }
  }

  const handleImportExcel = async () => {
    if (!pastedExcelText.trim()) return

    const rows = pastedExcelText.split('\n').map(r => r.trim()).filter(r => r.length > 0)
    if (rows.length === 0) return

    const grid = rows.map(r => r.split('\t').map(c => c.trim()))
    try {
      const { parsedVehicles, jobDescription, parsedOperationDate } = await parseExcelData(grid)

      if (parsedVehicles.length > 0) {
        if (jobDescription) {
          setDefaultDescription(jobDescription)
        }
        if (parsedOperationDate) {
          const formatted = parseThaiExcelDate(parsedOperationDate)
          if (formatted) setOperationDate(formatted)
        }
        if (vehicles.length === 1 && !vehicles[0].carPlate && !vehicles[0].carVin) {
          setVehicles(parsedVehicles)
        } else {
          setVehicles([...vehicles, ...parsedVehicles])
        }
        setPastedExcelText('')
        setIsImportModalOpen(false)
      }
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const XLSX = await import('xlsx')
      const reader = new FileReader()
      reader.onload = async (evt) => {
        try {
          const bstr = evt.target?.result
          const wb = XLSX.read(bstr, { type: 'binary' })
          const wsname = wb.SheetNames[0]
          const ws = wb.Sheets[wsname]
          
          const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:F100')
          const grid: string[][] = []
          
          for (let R = range.s.r; R <= range.e.r; ++R) {
            const rowArr: string[] = []
            for (let C = range.s.c; C <= range.e.c; ++C) {
              const cellRef = XLSX.utils.encode_cell({ r: R, c: C })
              const cellObj = ws[cellRef]
              rowArr.push(cellObj ? (cellObj.w || cellObj.v || '').toString().trim() : '')
            }
            grid.push(rowArr)
          }

          const { parsedVehicles, jobDescription, parsedOperationDate } = await parseExcelData(grid)

          if (parsedVehicles.length > 0) {
            if (jobDescription) {
              setDefaultDescription(jobDescription)
            }
            if (parsedOperationDate) {
              const formatted = parseThaiExcelDate(parsedOperationDate)
              if (formatted) setOperationDate(formatted)
            }
            if (vehicles.length === 1 && !vehicles[0].carPlate && !vehicles[0].carVin) {
              setVehicles(parsedVehicles)
            } else {
              setVehicles([...vehicles, ...parsedVehicles])
            }
            setIsImportModalOpen(false)
          } else {
            alert('ไม่พบข้อมูลรถยนต์ในไฟล์ Excel')
          }
        } catch (parseErr: any) {
          console.error('Error parsing sheet:', parseErr)
          alert('ไม่สามารถอ่านข้อมูลจากไฟล์ Excel ได้: ' + parseErr.message)
        }
      }
      reader.readAsBinaryString(file)
    } catch (err: any) {
      console.error('Error loading XLSX library:', err)
      alert('เกิดข้อผิดพลาดในการโหลดระบบอ่านไฟล์ Excel: ' + err.message)
    }
  }

  // Calculate pricing
  const subtotal = useMemo(() => {
    return vehicles.reduce((sum, v) => {
      const vSum = v.items.reduce((itemSum: number, item: any) => {
        return itemSum + (item.quantity * item.priceUnit || 0)
      }, 0)
      return sum + vSum
    }, 0)
  }, [vehicles])

  const vatAmount = subtotal * 0.07
  const grandTotal = subtotal + vatAmount

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!selectedCustomerId) {
      setError('กรุณาเลือกลูกค้า/ผู้ว่าจ้าง')
      return
    }

    // Filter out completely blank vehicle entries
    const validVehicles = vehicles.filter(v => v.carPlate.trim() || v.carVin.trim())
    if (validVehicles.length === 0) {
      setError('กรุณากรอกข้อมูลรถยนต์อย่างน้อย 1 คัน')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/service-orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomerId,
          operationDate: operationDate || null,
          vehicles: validVehicles.map(v => ({
            carPlate: v.carPlate,
            carProvince: v.carProvince,
            carBrand: v.carBrand,
            carModel: v.carModel,
            carVin: v.carVin,
            items: v.items.filter((item: any) => item.description.trim() !== '').map((item: any) => ({
              serviceCode: item.serviceCode || null,
              description: item.description,
              quantity: item.quantity,
              priceUnit: item.priceUnit
            }))
          }))
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'บันทึกการแก้ไขไม่สำเร็จ')

      router.push(`/service-jobs/${orderId}`)
    } catch (err: any) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  if (loadingOrder) {
    return <div className="p-8 text-center text-gray-500">กำลังโหลดรายละเอียดใบสั่งงาน...</div>
  }

  return (
    <div className="space-y-6 animate-fade-in p-6 max-w-6xl mx-auto">
      {/* Title */}
      <div className="flex items-center gap-3">
        <Link href={`/service-jobs/${orderId}`}>
          <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg border-gray-200">
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a] flex items-center gap-2">
            <Wrench className="w-6 h-6 text-[#1d4ed8]" />
            แก้ไขใบสั่งงานบริการ
          </h1>
          <p className="text-sm text-[#94a3b8] mt-0.5">
            ทำการแก้ไขรายละเอียดลูกค้า รายชื่อรถยนต์ หรือบริการและค่าใช้จ่ายของใบสั่งงานนี้
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Columns (Forms) */}
        <div className="lg:col-span-2 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm border border-red-200">
              {error}
            </div>
          )}

          {/* 1. Customer Card */}
          <Card className="shadow-sm border-gray-200">
            <CardHeader className="border-b border-gray-100 bg-gray-50/50 p-4">
              <CardTitle className="text-base font-bold text-[#0f172a]">ข้อมูลผู้ว่าจ้าง / ลูกค้า</CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="w-full space-y-4">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-gray-600 block">เลือกลูกค้า *</span>
                  <Select
                    value={selectedCustomerId}
                    onChange={e => setSelectedCustomerId(e.target.value)}
                    className="w-full bg-white border-gray-200"
                    required
                  >
                    <option value="">-- เลือกลูกค้า --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.taxId ? `(Tax: ${c.taxId})` : ''}
                      </option>
                    ))}
                  </Select>
                  {loadingCustomers && <p className="text-xs text-gray-400 mt-1">กำลังโหลดข้อมูลลูกค้า...</p>}
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-semibold text-gray-600 block">วันที่ปฏิบัติงาน (Operation Date)</span>
                  <Input
                    type="date"
                    value={operationDate}
                    onChange={e => setOperationDate(e.target.value)}
                    className="w-full bg-white border-gray-200"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. Batch Defaults Card */}
          <Card className="shadow-sm border-[#1d4ed8]/20 bg-blue-50/20">
            <CardHeader className="border-b border-[#1d4ed8]/10 bg-blue-50/40 p-4 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#1d4ed8]" />
                <CardTitle className="text-sm font-bold text-blue-900">ค่าเริ่มต้นด่วน (Batch Defaults)</CardTitle>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleApplyDefaultsToAll}
                className="text-xs text-[#1d4ed8] hover:bg-blue-100/50 font-bold gap-1"
              >
                เขียนทับไปยังรายการด้านล่าง
              </Button>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-blue-800">ยี่ห้อเริ่มต้น</span>
                <Input
                  placeholder="เช่น BYD"
                  value={defaultBrand}
                  onChange={e => setDefaultBrand(e.target.value)}
                  className="bg-white border-blue-200"
                />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-semibold text-blue-800">รุ่นรถเริ่มต้น</span>
                <Input
                  placeholder="เช่น ATTO 3"
                  value={defaultModel}
                  onChange={e => setDefaultModel(e.target.value)}
                  className="bg-white border-blue-200"
                />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-semibold text-blue-800">บริการเริ่มต้น</span>
                <Input
                  placeholder="เช่น พ่นสีข้างขวา"
                  value={defaultDescription}
                  onChange={e => handleDefaultDescriptionChange(e.target.value)}
                  className="bg-white border-blue-200"
                  list="services-list"
                />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-semibold text-blue-800">ราคาต่อหน่วยเริ่มต้น</span>
                <Input
                  type="number"
                  placeholder="0"
                  value={defaultPrice || ''}
                  onChange={e => setDefaultPrice(parseFloat(e.target.value) || 0)}
                  className="bg-white border-blue-200"
                />
              </div>
            </CardContent>
          </Card>

          {/* 3. Vehicles list */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-lg font-bold text-[#0f172a]">รายการรถยนต์ ({vehicles.length} คัน)</h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 border-[#1d4ed8] text-[#1d4ed8] hover:bg-blue-50"
                onClick={() => setIsImportModalOpen(true)}
              >
                <Plus className="w-3.5 h-3.5" />
                นำเข้าเพิ่มจาก Excel
              </Button>
            </div>

            {vehicles.map((vehicle, vIdx) => (
              <Card key={vehicle.id} className="shadow-sm border-gray-200 relative overflow-hidden group">
                <CardHeader className="bg-gray-50/50 p-4 border-b border-gray-100 flex flex-row items-center justify-between">
                  <span className="font-bold text-sm text-[#1d4ed8]">คันที่ {vIdx + 1}</span>
                  {vehicles.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveVehicle(vehicle.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 px-2.5 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                      ลบรถคันนี้
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  {/* Car fields */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-gray-500">ทะเบียนรถ *</span>
                      <Input
                        placeholder="กข 1234"
                        value={vehicle.carPlate}
                        onChange={e => handleUpdateVehicleField(vehicle.id, 'carPlate', e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-gray-500">จังหวัดป้าย</span>
                      <Input
                        placeholder="กรุงเทพฯ"
                        value={vehicle.carProvince}
                        onChange={e => handleUpdateVehicleField(vehicle.id, 'carProvince', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-gray-500">ยี่ห้อรถ *</span>
                      <Input
                        placeholder="BYD"
                        value={vehicle.carBrand}
                        onChange={e => handleUpdateVehicleField(vehicle.id, 'carBrand', e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-gray-500">รุ่นรถ *</span>
                      <Input
                        placeholder="ATTO 3"
                        value={vehicle.carModel}
                        onChange={e => handleUpdateVehicleField(vehicle.id, 'carModel', e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1 md:col-span-4">
                      <span className="text-xs font-semibold text-gray-500">เลขตัวถัง (VIN)</span>
                      <Input
                        placeholder="กรอกเลข VIN 17 หลัก..."
                        value={vehicle.carVin}
                        onChange={e => handleUpdateVehicleField(vehicle.id, 'carVin', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Service Items per car */}
                  <div className="space-y-2.5 pt-2 border-t border-gray-100">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-gray-600">รายการค่าบริการและค่าอะไหล่</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-xs text-[#1d4ed8] hover:bg-blue-50/50 font-bold h-7 gap-1"
                        onClick={() => handleAddServiceItem(vehicle.id)}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        เพิ่มบริการย่อย
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {vehicle.items.map((item: any, itemIdx: number) => (
                        <div key={itemIdx} className="flex gap-2 items-center">
                          <div className="flex-1">
                            <Input
                              placeholder="เช่น พ่นสีแก้มหน้าขวา"
                              value={item.description}
                              onChange={e => handleUpdateServiceItemDescription(vehicle.id, itemIdx, e.target.value)}
                              list="services-list"
                              required
                              disabled={item.isLocked}
                            />
                          </div>
                          <div className="w-[80px]">
                            <Input
                              type="number"
                              placeholder="จำนวน"
                              value={item.quantity}
                              min={1}
                              onChange={e => handleUpdateServiceItem(vehicle.id, itemIdx, 'quantity', parseInt(e.target.value, 10) || 0)}
                              required
                            />
                          </div>
                          <div className="w-[120px]">
                            <Input
                              type="number"
                              placeholder="ราคา/หน่วย"
                              value={item.priceUnit}
                              min={0}
                              onChange={e => handleUpdateServiceItem(vehicle.id, itemIdx, 'priceUnit', parseFloat(e.target.value) || 0)}
                              required
                              disabled={item.isLocked}
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-9 w-9 p-0 text-red-400 hover:text-red-600"
                            onClick={() => handleRemoveServiceItem(vehicle.id, itemIdx)}
                            disabled={vehicle.items.length <= 1 || item.isLocked}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Button
              type="button"
              variant="outline"
              className="w-full py-6 border-dashed border-gray-300 text-gray-500 hover:text-[#1d4ed8] hover:border-[#1d4ed8] gap-2 rounded-xl transition-all"
              onClick={handleAddVehicle}
            >
              <Plus className="w-5 h-5" />
              เพิ่มรถยนต์คันใหม่
            </Button>
          </div>
        </div>

        {/* Right Sticky Column (Billing Summary) */}
        <div className="space-y-6 lg:sticky lg:top-6">
          <Card className="shadow-sm border-gray-200 overflow-hidden">
            <CardHeader className="bg-gray-50 border-b border-gray-200 p-4">
              <CardTitle className="text-base font-bold text-[#0f172a]">สรุปยอดค่าบริการ</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex justify-between">
                  <span className="text-gray-400">จำนวนรถทั้งหมด:</span>
                  <span className="font-bold text-[#0f172a]">{vehicles.length} คัน</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">ราคารวมสินค้า:</span>
                  <span className="font-semibold">฿{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-500 text-xs">
                  <span>ภาษีมูลค่าเพิ่ม (7%):</span>
                  <span>฿{formatCurrency(vatAmount)}</span>
                </div>
                <hr className="border-gray-100" />
                <div className="flex justify-between text-lg font-bold text-gray-900 pt-1">
                  <span>ยอดสุทธิทั้งหมด:</span>
                  <span className="text-[#1d4ed8]">฿{formatCurrency(grandTotal)}</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <Button 
                  type="submit" 
                  disabled={submitting} 
                  className="w-full bg-[#1d4ed8] hover:bg-[#1e40af] text-white py-5 font-semibold text-sm rounded-xl shadow-md transition-all gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  {submitting ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
                </Button>
                <Link href={`/service-jobs/${orderId}`} className="w-full">
                  <Button type="button" variant="outline" className="w-full border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl">
                    ยกเลิก
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>

      {/* Excel Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Copy className="w-5 h-5 text-[#1d4ed8]" />
                นำเข้าข้อมูลรถยนต์จาก Excel
              </h3>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              {/* Guidelines & Download Template */}
              <div className="p-3.5 bg-blue-50/60 text-blue-800 rounded-xl text-xs space-y-2 border border-blue-100/50">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm block">💡 คำแนะนำโครงสร้างตาราง:</span>
                  <Button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="bg-[#1d4ed8] hover:bg-[#1e40af] text-white text-[10px] h-7 px-2.5 rounded-lg shadow-sm"
                  >
                    ดาวน์โหลด Excel เทมเพลต 📥
                  </Button>
                </div>
                <div className="text-[10px] space-y-1 mt-1 leading-relaxed">
                  <p>• **แถวที่ 1 (ช่อง A1):** ชื่อรายการบริการ (เช่น <code className="bg-blue-100 px-1 rounded font-mono">พ่นทะเบียน</code>)</p>
                  <p>• **แถวที่ 2:** ช่อง A2 ใส่คำว่า <code className="bg-blue-100 px-1 rounded font-mono">วันที่ปฏิบัติงาน</code> และช่อง B2 ใส่วันที่ (เช่น <code className="bg-blue-100 px-1 rounded font-mono">1/6/2026</code>)</p>
                  <p>• **แถวที่ 3 (หัวตาราง):** <code className="bg-blue-100 px-1 rounded font-mono">No.</code>, <code className="bg-blue-100 px-1 rounded font-mono">Vin No.</code>, <code className="bg-blue-100 px-1 rounded font-mono">ยี่ห้อ</code>, <code className="bg-blue-100 px-1 rounded font-mono">Model</code>, <code className="bg-blue-100 px-1 rounded font-mono">ทะเบียน</code></p>
                  <p>• **แถวที่ 4 เป็นต้นไป:** ข้อมูลรายละเอียดรถยนต์แต่ละคัน</p>
                </div>
              </div>

              {/* Option 1: File Uploader */}
              <div className="border border-dashed border-gray-200 rounded-xl p-4 bg-gray-50/50 space-y-2 text-center animate-fade-in">
                <span className="text-xs font-bold text-gray-700 block">วิธีที่ 1: อัปโหลดไฟล์ Excel (.xlsx)</span>
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileUpload}
                  className="block w-full text-xs text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-xl file:border-0
                    file:text-xs file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100
                    cursor-pointer mt-1"
                />
              </div>

              <div className="flex items-center my-3">
                <hr className="flex-1 border-gray-200" />
                <span className="px-3 text-[10px] font-bold text-gray-400 uppercase">หรือ</span>
                <hr className="flex-1 border-gray-200" />
              </div>

              {/* Option 2: Copy-Paste Text Area */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 block">วิธีที่ 2: คัดลอกตารางจาก Excel แล้ววางตรงนี้</label>
                <textarea
                  className="w-full mt-1.5 p-3 text-xs font-mono border rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-50/30"
                  rows={6}
                  placeholder="วางแถวข้อมูลตารางที่คัดลอกจาก Excel ตรงนี้..."
                  value={pastedExcelText}
                  onChange={e => setPastedExcelText(e.target.value)}
                />
              </div>
            </div>

            <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50/50">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => {
                  setPastedExcelText('')
                  setIsImportModalOpen(false)
                }}
              >
                ยกเลิก
              </Button>
              <Button
                type="button"
                className="bg-[#1d4ed8] hover:bg-[#1e40af] text-white rounded-xl"
                onClick={handleImportExcel}
                disabled={!pastedExcelText.trim()}
              >
                นำเข้าข้อมูล
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Datalist for services autocomplete */}
      <datalist id="services-list">
        {serviceCatalog.map((s: any) => (
          <option key={s.id} value={s.name} />
        ))}
      </datalist>
    </div>
  )
}
