/**
 * DonationBox - Temple Donation Receipt Management
 * Copyright (c) 2026 Ayam Heniber Meitei
 * Developed by Ayam Heniber Meitei <ayamheniber0@gmail.com>
 */

import { useFieldArray, useFormContext, useWatch } from 'react-hook-form'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Money } from '@/components/common/money'
import { useAppStore } from '@/store/app-store'
import { parseAmount } from '@/utils/currency'
import { emptyItem, formTotal, type ReceiptFormValues } from '../receipt-form-schema'

export function DonationItemsField() {
  const form = useFormContext<ReceiptFormValues>()
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'items' })
  const sections = useAppStore((state) => state.sections)

  const items = useWatch({ control: form.control, name: 'items' }) ?? []
  const total = formTotal(items as ReceiptFormValues['items'])

  const rowsError = form.formState.errors.items?.message

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-md border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
              <th className="w-12 px-3 py-2.5 text-left font-semibold">#</th>
              <th className="px-3 py-2.5 text-left font-semibold">Section</th>
              <th className="w-[34%] px-3 py-2.5 text-left font-semibold">Remarks</th>
              <th className="w-44 px-3 py-2.5 text-right font-semibold">Amount</th>
              <th className="w-14 px-3 py-2.5" />
            </tr>
          </thead>

          <tbody>
            {fields.map((field, index) => {
              const itemErrors = form.formState.errors.items?.[index]
              const amount = parseAmount(items[index]?.amount ?? '')

              return (
                <tr key={field.id} className="border-b border-border/70 last:border-b-0 align-top">
                  <td className="px-3 py-2 text-muted-foreground tabular">{index + 1}</td>

                  <td className="px-3 py-2">
                    <Select
                      value={form.watch(`items.${index}.sectionId`)}
                      onValueChange={(value) =>
                        form.setValue(`items.${index}.sectionId`, value, {
                          shouldValidate: true,
                          shouldDirty: true,
                        })
                      }
                    >
                      <SelectTrigger aria-invalid={Boolean(itemErrors?.sectionId)}>
                        <SelectValue placeholder="Select section" />
                      </SelectTrigger>
                      <SelectContent>
                        {sections.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-muted-foreground">
                            No active sections. Add one under Sections.
                          </div>
                        ) : (
                          sections.map((section) => (
                            <SelectItem key={section.id} value={String(section.id)}>
                              {section.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {itemErrors?.sectionId ? (
                      <p className="field-error mt-1">{itemErrors.sectionId.message}</p>
                    ) : null}
                  </td>

                  <td className="px-3 py-2">
                    <Input
                      placeholder="Optional note for this entry"
                      {...form.register(`items.${index}.remarks`)}
                      aria-invalid={Boolean(itemErrors?.remarks)}
                    />
                    {itemErrors?.remarks ? (
                      <p className="field-error mt-1">{itemErrors.remarks.message}</p>
                    ) : null}
                  </td>

                  <td className="px-3 py-2">
                    <Input
                      inputMode="decimal"
                      placeholder="0.00"
                      className="text-right tabular"
                      {...form.register(`items.${index}.amount`)}
                      aria-invalid={Boolean(itemErrors?.amount)}
                    />
                    {itemErrors?.amount ? (
                      <p className="field-error mt-1 text-right">{itemErrors.amount.message}</p>
                    ) : amount > 0 ? (
                      <p className="mt-1 text-right text-xs text-muted-foreground">
                        <Money value={amount} />
                      </p>
                    ) : null}
                  </td>

                  <td className="px-3 py-2 text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      disabled={fields.length === 1}
                      onClick={() => remove(index)}
                      aria-label={`Delete row ${index + 1}`}
                    >
                      <Trash2 className="text-destructive" />
                    </Button>
                  </td>
                </tr>
              )
            })}
          </tbody>

          <tfoot>
            <tr className="bg-muted/60">
              <td colSpan={3} className="px-3 py-3 text-right text-sm font-semibold">
                Total Donation Amount
              </td>
              <td className="px-3 py-3 text-right text-base font-bold text-primary">
                <Money value={total} />
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      {rowsError ? <p className="field-error">{rowsError}</p> : null}

      <Button type="button" variant="outline" size="sm" onClick={() => append(emptyItem())}>
        <Plus aria-hidden />
        Add Row
      </Button>
    </div>
  )
}
