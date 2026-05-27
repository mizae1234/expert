import { PrismaClient } from '@prisma/client'

const backupUrl = process.env.DATABASE_URL!.replace('/expert?', '/expert_backup?')
const source = new PrismaClient({ datasources: { db: { url: backupUrl } } })
const target = new PrismaClient()

// Get column info: which columns are enums
async function getEnumColumns(tableName: string): Promise<Record<string, string>> {
  const cols: any[] = await target.$queryRawUnsafe(`
    SELECT column_name, udt_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = '${tableName}' AND table_schema = 'public'
  `)
  // Only return enum columns (USER-DEFINED type)
  const enumCols: Record<string, string> = {}
  for (const c of cols) {
    if (c.data_type === 'USER-DEFINED') {
      enumCols[c.column_name] = c.udt_name
    }
  }
  return enumCols
}

async function getTargetColumns(tableName: string): Promise<Set<string>> {
  const cols: any[] = await target.$queryRawUnsafe(`
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = '${tableName}' AND table_schema = 'public'
  `)
  return new Set(cols.map(c => c.column_name))
}

async function restore() {
  console.log('=== RESTORE v7 (enum-only casting) ===\n')

  // Clear ALL
  console.log('[1/3] Clearing expert...')
  const deleteOrder = [
    'ClaimStatusLog', 'ExtractionLog', 'ClaimExpense', 'ClaimDocument',
    'SupplierInvoiceItem', 'POItem', 'GoodsReceipt', 'DeliveryOrder',
    'SupplierInvoice', 'PurchaseOrder',
    'GarageInvoiceItem', 'GarageInvoice',
    'BillReceipt', 'InsuranceInvoice',
    'PaymentRequest', 'ARPayment', 'APPayment',
    'QuotationPart', 'QuotationLabor', 'Quotation',
    'ClaimLabor', 'ClaimPart',
    'StockMovement', 'StockBalance',
    'PartVendorPrice',
    'Claim',
    'PartMaster', 'Vendor', 'Insurance',
    'CompanyProfile', 'DocumentSequence',
    'User',
  ]
  for (const t of deleteOrder) {
    try { await target.$executeRawUnsafe(`DELETE FROM "${t}"`) } catch {}
  }
  console.log('   ✅ Done\n')

  // Insert order
  const insertOrder = [
    'CompanyProfile', 'DocumentSequence',
    'Insurance', 'Vendor', 'PartMaster', 'PartVendorPrice',
    'Claim',
    'ClaimPart', 'ClaimLabor',
    'PurchaseOrder', 'POItem',
    'SupplierInvoice', 'SupplierInvoiceItem',
    'GoodsReceipt', 'DeliveryOrder',
    'GarageInvoice', 'GarageInvoiceItem',
    'InsuranceInvoice', 'BillReceipt',
    'PaymentRequest', 'ARPayment', 'APPayment',
    'Quotation', 'QuotationPart', 'QuotationLabor',
    'ClaimStatusLog', 'ExtractionLog', 'ClaimExpense', 'ClaimDocument',
    'StockMovement', 'StockBalance',
  ]

  console.log('[2/3] Reading & inserting...\n')
  
  for (const tableName of insertOrder) {
    let rows: any[]
    try {
      rows = await source.$queryRawUnsafe(`SELECT * FROM "${tableName}"`)
    } catch { continue }
    if (rows.length === 0) continue

    const enumCols = await getEnumColumns(tableName)
    const targetCols = await getTargetColumns(tableName)
    console.log(`   ${tableName}: ${rows.length} records`)

    let success = 0, failed = 0
    for (const row of rows) {
      try {
        // Filter to only columns that exist in target
        const validCols = Object.keys(row).filter(k => targetCols.has(k) && row[k] !== undefined)
        
        const colNames: string[] = []
        const valParts: string[] = []
        const values: any[] = []
        let idx = 1

        for (const col of validCols) {
          let val = row[col]
          if (typeof val === 'bigint') val = Number(val)
          
          colNames.push(`"${col}"`)
          
          if (val !== null && enumCols[col]) {
            // This is an enum column - cast it
            valParts.push(`$${idx}::"${enumCols[col]}"`)
          } else {
            valParts.push(`$${idx}`)
          }
          
          values.push(val)
          idx++
        }

        const sql = `INSERT INTO "${tableName}" (${colNames.join(', ')}) VALUES (${valParts.join(', ')}) ON CONFLICT DO NOTHING`
        await target.$executeRawUnsafe(sql, ...values)
        success++
      } catch (e: any) {
        failed++
        if (failed <= 2) console.log(`      ⚠️ ${e.message?.slice(0, 200)}`)
      }
    }

    if (success > 0) console.log(`   ✅ ${tableName}: ${success}${failed > 0 ? ` (${failed} err)` : ''}`)
    else if (failed > 0) console.log(`   ❌ ${tableName}: all ${failed} failed`)
  }

  // Admin user
  console.log('\n[3/3] Admin user...')
  const admins: any[] = await target.$queryRawUnsafe(`SELECT * FROM "User" WHERE username = 'admin'`)
  if (admins.length === 0) {
    const crypto = require('crypto')
    const salt = 'd9b7f3eb3c4f526b7d288d6c8b9d2e1c'
    const hash = crypto.pbkdf2Sync('admin123', salt, 1000, 64, 'sha512').toString('hex')
    await target.user.create({
      data: {
        username: 'admin',
        password: `pbkdf2$1000$${salt}$${hash}`,
        name: 'ผู้ดูแลระบบสูงสุด',
        role: 'ADMIN',
        isActive: true,
      }
    })
    console.log('   ✅ Created')
  } else {
    console.log('   ✅ Exists')
  }

  // Verify
  console.log('\n=== VERIFICATION ===')
  for (const t of insertOrder) {
    try {
      const r: any[] = await target.$queryRawUnsafe(`SELECT COUNT(*)::int as c FROM "${t}"`)
      if (r[0].c > 0) console.log(`   ${t}: ${r[0].c}`)
    } catch {}
  }
  const uc: any[] = await target.$queryRawUnsafe(`SELECT COUNT(*)::int as c FROM "User"`)
  console.log(`   User: ${uc[0].c}`)
  console.log('\n=== ✅ RESTORE COMPLETE ===')
}

restore()
  .catch((e) => { console.error('❌ FATAL:', e); process.exit(1) })
  .finally(async () => { await source.$disconnect(); await target.$disconnect() })
