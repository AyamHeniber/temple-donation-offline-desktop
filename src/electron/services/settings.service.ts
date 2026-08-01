/**
 * DonationBox - Temple Donation Receipt Management
 * Copyright (c) 2026 Ayam Heniber Meitei
 * Developed by Ayam Heniber Meitei <ayamheniber0@gmail.com>
 */

import { dialog } from 'electron'
import path from 'node:path'
import type { Settings, SettingsInput } from '@/types/domain'
import { AppError } from '@/utils/errors'
import { normalisePrefix } from '@/utils/receipt-number'
import { settingsSchema } from '@/lib/schemas'
import { assetsDir, defaultBackupsDir } from '../core/paths'
import { copyFileSafe, imageMimeFor, readImageAsDataUrl, removeIfExists } from '../core/files'
import { mapSettings } from '../db/mappers'
import { settingsRepository } from '../repositories/settings.repository'

const LOGO_BASENAME = 'temple-logo'

function logoPath(fileName: string): string {
  return path.join(assetsDir(), fileName)
}

async function toDomain(row: Awaited<ReturnType<typeof settingsRepository.findOrThrow>>): Promise<Settings> {
  const dataUrl = row.logo ? readImageAsDataUrl(logoPath(row.logo)) : null
  return mapSettings(row, dataUrl)
}

export const settingsService = {
  async get(): Promise<Settings> {
    return toDomain(await settingsRepository.findOrThrow())
  },

  async update(input: SettingsInput): Promise<Settings> {
    const parsed = settingsSchema.parse(input)

    const row = await settingsRepository.update({
      ...parsed,
      receiptPrefix: normalisePrefix(parsed.receiptPrefix),
      backupFolder: parsed.backupFolder || defaultBackupsDir(),
    })

    return toDomain(row)
  },

  async uploadLogo(): Promise<Settings> {
    const result = await dialog.showOpenDialog({
      title: 'Select temple logo',
      properties: ['openFile'],
      filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp'] }],
    })

    if (result.canceled || result.filePaths.length === 0) {
      throw new AppError('CANCELLED', 'Logo selection cancelled.')
    }

    const source = result.filePaths[0]
    if (!imageMimeFor(source)) {
      throw AppError.validation('Choose a PNG, JPG or WEBP image.')
    }

    const fileName = `${LOGO_BASENAME}-${Date.now()}${path.extname(source).toLowerCase()}`
    copyFileSafe(source, logoPath(fileName))

    const previous = (await settingsRepository.findOrThrow()).logo
    const row = await settingsRepository.update({ logo: fileName })
    if (previous && previous !== fileName) removeIfExists(logoPath(previous))

    return toDomain(row)
  },

  async clearLogo(): Promise<Settings> {
    const current = await settingsRepository.findOrThrow()
    if (current.logo) removeIfExists(logoPath(current.logo))
    return toDomain(await settingsRepository.update({ logo: null }))
  },

  async chooseBackupFolder(): Promise<string | null> {
    const result = await dialog.showOpenDialog({
      title: 'Select backup folder',
      properties: ['openDirectory', 'createDirectory'],
    })

    if (result.canceled || result.filePaths.length === 0) return null

    const folder = result.filePaths[0]
    await settingsRepository.update({ backupFolder: folder })
    return folder
  },

  async logoFilePath(): Promise<string | null> {
    const row = await settingsRepository.findOrThrow()
    return row.logo ? logoPath(row.logo) : null
  },
}
