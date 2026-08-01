/**
 * DonationBox - Temple Donation Receipt Management
 * Copyright (c) 2026 Ayam Heniber Meitei
 * Developed by Ayam Heniber Meitei <ayamheniber0@gmail.com>
 */

import type { Receipt, Settings } from '@/types/domain'
import { PAYMENT_MODE_LABELS } from '@/types/domain'
import { formatDate, formatTime } from '@/utils/date'
import { getFinancialYear } from '@/utils/financial-year'

export interface ReceiptDocumentItem {
  index: number
  sectionName: string
  remarks: string
  amount: number
}

export interface ReceiptDocument {
  temple: {
    name: string
    address: string
    phone: string
    email: string
    logoDataUrl: string | null
  }
  title: string
  receiptNumber: string
  financialYear: string
  dateText: string
  timeText: string
  donor: {
    name: string
    address: string
    phone: string
  }
  items: ReceiptDocumentItem[]
  totalAmount: number
  amountInWords: string
  paymentMode: string
  referenceNo: string
  notes: string
  footerText: string
  signatory: string
  disclaimer: string
}

const DEFAULT_TITLE = 'DONATION RECEIPT'

export function buildReceiptDocument(receipt: Receipt, settings: Settings): ReceiptDocument {
  return {
    temple: {
      name: settings.templeName || 'Temple',
      address: settings.address,
      phone: settings.phone,
      email: settings.email,
      logoDataUrl: settings.logoDataUrl,
    },
    title: settings.header?.trim() || DEFAULT_TITLE,
    receiptNumber: receipt.receiptNumber,
    financialYear: receipt.financialYear || getFinancialYear(receipt.receiptDate).label,
    dateText: formatDate(receipt.receiptDate),
    timeText: formatTime(receipt.receiptDate),
    donor: {
      name: receipt.donorName,
      address: receipt.donorAddress,
      phone: receipt.donorPhone,
    },
    items: receipt.items.map((item, i) => ({
      index: i + 1,
      sectionName: item.sectionName,
      remarks: item.remarks,
      amount: item.amount,
    })),
    totalAmount: receipt.totalAmount,
    amountInWords: receipt.amountInWords,
    paymentMode: PAYMENT_MODE_LABELS[receipt.paymentMode],
    referenceNo: receipt.referenceNo,
    notes: receipt.notes,
    footerText: settings.footer,
    signatory: settings.authorizedSignatory || 'Authorised Signatory',
    disclaimer: 'This is a computer generated receipt.',
  }
}

export function receiptFileName(receipt: Pick<Receipt, 'receiptNumber'>): string {
  return `${receipt.receiptNumber.replace(/\//g, '-')}.pdf`
}
