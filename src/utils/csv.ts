/**
 * DonationBox - Temple Donation Receipt Management
 * Copyright (c) 2026 Ayam Heniber Meitei
 * Developed by Ayam Heniber Meitei <ayamheniber0@gmail.com>
 */

export type CsvValue = string | number | boolean | null | undefined

const BOM = '﻿'

function escapeCell(value: CsvValue): string {
  if (value === null || value === undefined) return ''
  const text = String(value)
  return /[",\r\n]|^\s|\s$/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function toCsv(headers: readonly string[], rows: readonly CsvValue[][], withBom = true): string {
  const lines = [headers.map(escapeCell).join(','), ...rows.map((row) => row.map(escapeCell).join(','))]
  return (withBom ? BOM : '') + lines.join('\r\n') + '\r\n'
}
