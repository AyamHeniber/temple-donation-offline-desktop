/**
 * DonationBox - Temple Donation Receipt Management
 * Copyright (c) 2026 Ayam Heniber Meitei
 * Developed by Ayam Heniber Meitei <ayamheniber0@gmail.com>
 */

import { PrismaClient } from '@prisma/client'
import { app } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import { createLogger } from '../core/logger'
import { databasePath } from '../core/paths'

const log = createLogger('db')

let client: PrismaClient | null = null

export const ENGINE_FILE_PATTERN = /^(?:lib)?query_engine.*\.node$/

function configureEngineLocation(): void {
  if (!app.isPackaged || process.env.PRISMA_QUERY_ENGINE_LIBRARY) return

  const unpacked = path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', '.prisma', 'client')

  try {
    const engine = fs.readdirSync(unpacked).find((f) => ENGINE_FILE_PATTERN.test(f))
    if (!engine) {
      log.error('Prisma query engine not found', { unpacked })
      return
    }
    process.env.PRISMA_QUERY_ENGINE_LIBRARY = path.join(unpacked, engine)
    log.info('Prisma engine resolved', process.env.PRISMA_QUERY_ENGINE_LIBRARY)
  } catch (error) {
    log.error('Failed to resolve Prisma engine directory', error)
  }
}

export function connectionUrl(dbPath: string = databasePath()): string {
  return `file:${dbPath.replace(/\\/g, '/')}`
}

export function getPrisma(): PrismaClient {
  if (client) return client

  configureEngineLocation()

  client = new PrismaClient({
    datasources: { db: { url: connectionUrl() } },
    log: ['warn', 'error'],
  })

  return client
}

export async function disconnectPrisma(): Promise<void> {
  if (!client) return
  try {
    await client.$disconnect()
  } catch (error) {
    log.warn('Prisma disconnect failed', error)
  } finally {
    client = null
  }
}

export async function reconnectPrisma(): Promise<PrismaClient> {
  await disconnectPrisma()
  return getPrisma()
}

export async function checkpointWal(): Promise<void> {
  if (!client) return
  try {
    await client.$queryRawUnsafe('PRAGMA wal_checkpoint(TRUNCATE);')
  } catch (error) {
    log.warn('WAL checkpoint failed', error)
  }
}

