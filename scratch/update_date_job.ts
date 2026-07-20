import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  try {
    const orderNo = 'JOB-20260700001'
    const targetDate = new Date('2026-07-02T10:00:00.000Z') // July 2nd, 2026

    const order = await prisma.serviceOrder.findUnique({
      where: { orderNo },
      include: { vehicles: true }
    })

    if (!order) {
      console.log(`❌ ไม่พบใบงาน ${orderNo}`)
      return
    }

    console.log(`พบใบงาน ${order.orderNo} (ID: ${order.id})`)
    console.log(`วันที่สร้างเดิม: ${order.createdAt}`)
    console.log(`วันที่วางบิลเดิม: ${order.invoiceDate}`)

    // Update ServiceOrder
    const updatedOrder = await prisma.serviceOrder.update({
      where: { id: order.id },
      data: {
        createdAt: targetDate,
        invoiceDate: order.invoiceDate ? targetDate : null,
        dueDate: order.dueDate ? new Date(targetDate.getTime() + 30 * 24 * 60 * 60 * 1000) : null
      }
    })

    console.log(`✅ อัปเดตใบงานเรียบร้อย:`)
    console.log(`- createdAt: ${updatedOrder.createdAt}`)
    console.log(`- invoiceDate: ${updatedOrder.invoiceDate}`)

    // Update vehicles under this order
    for (const vehicle of order.vehicles) {
      const updatedVehicle = await prisma.serviceVehicle.update({
        where: { id: vehicle.id },
        data: {
          createdAt: targetDate,
          completedAt: vehicle.completedAt ? targetDate : null
        }
      })
      console.log(`✅ อัปเดตรถทะเบียน ${updatedVehicle.carPlate} เรียบร้อย:`)
      console.log(`  - createdAt: ${updatedVehicle.createdAt}`)
      console.log(`  - completedAt: ${updatedVehicle.completedAt}`)
    }

  } catch (err: any) {
    console.error('❌ Error updating order:', err.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()
