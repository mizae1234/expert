import prisma from '@/lib/prisma'

/**
 * ─── runCustomQuery ───
 * รันคำสั่ง SQL ดิบอย่างปลอดภัย (เฉพาะ SELECT/WITH อ่านข้อมูลเท่านั้น)
 * เพื่อป้องกัน SQL Injection หรือคำสั่งเปลี่ยนสถานะ/ลบข้อมูลบน Production DB
 */
export async function runCustomQuery(params: { sqlQuery: string }) {
  if (!params.sqlQuery) {
    return { error: 'กรุณาระบุคำสั่ง SQL คิวรี่ครับ' }
  }

  // 1. ตัด SQL comments เพื่อป้องกันการ Bypass ด้วยการสอดไส้คำสั่งหลบหลัง comment
  const stripped = params.sqlQuery
    .replace(/--[^\n]*/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .trim()

  const upper = stripped.toUpperCase()

  // 2. ป้องกันคำสั่งแฝง Chained Queries (ห้ามมีเครื่องหมายเซมิโคลอน ;)
  if (stripped.includes(';')) {
    return { error: '⛔ ระบบไม่อนุญาตให้รัน SQL หลายคำสั่งพร้อมกัน (ห้ามใช้เครื่องหมาย Semicolon ";") ครับ' }
  }

  // 3. ป้องกัน SQL commands สำหรับการสร้าง/แก้ไข/ลบ ข้อมูลและโครงสร้าง
  const forbiddenKeywords = [
    'INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'CREATE', 'TRUNCATE',
    'GRANT', 'REVOKE', 'MERGE', 'BULK', 'COPY', 'DO', 'CALL', 'EXECUTE',
    'INTO', 'UPSERT', 'REPLACE', 'DATABASE', 'SCHEMA', 'ROLE', 'USER', 'PASSWORD'
  ]

  for (const word of forbiddenKeywords) {
    if (new RegExp('\\b' + word + '\\b', 'i').test(upper)) {
      return { error: `⛔ ตรวจพบคำสั่งที่ไม่ปลอดภัย (${word}) ระบบอนุญาตเฉพาะคำสั่งอ่านข้อมูล (SELECT) เท่านั้นครับ` }
    }
  }

  // 4. บังคับให้คำสั่งต้องเริ่มต้นด้วย SELECT หรือ WITH (สำหรับ CTE) เท่านั้น
  const isSelect = upper.startsWith('SELECT') || upper.startsWith('WITH')
  if (!isSelect) {
    return { error: '⛔ ระบบอนุญาตเฉพาะคำสั่งอ่านข้อมูลที่ขึ้นต้นด้วย SELECT หรือ WITH เท่านั้นครับ' }
  }

  try {
    // รันแบบ Raw Unsafe SQL Read-Only ใน Postgres
    const result = await prisma.$queryRawUnsafe(stripped) as any[]
    
    // จำกัดจำนวนผลลัพธ์ไม่เกิน 20 แถว เพื่อป้องกันปัญหา Token บวม
    const rows = result.slice(0, 20)

    return {
      rowCount: result.length,
      shownRows: rows.length,
      data: rows,
    }
  } catch (err: any) {
    console.error('[runCustomQuery] DB Error:', err.message)
    return { error: `เกิดข้อผิดพลาดในการดึงข้อมูลจาก DB: ${err.message}` }
  }
}

/**
 * ─── searchClaim ───
 * ค้นหาข้อมูลเคลมรถยนต์แบบปลอดภัยตามเลขทะเบียน, เลขเคลม หรือเลขตัวถัง
 */
export async function searchClaim(params: { keyword: string }) {
  if (!params.keyword) return { claims: [] }
  try {
    const claims = await prisma.claim.findMany({
      where: {
        OR: [
          { carPlate: { contains: params.keyword, mode: 'insensitive' } },
          { claimNo: { contains: params.keyword, mode: 'insensitive' } },
          { carVin: { contains: params.keyword, mode: 'insensitive' } },
        ]
      },
      include: {
        insurance: { select: { name: true } },
        garage: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })
    return { claims }
  } catch (err: any) {
    console.error('[searchClaim] Error:', err.message)
    return { error: `ไม่สามารถค้นหาข้อมูลเคลมได้: ${err.message}` }
  }
}

/**
 * ─── searchServiceOrder ───
 * ค้นหาใบจ๊อบงานซ่อม/บริการแบบปลอดภัยตามเลขที่จ๊อบ, ชื่อลูกค้า หรือทะเบียนรถ
 */
export async function searchServiceOrder(params: { keyword: string }) {
  if (!params.keyword) return { serviceOrders: [] }
  try {
    const serviceOrders = await prisma.serviceOrder.findMany({
      where: {
        OR: [
          { orderNo: { contains: params.keyword, mode: 'insensitive' } },
          { customer: { name: { contains: params.keyword, mode: 'insensitive' } } },
          { vehicles: { some: { carPlate: { contains: params.keyword, mode: 'insensitive' } } } },
        ]
      },
      include: {
        customer: { select: { name: true, phone: true } },
        vehicles: {
          include: {
            items: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })
    return { serviceOrders }
  } catch (err: any) {
    console.error('[searchServiceOrder] Error:', err.message)
    return { error: `ไม่สามารถค้นหาใบบริการได้: ${err.message}` }
  }
}

// แผนที่จับคู่งานสำหรับเรียกใช้ใน Gemini AI
export const botFunctions: Record<string, (params: Record<string, any>) => Promise<any>> = {
  runCustomQuery: (p) => runCustomQuery(p as { sqlQuery: string }),
  searchClaim: (p) => searchClaim(p as { keyword: string }),
  searchServiceOrder: (p) => searchServiceOrder(p as { keyword: string }),
}
