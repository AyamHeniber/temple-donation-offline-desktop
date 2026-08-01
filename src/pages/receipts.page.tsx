/**
 * DonationBox - Temple Donation Receipt Management
 * Copyright (c) 2026 Ayam Heniber Meitei
 * Developed by Ayam Heniber Meitei <ayamheniber0@gmail.com>
 */

import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FilePlus2, Receipt as ReceiptIcon, SearchX } from 'lucide-react'
import { PageHeader } from '@/components/common/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState, ErrorState, TableSkeleton } from '@/components/common/states'
import { Pagination } from '@/components/common/pagination'
import {
  EMPTY_FILTERS,
  hasActiveFilters,
  ReceiptFilters,
  type ReceiptFilterValues,
} from '@/features/receipts/components/receipt-filters'
import { ReceiptsTable } from '@/features/receipts/components/receipts-table'
import { ReceiptPreviewDialog } from '@/features/receipts/components/receipt-preview-dialog'
import { useReceiptActions } from '@/features/receipts/use-receipt-actions'
import type { ReceiptListQuery, ReceiptSortField, ReceiptSummary } from '@/types/domain'
import { api } from '@/lib/api'
import { useAsync } from '@/hooks/use-async'
import { useDataChanged } from '@/hooks/use-data-changed'
import { useDebouncedValue } from '@/hooks/use-debounced-value'

export function ReceiptsPage() {
  const navigate = useNavigate()

  const [filters, setFilters] = useState<ReceiptFilterValues>(EMPTY_FILTERS)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [sortBy, setSortBy] = useState<ReceiptSortField>('receiptDate')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [preview, setPreview] = useState<ReceiptSummary | null>(null)

  const search = useDebouncedValue(filters.search, 250)

  const query: ReceiptListQuery = useMemo(
    () => ({
      search: search.trim() || undefined,
      fromDate: filters.fromDate || null,
      toDate: filters.toDate || null,
      paymentMode: filters.paymentMode === 'ALL' ? null : filters.paymentMode,
      sectionId: filters.sectionId === 'ALL' ? null : Number(filters.sectionId),
      page,
      pageSize,
      sortBy,
      sortDir,
    }),
    [search, filters.fromDate, filters.toDate, filters.paymentMode, filters.sectionId, page, pageSize, sortBy, sortDir],
  )

  const receipts = useAsync(() => api.receipts.list(query), [query])
  const actions = useReceiptActions(() => void receipts.refresh())
  useDataChanged('receipts', () => void receipts.refresh())

  useEffect(() => {
    setPage(1)
  }, [search, filters.fromDate, filters.toDate, filters.paymentMode, filters.sectionId, pageSize])

  const toggleSort = (field: ReceiptSortField) => {
    if (field === sortBy) {
      setSortDir((current) => (current === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(field)
      setSortDir(field === 'donorName' || field === 'receiptNumber' ? 'asc' : 'desc')
    }
    setPage(1)
  }

  const data = receipts.data
  const filtered = hasActiveFilters(filters)

  return (
    <>
      <PageHeader
        title="Receipts"
        description="Search, reprint and correct issued donation receipts."
        actions={
          <Button onClick={() => navigate('/receipts/new')}>
            <FilePlus2 aria-hidden />
            New Receipt
          </Button>
        }
      />

      <Card>
        <ReceiptFilters value={filters} onChange={setFilters} />

        <CardContent className="p-0">
          {receipts.initialising ? (
            <TableSkeleton rows={pageSize > 10 ? 10 : pageSize} columns={6} />
          ) : receipts.error ? (
            <ErrorState message={receipts.error} onRetry={() => void receipts.refresh()} />
          ) : !data || data.rows.length === 0 ? (
            <EmptyState
              icon={filtered ? SearchX : ReceiptIcon}
              title={filtered ? 'No receipts match these filters' : 'No receipts yet'}
              description={
                filtered
                  ? 'Try widening the date range or clearing the search term.'
                  : 'Create your first donation receipt to get started.'
              }
              action={
                filtered ? (
                  <Button variant="outline" onClick={() => setFilters(EMPTY_FILTERS)}>
                    Clear filters
                  </Button>
                ) : (
                  <Button onClick={() => navigate('/receipts/new')}>
                    <FilePlus2 aria-hidden />
                    New Receipt
                  </Button>
                )
              }
            />
          ) : (
            <>
              <div className={receipts.loading ? 'opacity-60 transition-opacity' : undefined}>
                <ReceiptsTable
                  rows={data.rows}
                  sortBy={sortBy}
                  sortDir={sortDir}
                  onSort={toggleSort}
                  onView={setPreview}
                  onPrint={(row) => void actions.print(row.id)}
                  onDownload={(row) => void actions.downloadPdf(row.id)}
                  onDelete={(row) => actions.remove(row.id, row.receiptNumber)}
                />
              </div>

              <Pagination
                page={data.page}
                pageCount={data.pageCount}
                pageSize={data.pageSize}
                total={data.total}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
              />
            </>
          )}
        </CardContent>
      </Card>

      <ReceiptPreviewDialog
        receiptId={preview?.id ?? null}
        receiptNumber={preview?.receiptNumber}
        open={preview !== null}
        onOpenChange={(open) => !open && setPreview(null)}
      />
    </>
  )
}
