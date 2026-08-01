/**
 * DonationBox - Temple Donation Receipt Management
 * Copyright (c) 2026 Ayam Heniber Meitei
 * Developed by Ayam Heniber Meitei <ayamheniber0@gmail.com>
 */

import { Link } from 'react-router-dom'
import { ArrowRight, Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface SetupNoticeProps {
  needsTempleDetails: boolean
  needsSections: boolean
}

export function SetupNotice({ needsTempleDetails, needsSections }: SetupNoticeProps) {
  if (!needsTempleDetails && !needsSections) return null

  const target = needsTempleDetails ? '/settings' : '/sections'
  const label = needsTempleDetails ? 'Open Settings' : 'Add a Section'

  return (
    <Card className="border-warning/40 bg-warning/5">
      <CardContent className="flex flex-wrap items-center gap-4 p-4">
        <span className="rounded-md bg-warning/15 p-2 text-warning">
          <Settings2 className="h-5 w-5" aria-hidden />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">Finish setting up DonationBox</p>
          <p className="text-sm text-muted-foreground">
            {needsTempleDetails && needsSections
              ? 'Add your temple name and address, then create the donation sections you collect under.'
              : needsTempleDetails
                ? 'Add your temple name and address so they appear on every printed receipt.'
                : 'Create at least one donation section before issuing receipts.'}
          </p>
        </div>

        <Button asChild variant="outline">
          <Link to={target}>
            {label}
            <ArrowRight aria-hidden />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
