/**
 * DonationBox - Temple Donation Receipt Management
 * Copyright (c) 2026 Ayam Heniber Meitei
 * Developed by Ayam Heniber Meitei <ayamheniber0@gmail.com>
 */

import type {
  Paginated,
  Receipt,
  ReceiptInput,
  ReceiptListQuery,
  ReceiptSummary,
} from '@/types/domain'
import { AppError } from '@/utils/errors'
import { amountToWords } from '@/utils/amount-in-words'
import { roundMoney, sumMoney } from '@/utils/currency'
import { ist, toDateKey } from '@/utils/date'
import { getFinancialYear } from '@/utils/financial-year'
import { formatReceiptNumber, normalisePrefix } from '@/utils/receipt-number'
import { receiptListQuerySchema, receiptSchemaWithReference } from '@/lib/schemas'
import { getPrisma } from '../db/client'
import { mapReceipt, mapReceiptSummary } from '../db/mappers'
import { receiptRepository } from '../repositories/receipt.repository'
import { sectionRepository } from '../repositories/section.repository'
import { sequenceRepository } from '../repositories/sequence.repository'
import { settingsRepository } from '../repositories/settings.repository'

interface PreparedItem {
  sectionId: number
  sectionName: string
  amount: number
  remarks: string
}

interface PreparedReceipt {
  items: PreparedItem[]
  totalAmount: number
  amountInWords: string
  receiptDate: Date
  receiptDateKey: string
}

async function prepare(input: ReceiptInput): Promise<PreparedReceipt & { parsed: ReceiptInput }> {
  const parsed = receiptSchemaWithReference.parse(input) as ReceiptInput

  const sectionIds = [...new Set(parsed.items.map((item) => item.sectionId))]
  const sections = await sectionRepository.findManyByIds(sectionIds)
  const byId = new Map(sections.map((section) => [section.id, section]))

  const missing = sectionIds.filter((id) => !byId.has(id))
  if (missing.length > 0) {
    throw AppError.validation('One of the selected sections no longer exists. Refresh and try again.')
  }

  const items: PreparedItem[] = parsed.items.map((item) => ({
    sectionId: item.sectionId,
    sectionName: byId.get(item.sectionId)!.name,
    amount: roundMoney(item.amount),
    remarks: item.remarks ?? '',
  }))

  const totalAmount = sumMoney(items.map((item) => item.amount))
  if (totalAmount <= 0) throw AppError.validation('Total donation amount must be greater than 0.')

  const receiptDate = parsed.receiptDate ? ist(parsed.receiptDate).toDate() : ist().toDate()

  return {
    parsed,
    items,
    totalAmount,
    amountInWords: amountToWords(totalAmount),
    receiptDate,
    receiptDateKey: toDateKey(receiptDate),
  }
}

export const receiptService = {
  async list(query: ReceiptListQuery): Promise<Paginated<ReceiptSummary>> {
    const parsed = receiptListQuerySchema.parse(query) as ReceiptListQuery
    const { rows, total } = await receiptRepository.list(parsed)

    return {
      rows: rows.map(mapReceiptSummary),
      total,
      page: parsed.page,
      pageSize: parsed.pageSize,
      pageCount: Math.max(1, Math.ceil(total / parsed.pageSize)),
    }
  },

  async get(id: number): Promise<Receipt> {
    const row = await receiptRepository.findById(id)
    if (!row) throw AppError.notFound('That receipt no longer exists.')
    return mapReceipt(row)
  },

  async nextNumber(): Promise<string> {
    const settings = await settingsRepository.findOrThrow()
    const prefix = normalisePrefix(settings.receiptPrefix)
    const fy = getFinancialYear()
    const last = await sequenceRepository.peek(prefix, fy.label)

    return formatReceiptNumber({ prefix, financialYear: fy.label, sequence: last + 1 })
  },

  async create(input: ReceiptInput): Promise<Receipt> {
    const prepared = await prepare(input)
    const settings = await settingsRepository.findOrThrow()
    const prefix = normalisePrefix(settings.receiptPrefix)

    const fy = getFinancialYear(prepared.receiptDate)

    const row = await getPrisma().$transaction(async (tx) => {
      const sequence = await sequenceRepository.reserveNext(tx, prefix, fy.label)
      const receiptNumber = formatReceiptNumber({ prefix, financialYear: fy.label, sequence })

      return receiptRepository.create(tx, {
        receiptNumber,
        financialYear: fy.label,
        sequence,
        donorName: prepared.parsed.donorName,
        donorAddress: prepared.parsed.donorAddress ?? '',
        donorPhone: prepared.parsed.donorPhone ?? '',
        paymentMode: prepared.parsed.paymentMode,
        referenceNo: prepared.parsed.referenceNo ?? '',
        notes: prepared.parsed.notes ?? '',
        totalAmount: prepared.totalAmount,
        amountInWords: prepared.amountInWords,
        receiptDate: prepared.receiptDate,
        receiptDateKey: prepared.receiptDateKey,
        items: { create: prepared.items },
      })
    })

    return mapReceipt(row)
  },

  async update(id: number, input: ReceiptInput): Promise<Receipt> {
    const existing = await receiptRepository.findById(id)
    if (!existing) throw AppError.notFound('That receipt no longer exists.')

    const prepared = await prepare(input)

    const row = await getPrisma().$transaction(async (tx) =>
      receiptRepository.update(tx, id, {
        donorName: prepared.parsed.donorName,
        donorAddress: prepared.parsed.donorAddress ?? '',
        donorPhone: prepared.parsed.donorPhone ?? '',
        paymentMode: prepared.parsed.paymentMode,
        referenceNo: prepared.parsed.referenceNo ?? '',
        notes: prepared.parsed.notes ?? '',
        totalAmount: prepared.totalAmount,
        amountInWords: prepared.amountInWords,
        receiptDate: prepared.receiptDate,
        receiptDateKey: prepared.receiptDateKey,
        items: { create: prepared.items },
      }),
    )

    return mapReceipt(row)
  },

  async remove(id: number): Promise<void> {
    const existing = await receiptRepository.findById(id)
    if (!existing) throw AppError.notFound('That receipt no longer exists.')
    await receiptRepository.remove(id)
  },
}
