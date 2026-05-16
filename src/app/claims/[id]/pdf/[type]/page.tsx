'use client'

import { useMemo, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { mockClaims } from '@/lib/mock/claims'
import { mockQuotations } from '@/lib/mock/quotations'
import { mockCompanyProfile } from '@/lib/mock/settings'
import { formatCurrency } from '@/lib/utils'

export default function PDFMockPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const claimId = params.id as string
  const type = params.type as string
  const qtId = searchParams.get('qtId')

  const claim = useMemo(() => mockClaims.find(c => c.id === claimId), [claimId])
  const quotation = useMemo(() => mockQuotations.find(q => q.id === qtId), [qtId])
  const company = mockCompanyProfile

  useEffect(() => {
    // Auto print when loaded
    if (claim) {
      setTimeout(() => {
        window.print()
      }, 500)
    }
  }, [claim])

  if (!claim) return <div className="p-8 text-center">ไม่พบข้อมูล Claim</div>

  const renderHeader = (title: string, docNo: string, date: string) => (
    <div className="flex justify-between items-start border-b-2 border-gray-800 pb-6 mb-6">
      <div className="flex gap-4">
        <div className="w-20 h-20 bg-gray-100 flex items-center justify-center font-bold text-gray-400 rounded">
          LOGO
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
          <span className="font-semibold text-gray-900">{new Date(date).toLocaleDateString('th-TH')}</span>
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
        <p><span className="text-gray-500 w-24 inline-block">วันที่รับรถ:</span> {new Date(claim.createdAt).toLocaleDateString('th-TH')}</p>
      </div>
    </div>
  )

  if (type === 'quotation') {
    if (!quotation) return <div className="p-8 text-center">ไม่พบใบเสนอราคา</div>

    return (
      <div className="bg-white min-h-screen text-black p-8 max-w-4xl mx-auto print:p-0">
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
            {quotation.laborItems.map((l, i) => (
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
            {quotation.partItems.map((p, i) => (
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
      <div className="bg-white min-h-screen text-black p-8 max-w-4xl mx-auto print:p-0">
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
            <tr className="border-b border-gray-200">
              <td className="py-4 px-2 text-gray-600">1</td>
              <td className="py-4 px-2">
                <strong>ค่าแรงซ่อมรถยนต์</strong>
                <p className="text-gray-500 text-xs mt-1">ตามใบเสนอราคาที่ได้รับอนุมัติ ทะเบียน {claim.carPlate}</p>
              </td>
              <td className="py-4 px-2 text-right">{formatCurrency(inv.laborTotal)}</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="py-4 px-2 text-gray-600">2</td>
              <td className="py-4 px-2">
                <strong>ค่าอะไหล่รถยนต์</strong>
                <p className="text-gray-500 text-xs mt-1">ตามใบเสนอราคาที่ได้รับอนุมัติ ทะเบียน {claim.carPlate}</p>
              </td>
              <td className="py-4 px-2 text-right">{formatCurrency(inv.partsTotal)}</td>
            </tr>
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

  return <div className="p-8 text-center">ไม่พบประเภทเอกสารที่ระบุ</div>
}
