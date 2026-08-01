/**
 * DonationBox - Temple Donation Receipt Management
 * Copyright (c) 2026 Ayam Heniber Meitei
 * Developed by Ayam Heniber Meitei <ayamheniber0@gmail.com>
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Money } from '@/components/common/money'
import type { DashboardStats } from '@/types/domain'
import { fromDateKey } from '@/utils/date'

export function DonationTrend({ data }: { data: DashboardStats['dailyTrend'] }) {
  const max = Math.max(...data.map((point) => point.total), 1)

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle>Last 7 Days</CardTitle>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col">
        <div className="flex min-h-44 flex-1 items-stretch justify-between gap-2">
          {data.map((point) => {
            const heightPercent = point.total > 0 ? Math.max(6, (point.total / max) * 100) : 2
            const day = fromDateKey(point.dateKey)

            return (
              <div key={point.dateKey} className="group flex flex-1 flex-col items-center gap-2">
                <div className="flex w-full flex-1 items-end">
                  <div
                    className="w-full rounded-t bg-primary/80 transition-all group-hover:bg-primary"
                    style={{ height: `${heightPercent}%` }}
                    title={`${day.format('DD MMM')}: ${point.total}`}
                  />
                </div>
                <div className="text-center">
                  <p className="text-2xs font-medium">{day.format('DD')}</p>
                  <p className="text-2xs text-muted-foreground">{day.format('MMM')}</p>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-4 flex items-baseline justify-between border-t border-border pt-3 text-sm">
          <span className="text-muted-foreground">7-day total</span>
          <Money value={data.reduce((sum, point) => sum + point.total, 0)} className="font-semibold" />
        </div>
      </CardContent>
    </Card>
  )
}
