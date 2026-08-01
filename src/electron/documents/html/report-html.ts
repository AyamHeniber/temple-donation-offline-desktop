/**
 * DonationBox - Temple Donation Receipt Management
 * Copyright (c) 2026 Ayam Heniber Meitei
 * Developed by Ayam Heniber Meitei <ayamheniber0@gmail.com>
 */

import type { ReportDocument } from '../report-document'
import { reportCellText } from '../report-document'
import { formatIndianNumber } from '@/utils/currency'
import { escapeHtml, htmlDocument, printStyles } from './print-styles'

export function renderReportHtml(doc: ReportDocument): string {
  const { report } = doc

  const headerCells = doc.columns
    .map(
      (column) =>
        `<th class="${column.align === 'right' ? 'num' : column.align === 'center' ? 'ctr' : ''}" style="width:${column.weight * 6}%">${escapeHtml(column.header)}</th>`,
    )
    .join('')

  const bodyRows = report.rows
    .map((row, index) => {
      const cells = doc.columns
        .map((column) => {
          const raw = reportCellText(row, column, index)
          const text = column.numeric && raw !== '-' ? formatIndianNumber(Number(raw)) : raw
          const cls = column.align === 'right' ? 'num' : column.align === 'center' ? 'ctr' : ''
          return `<td class="${cls}">${escapeHtml(text)}</td>`
        })
        .join('')
      return `<tr>${cells}</tr>`
    })
    .join('')

  const emptyState = `<tr><td colspan="${doc.columns.length}" class="ctr muted">No receipts in this period.</td></tr>`

  const totalsRow = `
    <tr>
      <td colspan="5" class="num">GRAND TOTAL (${report.totals.receiptCount} receipts)</td>
      <td class="num">${escapeHtml(formatIndianNumber(report.totals.cash))}</td>
      <td class="num">${escapeHtml(formatIndianNumber(report.totals.upi))}</td>
      <td class="num">${escapeHtml(formatIndianNumber(report.totals.neft))}</td>
      <td class="num">${escapeHtml(formatIndianNumber(report.totals.cheque))}</td>
      <td class="num">${escapeHtml(formatIndianNumber(report.totals.overall))}</td>
    </tr>`

  const sectionSummary = report.sectionTotals.length
    ? `
    <div class="section-summary">
      <h2>Section-wise Summary</h2>
      <table>
        <thead><tr><th>Section</th><th class="num">Entries</th><th class="num">Amount</th></tr></thead>
        <tbody>
          ${report.sectionTotals
            .map(
              (section) => `<tr>
                <td>${escapeHtml(section.sectionName)}</td>
                <td class="num">${section.count}</td>
                <td class="num">${escapeHtml(formatIndianNumber(section.total))}</td>
              </tr>`,
            )
            .join('')}
        </tbody>
      </table>
    </div>`
    : ''

  const body = `
    <header class="temple-header">
      <h1 class="temple-name">${escapeHtml(doc.temple.name)}</h1>
      ${doc.temple.address ? `<p class="temple-meta">${escapeHtml(doc.temple.address)}</p>` : ''}
      <hr class="rule" />
    </header>

    <div class="doc-title">${escapeHtml(doc.title)}</div>

    <div class="meta-grid">
      <div><span class="meta-label">Period:</span> <span class="meta-value">${escapeHtml(doc.rangeText)}</span></div>
      <div class="right meta-label">${escapeHtml(doc.generatedText)}</div>
    </div>

    <table>
      <thead><tr>${headerCells}</tr></thead>
      <tbody>${bodyRows || emptyState}</tbody>
      <tfoot>${totalsRow}</tfoot>
    </table>

    ${sectionSummary}

    ${doc.footerText ? `<div class="doc-footer">${escapeHtml(doc.footerText)}</div>` : ''}
  `

  return htmlDocument('Donation Report', printStyles('landscape'), body)
}
