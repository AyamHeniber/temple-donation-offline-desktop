/**
 * DonationBox - Temple Donation Receipt Management
 * Copyright (c) 2026 Ayam Heniber Meitei
 * Developed by Ayam Heniber Meitei <ayamheniber0@gmail.com>
 */

import type { Prisma, PrismaClient } from '@prisma/client'
import { getPrisma } from '../db/client'

type Client = PrismaClient | Prisma.TransactionClient

export const sequenceRepository = {
  async reserveNext(tx: Client, prefix: string, financialYear: string): Promise<number> {
    const key = { prefix_financialYear: { prefix, financialYear } }

    await tx.receiptSequence.upsert({
      where: key,
      create: { prefix, financialYear, lastNumber: 0 },
      update: {},
    })

    const row = await tx.receiptSequence.update({
      where: key,
      data: { lastNumber: { increment: 1 } },
    })

    return row.lastNumber
  },

  async peek(prefix: string, financialYear: string): Promise<number> {
    const row = await getPrisma().receiptSequence.findUnique({
      where: { prefix_financialYear: { prefix, financialYear } },
    })
    return row?.lastNumber ?? 0
  },

  async syncWithReceipts(prefix: string, financialYear: string): Promise<number> {
    const prisma = getPrisma()
    const highest = await prisma.receipt.aggregate({
      where: { financialYear },
      _max: { sequence: true },
    })
    const lastNumber = highest._max.sequence ?? 0

    await prisma.receiptSequence.upsert({
      where: { prefix_financialYear: { prefix, financialYear } },
      create: { prefix, financialYear, lastNumber },
      update: { lastNumber },
    })

    return lastNumber
  },
}
