---
name: Peak Export Configuration
description: Peak accounting software integration - product codes, account codes, and export templates used for syncing claims data to Peak.
---

# Peak Export Configuration

## Product Codes (รหัสสินค้า)

| ประเภท | Product Code | ชื่อใน Peak |
|---|---|---|
| **ค่าอะไหล่ (Parts)** | `P00056` | ค่าอะไหล่410102 |
| **ค่าแรง (Labor)** | `P00057` | ค่าแรง410202 |

## Account Codes (รหัสบัญชี)

### Revenue (รายได้)
| ประเภท | Account Code | ชื่อบัญชี |
|---|---|---|
| ค่าแรง | `410202` | รายได้ค่าแรง |
| ค่าอะไหล่ | `410102` | รายได้ค่าอะไหล่ |

### Cost (ต้นทุน)
| ประเภท | Account Code | ชื่อบัญชี |
|---|---|---|
| ค่าอะไหล่ | `510103` | ต้นทุนขายสินค้า |
| ค่าแรง | `510127` | ต้นทุนค่าแรง(รายคืน) |

## Export Templates

มี 4 templates ใช้ใน Peak import:

1. **ar-invoice** (ตั้งลูกหนี้) → `Import_Invoice`
   - ค่าแรง: Product `P00057`, Account `410202`
   - ค่าอะไหล่: Product `P00056`, Account `410102`

2. **ar-receipt** (รับชำระ) → `Import_Receipt`
   - อ้างอิงใบแจ้งหนี้, ช่องทาง: โอนเงิน

3. **ap-purchase** (ตั้งเจ้าหนี้) → `Import_PurchaseInventory`
   - ค่าอะไหล่ (Supplier): Product `P00056`, Account `510103`
   - ค่าแรง (Garage): Product `P00057`, Account `510127`

4. **ap-expense** (จ่ายเงิน) → `Import_Expense`
   - ค่าอะไหล่: Account `510103`, ช่องทาง: โอนเงิน

## Related Files

- Config อยู่ที่ `PEAK_CONFIG` object ใน:
  - `src/app/api/peak-export/batch/route.ts` — Batch export หลาย claims
  - `src/app/api/claims/[id]/peak-export/route.ts` — Export ทีละ claim
- Peak page: `src/app/peak/page.tsx`
- Peak export UI: `src/app/api/peak/export/route.ts`

## Change History

| วันที่ | เปลี่ยนแปลง |
|---|---|
| 2026-07-31 | เปลี่ยน Product Code: P00033→P00056 (อะไหล่), P00035→P00057 (แรง) |
