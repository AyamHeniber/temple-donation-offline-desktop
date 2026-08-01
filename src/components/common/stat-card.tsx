/**
 * DonationBox - Temple Donation Receipt Management
 * Copyright (c) 2026 Ayam Heniber Meitei
 * Developed by Ayam Heniber Meitei <ayamheniber0@gmail.com>
 */

import type { ComponentType, ReactNode } from 'react'
import type { LucideProps } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: ReactNode
  hint?: ReactNode
  icon: ComponentType<LucideProps>
  tone?: 'primary' | 'success' | 'warning' | 'muted'
  loading?: boolean
}

const TONE: Record<NonNullable<StatCardProps['tone']>, string> = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/15 text-warning',
  muted: 'bg-muted text-muted-foreground',
}

export function StatCard({ label, value, hint, icon: Icon, tone = 'primary', loading }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-start gap-4 p-5">
        <div className={cn('rounded-lg p-2.5', TONE[tone])}>
          <Icon className="h-5 w-5" aria-hidden />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          {loading ? (
            <Skeleton className="mt-2 h-7 w-28" />
          ) : (
            <p className="mt-1 truncate text-2xl font-bold tracking-tight">{value}</p>
          )}
          {hint && !loading ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
        </div>
      </CardContent>
    </Card>
  )
}
