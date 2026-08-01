/**
 * DonationBox - Temple Donation Receipt Management
 * Copyright (c) 2026 Ayam Heniber Meitei
 * Developed by Ayam Heniber Meitei <ayamheniber0@gmail.com>
 */

import { roundMoney } from './currency'

const ONES = [
  '',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Eleven',
  'Twelve',
  'Thirteen',
  'Fourteen',
  'Fifteen',
  'Sixteen',
  'Seventeen',
  'Eighteen',
  'Nineteen',
] as const

const TENS = [
  '',
  '',
  'Twenty',
  'Thirty',
  'Forty',
  'Fifty',
  'Sixty',
  'Seventy',
  'Eighty',
  'Ninety',
] as const

function twoDigits(n: number): string {
  if (n < 20) return ONES[n]
  const tens = TENS[Math.floor(n / 10)]
  const unit = n % 10
  return unit ? `${tens} ${ONES[unit]}` : tens
}

function threeDigits(n: number): string {
  const hundreds = Math.floor(n / 100)
  const rest = n % 100
  const parts: string[] = []
  if (hundreds) parts.push(`${ONES[hundreds]} Hundred`)
  if (rest) parts.push(twoDigits(rest))
  return parts.join(' ')
}

export function numberToIndianWords(value: number): string {
  const n = Math.trunc(Math.abs(value))
  if (n === 0) return ''

  const parts: string[] = []

  const crore = Math.floor(n / 10_000_000)
  const lakh = Math.floor((n % 10_000_000) / 100_000)
  const thousand = Math.floor((n % 100_000) / 1_000)
  const rest = n % 1_000

  if (crore) parts.push(`${crore > 999 ? numberToIndianWords(crore) : threeDigits(crore)} Crore`)
  if (lakh) parts.push(`${twoDigits(lakh)} Lakh`)
  if (thousand) parts.push(`${twoDigits(thousand)} Thousand`)
  if (rest) parts.push(threeDigits(rest))

  return parts.join(' ').replace(/\s+/g, ' ').trim()
}

export function amountToWords(value: number): string {
  const amount = roundMoney(Math.abs(value))
  const rupees = Math.trunc(amount)
  const paise = Math.round((amount - rupees) * 100)

  if (rupees === 0 && paise === 0) return 'Zero Rupees Only'

  const segments: string[] = []
  if (rupees > 0) segments.push(`${numberToIndianWords(rupees)} Rupees`)
  if (paise > 0) {
    segments.push(`${segments.length ? 'and ' : ''}${numberToIndianWords(paise)} Paise`)
  }

  const prefix = value < 0 ? 'Minus ' : ''
  return `${prefix}${segments.join(' ')} Only`
}
