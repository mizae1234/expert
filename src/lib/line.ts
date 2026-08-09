import prisma from '@/lib/prisma'

export const lineConfig = {
  channelSecret: process.env.LINE_CHANNEL_SECRET || '',
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
}

/**
 * ─── Quick Reply Menu ───
 * รายการเมนูลัดสำหรับให้ผู้ใช้เลือกกดที่ด้านล่างของหน้าจอแชท LINE
 */
export const quickReplyItems = {
  items: [
    {
      type: 'action',
      action: {
        type: 'message',
        label: '📊 สรุปสถิติเคลม',
        text: 'ช่างเบน สรุปสถิติเคลมหน่อยครับ'
      }
    },
    {
      type: 'action',
      action: {
        type: 'message',
        label: '🔧 สรุปงานซ่อมค้าง',
        text: 'ช่างเบน สรุปงานซ่อมค้างทั้งหมดให้หน่อยครับ'
      }
    },
    {
      type: 'action',
      action: {
        type: 'message',
        label: '📖 แนะนำวิธีใช้งาน',
        text: 'ช่างเบน แนะนำวิธีใช้งานหน่อยครับ'
      }
    }
  ]
}

/**
 * ─── replyMessage ───
 * ส่งชุดข้อความดิบ (เช่น Text, Flex, Carousel) ตอบกลับไปยังผู้ใช้ตาม replyToken
 */
export async function replyMessage(replyToken: string, messages: any[]) {
  if (!lineConfig.channelAccessToken) {
    console.error('[LINE replyMessage] Access Token missing')
    return
  }
  try {
    const res = await fetch('https://api.line.me/v2/bot/message/reply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${lineConfig.channelAccessToken}`,
      },
      body: JSON.stringify({
        replyToken,
        messages,
      }),
    })
    if (!res.ok) {
      const errText = await res.text()
      console.error('[LINE replyMessage failed]', errText)
    }
  } catch (err: any) {
    console.error('[LINE replyMessage Error]', err.message)
  }
}

/**
 * ─── replyText ───
 * ส่งข้อความธรรมดา (Text) ตอบกลับไปยังผู้ใช้ตาม replyToken พร้อมแสดงเมนูลัด
 */
export async function replyText(replyToken: string, text: string) {
  await replyMessage(replyToken, [{
    type: 'text',
    text,
    quickReply: quickReplyItems,
  }])
}

/**
 * ─── pushMessage ───
 * ส่งชุดข้อความดิบ (เช่น Text, Flex, Carousel) ไปยังผู้ใช้หรือกลุ่มเป้าหมาย (ไม่ต้องใช้ replyToken)
 */
export async function pushMessage(to: string, messages: any[]) {
  if (!lineConfig.channelAccessToken) {
    console.error('[LINE pushMessage] Access Token missing')
    return
  }
  try {
    const res = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${lineConfig.channelAccessToken}`,
      },
      body: JSON.stringify({
        to,
        messages,
      }),
    })
    if (!res.ok) {
      const errText = await res.text()
      console.error('[LINE pushMessage failed]', errText)
    }
  } catch (err: any) {
    console.error('[LINE pushMessage Error]', err.message)
  }
}

/**
 * ─── pushText ───
 * ส่งข้อความธรรมดา (Text) พร้อมเมนูลัดไปยังปลายทาง
 */
export async function pushText(to: string, text: string) {
  await pushMessage(to, [{
    type: 'text',
    text,
    quickReply: quickReplyItems,
  }])
}

export function getMenuMessage() {
  const liffId = '2011035347-GgEDwCEI'
  const liffUrl = `https://liff.line.me/${liffId}`

  return {
    type: 'flex',
    altText: '📖 เมนูคำสั่งช่างเบน (Ben Bot)',
    contents: {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '📖 เมนูคำสั่ง',
            weight: 'bold',
            size: 'xl',
            color: '#ffffff'
          },
          {
            type: 'text',
            text: 'ช่างเบน (Ben) — ผู้ช่วย AI คิวรี่ข้อมูลและประกันภัย',
            size: 'xs',
            color: '#e2e8f0',
            margin: 'xs'
          }
        ],
        backgroundColor: '#1d4ed8',
        paddingAll: 'lg'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        contents: [
          // ส่วนที่ 1: วิธีใช้
          {
            type: 'text',
            text: '💡 วิธีใช้',
            weight: 'bold',
            size: 'sm',
            color: '#1d4ed8'
          },
          {
            type: 'box',
            layout: 'vertical',
            spacing: 'xs',
            contents: [
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  {
                    type: 'text',
                    text: '• แชทส่วนตัว:',
                    size: 'xs',
                    weight: 'bold',
                    color: '#475569',
                    flex: 3
                  },
                  {
                    type: 'text',
                    text: 'พิมพ์ถามได้เลย ไม่ต้องใช้คำนำหน้า',
                    size: 'xs',
                    color: '#64748b',
                    flex: 7
                  }
                ]
              },
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  {
                    type: 'text',
                    text: '• แชทกลุ่ม:',
                    size: 'xs',
                    weight: 'bold',
                    color: '#475569',
                    flex: 3
                  },
                  {
                    type: 'text',
                    text: 'พิมพ์ "ช่างเบน" นำหน้า เช่น "ช่างเบน ยอดเคลม"',
                    size: 'xs',
                    color: '#64748b',
                    flex: 7,
                    wrap: true
                  }
                ]
              }
            ]
          },
          {
            type: 'separator',
            margin: 'md'
          },
          // ส่วนที่ 2: คำสั่งลัด
          {
            type: 'text',
            text: '⚡ คำสั่งลัด',
            weight: 'bold',
            size: 'sm',
            color: '#1d4ed8',
            margin: 'md'
          },
          {
            type: 'box',
            layout: 'vertical',
            spacing: 'md',
            contents: [
              // ข้อ 1
              {
                type: 'box',
                layout: 'horizontal',
                action: {
                  type: 'message',
                  label: 'สรุปสถิติเคลม',
                  text: 'ช่างเบน สรุปสถิติเคลมหน่อยครับ'
                },
                contents: [
                  {
                    type: 'text',
                    text: '1. สรุปสถิติเคลม',
                    size: 'xs',
                    weight: 'bold',
                    color: '#1d4ed8',
                    flex: 5
                  },
                  {
                    type: 'text',
                    text: 'ดูยอดวิเคราะห์ใบเคลมทั้งหมด',
                    size: 'xs',
                    color: '#64748b',
                    flex: 5,
                    align: 'end'
                  }
                ]
              },
              // ข้อ 2
              {
                type: 'box',
                layout: 'horizontal',
                action: {
                  type: 'message',
                  label: 'สรุปงานซ่อมค้าง',
                  text: 'ช่างเบน สรุปงานซ่อมค้างทั้งหมดให้หน่อยครับ'
                },
                contents: [
                  {
                    type: 'text',
                    text: '2. สรุปงานซ่อมค้าง',
                    size: 'xs',
                    weight: 'bold',
                    color: '#1d4ed8',
                    flex: 5
                  },
                  {
                    type: 'text',
                    text: 'ดูภาพรวมงานซ่อมรถทั้งหมด',
                    size: 'xs',
                    color: '#64748b',
                    flex: 5,
                    align: 'end'
                  }
                ]
              },
              // ข้อ 3
              {
                type: 'box',
                layout: 'horizontal',
                action: {
                  type: 'message',
                  label: 'แนะนำวิธีใช้งาน',
                  text: 'ช่างเบน แนะนำวิธีใช้งานหน่อยครับ'
                },
                contents: [
                  {
                    type: 'text',
                    text: '3. คู่มือการใช้งาน',
                    size: 'xs',
                    weight: 'bold',
                    color: '#1d4ed8',
                    flex: 5
                  },
                  {
                    type: 'text',
                    text: 'แสดงคู่มือแชทบอทระบบช่างเบน',
                    size: 'xs',
                    color: '#64748b',
                    flex: 5,
                    align: 'end'
                  }
                ]
              },
              // ข้อ 4
              {
                type: 'box',
                layout: 'horizontal',
                action: {
                  type: 'message',
                  label: 'ค้นหาทะเบียนรถ',
                  text: 'ช่างเบน ช่วยค้นหาทะเบียนรถหน่อยครับ'
                },
                contents: [
                  {
                    type: 'text',
                    text: '4. ค้นหาทะเบียน [ทะเบียน]',
                    size: 'xs',
                    weight: 'bold',
                    color: '#1d4ed8',
                    flex: 6
                  },
                  {
                    type: 'text',
                    text: 'เช็คข้อมูลรถและใบงานซ่อม',
                    size: 'xs',
                    color: '#64748b',
                    flex: 4,
                    align: 'end'
                  }
                ]
              },
              // ข้อ 5
              {
                type: 'box',
                layout: 'horizontal',
                action: {
                  type: 'uri',
                  label: 'เปิดดูแดชบอร์ด',
                  uri: `${liffUrl}?path=${encodeURIComponent('/dashboard')}`
                },
                contents: [
                  {
                    type: 'text',
                    text: '5. เปิดดูแดชบอร์ด',
                    size: 'xs',
                    weight: 'bold',
                    color: '#1d4ed8',
                    flex: 5
                  },
                  {
                    type: 'text',
                    text: 'เข้าดูรายงานผลแดชบอร์ดหน้าเว็บ',
                    size: 'xs',
                    color: '#64748b',
                    flex: 5,
                    align: 'end'
                  }
                ]
              }
            ]
          }
        ],
        paddingAll: 'lg'
      }
    }
  }
}

/**
 * ─── getProfile ───
 * ดึงโปรไฟล์สาธารณะของผู้ใช้งานจาก LINE API
 */
export async function getProfile(userId: string) {
  if (!lineConfig.channelAccessToken) return null
  try {
    const res = await fetch(`https://api.line.me/v2/bot/profile/${userId}`, {
      headers: {
        'Authorization': `Bearer ${lineConfig.channelAccessToken}`,
      },
    })
    if (res.ok) {
      return (await res.json()) as {
        displayName: string
        pictureUrl?: string
        statusMessage?: string
      }
    }
  } catch (err: any) {
    console.error('[LINE getProfile Error]', err.message)
  }
  return null
}

/**
 * ─── saveGroupToDb ───
 * บันทึกกลุ่มหรือห้องแชท LINE ที่บอทถูกเชิญเข้าร่วมลงในฐานข้อมูล
 */
export async function saveGroupToDb(groupId: string, groupType: string = 'group') {
  try {
    await prisma.lineGroup.upsert({
      where: { groupId },
      update: { isActive: true, groupType },
      create: { groupId, groupType, isActive: true },
    })
  } catch (err: any) {
    console.error('[saveGroupToDb Error]', err.message)
  }
}

/**
 * ─── deactivateGroupInDb ───
 * ปิดการใช้งานกลุ่มเมื่อบอทถูกเตะออกจากกลุ่มหรือห้องแชท
 */
export async function deactivateGroupInDb(groupId: string) {
  try {
    await prisma.lineGroup.updateMany({
      where: { groupId },
      data: { isActive: false },
    })
  } catch (err: any) {
    console.error('[deactivateGroupInDb Error]', err.message)
  }
}

/**
 * ─── handleFollow ───
 * จัดการอีเวนต์ที่มีผู้ใช้แอดไลน์แอด (Follow) บอท
 */
export async function handleFollow(lineUserId: string) {
  try {
    const profile = await getProfile(lineUserId)
    await prisma.lineUser.upsert({
      where: { lineUserId },
      update: {
        isActive: true,
        displayName: profile?.displayName || null,
        pictureUrl: profile?.pictureUrl || null,
        statusMessage: profile?.statusMessage || null,
      },
      create: {
        lineUserId,
        isActive: true,
        displayName: profile?.displayName || null,
        pictureUrl: profile?.pictureUrl || null,
        statusMessage: profile?.statusMessage || null,
      },
    })
  } catch (err: any) {
    console.error('[handleFollow Error]', err.message)
  }
}

/**
 * ─── getSalesReportMessage ───
 * แปลงข้อมูลยอดขายดิบให้เป็น Flex Message รูปแบบสวยงาม Premium (เหมือนสไตล์ Saran Bot)
 */
export function getSalesReportMessage(salesData: any) {
  const liffId = '2011035347-GgEDwCEI'
  const liffUrl = `https://liff.line.me/${liffId}`
  
  const title = salesData.type === 'today' ? '📊 สรุปยอดขายวันนี้' : '📊 สรุปยอดขายทั้งหมด'
  const totalSalesStr = salesData.totalSales.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const avgSalesStr = salesData.averagePerBill.toLocaleString('th-TH')
  const claimsSumStr = salesData.claimsSum.toLocaleString('th-TH')
  const serviceOrdersSumStr = salesData.serviceOrdersSum.toLocaleString('th-TH')

  return {
    type: 'flex',
    altText: title,
    contents: {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: title,
            weight: 'bold',
            size: 'lg',
            color: '#ffffff'
          }
        ],
        backgroundColor: '#1d4ed8',
        paddingAll: 'lg'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'lg',
        contents: [
          // ยอดขายรวม
          {
            type: 'box',
            layout: 'vertical',
            spacing: 'xs',
            contents: [
              {
                type: 'text',
                text: 'ยอดขายรวม',
                size: 'sm',
                color: '#64748b'
              },
              {
                type: 'text',
                text: `฿ ${totalSalesStr}`,
                weight: 'bold',
                size: 'xxl',
                color: '#1e293b'
              }
            ]
          },
          {
            type: 'separator'
          },
          // Grid: จำนวนบิล / เฉลี่ย
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'box',
                layout: 'vertical',
                spacing: 'xs',
                contents: [
                  {
                    type: 'text',
                    text: 'จำนวนบิล',
                    size: 'xs',
                    color: '#64748b'
                  },
                  {
                    type: 'text',
                    text: `${salesData.totalBills} บิล`,
                    weight: 'bold',
                    size: 'md',
                    color: '#1e293b'
                  }
                ],
                flex: 1
              },
              {
                type: 'box',
                layout: 'vertical',
                spacing: 'xs',
                contents: [
                  {
                    type: 'text',
                    text: 'เฉลี่ย/บิล',
                    size: 'xs',
                    color: '#64748b'
                  },
                  {
                    type: 'text',
                    text: `฿ ${avgSalesStr}`,
                    weight: 'bold',
                    size: 'md',
                    color: '#1e293b'
                  }
                ],
                flex: 1
              }
            ]
          },
          {
            type: 'separator'
          },
          // ประเภทรายได้
          {
            type: 'box',
            layout: 'vertical',
            spacing: 'sm',
            contents: [
              {
                type: 'text',
                text: 'ช่องทางรายได้',
                size: 'xs',
                color: '#64748b',
                weight: 'bold'
              },
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  {
                    type: 'text',
                    text: '🚗 งานเคลมประกัน',
                    size: 'xs',
                    color: '#475569',
                    flex: 7
                  },
                  {
                    type: 'text',
                    text: `฿ ${claimsSumStr}`,
                    size: 'xs',
                    color: '#1e293b',
                    weight: 'bold',
                    align: 'end',
                    flex: 3
                  }
                ]
              },
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  {
                    type: 'text',
                    text: '🔧 งานบริการทั่วไป',
                    size: 'xs',
                    color: '#475569',
                    flex: 7
                  },
                  {
                    type: 'text',
                    text: `฿ ${serviceOrdersSumStr}`,
                    size: 'xs',
                    color: '#1e293b',
                    weight: 'bold',
                    align: 'end',
                    flex: 3
                  }
                ]
              }
            ]
          }
        ],
        paddingAll: 'lg'
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        paddingAll: 'lg',
        contents: [
          {
            type: 'button',
            style: 'primary',
            color: '#1d4ed8',
            height: 'sm',
            action: {
              type: 'uri',
              label: 'ดูรายละเอียดเพิ่มเติม (LIFF)',
              uri: `${liffUrl}?path=${encodeURIComponent('/dashboard')}`
            }
          }
        ]
      }
    }
  }
}
