/**
 * DonationBox - Temple Donation Receipt Management
 * Copyright (c) 2026 Ayam Heniber Meitei
 * Developed by Ayam Heniber Meitei <ayamheniber0@gmail.com>
 */

import { dialog, shell } from 'electron'
import path from 'node:path'
import type { PrinterInfo, ReportQuery } from '@/types/domain'
import type { PdfPayload, PrintResult, SaveFileResult } from '@/types/ipc'
import { AppError } from '@/utils/errors'
import { fileStamp } from '@/utils/date'
import { writeFileBytes } from '../core/files'
import { createLogger } from '../core/logger'
import { buildReceiptDocument, receiptFileName } from '../documents/receipt-document'
import { buildReportDocument, reportFileBaseName } from '../documents/report-document'
import { renderReceiptPdf } from '../documents/pdf/receipt-pdf'
import { renderReportPdf } from '../documents/pdf/report-pdf'
import { renderReceiptHtml } from '../documents/html/receipt-html'
import { renderReportHtml } from '../documents/html/report-html'
import { renderReportExcel } from '../documents/exports/excel'
import { renderReportCsv } from '../documents/exports/csv-export'
import { printService } from './print.service'
import { receiptService } from './receipt.service'
import { reportService } from './report.service'
import { settingsService } from './settings.service'

const log = createLogger('documents')

type Filter = { name: string; extensions: string[] }

const FILTERS = {
  pdf: { name: 'PDF Document', extensions: ['pdf'] } satisfies Filter,
  xlsx: { name: 'Excel Workbook', extensions: ['xlsx'] } satisfies Filter,
  csv: { name: 'CSV File', extensions: ['csv'] } satisfies Filter,
}

async function saveWithDialog(
  defaultName: string,
  filter: Filter,
  data: Uint8Array | string,
  title: string,
): Promise<SaveFileResult> {
  const result = await dialog.showSaveDialog({
    title,
    defaultPath: defaultName,
    filters: [filter],
  })

  if (result.canceled || !result.filePath) return { saved: false }

  const filePath = ensureExtension(result.filePath, filter.extensions[0])
  writeFileBytes(filePath, data)
  log.info('Saved document', filePath)

  shell.showItemInFolder(filePath)
  return { saved: true, filePath }
}

function ensureExtension(filePath: string, extension: string): string {
  return path.extname(filePath).toLowerCase() === `.${extension}` ? filePath : `${filePath}.${extension}`
}

async function receiptDocumentFor(receiptId: number) {
  const [receipt, settings] = await Promise.all([receiptService.get(receiptId), settingsService.get()])
  return { doc: buildReceiptDocument(receipt, settings), receipt, settings }
}

async function reportDocumentFor(query: ReportQuery) {
  const [report, settings] = await Promise.all([reportService.donation(query), settingsService.get()])
  return { doc: buildReportDocument(report, settings), report, settings }
}

export const documentService = {
  async receiptPdf(receiptId: number): Promise<PdfPayload> {
    const { doc, receipt } = await receiptDocumentFor(receiptId)
    return { bytes: await renderReceiptPdf(doc), fileName: receiptFileName(receipt) }
  },

  async saveReceiptPdf(receiptId: number): Promise<SaveFileResult> {
    const { bytes, fileName } = await this.receiptPdf(receiptId)
    return saveWithDialog(fileName, FILTERS.pdf, bytes, 'Save receipt PDF')
  },

  async printReceipt(receiptId: number): Promise<PrintResult> {
    const { doc, receipt, settings } = await receiptDocumentFor(receiptId)
    return printService.print({
      html: renderReceiptHtml(doc),
      jobName: receipt.receiptNumber.replace(/\//g, '-'),
      settings,
    })
  },

  async reportPdf(query: ReportQuery): Promise<PdfPayload> {
    const { doc, report } = await reportDocumentFor(query)
    return { bytes: await renderReportPdf(doc), fileName: `${reportFileBaseName(report)}.pdf` }
  },

  async saveReportPdf(query: ReportQuery): Promise<SaveFileResult> {
    const { bytes, fileName } = await this.reportPdf(query)
    return saveWithDialog(fileName, FILTERS.pdf, bytes, 'Save donation report (PDF)')
  },

  async saveReportExcel(query: ReportQuery): Promise<SaveFileResult> {
    const { doc, report } = await reportDocumentFor(query)
    const bytes = await renderReportExcel(doc)
    return saveWithDialog(
      `${reportFileBaseName(report)}.xlsx`,
      FILTERS.xlsx,
      bytes,
      'Save donation report (Excel)',
    )
  },

  async saveReportCsv(query: ReportQuery): Promise<SaveFileResult> {
    const { doc, report } = await reportDocumentFor(query)
    return saveWithDialog(
      `${reportFileBaseName(report)}.csv`,
      FILTERS.csv,
      renderReportCsv(doc),
      'Save donation report (CSV)',
    )
  },

  async printReport(query: ReportQuery): Promise<PrintResult> {
    const { doc, settings } = await reportDocumentFor(query)
    if (doc.report.rows.length === 0) {
      throw AppError.validation('There is nothing to print for the selected period.')
    }

    return printService.print({
      html: renderReportHtml(doc),
      jobName: `report-${fileStamp()}`,
      landscape: true,
      settings,
    })
  },

  async printers(): Promise<PrinterInfo[]> {
    return printService.listPrinters()
  },
}
