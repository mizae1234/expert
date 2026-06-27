import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import fs from 'fs'

export const maxDuration = 120 // 2 minutes for 2-pass extraction
export const dynamic = 'force-dynamic'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

// Helper: call Claude with an image and a prompt, return parsed JSON
async function callClaude(
  imageContent: any,
  systemPrompt: string,
  userText: string
): Promise<any> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8192,
    temperature: 0,
    system: systemPrompt,
    messages: [{ role: 'user', content: [imageContent, { type: 'text', text: userText }] }],
  })

  const textBlock = response.content.find((b: any) => b.type === 'text') as any
  if (!textBlock?.text) {
    throw new Error(`No text in Claude response. stop_reason=${response.stop_reason}`)
  }

  const raw = textBlock.text
  console.log(`[extract-claim] stop_reason=${response.stop_reason}, chars=${raw.length}, preview=${raw.substring(0, 150)}`)
  
  // Save raw response for debugging
  try {
    fs.appendFileSync('/tmp/expert-ai-debug.txt', `\n\n--- NEW API CALL ---\nPrompt: ${userText}\nResponse:\n${raw}\n`)
  } catch(e) {}

  // Try parse strategies
  // 1. Direct
  try { return JSON.parse(raw.trim()) } catch (_) {}
  // 2. Strip ```json fences
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fence) { try { return JSON.parse(fence[1].trim()) } catch (_) {} }
  // 3. Extract outermost { }
  const first = raw.indexOf('{'), last = raw.lastIndexOf('}')
  if (first !== -1 && last > first) {
    try { return JSON.parse(raw.substring(first, last + 1)) } catch (_) {}
  }
  // 4. Extract outermost [ ]
  const firstArr = raw.indexOf('['), lastArr = raw.lastIndexOf(']')
  if (firstArr !== -1 && lastArr > firstArr) {
    try { return JSON.parse(raw.substring(firstArr, lastArr + 1)) } catch (_) {}
  }

  throw new Error('AI response was not valid JSON. Preview: ' + raw.substring(0, 300))
}

// Helper: build image/document block from base64 data string and mime info
function buildImageBlock(dataUrl: string, mimeHint?: string): any {
  const base64Data = dataUrl.split(',')[1]
  if (!base64Data) throw new Error('Invalid file format')

  let mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' | 'application/pdf' = 'image/jpeg'
  if (mimeHint === 'application/pdf' || dataUrl.startsWith('data:application/pdf')) mediaType = 'application/pdf'
  else if (mimeHint === 'image/png' || dataUrl.startsWith('data:image/png')) mediaType = 'image/png'
  else if (mimeHint === 'image/webp' || dataUrl.startsWith('data:image/webp')) mediaType = 'image/webp'
  else if (mimeHint === 'image/gif') mediaType = 'image/gif'

  const isPDF = mediaType === 'application/pdf'
  return isPDF
    ? { type: 'document', source: { type: 'base64', media_type: mediaType, data: base64Data } }
    : { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64Data } }
}

// Helper: call Claude with multiple image blocks and a prompt, return parsed JSON
async function callClaudeMulti(
  imageBlocks: any[],
  systemPrompt: string,
  userText: string
): Promise<any> {
  const contentParts = [
    ...imageBlocks,
    { type: 'text', text: userText }
  ]

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8192,
    temperature: 0,
    system: systemPrompt,
    messages: [{ role: 'user', content: contentParts }],
  })

  const textBlock = response.content.find((b: any) => b.type === 'text') as any
  if (!textBlock?.text) {
    throw new Error(`No text in Claude response. stop_reason=${response.stop_reason}`)
  }

  const raw = textBlock.text
  console.log(`[extract-claim] stop_reason=${response.stop_reason}, chars=${raw.length}, preview=${raw.substring(0, 150)}`)

  // Save raw response for debugging
  try {
    fs.appendFileSync('/tmp/expert-ai-debug.txt', `\n\n--- NEW API CALL ---\nPrompt: ${userText}\nResponse:\n${raw}\n`)
  } catch(e) {}

  // Try parse strategies
  try { return JSON.parse(raw.trim()) } catch (_) {}
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fence) { try { return JSON.parse(fence[1].trim()) } catch (_) {} }
  const first = raw.indexOf('{'), last = raw.lastIndexOf('}')
  if (first !== -1 && last > first) {
    try { return JSON.parse(raw.substring(first, last + 1)) } catch (_) {}
  }
  const firstArr = raw.indexOf('['), lastArr = raw.lastIndexOf(']')
  if (firstArr !== -1 && lastArr > firstArr) {
    try { return JSON.parse(raw.substring(firstArr, lastArr + 1)) } catch (_) {}
  }

  throw new Error('AI response was not valid JSON. Preview: ' + raw.substring(0, 300))
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    // Support both single file (backward compat) and multiple files
    // files: [{ data: "data:image/jpeg;base64,...", mimeType: "image/jpeg" }, ...]
    // OR legacy: { file: "data:...", mimeType: "image/jpeg" }
    let fileEntries: { data: string; mimeType: string }[] = []

    if (body.files && Array.isArray(body.files) && body.files.length > 0) {
      fileEntries = body.files
    } else if (body.file) {
      fileEntries = [{ data: body.file, mimeType: body.mimeType || 'image/jpeg' }]
    }

    if (fileEntries.length === 0) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: 'API key missing' }, { status: 500 })

    console.log(`[extract-claim] Processing ${fileEntries.length} file(s)`)

    // Build image blocks for all files
    const imageBlocks = fileEntries.map((f, idx) => {
      const block = buildImageBlock(f.data, f.mimeType)
      const base64Data = f.data.split(',')[1]
      const sizeMB = (base64Data.length * 0.75 / 1024 / 1024).toFixed(2)
      console.log(`[extract-claim] File ${idx + 1}: mimeType=${f.mimeType}, size~${sizeMB}MB`)
      return block
    })

    const multiPageNote = fileEntries.length > 1
      ? `\nIMPORTANT: You are looking at ${fileEntries.length} images/pages of the SAME claim document. Combine information from ALL pages to build the complete data. If the same field appears on multiple pages, use the most complete/clear value.`
      : ''

    const systemCombined = `You are an expert at extracting data from Thai vehicle insurance claim documents.
The document is EITHER:
  (A) A screenshot from the eGarage insurance system — shows a left sidebar with claim info fields on the first page, and two tables (labor & parts) spread across the pages.
  (B) A standard paper/PDF claim estimate form.
${multiPageNote}

For Type A (eGarage), the LEFT SIDEBAR contains:
  - "เลขที่-Claim" or "Claim:" = claimNo
  - "เลขรับแจ้ง" = receiveNo
  - "เลขที่เคลม" = transactionNo
  - "ชื่อบริษัท" = insuranceName
  - "สาขา" = branch
  - "ทะเบียน" = car.plate
  - "จังหวัด" = car.province
  - "ยี่ห้อ" = car.brand
  - "รุ่น" = car.model
  - "หมายเลขตัวถัง" = car.vin
  - "วันที่สร้าง" = createdAt
  - "วันที่ส่ง" = sentAt
  Summary totals: look for "รวม" rows in tables, use "ราคาอนุมัติ" column value.

For eGarage (Type A) Table sections:
  LABOR TABLE columns: #, Group, รายการ, เส้นหาย, %, ระดับเสียหาย+ราคาเสนอ, ระดับเสียหาย+ราคาอนุมัติ, รูป, ครั้งที่, สถานะ, EV
    - description = "รายการ" column text
    - damageLevel = text inside () in ระดับเสียหาย
    - priceOffer = ราคาเสนอ amount
    - priceApprove = ราคาอนุมัติ amount
    - discountPct = % column
    - SKIP rows labeled "ส่วนลด/ส่วนเพิ่ม", "คงเหลือ", "รวม"

  PARTS TABLE — split into two side-by-side sections (Left: "ศูนย์/ผู้ซ่อม" | Right: "บริษัทประกัน"):
    - partNo = หมายเลขอะไหล่
    - partName = รายการ
    - priceFull = ราคาเดิม
    - quantity = จำนวน
    - damageType = ประเภท under ศูนย์
    - priceOffer = ราคาเสนอ under ศูนย์
    - priceApprove = ราคาอนุมัติ under บริษัทประกัน (RIGHT section)
    - discountPct = % under บริษัทประกัน
    - requireReturn = true if row has red "คืนซาก" tag
    - If "สถานะ" column says "ไม่อนุมัติ", set priceApprove = 0

RULES:
- Output ONLY valid JSON, no markdown, no explanation.
- Numbers: strip commas (e.g. 7,399.25 -> 7399.25). Missing = 0 or "".
- confidence: 90-100=clear, 70-89=readable, 50-69=guessed, 0-49=missing.
- Extract ALL labor and parts rows from ALL pages/images. Do NOT skip any rows. Combine data from all pages. Do NOT duplicate rows that appear on multiple pages.`

    const userPromptCombined = `Extract all data including claim metadata, car info, summary totals, and all labor and parts line items from ${fileEntries.length > 1 ? 'these document pages' : 'this document'}.
Output this exact JSON structure:
{
  "claim": {
    "claimNo": { "value": "", "confidence": 0 },
    "receiveNo": { "value": "", "confidence": 0 },
    "transactionNo": { "value": "", "confidence": 0 },
    "insuranceName": { "value": "", "confidence": 0 },
    "branch": { "value": "", "confidence": 0 },
    "status": { "value": "RECEIVED", "confidence": 100 },
    "createdAt": { "value": "", "confidence": 0 },
    "sentAt": { "value": "", "confidence": 0 }
  },
  "car": {
    "plate": { "value": "", "confidence": 0 },
    "province": { "value": "", "confidence": 0 },
    "brand": { "value": "", "confidence": 0 },
    "model": { "value": "", "confidence": 0 },
    "vin": { "value": "", "confidence": 0 },
    "insuredName": { "value": "", "confidence": 0 }
  },
  "summary": {
    "laborTotal": { "value": 0, "confidence": 0 },
    "partsTotal": { "value": 0, "confidence": 0 },
    "subtotal": { "value": 0, "confidence": 0 },
    "vat": { "value": 0, "confidence": 0 },
    "grandTotal": { "value": 0, "confidence": 0 },
    "deductible": { "value": 0, "confidence": 0 }
  },
  "labors": [
    {
      "description": "",
      "damageLevel": "",
      "discountPct": 0,
      "priceOffer": 0,
      "priceApprove": 0
    }
  ],
  "parts": [
    {
      "partNo": "",
      "partName": "",
      "priceFull": 0,
      "quantity": 1,
      "damageType": "",
      "discountPct": 0,
      "priceOffer": 0,
      "priceApprove": 0,
      "supplier": "ศูนย์",
      "requireReturn": false
    }
  ]
}`

    // ─── EXECUTE SINGLE PASS EXTRACTION ──────────────────────────────
    const extractedData = await callClaudeMulti(imageBlocks, systemCombined, userPromptCombined)

    console.log(`[extract-claim] Extraction completed. labors=${extractedData.labors?.length ?? 'undefined'}, parts=${extractedData.parts?.length ?? 'undefined'}`)
    if (!extractedData.labors?.length && !extractedData.parts?.length) {
      console.warn('[extract-claim] Returned empty labors and parts. Keys:', Object.keys(extractedData))
    }

    const wrap = (val: any) => ({ value: val, confidence: 90 })

    const laborsWrapped = (extractedData.labors || []).map((l: any) => ({
      description: wrap(l.description || ""),
      damageLevel: wrap(l.damageLevel || ""),
      discountPct: wrap(l.discountPct || 0),
      priceOffer: wrap(l.priceOffer || 0),
      priceApprove: wrap(l.priceApprove || 0)
    }))

    const partsWrapped = (extractedData.parts || []).map((p: any) => ({
      partNo: wrap(p.partNo || ""),
      partName: wrap(p.partName || ""),
      priceFull: wrap(p.priceFull || 0),
      quantity: wrap(p.quantity || 1),
      damageType: wrap(p.damageType || ""),
      discountPct: wrap(p.discountPct || 0),
      priceOffer: wrap(p.priceOffer || 0),
      priceApprove: wrap(p.priceApprove || 0),
      supplier: wrap(p.supplier || ""),
      requireReturn: wrap(p.requireReturn || false)
    }))

    const warnings: string[] = []
    partsWrapped.forEach((p: any) => {
      if (p.priceApprove.value === 0 && p.priceFull.value > 0) {
        warnings.push(`อะไหล่ไม่ถูกอนุมัติ: ${p.partName.value || p.partNo.value}`)
      }
    })

    const result = {
      claim: extractedData.claim || {},
      car: extractedData.car || {},
      summary: extractedData.summary || {},
      labors: laborsWrapped,
      parts: partsWrapped,
      validation: {
        passed: warnings.length === 0,
        warnings,
      },
    }

    return NextResponse.json(result)

  } catch (error: any) {
    const errMsg = error?.message || error?.toString() || 'Unknown error'
    const errStatus = error?.status || 500
    console.error('[extract-claim] error:', errMsg)
    return NextResponse.json({ error: 'Failed to extract document: ' + errMsg }, { status: errStatus })
  }
}
