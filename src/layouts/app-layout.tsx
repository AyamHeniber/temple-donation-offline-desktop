/**
 * DonationBox - Temple Donation Receipt Management
 * Copyright (c) 2026 Ayam Heniber Meitei
 * Developed by Ayam Heniber Meitei <ayamheniber0@gmail.com>
 */

import { useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { ErrorBoundary } from '@/components/common/error-boundary'
import { Sidebar } from './sidebar'
import { Topbar } from './topbar'
import { api, isBridgeAvailable } from '@/lib/api'
import { useAppStore } from '@/store/app-store'
import { useDataChanged } from '@/hooks/use-data-changed'

export function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const refreshSettings = useAppStore((state) => state.refreshSettings)
  const refreshSections = useAppStore((state) => state.refreshSections)

  useEffect(() => {
    if (!isBridgeAvailable()) return
    return api.events.onNavigate((route) => navigate(route))
  }, [navigate])

  useDataChanged('settings', () => void refreshSettings())
  useDataChanged('sections', () => void refreshSections())

  return (
    <div className="flex h-dvh overflow-hidden">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="relative flex-1 overflow-y-auto">
          <ErrorBoundary resetKey={location.pathname}>
            <div className="mx-auto w-full max-w-[1600px] space-y-6 p-6">
              <Outlet />
            </div>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  )
}
