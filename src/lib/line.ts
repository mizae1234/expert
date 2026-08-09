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

/**
 * ─── getMenuMessage ───
 * คอนฟิกโครงสร้าง Flex Carousel เมนูคำสั่งของช่างเบน
 */
export function getMenuMessage() {
  const liffId = '2011035347-GgEDwCEI'
  const liffUrl = `https://liff.line.me/${liffId}`

  return {
    type: 'flex',
    altText: '📖 เมนูคำสั่งช่างเบน (Ben Bot)',
    contents: {
      type: 'carousel',
      contents: [
        // Bubble 1: คู่มือการพิมพ์สั่งการ
        {
          type: 'bubble',
          size: 'mega',
          header: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: '🤖 ช่างเบน (Ben Bot)',
                weight: 'bold',
                size: 'xl',
                color: '#ffffff'
              },
              {
                type: 'text',
                text: 'ผู้ช่วยระบบงานเคลมและใบสั่งซ่อมสีรถยนต์',
                size: 'xs',
                color: '#FFE0B2',
                margin: 'xs'
              }
            ],
            backgroundColor: '#FF6D00',
            paddingAll: 'lg'
          },
          body: {
            type: 'box',
            layout: 'vertical',
            spacing: 'md',
            contents: [
              {
                type: 'text',
                text: '💡 วิธีพิมพ์สั่งการ',
                weight: 'bold',
                size: 'sm',
                color: '#FF6D00'
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
                      { type: 'text', text: '• แชทส่วนตัว:', size: 'xs', weight: 'bold', color: '#555555', flex: 3 },
                      { type: 'text', text: 'พิมพ์ถามช่างเบนได้ตรงๆ เลยครับ', size: 'xs', color: '#666666', wrap: true, flex: 7 }
                    ]
                  },
                  {
                    type: 'box',
                    layout: 'horizontal',
                    margin: 'xs',
                    contents: [
                      { type: 'text', text: '• แชทกลุ่ม/ห้อง:', size: 'xs', weight: 'bold', color: '#555555', flex: 3 },
                      { type: 'text', text: 'ให้พิมพ์นำหน้าด้วย "เบน" หรือ "ช่างเบน" เสมอครับ', size: 'xs', color: '#666666', wrap: true, flex: 7 }
                    ]
                  }
                ]
              },
              { type: 'separator', margin: 'md' },
              {
                type: 'text',
                text: '⚡ ทางลัดด่วน (กดปุ่มเพื่อเริ่มได้เลยครับ)',
                weight: 'bold',
                size: 'sm',
                color: '#FF6D00',
                margin: 'sm'
              },
              {
                type: 'box',
                layout: 'horizontal',
                spacing: 'md',
                contents: [
                  {
                    type: 'button',
                    style: 'primary',
                    color: '#FF6D00',
                    height: 'sm',
                    action: {
                      type: 'message',
                      label: '📖 แนะนำการใช้',
                      text: 'ช่างเบน แนะนำวิธีใช้งานหน่อยครับ'
                    },
                    flex: 1
                  }
                ]
              }
            ],
            paddingAll: 'lg'
          }
        },
        // Bubble 2: รายงานเคลมสี
        {
          type: 'bubble',
          size: 'mega',
          header: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: '📊 งานเคลม & สถิติสี',
                weight: 'bold',
                size: 'lg',
                color: '#ffffff'
              },
              {
                type: 'text',
                text: 'ติดตามสถิติใบเคลม ค้นหาและดูสถิติต่างๆ',
                size: 'xs',
                color: '#DBEAFE',
                margin: 'xs'
              }
            ],
            backgroundColor: '#2563EB',
            paddingAll: 'lg'
          },
          body: {
            type: 'box',
            layout: 'vertical',
            spacing: 'md',
            contents: [
              {
                type: 'box',
                layout: 'vertical',
                spacing: 'md',
                contents: [
                  {
                    type: 'box',
                    layout: 'horizontal',
                    action: {
                      type: 'message',
                      label: 'สรุปสถิติเคลม',
                      text: 'ช่างเบน สรุปสถิติเคลมหน่อยครับ'
                    },
                    contents: [
                      { type: 'text', text: '📊 สรุปสถิติเคลม', size: 'xs', weight: 'bold', color: '#2563EB', flex: 6 },
                      { type: 'text', text: 'วิเคราะห์ยอดใบเคลมรวม', size: 'xs', color: '#888888', align: 'end', flex: 4 }
                    ]
                  },
                  {
                    type: 'box',
                    layout: 'horizontal',
                    action: {
                      type: 'message',
                      label: 'ค้นหาทะเบียนรถ',
                      text: 'ช่างเบน ช่วยค้นหาทะเบียนรถหน่อยครับ'
                    },
                    contents: [
                      { type: 'text', text: '🔍 ค้นหาทะเบียนรถ', size: 'xs', weight: 'bold', color: '#2563EB', flex: 6 },
                      { type: 'text', text: 'พิมพ์เลขทะเบียนหรือตัวถัง', size: 'xs', color: '#888888', align: 'end', flex: 4 }
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
                color: '#2563EB',
                height: 'sm',
                action: {
                  type: 'uri',
                  label: '📊 เปิดดูแดชบอร์ดเคลม',
                  uri: `${liffUrl}?path=${encodeURIComponent('/dashboard')}`
                }
              }
            ]
          }
        },
        // Bubble 3: ใบสั่งซ่อมสี
        {
          type: 'bubble',
          size: 'mega',
          header: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: '🔧 ใบสั่งซ่อม & อู่บริการ',
                weight: 'bold',
                size: 'lg',
                color: '#ffffff'
              },
              {
                type: 'text',
                text: 'ตรวจสอบงานซ่อมค้างและใบสั่งซ่อมงานล่าสุด',
                size: 'xs',
                color: '#D1FAE5',
                margin: 'xs'
              }
            ],
            backgroundColor: '#059669',
            paddingAll: 'lg'
          },
          body: {
            type: 'box',
            layout: 'vertical',
            spacing: 'md',
            contents: [
              {
                type: 'box',
                layout: 'vertical',
                spacing: 'md',
                contents: [
                  {
                    type: 'box',
                    layout: 'horizontal',
                    action: {
                      type: 'message',
                      label: 'สรุปงานซ่อมค้าง',
                      text: 'ช่างเบน สรุปงานซ่อมค้างทั้งหมดให้หน่อยครับ'
                    },
                    contents: [
                      { type: 'text', text: '🔧 สรุปงานซ่อมค้าง', size: 'xs', weight: 'bold', color: '#059669', flex: 6 },
                      { type: 'text', text: 'ดูยอดรถกำลังซ่อมทั้งหมด', size: 'xs', color: '#888888', align: 'end', flex: 4 }
                    ]
                  },
                  {
                    type: 'box',
                    layout: 'horizontal',
                    action: {
                      type: 'message',
                      label: 'ใบสั่งงานซ่อมล่าสุด',
                      text: 'ช่างเบน ขอดูใบสั่งซ่อม 5 รายการล่าสุดหน่อยครับ'
                    },
                    contents: [
                      { type: 'text', text: '📝 ใบสั่งงานล่าสุด', size: 'xs', weight: 'bold', color: '#059669', flex: 6 },
                      { type: 'text', text: 'ดึงงานล่าสุด 5 รายการ', size: 'xs', color: '#888888', align: 'end', flex: 4 }
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
                color: '#059669',
                height: 'sm',
                action: {
                  type: 'uri',
                  label: '🔧 ดูตารางงานซ่อมสี',
                  uri: `${liffUrl}?path=${encodeURIComponent('/service-jobs')}`
                }
              }
            ]
          }
        }
      ]
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
