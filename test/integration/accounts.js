import { randomUUID } from 'node:crypto'
import bcrypt from 'bcryptjs'

export async function createAccounts(prisma, tokens) {
  const credentials = { password: randomUUID() }
  const password = await bcrypt.hash(credentials.password, 12)
  const now = new Date()
  const tokenExpiry = new Date(now.getTime() + 24 * 60 * 60 * 1000)

  function identity(role) {
    const uuid = randomUUID()
    const digits = BigInt(`0x${uuid.replaceAll('-', '')}`).toString().slice(-17)
    return {
      email: `${role}-${uuid}@example.com`,
      phoneNumber: `62${digits.padStart(17, '0')}`,
      password,
      token: tokens[role],
      tokenExpiry,
    }
  }

  const { admin, customer, driver, fare } = await prisma.$transaction(async (tx) => {
    const admin = await tx.admin.create({
      data: {
        ...identity('admin'),
        username: `integration-${randomUUID()}`,
        fullName: 'Integration Admin',
        createDatetime: now,
        updateDatetime: now,
      },
    })
    const customer = await tx.customer.create({
      data: {
        ...identity('customer'),
        name: 'Integration Customer',
        verifiedEmail: true,
        status: true,
      },
    })
    const driver = await tx.driver.create({
      data: {
        ...identity('driver'),
        name: 'Integration Driver',
        noMembership: randomUUID().replaceAll('-', '').slice(0, 20),
        licensePlate: randomUUID().replaceAll('-', '').slice(0, 10),
        verifiedEmail: true,
        status: true,
      },
    })
    const fare = await tx.fare.create({
      data: { adminId: admin.id, farePerKm: 15000 },
    })
    return { admin, customer, driver, fare }
  })

  // Capture IDs so callers mutating the returned records cannot broaden cleanup.
  const adminId = admin.id
  const customerId = customer.id
  const driverId = driver.id

  async function cleanup() {
    await prisma.$transaction(async (tx) => {
      const where = { OR: [{ customerId }, { driverId }] }
      await tx.review.deleteMany({ where })
      await tx.report.deleteMany({ where })
      await tx.message.deleteMany({ where })
      await tx.notification.deleteMany({ where })
      await tx.order.deleteMany({ where })
      await tx.ride.deleteMany({ where: { driverId } })
      await tx.fare.deleteMany({ where: { adminId } })
      await tx.customer.deleteMany({ where: { id: customerId } })
      await tx.driver.deleteMany({ where: { id: driverId } })
      await tx.admin.deleteMany({ where: { id: adminId } })
    })
  }

  return { admin, customer, driver, credentials, fare, cleanup }
}
