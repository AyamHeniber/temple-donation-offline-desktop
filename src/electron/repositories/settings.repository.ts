/**
 * DonationBox - Temple Donation Receipt Management
 * Copyright (c) 2026 Ayam Heniber Meitei
 * Developed by Ayam Heniber Meitei <ayamheniber0@gmail.com>
 */

import type { Prisma } from '@prisma-client'
import { getPrisma } from '../db/client'
import { AppError } from '@/utils/errors'

export const SETTINGS_ID = 1

export const settingsRepository = {
  async find() {
    return getPrisma().settings.findUnique({ where: { id: SETTINGS_ID } })
  },

  async findOrThrow() {
    const row = await this.find()
    if (!row) throw new AppError('DB', 'Settings row is missing. Restart the application to recreate it.')
    return row
  },

  async update(data: Prisma.SettingsUpdateInput) {
    return getPrisma().settings.update({ where: { id: SETTINGS_ID }, data })
  },
}
