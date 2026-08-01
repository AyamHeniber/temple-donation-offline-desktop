/**
 * DonationBox - Temple Donation Receipt Management
 * Copyright (c) 2026 Ayam Heniber Meitei
 * Developed by Ayam Heniber Meitei <ayamheniber0@gmail.com>
 */

import { Badge } from '@/components/ui/badge'
import { PAYMENT_MODE_LABELS, type PaymentMode } from '@/types/domain'
import { formatCurrency, formatIndianNumber } from '@/utils/currency'
import { cn } from '@/lib/utils'

interface MoneyProps {
  value: number
  className?: string
  bare?: boolean
  fractionDigits?: number
}

export function Money({ value, className, bare = false, fractionDigits = 2 }: MoneyProps) {
  return (
    <span className={cn('tabular whitespace-nowrap', className)}>
      {bare ? formatIndianNumber(value, fractionDigits) : formatCurrency(value, fractionDigits)}
    </span>
  )
}

const MODE_VARIANT: Record<PaymentMode, 'default' | 'secondary' | 'success' | 'warning'> = {
  CASH: 'success',
  UPI: 'default',
  NEFT: 'secondary',
  CHEQUE: 'warning',
}

export function PaymentModeBadge({ mode, className }: { mode: PaymentMode; className?: string }) {
  return (
    <Badge variant={MODE_VARIANT[mode]} className={className}>
      {PAYMENT_MODE_LABELS[mode]}
    </Badge>
  )
}
