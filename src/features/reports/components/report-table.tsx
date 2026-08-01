/**
 * DonationBox - Temple Donation Receipt Management
 * Copyright (c) 2026 Ayam Heniber Meitei
 * Developed by Ayam Heniber Meitei <ayamheniber0@gmail.com>
 */

import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Money } from '@/components/common/money'
import type { DonationReport } from '@/types/domain'
import { formatDate } from '@/utils/date'

function AmountCell({ value }: { value: number }) {
  return (
    <TableCell className="text-right">
      {value > 0 ? <Money value={value} bare /> : <span className="text-muted-foreground">—</span>}
    </TableCell>
  )
}

export function ReportTable({ report }: { report: DonationReport }) {
  const { totals } = report

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-14 text-center">S.No</TableHead>
          <TableHead>Receipt No.</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Donor Name</TableHead>
          <TableHead>Address</TableHead>
          <TableHead className="text-right">Cash</TableHead>
          <TableHead className="text-right">UPI</TableHead>
          <TableHead className="text-right">NEFT</TableHead>
          <TableHead className="text-right">Cheque</TableHead>
          <TableHead className="text-right">Total</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {report.rows.map((row, index) => (
          <TableRow key={row.id}>
            <TableCell className="text-center text-muted-foreground tabular">{index + 1}</TableCell>
            <TableCell className="font-medium tabular">{row.receiptNumber}</TableCell>
            <TableCell className="whitespace-nowrap tabular">{formatDate(row.receiptDate)}</TableCell>
            <TableCell className="max-w-[16rem] truncate font-medium">{row.donorName}</TableCell>
            <TableCell className="max-w-[18rem] truncate text-muted-foreground">
              {row.donorAddress || '—'}
            </TableCell>
            <AmountCell value={row.cash} />
            <AmountCell value={row.upi} />
            <AmountCell value={row.neft} />
            <AmountCell value={row.cheque} />
            <TableCell className="text-right font-semibold">
              <Money value={row.total} bare />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>

      <TableFooter>
        <TableRow>
          <TableCell colSpan={5} className="text-right">
            Grand Total ({totals.receiptCount} receipts)
          </TableCell>
          <TableCell className="text-right">
            <Money value={totals.cash} bare />
          </TableCell>
          <TableCell className="text-right">
            <Money value={totals.upi} bare />
          </TableCell>
          <TableCell className="text-right">
            <Money value={totals.neft} bare />
          </TableCell>
          <TableCell className="text-right">
            <Money value={totals.cheque} bare />
          </TableCell>
          <TableCell className="text-right text-primary">
            <Money value={totals.overall} bare />
          </TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  )
}
