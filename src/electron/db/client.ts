/**
 * DonationBox - Temple Donation Receipt Management
 * Copyright (c) 2026 Ayam Heniber Meitei
 * Developed by Ayam Heniber Meitei <ayamheniber0@gmail.com>
 */

import type { PrismaClient } from '@prisma-client'
import { app } from 'electron'
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import { createLogger } from '../core/logger'
import { databasePath } from '../core/paths'

const log = createLogger('db')

let client: PrismaClient | null = null

const GENERATED_CLIENT_DIR = 'prisma-client'

type PrismaClientCtor = new (options: {
  datasources: { db: { url: string } }
  log: Array<'warn' | 'error'>
}) => PrismaClient

function generatedClientPath(): string {
  return path.join(app.getAppPath(), GENERATED_CLIENT_DIR)
}

function unpackedEngineDir(): string {
  return path.join(`${app.getAppPath()}.unpacked`, GENERATED_CLIENT_DIR)
}

function loadPrismaClientCtor(): PrismaClientCtor {
  const nodeRequire = createRequire(__filename)
  return nodeRequire(generatedClientPath()).PrismaClient as PrismaClientCtor
}

export const ENGINE_FILE_PATTERN = /^(?:lib)?query_engine.*\.node$/

const ENGINE_FOR_PLATFORM: Partial<Record<NodeJS.Platform, RegExp>> = {
  win32: /^query_engine-windows.*\.node$/i,
  darwin: /^libquery_engine-darwin.*\.node$/i,
  linux: /^libquery_engine-(?:debian|rhel|linux).*\.node$/i,
}

export function pickEngineFile(files: string[], platform: NodeJS.Platform): string | undefined {
  const preferred = ENGINE_FOR_PLATFORM[platform]
  return (
    (preferred && files.find((f) => preferred.test(f))) ??
    files.find((f) => ENGINE_FILE_PATTERN.test(f))
  )
}

function configureEngineLocation(): void {
  if (!app.isPackaged || process.env.PRISMA_QUERY_ENGINE_LIBRARY) return

  const unpacked = unpackedEngineDir()

  try {
    const engine = pickEngineFile(fs.readdirSync(unpacked), process.platform)
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

  const PrismaClientCtor = loadPrismaClientCtor()

  client = new PrismaClientCtor({
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

