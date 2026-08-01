/**
 * DonationBox - Temple Donation Receipt Management
 * Copyright (c) 2026 Ayam Heniber Meitei
 * Developed by Ayam Heniber Meitei <ayamheniber0@gmail.com>
 */

import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PAYMENT_MODES, PAYMENT_MODE_LABELS, type PaymentMode } from '@/types/domain'
import { useAppStore } from '@/store/app-store'

export interface ReceiptFilterValues {
  search: string
  fromDate: string
  toDate: string
  paymentMode: PaymentMode | 'ALL'
  sectionId: string
}

export const EMPTY_FILTERS: ReceiptFilterValues = {
  search: '',
  fromDate: '',
  toDate: '',
  paymentMode: 'ALL',
  sectionId: 'ALL',
}

export function hasActiveFilters(filters: ReceiptFilterValues): boolean {
  return (
    filters.search.trim() !== '' ||
    filters.fromDate !== '' ||
    filters.toDate !== '' ||
    filters.paymentMode !== 'ALL' ||
    filters.sectionId !== 'ALL'
  )
}

interface ReceiptFiltersProps {
  value: ReceiptFilterValues
  onChange: (next: ReceiptFilterValues) => void
}

export function ReceiptFilters({ value, onChange }: ReceiptFiltersProps) {
  const sections = useAppStore((state) => state.sections)
  const patch = (partial: Partial<ReceiptFilterValues>) => onChange({ ...value, ...partial })

  return (
    <div className="grid gap-4 border-b border-border p-4 md:grid-cols-2 xl:grid-cols-5">
      <div className="space-y-1.5 xl:col-span-2">
        <Label htmlFor="receipt-search">Search</Label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            id="receipt-search"
            className="pl-9"
            placeholder="Receipt number or donor name"
            value={value.search}
            onChange={(event) => patch({ search: event.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 xl:col-span-2">
        <div className="space-y-1.5">
          <Label htmlFor="receipt-from">From</Label>
          <Input
            id="receipt-from"
            type="date"
            value={value.fromDate}
            max={value.toDate || undefined}
            onChange={(event) => patch({ fromDate: event.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="receipt-to">To</Label>
          <Input
            id="receipt-to"
            type="date"
            value={value.toDate}
            min={value.fromDate || undefined}
            onChange={(event) => patch({ toDate: event.target.value })}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Payment Mode</Label>
        <Select
          value={value.paymentMode}
          onValueChange={(next) => patch({ paymentMode: next as ReceiptFilterValues['paymentMode'] })}
        >
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

      <div className="flex items-end gap-2">
        <div className="flex-1 space-y-1.5">
          <Label>Section</Label>
          <Select value={value.sectionId} onValueChange={(next) => patch({ sectionId: next })}>
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

        {hasActiveFilters(value) ? (
          <Button variant="ghost" size="icon" onClick={() => onChange(EMPTY_FILTERS)} aria-label="Clear filters">
            <X />
          </Button>
        ) : null}
      </div>
    </div>
  )
}
