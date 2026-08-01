/**
 * DonationBox - Temple Donation Receipt Management
 * Copyright (c) 2026 Ayam Heniber Meitei
 * Developed by Ayam Heniber Meitei <ayamheniber0@gmail.com>
 */

import { getFinancialYear } from './financial-year'

export const SEQUENCE_PAD = 5
export const DEFAULT_PREFIX = 'PDJM'

export interface ReceiptNumberParts {
  prefix: string
  financialYear: string
  sequence: number
}

export function normalisePrefix(prefix: string): string {
  const cleaned = (prefix ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '')
  return cleaned || DEFAULT_PREFIX
}

export function formatReceiptNumber({ prefix, financialYear, sequence }: ReceiptNumberParts): string {
  const padded = String(Math.max(1, Math.trunc(sequence))).padStart(SEQUENCE_PAD, '0')
  return `${normalisePrefix(prefix)}-${financialYear}-${padded}`
}

export function previewReceiptNumber(prefix: string, lastNumber: number, at?: Date | string): string {
  return formatReceiptNumber({
    prefix,
    financialYear: getFinancialYear(at).label,
    sequence: lastNumber + 1,
  })
}
