/**
 * DonationBox - Temple Donation Receipt Management
 * Copyright (c) 2026 Ayam Heniber Meitei
 * Developed by Ayam Heniber Meitei <ayamheniber0@gmail.com>
 */

import { useEffect } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AlertOctagon } from 'lucide-react'
import { AppLayout } from '@/layouts/app-layout'
import { DashboardPage } from '@/pages/dashboard.page'
import { ReceiptsPage } from '@/pages/receipts.page'
import { ReceiptNewPage } from '@/pages/receipt-new.page'
import { ReceiptEditPage } from '@/pages/receipt-edit.page'
import { ReportsPage } from '@/pages/reports.page'
import { SectionsPage } from '@/pages/sections.page'
import { SettingsPage } from '@/pages/settings.page'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { LoadingPanel } from '@/components/common/states'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/store/app-store'

export default function App() {
  const ready = useAppStore((state) => state.ready)
  const error = useAppStore((state) => state.error)
  const bootstrap = useAppStore((state) => state.bootstrap)

  useEffect(() => {
    void bootstrap()
  }, [bootstrap])

  if (!ready) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingPanel label="Starting DonationBox…" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-10 text-center">
        <div className="rounded-full bg-destructive/10 p-3">
          <AlertOctagon className="h-6 w-6 text-destructive" aria-hidden />
        </div>
        <div>
          <h1 className="text-lg font-semibold">DonationBox could not start</h1>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">{error}</p>
        </div>
        <Button onClick={() => void bootstrap()}>Try again</Button>
      </div>
    )
  }

  return (
    <TooltipProvider delayDuration={300}>
      <HashRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="receipts" element={<ReceiptsPage />} />
            <Route path="receipts/new" element={<ReceiptNewPage />} />
            <Route path="receipts/:id/edit" element={<ReceiptEditPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="sections" element={<SectionsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
      <Toaster />
    </TooltipProvider>
  )
}
