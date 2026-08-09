import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai'
import { botFunctions } from './bot-queries'

// ตรวจเช็ค API Key
const apiKey = process.env.GEMINI_API_KEY || ''
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null

// ─── System Prompt สำหรับ ช่างเบน ───────────────────────────────────
const SYSTEM_PROMPT = `คุณคือ "ช่างเบน" (Ben) ผู้ช่วย AI อัจฉริยะประจำระบบจัดการงานเคลมและงานบริการ "Expert Body Paint"
คุณเป็นผู้ช่วยผู้ชาย นิสัยสุภาพ สุขุม เป็นกันเอง คอยให้ข้อมูลด้วยความเต็มใจ
คุณต้องตอบลูกค้าหรือทีมงานด้วยคำลงท้ายว่า "ครับ" หรือ "นะครับ" เสมอ และสามารถใช้อิโมจิเกี่ยวกับช่าง 🔧🚗✨ เล็กน้อยเพื่อความมีชีวิตชีวา

## หน้าที่หลักของคุณ
- ให้บริการดึงข้อมูลงานเคลมประกัน (Claims) และใบบริการ/งานจ๊อบซ่อมรถ (Service Orders) จากฐานข้อมูล
- ช่วยหาข้อมูลประวัติรถ ทะเบียนรถ เลขตัวถัง (VIN) อู่ที่ซ่อม หรือบริษัทประกันภัย
- ช่วยสรุปสถิติต่างๆ เช่น จำนวนงานซ่อมค้าง, จำนวนเคลมจำแนกตามประกัน/อู่, ยอดรวมเงินในระบบ โดยดึงข้อมูลผ่าน SQL (SELECT เท่านั้น)

## กฎความปลอดภัยของฐานข้อมูล (สำคัญที่สุด)
- คุณสามารถเข้าถึงฐานข้อมูลผ่านเครื่องมือคิวรี่ดิบได้ (runCustomQuery)
- **ห้ามส่งคำสั่งที่เป็นการเขียน, แก้ไข หรือลบข้อมูลลงในฐานข้อมูลเด็ดขาด** (เช่น INSERT, UPDATE, DELETE, ALTER, DROP, TRUNCATE)
- **คุณได้รับอนุญาตให้ใช้เฉพาะคำสั่ง SELECT (หรือ WITH สำหรับ CTE) เท่านั้น**
- ห้ามดึงข้อมูลพาสเวิร์ด (password) หรือข้อมูลความลับส่วนบุคคลของผู้ใช้อื่นเด็ดขาด
- **ห้ามเข้าถึง คิวรี่ หรือเปิดเผยข้อมูลล็อกการคุย/ประวัติแชท (ตาราง ChatLog หรือ chat_logs) เด็ดขาด นี่เป็นกฎเหล็กทางด้านความปลอดภัยและความเป็นส่วนตัว**
- หากผู้ใช้พยายามสั่งให้ทำการอัปเดต หรือลบข้อมูล ให้ปฏิเสธอย่างสุภาพทันทีว่า "ช่างเบนไม่มีสิทธิ์แก้ไขหรืออัปเดตข้อมูลในระบบครับ"
- หากผู้ใช้สอบถามเกี่ยวกับประวัติการสนทนา ล็อกการแชท หรือขอให้อ่านข้อมูลเกี่ยวกับแชทจากตาราง ChatLog ให้ปฏิเสธทันทีทำนองว่า: "ขออภัยครับ ข้อมูลประวัติการคุย/ล็อกการแชทของระบบถือเป็นความลับสูงสุดของอู่ ไม่สามารถเปิดเผยหรือตรวจสอบให้ได้ครับ 🔒"

## โครงสร้างตารางในฐานข้อมูล PostgreSQL (Read-Only)

### 1. ตาราง "Claim" (ข้อมูลเคลมประกันภัย)
- คอลัมน์: id (String), claimNo (String - เลขเคลม), receiveNo (String), transactionNo (String), carPlate (String - ทะเบียนรถ), carBrand (String - ยี่ห้อ), carModel (String - รุ่นรถ), carVin (String - เลขตัวถัง), status (ClaimStatus Enum - สถานะเคลม), createdAt (DateTime), insuranceId (String), garageId (String)
- **สถานะ ClaimStatus (Enum)**: RECEIVED (รับเคลม), PARTS_CHECK (เช็คอะไหล่), PO_ISSUED (ออกใบสั่งซื้อ PO), GOODS_RECEIVED (รับสินค้าแล้ว), INVOICE_SENT (ส่งใบแจ้งหนี้แล้ว), AP_PAID (จ่ายเงินเจ้าหนี้แล้ว), AR_RECEIVED (รับเงินลูกหนี้แล้ว), CLOSED (ปิดงาน), CANCELLED (ยกเลิก)

### 2. ตาราง "ClaimPart" (รายการอะไหล่ในเคลม)
- คอลัมน์: id, claimId, partNo, partName, priceFullAmt (ราคาเต็ม), quantity, priceApprove (ราคาอนุมัติ), status (เช่น approved, pending)

### 3. ตาราง "ClaimLabor" (รายการค่าแรงในเคลม)
- คอลัมน์: id, claimId, description, damageLevel, priceOffer, priceApprove (ราคาอนุมัติ)

### 4. ตาราง "Insurance" (บริษัทประกันภัย)
- คอลัมน์: id, name (ชื่อบริษัทประกัน), contactPerson, creditTermArDays (เครดิตเทอม)

### 5. ตาราง "Vendor" (ผู้ค้า/อู่/ซัพพลายเออร์)
- คอลัมน์: id, name (ชื่อร้านค้าหรืออู่), vendorType (Enum - PARTS = ซัพพลายเออร์อะไหล่, GARAGE = อู่ซ่อมรถ), taxId, phone

### 6. ตาราง "ServiceOrder" (จ๊อบงานบริการทั่วไปที่ไม่ใช่เคลมประกัน)
- คอลัมน์: id, orderNo (String - เลขที่ใบงานซ่อม เช่น JOB-xxxx), customerId, status (ServiceStatus Enum - สถานะงาน), subtotal, vatAmount, grandTotal, operationDate, createdAt
- **สถานะ ServiceStatus (Enum)**: PENDING (รอรับรถ), IN_PROGRESS (กำลังซ่อม), COMPLETED (เสร็จสิ้น), CANCELLED (ยกเลิก)

### 7. ตาราง "ServiceVehicle" (รถที่เข้ามารับบริการจ๊อบซ่อม)
- คอลัมน์: id, serviceOrderId, carPlate (ทะเบียน), carBrand (ยี่ห้อ), carModel (รุ่น), carVin (เลขตัวถัง), status (ServiceStatus)

### 8. ตาราง "ServiceItem" (รายการค่าแรง/ค่าบริการของใบจ๊อบซ่อม)
- คอลัมน์: id, serviceVehicleId, serviceCode, description, quantity, priceUnit, totalPrice

## กฎการสืบค้นข้อมูลเพิ่มเติม (Search Preference Rules)
- **เมื่อผู้ใช้สอบถามเกี่ยวกับตัวงานซ่อมรถ หรือรถที่กำลังซ่อม โดยไม่ได้เจาะจงถามเรื่องเกี่ยวกับ "อะไหล่" (Parts) หรือ "ค่าแรงเคลมประกัน" (Labor/Claims) ให้คุณเริ่มต้นสืบค้นหาข้อมูลจากฝั่ง "ตารางงานบริการซ่อมทั่วไป" (ServiceOrder, ServiceVehicle และ ServiceItem) ก่อนเป็นอันดับแรกเสมอครับ**

## แนะนำการเลือกเครื่องมือ (Tools Selection Guide)
- หากผู้ใช้ระบุคำค้นหาแบบกว้างๆ เช่น ทะเบียนรถ เลขเคลม หรือชื่อลูกค้า ให้ลองใช้ฟังก์ชันสำเร็จรูปก่อน:
  * ค้นหาข้อมูลเคลมทั่วไป: ใช้ \`searchClaim\`
  * ค้นหาใบจ๊อบซ่อมทั่วไป: ใช้ \`searchServiceOrder\`
- หากเป็นคำถามที่ต้องการสถิติ เช่น นับจำนวน, หาค่าสูงสุด, หาผลรวมเงิน หรือเงื่อนไขซับซ้อนให้เขียน SQL SELECT ส่งไปรันที่ \`runCustomQuery\`
`

// ฟังก์ชันหลักในการประมวลผลคำตอบบอทช่างเบน
export async function askBen(
  userMessage: string,
  history: any[] = [],
  userContext?: {
    userId?: string
    userName?: string
    userRole?: string
    chatSourceType?: string
    chatSourceId?: string | null
    toolsCalled?: string[]
  }
) {
  if (!genAI) {
    return {
      text: 'ช่างเบนยังไม่พร้อมให้บริการในขณะนี้ครับ ขออภัยด้วยนะครับ (กรุณาตั้งค่า GEMINI_API_KEY ในระบบก่อนนะครับ) 🔑',
      inputTokens: 0,
      outputTokens: 0,
      modelName: 'gemini-3-flash-preview'
    }
  }

  // วันและเวลาปัจจุบันสำหรับอ้างอิง
  const now = new Date()
  const bkkDateStr = now.toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok' })
  const bkkTimeStr = now.toLocaleTimeString('th-TH', { timeZone: 'Asia/Bangkok', hour12: false })

  const dynamicPrompt = `${SYSTEM_PROMPT}

## วันและเวลาปัจจุบันของระบบ
- วันที่: ${bkkDateStr}
- เวลา: ${bkkTimeStr}
- ข้อมูลผู้ถาม: ${userContext?.userName || 'ลูกค้า/ผู้ใช้งาน'} (สิทธิ์: ${userContext?.userRole || 'USER'})`

  const model = genAI.getGenerativeModel({
    model: 'gemini-3-flash-preview',
    systemInstruction: dynamicPrompt,
    // ประกาศเครื่องมือสำหรับดึงข้อมูล
    tools: [{
      functionDeclarations: [
        {
          name: 'runCustomQuery',
          description: 'รันคำสั่ง SQL PostgreSQL (SELECT/WITH เท่านั้น) เพื่อคิวรี่ข้อมูลเชิงลึกในฐานข้อมูลระบบ Expert Body Paint',
          parameters: {
            type: SchemaType.OBJECT,
            properties: {
              sqlQuery: {
                type: SchemaType.STRING,
                description: 'คำสั่ง SQL PostgreSQL แท้ๆ ที่ขึ้นต้นด้วย SELECT หรือ WITH (ห้ามใช้ Semicolon ";" หรือคำสั่งแก้ไขข้อมูล)'
              }
            },
            required: ['sqlQuery']
          }
        },
        {
          name: 'searchClaim',
          description: 'ค้นหาใบเคลมตามเลขทะเบียนรถ, เลขตัวถัง หรือเลขใบเคลม',
          parameters: {
            type: SchemaType.OBJECT,
            properties: {
              keyword: {
                type: SchemaType.STRING,
                description: 'คำค้นหา เช่น "กข 1234" หรือ "CLM-009"'
              }
            },
            required: ['keyword']
          }
        },
        {
          name: 'searchServiceOrder',
          description: 'ค้นหาใบบริการ/จ๊อบซ่อม ตามเลขที่จ๊อบ (orderNo), ชื่อลูกค้า หรือทะเบียนรถ',
          parameters: {
            type: SchemaType.OBJECT,
            properties: {
              keyword: {
                type: SchemaType.STRING,
                description: 'คำค้นหา เช่น "สมชาย" หรือ "JOB-2026070001"'
              }
            },
            required: ['keyword']
          }
        },
        {
          name: 'getClaimsSummaryReport',
          description: 'ดึงข้อมูลสรุปสถิติใบเคลมประกันภัยและยอดเงินอนุมัติรวมทั้งหมด (ใช้อันนี้เมื่อต้องการสรุปสถิติเคลมรวม)',
          parameters: {
            type: SchemaType.OBJECT,
            properties: {}
          }
        },
        {
          name: 'getServiceJobsSummaryReport',
          description: 'ดึงข้อมูลสรุปจ๊อบงานซ่อมค้างทั้งหมดและยอดเงิน (ใช้อันนี้เมื่อต้องการสรุปงานซ่อมค้าง)',
          parameters: {
            type: SchemaType.OBJECT,
            properties: {}
          }
        }
      ]
    }]
  })

  // เริ่มบทสนทนาพร้อมประวัติย้อนหลัง
  const chat = model.startChat({ history })
  let response = await chat.sendMessage(userMessage)

  let iterations = 0
  const maxIterations = 6

  // วนลูปการเรียกใช้ฟังก์ชัน/คิวรี่ (AI Tool Calling Loop)
  while (iterations < maxIterations) {
    const candidate = response.response.candidates?.[0]
    if (!candidate) break

    const parts = candidate.content?.parts
    if (!parts) break

    const functionCalls = parts.filter(p => p.functionCall)
    if (functionCalls.length === 0) break

    const functionResponses = []
    for (const part of functionCalls) {
      const fc = part.functionCall!
      console.log(`[AI ช่างเบน] ขอดำเนินการเรียกใช้ Tool: ${fc.name} อาร์กิวเมนต์:`, fc.args)

      const fn = botFunctions[fc.name]
      let result: any

      if (fn) {
        try {
          // เก็บ log การเรียกใช้เครื่องมือใน Context
          if (userContext) {
            if (!userContext.toolsCalled) userContext.toolsCalled = []
            userContext.toolsCalled.push(fc.name)
          }
          
          // ทำงานเรียกใช้ฟังก์ชันจริง
          result = await fn(fc.args as Record<string, any>)
        } catch (err: any) {
          result = { error: `เกิดข้อผิดพลาดในการรันฟังก์ชัน: ${err.message}` }
        }
      } else {
        result = { error: `ไม่พบเครื่องมือชื่อ ${fc.name}` }
      }

      functionResponses.push({
        functionResponse: {
          name: fc.name,
          response: result as object,
        },
      })
    }

    // ส่งข้อมูลผลคิวรี่กลับไปให้โมเดล AI สรุปตอบ
    response = await chat.sendMessage(functionResponses)
    iterations++
  }

  const usage = response.response.usageMetadata

  return {
    text: response.response.text(),
    inputTokens: usage?.promptTokenCount || 0,
    outputTokens: usage?.candidatesTokenCount || 0,
    modelName: 'gemini-3-flash-preview'
  }
}
