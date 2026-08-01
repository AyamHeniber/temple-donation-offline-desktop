/**
 * DonationBox - Temple Donation Receipt Management
 * Copyright (c) 2026 Ayam Heniber Meitei
 * Developed by Ayam Heniber Meitei <ayamheniber0@gmail.com>
 */

import type { Prisma } from '@prisma-client'
import { getPrisma } from '../db/client'

const ORDER: Prisma.SectionOrderByWithRelationInput[] = [{ sortOrder: 'asc' }, { name: 'asc' }]

export const sectionRepository = {
  async list(includeInactive: boolean) {
    return getPrisma().section.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: ORDER,
      include: { _count: { select: { items: true } } },
    })
  },

  async findById(id: number) {
    return getPrisma().section.findUnique({
      where: { id },
      include: { _count: { select: { items: true } } },
    })
  },

  async findByName(name: string) {
    const candidates = await getPrisma().section.findMany({
      where: { name: { contains: name } },
      take: 25,
    })

    const needle = name.trim().toLowerCase()
    return candidates.find((section) => section.name.trim().toLowerCase() === needle) ?? null
  },

  async findManyByIds(ids: number[]) {
    if (ids.length === 0) return []
    return getPrisma().section.findMany({ where: { id: { in: ids } } })
  },

  async create(data: Prisma.SectionCreateInput) {
    return getPrisma().section.create({
      data,
      include: { _count: { select: { items: true } } },
    })
  },

  async update(id: number, data: Prisma.SectionUpdateInput) {
    return getPrisma().section.update({
      where: { id },
      data,
      include: { _count: { select: { items: true } } },
    })
  },

  async remove(id: number) {
    await getPrisma().section.delete({ where: { id } })
  },

  async countUsage(id: number) {
    return getPrisma().receiptItem.count({ where: { sectionId: id } })
  },
}
