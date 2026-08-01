/**
 * DonationBox - Temple Donation Receipt Management
 * Copyright (c) 2026 Ayam Heniber Meitei
 * Developed by Ayam Heniber Meitei <ayamheniber0@gmail.com>
 */

import { createLogger } from '../core/logger'
import { databasePath, defaultBackupsDir } from '../core/paths'
import { getPrisma } from './client'
import { SCHEMA_STATEMENTS } from './schema'

const log = createLogger('db:bootstrap')

const PRAGMAS = [
  'PRAGMA journal_mode = WAL;',
  'PRAGMA synchronous = NORMAL;',
  'PRAGMA foreign_keys = ON;',
  'PRAGMA busy_timeout = 5000;',
]

export async function bootstrapDatabase(): Promise<void> {
  const prisma = getPrisma()

  for (const pragma of PRAGMAS) {
    await prisma.$queryRawUnsafe(pragma)
  }

  for (const statement of SCHEMA_STATEMENTS) {
    await prisma.$executeRawUnsafe(statement)
  }

  await createSettingsRow()

  log.info('Database ready', databasePath())
}

async function createSettingsRow(): Promise<void> {
  const existing = await getPrisma().settings.findUnique({ where: { id: 1 } })
  if (existing) return

  await getPrisma().settings.create({
    data: {
      id: 1,
      templeName: '',
      address: '',
      phone: '',
      email: '',
      header: 'DONATION RECEIPT',
      footer: '',
      receiptPrefix: 'PDJM',
      authorizedSignatory: 'Authorised Signatory',
      backupFolder: defaultBackupsDir(),
    },
  })

  log.info('Created Settings row')
}
