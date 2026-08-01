/**
 * DonationBox - Temple Donation Receipt Management
 * Copyright (c) 2026 Ayam Heniber Meitei
 * Developed by Ayam Heniber Meitei <ayamheniber0@gmail.com>
 */

import ExcelJS from 'exceljs'
import type { ReportDocument } from '../report-document'
import { formatDate, formatDateKey, formatDateTime } from '@/utils/date'

const MONEY_FORMAT = '#,##,##0.00'
const BRAND = 'FFA63D0C'
const HEADER_FILL = 'FFFBF1E3'

export async function renderReportExcel(doc: ReportDocument): Promise<Uint8Array> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = doc.temple.name
  workbook.created = new Date()

  buildRegisterSheet(workbook, doc)
  buildSummarySheet(workbook, doc)

  const buffer = await workbook.xlsx.writeBuffer()
  return new Uint8Array(buffer as ArrayBuffer)
}

function buildRegisterSheet(workbook: ExcelJS.Workbook, doc: ReportDocument): void {
  const sheet = workbook.addWorksheet('Donation Report', {
    views: [{ state: 'frozen', ySplit: 6 }],
    pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  })

  const columns = [
    { header: 'S.No', key: 'index', width: 7 },
    { header: 'Receipt No.', key: 'receiptNumber', width: 22 },
    { header: 'Date', key: 'receiptDate', width: 14 },
    { header: 'Donor Name', key: 'donorName', width: 28 },
    { header: 'Address', key: 'donorAddress', width: 34 },
    { header: 'Cash', key: 'cash', width: 14 },
    { header: 'UPI', key: 'upi', width: 14 },
    { header: 'NEFT', key: 'neft', width: 14 },
    { header: 'Cheque', key: 'cheque', width: 14 },
    { header: 'Total', key: 'total', width: 16 },
  ]
  sheet.columns = columns.map(({ key, width }) => ({ key, width }))

  const lastColumn = columns.length

  const titleRow = sheet.addRow([doc.temple.name])
  sheet.mergeCells(titleRow.number, 1, titleRow.number, lastColumn)
  titleRow.getCell(1).font = { size: 15, bold: true, color: { argb: BRAND } }
  titleRow.getCell(1).alignment = { horizontal: 'center' }

  const subtitleRow = sheet.addRow([doc.title])
  sheet.mergeCells(subtitleRow.number, 1, subtitleRow.number, lastColumn)
  subtitleRow.getCell(1).font = { size: 12, bold: true }
  subtitleRow.getCell(1).alignment = { horizontal: 'center' }

  const periodRow = sheet.addRow([`Period: ${doc.rangeText}`])
  sheet.mergeCells(periodRow.number, 1, periodRow.number, lastColumn)
  periodRow.getCell(1).alignment = { horizontal: 'center' }

  const generatedRow = sheet.addRow([doc.generatedText])
  sheet.mergeCells(generatedRow.number, 1, generatedRow.number, lastColumn)
  generatedRow.getCell(1).alignment = { horizontal: 'center' }
  generatedRow.getCell(1).font = { size: 9, color: { argb: 'FF6B625C' } }

  sheet.addRow([])

  const headerRow = sheet.addRow(columns.map((c) => c.header))
  headerRow.eachCell((cell) => {
    cell.font = { bold: true }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL } }
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    cell.border = thinBorder()
  })
  headerRow.height = 20

  doc.report.rows.forEach((row, index) => {
    const dataRow = sheet.addRow({
      index: index + 1,
      receiptNumber: row.receiptNumber,
      receiptDate: formatDate(row.receiptDate),
      donorName: row.donorName,
      donorAddress: row.donorAddress,
      cash: row.cash || null,
      upi: row.upi || null,
      neft: row.neft || null,
      cheque: row.cheque || null,
      total: row.total,
    })

    dataRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.border = thinBorder()
      if (colNumber >= 6) {
        cell.numFmt = MONEY_FORMAT
        cell.alignment = { horizontal: 'right' }
      } else if (colNumber === 1) {
        cell.alignment = { horizontal: 'center' }
      } else {
        cell.alignment = { vertical: 'top', wrapText: colNumber === 5 }
      }
    })
  })

  const { totals } = doc.report
  const totalsRow = sheet.addRow({
    index: '',
    receiptNumber: '',
    receiptDate: '',
    donorName: '',
    donorAddress: `GRAND TOTAL (${totals.receiptCount} receipts)`,
    cash: totals.cash,
    upi: totals.upi,
    neft: totals.neft,
    cheque: totals.cheque,
    total: totals.overall,
  })

  totalsRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    cell.font = { bold: true }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL } }
    cell.border = thinBorder()
    if (colNumber >= 6) {
      cell.numFmt = MONEY_FORMAT
      cell.alignment = { horizontal: 'right' }
    }
    if (colNumber === 5) cell.alignment = { horizontal: 'right' }
  })

  sheet.autoFilter = {
    from: { row: headerRow.number, column: 1 },
    to: { row: headerRow.number, column: lastColumn },
  }
}

function buildSummarySheet(workbook: ExcelJS.Workbook, doc: ReportDocument): void {
  const sheet = workbook.addWorksheet('Summary')
  sheet.columns = [
    { key: 'label', width: 34 },
    { key: 'count', width: 14 },
    { key: 'amount', width: 18 },
  ]

  const title = sheet.addRow(['Section-wise Summary'])
  title.getCell(1).font = { size: 13, bold: true, color: { argb: BRAND } }
  sheet.addRow([`Period: ${formatDateKey(doc.report.fromDate)} to ${formatDateKey(doc.report.toDate)}`])
  sheet.addRow([`Generated: ${formatDateTime(doc.report.generatedAt)}`])
  sheet.addRow([])

  const header = sheet.addRow(['Section', 'Entries', 'Amount'])
  header.eachCell((cell) => {
    cell.font = { bold: true }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL } }
    cell.border = thinBorder()
  })

  for (const section of doc.report.sectionTotals) {
    const row = sheet.addRow([section.sectionName, section.count, section.total])
    row.getCell(3).numFmt = MONEY_FORMAT
    row.eachCell((cell) => (cell.border = thinBorder()))
  }

  sheet.addRow([])

  const modeHeader = sheet.addRow(['Payment Mode', '', 'Amount'])
  modeHeader.eachCell((cell) => {
    cell.font = { bold: true }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL } }
    cell.border = thinBorder()
  })

  const { totals } = doc.report
  const modes: Array<[string, number]> = [
    ['Cash', totals.cash],
    ['UPI', totals.upi],
    ['NEFT', totals.neft],
    ['Cheque', totals.cheque],
    ['Overall Donation', totals.overall],
  ]

  modes.forEach(([label, value], index) => {
    const row = sheet.addRow([label, '', value])
    row.getCell(3).numFmt = MONEY_FORMAT
    if (index === modes.length - 1) row.font = { bold: true }
    row.eachCell((cell) => (cell.border = thinBorder()))
  })
}

function thinBorder(): Partial<ExcelJS.Borders> {
  const style: ExcelJS.Border = { style: 'thin', color: { argb: 'FFD9D2CB' } }
  return { top: style, left: style, bottom: style, right: style }
}
