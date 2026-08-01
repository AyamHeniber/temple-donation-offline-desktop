/**
 * DonationBox - Temple Donation Receipt Management
 * Copyright (c) 2026 Ayam Heniber Meitei
 * Developed by Ayam Heniber Meitei <ayamheniber0@gmail.com>
 */

import fs from 'node:fs'
import { createLogger } from '../core/logger'
import { databasePath, databaseSidecarPaths, pendingRestorePath } from '../core/paths'

const log = createLogger('db:restore')

const SQLITE_MAGIC = 'SQLite format 3' + String.fromCharCode(0)

export function isSqliteFile(filePath: string): boolean {
  let handle: number | null = null
  try {
    handle = fs.openSync(filePath, 'r')
    const header = Buffer.alloc(16)
    const read = fs.readSync(handle, header, 0, 16, 0)
    return read === 16 && header.toString('utf8') === SQLITE_MAGIC
  } catch {
    return false
  } finally {
    if (handle !== null) fs.closeSync(handle)
  }
}

export function stageRestore(filePath: string): string {
  const pending = pendingRestorePath()
  fs.copyFileSync(filePath, pending)

  if (!isSqliteFile(pending)) {
    fs.rmSync(pending, { force: true })
    throw new Error('The staged file is not a valid SQLite database.')
  }

  log.info('Restore staged', pending)
  return pending
}

export function applyPendingRestore(): boolean {
  const pending = pendingRestorePath()
  if (!fs.existsSync(pending)) return false

  if (!isSqliteFile(pending)) {
    log.error('Discarding an invalid staged restore', pending)
    fs.rmSync(pending, { force: true })
    return false
  }

  try {
    for (const sidecar of databaseSidecarPaths()) fs.rmSync(sidecar, { force: true })

    fs.copyFileSync(pending, databasePath())
    fs.rmSync(pending, { force: true })

    log.info('Staged restore applied')
    return true
  } catch (error) {
    log.error('Failed to apply the staged restore', error)
    throw error
  }
}
