/**
 * DonationBox - Temple Donation Receipt Management
 * Copyright (c) 2026 Ayam Heniber Meitei
 * Developed by Ayam Heniber Meitei <ayamheniber0@gmail.com>
 */

export const RUPEE = '₹'

export function roundMoney(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export function sumMoney(values: readonly number[]): number {
  return roundMoney(values.reduce((acc, v) => acc + (Number.isFinite(v) ? v : 0), 0))
}

export function formatIndianNumber(value: number, fractionDigits = 2): string {
  const amount = roundMoney(value)
  const negative = amount < 0
  const [whole, fraction = ''] = Math.abs(amount).toFixed(fractionDigits).split('.')

  const last3 = whole.slice(-3)
  const rest = whole.slice(0, -3)
  const grouped = rest ? `${rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',')},${last3}` : last3

  const result = fractionDigits > 0 ? `${grouped}.${fraction}` : grouped
  return negative ? `-${result}` : result
}

export function formatCurrency(value: number, fractionDigits = 2): string {
  return `${RUPEE}${formatIndianNumber(value, fractionDigits)}`
}

export function formatCurrencyAscii(value: number, fractionDigits = 2): string {
  return `Rs. ${formatIndianNumber(value, fractionDigits)}`
}

export function parseAmount(input: string | number): number {
  if (typeof input === 'number') return roundMoney(input)
  const cleaned = String(input).replace(/[^0-9.-]/g, '')
  const parsed = Number.parseFloat(cleaned)
  return Number.isFinite(parsed) ? roundMoney(parsed) : Number.NaN
}
