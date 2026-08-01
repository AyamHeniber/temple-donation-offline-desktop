/**
 * DonationBox - Temple Donation Receipt Management
 * Copyright (c) 2026 Ayam Heniber Meitei
 * Developed by Ayam Heniber Meitei <ayamheniber0@gmail.com>
 */

import type { ReportDocument } from '../report-document'
import { reportCellText } from '../report-document'
import { formatIndianNumber } from '@/utils/currency'
import { resolveFonts } from './fonts'
import { A4_LANDSCAPE, COLORS, Painter } from './painter'

const SIZE = { title: 15, temple: 12, meta: 9, table: 8.5, totals: 9.5 } as const
const LINE_HEIGHT = 11
const ROW_PADDING = 6

interface SizedColumn {
  header: string
  width: number
  align: 'left' | 'right' | 'center'
  numeric: boolean
  key: string
}

function sizeColumns(doc: ReportDocument, contentWidth: number): SizedColumn[] {
  const totalWeight = doc.columns.reduce((sum, column) => sum + column.weight, 0)
  return doc.columns.map((column) => ({
    header: column.header,
    width: (column.weight / totalWeight) * contentWidth,
    align: column.align,
    numeric: Boolean(column.numeric),
    key: String(column.key),
  }))
}

export async function renderReportPdf(doc: ReportDocument): Promise<Uint8Array> {
  const p = await Painter.create(resolveFonts, A4_LANDSCAPE, 34)
  const columns = sizeColumns(doc, p.contentWidth)

  drawHeader(p, doc)
  drawTableHeader(p, columns)

  doc.report.rows.forEach((row, index) => {
    const cells = doc.columns.map((column, columnIndex) => {
      const raw = reportCellText(row, column, index)
      const text = column.numeric && raw !== '-' ? formatIndianNumber(Number(raw)) : raw
      return p.wrap(text, SIZE.table, columns[columnIndex].width - 8)
    })

    const lineCount = Math.max(1, ...cells.map((lines) => lines.length))
    const rowHeight = lineCount * LINE_HEIGHT + ROW_PADDING

    if (p.ensureSpace(rowHeight + 30)) drawTableHeader(p, columns)

    p.y -= rowHeight
    if (index % 2 === 1) p.rect(p.left, p.y, p.contentWidth, rowHeight, COLORS.zebra)
    p.rect(p.left, p.y, p.contentWidth, rowHeight, undefined, COLORS.line)

    let x = p.left
    cells.forEach((lines, columnIndex) => {
      const column = columns[columnIndex]
      let cursor = p.y + rowHeight - ROW_PADDING / 2 - 8
      for (const line of lines) {
        p.drawAt(line, x + 4, cursor, {
          size: SIZE.table,
          align: column.align,
          maxWidth: column.width - 8,
        })
        cursor -= LINE_HEIGHT
      }
      x += column.width
    })
  })

  drawGrandTotals(p, doc, columns)
  drawSectionSummary(p, doc)
  drawFooter(p, doc)

  return p.toBytes()
}

function drawHeader(p: Painter, doc: ReportDocument): void {
  p.y -= 14
  p.drawAt(doc.temple.name, p.left, p.y, {
    size: SIZE.temple,
    bold: true,
    align: 'center',
    maxWidth: p.contentWidth,
    color: COLORS.primary,
  })

  p.y -= 18
  p.drawAt(doc.title, p.left, p.y, {
    size: SIZE.title,
    bold: true,
    align: 'center',
    maxWidth: p.contentWidth,
  })

  p.y -= 15
  p.drawAt(`Period: ${doc.rangeText}`, p.left, p.y, { size: SIZE.meta, color: COLORS.muted })
  p.drawAt(doc.generatedText, p.left, p.y, {
    size: SIZE.meta,
    align: 'right',
    maxWidth: p.contentWidth,
    color: COLORS.muted,
  })

  p.hr({ thickness: 1, color: COLORS.primary, gap: 8 })
}

function drawTableHeader(p: Painter, columns: SizedColumn[]): void {
  const height = 19
  p.y -= height
  p.rect(p.left, p.y, p.contentWidth, height, COLORS.headerFill, COLORS.line)

  let x = p.left
  for (const column of columns) {
    p.drawAt(column.header, x + 4, p.y + 6, {
      size: SIZE.table,
      bold: true,
      align: column.align,
      maxWidth: column.width - 8,
    })
    x += column.width
  }
}

function drawGrandTotals(p: Painter, doc: ReportDocument, columns: SizedColumn[]): void {
  const { totals } = doc.report
  const height = 22

  p.ensureSpace(height + 24)
  p.y -= height
  p.rect(p.left, p.y, p.contentWidth, height, COLORS.headerFill, COLORS.line)

  const values: Record<string, number> = {
    cash: totals.cash,
    upi: totals.upi,
    neft: totals.neft,
    cheque: totals.cheque,
    total: totals.overall,
  }

  let x = p.left
  let labelDrawn = false

  for (const column of columns) {
    if (column.key in values) {
      p.drawAt(formatIndianNumber(values[column.key]), x + 4, p.y + 7, {
        size: SIZE.totals,
        bold: true,
        align: 'right',
        maxWidth: column.width - 8,
      })
    } else if (!labelDrawn && column.key === 'donorAddress') {
      p.drawAt(`GRAND TOTAL  (${totals.receiptCount} receipts)`, x + 4, p.y + 7, {
        size: SIZE.totals,
        bold: true,
        align: 'right',
        maxWidth: column.width - 8,
      })
      labelDrawn = true
    }
    x += column.width
  }

  p.y -= 18
}

function drawSectionSummary(p: Painter, doc: ReportDocument): void {
  const sections = doc.report.sectionTotals
  if (sections.length === 0) return

  const rowHeight = 16
  p.ensureSpace(rowHeight * Math.min(sections.length, 6) + 46)

  p.drawAt('Section-wise Summary', p.left, p.y, { size: SIZE.totals, bold: true })
  p.y -= 16

  const nameWidth = p.contentWidth * 0.45
  const countWidth = p.contentWidth * 0.2
  const amountWidth = p.contentWidth * 0.25

  p.rect(p.left, p.y - 2, nameWidth + countWidth + amountWidth, rowHeight, COLORS.headerFill, COLORS.line)
  p.drawAt('Section', p.left + 5, p.y + 2, { size: SIZE.table, bold: true })
  p.drawAt('Entries', p.left + nameWidth, p.y + 2, {
    size: SIZE.table,
    bold: true,
    align: 'right',
    maxWidth: countWidth - 6,
  })
  p.drawAt('Amount', p.left + nameWidth + countWidth, p.y + 2, {
    size: SIZE.table,
    bold: true,
    align: 'right',
    maxWidth: amountWidth - 6,
  })
  p.y -= rowHeight

  for (const section of sections) {
    if (p.ensureSpace(rowHeight + 20)) p.y -= 4

    p.rect(p.left, p.y - 2, nameWidth + countWidth + amountWidth, rowHeight, undefined, COLORS.line)
    p.drawAt(p.truncate(section.sectionName, SIZE.table, nameWidth - 10), p.left + 5, p.y + 2, {
      size: SIZE.table,
    })
    p.drawAt(String(section.count), p.left + nameWidth, p.y + 2, {
      size: SIZE.table,
      align: 'right',
      maxWidth: countWidth - 6,
    })
    p.drawAt(formatIndianNumber(section.total), p.left + nameWidth + countWidth, p.y + 2, {
      size: SIZE.table,
      align: 'right',
      maxWidth: amountWidth - 6,
    })
    p.y -= rowHeight
  }
}

function drawFooter(p: Painter, doc: ReportDocument): void {
  if (!doc.footerText) return
  p.ensureSpace(30)
  p.y -= 16
  p.drawAt(p.truncate(doc.footerText, SIZE.meta, p.contentWidth), p.left, p.y, {
    size: SIZE.meta,
    align: 'center',
    maxWidth: p.contentWidth,
    color: COLORS.muted,
  })
}
