/**
 * DonationBox - Temple Donation Receipt Management
 * Copyright (c) 2026 Ayam Heniber Meitei
 * Developed by Ayam Heniber Meitei <ayamheniber0@gmail.com>
 */

import type { ReportDocument } from '../report-document'
import { reportCellText } from '../report-document'
import { toCsv, type CsvValue } from '@/utils/csv'
import { roundMoney } from '@/utils/currency'

export function renderReportCsv(doc: ReportDocument): string {
  const headers = doc.columns.map((column) => column.header)

  const rows: CsvValue[][] = doc.report.rows.map((row, index) =>
    doc.columns.map((column) => {
      const raw = reportCellText(row, column, index)
      return column.numeric ? (raw === '-' ? 0 : roundMoney(Number(raw))) : raw
    }),
  )

  const { totals } = doc.report
  rows.push([
    '',
    '',
    '',
    '',
    `GRAND TOTAL (${totals.receiptCount} receipts)`,
    totals.cash,
    totals.upi,
    totals.neft,
    totals.cheque,
    totals.overall,
  ])

  return toCsv(headers, rows)
}
