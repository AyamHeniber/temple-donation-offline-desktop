/**
 * DonationBox - Temple Donation Receipt Management
 * Copyright (c) 2026 Ayam Heniber Meitei
 * Developed by Ayam Heniber Meitei <ayamheniber0@gmail.com>
 */

import type { DonationReport, ReportRow, Settings } from '@/types/domain'
import { formatDate, formatDateKey, formatDateTime } from '@/utils/date'

export interface ReportColumn {
  key: keyof ReportRow | 'index'
  header: string
  align: 'left' | 'right' | 'center'
  weight: number
  numeric?: boolean
}

export const REPORT_COLUMNS: ReportColumn[] = [
  { key: 'index', header: 'S.No', align: 'center', weight: 0.5 },
  { key: 'receiptNumber', header: 'Receipt No.', align: 'left', weight: 1.9 },
  { key: 'receiptDate', header: 'Date', align: 'left', weight: 1.1 },
  { key: 'donorName', header: 'Donor Name', align: 'left', weight: 2.2 },
  { key: 'donorAddress', header: 'Address', align: 'left', weight: 2.6 },
  { key: 'cash', header: 'Cash', align: 'right', weight: 1.15, numeric: true },
  { key: 'upi', header: 'UPI', align: 'right', weight: 1.15, numeric: true },
  { key: 'neft', header: 'NEFT', align: 'right', weight: 1.15, numeric: true },
  { key: 'cheque', header: 'Cheque', align: 'right', weight: 1.15, numeric: true },
  { key: 'total', header: 'Total', align: 'right', weight: 1.3, numeric: true },
]

export interface ReportDocument {
  temple: {
    name: string
    address: string
    phone: string
    logoDataUrl: string | null
  }
  title: string
  rangeText: string
  generatedText: string
  columns: ReportColumn[]
  report: DonationReport
  footerText: string
}

export function buildReportDocument(report: DonationReport, settings: Settings): ReportDocument {
  return {
    temple: {
      name: settings.templeName || 'Temple',
      address: settings.address,
      phone: settings.phone,
      logoDataUrl: settings.logoDataUrl,
    },
    title: 'DONATION REPORT',
    rangeText: `${formatDateKey(report.fromDate)}  to  ${formatDateKey(report.toDate)}`,
    generatedText: `Generated on ${formatDateTime(report.generatedAt)}`,
    columns: REPORT_COLUMNS,
    report,
    footerText: settings.footer,
  }
}

export function reportCellText(row: ReportRow, column: ReportColumn, index: number): string {
  if (column.key === 'index') return String(index + 1)
  if (column.key === 'receiptDate') return formatDate(row.receiptDate)

  const value = row[column.key as keyof ReportRow]
  if (typeof value === 'number') return column.numeric && value === 0 ? '-' : String(value)
  return String(value ?? '')
}

export function reportFileBaseName(report: DonationReport): string {
  return `donation-report-${report.fromDate}_to_${report.toDate}`
}
