import { PrismaClient } from '@prisma/client'

const backupUrl = process.env.DATABASE_URL!.replace('/expert?', '/expert_backup?')
const source = new PrismaClient({ datasources: { db: { url: backupUrl } } })
const target = new PrismaClient()

async function debug() {
  // Read one claim from backup
  const claims = await source.claim.findMany({ take: 1 })
  const claim = claims[0]
  console.log('=== Claim from backup ===')
  console.log(JSON.stringify(claim, null, 2))
  
  // Check what columns backup schema has vs current
  const backupCols: any[] = await source.$queryRaw`
    SELECT column_name, data_type FROM information_schema.columns 
    WHERE table_name = 'Claim' ORDER BY ordinal_position
  `
  console.log('\n=== Backup Claim columns ===')
  for (const c of backupCols) console.log(`  ${c.column_name}: ${c.data_type}`)

  const targetCols: any[] = await target.$queryRaw`
    SELECT column_name, data_type FROM information_schema.columns 
    WHERE table_name = 'Claim' ORDER BY ordinal_position
  `
  console.log('\n=== Target Claim columns ===')
  for (const c of targetCols) console.log(`  ${c.column_name}: ${c.data_type}`)

  // Find differences
  const backupSet = new Set(backupCols.map((c: any) => c.column_name))
  const targetSet = new Set(targetCols.map((c: any) => c.column_name))
  
  const onlyInBackup = [...backupSet].filter(c => !targetSet.has(c))
  const onlyInTarget = [...targetSet].filter(c => !backupSet.has(c))
  
  console.log('\n=== DIFFERENCES ===')
  console.log('Only in backup:', onlyInBackup)
  console.log('Only in target:', onlyInTarget)

  // Try to insert with only target columns
  if (claim) {
    const filtered: any = {}
    for (const col of targetSet) {
      if (col in claim) filtered[col] = claim[col]
    }
    console.log('\n=== Trying filtered insert ===')
    console.log('Data:', JSON.stringify(filtered, null, 2))
    try {
      await target.claim.create({ data: filtered })
      console.log('✅ SUCCESS!')
    } catch (e: any) {
      console.log('❌ FULL ERROR:', e.message)
    }
  }
}

debug()
  .finally(async () => { await source.$disconnect(); await target.$disconnect() })
