/**
 * DonationBox - Temple Donation Receipt Management
 * Copyright (c) 2026 Ayam Heniber Meitei
 * Developed by Ayam Heniber Meitei <ayamheniber0@gmail.com>
 */

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, FilePlus2, HardDriveDownload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'
import { notify } from '@/lib/notify'
import { useAppStore } from '@/store/app-store'
import { formatDateTime, nowIst } from '@/utils/date'
import { getFinancialYear } from '@/utils/financial-year'

function useClock(): string {
  const [now, setNow] = useState(() => nowIst().toISOString())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(nowIst().toISOString()), 30_000)
    return () => window.clearInterval(timer)
  }, [])

  return formatDateTime(now)
}

export function Topbar() {
  const navigate = useNavigate()
  const clock = useClock()
  const settings = useAppStore((state) => state.settings)
  const [backingUp, setBackingUp] = useState(false)

  const handleQuickBackup = async () => {
    setBackingUp(true)
    try {
      const record = await api.backup.create('Quick backup from the toolbar')
      notify.success('Backup created', record.fileName)
    } catch (error) {
      notify.error(error, 'Could not create a backup.')
    } finally {
      setBackingUp(false)
    }
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border bg-card px-6">
      <div className="flex items-center gap-3">
        <Badge variant="outline" className="gap-1.5 font-normal">
          <CalendarDays className="h-3.5 w-3.5" aria-hidden />
          FY {getFinancialYear().label}
        </Badge>
        <span className="text-sm text-muted-foreground tabular">{clock} IST</span>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={handleQuickBackup} loading={backingUp}>
          <HardDriveDownload aria-hidden />
          Backup now
        </Button>
        <Button size="sm" onClick={() => navigate('/receipts/new')}>
          <FilePlus2 aria-hidden />
          New Receipt
        </Button>
        {settings?.printerName ? (
          <span className="hidden text-xs text-muted-foreground xl:inline">
            Printer: {settings.printerName}
          </span>
        ) : null}
      </div>
    </header>
  )
}
