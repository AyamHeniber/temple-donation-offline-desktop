/**
 * DonationBox - Temple Donation Receipt Management
 * Copyright (c) 2026 Ayam Heniber Meitei
 * Developed by Ayam Heniber Meitei <ayamheniber0@gmail.com>
 */

import { ist, DATE_KEY_FORMAT } from './date'

const FY_START_MONTH = 3

export interface FinancialYear {
  startYear: number
  endYear: number
  label: string
  longLabel: string
  startDateKey: string
  endDateKey: string
}

export function getFinancialYear(value?: Date | string | number | null): FinancialYear {
  const d = ist(value)
  const startYear = d.month() >= FY_START_MONTH ? d.year() : d.year() - 1
  return buildFinancialYear(startYear)
}

export function buildFinancialYear(startYear: number): FinancialYear {
  const endYear = startYear + 1
  const start = ist(`${startYear}-04-01T00:00:00`)
  const end = ist(`${endYear}-03-31T00:00:00`)

  return {
    startYear,
    endYear,
    label: `${startYear}/${String(endYear).slice(-2)}`,
    longLabel: `${startYear}-${endYear}`,
    startDateKey: start.format(DATE_KEY_FORMAT),
    endDateKey: end.format(DATE_KEY_FORMAT),
  }
}

