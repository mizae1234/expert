/**
 * ═══════════════════════════════════════════════════════════════
 * RULE: ทุกวันที่ที่แสดงผลในระบบ ต้องใช้ พ.ศ. (Buddhist Era) เสมอ
 *       DB เก็บเป็น ISO/AD (ค.ศ.) — แปลงเป็น พ.ศ. ตอน display เท่านั้น
 *       HTML date input จะแสดงเป็น ค.ศ. ตามระบบ (ควบคุมไม่ได้)
 *       แต่ทุก text display ต้องเป็น พ.ศ.
 * ═══════════════════════════════════════════════════════════════
 */

const BE_OFFSET = 543

/** Format date as DD/MM/YYYY (พ.ศ.) */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-'
  const d = new Date(date)
  if (isNaN(d.getTime())) return '-'
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear() + BE_OFFSET
  return `${dd}/${mm}/${yyyy}`
}

/** Format date + time as DD/MM/YYYY HH:mm (พ.ศ.) */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '-'
  const d = new Date(date)
  if (isNaN(d.getTime())) return '-'
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear() + BE_OFFSET
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`
}

/** Format as YYYY-MM-DD (ค.ศ.) for <input type="date"> — browser requires AD */
export function toInputDate(date: string | Date | null | undefined): string {
  if (!date) return ''
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  return d.toISOString().split('T')[0]
}

/** Format as short month-year e.g. "พ.ค. 2569" (พ.ศ.) */
export function formatMonthYear(date: string | Date): string {
  const d = new Date(date)
  const monthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
  return `${monthNames[d.getMonth()]} ${d.getFullYear() + BE_OFFSET}`
}
