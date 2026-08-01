/**
 * DonationBox - Temple Donation Receipt Management
 * Copyright (c) 2026 Ayam Heniber Meitei
 * Developed by Ayam Heniber Meitei <ayamheniber0@gmail.com>
 */

import { NavLink } from 'react-router-dom'
import {
  FilePlus2,
  LayoutDashboard,
  ListTree,
  type LucideProps,
  Receipt,
  Settings as SettingsIcon,
  BarChart3,
} from 'lucide-react'
import type { ComponentType } from 'react'
import { useAppStore } from '@/store/app-store'
import { cn } from '@/lib/utils'

interface NavItem {
  to: string
  label: string
  icon: ComponentType<LucideProps>
  shortcut: string
  end?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, shortcut: 'Ctrl+D', end: true },
  { to: '/receipts/new', label: 'New Receipt', icon: FilePlus2, shortcut: 'Ctrl+N' },
  { to: '/receipts', label: 'Receipts', icon: Receipt, shortcut: 'Ctrl+L', end: true },
  { to: '/reports', label: 'Reports', icon: BarChart3, shortcut: 'Ctrl+R' },
  { to: '/sections', label: 'Sections', icon: ListTree, shortcut: 'Ctrl+K' },
  { to: '/settings', label: 'Settings', icon: SettingsIcon, shortcut: 'Ctrl+,' },
]

export function Sidebar() {
  const settings = useAppStore((state) => state.settings)

  return (
    <aside className="flex w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-3 border-b border-sidebar-border px-5 py-4">
        {settings?.logoDataUrl ? (
          <img
            src={settings.logoDataUrl}
            alt=""
            className="h-10 w-10 shrink-0 rounded-md bg-white/10 object-contain p-1"
          />
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-sidebar-accent text-base font-bold text-white">
            {(settings?.templeName?.trim() || 'DonationBox').charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold leading-tight">
            {settings?.templeName || 'DonationBox'}
          </p>
          <p className="text-2xs uppercase tracking-widest text-sidebar-foreground/60">Donation Receipts</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV_ITEMS.map(({ to, label, icon: Icon, shortcut, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-white shadow-sm'
                  : 'text-sidebar-foreground/80 hover:bg-white/5 hover:text-sidebar-foreground',
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={cn('h-4 w-4 shrink-0', !isActive && 'opacity-70')} aria-hidden />
                <span className="flex-1">{label}</span>
                <kbd
                  className={cn(
                    'hidden text-2xs tracking-wide text-sidebar-foreground/40 group-hover:inline',
                    isActive && 'text-white/60',
                  )}
                >
                  {shortcut}
                </kbd>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="space-y-2 border-t border-sidebar-border px-5 py-3">
        <p className="text-2xs text-sidebar-foreground/50">Offline · Data stored on this computer</p>

        <div className="border-t border-sidebar-border/60 pt-2">
          <p className="text-2xs uppercase tracking-widest text-sidebar-foreground/40">Developed by</p>
          <p className="mt-0.5 truncate text-xs font-medium text-sidebar-foreground/80">
            Ayam Heniber Meitei
          </p>
          <p
            className="selectable truncate text-2xs text-sidebar-foreground/50"
            title="ayamheniber0@gmail.com"
          >
            ayamheniber0@gmail.com
          </p>
        </div>
      </div>
    </aside>
  )
}
