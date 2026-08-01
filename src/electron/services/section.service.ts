/**
 * DonationBox - Temple Donation Receipt Management
 * Copyright (c) 2026 Ayam Heniber Meitei
 * Developed by Ayam Heniber Meitei <ayamheniber0@gmail.com>
 */

import type { Section, SectionInput } from '@/types/domain'
import { AppError } from '@/utils/errors'
import { sectionSchema } from '@/lib/schemas'
import { mapSection } from '../db/mappers'
import { sectionRepository } from '../repositories/section.repository'

async function assertNameAvailable(name: string, excludeId?: number): Promise<void> {
  const existing = await sectionRepository.findByName(name)
  if (existing && existing.id !== excludeId) {
    throw AppError.conflict(`A section named "${existing.name}" already exists.`)
  }
}

export const sectionService = {
  async list(includeInactive = false): Promise<Section[]> {
    const rows = await sectionRepository.list(includeInactive)
    return rows.map(mapSection)
  },

  async create(input: SectionInput): Promise<Section> {
    const parsed = sectionSchema.parse(input)
    await assertNameAvailable(parsed.name)
    return mapSection(await sectionRepository.create(parsed))
  },

  async update(id: number, input: SectionInput): Promise<Section> {
    const parsed = sectionSchema.parse(input)
    const existing = await sectionRepository.findById(id)
    if (!existing) throw AppError.notFound('That section no longer exists.')

    await assertNameAvailable(parsed.name, id)
    return mapSection(await sectionRepository.update(id, parsed))
  },

  async remove(id: number): Promise<void> {
    const existing = await sectionRepository.findById(id)
    if (!existing) throw AppError.notFound('That section no longer exists.')

    const usage = await sectionRepository.countUsage(id)
    if (usage > 0) {
      throw AppError.conflict(
        `"${existing.name}" is used by ${usage} receipt ${usage === 1 ? 'entry' : 'entries'}. ` +
          'Mark it inactive instead of deleting it.',
      )
    }

    await sectionRepository.remove(id)
  },
}
