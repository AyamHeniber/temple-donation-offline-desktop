/**
 * DonationBox - Temple Donation Receipt Management
 * Copyright (c) 2026 Ayam Heniber Meitei
 * Developed by Ayam Heniber Meitei <ayamheniber0@gmail.com>
 */

import type { Prisma, PrismaClient } from '@prisma-client'
import type { ReceiptListQuery } from '@/types/domain'
import { getPrisma } from '../db/client'

type Client = PrismaClient | Prisma.TransactionClient

const SORT_COLUMN: Record<ReceiptListQuery['sortBy'], keyof Prisma.ReceiptOrderByWithRelationInput> = {
  receiptNumber: 'receiptNumber',
  receiptDate: 'receiptDate',
  donorName: 'donorName',
  totalAmount: 'totalAmount',
}

export function buildReceiptWhere(query: Partial<ReceiptListQuery>): Prisma.ReceiptWhereInput {
  const where: Prisma.ReceiptWhereInput = {}
  const and: Prisma.ReceiptWhereInput[] = []

  if (query.search?.trim()) {
    const term = query.search.trim()
    and.push({
      OR: [{ receiptNumber: { contains: term } }, { donorName: { contains: term } }],
    })
  }

  if (query.fromDate || query.toDate) {
    and.push({
      receiptDateKey: {
        ...(query.fromDate ? { gte: query.fromDate } : {}),
        ...(query.toDate ? { lte: query.toDate } : {}),
      },
    })
  }

  if (query.paymentMode) and.push({ paymentMode: query.paymentMode })
  if (query.sectionId) and.push({ items: { some: { sectionId: query.sectionId } } })

  if (and.length) where.AND = and
  return where
}

export const receiptRepository = {
  async list(query: ReceiptListQuery) {
    const prisma = getPrisma()
    const where = buildReceiptWhere(query)
    const skip = (query.page - 1) * query.pageSize

    const orderBy: Prisma.ReceiptOrderByWithRelationInput[] = [
      { [SORT_COLUMN[query.sortBy]]: query.sortDir },
      { id: query.sortDir },
    ]

    const [rows, total] = await prisma.$transaction([
      prisma.receipt.findMany({
        where,
        orderBy,
        skip,
        take: query.pageSize,
        include: { _count: { select: { items: true } } },
      }),
      prisma.receipt.count({ where }),
    ])

    return { rows, total }
  },

  async findById(id: number) {
    return getPrisma().receipt.findUnique({
      where: { id },
      include: { items: { orderBy: { id: 'asc' } } },
    })
  },

  async findByNumber(receiptNumber: string) {
    return getPrisma().receipt.findUnique({
      where: { receiptNumber },
      include: { items: { orderBy: { id: 'asc' } } },
    })
  },

  async recent(limit: number) {
    return getPrisma().receipt.findMany({
      orderBy: [{ receiptDate: 'desc' }, { id: 'desc' }],
      take: limit,
      include: { _count: { select: { items: true } } },
    })
  },

  async findInRange(fromDateKey: string, toDateKey: string, extra: Partial<ReceiptListQuery> = {}) {
    return getPrisma().receipt.findMany({
      where: buildReceiptWhere({ ...extra, fromDate: fromDateKey, toDate: toDateKey }),
      orderBy: [{ receiptDate: 'asc' }, { id: 'asc' }],
      include: { items: { orderBy: { id: 'asc' } } },
    })
  },

  async create(tx: Client, data: Prisma.ReceiptCreateInput) {
    return tx.receipt.create({ data, include: { items: { orderBy: { id: 'asc' } } } })
  },

  async update(tx: Client, id: number, data: Prisma.ReceiptUpdateInput) {
    await tx.receiptItem.deleteMany({ where: { receiptId: id } })
    return tx.receipt.update({ where: { id }, data, include: { items: { orderBy: { id: 'asc' } } } })
  },

  async remove(id: number) {
    await getPrisma().receipt.delete({ where: { id } })
  },

  async count() {
    return getPrisma().receipt.count()
  },

  async sumInRange(fromDateKey: string, toDateKey: string) {
    const result = await getPrisma().receipt.aggregate({
      where: { receiptDateKey: { gte: fromDateKey, lte: toDateKey } },
      _sum: { totalAmount: true },
      _count: { _all: true },
    })
    return { total: result._sum.totalAmount ?? 0, count: result._count._all }
  },

  async grandTotal() {
    const result = await getPrisma().receipt.aggregate({ _sum: { totalAmount: true } })
    return result._sum.totalAmount ?? 0
  },

  async totalsByPaymentMode(fromDateKey?: string, toDateKey?: string) {
    return getPrisma().receipt.groupBy({
      by: ['paymentMode'],
      where:
        fromDateKey && toDateKey ? { receiptDateKey: { gte: fromDateKey, lte: toDateKey } } : undefined,
      _sum: { totalAmount: true },
      _count: { _all: true },
    })
  },

  async totalsByDay(fromDateKey: string, toDateKey: string) {
    return getPrisma().receipt.groupBy({
      by: ['receiptDateKey'],
      where: { receiptDateKey: { gte: fromDateKey, lte: toDateKey } },
      _sum: { totalAmount: true },
      orderBy: { receiptDateKey: 'asc' },
    })
  },

  async topSections(fromDateKey: string, toDateKey: string, limit: number) {
    const grouped = await getPrisma().receiptItem.groupBy({
      by: ['sectionId', 'sectionName'],
      where: { receipt: { receiptDateKey: { gte: fromDateKey, lte: toDateKey } } },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
      take: limit,
    })
    return grouped
  },
}
