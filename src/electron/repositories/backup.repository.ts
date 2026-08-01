/**
 * DonationBox - Temple Donation Receipt Management
 * Copyright (c) 2026 Ayam Heniber Meitei
 * Developed by Ayam Heniber Meitei <ayamheniber0@gmail.com>
 */

import type { Prisma } from '@prisma/client'
import { getPrisma } from '../db/client'

export const backupRepository = {
  async list(limit = 100) {
    return getPrisma().backup.findMany({ orderBy: { createdAt: 'desc' }, take: limit })
  },

  async findById(id: number) {
    return getPrisma().backup.findUnique({ where: { id } })
  },

  async create(data: Prisma.BackupCreateInput) {
    return getPrisma().backup.create({ data })
  },

  async remove(id: number) {
    await getPrisma().backup.delete({ where: { id } })
  },
}
