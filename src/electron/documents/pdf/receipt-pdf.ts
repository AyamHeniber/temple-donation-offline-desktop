/**
 * DonationBox - Temple Donation Receipt Management
 * Copyright (c) 2026 Ayam Heniber Meitei
 * Developed by Ayam Heniber Meitei <ayamheniber0@gmail.com>
 */

import type { ReceiptDocument } from '../receipt-document'
import { formatCurrency, formatCurrencyAscii } from '@/utils/currency'
import { resolveFonts } from './fonts'
import { A4_PORTRAIT, COLORS, Painter } from './painter'

const FONT_SIZE = {
  templeName: 19,
  address: 9.5,
  title: 13,
  meta: 10,
  label: 9,
  body: 10,
  table: 9.5,
  small: 8,
} as const

const ROW_PADDING = 7
const LINE_HEIGHT = 12

interface Column {
  key: 'index' | 'section' | 'remarks' | 'amount'
  header: string
  width: number
  align: 'left' | 'right' | 'center'
}

function columnsFor(contentWidth: number): Column[] {
  const index = 36
  const amount = 96
  const remarks = 168
  return [
    { key: 'index', header: 'S.No', width: index, align: 'center' },
    { key: 'section', header: 'Donation Section', width: contentWidth - index - amount - remarks, align: 'left' },
    { key: 'remarks', header: 'Remarks', width: remarks, align: 'left' },
    { key: 'amount', header: 'Amount', width: amount, align: 'right' },
  ]
}

function money(painter: Painter, value: number): string {
  return painter.fonts.unicode ? formatCurrency(value) : formatCurrencyAscii(value)
}

export async function renderReceiptPdf(doc: ReceiptDocument): Promise<Uint8Array> {
  const p = await Painter.create(resolveFonts, A4_PORTRAIT, 42)

  await drawHeader(p, doc)
  drawTitle(p, doc)
  drawMeta(p, doc)
  drawDonor(p, doc)
  drawTable(p, doc)
  drawSummary(p, doc)
  drawFooter(p, doc)

  return p.toBytes()
}

async function drawHeader(p: Painter, doc: ReceiptDocument): Promise<void> {
  const logoSize = 62
  const topY = p.y

  if (doc.temple.logoDataUrl) {
    try {
      const [meta, base64] = doc.temple.logoDataUrl.split(',')
      const bytes = Buffer.from(base64, 'base64')
      const image = meta.includes('image/png')
        ? await p.doc.embedPng(bytes)
        : await p.doc.embedJpg(bytes)

      const scaled = image.scaleToFit(logoSize, logoSize)
      p.page.drawImage(image, {
        x: p.left,
        y: topY - logoSize + (logoSize - scaled.height) / 2,
        width: scaled.width,
        height: scaled.height,
      })
    } catch {}
  }

  p.y = topY - 16
  p.drawAt(doc.temple.name, p.left, p.y, {
    size: FONT_SIZE.templeName,
    bold: true,
    align: 'center',
    maxWidth: p.contentWidth,
    color: COLORS.primary,
  })
  p.y -= 15

  for (const line of p.wrap(doc.temple.address, FONT_SIZE.address, p.contentWidth - 140)) {
    p.drawAt(line, p.left, p.y, {
      size: FONT_SIZE.address,
      align: 'center',
      maxWidth: p.contentWidth,
      color: COLORS.muted,
    })
    p.y -= 12
  }

  const contact = [doc.temple.phone && `Phone: ${doc.temple.phone}`, doc.temple.email]
    .filter(Boolean)
    .join('   |   ')

  if (contact) {
    p.drawAt(contact, p.left, p.y, {
      size: FONT_SIZE.address,
      align: 'center',
      maxWidth: p.contentWidth,
      color: COLORS.muted,
    })
    p.y -= 12
  }

  p.y = Math.min(p.y, topY - logoSize - 4)
  p.hr({ thickness: 1.4, color: COLORS.primary, gap: 6 })
}

function drawTitle(p: Painter, doc: ReceiptDocument): void {
  const height = 22
  p.y -= height
  p.rect(p.left, p.y, p.contentWidth, height, COLORS.headerFill)
  p.drawAt(doc.title, p.left, p.y + 7, {
    size: FONT_SIZE.title,
    bold: true,
    align: 'center',
    maxWidth: p.contentWidth,
    color: COLORS.primary,
  })
  p.y -= 16
}

function drawMeta(p: Painter, doc: ReceiptDocument): void {
  const half = p.contentWidth / 2

  const pairs: Array<[string, string, string, string]> = [
    ['Receipt No.', doc.receiptNumber, 'Date', doc.dateText],
    ['Financial Year', doc.financialYear, 'Time', doc.timeText],
  ]

  const LABEL_GAP = 4

  for (const [leftLabel, leftValue, rightLabel, rightValue] of pairs) {
    const label = `${leftLabel}:`
    p.drawAt(label, p.left, p.y, { size: FONT_SIZE.meta, color: COLORS.muted })
    p.drawAt(leftValue, p.left + p.widthOf(label, FONT_SIZE.meta) + LABEL_GAP, p.y, {
      size: FONT_SIZE.meta,
      bold: true,
    })

    const rightText = `${rightLabel}: ${rightValue}`
    p.drawAt(rightText, p.left + half, p.y, {
      size: FONT_SIZE.meta,
      align: 'right',
      maxWidth: half,
      bold: true,
    })

    p.y -= 15
  }

  p.y -= 4
}

function drawDonor(p: Painter, doc: ReceiptDocument): void {
  const padding = 9
  const innerWidth = p.contentWidth - padding * 2

  const addressLines = p.wrap(doc.donor.address, FONT_SIZE.body, innerWidth)
  const phoneLine = doc.donor.phone ? 1 : 0
  const boxHeight = padding * 2 + 14 + 15 + addressLines.length * LINE_HEIGHT + phoneLine * LINE_HEIGHT

  p.ensureSpace(boxHeight + 10)
  p.y -= boxHeight
  p.rect(p.left, p.y, p.contentWidth, boxHeight, COLORS.white, COLORS.line)

  let cursor = p.y + boxHeight - padding - 9
  p.drawAt('Received with thanks from', p.left + padding, cursor, {
    size: FONT_SIZE.label,
    color: COLORS.muted,
  })

  cursor -= 15
  p.drawAt(p.truncate(doc.donor.name, 12, innerWidth, true), p.left + padding, cursor, {
    size: 12,
    bold: true,
  })

  for (const line of addressLines) {
    cursor -= LINE_HEIGHT
    p.drawAt(line, p.left + padding, cursor, { size: FONT_SIZE.body, color: COLORS.muted })
  }

  if (doc.donor.phone) {
    cursor -= LINE_HEIGHT
    p.drawAt(`Phone: ${doc.donor.phone}`, p.left + padding, cursor, {
      size: FONT_SIZE.body,
      color: COLORS.muted,
    })
  }

  p.y -= 14
}

function drawTableHeader(p: Painter, columns: Column[]): void {
  const height = 20
  p.y -= height
  p.rect(p.left, p.y, p.contentWidth, height, COLORS.headerFill, COLORS.line)

  let x = p.left
  for (const column of columns) {
    p.drawAt(column.header, x + 6, p.y + 6, {
      size: FONT_SIZE.table,
      bold: true,
      align: column.align,
      maxWidth: column.width - 12,
    })
    x += column.width
  }
}

function drawTable(p: Painter, doc: ReceiptDocument): void {
  const columns = columnsFor(p.contentWidth)
  p.ensureSpace(90)
  drawTableHeader(p, columns)

  doc.items.forEach((item, rowIndex) => {
    const cells: Record<Column['key'], string[]> = {
      index: [String(item.index)],
      section: p.wrap(item.sectionName, FONT_SIZE.table, columns[1].width - 12),
      remarks: p.wrap(item.remarks || '-', FONT_SIZE.table, columns[2].width - 12),
      amount: [money(p, item.amount)],
    }

    const lineCount = Math.max(...Object.values(cells).map((lines) => Math.max(1, lines.length)))
    const rowHeight = lineCount * LINE_HEIGHT + ROW_PADDING

    if (p.ensureSpace(rowHeight + 40)) drawTableHeader(p, columns)

    p.y -= rowHeight
    if (rowIndex % 2 === 1) p.rect(p.left, p.y, p.contentWidth, rowHeight, COLORS.zebra)
    p.rect(p.left, p.y, p.contentWidth, rowHeight, undefined, COLORS.line)

    let x = p.left
    for (const column of columns) {
      let cursor = p.y + rowHeight - ROW_PADDING / 2 - 9
      for (const line of cells[column.key]) {
        p.drawAt(line, x + 6, cursor, {
          size: FONT_SIZE.table,
          align: column.align,
          maxWidth: column.width - 12,
          color: column.key === 'remarks' ? COLORS.muted : COLORS.text,
        })
        cursor -= LINE_HEIGHT
      }
      x += column.width
    }
  })

  const totalHeight = 24
  const amountWidth = columns[3].width
  p.ensureSpace(totalHeight + 30)
  p.y -= totalHeight
  p.rect(p.left, p.y, p.contentWidth, totalHeight, COLORS.headerFill, COLORS.line)
  p.drawAt('Total', p.left + 6, p.y + 8, {
    size: FONT_SIZE.table + 0.5,
    bold: true,
    align: 'right',
    maxWidth: p.contentWidth - amountWidth - 12,
  })
  p.drawAt(money(p, doc.totalAmount), p.right - amountWidth + 6, p.y + 8, {
    size: FONT_SIZE.table + 0.5,
    bold: true,
    align: 'right',
    maxWidth: amountWidth - 12,
  })

  p.y -= 14
}

function drawSummary(p: Painter, doc: ReceiptDocument): void {
  p.ensureSpace(70)

  p.drawAt('Amount in words', p.left, p.y, { size: FONT_SIZE.label, color: COLORS.muted })
  p.y -= 13

  for (const line of p.wrap(doc.amountInWords, FONT_SIZE.body, p.contentWidth, true)) {
    p.drawAt(line, p.left, p.y, { size: FONT_SIZE.body, bold: true })
    p.y -= LINE_HEIGHT
  }

  p.y -= 6
  const payment = doc.referenceNo
    ? `Payment Mode: ${doc.paymentMode}   |   Reference: ${doc.referenceNo}`
    : `Payment Mode: ${doc.paymentMode}`

  p.drawAt(payment, p.left, p.y, { size: FONT_SIZE.body })
  p.y -= LINE_HEIGHT

  if (doc.notes) {
    for (const line of p.wrap(`Note: ${doc.notes}`, FONT_SIZE.label, p.contentWidth)) {
      p.drawAt(line, p.left, p.y, { size: FONT_SIZE.label, color: COLORS.muted })
      p.y -= 11
    }
  }
}

function drawFooter(p: Painter, doc: ReceiptDocument): void {
  const signatureBlock = 62
  const footerLines = p.wrap(doc.footerText, FONT_SIZE.label, p.contentWidth - 60)
  const needed = signatureBlock + footerLines.length * 11 + 26

  if (p.y - needed > p.margin) p.y = p.margin + needed

  const signatureY = p.y - 34
  p.page.drawLine({
    start: { x: p.right - 170, y: signatureY },
    end: { x: p.right, y: signatureY },
    thickness: 0.8,
    color: COLORS.line,
  })
  p.drawAt(doc.signatory, p.right - 170, signatureY - 12, {
    size: FONT_SIZE.label,
    align: 'center',
    maxWidth: 170,
    bold: true,
  })

  p.y = signatureY - 34

  for (const line of footerLines) {
    p.drawAt(line, p.left, p.y, {
      size: FONT_SIZE.label,
      align: 'center',
      maxWidth: p.contentWidth,
      color: COLORS.muted,
    })
    p.y -= 11
  }

  p.drawAt(doc.disclaimer, p.left, p.margin - 6, {
    size: FONT_SIZE.small,
    align: 'center',
    maxWidth: p.contentWidth,
    color: COLORS.muted,
  })
}
