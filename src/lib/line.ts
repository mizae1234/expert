import prisma from '@/lib/prisma'

export const lineConfig = {
  channelSecret: process.env.LINE_CHANNEL_SECRET || '',
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
}

/**
 * ─── replyText ───
 * ส่งข้อความธรรมดา (Text) ตอบกลับไปยังผู้ใช้ตาม replyToken
 */
export async function replyText(replyToken: string, text: string) {
  if (!lineConfig.channelAccessToken) {
    console.error('[LINE replyText] Access Token missing')
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
        messages: [{ type: 'text', text }],
      }),
    })
    if (!res.ok) {
      const errText = await res.text()
      console.error('[LINE replyText failed]', errText)
    }
  } catch (err: any) {
    console.error('[LINE replyText Error]', err.message)
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
