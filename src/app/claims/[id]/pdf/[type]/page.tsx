'use client'

import { useMemo, useEffect, useState, useRef } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'
import { formatDate } from '@/lib/date'

const DEFAULT_COMPANY = {
  name: '',
  nameEn: '',
  taxId: '',
  branchCode: '00000',
  branchName: 'สำนักงานใหญ่',
  address: '',
  phone: '',
  email: '',
  logoUrl: '',
  authorizedName: '',
  authorizedTitle: '',
  signatureUrl: '',
}

export default function PDFMockPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const claimId = params.id as string
  const type = params.type as string
  const qtId = searchParams.get('qtId')
  const poId = searchParams.get('poId')

  const [claim, setClaim] = useState<any>(null)
  const [quotation, setQuotation] = useState<any>(null)
  const [po, setPo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [company, setCompany] = useState<any>(DEFAULT_COMPANY)

  useEffect(() => {
    Promise.all([
      fetch(`/api/claims/${claimId}`).then(res => res.json()),
      fetch('/api/settings/company').then(res => res.json()).catch(() => ({}))
    ]).then(([data, compData]) => {
      setClaim(data.error ? null : data)
      if (qtId && data.quotations) {
        setQuotation(data.quotations.find((q: any) => q.id === qtId))
      }
      if (poId && data.purchaseOrders) {
        setPo(data.purchaseOrders.find((p: any) => p.id === poId))
      }
      if (compData && compData.id) {
        setCompany(compData)
      }
      setLoading(false)
    }).catch(err => {
      console.error(err)
      setLoading(false)
    })
  }, [claimId, qtId])

  const hasPrinted = useRef(false)

  useEffect(() => {
    // Auto print when loaded — only once
    if (claim && !loading && !hasPrinted.current) {
      hasPrinted.current = true
      setTimeout(() => {
        window.print()
      }, 500)
    }
  }, [claim, loading])

  if (loading) return <div className="p-8 text-center animate-pulse">กำลังโหลดเอกสาร...</div>
  if (!claim) return <div className="p-8 text-center">ไม่พบข้อมูล Claim</div>

  const renderHeader = (title: string, docNo: string, date: string) => (
    <div className="flex justify-between items-start border-b-2 border-gray-800 pb-6 mb-6">
      <div className="flex gap-4">
        <div className="w-20 h-20 bg-gray-100 flex items-center justify-center font-bold text-gray-400 rounded overflow-hidden">
          {company.logoUrl ? (
            <img src={company.logoUrl} alt="Logo" className="w-full h-full object-contain" />
          ) : (
            'LOGO'
          )}
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{company.name}</h1>
          <p className="text-xs text-gray-600 mt-1">{company.address}</p>
          <p className="text-xs text-gray-600">โทร. {company.phone} | เลขประจำตัวผู้เสียภาษี: {company.taxId} ({company.branchName})</p>
        </div>
      </div>
      <div className="text-right">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-600">
          <span className="text-right">เลขที่เอกสาร:</span>
          <span className="font-semibold text-gray-900">{docNo}</span>
          <span className="text-right">วันที่:</span>
          <span className="font-semibold text-gray-900">{formatDate(date)}</span>
        </div>
      </div>
    </div>
  )

  const renderCustomerInfo = () => (
    <div className="grid grid-cols-2 gap-8 mb-8 text-sm">
      <div className="border rounded p-4">
        <h3 className="font-semibold mb-2 border-b pb-1">ข้อมูลลูกค้า / ผู้เอาประกัน</h3>
        <p><span className="text-gray-500 w-24 inline-block">ชื่อ-นามสกุล:</span> {claim.insuredName}</p>
        <p><span className="text-gray-500 w-24 inline-block">ทะเบียนรถ:</span> {claim.carPlate}</p>
        <p><span className="text-gray-500 w-24 inline-block">ยี่ห้อ/รุ่น:</span> {claim.carBrand} {claim.carModel}</p>
        <p><span className="text-gray-500 w-24 inline-block">บริษัทประกัน:</span> {claim.insurance?.name}</p>
      </div>
      <div className="border rounded p-4">
        <h3 className="font-semibold mb-2 border-b pb-1">อ้างอิง</h3>
        <p><span className="text-gray-500 w-24 inline-block">Claim No:</span> {claim.claimNo}</p>
        <p><span className="text-gray-500 w-24 inline-block">วันที่รับรถ:</span> {formatDate(claim.createdAt)}</p>
      </div>
    </div>
  )

  if (type === 'quotation') {
    if (!quotation) return <div className="p-8 text-center">ไม่พบใบเสนอราคา</div>

    return (
      <div className="bg-white min-h-screen text-black p-8 max-w-4xl mx-auto print:p-12">
        {renderHeader('ใบเสนอราคา', quotation.quotationNo, quotation.quotationDate)}
        {renderCustomerInfo()}

        <table className="w-full text-sm mb-8 border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-800 text-left">
              <th className="py-2 px-2">ลำดับ</th>
              <th className="py-2 px-2">รายการ</th>
              <th className="py-2 px-2 text-center">ประเภท</th>
              <th className="py-2 px-2 text-right">จำนวน</th>
              <th className="py-2 px-2 text-right">ราคา/หน่วย</th>
              <th className="py-2 px-2 text-right">จำนวนเงิน</th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-gray-50"><td colSpan={6} className="py-1 px-2 font-semibold">รายการค่าแรง</td></tr>
            {(quotation.laborItems || []).map((l: any, i: number) => (
              <tr key={l.id} className="border-b border-gray-200">
                <td className="py-2 px-2 text-gray-600">{i + 1}</td>
                <td className="py-2 px-2">{l.description}</td>
                <td className="py-2 px-2 text-center">ค่าแรง</td>
                <td className="py-2 px-2 text-right">1</td>
                <td className="py-2 px-2 text-right">{formatCurrency(l.unitPrice)}</td>
                <td className="py-2 px-2 text-right">{formatCurrency(l.totalPrice)}</td>
              </tr>
            ))}
            <tr className="bg-gray-50"><td colSpan={6} className="py-1 px-2 font-semibold">รายการค่าอะไหล่</td></tr>
            {(quotation.partItems || []).map((p: any, i: number) => (
              <tr key={p.id} className="border-b border-gray-200">
                <td className="py-2 px-2 text-gray-600">{i + 1}</td>
                <td className="py-2 px-2">{p.partName} <span className="text-gray-400 text-xs">({p.partNo})</span></td>
                <td className="py-2 px-2 text-center">อะไหล่</td>
                <td className="py-2 px-2 text-right">{p.quantity}</td>
                <td className="py-2 px-2 text-right">{formatCurrency(p.unitPrice)}</td>
                <td className="py-2 px-2 text-right">{formatCurrency(p.totalPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-64 space-y-2 text-sm border rounded p-4">
            <div className="flex justify-between"><span className="text-gray-600">รวมค่าแรง</span><span>{formatCurrency(quotation.laborTotal)}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">รวมค่าอะไหล่</span><span>{formatCurrency(quotation.partsTotal)}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">มูลค่าก่อนภาษี</span><span>{formatCurrency(quotation.subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">ภาษีมูลค่าเพิ่ม 7%</span><span>{formatCurrency(quotation.vatAmount)}</span></div>
            <div className="flex justify-between font-bold text-base border-t pt-2 mt-2"><span>ยอดรวมทั้งสิ้น</span><span>{formatCurrency(quotation.grandTotal)}</span></div>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-2 gap-16 text-center text-sm">
          <div>
            <div className="border-b border-gray-400 w-48 mx-auto mb-2"></div>
            <p>ผู้เสนอราคา</p>
            <p className="text-gray-500 text-xs mt-1">วันที่ ____/____/____</p>
          </div>
          <div>
            <div className="border-b border-gray-400 w-48 mx-auto mb-2"></div>
            <p>ผู้อนุมัติ (บริษัทประกัน)</p>
            <p className="text-gray-500 text-xs mt-1">วันที่ ____/____/____</p>
          </div>
        </div>
      </div>
    )
  }

  if (type === 'insurance-invoice') {
    const inv = claim.insuranceInvoice
    if (!inv) return <div className="p-8 text-center">ยังไม่ได้ออกใบวางบิล</div>

    return (
      <div className="bg-white min-h-screen text-black p-8 max-w-4xl mx-auto print:p-12">
        {renderHeader('ใบวางบิล / ใบแจ้งหนี้', inv.invoiceNo, inv.invoiceDate)}
        {renderCustomerInfo()}

        <table className="w-full text-sm mb-8 border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-800 text-left">
              <th className="py-2 px-2">ลำดับ</th>
              <th className="py-2 px-2">รายการ</th>
              <th className="py-2 px-2 text-right">จำนวนเงิน</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              const rows = []
              if (inv.laborTotal > 0) {
                rows.push(
                  <tr key="labor" className="border-b border-gray-200">
                    <td className="py-4 px-2 text-gray-600">{rows.length + 1}</td>
                    <td className="py-4 px-2">
                      <strong>ค่าแรงซ่อมรถยนต์</strong>
                      <p className="text-gray-500 text-xs mt-1">ตามใบเสนอราคาที่ได้รับอนุมัติ ทะเบียน {claim.carPlate}</p>
                    </td>
                    <td className="py-4 px-2 text-right">{formatCurrency(inv.laborTotal)}</td>
                  </tr>
                )
              }
              if (inv.partsTotal > 0) {
                rows.push(
                  <tr key="parts" className="border-b border-gray-200">
                    <td className="py-4 px-2 text-gray-600">{rows.length + 1}</td>
                    <td className="py-4 px-2">
                      <strong>ค่าอะไหล่รถยนต์</strong>
                      <p className="text-gray-500 text-xs mt-1">ตามใบเสนอราคาที่ได้รับอนุมัติ ทะเบียน {claim.carPlate}</p>
                    </td>
                    <td className="py-4 px-2 text-right">{formatCurrency(inv.partsTotal)}</td>
                  </tr>
                )
              }
              return rows
            })()}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-64 space-y-2 text-sm border rounded p-4">
            <div className="flex justify-between"><span className="text-gray-600">มูลค่าก่อนภาษี</span><span>{formatCurrency(inv.subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">ภาษีมูลค่าเพิ่ม 7%</span><span>{formatCurrency(inv.vatAmount)}</span></div>
            <div className="flex justify-between font-bold text-base border-t pt-2 mt-2"><span>ยอดรวมทั้งสิ้น</span><span>{formatCurrency(inv.grandTotal)}</span></div>
          </div>
        </div>

        <div className="mt-16 text-sm border rounded p-4 bg-gray-50">
          <h4 className="font-semibold mb-2">รายละเอียดการชำระเงิน</h4>
          <p>ชื่อบัญชี: {company.bankAccountName}</p>
          <p>ธนาคาร: {company.bankName}</p>
          <p>เลขที่บัญชี: <span className="font-mono">{company.bankAccount}</span></p>
        </div>

        <div className="mt-16 grid grid-cols-2 gap-16 text-center text-sm">
          <div>
            <div className="border-b border-gray-400 w-48 mx-auto mb-2"></div>
            <p>ผู้รับวางบิล</p>
            <p className="text-gray-500 text-xs mt-1">วันที่ ____/____/____</p>
          </div>
          <div>
            <div className="border-b border-gray-400 w-48 mx-auto mb-2"></div>
            <p>ผู้วางบิล</p>
            <p className="text-gray-500 text-xs mt-1">วันที่ ____/____/____</p>
          </div>
        </div>
      </div>
    )
  }

  if (type === 'purchase-order') {
    if (!po) return <div className="p-8 text-center">ไม่พบใบสั่งซื้อ</div>

    const poTotal = (po.items || []).reduce((s: number, item: any) => s + (item.totalPrice || 0), 0)

    return (
      <div className="bg-white min-h-screen text-black p-8 max-w-4xl mx-auto print:p-12">
        {renderHeader('ใบสั่งซื้อ (Purchase Order)', po.poNo, po.createdAt)}

        <div className="grid grid-cols-2 gap-8 mb-8 text-sm">
          <div className="border rounded p-4">
            <h3 className="font-semibold mb-2 border-b pb-1">ข้อมูลผู้จัดจำหน่าย (Vendor)</h3>
            <p><span className="text-gray-500 w-28 inline-block">ชื่อร้าน/บริษัท:</span> {po.vendor?.name}</p>
            <p><span className="text-gray-500 w-28 inline-block">ประเภท:</span> {po.poType === 'PARTS' ? 'อะไหล่' : 'ค่าแรง'}</p>
            <p><span className="text-gray-500 w-28 inline-block">การจัดส่ง:</span> {po.deliveryMode === 'DIRECT_TO_GARAGE' ? 'ส่งตรงอู่' : 'รับเอง'}</p>
          </div>
          <div className="border rounded p-4">
            <h3 className="font-semibold mb-2 border-b pb-1">อ้างอิง</h3>
            <p><span className="text-gray-500 w-24 inline-block">Claim No:</span> {claim.claimNo}</p>
            <p><span className="text-gray-500 w-24 inline-block">ทะเบียนรถ:</span> {claim.carPlate}</p>
            <p><span className="text-gray-500 w-24 inline-block">ยี่ห้อ/รุ่น:</span> {claim.carBrand} {claim.carModel}</p>
          </div>
        </div>

        <table className="w-full text-sm mb-8 border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-800 text-left">
              <th className="py-2 px-2 w-12">ลำดับ</th>
              <th className="py-2 px-2">รหัสอะไหล่</th>
              <th className="py-2 px-2">รายการ</th>
              <th className="py-2 px-2 text-right">จำนวน</th>
              <th className="py-2 px-2 text-right">ราคา/หน่วย</th>
              <th className="py-2 px-2 text-right">จำนวนเงิน</th>
            </tr>
          </thead>
          <tbody>
            {(po.items || []).map((item: any, i: number) => (
              <tr key={item.id} className="border-b border-gray-200">
                <td className="py-2 px-2 text-gray-600">{i + 1}</td>
                <td className="py-2 px-2 font-mono text-xs">{item.partNo}</td>
                <td className="py-2 px-2">{item.description}</td>
                <td className="py-2 px-2 text-right">{item.quantity}</td>
                <td className="py-2 px-2 text-right">{formatCurrency(item.unitPrice)}</td>
                <td className="py-2 px-2 text-right">{formatCurrency(item.totalPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-64 space-y-2 text-sm border rounded p-4">
            <div className="flex justify-between text-gray-600">
              <span>ยอดรวมก่อน VAT</span>
              <span>{formatCurrency((po.items || []).reduce((s: number, item: any) => s + (item.totalPrice || 0), 0))}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>VAT 7%</span>
              <span>{formatCurrency(Math.round(((po.items || []).reduce((s: number, item: any) => s + (item.totalPrice || 0), 0)) * 0.07))}</span>
            </div>
            <div className="flex justify-between font-bold text-base border-t pt-2 mt-2">
              <span>ยอดรวมทั้งสิ้น</span>
              <span>{formatCurrency(po.totalAmount)}</span>
            </div>
          </div>
        </div>

        <div className="mt-8 text-sm border rounded p-4 bg-gray-50">
          <h4 className="font-semibold mb-1">หมายเหตุ</h4>
          <p className="text-gray-600">กรุณาจัดส่งอะไหล่ตามรายการข้างต้น</p>
        </div>

        <div className="mt-16 grid grid-cols-2 gap-16 text-center text-sm">
          <div>
            <div className="border-b border-gray-400 w-48 mx-auto mb-2 mt-12"></div>
            <p>ผู้สั่งซื้อ</p>
            <p className="text-gray-500 text-xs mt-1">วันที่ {formatDate(po.createdAt)}</p>
          </div>
          <div>
            {company.signatureUrl ? (
              <div className="w-48 h-12 mx-auto mb-2 border-b border-gray-400 flex items-end justify-center pb-1">
                <img src={company.signatureUrl} alt="Signature" className="max-h-16 object-contain mix-blend-multiply" />
              </div>
            ) : (
              <div className="border-b border-gray-400 w-48 mx-auto mb-2 mt-12"></div>
            )}
            <p>{company.authorizedName || 'ผู้อนุมัติ'}</p>
            {company.authorizedTitle && <p className="text-gray-500 text-xs mt-0.5">{company.authorizedTitle}</p>}
            <p className="text-gray-500 text-xs mt-1">วันที่ {formatDate(po.createdAt)}</p>
          </div>
        </div>
      </div>
    )
  }

  if (type === 'delivery-note') {
    if (!po) return <div className="p-8 text-center">ไม่พบใบสั่งซื้อ</div>

    return (
      <div className="bg-white min-h-screen text-black p-8 max-w-4xl mx-auto print:p-12">
        {renderHeader('ใบส่งของ (Delivery Note)', po.poNo, po.createdAt)}

        <div className="grid grid-cols-2 gap-8 mb-8 text-sm">
          <div className="border rounded p-4">
            <h3 className="font-semibold mb-2 border-b pb-1">ผู้จัดจำหน่าย (Vendor)</h3>
            <p><span className="text-gray-500 w-28 inline-block">ชื่อร้าน/บริษัท:</span> {po.vendor?.name}</p>
          </div>
          <div className="border rounded p-4">
            <h3 className="font-semibold mb-2 border-b pb-1">สถานที่จัดส่ง</h3>
            <p className="whitespace-pre-wrap">{po.deliveryAddress || [claim.garage?.name, claim.garage?.address, claim.garage?.province].filter(Boolean).join(' ').trim()}</p>
          </div>
        </div>

        <table className="w-full text-sm mb-8 border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-800 text-left">
              <th className="py-2 px-2 w-12">ลำดับ</th>
              <th className="py-2 px-2">รหัสอะไหล่</th>
              <th className="py-2 px-2">รายการ</th>
              <th className="py-2 px-2 text-right">จำนวน</th>
              <th className="py-2 px-2 text-center">ตรวจรับ</th>
            </tr>
          </thead>
          <tbody>
            {(po.items || []).map((item: any, i: number) => (
              <tr key={item.id} className="border-b border-gray-200">
                <td className="py-3 px-2 text-gray-600">{i + 1}</td>
                <td className="py-3 px-2 font-mono text-xs">{item.partNo}</td>
                <td className="py-3 px-2">{item.description}</td>
                <td className="py-3 px-2 text-right">{item.quantity}</td>
                <td className="py-3 px-2 text-center">☐</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-8 text-sm border rounded p-4 bg-gray-50">
          <h4 className="font-semibold mb-1">หมายเหตุ</h4>
          <p className="text-gray-600">กรุณาตรวจนับอะไหล่ให้ครบถ้วนก่อนลงนามรับของ</p>
        </div>

        <div className="mt-16 grid grid-cols-3 gap-8 text-center text-sm">
          <div>
            <div className="border-b border-gray-400 w-40 mx-auto mb-2"></div>
            <p>ผู้ส่งของ</p>
            <p className="text-gray-500 text-xs mt-1">วันที่ ____/____/____</p>
          </div>
          <div>
            <div className="border-b border-gray-400 w-40 mx-auto mb-2"></div>
            <p>ผู้ขนส่ง</p>
            <p className="text-gray-500 text-xs mt-1">วันที่ ____/____/____</p>
          </div>
          <div>
            <div className="border-b border-gray-400 w-40 mx-auto mb-2"></div>
            <p>ผู้รับของ (อู่)</p>
            <p className="text-gray-500 text-xs mt-1">วันที่ ____/____/____</p>
          </div>
        </div>
      </div>
    )
  }

  return <div className="p-8 text-center">ไม่พบประเภทเอกสารที่ระบุ</div>
}
