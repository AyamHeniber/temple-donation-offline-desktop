/**
 * DonationBox - Temple Donation Receipt Management
 * Copyright (c) 2026 Ayam Heniber Meitei
 * Developed by Ayam Heniber Meitei <ayamheniber0@gmail.com>
 */

import { app, dialog, shell } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import type { BackupRecord } from '@/types/domain'
import type { RestoreResult, SaveFileResult } from '@/types/ipc'
import { AppError } from '@/utils/errors'
import { fileStamp } from '@/utils/date'
import { copyFileSafe, fileExists, fileSize, removeIfExists } from '../core/files'
import { createLogger } from '../core/logger'
import { databasePath, defaultBackupsDir } from '../core/paths'
import { checkpointWal } from '../db/client'
import { isSqliteFile, stageRestore } from '../db/restore'
import { mapBackup } from '../db/mappers'
import { backupRepository } from '../repositories/backup.repository'
import { settingsRepository } from '../repositories/settings.repository'

const log = createLogger('backup')

async function backupFolder(): Promise<string> {
  const settings = await settingsRepository.find()
  const folder = settings?.backupFolder?.trim() || defaultBackupsDir()

  try {
    fs.mkdirSync(folder, { recursive: true })
    return folder
  } catch {
    log.warn(`Backup folder "${folder}" is not writable; falling back to userData`)
    return defaultBackupsDir()
  }
}

function assertSqliteFile(filePath: string): void {
  if (!fileExists(filePath)) throw new AppError('IO', 'That backup file could not be found.')
  if (!isSqliteFile(filePath)) {
    throw AppError.validation('That file is not a DonationBox database backup.')
  }
}

async function snapshotTo(destination: string): Promise<void> {
  await checkpointWal()
  copyFileSafe(databasePath(), destination)
}

function nextBackupPath(folder: string): { fileName: string; filePath: string } {
  const base = `donationbox-${fileStamp()}`

  for (let attempt = 0; attempt < 1000; attempt += 1) {
    const fileName = attempt === 0 ? `${base}.db` : `${base}-${attempt + 1}.db`
    const filePath = path.join(folder, fileName)
    if (!fs.existsSync(filePath)) return { fileName, filePath }
  }

  throw new AppError('IO', 'Could not find a free backup file name.')
}

async function adoptOrphanFiles(known: Set<string>): Promise<void> {
  const folder = await backupFolder()

  let files: string[]
  try {
    files = fs.readdirSync(folder).filter((f) => f.endsWith('.db'))
  } catch {
    return
  }

  for (const fileName of files) {
    const filePath = path.join(folder, fileName)
    if (known.has(filePath) || !isSqliteFile(filePath)) continue

    try {
      await backupRepository.create({
        fileName,
        filePath,
        sizeBytes: fileSize(filePath),
        type: 'MANUAL',
        note: 'Found in the backup folder',
        createdAt: fs.statSync(filePath).mtime,
      })
    } catch (error) {
      log.warn(`Could not index backup file ${fileName}`, error)
    }
  }
}

export const backupService = {
  async list(): Promise<BackupRecord[]> {
    const existing = await backupRepository.list()
    await adoptOrphanFiles(new Set(existing.map((row) => row.filePath)))

    const rows = await backupRepository.list()
    return rows.map(mapBackup).filter((row) => fileExists(row.filePath))
  },

  async create(note = '', type: BackupRecord['type'] = 'MANUAL'): Promise<BackupRecord> {
    const folder = await backupFolder()
    const { fileName, filePath } = nextBackupPath(folder)

    await snapshotTo(filePath)

    const row = await backupRepository.create({
      fileName,
      filePath,
      sizeBytes: fileSize(filePath),
      type,
      note,
    })

    log.info('Backup created', filePath)
    return mapBackup(row)
  },

  async exportTo(backupId: number): Promise<SaveFileResult> {
    const record = await backupRepository.findById(backupId)
    if (!record) throw AppError.notFound('That backup entry no longer exists.')
    if (!fileExists(record.filePath)) throw new AppError('IO', 'The backup file is missing from disk.')

    const result = await dialog.showSaveDialog({
      title: 'Export backup',
      defaultPath: record.fileName,
      filters: [{ name: 'DonationBox Backup', extensions: ['db'] }],
    })

    if (result.canceled || !result.filePath) return { saved: false }

    copyFileSafe(record.filePath, result.filePath)
    shell.showItemInFolder(result.filePath)
    return { saved: true, filePath: result.filePath }
  },

  async importFrom(): Promise<RestoreResult> {
    const result = await dialog.showOpenDialog({
      title: 'Import backup',
      properties: ['openFile'],
      filters: [
        { name: 'DonationBox Backup', extensions: ['db', 'sqlite'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    })

    if (result.canceled || result.filePaths.length === 0) {
      throw new AppError('CANCELLED', 'Import cancelled.')
    }

    return this.restore(result.filePaths[0])
  },

  async restore(filePath: string): Promise<RestoreResult> {
    assertSqliteFile(filePath)

    try {
      stageRestore(filePath)
    } catch (error) {
      log.error('Could not stage the restore', error)
      throw new AppError('IO', 'Restore failed. Your data is unchanged.', String(error))
    }

    const safety = await this.create('Automatic snapshot taken before a restore', 'PRE_RESTORE')

    log.info('Restore staged from', filePath)
    return { restored: true, requiresRestart: true, safetyBackupPath: safety.filePath }
  },

  async remove(id: number): Promise<void> {
    const record = await backupRepository.findById(id)
    if (!record) throw AppError.notFound('That backup entry no longer exists.')

    removeIfExists(record.filePath)
    await backupRepository.remove(id)
  },

  async revealFolder(): Promise<void> {
    const folder = await backupFolder()
    await shell.openPath(folder)
  },

  relaunch(): void {
    app.relaunch()
    app.exit(0)
  },
}
