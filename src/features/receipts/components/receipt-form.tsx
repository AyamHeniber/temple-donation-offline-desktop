/**
 * DonationBox - Temple Donation Receipt Management
 * Copyright (c) 2026 Ayam Heniber Meitei
 * Developed by Ayam Heniber Meitei <ayamheniber0@gmail.com>
 */

import { useEffect, useMemo } from 'react'
import { FormProvider, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Info, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Money } from '@/components/common/money'
import { PAYMENT_MODES, PAYMENT_MODE_LABELS, type Receipt } from '@/types/domain'
import { referenceLabel, requiresReference } from '@/lib/schemas'
import { amountToWords } from '@/utils/amount-in-words'
import { toDateKey } from '@/utils/date'
import {
  blankReceiptForm,
  formTotal,
  receiptFormSchema,
  receiptToForm,
  toReceiptInput,
  type ReceiptFormValues,
} from '../receipt-form-schema'
import { DonationItemsField } from './donation-items-field'
import type { ReceiptInput } from '@/types/domain'

interface ReceiptFormProps {
  receipt?: Receipt
  nextNumber?: string
  submitting: boolean
  onSubmit: (input: ReceiptInput) => Promise<void>
  onCancel: () => void
}

export function ReceiptForm({ receipt, nextNumber, submitting, onSubmit, onCancel }: ReceiptFormProps) {
  const form = useForm<ReceiptFormValues>({
    resolver: zodResolver(receiptFormSchema),
    defaultValues: receipt ? receiptToForm(receipt) : blankReceiptForm(),
    mode: 'onBlur',
  })

  useEffect(() => {
    if (receipt) form.reset(receiptToForm(receipt))
  }, [receipt, form])

  const values = useWatch({ control: form.control })
  const paymentMode = (values.paymentMode ?? 'CASH') as ReceiptFormValues['paymentMode']
  const items = (values.items ?? []) as ReceiptFormValues['items']

  const total = formTotal(items)
  const totalInWords = useMemo(() => amountToWords(total), [total])
  const referenceRequired = requiresReference(paymentMode)

  const handleSubmit = form.handleSubmit(async (formValues) => {
    await onSubmit(toReceiptInput(formValues, receipt?.receiptDate))
  })

  const errors = form.formState.errors

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Donor Information</CardTitle>
            <div className="text-right text-sm">
              <span className="text-muted-foreground">Receipt No. </span>
              <span className="font-semibold tabular">
                {receipt?.receiptNumber ?? nextNumber ?? '—'}
              </span>
            </div>
          </CardHeader>

          <CardContent className="grid gap-5 md:grid-cols-2">
            <div className="space-y-1.5 md:col-span-2 lg:col-span-1">
              <Label htmlFor="donorName" required>
                Donor Name
              </Label>
              <Input
                id="donorName"
                autoFocus
                placeholder="Full name of the donor"
                {...form.register('donorName')}
                aria-invalid={Boolean(errors.donorName)}
              />
              {errors.donorName ? <p className="field-error">{errors.donorName.message}</p> : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="donorPhone">Phone</Label>
              <Input id="donorPhone" placeholder="Optional" {...form.register('donorPhone')} />
              {errors.donorPhone ? <p className="field-error">{errors.donorPhone.message}</p> : null}
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="donorAddress">Donor Address</Label>
              <Textarea
                id="donorAddress"
                rows={2}
                placeholder="Street, city, state, PIN"
                {...form.register('donorAddress')}
              />
              {errors.donorAddress ? <p className="field-error">{errors.donorAddress.message}</p> : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="receiptDateKey" required>
                Receipt Date
              </Label>
              <Input
                id="receiptDateKey"
                type="date"
                max={toDateKey()}
                {...form.register('receiptDateKey')}
                aria-invalid={Boolean(errors.receiptDateKey)}
              />
              {errors.receiptDateKey ? (
                <p className="field-error">{errors.receiptDateKey.message}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Time is captured automatically in Indian Standard Time.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Donation Details</CardTitle>
          </CardHeader>
          <CardContent>
            <DonationItemsField />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment</CardTitle>
          </CardHeader>

          <CardContent className="grid gap-5 md:grid-cols-3">
            <div className="space-y-1.5">
              <Label required>Payment Mode</Label>
              <Select
                value={paymentMode}
                onValueChange={(value) =>
                  form.setValue('paymentMode', value as ReceiptFormValues['paymentMode'], {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_MODES.map((mode) => (
                    <SelectItem key={mode} value={mode}>
                      {PAYMENT_MODE_LABELS[mode]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="referenceNo" required={referenceRequired}>
                {referenceLabel(paymentMode)}
              </Label>
              <Input
                id="referenceNo"
                placeholder={referenceRequired ? 'Required for this payment mode' : 'Optional'}
                {...form.register('referenceNo')}
                aria-invalid={Boolean(errors.referenceNo)}
              />
              {errors.referenceNo ? <p className="field-error">{errors.referenceNo.message}</p> : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">Note</Label>
              <Input id="notes" placeholder="Internal note (printed small)" {...form.register('notes')} />
              {errors.notes ? <p className="field-error">{errors.notes.message}</p> : null}
            </div>

            <div className="rounded-md border border-border bg-muted/40 p-4 md:col-span-3">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <span className="text-sm text-muted-foreground">Total Donation Amount</span>
                <Money value={total} className="text-2xl font-bold text-primary" />
              </div>
              <p className="mt-2 flex items-start gap-2 text-sm">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                <span className="font-medium">{totalInWords}</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting}>
            <Save aria-hidden />
            {receipt ? 'Save Changes' : 'Save & Generate Receipt'}
          </Button>
        </div>
      </form>
    </FormProvider>
  )
}
