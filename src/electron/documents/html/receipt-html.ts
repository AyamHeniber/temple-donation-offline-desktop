/**
 * DonationBox - Temple Donation Receipt Management
 * Copyright (c) 2026 Ayam Heniber Meitei
 * Developed by Ayam Heniber Meitei <ayamheniber0@gmail.com>
 */

import type { ReceiptDocument } from '../receipt-document'
import { formatCurrency } from '@/utils/currency'
import { escapeHtml, htmlDocument, printStyles } from './print-styles'

export function renderReceiptHtml(doc: ReceiptDocument): string {
  const logo = doc.temple.logoDataUrl
    ? `<img class="logo" src="${doc.temple.logoDataUrl}" alt="" />`
    : ''

  const contact = [doc.temple.phone && `Phone: ${doc.temple.phone}`, doc.temple.email]
    .filter(Boolean)
    .map(escapeHtml)
    .join(' &nbsp;|&nbsp; ')

  const rows = doc.items
    .map(
      (item) => `
      <tr>
        <td class="ctr">${item.index}</td>
        <td>${escapeHtml(item.sectionName)}</td>
        <td class="muted">${escapeHtml(item.remarks || '-')}</td>
        <td class="num">${escapeHtml(formatCurrency(item.amount))}</td>
      </tr>`,
    )
    .join('')

  const body = `
    <header class="temple-header">
      ${logo}
      <h1 class="temple-name">${escapeHtml(doc.temple.name)}</h1>
      ${doc.temple.address ? `<p class="temple-meta">${escapeHtml(doc.temple.address)}</p>` : ''}
      ${contact ? `<p class="temple-meta">${contact}</p>` : ''}
      <hr class="rule" />
    </header>

    <div class="doc-title">${escapeHtml(doc.title)}</div>

    <div class="meta-grid">
      <div><span class="meta-label">Receipt No.:</span> <span class="meta-value">${escapeHtml(doc.receiptNumber)}</span></div>
      <div class="right"><span class="meta-label">Date:</span> <span class="meta-value">${escapeHtml(doc.dateText)}</span></div>
      <div><span class="meta-label">Financial Year:</span> <span class="meta-value">${escapeHtml(doc.financialYear)}</span></div>
      <div class="right"><span class="meta-label">Time:</span> <span class="meta-value">${escapeHtml(doc.timeText)}</span></div>
    </div>

    <div class="donor-box">
      <div class="label">Received with thanks from</div>
      <div class="name">${escapeHtml(doc.donor.name)}</div>
      ${doc.donor.address ? `<div class="addr">${escapeHtml(doc.donor.address)}</div>` : ''}
      ${doc.donor.phone ? `<div class="addr">Phone: ${escapeHtml(doc.donor.phone)}</div>` : ''}
    </div>

    <table>
      <thead>
        <tr>
          <th class="ctr" style="width:8%">S.No</th>
          <th>Donation Section</th>
          <th style="width:30%">Remarks</th>
          <th class="num" style="width:20%">Amount</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr>
          <td colspan="3" class="num">Total</td>
          <td class="num">${escapeHtml(formatCurrency(doc.totalAmount))}</td>
        </tr>
      </tfoot>
    </table>

    <div class="summary">
      <div class="label">Amount in words</div>
      <div class="words">${escapeHtml(doc.amountInWords)}</div>
      <div>
        <span class="meta-label">Payment Mode:</span> <strong>${escapeHtml(doc.paymentMode)}</strong>
        ${doc.referenceNo ? `&nbsp;&nbsp;|&nbsp;&nbsp; <span class="meta-label">Reference:</span> <strong>${escapeHtml(doc.referenceNo)}</strong>` : ''}
      </div>
      ${doc.notes ? `<div class="meta-label" style="margin-top:6px">Note: ${escapeHtml(doc.notes)}</div>` : ''}
    </div>

    <div class="signature"><span class="line">${escapeHtml(doc.signatory)}</span></div>

    ${doc.footerText ? `<div class="doc-footer">${escapeHtml(doc.footerText)}</div>` : ''}
    <div class="disclaimer">${escapeHtml(doc.disclaimer)}</div>
  `

  return htmlDocument(doc.receiptNumber, printStyles('portrait'), body)
}
