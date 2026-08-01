/**
 * DonationBox - Temple Donation Receipt Management
 * Copyright (c) 2026 Ayam Heniber Meitei
 * Developed by Ayam Heniber Meitei <ayamheniber0@gmail.com>
 */

import { useMemo, useState } from 'react'
import { FileSpreadsheet, FileText, Printer, RefreshCw, Table2 } from 'lucide-react'
import { PageHeader } from '@/components/common/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { EmptyState, ErrorState, TableSkeleton } from '@/components/common/states'
import { Money } from '@/components/common/money'
import { ReportSummary } from '@/features/reports/components/report-summary'
import { ReportTable } from '@/features/reports/components/report-table'
import { PAYMENT_MODES, PAYMENT_MODE_LABELS, type PaymentMode, type ReportQuery } from '@/types/domain'
import { api } from '@/lib/api'
import { notify } from '@/lib/notify'
import { useAsync } from '@/hooks/use-async'
import { useAppStore } from '@/store/app-store'
import { endOfMonthKey, formatDateKey, startOfMonthKey, toDateKey } from '@/utils/date'
import { getFinancialYear } from '@/utils/financial-year'

type ExportKind = 'pdf' | 'excel' | 'csv' | 'print'

interface RangePreset {
  label: string
  range: () => { fromDate: string; toDate: string }
}

const PRESETS: RangePreset[] = [
  { label: 'Today', range: () => ({ fromDate: toDateKey(), toDate: toDateKey() }) },
  { label: 'This Month', range: () => ({ fromDate: startOfMonthKey(), toDate: endOfMonthKey() }) },
  {
    label: 'This Financial Year',
    range: () => {
      const fy = getFinancialYear()
      return { fromDate: fy.startDateKey, toDate: toDateKey() }
    },
  },
]

export function ReportsPage() {
  const sections = useAppStore((state) => state.sections)

  const [fromDate, setFromDate] = useState(() => startOfMonthKey())
  const [toDate, setToDate] = useState(() => toDateKey())
  const [paymentMode, setPaymentMode] = useState<PaymentMode | 'ALL'>('ALL')
  const [sectionId, setSectionId] = useState('ALL')
  const [exporting, setExporting] = useState<ExportKind | null>(null)

  const rangeValid = fromDate !== '' && toDate !== '' && fromDate <= toDate

  const query: ReportQuery = useMemo(
    () => ({
      fromDate,
      toDate,
      paymentMode: paymentMode === 'ALL' ? null : paymentMode,
      sectionId: sectionId === 'ALL' ? null : Number(sectionId),
    }),
    [fromDate, toDate, paymentMode, sectionId],
  )

  const report = useAsync(
    async () => (rangeValid ? api.reports.donation(query) : null),
    [query, rangeValid],
  )

  const applyPreset = (preset: RangePreset) => {
    const range = preset.range()
    setFromDate(range.fromDate)
    setToDate(range.toDate)
  }

  const runExport = async (kind: ExportKind) => {
    if (!rangeValid) return
    setExporting(kind)

    try {
      if (kind === 'print') {
        const result = await api.documents.printReport(query)
        if (result.printed) notify.success('Report sent to printer')
        else if (result.reason) notify.warning('Not printed', result.reason)
        return
      }

      const save =
        kind === 'pdf'
          ? api.documents.saveReportPdf
          : kind === 'excel'
            ? api.documents.saveReportExcel
            : api.documents.saveReportCsv

      const result = await save(query)
      if (result.saved) notify.success('Report exported', result.filePath)
    } catch (error) {
      notify.error(error, 'The export could not be completed.')
    } finally {
      setExporting(null)
    }
  }

  const data = report.data
  const hasRows = Boolean(data && data.rows.length > 0)

  return (
    <>
      <PageHeader
        title="Donation Report"
        description="Period-wise collection with payment-mode totals."
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => void runExport('pdf')}
              loading={exporting === 'pdf'}
              disabled={!hasRows || exporting !== null}
            >
              <FileText aria-hidden />
              PDF
            </Button>
            <Button
              variant="outline"
              onClick={() => void runExport('excel')}
              loading={exporting === 'excel'}
              disabled={!hasRows || exporting !== null}
            >
              <FileSpreadsheet aria-hidden />
              Excel
            </Button>
            <Button
              variant="outline"
              onClick={() => void runExport('csv')}
              loading={exporting === 'csv'}
              disabled={!hasRows || exporting !== null}
            >
              <Table2 aria-hidden />
              CSV
            </Button>
            <Button
              onClick={() => void runExport('print')}
              loading={exporting === 'print'}
              disabled={!hasRows || exporting !== null}
            >
              <Printer aria-hidden />
              Print
            </Button>
          </>
        }
      />

      <Card>
        <CardContent className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="space-y-1.5">
            <Label htmlFor="report-from" required>
              From Date
            </Label>
            <Input
              id="report-from"
              type="date"
              value={fromDate}
              max={toDate || undefined}
              onChange={(event) => setFromDate(event.target.value)}
              aria-invalid={!rangeValid}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="report-to" required>
              To Date
            </Label>
            <Input
              id="report-to"
              type="date"
              value={toDate}
              min={fromDate || undefined}
              onChange={(event) => setToDate(event.target.value)}
              aria-invalid={!rangeValid}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Payment Mode</Label>
            <Select value={paymentMode} onValueChange={(value) => setPaymentMode(value as PaymentMode | 'ALL')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All modes</SelectItem>
                {PAYMENT_MODES.map((mode) => (
                  <SelectItem key={mode} value={mode}>
                    {PAYMENT_MODE_LABELS[mode]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Section</Label>
            <Select value={sectionId} onValueChange={setSectionId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All sections</SelectItem>
                {sections.map((section) => (
                  <SelectItem key={section.id} value={String(section.id)}>
                    {section.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap items-end gap-2">
            {PRESETS.map((preset) => (
              <Button key={preset.label} variant="secondary" size="sm" onClick={() => applyPreset(preset)}>
                {preset.label}
              </Button>
            ))}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => void report.refresh()}
              aria-label="Refresh report"
            >
              <RefreshCw />
            </Button>
          </div>

          {!rangeValid ? (
            <p className="field-error md:col-span-2 xl:col-span-5">
              The “To” date must be on or after the “From” date.
            </p>
          ) : null}
        </CardContent>
      </Card>

      {data ? <ReportSummary report={data} /> : null}

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>
            {rangeValid ? `${formatDateKey(fromDate)} — ${formatDateKey(toDate)}` : 'Select a valid period'}
          </CardTitle>
          {data ? (
            <span className="text-sm text-muted-foreground">
              {data.rows.length} receipt{data.rows.length === 1 ? '' : 's'}
            </span>
          ) : null}
        </CardHeader>

        <CardContent className="p-0">
          {report.initialising ? (
            <TableSkeleton rows={8} columns={8} />
          ) : report.error ? (
            <ErrorState message={report.error} onRetry={() => void report.refresh()} />
          ) : !data || data.rows.length === 0 ? (
            <EmptyState
              title="No donations in this period"
              description="Adjust the date range or clear the payment-mode and section filters."
            />
          ) : (
            <div className={report.loading ? 'opacity-60 transition-opacity' : undefined}>
              <ReportTable report={data} />
            </div>
          )}
        </CardContent>
      </Card>

      {data && data.sectionTotals.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Section-wise Summary</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.sectionTotals.map((section) => (
              <div
                key={section.sectionId}
                className="flex items-center justify-between gap-3 rounded-md border border-border px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{section.sectionName}</p>
                  <p className="text-xs text-muted-foreground">{section.count} entries</p>
                </div>
                <Money value={section.total} className="font-semibold" />
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </>
  )
}
