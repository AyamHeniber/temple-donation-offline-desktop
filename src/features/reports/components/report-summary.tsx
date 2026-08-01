/**
 * DonationBox - Temple Donation Receipt Management
 * Copyright (c) 2026 Ayam Heniber Meitei
 * Developed by Ayam Heniber Meitei <ayamheniber0@gmail.com>
 */

import { Card, CardContent } from '@/components/ui/card'
import { Money } from '@/components/common/money'
import type { DonationReport } from '@/types/domain'
import { cn } from '@/lib/utils'

const TILES = [
  { key: 'cash', label: 'Total Cash', tone: 'text-success' },
  { key: 'upi', label: 'Total UPI', tone: 'text-primary' },
  { key: 'neft', label: 'Total NEFT', tone: 'text-foreground' },
  { key: 'cheque', label: 'Total Cheque', tone: 'text-warning' },
] as const

export function ReportSummary({ report }: { report: DonationReport }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {TILES.map((tile) => (
        <Card key={tile.key}>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">{tile.label}</p>
            <Money
              value={report.totals[tile.key]}
              className={cn('mt-1 block text-xl font-bold', tile.tone)}
            />
          </CardContent>
        </Card>
      ))}

      <Card className="border-primary/40 bg-primary/5">
        <CardContent className="p-5">
          <p className="text-sm text-muted-foreground">Overall Donation</p>
          <Money value={report.totals.overall} className="mt-1 block text-xl font-bold text-primary" />
          <p className="mt-1 text-xs text-muted-foreground">
            {report.totals.receiptCount} receipt{report.totals.receiptCount === 1 ? '' : 's'}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
