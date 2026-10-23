import process from 'node:process'
import bcrypt from 'bcryptjs'
import 'dotenv/config'

export function assertSeedEnvironment(env) {
  if (env.NODE_ENV !== 'development' || env.ENABLE_DEV_SEEDING !== 'true') {
    throw new Error('Seeding requires NODE_ENV=development and ENABLE_DEV_SEEDING=true. Use a disposable development database only.')
  }
  if (!env.DEV_SEED_PASSWORD || env.DEV_SEED_PASSWORD.length < 12 || bcrypt.truncates(env.DEV_SEED_PASSWORD)) {
    throw new Error('DEV_SEED_PASSWORD must contain at least 12 characters and at most 72 UTF-8 bytes.')
  }
}

export async function seedDevelopment(prisma, env) {
  assertSeedEnvironment(env)
  const password = await bcrypt.hash(env.DEV_SEED_PASSWORD, 10)
  const adminPassword = await bcrypt.hash(env.DEV_SEED_PASSWORD, 12)
  const now = new Date()

  return prisma.$transaction(async (tx) => {
    const admin = await tx.admin.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        email: 'admin@example.com',
        username: 'dev-admin',
        fullName: 'Development Admin',
        password: adminPassword,
        phoneNumber: '+620000000001',
        createDatetime: now,
        updateDatetime: now,
      },
    })

    await tx.customer.upsert({
      where: { email: 'customer@example.com' },
      update: {},
      create: {
        email: 'customer@example.com',
        name: 'Development Customer',
        phoneNumber: '+620000000002',
        password,
        verifiedEmail: true,
        status: true,
        lat: -6.13,
        long: 106.66,
      },
    })

    await tx.driver.upsert({
      where: { email: 'driver@example.com' },
      update: {},
      create: {
        email: 'driver@example.com',
        name: 'Development Driver',
        phoneNumber: '+620000000003',
        noMembership: 'DEV-001',
        licensePlate: 'DEV0001',
        password,
        verifiedEmail: true,
        status: true,
        lat: -6.13,
        long: 106.66,
      },
    })

    // The application reads the first airport and fare, so preserve existing settings.
    if (!await tx.airport.findFirst()) {
      await tx.airport.create({
        data: {
          name: 'Development Airport',
          address: 'Development fixture — not a real pickup location',
          status: 1,
          lat: -6.1256,
          long: 106.6559,
        },
      })
    }

    if (!await tx.fare.findFirst()) {
      await tx.fare.create({
        data: { farePerKm: 5000, adminId: admin.id },
      })
    }
  })
}

async function main() {
  let prisma
  try {
    assertSeedEnvironment(process.env)
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is required.')
    }
    const { PrismaClient } = await import('../src/generated/prisma/client.ts')
    const { PrismaMariaDb } = await import('@prisma/adapter-mariadb')
    prisma = new PrismaClient({ adapter: new PrismaMariaDb(process.env.DATABASE_URL) })
    await seedDevelopment(prisma, process.env)
    process.stdout.write('Development seed complete. Existing records were preserved.\n')
  }
  finally {
    await prisma?.$disconnect()
  }
}

if (import.meta.main) {
  main().catch(() => {
    // Driver errors can include connection details; do not print credentials or query data.
    process.stderr.write('Development seed failed. Check the development opt-in, DEV_SEED_PASSWORD (12+ characters, at most 72 UTF-8 bytes), DATABASE_URL, migrations, and fixture uniqueness.\n')
    process.exitCode = 1
  })
}
