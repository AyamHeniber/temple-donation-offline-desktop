/**
 * DonationBox - Temple Donation Receipt Management
 * Copyright (c) 2026 Ayam Heniber Meitei
 * Developed by Ayam Heniber Meitei <ayamheniber0@gmail.com>
 */

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  BarChart3,
  CalendarRange,
  FilePlus2,
  IndianRupee,
  ListTree,
  Receipt as ReceiptIcon,
  Settings as SettingsIcon,
  Wallet,
} from 'lucide-react'
import { PageHeader } from '@/components/common/page-header'
import { StatCard } from '@/components/common/stat-card'
import { EmptyState, ErrorState, TableSkeleton } from '@/components/common/states'
import { Money, PaymentModeBadge } from '@/components/common/money'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DonationTrend } from '@/features/dashboard/components/donation-trend'
import { SetupNotice } from '@/features/dashboard/components/setup-notice'
import { ReceiptPreviewDialog } from '@/features/receipts/components/receipt-preview-dialog'
import { api } from '@/lib/api'
import { useAsync } from '@/hooks/use-async'
import { useDataChanged } from '@/hooks/use-data-changed'
import { useAppStore } from '@/store/app-store'
import { formatCurrency } from '@/utils/currency'
import { formatDate, formatTime } from '@/utils/date'
import type { ReceiptSummary } from '@/types/domain'

const QUICK_ACTIONS = [
  { to: '/receipts/new', label: 'New Receipt', description: 'Record a donation', icon: FilePlus2 },
  { to: '/receipts', label: 'Receipts', description: 'Search and reprint', icon: ReceiptIcon },
  { to: '/reports', label: 'Reports', description: 'Period-wise totals', icon: BarChart3 },
  { to: '/sections', label: 'Sections', description: 'Manage donation heads', icon: ListTree },
  { to: '/settings', label: 'Settings', description: 'Temple details & backup', icon: SettingsIcon },
]

export function DashboardPage() {
  const navigate = useNavigate()
  const [preview, setPreview] = useState<ReceiptSummary | null>(null)
  const settings = useAppStore((state) => state.settings)
  const sections = useAppStore((state) => state.sections)

  const stats = useAsync(() => api.dashboard.stats(), [])
  useDataChanged(['receipts', 'settings'], () => void stats.refresh())

  if (stats.error && !stats.data) {
    return <ErrorState message={stats.error} onRetry={() => void stats.refresh()} />
  }

  const data = stats.data
  const loading = stats.initialising

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Today's collection at a glance."
        actions={
          data ? (
            <Badge variant="outline" className="gap-1.5 font-normal">
              Next receipt: <span className="font-semibold tabular">{data.nextReceiptNumber}</span>
            </Badge>
          ) : null
        }
      />

      <SetupNotice
        needsTempleDetails={!settings?.templeName?.trim()}
        needsSections={sections.length === 0}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Today's Donation"
          value={formatCurrency(data?.todayTotal ?? 0)}
          hint={`${data?.todayCount ?? 0} receipt${data?.todayCount === 1 ? '' : 's'} today`}
          icon={IndianRupee}
          tone="primary"
          loading={loading}
        />
        <StatCard
          label="This Month"
          value={formatCurrency(data?.monthTotal ?? 0)}
          hint={`${data?.monthCount ?? 0} receipts this month`}
          icon={CalendarRange}
          tone="success"
          loading={loading}
        />
        <StatCard
          label={`FY ${data?.financialYear ?? ''} Collection`}
          value={formatCurrency(data?.financialYearTotal ?? 0)}
          hint="1 April – 31 March"
          icon={Wallet}
          tone="warning"
          loading={loading}
        />
        <StatCard
          label="Total Receipts"
          value={(data?.totalReceipts ?? 0).toLocaleString('en-IN')}
          hint={data ? `${formatCurrency(data.totalCollected)} collected in total` : undefined}
          icon={ReceiptIcon}
          tone="muted"
          loading={loading}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">{data ? <DonationTrend data={data.dailyTrend} /> : null}</div>

        <Card className="h-full">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {QUICK_ACTIONS.map(({ to, label, description, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="group flex items-center gap-3 rounded-md border border-transparent px-3 py-2.5 transition-colors hover:border-border hover:bg-accent/40"
              >
                <span className="rounded-md bg-muted p-2 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{label}</span>
                  <span className="block text-xs text-muted-foreground">{description}</span>
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Recent Receipts</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/receipts')}>
              View all
              <ArrowRight aria-hidden />
            </Button>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <TableSkeleton rows={5} columns={4} />
            ) : !data || data.recentReceipts.length === 0 ? (
              <EmptyState
                icon={ReceiptIcon}
                title="No receipts yet"
                description="Create the first donation receipt to see it here."
                action={
                  <Button onClick={() => navigate('/receipts/new')}>
                    <FilePlus2 aria-hidden />
                    New Receipt
                  </Button>
                }
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Receipt No.</TableHead>
                    <TableHead>Donor</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentReceipts.map((receipt) => (
                    <TableRow key={receipt.id}>
                      <TableCell>
                        <button
                          type="button"
                          onClick={() => setPreview(receipt)}
                          className="font-medium text-primary tabular hover:underline"
                        >
                          {receipt.receiptNumber}
                        </button>
                        <div className="text-xs text-muted-foreground tabular">
                          {formatDate(receipt.receiptDate)} · {formatTime(receipt.receiptDate)}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[18rem] truncate">{receipt.donorName}</TableCell>
                      <TableCell>
                        <PaymentModeBadge mode={receipt.paymentMode} />
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        <Money value={receipt.totalAmount} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Modes · FY {data?.financialYear ?? ''}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(data?.paymentModeBreakdown ?? []).map((entry) => (
                <div key={entry.mode} className="flex items-center justify-between gap-3">
                  <PaymentModeBadge mode={entry.mode} />
                  <div className="text-right">
                    <Money value={entry.total} className="text-sm font-semibold" />
                    <p className="text-2xs text-muted-foreground">{entry.count} receipts</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Sections</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!data || data.topSections.length === 0 ? (
                <p className="text-sm text-muted-foreground">No donations recorded this financial year.</p>
              ) : (
                data.topSections.map((section) => (
                  <div key={section.sectionId} className="flex items-center justify-between gap-3">
                    <span className="min-w-0 truncate text-sm">{section.sectionName}</span>
                    <Money value={section.total} className="text-sm font-semibold" />
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <ReceiptPreviewDialog
        receiptId={preview?.id ?? null}
        receiptNumber={preview?.receiptNumber}
        open={preview !== null}
        onOpenChange={(open) => !open && setPreview(null)}
      />
    </>
  )
}
