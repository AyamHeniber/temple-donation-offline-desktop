/**
 * DonationBox - Temple Donation Receipt Management
 * Copyright (c) 2026 Ayam Heniber Meitei
 * Developed by Ayam Heniber Meitei <ayamheniber0@gmail.com>
 */

import { ArrowDown, ArrowUp, ArrowUpDown, Download, Eye, MoreHorizontal, Pencil, Printer, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Money, PaymentModeBadge } from '@/components/common/money'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import type { ReceiptSortField, ReceiptSummary, SortDirection } from '@/types/domain'
import { formatDate, formatTime } from '@/utils/date'
import { cn } from '@/lib/utils'

interface ReceiptsTableProps {
  rows: ReceiptSummary[]
  sortBy: ReceiptSortField
  sortDir: SortDirection
  onSort: (field: ReceiptSortField) => void
  onView: (row: ReceiptSummary) => void
  onPrint: (row: ReceiptSummary) => void
  onDownload: (row: ReceiptSummary) => void
  onDelete: (row: ReceiptSummary) => Promise<void>
}

interface SortableHeadProps {
  field: ReceiptSortField
  label: string
  sortBy: ReceiptSortField
  sortDir: SortDirection
  onSort: (field: ReceiptSortField) => void
  className?: string
}

function SortableHead({ field, label, sortBy, sortDir, onSort, className }: SortableHeadProps) {
  const active = sortBy === field
  const Icon = !active ? ArrowUpDown : sortDir === 'asc' ? ArrowUp : ArrowDown

  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => onSort(field)}
        className={cn(
          'inline-flex items-center gap-1.5 rounded transition-colors hover:text-foreground',
          active && 'text-foreground',
        )}
        aria-label={`Sort by ${label}`}
      >
        {label}
        <Icon className={cn('h-3.5 w-3.5', !active && 'opacity-40')} aria-hidden />
      </button>
    </TableHead>
  )
}

export function ReceiptsTable({
  rows,
  sortBy,
  sortDir,
  onSort,
  onView,
  onPrint,
  onDownload,
  onDelete,
}: ReceiptsTableProps) {
  const navigate = useNavigate()

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <SortableHead field="receiptNumber" label="Receipt No." sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
          <SortableHead field="receiptDate" label="Date" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
          <SortableHead field="donorName" label="Donor Name" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
          <TableHead>Payment Mode</TableHead>
          <SortableHead
            field="totalAmount"
            label="Total Amount"
            sortBy={sortBy}
            sortDir={sortDir}
            onSort={onSort}
            className="text-right [&>button]:flex-row-reverse"
          />
          <TableHead className="w-32 text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id} className="cursor-default">
            <TableCell>
              <button
                type="button"
                onClick={() => onView(row)}
                className="font-medium text-primary tabular hover:underline"
              >
                {row.receiptNumber}
              </button>
            </TableCell>

            <TableCell className="whitespace-nowrap">
              <div className="tabular">{formatDate(row.receiptDate)}</div>
              <div className="text-xs text-muted-foreground tabular">{formatTime(row.receiptDate)}</div>
            </TableCell>

            <TableCell>
              <div className="max-w-[24rem] truncate font-medium">{row.donorName}</div>
              {row.donorAddress ? (
                <div className="max-w-[24rem] truncate text-xs text-muted-foreground">{row.donorAddress}</div>
              ) : null}
            </TableCell>

            <TableCell>
              <PaymentModeBadge mode={row.paymentMode} />
            </TableCell>

            <TableCell className="text-right font-semibold">
              <Money value={row.totalAmount} />
              <div className="text-xs font-normal text-muted-foreground">
                {row.itemCount} {row.itemCount === 1 ? 'entry' : 'entries'}
              </div>
            </TableCell>

            <TableCell className="text-right">
              <div className="flex items-center justify-end gap-1">
                <Button variant="ghost" size="icon-sm" onClick={() => onView(row)} aria-label="View receipt">
                  <Eye />
                </Button>
                <Button variant="ghost" size="icon-sm" onClick={() => onPrint(row)} aria-label="Print receipt">
                  <Printer />
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm" aria-label="More actions">
                      <MoreHorizontal />
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => navigate(`/receipts/${row.id}/edit`)}>
                      <Pencil />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => onDownload(row)}>
                      <Download />
                      Download PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => onPrint(row)}>
                      <Printer />
                      Print again
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <ConfirmDialog
                      destructive
                      title="Delete this receipt?"
                      description={
                        <>
                          Receipt <strong>{row.receiptNumber}</strong> for{' '}
                          <strong>{row.donorName}</strong> will be permanently removed. The receipt
                          number will not be reused.
                        </>
                      }
                      confirmLabel="Delete receipt"
                      onConfirm={() => onDelete(row)}
                      trigger={
                        <DropdownMenuItem destructive onSelect={(event) => event.preventDefault()}>
                          <Trash2 />
                          Delete
                        </DropdownMenuItem>
                      }
                    />
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
