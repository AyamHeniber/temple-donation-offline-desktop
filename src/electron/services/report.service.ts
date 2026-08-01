/**
 * DonationBox - Temple Donation Receipt Management
 * Copyright (c) 2026 Ayam Heniber Meitei
 * Developed by Ayam Heniber Meitei <ayamheniber0@gmail.com>
 */

import type {
  DonationReport,
  PaymentMode,
  ReportQuery,
  ReportRow,
  ReportSectionTotal,
  ReportTotals,
} from '@/types/domain'
import { roundMoney, sumMoney } from '@/utils/currency'
import { reportQuerySchema } from '@/lib/schemas'
import { toPaymentMode } from '../db/mappers'
import { receiptRepository } from '../repositories/receipt.repository'

const MODE_COLUMN: Record<PaymentMode, keyof Pick<ReportRow, 'cash' | 'upi' | 'neft' | 'cheque'>> = {
  CASH: 'cash',
  UPI: 'upi',
  NEFT: 'neft',
  CHEQUE: 'cheque',
}

export const reportService = {
  async donation(query: ReportQuery): Promise<DonationReport> {
    const parsed = reportQuerySchema.parse(query)

    const receipts = await receiptRepository.findInRange(parsed.fromDate, parsed.toDate, {
      paymentMode: parsed.paymentMode ?? null,
      sectionId: parsed.sectionId ?? null,
    })

    const rows: ReportRow[] = []
    const sectionTotals = new Map<number, ReportSectionTotal>()

    for (const receipt of receipts) {
      const mode = toPaymentMode(receipt.paymentMode)
      const total = roundMoney(receipt.totalAmount)

      const row: ReportRow = {
        id: receipt.id,
        receiptNumber: receipt.receiptNumber,
        receiptDate: receipt.receiptDate.toISOString(),
        donorName: receipt.donorName,
        donorAddress: receipt.donorAddress,
        paymentMode: mode,
        cash: 0,
        upi: 0,
        neft: 0,
        cheque: 0,
        total,
        sections: receipt.items.map((item) => item.sectionName).join(', '),
      }
      row[MODE_COLUMN[mode]] = total
      rows.push(row)

      for (const item of receipt.items) {
        const existing = sectionTotals.get(item.sectionId)
        if (existing) {
          existing.total = roundMoney(existing.total + item.amount)
          existing.count += 1
        } else {
          sectionTotals.set(item.sectionId, {
            sectionId: item.sectionId,
            sectionName: item.sectionName,
            total: roundMoney(item.amount),
            count: 1,
          })
        }
      }
    }

    const totals: ReportTotals = {
      cash: sumMoney(rows.map((r) => r.cash)),
      upi: sumMoney(rows.map((r) => r.upi)),
      neft: sumMoney(rows.map((r) => r.neft)),
      cheque: sumMoney(rows.map((r) => r.cheque)),
      overall: sumMoney(rows.map((r) => r.total)),
      receiptCount: rows.length,
    }

    return {
      fromDate: parsed.fromDate,
      toDate: parsed.toDate,
      generatedAt: new Date().toISOString(),
      rows,
      totals,
      sectionTotals: [...sectionTotals.values()].sort((a, b) => b.total - a.total),
    }
  },
}
