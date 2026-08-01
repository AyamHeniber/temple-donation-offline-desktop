/**
 * DonationBox - Temple Donation Receipt Management
 * Copyright (c) 2026 Ayam Heniber Meitei
 * Developed by Ayam Heniber Meitei <ayamheniber0@gmail.com>
 */

import dayjs, { type Dayjs } from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)
dayjs.extend(isSameOrBefore)

export const IST = 'Asia/Kolkata'
export const DATE_KEY_FORMAT = 'YYYY-MM-DD'
export const DISPLAY_DATE_FORMAT = 'DD-MMM-YYYY'
export const DISPLAY_TIME_FORMAT = 'hh:mm A'
export const DISPLAY_DATETIME_FORMAT = `${DISPLAY_DATE_FORMAT} ${DISPLAY_TIME_FORMAT}`

type DateLike = Date | string | number | Dayjs | null | undefined

export function ist(value?: DateLike): Dayjs {
  return value == null ? dayjs().tz(IST) : dayjs(value).tz(IST)
}

export function nowIst(): Dayjs {
  return dayjs().tz(IST)
}

export function toDateKey(value?: DateLike): string {
  return ist(value).format(DATE_KEY_FORMAT)
}

export function fromDateKey(key: string): Dayjs {
  return dayjs.tz(key, DATE_KEY_FORMAT, IST)
}

export function isValidDateKey(key: string): boolean {
  return dayjs(key, DATE_KEY_FORMAT, true).isValid()
}

export function formatDate(value: DateLike): string {
  if (!value) return '—'
  return ist(value).format(DISPLAY_DATE_FORMAT)
}

export function formatTime(value: DateLike): string {
  if (!value) return '—'
  return ist(value).format(DISPLAY_TIME_FORMAT)
}

export function formatDateTime(value: DateLike): string {
  if (!value) return '—'
  return ist(value).format(DISPLAY_DATETIME_FORMAT)
}

export function fileStamp(value?: DateLike): string {
  return ist(value).format('YYYYMMDD-HHmmss')
}

export function startOfMonthKey(value?: DateLike): string {
  return ist(value).startOf('month').format(DATE_KEY_FORMAT)
}

export function endOfMonthKey(value?: DateLike): string {
  return ist(value).endOf('month').format(DATE_KEY_FORMAT)
}

export function lastNDayKeys(n: number, until?: DateLike): string[] {
  const end = ist(until).startOf('day')
  return Array.from({ length: n }, (_, i) => end.subtract(n - 1 - i, 'day').format(DATE_KEY_FORMAT))
}

export function applyDateKey(key: string, instant?: DateLike): string {
  const source = ist(instant)
  const target = fromDateKey(key)

  return target
    .hour(source.hour())
    .minute(source.minute())
    .second(source.second())
    .millisecond(source.millisecond())
    .toISOString()
}

export function formatDateKey(key: string): string {
  if (!key || !isValidDateKey(key)) return '—'
  return fromDateKey(key).format(DISPLAY_DATE_FORMAT)
}

export { dayjs }
