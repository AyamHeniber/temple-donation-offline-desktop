/**
 * DonationBox - Temple Donation Receipt Management
 * Copyright (c) 2026 Ayam Heniber Meitei
 * Developed by Ayam Heniber Meitei <ayamheniber0@gmail.com>
 */

import type { DashboardStats, PaymentMode } from '@/types/domain'
import { PAYMENT_MODES } from '@/types/domain'
import { roundMoney } from '@/utils/currency'
import { endOfMonthKey, lastNDayKeys, startOfMonthKey, toDateKey } from '@/utils/date'
import { getFinancialYear } from '@/utils/financial-year'
import { mapReceiptSummary, toPaymentMode } from '../db/mappers'
import { receiptRepository } from '../repositories/receipt.repository'
import { receiptService } from './receipt.service'

const RECENT_LIMIT = 8
const TREND_DAYS = 7
const TOP_SECTIONS = 5

export const dashboardService = {
  async stats(): Promise<DashboardStats> {
    const todayKey = toDateKey()
    const fy = getFinancialYear()
    const trendKeys = lastNDayKeys(TREND_DAYS)

    const [today, month, financialYear, totalReceipts, totalCollected, recent, modes, daily, sections, nextReceiptNumber] =
      await Promise.all([
        receiptRepository.sumInRange(todayKey, todayKey),
        receiptRepository.sumInRange(startOfMonthKey(), endOfMonthKey()),
        receiptRepository.sumInRange(fy.startDateKey, fy.endDateKey),
        receiptRepository.count(),
        receiptRepository.grandTotal(),
        receiptRepository.recent(RECENT_LIMIT),
        receiptRepository.totalsByPaymentMode(fy.startDateKey, fy.endDateKey),
        receiptRepository.totalsByDay(trendKeys[0], todayKey),
        receiptRepository.topSections(fy.startDateKey, fy.endDateKey, TOP_SECTIONS),
        receiptService.nextNumber(),
      ])

    const modeTotals = new Map(
      modes.map((row) => [
        toPaymentMode(row.paymentMode),
        { total: roundMoney(row._sum.totalAmount ?? 0), count: row._count._all },
      ]),
    )

    const dailyTotals = new Map(daily.map((row) => [row.receiptDateKey, roundMoney(row._sum.totalAmount ?? 0)]))

    return {
      todayTotal: roundMoney(today.total),
      todayCount: today.count,
      monthTotal: roundMoney(month.total),
      monthCount: month.count,
      financialYearTotal: roundMoney(financialYear.total),
      totalReceipts,
      totalCollected: roundMoney(totalCollected),
      financialYear: fy.label,
      nextReceiptNumber,
      recentReceipts: recent.map(mapReceiptSummary),
      paymentModeBreakdown: PAYMENT_MODES.map((mode: PaymentMode) => ({
        mode,
        total: modeTotals.get(mode)?.total ?? 0,
        count: modeTotals.get(mode)?.count ?? 0,
      })),
      topSections: sections.map((row) => ({
        sectionId: row.sectionId,
        sectionName: row.sectionName,
        total: roundMoney(row._sum.amount ?? 0),
      })),
      dailyTrend: trendKeys.map((dateKey) => ({ dateKey, total: dailyTotals.get(dateKey) ?? 0 })),
    }
  },
}
